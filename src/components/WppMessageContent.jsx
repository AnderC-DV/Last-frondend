import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getMediaUrl } from '../services/api';

// Hook personalizado para detectar cuando un elemento entra en viewport
const useIntersectionObserver = (ref, messageType, setLoadPriority) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Configuración optimizada según tipo de media
    const getObserverConfig = (type) => {
      switch (type) {
        case 'image':
          return {
            threshold: 0.05,
            rootMargin: '200px', // Precargar temprano
            nearThreshold: 0.02,
            nearMargin: '300px'
          };
        case 'video':
        case 'audio':
          return {
            threshold: 0.1,
            rootMargin: '150px', // Moderado
            nearThreshold: 0.05,
            nearMargin: '250px'
          };
        case 'document':
        case 'sticker':
          return {
            threshold: 0.2,
            rootMargin: '100px', // Solo cuando es muy visible
            nearThreshold: 0.1,
            nearMargin: '150px'
          };
        default:
          return {
            threshold: 0.1,
            rootMargin: '100px',
            nearThreshold: 0.05,
            nearMargin: '200px'
          };
      }
    };

    const config = getObserverConfig(messageType);

    // Observer principal para carga inmediata
    const mainObserver = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);

        // Marcar como visible al menos una vez para evitar recargas
        if (isVisible && !hasBeenVisible) {
          setHasBeenVisible(true);
          setLoadPriority('high');
          console.debug(`[LazyLoading] ${messageType} visible (high priority):`, element.id || 'unknown');
        }
      },
      { threshold: config.threshold, rootMargin: config.rootMargin }
    );

    // Observer secundario para precarga (más amplio)
    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        const isNear = entry.isIntersecting;
        setIsNearViewport(isNear);

        if (isNear && !hasBeenVisible) {
          setLoadPriority('medium');
          console.debug(`[LazyLoading] ${messageType} near viewport (medium priority):`, element.id || 'unknown');
        }
      },
      { threshold: config.nearThreshold, rootMargin: config.nearMargin }
    );

    mainObserver.observe(element);
    preloadObserver.observe(element);

    return () => {
      mainObserver.disconnect();
      preloadObserver.disconnect();
    };
  }, [ref, messageType, hasBeenVisible]);

  return { isIntersecting, hasBeenVisible, isNearViewport };
};

const WppMessageContent = ({
  msg,
  conversationId,
  onDocumentClick
}) => {
  const [mediaUrl, setMediaUrl] = useState(msg.localMediaUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadAttempted, setLoadAttempted] = useState(false);
  const [loadPriority, setLoadPriority] = useState('low'); // 'low', 'medium', 'high'
  const messageRef = useRef(null);
  const loadTimeoutRef = useRef(null);

  const handleRetry = () => {
    setHasError(false);
    setLoadAttempted(false);
  };

  // Normalizar propiedades del mensaje para manejar datos de API y WebSocket
  const messageType = msg.type || msg.message_type;
  const mediaId = msg.message_id || (msg.media ? msg.media.id : null);
  const messageBody = msg.body || (msg.media ? msg.media.caption : null);

  // Usar intersection observer para carga lazy con configuración optimizada
  const { isIntersecting, hasBeenVisible, isNearViewport } = useIntersectionObserver(messageRef, messageType, setLoadPriority);

  // Función de carga con debounce
  const debouncedLoadMedia = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    const getDelay = (priority) => {
      switch (priority) {
        case 'high': return 0;
        case 'medium': return 100;
        case 'low': return 300;
        default: return 200;
      }
    };

    const delay = getDelay(loadPriority);

    loadTimeoutRef.current = setTimeout(async () => {
      const isMedia = ['image', 'video', 'audio', 'document', 'sticker'].includes(messageType);
      const shouldLoad = (isIntersecting || hasBeenVisible || isNearViewport) && isMedia && mediaId;

      if (mediaUrl || !shouldLoad || hasError || loadAttempted) {
        return;
      }

      console.debug(`[LazyLoading] Iniciando carga de ${messageType} (${loadPriority} priority):`, mediaId);
      setIsLoading(true);

      try {
        const response = await getMediaUrl(conversationId, mediaId);

        if (response && response.url) {
          setMediaUrl(response.url);
        } else {
          console.warn(`[LazyLoading] Could not get media URL for ${messageType}:`, response?.message);
          setHasError(true);
        }
      } catch (error) {
        console.warn(`[LazyLoading] Error loading ${messageType}:`, error.message);
        setHasError(true);
      } finally {
        setIsLoading(false);
        setLoadAttempted(true);
      }
    }, delay);
  }, [isIntersecting, hasBeenVisible, isNearViewport, messageType, mediaId, conversationId, mediaUrl, hasError, loadAttempted, loadPriority, mediaUrl]);

  useEffect(() => {
    debouncedLoadMedia();

    // Cleanup
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [debouncedLoadMedia]);

  // Contenedor con referencia para intersection observer
  const renderMediaContent = () => {
    const isPending = msg.status === 'pending';

    const MediaWrapper = ({ children, className = '' }) => (
      <div className={`relative ${className}`}>
        <div className={isPending ? 'opacity-60' : ''}>
          {children}
        </div>
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    );

    if (hasError && !isPending) {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <p className="text-red-500 italic">Error al cargar.</p>
          <button onClick={handleRetry} className="text-blue-500 underline">Reintentar</button>
        </div>
      );
    }

    if (isLoading && !mediaUrl) {
      return (
        <div className="flex items-center space-x-2 p-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
          <p className="text-gray-500 italic text-sm">Cargando...</p>
        </div>
      );
    }

    switch (messageType) {
      case 'image':
        return mediaUrl ? (
          <MediaWrapper>
            <img src={mediaUrl} alt="Imagen" className="max-w-xs rounded-lg" onError={() => !isPending && setHasError(true)} />
            {messageBody && <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap break-words">{messageBody}</p>}
          </MediaWrapper>
        ) : <p className="text-gray-500 italic">Imagen no disponible</p>;
      case 'video':
        return mediaUrl ? (
          <MediaWrapper>
            <video src={mediaUrl} controls className="max-w-xs rounded-lg" onError={() => !isPending && setHasError(true)} />
            {messageBody && <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap break-words">{messageBody}</p>}
          </MediaWrapper>
        ) : <p className="text-gray-500 italic">Video no disponible</p>;
      case 'audio':
        return mediaUrl ? <audio src={mediaUrl} controls onError={() => !isPending && setHasError(true)} /> : <p className="text-gray-500 italic">Audio no disponible</p>;
      case 'document':
        return mediaUrl ? (
          <button onClick={() => onDocumentClick(mediaUrl)} className="text-blue-500 underline hover:text-blue-700">
            {messageBody || 'Ver Documento'}
          </button>
        ) : <p className="text-gray-500 italic">Documento no disponible</p>;
      case 'sticker':
        return mediaUrl ? <img src={mediaUrl} alt="Sticker" className="w-24 h-24" onError={() => !isPending && setHasError(true)} /> : <p className="text-gray-500 italic">Sticker no disponible</p>;
      case 'text':
        return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{messageBody}</p>;
      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{messageBody || '[Mensaje no soportado]'}</p>;
    }
  };

  return (
    <div ref={messageRef}>
      {renderMediaContent()}
    </div>
  );
};

export default WppMessageContent;

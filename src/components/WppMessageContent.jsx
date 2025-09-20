import React, { useEffect, useRef, useState } from 'react';
import { getMediaUrl } from '../services/api';

// Hook personalizado para detectar cuando un elemento entra en viewport
const useIntersectionObserver = (ref, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

const WppMessageContent = ({
  msg,
  conversationId,
  onDocumentClick
}) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const messageRef = useRef(null);

  // Usar intersection observer para carga lazy
  const isInViewport = useIntersectionObserver(messageRef, {
    threshold: 0.1,
    rootMargin: '100px'
  });

  useEffect(() => {
    const loadMedia = async () => {
      // Solo cargar si está en viewport y es media
      if (!isInViewport || !['image', 'video', 'audio', 'document', 'sticker'].includes(msg.message_type) || !msg.message_id) {
        return;
      }

      // Si ya tenemos la URL o ya intentamos cargar, no hacer nada
      if (mediaUrl || hasError) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await getMediaUrl(conversationId, msg.message_id);

        // El backend ahora devuelve { url: "...", expires_in: 3600 }
        if (response && response.url) {
          setMediaUrl(response.url);
        } else {
          console.warn('Respuesta del backend no contiene URL:', response);
          setHasError(true);
        }
      } catch (error) {
        // Silenciar errores de CORS y conexión para no llenar la consola
        console.warn('Error al cargar media:', error.message);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [isInViewport, msg, conversationId, mediaUrl, hasError]);

  // Mostrar indicador de carga
  if (isLoading && ['image', 'video', 'audio', 'document', 'sticker'].includes(msg.message_type)) {
    return (
      <div ref={messageRef}>
        <p className="text-gray-500 italic">Cargando...</p>
      </div>
    );
  }

  // Contenedor con referencia para intersection observer
  const renderMediaContent = () => {
    switch (msg.message_type) {
      case 'image':
        return mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Imagen"
            className="max-w-xs rounded-lg"
            onError={() => setHasError(true)}
          />
        ) : (
          <p className="text-gray-500 italic">Imagen no disponible</p>
        );
      case 'video':
        return mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            className="max-w-xs rounded-lg"
            onError={() => setHasError(true)}
          />
        ) : (
          <p className="text-gray-500 italic">Video no disponible</p>
        );
      case 'audio':
        return mediaUrl ? (
          <audio
            src={mediaUrl}
            controls
            onError={() => setHasError(true)}
          />
        ) : (
          <p className="text-gray-500 italic">Audio no disponible</p>
        );
      case 'document':
        return mediaUrl ? (
          <button
            onClick={() => onDocumentClick(mediaUrl)}
            className="text-blue-500 underline hover:text-blue-700"
          >
            Ver Documento
          </button>
        ) : (
          <p className="text-gray-500 italic">Documento no disponible</p>
        );
      case 'sticker':
        return mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Sticker"
            className="w-16 h-16"
            onError={() => setHasError(true)}
          />
        ) : (
          <p className="text-gray-500 italic">Sticker no disponible</p>
        );
      default:
        return <p className="text-sm leading-relaxed">{msg.body || '[Mensaje no soportado]'}</p>;
    }
  };

  return (
    <div ref={messageRef}>
      {renderMediaContent()}
    </div>
  );
};

export default WppMessageContent;
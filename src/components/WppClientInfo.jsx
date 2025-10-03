import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { getResultadoGestor, getCompromisos, getObligaciones, getObligationUrlByCedula, calculateCondonation } from '../services/api';

const Tooltip = ({ targetRef, content }) => {
    const tooltipRef = useRef(null);
    const [position, setPosition] = useState({ top: -9999, left: -9999 });

    useLayoutEffect(() => {
        if (targetRef.current && tooltipRef.current) {
            const targetRect = targetRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const space = 10;

            let top = targetRect.bottom + space;
            let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

            // If not enough space below, position above
            if (top + tooltipRect.height > window.innerHeight) {
                top = targetRect.top - tooltipRect.height - space;
            }

            // Clamp horizontal position to be within viewport
            if (left < space) {
                left = space;
            } else if (left + tooltipRect.width > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - space;
            }

            setPosition({ top, left });
        }
    }, [targetRef]);

    return ReactDOM.createPortal(
        <div
            ref={tooltipRef}
            className="fixed p-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-50 w-64"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            {content}
        </div>,
        document.body
    );
};


const WppClientInfo = ({ selectedConversation, userRole, setClientInfo: setParentClientInfo }) => {
  const [clientInfo, setClientInfo] = useState({
    resultadoGestor: null,
    compromisos: [],
    obligaciones: { total_obligaciones: 0, obligaciones: [] },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminfoUrl, setAdminfoUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [selectedObligations, setSelectedObligations] = useState([]);
  const [condonationResult, setCondonationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState('all'); // 'all', 'mi_banco', 'otros'
  const [showTooltip, setShowTooltip] = useState(false);
  const infoIconRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchClientInfo = async () => {
      if (selectedConversation?.client_cedula) {
        setLoading(true);
        setError(null);
        setClientInfo({
          resultadoGestor: null,
          compromisos: [],
          obligaciones: { total_obligaciones: 0, obligaciones: [] },
        });
        setSelectedObligations([]);
        setCondonationResult(null);
        setPortfolioFilter('all');
        try {
          const [resultadoGestorRes, compromisosRes, obligacionesRes] = await Promise.all([
            getResultadoGestor(selectedConversation.client_cedula),
            getCompromisos(selectedConversation.client_cedula),
            getObligaciones(selectedConversation.client_cedula),
          ]);
          const info = {
            resultadoGestor: resultadoGestorRes.resultado_gestor,
            compromisos: compromisosRes.compromisos,
            obligaciones: obligacionesRes,
          };
          setClientInfo(info);
          setParentClientInfo(info);
        } catch (err) {
          setError('Error al cargar la información del cliente.');
          console.error("Error fetching client info:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    const fetchAdminfoUrl = async () => {
      if (selectedConversation?.client_cedula) {
        setIsLoadingUrl(true);
        setAdminfoUrl(null);
        try {
          const response = await getObligationUrlByCedula(selectedConversation.client_cedula);
          if (response?.url) {
            setAdminfoUrl(response.url);
          }
        } catch (error) {
          console.error("Error fetching Adminfo URL:", error);
        } finally {
          setIsLoadingUrl(false);
        }
      } else {
        setAdminfoUrl(null);
      }
    };

    fetchClientInfo();
    fetchAdminfoUrl();
  }, [selectedConversation]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
        setShowTooltip(false);
    };
    if (container) {
        container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
        if (container) {
            container.removeEventListener('scroll', handleScroll);
        }
    };
  }, []);

  const { hasMiBanco, hasOtrosPortafolios } = useMemo(() => {
    const obligaciones = clientInfo.obligaciones?.obligaciones || [];
    return {
      hasMiBanco: obligaciones.some(o => o.sistema_origen?.toLowerCase() === 'mi banco'),
      hasOtrosPortafolios: obligaciones.some(o => o.sistema_origen?.toLowerCase() !== 'mi banco'),
    };
  }, [clientInfo.obligaciones]);

  useEffect(() => {
    if (portfolioFilter === 'all') return;

    const newSelectedObligations = selectedObligations.filter(id => {
      const obligation = clientInfo.obligaciones.obligaciones.find(o => o.obligacion === id);
      if (!obligation) return false;
      if (portfolioFilter === 'mi_banco') {
        return obligation.sistema_origen?.toLowerCase() === 'mi banco';
      }
      if (portfolioFilter === 'otros') {
        return obligation.sistema_origen?.toLowerCase() !== 'mi banco';
      }
      return true;
    });

    if (newSelectedObligations.length !== selectedObligations.length) {
      setSelectedObligations(newSelectedObligations);
    }
  }, [portfolioFilter, selectedObligations, clientInfo.obligaciones]);


  const handleViewInAdminfo = () => {
    if (adminfoUrl) {
      window.open(adminfoUrl, '_blank');
    } else {
      alert('La URL de Adminfo no está disponible para este cliente.');
    }
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCompromisoStyle = (fechaCompromiso) => {
    const today = new Date();
    const compromisoDate = new Date(fechaCompromiso);
    today.setHours(0, 0, 0, 0);
    compromisoDate.setHours(0, 0, 0, 0);

    if (compromisoDate < today) {
      return 'text-red-600';
    }
    if (compromisoDate.getTime() === today.getTime()) {
      return 'text-orange-500';
    }
    return 'text-gray-700';
  };

  const handleObligationSelection = (obligationId) => {
    if (portfolioFilter === 'all' && selectedObligations.length === 0) {
      const obligation = clientInfo.obligaciones.obligaciones.find(o => o.obligacion === obligationId);
      if (obligation) {
        if (obligation.sistema_origen?.toLowerCase() === 'mi banco') {
          setPortfolioFilter('mi_banco');
        } else {
          setPortfolioFilter('otros');
        }
      }
    }

    setSelectedObligations(prev =>
      prev.includes(obligationId)
        ? prev.filter(id => id !== obligationId)
        : [...prev, obligationId]
    );
  };

  const handleCalculateCondonation = async () => {
    if (selectedObligations.length === 0) {
      alert('Por favor, seleccione al menos una obligación.');
      return;
    }
    setIsCalculating(true);
    setCondonationResult(null);
    try {
      const result = await calculateCondonation(selectedObligations);
      setCondonationResult(result);
    } catch (error) {
      console.error("Error calculating condonation:", error);
      alert('Error al calcular la condonación.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFilterClick = (filter) => {
    setPortfolioFilter(prev => prev === filter ? 'all' : filter);
  };

  const isObligationDisabled = (obligation) => {
    if (portfolioFilter === 'mi_banco') {
      return obligation.sistema_origen?.toLowerCase() !== 'mi banco';
    }
    if (portfolioFilter === 'otros') {
      return obligation.sistema_origen?.toLowerCase() === 'mi banco';
    }
    return false;
  };

  return (
    <div className="w-100 bg-white border-l border-gray-200 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">Información del Cliente</h2>
      </div>
      <div ref={scrollContainerRef} className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">Resumen de Obligaciones</h3>
              <p className="text-gray-700">Total de obligaciones: {clientInfo.obligaciones?.total_obligaciones ?? 'No disponible'}</p>
              {clientInfo.obligaciones?.obligaciones?.length > 0 && (
                <ul className="list-disc pl-5 mt-2">
                  {clientInfo.obligaciones.obligaciones.map((obligacion, index) => (
                    <li key={index} className="text-gray-600">
                      <div>Número de Obligación: {obligacion.obligacion}</div>
                      <div>Sistema Origen: <span className="font-medium">{obligacion.sistema_origen || 'N/A'}</span></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {(userRole === 'coordinador' || userRole === 'gestor' || userRole === 'Admin') && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Último Resultado</h3>
                <p className="text-gray-700">{clientInfo.resultadoGestor || 'No disponible'}</p>
              </div>
            )}
            {(userRole === 'gestor' || userRole === 'Admin') && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Compromisos de Pago</h3>
                {clientInfo.compromisos?.length > 0 ? (
                  <ul className="space-y-2">
                    {clientInfo.compromisos.map((compromiso, index) => (
                      <li key={index} className={getCompromisoStyle(compromiso.fecha_compromiso)}>
                        <div>Fecha: {compromiso.fecha_compromiso}</div>
                        <div>Monto: {formatCurrency(compromiso.valor_por_recuperar)}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No hay compromisos pendientes.</p>
                )}
              </div>
            )}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <h3 className="font-semibold text-lg text-gray-800">Políticas de Condonación</h3>
                {(portfolioFilter === 'mi_banco' || portfolioFilter === 'otros') && (
                  <div
                    className="flex items-center ml-2"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <span ref={infoIconRef} className="text-blue-500 cursor-pointer">ℹ️</span>
                  </div>
                )}
              </div>
              {showTooltip && <Tooltip targetRef={infoIconRef} content="Por políticas de la compañía, las obligaciones de Mi banco no pueden calcularse con obligaciones de otros portafolios." />}

              {clientInfo.obligaciones?.obligaciones?.length > 0 ? (
                <>
                  {hasMiBanco && hasOtrosPortafolios && (
                    <div className="flex space-x-2 mb-4">
                      <button onClick={() => handleFilterClick('mi_banco')} className={`px-2 py-1 text-xs rounded ${portfolioFilter === 'mi_banco' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Mi banco</button>
                      <button onClick={() => handleFilterClick('otros')} className={`px-2 py-1 text-xs rounded ${portfolioFilter === 'otros' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Otros portafolios</button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {clientInfo.obligaciones.obligaciones.map(o => (
                      <div key={o.obligacion} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`cb-${o.obligacion}`}
                          checked={selectedObligations.includes(o.obligacion)}
                          onChange={() => handleObligationSelection(o.obligacion)}
                          disabled={isObligationDisabled(o)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-gray-200"
                        />
                        <label htmlFor={`cb-${o.obligacion}`} className={`ml-2 text-sm ${isObligationDisabled(o) ? 'text-gray-400' : 'text-gray-700'}`}>{o.obligacion}</label>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleCalculateCondonation}
                    disabled={isCalculating || selectedObligations.length === 0}
                    className="mt-4 w-full px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCalculating ? 'Calculando...' : 'Calcular Políticas'}
                  </button>
                  {condonationResult && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-md mb-2 text-gray-800">Resultado del Cálculo</h4>
                      <p><strong>Capital Total:</strong> {formatCurrency(condonationResult.calculation_inputs.total_capital)}</p>
                      <p><strong>Días en Mora:</strong> {condonationResult.calculation_inputs.days_in_arrears}</p>
                      <h5 className="font-semibold mt-2">Planes de Pago:</h5>
                      <ul className="list-disc pl-5">
                        {condonationResult.payment_plans.map(plan => (
                          <li key={plan.term}>
                            Plazo {plan.term} meses: Paga {formatCurrency(plan.amount_to_pay)} ({plan.condonation_percent}% condonación)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-700">No hay obligaciones para calcular.</p>
              )}
            </div>
            {(userRole === 'gestor' || userRole === 'Admin') && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Herramientas Internas</h3>
                <button
                  onClick={handleViewInAdminfo}
                  disabled={!adminfoUrl || isLoadingUrl}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingUrl ? 'Cargando...' : '👁️ Ver en Adminfo'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WppClientInfo;
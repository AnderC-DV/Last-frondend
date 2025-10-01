import React, { useState, useEffect } from 'react';
import { getResultadoGestor, getCompromisos, getObligaciones, getObligationUrlByCedula } from '../services/api';

const WppClientInfo = ({ selectedConversation, userRole }) => {
  const [clientInfo, setClientInfo] = useState({
    resultadoGestor: null,
    compromisos: [],
    obligaciones: { total_obligaciones: 0, obligaciones: [] },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminfoUrl, setAdminfoUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  useEffect(() => {
    const fetchClientInfo = async () => {
      if (selectedConversation?.client_cedula) {
        setLoading(true);
        setError(null);
        try {
          const [resultadoGestorRes, compromisosRes, obligacionesRes] = await Promise.all([
            getResultadoGestor(selectedConversation.client_cedula),
            getCompromisos(selectedConversation.client_cedula),
            getObligaciones(selectedConversation.client_cedula),
          ]);
          setClientInfo({
            resultadoGestor: resultadoGestorRes.resultado_gestor,
            compromisos: compromisosRes.compromisos,
            obligaciones: obligacionesRes,
          });
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

  const handleViewInAdminfo = () => {
    if (adminfoUrl) {
      window.open(adminfoUrl, '_blank');
    } else {
      alert('La URL de Adminfo no está disponible para este cliente.');
    }
  };

  const formatCurrency = (value) => {
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

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">Información del Cliente</h2>
      </div>
      <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
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
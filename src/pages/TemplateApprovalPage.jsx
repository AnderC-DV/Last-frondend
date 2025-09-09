import React, { useState, useEffect, useCallback } from 'react';
import { getTemplates, getPendingTemplates } from '../services/api';
import TemplateList from '../components/TemplateList';

const TemplateApprovalPage = () => {
  const [allTemplates, setAllTemplates] = useState([]);
  const [pendingTemplates, setPendingTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      // Obtenemos todas las plantillas y las pendientes en paralelo
      const [all, pending] = await Promise.all([
        getTemplates(),
        getPendingTemplates()
      ]);
      setAllTemplates(all);
      setPendingTemplates(pending);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Error al cargar las plantillas.');
      console.error('Error al cargar las plantillas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getFilteredTemplates = () => {
    switch (statusFilter) {
      case 'ALL':
        return allTemplates;
      case 'PENDING':
        return pendingTemplates;
      case 'APPROVED':
        return allTemplates.filter(t => t.status === 'APPROVED');
      case 'REJECTED':
        return allTemplates.filter(t => t.status.includes('REJECTED'));
      default:
        return allTemplates;
    }
  };

  const getButtonClasses = (filterName) => {
    const baseClasses = "flex-1 flex items-center justify-center py-2 px-5 rounded-lg text-sm font-medium transition-colors duration-200";
    if (statusFilter === filterName) {
      return `${baseClasses} bg-white text-gray-800 shadow-sm`;
    }
    return `${baseClasses} text-gray-500 hover:bg-gray-200`;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Plantillas</h1>
        <p className="text-gray-500">Administra, revisa y aprueba las plantillas de comunicación del sistema.</p>
      </div>

      {/* Filtros de estado con nuevo diseño */}
      <div className="my-6 bg-gray-100 p-1 rounded-xl flex gap-1">
        <button onClick={() => setStatusFilter('ALL')} className={getButtonClasses('ALL')}>Todas</button>
        <button onClick={() => setStatusFilter('PENDING')} className={getButtonClasses('PENDING')}>Pendientes</button>
        <button onClick={() => setStatusFilter('APPROVED')} className={getButtonClasses('APPROVED')}>Aprobadas</button>
        <button onClick={() => setStatusFilter('REJECTED')} className={getButtonClasses('REJECTED')}>Rechazadas</button>
      </div>

      {loading && <p>Cargando plantillas...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <TemplateList 
          templates={getFilteredTemplates()} 
          onTemplateUpdated={fetchTemplates}
          statusFilter={statusFilter}
        />
      )}
    </div>
  );
};

export default TemplateApprovalPage;

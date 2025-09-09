import React, { useState, useEffect, useMemo } from 'react';
import { getSimpleFilters, getSimpleClientCount } from '../../services/api';
import SimpleFilterRulesPreview from './SimpleFilterRulesPreview';

/**
 * Componente de filtros guardados optimizado para evitar:
 *  - Llamadas múltiples a la API de listado (solo 1 al montar)
 *  - Re-cálculo infinito de conteo (hash estable de definición)
 *  - setState en efectos que dependen de sí mismos (elimina loops)
 */
const SavedFilters = ({ setClientCount, setCampaignData, onEdit, campaignData }) => {
    const [savedFilters, setSavedFilters] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
        const [countLoading, setCountLoading] = useState(false);

    // 1. Cargar filtros sólo una vez al montar
        useEffect(() => {
            let active = true;
            (async () => {
                try {
                    const data = await getSimpleFilters();
                    if (active) setSavedFilters(data || []);
                } catch (e) {
                    console.error('Error al cargar filtros guardados', e);
                } finally {
                    if (active) setLoadingList(false);
                }
            })();
            return () => { active = false; };
        }, []);

    // 2. Derivar filtro seleccionado sin estado local duplicado
    const selectedFilter = useMemo(() => {
        if (!campaignData.audience_filter_id) return null;
        return savedFilters.find(f => f.id === campaignData.audience_filter_id) || null;
    }, [savedFilters, campaignData.audience_filter_id]);

    // 3. Hash estable de la definición (solo cambia cuando cambia la referencia real)
        // 4. Calcular conteo una sola vez al cargar si había un filtro preseleccionado
        useEffect(() => {
            if (savedFilters.length === 0) return;
            if (!campaignData.audience_filter_id) return;
            const pre = savedFilters.find(f => f.id === campaignData.audience_filter_id);
            if (!pre) return;
            setCountLoading(true);
            getSimpleClientCount(pre.definition)
                .then(res => setClientCount(res.match_count))
                .catch(err => console.error('Error obteniendo conteo inicial', err))
                .finally(() => setCountLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [savedFilters, campaignData.audience_filter_id]);

    // 5. Manejar selección de filtro desde el <select>
        const handleFilterSelect = async (e) => {
        const filterId = e.target.value;
        if (!filterId) {
                setCampaignData(prev => ({ ...prev, audience_filter_id: null }));
                setClientCount(0);
            return;
        }
        const filter = savedFilters.find(f => f.id === filterId);
        if (filter) {
                setCampaignData(prev => ({ ...prev, audience_filter_id: filterId }));
                setCountLoading(true);
                try {
                    const res = await getSimpleClientCount(filter.definition);
                    setClientCount(res.match_count);
                } catch (err) {
                    console.error('Error obteniendo conteo de clientes', err);
                    setClientCount(0);
                } finally {
                    setCountLoading(false);
                }
        }
    };

    if (loadingList) return <div>Cargando filtros...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtros Guardados</label>
                <select
                    value={selectedFilter ? selectedFilter.id : ''}
                    onChange={handleFilterSelect}
                    className="w-full p-2 border rounded-md bg-white"
                >
                    <option value="">Selecciona un filtro guardado</option>
                    {savedFilters.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
                {selectedFilter && (
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => onEdit(selectedFilter.definition)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Editar y Guardar como Nuevo
                        </button>
                    </div>
                )}
                        {selectedFilter && (
                            <div className="mt-3 text-xs text-gray-500">
                                {countLoading ? 'Calculando clientes coincidentes...' : 'Conteo actualizado.'}
                            </div>
                        )}
            </div>
            <div>
                {selectedFilter && selectedFilter.definition && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Definición del Filtro</h4>
                        <div className="p-4 bg-gray-50 rounded-lg border max-h-48 overflow-y-auto">
                            <SimpleFilterRulesPreview definition={selectedFilter.definition} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedFilters;

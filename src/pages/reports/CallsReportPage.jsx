import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, Phone, Download, AlertTriangle, Copy, 
  BarChart2, TrendingUp, Search, RefreshCw, ChevronLeft, ChevronRight, Calendar, ListFilter,
  UserPlus, Plus, Check, X, Users, Trash2
} from 'lucide-react';
import { 
  BarChart, Bar, ComposedChart, Line, ReferenceLine,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer 
} from 'recharts';
import * as api from '../../services/api';

// --- Shared Utilities ---
const secsToHms = (s) => {
  if (isNaN(s) || s == null) return '00:00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    toast.error('No hay datos para exportar');
    return;
  }
  const headers = Object.keys(data[0]).join(';');
  const rows = data.map(row => 
    Object.values(row).map(val => {
      if (val === null || val === undefined) return '';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(';')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// --- Colors ---
const COLORS = {
  'Realizada': '#3b82f6',
  'Recibida': '#22c55e',
  'Recibida predictivo': '#f97316',
  'NN': '#94a3b8'
};

const EF_THRESHOLD = 0.5; // Example threshold for visual effectiveness

export default function CallsReportPage() {
  const navigate = useNavigate();
  const today = new Date();

  // --- State: Tabs ---
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | charts | detail | nn
  
  // --- State: Dashboard & Charts ---
  const [dashboardData, setDashboardData] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashFilters, setDashFilters] = useState({
    anio: today.getFullYear(),
    mes: today.getMonth() + 1,
    coordinador: ''
  });

  // --- State: Detail ---
  const [detailData, setDetailData] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailFilters, setDetailFilters] = useState({
    fecha_inicio: today.toISOString().split('T')[0],
    fecha_fin: today.toISOString().split('T')[0],
    adminfo: '',
    coordinador: '',
    contrato: '',
    direction: '',
    descripcion: '',
    vali: '',
    search: ''
  });
  const [detailPage, setDetailPage] = useState(1);
  const itemsPerPage = 50;

  // --- State: Alerts NN ---
  const [alertsData, setAlertsData] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [hasFetchedAlerts, setHasFetchedAlerts] = useState(false);

  // --- State: Relations & Mapping Modal ---
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignValor, setAssignValor] = useState('');
  const [selectedAdminfo, setSelectedAdminfo] = useState('');
  const [searchGestor, setSearchGestor] = useState('');
  const [isSavingRelation, setIsSavingRelation] = useState(false);
  const [employeesList, setEmployeesList] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showExistingRelations, setShowExistingRelations] = useState(false);
  const [existingRelations, setExistingRelations] = useState([]);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [relationsSearch, setRelationsSearch] = useState('');

  // Búsqueda en servidor con LIKE: únicamente cuando el usuario escribe al menos 2 caracteres
  useEffect(() => {
    if (!searchGestor.trim() || searchGestor.trim().length < 2) {
      setEmployeesList([]);
      setLoadingEmployees(false);
      return;
    }
    setLoadingEmployees(true);
    const timer = setTimeout(async () => {
      try {
        const resp = await api.getEmployees({ search: searchGestor.trim(), size: 20 });
        const items = resp?.items || resp?.data || (Array.isArray(resp) ? resp : []);
        setEmployeesList(items.filter(e => e && e.adminfo));
      } catch (err) {
        console.error('Error buscando colaboradores:', err);
      } finally {
        setLoadingEmployees(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchGestor]);

  const handleOpenAssignModal = (valor = '') => {
    setAssignValor(valor);
    setSelectedAdminfo('');
    setSearchGestor('');
    setEmployeesList([]);
    setIsAssignModalOpen(true);
  };

  const handleSaveRelation = async (e) => {
    e?.preventDefault();
    if (!assignValor.trim()) {
      toast.error('Debe ingresar el valor 3CX (extensión o nombre).');
      return;
    }
    if (!selectedAdminfo.trim()) {
      toast.error('Debe seleccionar o ingresar el gestor (adminfo).');
      return;
    }
    setIsSavingRelation(true);
    try {
      await api.createRelacion3xGestor({
        nombre: assignValor.trim(),
        adminfo: selectedAdminfo.trim().toLowerCase()
      });
      toast.success(`Relación guardada: ${assignValor.trim()} ➔ ${selectedAdminfo.trim()}. Recalculando llamadas...`);
      setIsAssignModalOpen(false);
      fetchAlertsNN();
      if (showExistingRelations) {
        fetchExistingRelations();
      }
    } catch (err) {
      toast.error('Error al guardar relación: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSavingRelation(false);
    }
  };

  const fetchExistingRelations = async () => {
    setLoadingRelations(true);
    try {
      const resp = await api.getRelacion3xGestor();
      const arr = resp?.data || (Array.isArray(resp) ? resp : []);
      setExistingRelations(arr);
    } catch (err) {
      toast.error('Error al obtener relaciones: ' + err.message);
    } finally {
      setLoadingRelations(false);
    }
  };

  const handleDeleteRelation = async (id, nombre, adminfo) => {
    if (!window.confirm(`¿Está seguro de eliminar la relación de "${nombre}" con "${adminfo}"?`)) {
      return;
    }
    try {
      await api.deleteRelacion3xGestor(id);
      toast.success('Relación eliminada exitosamente.');
      fetchExistingRelations();
      fetchAlertsNN();
    } catch (err) {
      toast.error('Error al eliminar relación: ' + err.message);
    }
  };

  const filteredEmployees = employeesList;

  const filteredExistingRelations = useMemo(() => {
    if (!relationsSearch.trim()) return existingRelations;
    const q = relationsSearch.toLowerCase().trim();
    return existingRelations.filter(r => 
      (r.nombre && r.nombre.toLowerCase().includes(q)) ||
      (r.adminfo && r.adminfo.toLowerCase().includes(q))
    );
  }, [existingRelations, relationsSearch]);

  // --- Initial Fetch for Alerts Badge ---
  useEffect(() => {
    fetchAlertsNN(true); // silent fetch for badge
  }, []);

  // --- Data Fetching Functions ---
  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const data = await api.getCallsDashboard({
        anio: dashFilters.anio,
        mes: dashFilters.mes,
        // coordinador se filtra en el frontend — el backend no soporta este parámetro
      });
      const arrData = Array.isArray(data) ? data : (data?.data || data?.items || data?.results || []);
      setDashboardData(arrData);
    } catch (err) {
      toast.error('Error cargando el dashboard: ' + err.message);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchDetailData = async () => {
    if (!detailFilters.fecha_inicio || !detailFilters.fecha_fin) {
      toast.error('Las fechas son obligatorias');
      return;
    }
    if (new Date(detailFilters.fecha_fin) < new Date(detailFilters.fecha_inicio)) {
      toast.error('La fecha fin debe ser posterior a la fecha inicio');
      return;
    }

    setLoadingDetail(true);
    try {
      const data = await api.getCallsDetail({
        fecha_inicio: detailFilters.fecha_inicio,
        fecha_fin: detailFilters.fecha_fin,
        // adminfo se excluye para traer toda la data del rango y filtrar localmente
      });
      const arrData = Array.isArray(data) ? data : (data?.data || data?.items || data?.results || []);
      setDetailData(arrData);
      setDetailPage(1);
    } catch (err) {
      toast.error('Error cargando los registros: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchAlertsNN = async (silent = false, forceRefresh = false) => {
    if (!silent) setLoadingAlerts(true);
    try {
      const data = await api.getCallsAlertsNN(forceRefresh);
      const arrData = Array.isArray(data) ? data : (data?.data || data?.items || data?.results || []);
      setAlertsData(arrData);
      setHasFetchedAlerts(true);
    } catch (err) {
      if (!silent) toast.error('Error cargando alertas NN: ' + err.message);
    } finally {
      if (!silent) setLoadingAlerts(false);
    }
  };

  // Trigger Dashboard fetch when year/month changes
  useEffect(() => {
    fetchDashboardData();
  }, [dashFilters.anio, dashFilters.mes]);

  // Lazy fetch for others when switching tabs manually
  useEffect(() => {
    if (['detail', 'daily', 'charts'].includes(activeTab) && detailData.length === 0) {
      fetchDetailData();
    }
    if (activeTab === 'nn' && (!hasFetchedAlerts || alertsData.length === 0)) {
       fetchAlertsNN();
    }
  }, [activeTab]);

  // --- Derived Shared Data ---
  const filteredSharedData = useMemo(() => {
    return detailData.filter(item => {
      if (detailFilters.coordinador && item.adminfo_jefe_inmediato !== detailFilters.coordinador) return false;
      if (detailFilters.contrato && item.contrato !== detailFilters.contrato) return false;
      if (detailFilters.adminfo && item.adminfo !== detailFilters.adminfo) return false;
      if (detailFilters.direction && item.direction !== detailFilters.direction) return false;
      if (detailFilters.descripcion && item.descripcion !== detailFilters.descripcion) return false;
      if (detailFilters.vali && String(item.vali) !== detailFilters.vali) return false;
      return true;
    });
  }, [detailData, detailFilters.coordinador, detailFilters.contrato, detailFilters.adminfo, detailFilters.direction, detailFilters.descripcion, detailFilters.vali]);

  const activeGestoresCount = useMemo(() => {
    return new Set(filteredSharedData.map(d => d.adminfo).filter(Boolean)).size;
  }, [filteredSharedData]);

  const globalHourlyGestorAvg = useMemo(() => {
    if (!detailFilters.adminfo) return null; // Only calculate & show when a gestor is filtered
    
    // Derive base data applying all filters EXCEPT adminfo
    const baseData = detailData.filter(item => {
      if (detailFilters.coordinador && item.adminfo_jefe_inmediato !== detailFilters.coordinador) return false;
      if (detailFilters.contrato && item.contrato !== detailFilters.contrato) return false;
      if (detailFilters.direction && item.direction !== detailFilters.direction) return false;
      if (detailFilters.descripcion && item.descripcion !== detailFilters.descripcion) return false;
      if (detailFilters.vali && String(item.vali) !== detailFilters.vali) return false;
      return true;
    });

    if (baseData.length === 0) return null;
    
    const uniqueGestores = new Set(baseData.map(d => d.adminfo).filter(Boolean)).size || 1;
    const hoursSet = new Set(baseData.map(d => new Date(d.fecha).getHours()));
    const totalActiveHrs = hoursSet.size > 0 ? hoursSet.size : 1;
    
    return Math.round(baseData.length / uniqueGestores / totalActiveHrs);
  }, [detailData, detailFilters.adminfo, detailFilters.coordinador, detailFilters.contrato, detailFilters.direction, detailFilters.descripcion, detailFilters.vali]);

  const filterOptions = useMemo(() => {
    const adminfos = [...new Set(detailData.map(d => d.adminfo).filter(Boolean))].sort();
    const jefes = [...new Set(detailData.map(d => d.adminfo_jefe_inmediato).filter(Boolean))].sort();
    const contratos = [...new Set(detailData.map(d => d.contrato).filter(Boolean))].sort();
    return { adminfos, jefes, contratos };
  }, [detailData]);

  // --- Derived Data: Dashboard ---
  const uniqueCoordinatorsDash = useMemo(() => {
    return [...new Set(dashboardData.map(d => d.adminfo_jefe_inmediato || 'Sin asignar'))].sort();
  }, [dashboardData]);

  // Derived data: pivot filtered by coordinador (frontend only)
  const pivotedDashboardData = useMemo(() => {
    const filtered = dashFilters.coordinador
      ? dashboardData.filter(d => d.adminfo_jefe_inmediato === dashFilters.coordinador)
      : dashboardData;

    const reduced = filtered.reduce((acc, row) => {
      const key = row.adminfo;
      if (!acc[key]) {
        acc[key] = {
          adminfo: key,
          'Realizada_calls': 0, 'Realizada_talk': 0,
          'Recibida_calls': 0, 'Recibida_talk': 0,
          'Recibida predictivo_calls': 0, 'Recibida predictivo_talk': 0,
          total_llamadas_gral: 0,
          total_efectivas_gral: 0,
          total_talk_gral: 0
        };
      }
      const desc = row.descripcion;
      acc[key][`${desc}_calls`] += row.total_llamadas || 0;
      acc[key][`${desc}_talk`] += row.total_talking_seg || 0;
      
      acc[key].total_llamadas_gral += row.total_llamadas || 0;
      acc[key].total_efectivas_gral += row.llamadas_efectivas || 0;
      acc[key].total_talk_gral += row.total_talking_seg || 0;
      return acc;
    }, {});
    
    return Object.values(reduced).sort((a,b) => b.total_llamadas_gral - a.total_llamadas_gral);
  }, [dashboardData, dashFilters.coordinador]);

  const dashKPIs = useMemo(() => {
    let totals = { calls: 0, efectivas: 0, talk: 0, gestores: pivotedDashboardData.length };
    pivotedDashboardData.forEach(r => {
      totals.calls += r.total_llamadas_gral;
      totals.efectivas += r.total_efectivas_gral;
      totals.talk += r.total_talk_gral;
    });
    return totals;
  }, [pivotedDashboardData]);

  // --- Derived Data: Charts (Using filteredSharedData) ---
  const pivotedDailyForCharts = useMemo(() => {
    const reduced = filteredSharedData.reduce((acc, row) => {
      const key = row.adminfo || 'NN';
      if (!acc[key]) {
        acc[key] = {
          adminfo: key,
          'Realizadas': 0, 'Recibidas': 0, 'Predictivo': 0,
          total_llamadas_gral: 0, total_efectivas_gral: 0,
          total_talk_gral: 0
        };
      }
      
      const desc = row.descripcion === 'Recibida predictivo' ? 'Predictivo' : (row.descripcion === 'Realizada' ? 'Realizadas' : 'Recibidas');
      if (acc[key][desc] !== undefined) acc[key][desc] += 1;
      acc[key].total_llamadas_gral += 1;
      
      if (row.vali) {
         acc[key].total_efectivas_gral += 1;
      }
      
      if (row.talking && typeof row.talking === 'string') {
         const parts = row.talking.split(':');
         if (parts.length === 3) {
             const secs = parseInt(parts[0], 10)*3600 + parseInt(parts[1], 10)*60 + parseInt(parts[2], 10);
             if (!isNaN(secs)) acc[key].total_talk_gral += secs;
         }
      }
      return acc;
    }, {});
    return Object.values(reduced).sort((a,b) => b.total_llamadas_gral - a.total_llamadas_gral);
  }, [filteredSharedData]);

  const chartDataByGestorTop = useMemo(() => {
    return pivotedDailyForCharts.slice(0, 10).map(g => ({
      name: g.adminfo,
      'Realizadas': g['Realizadas'],
      'Recibidas': g['Recibidas'],
      'Predictivo': g['Predictivo'],
      total: g.total_llamadas_gral,
      habla: secsToHms(g.total_talk_gral)
    }));
  }, [pivotedDailyForCharts]);

  const chartDataEffectiveness = useMemo(() => {
    const list = pivotedDailyForCharts.filter(g => g.total_llamadas_gral > 0).map(g => {
      const pct = (g.total_efectivas_gral / g.total_llamadas_gral) * 100;
      return {
        name: g.adminfo,
        efectividad: pct,
        color: pct >= (EF_THRESHOLD * 100) ? '#22c55e' : '#f87171'
      };
    }).sort((a,b) => b.efectividad - a.efectividad).slice(0, 20); // Top 20 for readability
    return list;
  }, [pivotedDailyForCharts]);
  
  const avgEffectiveness = useMemo(() => {
    let totCalls = 0; let totEfec = 0;
    pivotedDailyForCharts.forEach(g => { totCalls += g.total_llamadas_gral; totEfec += g.total_efectivas_gral; });
    return totCalls === 0 ? 0 : (totEfec / totCalls) * 100;
  }, [pivotedDailyForCharts]);

  const chartDataDonut = useMemo(() => {
    let distribution = {
      'Realizada': 0, 'Recibida': 0, 'Recibida predictivo': 0
    };
    filteredSharedData.forEach(row => {
      if (distribution[row.descripcion] !== undefined) {
        distribution[row.descripcion] += 1;
      }
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [filteredSharedData]);

  const chartDataTalkTime = useMemo(() => {
    return pivotedDailyForCharts.slice(0,10).map(g => ({
      name: g.adminfo,
      horas: g.total_talk_gral / 3600
    })).sort((a,b) => b.horas - a.horas);
  }, [pivotedDailyForCharts]);

  // --- Derived Data: Detail ---
  const filteredDetail = useMemo(() => {
    return filteredSharedData.filter(item => {
      if (detailFilters.search) {
        const term = detailFilters.search.toLowerCase();
        const info = [item.adminfo, item.to_number, item.from_raw, item.contrato, item.adminfo_jefe_inmediato].join(' ').toLowerCase();
        if (!info.includes(term)) return false;
      }
      return true;
    });
  }, [filteredSharedData, detailFilters.search]);

  const detailPaginated = useMemo(() => {
    const start = (detailPage - 1) * itemsPerPage;
    return filteredDetail.slice(start, start + itemsPerPage);
  }, [filteredDetail, detailPage, itemsPerPage]);

  const detailTotalPages = Math.ceil(filteredDetail.length / itemsPerPage);


  // --- Derived Data: Daily ---
  const dailyPivotData = useMemo(() => {
    const grouped = {};
    const grandTotal = {
      'Realizada_calls': 0, 'Realizada_efec': 0,
      'Recibida_calls': 0, 'Recibida_efec': 0,
      'Recibida predictivo_calls': 0, 'Recibida predictivo_efec': 0,
      total_calls: 0, total_efec: 0
    };

    filteredSharedData.forEach(row => {
      const coord = row.adminfo_jefe_inmediato || 'Sin asignar';
      const contrato = row.contrato || 'Sin definir';
      const adminfo = row.adminfo || 'NN';

      if (!grouped[coord]) grouped[coord] = { 
        totals: {
          'Realizada_calls': 0, 'Realizada_efec': 0,
          'Recibida_calls': 0, 'Recibida_efec': 0,
          'Recibida predictivo_calls': 0, 'Recibida predictivo_efec': 0,
          total_calls: 0, total_efec: 0
        }, 
        contratos: {} 
      };
      
      if (!grouped[coord].contratos[contrato]) grouped[coord].contratos[contrato] = {
        totals: {
           'Realizada_calls': 0, 'Realizada_efec': 0,
           'Recibida_calls': 0, 'Recibida_efec': 0,
           'Recibida predictivo_calls': 0, 'Recibida predictivo_efec': 0,
           total_calls: 0, total_efec: 0
        },
        gestores: {}
      };

      if (!grouped[coord].contratos[contrato].gestores[adminfo]) {
        grouped[coord].contratos[contrato].gestores[adminfo] = {
           adminfo,
           'Realizada_calls': 0, 'Realizada_efec': 0,
           'Recibida_calls': 0, 'Recibida_efec': 0,
           'Recibida predictivo_calls': 0, 'Recibida predictivo_efec': 0,
           total_calls: 0, total_efec: 0
        };
      }

      const desc = row.descripcion;
      const ref = grouped[coord].contratos[contrato].gestores[adminfo];
      const contTot = grouped[coord].contratos[contrato].totals;
      const coordTot = grouped[coord].totals;
      
      const isEfec = row.vali ? 1 : 0;
      
      if (ref[`${desc}_calls`] !== undefined) {
          ref[`${desc}_calls`] += 1;
          contTot[`${desc}_calls`] += 1;
          coordTot[`${desc}_calls`] += 1;
          grandTotal[`${desc}_calls`] += 1;

          if (isEfec) {
             ref[`${desc}_efec`] += 1;
             contTot[`${desc}_efec`] += 1;
             coordTot[`${desc}_efec`] += 1;
             grandTotal[`${desc}_efec`] += 1;
          }
      }
      
      ref.total_calls += 1;
      contTot.total_calls += 1;
      coordTot.total_calls += 1;
      grandTotal.total_calls += 1;

      if (isEfec) {
         ref.total_efec += 1;
         contTot.total_efec += 1;
         coordTot.total_efec += 1;
         grandTotal.total_efec += 1;
      }
    });

    const result = [];
    Object.keys(grouped).sort().forEach(coord => {
        const coordObj = grouped[coord];
        const contratosArr = [];
        
        Object.keys(coordObj.contratos).sort().forEach(contrato => {
             const gestores = Object.values(coordObj.contratos[contrato].gestores).sort((a,b) => b.total_calls - a.total_calls);
             contratosArr.push({ contrato, totals: coordObj.contratos[contrato].totals, gestores });
        });
        
        result.push({ coordinador: coord, totals: coordObj.totals, contratos: contratosArr });
    });

    return { result, grandTotal };
  }, [filteredSharedData]);

  // --- Derived Data: Hourly ---
  const hourlyPivotData = useMemo(() => {
    // Determine active hours (have calls or in 7-20 range)
    const hourTotals = {};
    for (let h = 0; h < 24; h++) hourTotals[h] = { calls: 0, efec: 0 };

    // build coord -> contrato -> gestor -> hour structure
    const grouped = {};

    filteredSharedData.forEach(row => {
      const coord   = row.adminfo_jefe_inmediato || 'Sin asignar';
      const contrat = row.contrato || 'Sin definir';
      const adm     = row.adminfo || 'NN';
      const hour    = new Date(row.fecha).getHours();
      const isEfec  = row.vali ? 1 : 0;

      // grand totals per hour
      hourTotals[hour].calls += 1;
      hourTotals[hour].efec  += isEfec;

      if (!grouped[coord]) grouped[coord] = { hourTotals: {}, contratos: {} };
      if (!grouped[coord].hourTotals[hour]) grouped[coord].hourTotals[hour] = { calls: 0, efec: 0 };
      grouped[coord].hourTotals[hour].calls += 1;
      grouped[coord].hourTotals[hour].efec  += isEfec;

      if (!grouped[coord].contratos[contrat]) grouped[coord].contratos[contrat] = { hourTotals: {}, gestores: {} };
      if (!grouped[coord].contratos[contrat].hourTotals[hour]) grouped[coord].contratos[contrat].hourTotals[hour] = { calls: 0, efec: 0 };
      grouped[coord].contratos[contrat].hourTotals[hour].calls += 1;
      grouped[coord].contratos[contrat].hourTotals[hour].efec  += isEfec;

      if (!grouped[coord].contratos[contrat].gestores[adm]) grouped[coord].contratos[contrat].gestores[adm] = { hourTotals: {} };
      if (!grouped[coord].contratos[contrat].gestores[adm].hourTotals[hour]) grouped[coord].contratos[contrat].gestores[adm].hourTotals[hour] = { calls: 0, efec: 0 };
      grouped[coord].contratos[contrat].gestores[adm].hourTotals[hour].calls += 1;
      grouped[coord].contratos[contrat].gestores[adm].hourTotals[hour].efec  += isEfec;
    });

    // active hours: those with calls OR in 7–20 range
    const activeHours = []
    for (let h = 0; h < 24; h++) {
      if (hourTotals[h].calls > 0 || (h >= 7 && h <= 20)) activeHours.push(h);
    }

    // flatten grouped
    const coordinadores = Object.keys(grouped).sort().map(coord => ({
      name: coord,
      hourTotals: grouped[coord].hourTotals,
      contratos: Object.keys(grouped[coord].contratos).sort().map(contrat => ({
        name: contrat,
        hourTotals: grouped[coord].contratos[contrat].hourTotals,
        gestores: Object.keys(grouped[coord].contratos[contrat].gestores).sort().map(adm => ({
          name: adm,
          hourTotals: grouped[coord].contratos[contrat].gestores[adm].hourTotals,
        })),
      })),
    }));

    // chart data: stacked by description + efectivas
    const descTotals = {};
    for (let h = 0; h < 24; h++) descTotals[h] = { realizadas: 0, recibidas: 0, predictivo: 0 };
    filteredSharedData.forEach(row => {
      const h = new Date(row.fecha).getHours();
      const desc = row.descripcion;
      if (desc === 'Realizada') descTotals[h].realizadas += 1;
      else if (desc === 'Recibida') descTotals[h].recibidas += 1;
      else if (desc === 'Recibida predictivo') descTotals[h].predictivo += 1;
    });
    const chartData = activeHours.map(h => ({
      name: `${String(h).padStart(2,'0')}h`,
      Realizadas: descTotals[h].realizadas,
      Recibidas: descTotals[h].recibidas,
      Predictivo: descTotals[h].predictivo,
      Efectivas: hourTotals[h].efec,
      PctEfec: hourTotals[h].calls > 0 ? Math.round((hourTotals[h].efec / hourTotals[h].calls) * 100) : null,
    }));

    return { activeHours, coordinadores, hourTotals, chartData };
  }, [filteredSharedData]);

  // --- Handlers ---
  const handleExportDaily = () => {
    if (dailyPivotData.result.length === 0) return toast.error("No hay datos diarios para exportar.");
    const exportData = [];
    const calcPct = (c, e) => c ? Math.round((e/c)*100) + '%' : '0%';
    
    dailyPivotData.result.forEach(coord => {
      coord.contratos.forEach(contr => {
        contr.gestores.forEach(g => {
          exportData.push({
            Coordinador: coord.coordinador,
            Contrato: contr.contrato,
            Gestor: g.adminfo,
            'Realizadas (Calls)': g['Realizada_calls'],
            'Realizadas (Efec)': g['Realizada_efec'],
            'Realizadas (%)': calcPct(g['Realizada_calls'], g['Realizada_efec']),
            'Recibidas (Calls)': g['Recibida_calls'],
            'Recibidas (Efec)': g['Recibida_efec'],
            'Recibidas (%)': calcPct(g['Recibida_calls'], g['Recibida_efec']),
            'Predictivo (Calls)': g['Recibida predictivo_calls'],
            'Predictivo (Efec)': g['Recibida predictivo_efec'],
            'Predictivo (%)': calcPct(g['Recibida predictivo_calls'], g['Recibida predictivo_efec']),
            'Total Llamadas': g.total_calls,
            'Total Efectivas': g.total_efec,
            'Total %': calcPct(g.total_calls, g.total_efec)
          });
        });
      });
    });
    exportToCSV(exportData, `informe-diario-${detailFilters.fecha_inicio}-${detailFilters.fecha_fin}.csv`);
  };

  const handleExportDashboard = () => {
    const exportData = pivotedDashboardData.map(p => ({
      Gestor: p.adminfo,
      'Realizadas (Llamadas)': p['Realizada_calls'],
      'Realizadas (Habla)': secsToHms(p['Realizada_talk']),
      'Recibidas (Llamadas)': p['Recibida_calls'],
      'Recibidas (Habla)': secsToHms(p['Recibida_talk']),
      'Predictivo (Llamadas)': p['Recibida predictivo_calls'],
      'Predictivo (Habla)': secsToHms(p['Recibida predictivo_talk']),
      'Total Llamadas': p.total_llamadas_gral,
      'Total Efectivas': p.total_efectivas_gral,
      'Total Habla': secsToHms(p.total_talk_gral)
    }));
    exportToCSV(exportData, `informe-llamadas-${dashFilters.anio}-${String(dashFilters.mes).padStart(2,'0')}.csv`);
  };

  const handleExportDetail = () => {
    exportToCSV(filteredDetail, `informe-llamadas-detalle-${detailFilters.fecha_inicio}-${detailFilters.fecha_fin}.csv`);
  };

  const jumpToDetail = (adminfo) => {
    setDetailFilters(prev => ({ ...prev, adminfo }));
    setActiveTab('detail');
  };

  const CustomTooltipCharts = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md outline-none rounded text-xs">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.value % 1 !== 0 ? entry.value.toFixed(1) : entry.value} 
              {entry.name === 'efectividad' ? '%' : ''}
              {entry.name === 'horas' ? 'h' : ''}
            </p>
          ))}
          {payload[0]?.payload?.habla && <p className="text-gray-500 mt-1">Hablado: {payload[0].payload.habla}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/reports')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-600" />
            Informe de Llamadas 3CX
          </h1>
          <p className="text-sm text-gray-500">Métricas consolidadas y detalle del sistema telefónico</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Tab Headers */}
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
          {[
            { id: 'dashboard', label: '📊 Dashboard Mensual' },
            { id: 'daily', label: '📅 Dashboard Dinámico' },
            { id: 'hourly', label: '⏱️ Hora a Hora' },
            { id: 'charts', label: '📈 Gráficos' },
            { id: 'detail', label: '🔍 Detalle' },
            { 
              id: 'nn', 
              label: (
                <span className="flex items-center gap-2">
                  ⚠️ Alertas NN 
                  {alertsData.length > 0 && (
                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {alertsData.length}
                    </span>
                  )}
                </span>
              ) 
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${activeTab === tab.id ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-5 flex-1 bg-white">
          
          {/* =========================================
              GLOBAL SHARED FILTERS (Diario, Charts, Detail)
             ========================================= */}
          {['daily', 'hourly', 'charts', 'detail'].includes(activeTab) && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 lg:col-span-8 flex gap-2">
                     <div className="flex-1 flex flex-wrap items-center gap-2 bg-white px-3 py-1.5 border border-gray-300 rounded-md">
                       <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Rango:</span>
                       <input type="date" className="border-none bg-transparent text-sm p-0 focus:ring-0 flex-1 min-w-[110px]" value={detailFilters.fecha_inicio} onChange={e => setDetailFilters(p => ({...p, fecha_inicio: e.target.value}))} />
                       <span className="text-xs text-gray-400 mx-1">a</span>
                       <input type="date" className="border-none bg-transparent text-sm p-0 focus:ring-0 flex-1 min-w-[110px]" value={detailFilters.fecha_fin} onChange={e => setDetailFilters(p => ({...p, fecha_fin: e.target.value}))} />
                     </div>
                     <button onClick={fetchDetailData} disabled={loadingDetail} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center justify-center min-w-[100px]">
                       {loadingDetail ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Consultar'}
                     </button>
                  </div>
                  
                  {activeTab === 'detail' && (
                    <div className="md:col-span-4 lg:col-span-4 relative flex items-center">
                      <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Buscar número, origen..." className="w-full pl-9 h-[38px] text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" value={detailFilters.search} onChange={e => { setDetailFilters(p => ({...p, search: e.target.value})); setDetailPage(1); }} />
                    </div>
                  )}
               </div>

               <div className="flex flex-wrap gap-3">
                  <select className="border-gray-300 flex-1 min-w-[130px] rounded-md text-xs h-9 shadow-sm" value={detailFilters.coordinador} onChange={e => { setDetailFilters(p => ({...p, coordinador: e.target.value})); setDetailPage(1); }}>
                    <option value="">Coordinador: Todos</option>
                    {filterOptions.jefes.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                  <select className="border-gray-300 flex-1 min-w-[130px] rounded-md text-xs h-9 shadow-sm" value={detailFilters.contrato} onChange={e => { setDetailFilters(p => ({...p, contrato: e.target.value})); setDetailPage(1); }}>
                    <option value="">Contrato: Todos</option>
                    {filterOptions.contratos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="border-gray-300 flex-1 min-w-[130px] rounded-md text-xs h-9 shadow-sm" value={detailFilters.adminfo} onChange={e => { setDetailFilters(p => ({...p, adminfo: e.target.value})); setDetailPage(1); }}>
                    <option value="">Gestor: Todos</option>
                    {filterOptions.adminfos.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  
                     <select className="border-gray-300 flex-1 min-w-[130px] rounded-md text-xs h-9 shadow-sm" value={detailFilters.descripcion} onChange={e => { setDetailFilters(p => ({...p, descripcion: e.target.value})); setDetailPage(1); }}>
                       <option value="">Tipo: Todos</option>
                       <option value="Realizada">Realizada</option><option value="Recibida">Recibida</option><option value="Recibida predictivo">Recibida predictivo</option>
                     </select>
                     <select className="border-gray-300 flex-1 min-w-[130px] rounded-md text-xs h-9 shadow-sm" value={detailFilters.vali} onChange={e => { setDetailFilters(p => ({...p, vali: e.target.value})); setDetailPage(1); }}>
                       <option value="">Efectividad: Todas</option><option value="1">Efectivas (&gt;15s)</option><option value="0">Perdidas / Cortas</option>
                     </select>
                     <select className="border-gray-300 flex-1 min-w-[130px] rounded-md text-xs h-9 shadow-sm" value={detailFilters.direction} onChange={e => { setDetailFilters(p => ({...p, direction: e.target.value})); setDetailPage(1); }}>
                       <option value="">Sentido: Todos</option><option value="Outbound">Outbound (Saliente)</option><option value="Inbound">Inbound (Entrante)</option>
                     </select>
               </div>
            </div>
          )}

          {/* =========================================
              DASHBOARD TAB 
             ========================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-end gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Año</label>
                    <select 
                      className="border-gray-300 rounded-md text-sm shadow-sm h-9 focus:ring-blue-500 focus:border-blue-500"
                      value={dashFilters.anio}
                      onChange={e => setDashFilters(p => ({ ...p, anio: parseInt(e.target.value) }))}
                    >
                      {[...Array(5)].map((_, i) => {
                        const yr = today.getFullYear() - i;
                        return <option key={yr} value={yr}>{yr}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mes</label>
                    <select 
                      className="border-gray-300 rounded-md text-sm shadow-sm h-9 focus:ring-blue-500 focus:border-blue-500"
                      value={dashFilters.mes}
                      onChange={e => setDashFilters(p => ({ ...p, mes: parseInt(e.target.value) }))}
                    >
                      {Array.from({length: 12}, (_, i) => i+1).map(m => (
                        <option key={m} value={m}>{new Date(2000, m-1, 1).toLocaleString('es', { month: 'long' }).toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Coordinador</label>
                    <select 
                      className="border-gray-300 rounded-md text-sm shadow-sm h-9 focus:ring-blue-500 focus:border-blue-500 w-48"
                      value={dashFilters.coordinador}
                      onChange={e => setDashFilters(p => ({ ...p, coordinador: e.target.value }))}
                    >
                      <option value="">Todos</option>
                      {uniqueCoordinatorsDash.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleExportDashboard}
                  disabled={pivotedDashboardData.length === 0}
                  className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Download className="h-4 w-4" /> Exportar CSV
                </button>
              </div>

              {loadingDashboard ? (
                <div className="flex items-center justify-center p-12"><RefreshCw className="h-8 w-8 text-blue-500 animate-spin" /></div>
              ) : (
                <>
                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { l: 'Total Llamadas', v: dashKPIs.calls.toLocaleString(), c: 'border-blue-500' },
                      { l: 'Efectivas (>15s)', v: dashKPIs.efectivas.toLocaleString(), c: 'border-green-500' },
                      { l: 'Tiempo Total de Habla', v: secsToHms(dashKPIs.talk), c: 'border-purple-500' },
                      { l: 'Gestores Activos', v: dashKPIs.gestores, c: 'border-orange-500' }
                    ].map((k,i) => (
                      <div key={i} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${k.c} border border-gray-200`}>
                        <p className="text-xs font-medium text-gray-500 uppercase">{k.l}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{k.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Table Pivot */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gestor</th>
                          <th colSpan="2" className="px-4 py-3 text-center text-xs font-medium text-blue-600 uppercase border-l border-gray-200 bg-blue-50/50">Realizadas</th>
                          <th colSpan="2" className="px-4 py-3 text-center text-xs font-medium text-green-600 uppercase border-l border-gray-200 bg-green-50/50">Recibidas</th>
                          <th colSpan="2" className="px-4 py-3 text-center text-xs font-medium text-orange-600 uppercase border-l border-gray-200 bg-orange-50/50">Predictivo</th>
                          <th colSpan="2" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-l border-gray-200">Consolidado</th>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-2 bg-white"></th>
                          <th className="px-2 py-2 text-xs text-gray-500 font-normal border-l text-center">Calls</th>
                          <th className="px-2 py-2 text-xs text-gray-500 font-normal text-center">Habla</th>
                          <th className="px-2 py-2 text-xs text-gray-500 font-normal border-l text-center">Calls</th>
                          <th className="px-2 py-2 text-xs text-gray-500 font-normal text-center">Habla</th>
                          <th className="px-2 py-2 text-xs text-gray-500 font-normal border-l text-center">Calls</th>
                          <th className="px-2 py-2 text-xs text-gray-500 font-normal text-center">Habla</th>
                          <th className="px-2 py-2 text-xs text-gray-500 font-semibold border-l text-center bg-gray-50">Calls</th>
                          <th className="px-2 py-2 text-xs text-gray-500 font-semibold text-center bg-gray-50">Efectivas</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pivotedDashboardData.map((row) => (
                          <tr key={row.adminfo} onClick={() => jumpToDetail(row.adminfo)} className="hover:bg-blue-50 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r">{row.adminfo}</td>
                            
                            <td className="px-2 py-3 text-sm text-center text-gray-600">{row['Realizada_calls'] || '—'}</td>
                            <td className="px-2 py-3 text-xs text-center text-gray-500">{secsToHms(row['Realizada_talk'])}</td>
                            
                            <td className="px-2 py-3 text-sm text-center text-gray-600 border-l">{row['Recibida_calls'] || '—'}</td>
                            <td className="px-2 py-3 text-xs text-center text-gray-500">{secsToHms(row['Recibida_talk'])}</td>
                            
                            <td className="px-2 py-3 text-sm text-center text-gray-600 border-l">{row['Recibida predictivo_calls'] || '—'}</td>
                            <td className="px-2 py-3 text-xs text-center text-gray-500">{secsToHms(row['Recibida predictivo_talk'])}</td>
                            
                            <td className="px-2 py-3 text-sm text-center font-bold text-gray-800 border-l bg-gray-50/50">{row.total_llamadas_gral}</td>
                            <td className="px-2 py-3 text-sm text-center font-bold bg-gray-50/50 border-gray-200">
                              <span className={`px-2 py-1 rounded inline-flex ${((row.total_efectivas_gral/row.total_llamadas_gral) >= EF_THRESHOLD) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {row.total_efectivas_gral}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {pivotedDashboardData.length === 0 && (
                          <tr><td colSpan="9" className="text-center py-8 text-gray-500">No hay datos para el período seleccionado</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* =========================================
              DAILY TAB 
             ========================================= */}
          {activeTab === 'daily' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                 <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                   <Calendar className="h-4 w-4 text-blue-600" /> Dashboard Dinámico de Productividad
                 </h2>
                 <button
                   onClick={handleExportDaily}
                   disabled={dailyPivotData.result.length === 0}
                   className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                 >
                   <Download className="h-4 w-4" /> Exportar CSV
                 </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center p-12"><RefreshCw className="h-8 w-8 text-blue-500 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Gestor</th>
                        <th colSpan="3" className="px-2 py-2 text-center text-xs font-bold text-blue-600 uppercase border-l border-gray-300 bg-blue-50/50">Realizadas</th>
                        <th colSpan="3" className="px-2 py-2 text-center text-xs font-bold text-green-600 uppercase border-l border-gray-300 bg-green-50/50">Recibidas</th>
                        <th colSpan="3" className="px-2 py-2 text-center text-xs font-bold text-orange-600 uppercase border-l border-gray-300 bg-orange-50/50">Predictivo</th>
                        <th colSpan="3" className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase border-l border-gray-300 bg-gray-100">Consolidado</th>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <th className="px-4 py-2 bg-white border-r border-gray-200"></th>
                        {/* Realizadas */}
                        <th className="px-1 py-1 text-[10px] text-center border-gray-200 text-gray-500 font-medium">CALLS</th><th className="px-1 py-1 text-[10px] text-center border-l border-gray-200 bg-gray-50 text-gray-500 font-medium">EFEC</th><th className="px-1 py-1 text-[10px] text-center border-l border-gray-200 bg-gray-50 text-gray-500 font-medium">%</th>
                        {/* Recibidas */}
                        <th className="px-1 py-1 text-[10px] text-center border-l border-gray-300 text-gray-500 font-medium">CALLS</th><th className="px-1 py-1 text-[10px] text-center border-l border-gray-200 bg-gray-50 text-gray-500 font-medium">EFEC</th><th className="px-1 py-1 text-[10px] text-center border-l border-gray-200 bg-gray-50 text-gray-500 font-medium">%</th>
                        {/* Predictivo */}
                        <th className="px-1 py-1 text-[10px] text-center border-l border-gray-300 text-gray-500 font-medium">CALLS</th><th className="px-1 py-1 text-[10px] text-center border-l border-gray-200 bg-gray-50 text-gray-500 font-medium">EFEC</th><th className="px-1 py-1 text-[10px] text-center border-l border-gray-200 bg-gray-50 text-gray-500 font-medium">%</th>
                        {/* Consolidado */}
                        <th className="px-1 py-1 text-[10px] text-center border-l border-gray-300 text-gray-700 font-semibold bg-gray-50">CALLS</th><th className="px-1 py-1 text-[10px] text-center border-l border-gray-200 bg-gray-100 text-gray-600 font-semibold">EFEC</th><th className="px-1 py-1 text-[10px] text-center border-l border-gray-200 bg-gray-100 text-gray-600 font-semibold">%</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyPivotData.result.map(coord => (
                        <React.Fragment key={coord.coordinador}>
                          {/* Fila Coordinador Total */}
                          <tr className="bg-blue-100/60 border-t-4 border-gray-300">
                            <td className="px-4 py-3 font-bold text-blue-900 text-sm border-r border-gray-300">👔 Coord: {coord.coordinador}</td>
                            {[
                               {c: coord.totals['Realizada_calls'], e: coord.totals['Realizada_efec']},
                               {c: coord.totals['Recibida_calls'], e: coord.totals['Recibida_efec']},
                               {c: coord.totals['Recibida predictivo_calls'], e: coord.totals['Recibida predictivo_efec']},
                               {c: coord.totals.total_calls, e: coord.totals.total_efec, isConsolidado: true}
                            ].map((group, idx) => {
                               const pct = group.c ? Math.round((group.e/group.c)*100) : 0;
                               const colorClass = group.c ? (pct >= 50 ? 'text-green-700' : 'text-red-600') : 'text-gray-400';
                               return (
                                  <React.Fragment key={idx}>
                                     <td className="px-2 py-2 text-center text-xs font-bold text-gray-800 border-l border-gray-300">{group.c || '—'}</td>
                                     <td className="px-2 py-2 text-center text-xs font-bold text-gray-700 border-l border-gray-200">{group.e || '—'}</td>
                                     <td className={`px-2 py-2 text-center text-xs font-bold border-l border-gray-200 ${colorClass}`}>{group.c ? pct+'%' : '—'}</td>
                                  </React.Fragment>
                               )
                            })}
                          </tr>
                          
                          {coord.contratos.map(contr => (
                             <React.Fragment key={contr.contrato}>
                               {/* Fila Contrato Total */}
                               <tr className="bg-gray-100 border-t-2 border-gray-300 shadow-sm">
                                  <td className="px-4 py-2 pl-8 font-semibold text-gray-800 text-xs text-left border-r border-gray-300">
                                    <div className="flex items-center gap-1">📄 {contr.contrato}</div>
                                  </td>
                                  {[
                                     {c: contr.totals['Realizada_calls'], e: contr.totals['Realizada_efec']},
                                     {c: contr.totals['Recibida_calls'], e: contr.totals['Recibida_efec']},
                                     {c: contr.totals['Recibida predictivo_calls'], e: contr.totals['Recibida predictivo_efec']},
                                     {c: contr.totals.total_calls, e: contr.totals.total_efec, isConsolidado: true}
                                  ].map((group, idx) => {
                                     const pct = group.c ? Math.round((group.e/group.c)*100) : 0;
                                     const colorClass = group.c ? (pct >= 50 ? 'text-green-600' : 'text-red-500') : 'text-gray-400';
                                     return (
                                        <React.Fragment key={idx}>
                                           <td className="px-2 py-2 text-center text-[11px] font-semibold text-gray-700 border-l border-gray-300">{group.c || '—'}</td>
                                           <td className="px-2 py-2 text-center text-[11px] font-semibold text-gray-600 border-l border-gray-200">{group.e || '—'}</td>
                                           <td className={`px-2 py-2 text-center text-[11px] font-semibold border-l border-gray-200 ${colorClass}`}>{group.c ? pct+'%' : '—'}</td>
                                        </React.Fragment>
                                     )
                                  })}
                               </tr>
                               {contr.gestores.map(g => {
                                  const renderCells = (c, e, total = false) => {
                                     const pctVal = c ? Math.round((e/c)*100) : 0;
                                     const pctStr = c ? pctVal + '%' : '—';
                                     const colorClass = c ? (pctVal >= 50 ? 'text-green-600 font-semibold' : 'text-red-500 font-medium') : 'text-gray-400';
                                     const cellBg = total ? 'bg-gray-50' : '';
                                     return (
                                        <React.Fragment key={Math.random()}>
                                          <td className={`px-2 py-2 text-center text-[11px] font-medium text-gray-700 border-l ${total ? 'border-gray-300' : 'border-gray-200'} ${cellBg}`}>{c || '—'}</td>
                                          <td className={`px-2 py-2 text-center text-[11px] text-gray-500 border-l border-gray-100 ${cellBg}`}>{e || '—'}</td>
                                          <td className={`px-2 py-2 text-center text-[11px] border-l border-gray-100 ${colorClass} ${cellBg}`}>{pctStr}</td>
                                        </React.Fragment>
                                     );
                                  };
                                  return (
                                     <tr key={g.adminfo} onClick={() => jumpToDetail(g.adminfo)} className="hover:bg-blue-50/70 transition-colors cursor-pointer group">
                                       <td className="px-4 py-2 pl-12 whitespace-nowrap text-xs font-medium text-gray-600 border-r border-gray-200 group-hover:text-blue-600 group-hover:font-semibold">
                                          👤 {g.adminfo}
                                       </td>
                                       {renderCells(g['Realizada_calls'], g['Realizada_efec'])}
                                       {renderCells(g['Recibida_calls'], g['Recibida_efec'])}
                                       {renderCells(g['Recibida predictivo_calls'], g['Recibida predictivo_efec'])}
                                       {renderCells(g.total_calls, g.total_efec, true)}
                                     </tr>
                                  );
                               })}
                             </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                      
                      {/* Fila Grand Total */}
                      {dailyPivotData.result.length > 0 && (
                        <tr className="bg-gray-800 text-white border-t-4 border-gray-900">
                          <td className="px-4 py-3 font-bold text-sm border-r border-gray-700">
                            ∑ TOTAL CONSOLIDADO DEL DÍA <span className="text-[10px] font-normal text-gray-400 ml-1">({activeGestoresCount} Gestores)</span>
                          </td>
                          {[
                             {c: dailyPivotData.grandTotal['Realizada_calls'], e: dailyPivotData.grandTotal['Realizada_efec']},
                             {c: dailyPivotData.grandTotal['Recibida_calls'], e: dailyPivotData.grandTotal['Recibida_efec']},
                             {c: dailyPivotData.grandTotal['Recibida predictivo_calls'], e: dailyPivotData.grandTotal['Recibida predictivo_efec']},
                             {c: dailyPivotData.grandTotal.total_calls, e: dailyPivotData.grandTotal.total_efec, isConsolidado: true}
                          ].map((group, idx) => {
                             const pct = group.c ? Math.round((group.e/group.c)*100) : 0;
                             const colorClass = group.c ? (pct >= 50 ? 'text-green-400' : 'text-red-400') : 'text-gray-500';
                             return (
                                <React.Fragment key={idx}>
                                   <td className="px-2 py-3 text-center text-xs font-bold border-l border-gray-600">{group.c || '—'}</td>
                                   <td className="px-2 py-3 text-center text-xs font-bold text-gray-300 border-l border-gray-700">{group.e || '—'}</td>
                                   <td className={`px-2 py-3 text-center text-xs font-bold border-l border-gray-700 ${colorClass}`}>{group.c ? pct+'%' : '—'}</td>
                                </React.Fragment>
                             )
                          })}
                        </tr>
                      )}
                      
                      {dailyPivotData.result.length === 0 && (
                        <tr><td colSpan="13" className="py-8 text-center text-gray-500">No hay llamadas registradas para la fecha seleccionada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================
              HOURLY TAB 
             ========================================= */}
          {activeTab === 'hourly' && (() => {
            const { activeHours, coordinadores, hourTotals, chartData } = hourlyPivotData;
            const pct = (e, c) => c ? Math.round((e / c) * 100) : null;
            const cell = (ht, h) => {
              const s = ht[h];
              if (!s || s.calls === 0) return <td key={h} className="px-1 py-1 text-center text-[10px] text-gray-300 border-l border-gray-100">—</td>;
              const p = pct(s.efec, s.calls);
              const cl = p !== null ? (p >= 50 ? 'text-green-600' : 'text-red-500') : 'text-gray-500';
              return (
                <td key={h} className="px-1 py-1.5 text-center border-l border-gray-100">
                  <div className="text-[11px] font-semibold text-gray-800">{s.calls}</div>
                  <div className={`text-[9px] font-medium ${cl}`}>{p !== null ? p + '%' : ''}</div>
                </td>
              );
            };
            const totalCell = (ht, h) => {
              const s = ht && ht[h];
              if (!s || s.calls === 0) return <td key={h} className="px-1 py-1 text-center text-[10px] text-gray-500 border-l border-gray-200 bg-gray-50">—</td>;
              const p = pct(s.efec, s.calls);
              const cl = p !== null ? (p >= 50 ? 'text-green-400' : 'text-red-400') : 'text-gray-400';
              return (
                <td key={h} className="px-1 py-1.5 text-center border-l border-gray-600 bg-gray-700">
                  <div className="text-[11px] font-bold text-white">{s.calls}</div>
                  <div className={`text-[9px] font-bold ${cl}`}>{p !== null ? p + '%' : ''}</div>
                </td>
              );
            };
            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Bar Chart: stacked by description + Efectivas */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Distribución de Llamadas por Franja Horaria</h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis yAxisId="left" fontSize={11} />
                        <YAxis yAxisId="right" orientation="right" fontSize={11} tickFormatter={v => `${v}%`} domain={[0, 100]} width={45} />
                        <RechartsTooltip content={<CustomTooltipCharts />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar yAxisId="left" dataKey="Realizadas" stackId="calls" fill="#3b82f6" />
                        <Bar yAxisId="left" dataKey="Recibidas"  stackId="calls" fill="#22c55e" />
                        <Bar yAxisId="left" dataKey="Predictivo" stackId="calls" fill="#f97316" radius={[3,3,0,0]} />
                        <Bar yAxisId="left" dataKey="Efectivas" fill="#a855f7" radius={[3,3,0,0]} barSize={8} />
                        <Line yAxisId="right" type="monotone" dataKey="PctEfec" name="% Efectividad" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} connectNulls={false} />
                        {globalHourlyGestorAvg !== null && (
                          <ReferenceLine yAxisId="left" y={globalHourlyGestorAvg} stroke="#10b981" strokeDasharray="3 3" strokeWidth={2} label={{ position: 'insideTopLeft', value: `Media Global x Gestor: ${globalHourlyGestorAvg}/h`, fill: '#10b981', fontSize: 11, fontWeight: 'bold' }} />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pivot Table: rows = Coord > Contrato > Gestor, cols = hours */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-r border-gray-200 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                          Coordinator / Contrato / Gestor
                        </th>
                        {activeHours.map(h => (
                          <th key={h} className="px-1 py-2 text-center text-[11px] font-bold text-gray-600 border-b border-l border-gray-200 min-w-[52px]">
                            {String(h).padStart(2,'0')}h
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-[11px] font-bold text-white bg-gray-700 border-b border-l border-gray-500 min-w-[52px]">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coordinadores.length === 0 && (
                        <tr><td colSpan={activeHours.length + 2} className="py-10 text-center text-gray-400">No hay datos. Selecciona un rango y pulsa Consultar.</td></tr>
                      )}
                      {coordinadores.map(coord => {
                        const coordTotal = activeHours.reduce((a,h) => a + (coord.hourTotals[h]?.calls||0), 0);
                        const coordEfec  = activeHours.reduce((a,h) => a + (coord.hourTotals[h]?.efec||0), 0);
                        return (
                          <React.Fragment key={coord.name}>
                            {/* Coordinator row */}
                            <tr className="bg-blue-100/70 border-t-2 border-gray-300">
                              <td className="px-4 py-2.5 font-bold text-blue-900 text-xs border-r border-gray-300 sticky left-0 bg-blue-100/70 z-10">
                                👔 {coord.name}
                              </td>
                              {activeHours.map(h => cell(coord.hourTotals, h))}
                              <td className="px-2 py-2.5 text-center font-bold text-white bg-blue-700 border-l border-blue-600">
                                <div className="text-[11px]">{coordTotal || '—'}</div>
                                <div className="text-[9px] text-blue-200">{coordTotal ? pct(coordEfec,coordTotal)+'%' : ''}</div>
                              </td>
                            </tr>

                            {coord.contratos.map(contr => {
                              const cTotal = activeHours.reduce((a,h) => a + (contr.hourTotals[h]?.calls||0), 0);
                              const cEfec  = activeHours.reduce((a,h) => a + (contr.hourTotals[h]?.efec||0), 0);
                              return (
                                <React.Fragment key={contr.name}>
                                  {/* Contract row */}
                                  <tr className="bg-gray-100 border-t border-gray-300">
                                    <td className="px-4 py-2 pl-8 font-semibold text-gray-700 text-xs border-r border-gray-200 sticky left-0 bg-gray-100 z-10">
                                      📄 {contr.name}
                                    </td>
                                    {activeHours.map(h => cell(contr.hourTotals, h))}
                                    <td className="px-2 py-2 text-center font-semibold text-white bg-gray-600 border-l border-gray-500">
                                      <div className="text-[11px]">{cTotal || '—'}</div>
                                      <div className="text-[9px] text-gray-300">{cTotal ? pct(cEfec,cTotal)+'%' : ''}</div>
                                    </td>
                                  </tr>

                                  {contr.gestores.map(g => {
                                    const gTotal = activeHours.reduce((a,h) => a + (g.hourTotals[h]?.calls||0), 0);
                                    const gEfec  = activeHours.reduce((a,h) => a + (g.hourTotals[h]?.efec||0), 0);
                                    const gPct   = pct(gEfec, gTotal);
                                    return (
                                      <tr key={g.name} className="hover:bg-blue-50/50 transition-colors border-t border-gray-100 cursor-pointer group" onClick={() => jumpToDetail(g.name)}>
                                        <td className="px-4 py-1.5 pl-12 text-xs text-gray-600 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 group-hover:text-blue-700 group-hover:font-semibold">
                                          👤 {g.name}
                                        </td>
                                        {activeHours.map(h => cell(g.hourTotals, h))}
                                        <td className="px-2 py-1.5 text-center bg-gray-800 border-l border-gray-700">
                                          <div className="text-[11px] font-bold text-white">{gTotal || '—'}</div>
                                          <div className={`text-[9px] font-bold ${gPct !== null ? (gPct >= 50 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>{gPct !== null ? gPct+'%' : ''}</div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    {/* Grand totals footer */}
                    {coordinadores.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-900 border-t-4 border-gray-700">
                          <td className="px-4 py-3 font-bold text-white text-xs border-r border-gray-700 sticky left-0 bg-gray-900 z-10">∑ TOTAL CONSOLIDADO</td>
                          {activeHours.map(h => totalCell(hourTotals, h))}
                          <td className="px-2 py-2 text-center bg-gray-700 border-l border-gray-600">
                            <div className="text-[11px] font-bold text-white">
                              {activeHours.reduce((a,h)=>a+(hourTotals[h]?.calls||0),0)}
                            </div>
                            <div className="text-[9px] font-bold text-yellow-300">
                              {(() => { const t=activeHours.reduce((a,h)=>a+(hourTotals[h]?.calls||0),0); const e=activeHours.reduce((a,h)=>a+(hourTotals[h]?.efec||0),0); return t ? pct(e,t)+'%' : ''; })()}
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })()}

          {/* =========================================
              CHARTS TAB 
             ========================================= */}
          {activeTab === 'charts' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="flex bg-blue-50 text-blue-800 p-3 rounded-md items-center gap-2 text-sm border border-blue-200">
                <BarChart2 className="h-4 w-4 flex-none" />
                <span>Analizando datos del Dashboard: {new Date(2000, dashFilters.mes-1, 1).toLocaleString('es', { month: 'long' }).toUpperCase()} {dashFilters.anio} {dashFilters.coordinador ? `(Coordinador: ${dashFilters.coordinador})` : ''}</span>
              </div>

              {loadingDashboard ? (
                 <div className="flex items-center justify-center p-12"><RefreshCw className="h-8 w-8 text-blue-500 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Chart 1: Top Gestores Stacked */}
                  <div className="border border-gray-200 rounded-lg p-5 flex flex-col h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Top 10 Gestores por Volumen</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartDataByGestorTop} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" fontSize={11} hide />
                          <YAxis dataKey="name" type="category" width={80} fontSize={11} />
                          <RechartsTooltip content={<CustomTooltipCharts />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Realizadas" stackId="a" fill={COLORS['Realizada']} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Recibidas" stackId="a" fill={COLORS['Recibida']} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Predictivo" stackId="a" fill={COLORS['Recibida predictivo']} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: % Efectividad vs Average */}
                  <div className="border border-gray-200 rounded-lg p-5 flex flex-col h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Efectividad por Gestor vs Promedio ({avgEffectiveness.toFixed(1)}%)</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartDataEffectiveness} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" interval={0} height={60} />
                          <YAxis fontSize={11} tickFormatter={v => `${v}%`} />
                          <RechartsTooltip content={<CustomTooltipCharts />} cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="efectividad" radius={[4, 4, 0, 0]}>
                            {chartDataEffectiveness.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                          <ReferenceLine y={avgEffectiveness} stroke="#ef4444" strokeDasharray="3 3" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3: Donut Distribution */}
                  <div className="border border-gray-200 rounded-lg p-5 flex flex-col h-[300px]">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Distribución por Tipo de Llamada</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartDataDonut}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {chartDataDonut.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['NN']} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 4: Talk Time Bar Chart */}
                  <div className="border border-gray-200 rounded-lg p-5 flex flex-col h-[300px]">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Top Gestores por Horas al Teléfono</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataTalkTime} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" height={60} interval={0} />
                          <YAxis fontSize={11} tickFormatter={v => `${v}h`} width={40} />
                          <RechartsTooltip content={<CustomTooltipCharts />} cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="horas" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* =========================================
              DETAIL TAB 
             ========================================= */}
          {activeTab === 'detail' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                 <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                   <ListFilter className="h-4 w-4 text-blue-600" /> Registro Individual y Tipificación
                 </h2>
                 <button
                   onClick={handleExportDetail}
                   disabled={filteredDetail.length === 0}
                   className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                   title="Exportar Todo"
                 >
                   <Download className="h-4 w-4" /> CSV Detalle
                 </button>
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gestor / Jefe</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase" title="Efectiva">Ef.</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Habla</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingDetail ? (
                      <tr><td colSpan="8" className="py-12 text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
                    ) : detailPaginated.length === 0 ? (
                      <tr><td colSpan="8" className="py-8 text-center text-gray-500">No hay registros filtrados</td></tr>
                    ) : (
                      detailPaginated.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{new Date(row.fecha).toLocaleString()}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            <span className="font-semibold text-gray-800">{row.adminfo}</span>
                            <br/><span className="text-[10px] text-gray-400">{row.adminfo_jefe_inmediato || '-'}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border
                              ${row.descripcion === 'Realizada' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                row.descripcion === 'Recibida' ? 'bg-green-50 text-green-700 border-green-200' :
                                row.descripcion === 'Recibida predictivo' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }
                            `}>
                              {row.descripcion}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 truncate max-w-[150px]" title={row.from_raw}>{row.from_raw}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">{row.to_number}</td>
                          <td className="px-3 py-2 text-xs">
                            <span className={`inline-flex items-center gap-1 ${row.status === 'Answered' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-xs">
                            {row.vali ? '✅' : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-gray-600 font-medium">
                            {row.talking}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loadingDetail && detailTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">Mostrando {(detailPage - 1) * itemsPerPage + 1} a {Math.min(detailPage * itemsPerPage, filteredDetail.length)} de {filteredDetail.length}</p>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setDetailPage(p => Math.max(1, p - 1))}
                      disabled={detailPage === 1}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => setDetailPage(p => Math.min(detailTotalPages, p + 1))}
                      disabled={detailPage === detailTotalPages}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================
              ALERTAS NN TAB 
             ========================================= */}
          {activeTab === 'nn' && (
            <div className="max-w-5xl mx-auto py-4 animate-in fade-in duration-300 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                   <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5 text-red-500" /> 
                     Gestores no Identificados
                   </h2>
                   <p className="text-sm text-gray-500 mt-1">
                     Nombres o extensiones en 3CX sin mapeo a `adminfo` o cuyo gestor previo ya no se encuentra activo.
                   </p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenAssignModal()} 
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Nueva Relación
                    </button>
                    <button
                      onClick={() => {
                        setShowExistingRelations(!showExistingRelations);
                        if (!showExistingRelations && existingRelations.length === 0) {
                          fetchExistingRelations();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs font-medium rounded-lg transition-colors"
                    >
                      <Users className="h-4 w-4 text-gray-500" />
                      {showExistingRelations ? 'Ocultar Mapeos' : 'Ver Mapeos'}
                    </button>
                    <button 
                      onClick={() => fetchAlertsNN(false, true)} 
                      title="Recargar y regenerar alertas"
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw className={`h-4 w-4 text-gray-600 ${loadingAlerts ? 'animate-spin' : ''}`} />
                    </button>
                 </div>
              </div>

              {/* Drawer/Card de Mapeos Existentes */}
              {showExistingRelations && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Diccionario Actual de Relaciones 3CX ({existingRelations.length})
                      </h3>
                      <p className="text-xs text-gray-500">Mapeos activos de nombres/extensiones 3CX hacia usuarios adminfo.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar mapeo o adminfo..."
                        value={relationsSearch}
                        onChange={(e) => setRelationsSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {loadingRelations ? (
                    <div className="flex justify-center p-6"><RefreshCw className="h-6 w-6 text-blue-500 animate-spin" /></div>
                  ) : filteredExistingRelations.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">No se encontraron relaciones registradas.</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">ID</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">3CX (Nombre / Extensión)</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Adminfo Gestor</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {filteredExistingRelations.map(rel => (
                            <tr key={rel.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-400">{rel.id}</td>
                              <td className="px-3 py-2 font-medium text-gray-800">{rel.nombre}</td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-semibold">
                                  {rel.adminfo}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => handleDeleteRelation(rel.id, rel.nombre, rel.adminfo)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar mapeo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tabla de Alertas NN */}
              {loadingAlerts ? (
                <div className="flex justify-center p-12"><RefreshCw className="h-8 w-8 text-blue-500 animate-spin" /></div>
              ) : alertsData.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-10 flex flex-col items-center justify-center text-green-800 text-center">
                   <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                     <Check className="h-6 w-6 text-green-600" />
                   </div>
                   <h3 className="text-lg font-bold">¡Todo en orden!</h3>
                   <p className="text-sm mt-1 text-green-700">Todos los gestores de las llamadas recientes están identificados correctamente en el diccionario.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Desconocido</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campo Origen</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Alerta</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alertsData.map(alert => (
                        <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{alert.id}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            <span className="font-mono bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                              {alert.valor_sin_relacion}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {alert.origen}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{new Date(alert.fecha_alerta).toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleOpenAssignModal(alert.valor_sin_relacion)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-colors"
                              title="Asignar gestor a este valor"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Asignar Gestor
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(alert.valor_sin_relacion);
                                toast.success('Copiado al portapapeles');
                              }}
                              className="text-gray-500 hover:text-gray-700 inline-flex items-center p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Copiar al portapapeles"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* MODAL PARA ASIGNAR GESTOR A VALOR 3CX */}
              {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">Asignar Relación 3CX - Gestor</h3>
                          <p className="text-xs text-gray-500">Mapea la extensión o identificador telefónico al usuario del gestor</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsAssignModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveRelation} className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Valor en 3CX (Extensión o Nombre)
                        </label>
                        <input
                          type="text"
                          required
                          value={assignValor}
                          onChange={(e) => setAssignValor(e.target.value)}
                          placeholder="Ej: 1048 o PEREZ, JUAN (1048)"
                          className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                          Este es el valor exacto que registra la PBX 3CX en los registros de llamadas.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Gestor Asignado (adminfo)
                        </label>
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={searchGestor}
                              onChange={(e) => setSearchGestor(e.target.value)}
                              placeholder="Buscar por nombre, cédula o adminfo..."
                              className="w-full pl-9 pr-3.5 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100 bg-gray-50/30">
                            {loadingEmployees ? (
                              <div className="p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                Buscando colaboradores coincidentes...
                              </div>
                            ) : !searchGestor.trim() || searchGestor.trim().length < 2 ? (
                              <div className="p-4 text-center text-xs text-gray-400">
                                Escribe al menos 2 letras para buscar por nombre, cédula o adminfo...
                              </div>
                            ) : filteredEmployees.length === 0 ? (
                              <div className="p-4 text-center text-xs text-gray-500 space-y-2">
                                <p>No se encontraron colaboradores con "{searchGestor}".</p>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAdminfo(searchGestor.trim().toLowerCase())}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                >
                                  Usar "{searchGestor.trim()}" como adminfo
                                </button>
                              </div>
                            ) : (
                              filteredEmployees.map(emp => {
                                const isSelected = selectedAdminfo.toLowerCase() === emp.adminfo?.toLowerCase();
                                return (
                                  <button
                                    type="button"
                                    key={emp.cedula || emp.adminfo}
                                    onClick={() => setSelectedAdminfo(emp.adminfo)}
                                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                                      isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-gray-100/70 text-gray-700'
                                    }`}
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900">{emp.nombre}</p>
                                      <p className="text-[11px] text-gray-500">{emp.cargo || 'Sin cargo'} · C.C. {emp.cedula}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                                      isSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                      {emp.adminfo}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>

                          <div className="pt-1">
                            <label className="text-[11px] text-gray-500 mb-1 block">O escribe el código `adminfo` directamente:</label>
                            <input
                              type="text"
                              required
                              value={selectedAdminfo}
                              onChange={(e) => setSelectedAdminfo(e.target.value)}
                              placeholder="Ej: amchaparro"
                              className="w-full px-3.5 py-1.5 text-xs font-mono font-bold text-blue-900 bg-blue-50/50 border border-blue-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsAssignModalOpen(false)}
                          className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingRelation || !assignValor.trim() || !selectedAdminfo.trim()}
                          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          {isSavingRelation ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Guardando y recalculando...
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Guardar y Recalcular
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

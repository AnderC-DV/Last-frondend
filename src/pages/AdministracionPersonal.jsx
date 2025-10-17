import React, { useState, useMemo, useCallback } from 'react';
import ModernModal from '../components/ModernModal';
import IngresoPersonalForm from '../components/IngresoPersonalForm';
import RetiroPersonalForm from '../components/RetiroPersonalForm';
import ProveedoresForm from '../components/ProveedoresForm';
import { UserPlus, UserMinus, Briefcase, Search, Filter, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import useDebounce from '../hooks/useDebounce';
import { exportToCSV, exportToXLSX } from '../utils/exportToCSV';

// --- Iconos para las tarjetas de opciones (usando lucide-react) ---
const UserPlusIcon = () => <UserPlus className="h-10 w-10 text-blue-600 mb-4" />;
const UserMinusIcon = () => <UserMinus className="h-10 w-10 text-red-600 mb-4" />;
const BriefcaseIcon = () => <Briefcase className="h-10 w-10 text-green-600 mb-4" />;

const AdministracionPersonal = () => {
  const [openModal, setOpenModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === GESTIÓN DE PERSONAL ===
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('todos');
  const [filterDepartamento, setFilterDepartamento] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [personalData, setPersonalData] = useState([]); // TODO: Conectar API
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // === DATOS MOCK (reemplazar con API) ===
  const mockPersonal = [
    {
      id: 'emp-001',
      nombre: 'Juan Pérez García',
      email: 'juan.perez@empresa.com',
      telefono: '3001234567',
      cedula: '1234567890',
      rol: 'supervisor',
      departamento: 'Recursos Humanos',
      salario: 2500000,
      fechaIngreso: '2025-01-15',
      estado: 'activo',
    },
    {
      id: 'emp-002',
      nombre: 'María López Martínez',
      email: 'maria.lopez@empresa.com',
      telefono: '3009876543',
      cedula: '0987654321',
      rol: 'empleado',
      departamento: 'Ventas',
      salario: 2000000,
      fechaIngreso: '2025-02-01',
      estado: 'activo',
    },
    {
      id: 'emp-003',
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@empresa.com',
      telefono: '3005555555',
      cedula: '5555555555',
      rol: 'gerente',
      departamento: 'Operaciones',
      salario: 3500000,
      fechaIngreso: '2024-06-10',
      estado: 'activo',
    },
  ];

  // === FILTRADO INTELIGENTE ===
  const filteredPersonal = useMemo(() => {
    let filtered = [...mockPersonal];

    // Filtro por búsqueda
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.telefono.includes(term) ||
        p.cedula.includes(term)
      );
    }

    // Filtro por rol
    if (filterRol !== 'todos') {
      filtered = filtered.filter(p => p.rol === filterRol);
    }

    // Filtro por departamento
    if (filterDepartamento !== 'todos') {
      filtered = filtered.filter(p => p.departamento === filterDepartamento);
    }

    return filtered;
  }, [debouncedSearchTerm, filterRol, filterDepartamento]);

  // === PAGINACIÓN ===
  const totalPages = Math.ceil(filteredPersonal.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedPersonal = filteredPersonal.slice(startIdx, endIdx);

  // === OPCIONES PARA FILTROS ===
  const rolesUnicos = ['todos', ...new Set(mockPersonal.map(p => p.rol))];
  const departamentosUnicos = ['todos', ...new Set(mockPersonal.map(p => p.departamento))];

  // === HANDLERS ===
  const handleFormSubmit = async (formKey, data) => {
    setIsSubmitting(true);
    try {
      console.log(`Formulario ${formKey} enviado:`, data);
      // TODO: Conectar API
      // await api.createPersonal(data);
      toast.success(`${formKey} registrado correctamente`);
      setOpenModal(null);
      // Recargar lista (mock)
      setPersonalData([...personalData, { ...data, id: Date.now() }]);
    } catch (error) {
      toast.error(`Error al registrar ${formKey}: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = (personal) => {
    setSelectedPersonal(personal);
    setViewDetailModal(true);
  };

  const handleEdit = (personal) => {
    setSelectedPersonal(personal);
    setEditFormData(personal);
    setEditModal(true);
  };

  const handleDeleteClick = (personal) => {
    setSelectedPersonal(personal);
    setDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      console.log('Eliminando personal:', selectedPersonal.id);
      // TODO: Conectar API
      // await api.deletePersonal(selectedPersonal.id);
      toast.success('Empleado eliminado correctamente');
      setDeleteConfirmModal(false);
      // Actualizar lista (mock)
      setPersonalData(personalData.filter(p => p.id !== selectedPersonal.id));
    } catch (error) {
      toast.error(`Error al eliminar: ${error.message}`);
    }
  };

  const handleSaveEdit = async () => {
    try {
      console.log('Guardando cambios:', editFormData);
      // TODO: Conectar API
      // await api.updatePersonal(editFormData.id, editFormData);
      toast.success('Cambios guardados correctamente');
      setEditModal(false);
    } catch (error) {
      toast.error(`Error al guardar: ${error.message}`);
    }
  };

  // Resetear paginación cuando cambian filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterRol, filterDepartamento]);

  const formConfigs = {
    ingreso: {
      title: 'Ingreso de Personal',
      icon: <UserPlusIcon />,
      component: (
        <IngresoPersonalForm
          onSubmit={(data) => handleFormSubmit('Empleado', data)}
          isSubmitting={isSubmitting}
        />
      ),
    },
    retiro: {
      title: 'Retiro de Personal',
      icon: <UserMinusIcon />,
      component: (
        <RetiroPersonalForm
          onSubmit={(data) => handleFormSubmit('Retiro', data)}
          isSubmitting={isSubmitting}
        />
      ),
    },
    proveedores: {
      title: 'Creación de Usuarios para Proveedores',
      icon: <BriefcaseIcon />,
      component: (
        <ProveedoresForm
          onSubmit={(data) => handleFormSubmit('Proveedor', data)}
          isSubmitting={isSubmitting}
        />
      ),
    },
  };

  // --- FUNCIONES DE EXPORTACIÓN ---
  const handleExportCSV = useCallback(() => {
    if (filteredPersonal.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const columns = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'email', label: 'Email' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'cedula', label: 'Cédula' },
      { key: 'rol', label: 'Rol' },
      { key: 'departamento', label: 'Departamento' },
      { key: 'salario', label: 'Salario' },
      { key: 'fechaIngreso', label: 'Fecha Ingreso' },
      { key: 'estado', label: 'Estado' },
    ];

    const timestamp = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    const filename = `personal_${timestamp}.csv`;

    exportToCSV(filteredPersonal, filename, columns);
    toast.success(`✅ Exportado ${filteredPersonal.length} registros a CSV`);
  }, [filteredPersonal]);

  const handleExportExcel = useCallback(async () => {
    if (filteredPersonal.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const columns = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'email', label: 'Email' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'cedula', label: 'Cédula' },
      { key: 'rol', label: 'Rol' },
      { key: 'departamento', label: 'Departamento' },
      { key: 'salario', label: 'Salario' },
      { key: 'fechaIngreso', label: 'Fecha Ingreso' },
      { key: 'estado', label: 'Estado' },
    ];

    const timestamp = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    const filename = `personal_${timestamp}.xlsx`;

    try {
      const success = await exportToXLSX(filteredPersonal, filename, 'Personal', columns);
      if (success) {
        toast.success(`✅ Exportado ${filteredPersonal.length} registros a Excel`);
      } else {
        toast.error('❌ No se pudo exportar a Excel. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('❌ Error durante la exportación. Intenta de nuevo.');
    }
  }, [filteredPersonal]);

  return (
    <>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* SECCIÓN 1: ACCIONES RÁPIDAS */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Módulo de Administración de Personal
            </h1>
            <p className="text-gray-600 mb-8">
              Gestiona el personal, ingreso, retiro y proveedores desde una sola plataforma.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Tarjeta 1: Ingreso de Personal */}
              <button
                onClick={() => setOpenModal('ingreso')}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-center flex flex-col items-center"
              >
                <UserPlusIcon />
                <h2 className="text-xl font-semibold text-gray-800">Ingreso de Personal</h2>
                <p className="text-gray-500 mt-2">Gestionar el alta de nuevos empleados.</p>
              </button>

              {/* Tarjeta 2: Retiro de Personal */}
              <button
                onClick={() => setOpenModal('retiro')}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-center flex flex-col items-center"
              >
                <UserMinusIcon />
                <h2 className="text-xl font-semibold text-gray-800">Retiro de Personal</h2>
                <p className="text-gray-500 mt-2">Gestionar la baja de empleados.</p>
              </button>

              {/* Tarjeta 3: Creación de Usuarios para Proveedores */}
              <button
                onClick={() => setOpenModal('proveedores')}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-center flex flex-col items-center"
              >
                <BriefcaseIcon />
                <h2 className="text-xl font-semibold text-gray-800">Usuarios para Proveedores</h2>
                <p className="text-gray-500 mt-2">Crear y administrar accesos para proveedores.</p>
              </button>
            </div>
          </div>

          {/* SECCIÓN 2: GESTIÓN DE PERSONAL */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Eye className="h-6 w-6 text-green-600" />
                Gestión de Personal
              </h2>
              <p className="text-gray-600 text-sm mt-1">Busca, filtra y gestiona empleados</p>
            </div>

            {/* Búsqueda y Filtros */}
            <div className="p-6 border-b border-gray-200 bg-gray-50 space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Rol
                  </label>
                  <select
                    value={filterRol}
                    onChange={(e) => setFilterRol(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {rolesUnicos.map(rol => (
                      <option key={rol} value={rol}>
                        {rol === 'todos' ? 'Todos los roles' : rol.charAt(0).toUpperCase() + rol.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Departamento
                  </label>
                  <select
                    value={filterDepartamento}
                    onChange={(e) => setFilterDepartamento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {departamentosUnicos.map(dept => (
                      <option key={dept} value={dept}>
                        {dept === 'todos' ? 'Todos los departamentos' : dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones de Exportación */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors border border-blue-200"
                  title="Descargar en formato CSV"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors border border-green-200"
                  title="Descargar en formato Excel"
                >
                  <FileText className="h-4 w-4" />
                  <span>Exportar Excel</span>
                </button>
              </div>

              {/* Info de resultados */}
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-800">{paginatedPersonal.length}</span> de <span className="font-semibold text-gray-800">{filteredPersonal.length}</span> registros
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Departamento</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha Ingreso</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPersonal.length > 0 ? (
                    paginatedPersonal.map((personal) => (
                      <tr key={personal.id} className="hover:bg-green-50 transition-colors duration-150">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{personal.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{personal.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 capitalize">
                            {personal.rol}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{personal.departamento}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(personal.fechaIngreso).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(personal)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(personal)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(personal)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <p className="text-lg font-semibold">No hay registros</p>
                        <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {filteredPersonal.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                  </select>

                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Ver Detalles */}
      {selectedPersonal && (
        <ModernModal
          isOpen={viewDetailModal}
          onClose={() => setViewDetailModal(false)}
          title={`Detalles - ${selectedPersonal.nombre}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Nombre</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedPersonal.nombre}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Cédula</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedPersonal.cedula}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedPersonal.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Teléfono</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedPersonal.telefono}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Rol</p>
                <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{selectedPersonal.rol}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Departamento</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedPersonal.departamento}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Salario</p>
                <p className="text-sm font-medium text-gray-900 mt-1">${selectedPersonal.salario.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Fecha Ingreso</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{new Date(selectedPersonal.fechaIngreso).toLocaleDateString('es-CO')}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Estado</p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                selectedPersonal.estado === 'activo' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedPersonal.estado.charAt(0).toUpperCase() + selectedPersonal.estado.slice(1)}
              </span>
            </div>
          </div>
        </ModernModal>
      )}

      {/* MODAL: Editar Personal */}
      {editFormData && (
        <ModernModal
          isOpen={editModal}
          onClose={() => setEditModal(false)}
          title={`Editar - ${editFormData.nombre}`}
          size="md"
          actions={
            <div className="flex gap-3">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={editFormData.nombre}
                onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={editFormData.telefono}
                  onChange={(e) => setEditFormData({...editFormData, telefono: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={editFormData.rol}
                  onChange={(e) => setEditFormData({...editFormData, rol: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="empleado">Empleado</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="gerente">Gerente</option>
                  <option value="director">Director</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={editFormData.departamento}
                  onChange={(e) => setEditFormData({...editFormData, departamento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario</label>
              <input
                type="number"
                value={editFormData.salario}
                onChange={(e) => setEditFormData({...editFormData, salario: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </ModernModal>
      )}

      {/* MODAL: Confirmar Eliminación */}
      {selectedPersonal && (
        <ModernModal
          isOpen={deleteConfirmModal}
          onClose={() => setDeleteConfirmModal(false)}
          title="Confirmar eliminación"
          size="sm"
          actions={
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar a <span className="font-semibold">{selectedPersonal.nombre}</span>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                Esta acción no se puede deshacer. Se eliminarán todos los datos del empleado.
              </p>
            </div>
          </div>
        </ModernModal>
      )}

      {/* MODAL: Formularios (Ingreso, Retiro, Proveedores) */}
      {openModal && formConfigs[openModal] && (
        <ModernModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
          title={formConfigs[openModal].title}
          icon={formConfigs[openModal].icon}
          size="lg"
        >
          {formConfigs[openModal].component}
        </ModernModal>
      )}
    </>
  );
};

export default AdministracionPersonal;
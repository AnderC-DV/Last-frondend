import React, { useState } from 'react';
import ModernModal from '../components/ModernModal';
import IngresoPersonalForm from '../components/IngresoPersonalForm';
import RetiroPersonalForm from '../components/RetiroPersonalForm';
import ProveedoresForm from '../components/ProveedoresForm';
import { UserPlus, UserMinus, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

// --- Iconos para las tarjetas de opciones (usando lucide-react) ---
const UserPlusIcon = () => <UserPlus className="h-10 w-10 text-blue-600 mb-4" />;
const UserMinusIcon = () => <UserMinus className="h-10 w-10 text-red-600 mb-4" />;
const BriefcaseIcon = () => <Briefcase className="h-10 w-10 text-green-600 mb-4" />;

const AdministracionPersonal = () => {
  const [openModal, setOpenModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (formKey, data) => {
    setIsSubmitting(true);
    try {
      // Simular envío (reemplazar con llamada API real)
      console.log(`Formulario ${formKey} enviado:`, data);
      
      // TODO: Reemplazar con llamada API real
      // await sendPersonalData(formKey, data);
      
      toast.success(`${formKey} registrado correctamente`);
      setOpenModal(null);
    } catch (error) {
      toast.error(`Error al registrar ${formKey}: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Módulo de Administración de Personal
          </h1>
          <p className="text-gray-600 mb-8">
            Seleccione una de las siguientes opciones para comenzar.
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
      </div>

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
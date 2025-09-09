import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import loginBgImage from '../assets/LogoAT.png';
import loginIllustration from '../assets/ilustracion-login.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { checkUserIdentifier, loginWithPassword, firstTimeLogin } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("identifier"); // identifier, password, firstTime
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const handleIdentifierSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await checkUserIdentifier(identifier);
      setUserInfo(data);
      if (data.status === 'FIRST_TIME_LOGIN' || data.status === 'new_user_authorized') {
        setStep("firstTime");
      } else if (data.status === 'ACTIVE' || data.status === 'existing_user') {
        setStep("password");
      } else {
        setError(`El estado del usuario '${data.status}' no permite el acceso.`);
      }
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginWithPassword(identifier, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleFirstTimeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await firstTimeLogin(identifier, newPassword);
      // Después de crear la contraseña, intentar el login automáticamente
      await loginWithPassword(identifier, newPassword);
      navigate("/");
    } catch (err) {
      setError(err.message || "No se pudo crear la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
      <div className="hidden md:flex flex-col items-center justify-center bg-gray-100 p-12 relative">
        <div className="absolute inset-0 w-full h-full">
          <img
            src={loginIllustration}
            alt="Ilustración de finanzas y tecnología"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-end h-full p-8 text-center pb-10">
          <h2 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">Gestión Financiera Inteligente</h2>
          <p className="mt-2 text-gray-200 max-w-md drop-shadow-lg">Potencia tus decisiones con datos y automatización.</p>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center bg-gray-50 p-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="flex flex-col items-center mb-4">
            <img src={loginBgImage} alt="Logo AuraTech" className="w-35 h-35 object-contain mb-1" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bienvenido a AuraTech</h1>
            <p className="text-gray-600">El corazon de Renovar Financiera</p>
          </div>
          {step === "identifier" && (
            <form onSubmit={handleIdentifierSubmit} className="w-full">
              <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">Inicia Sesión</h2>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">Correo Electrónico o Usuario Adminfo</label>
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="usuario@correo.com o tu código" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition disabled:bg-blue-300">
                {loading ? "Verificando..." : "Siguiente"}
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="w-full">
                <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">Hola, {userInfo?.full_name}</h2>
                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Contraseña</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition disabled:bg-blue-300">
                    {loading ? "Ingresando..." : "Ingresar"}
                </button>
            </form>
          )}

          {step === "firstTime" && (
             <form onSubmit={handleFirstTimeSubmit} className="w-full">
                <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">Crea tu contraseña, {userInfo?.full_name}</h2>
                <p className="text-sm text-center text-gray-500 mb-4">Es tu primer acceso. Por favor, crea una contraseña segura.</p>
                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Nueva contraseña</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition disabled:bg-blue-300">
                    {loading ? "Creando..." : "Crear y Continuar"}
                </button>
             </form>
          )}

          {error && <div className="mt-4 text-red-600 text-sm text-center">{error}</div>}

          <p className="mt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} AuraTech. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

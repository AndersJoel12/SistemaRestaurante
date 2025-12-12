import React, { useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import ReCAPTCHA from "react-google-recaptcha";

// MEJORA: Usamos una variable de entorno para la API. 
// Si no existe, usa localhost por defecto. Esto evita errores al subir a producción.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"; 

function SignUpModal({ isOpen, onClose, onLoginSuccess }) {
  const { loginUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  // Si no está abierto, no renderizamos nada (limpieza del DOM)
  if (!isOpen) return null;

  const onChangeCaptcha = (token) => {
    setCaptchaToken(token);
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    // Validaciones
    const newErrors = {};
    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "Debe ingresar un correo electrónico válido.";
    }
    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria.";
    }

    if (!captchaToken) {
      setApiError("Por favor, confirma que no eres un robot.");
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Usamos la variable API_URL definida arriba
      const response = await axios.post(`${API_URL}/token/`, { 
        email, 
        password,
        recaptcha_token: captchaToken 
      });
      
      const data = response.data;
      
      if (data.access) {
        const decodedToken = jwtDecode(data.access);
        const role = decodedToken.rol;

        const usuarioSesion = {
          email: email,
          rol: role,
          token: data.access,
        };
        sessionStorage.setItem("usuario_sesion", JSON.stringify(usuarioSesion));

        loginUser(data);
        if (onLoginSuccess) onLoginSuccess(role);

        // Limpieza
        setEmail("");
        setPassword("");
        setErrors({});
        setCaptchaToken(null);
        onClose();
      }
    } catch (error) {
      if (captchaRef.current) captchaRef.current.reset();
      setCaptchaToken(null);

      if (error.response?.status === 401) {
        setApiError("Credenciales incorrectas. Verifique correo y contraseña.");
      } else {
        setApiError("Error de conexión. Intente más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // ACCESIBILIDAD: role="dialog" y aria-modal="true" notifican al navegador que esto es un popup
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Fondo oscuro (Backdrop) */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true" // Ocultamos el fondo a los lectores de pantalla
      ></div>

      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm z-10 animate-fade-in-up">
        <h2 id="modal-title" className="text-xl font-bold text-red-600 mb-4 text-center">
          Iniciar Sesión
        </h2>
        
        {/* ACCESIBILIDAD: role="alert" hace que el lector de pantalla lea el error inmediatamente aparezca */}
        {apiError && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
            <p className="font-bold">Error</p>
            <p>{apiError}</p>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {/* CAMPO EMAIL */}
          <div>
            {/* CORRECCIÓN 4.1.2: htmlFor conecta con el id del input */}
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // ARIA: Indica si hay error y cuál elemento describe el error
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.email 
                  ? "border-red-500 ring-red-100 bg-red-50" 
                  : "border-gray-300 focus:ring-red-500 focus:border-red-500"
              }`}
              placeholder="ejemplo@correo.com"
            />
            {/* El ID del error debe coincidir con aria-describedby */}
            {errors.email && (
              <p id="email-error" className="text-red-600 text-xs mt-1 font-medium">
                {errors.email}
              </p>
            )}
          </div>

          {/* CAMPO PASSWORD */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.password 
                  ? "border-red-500 ring-red-100 bg-red-50" 
                  : "border-gray-300 focus:ring-red-500 focus:border-red-500"
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p id="password-error" className="text-red-600 text-xs mt-1 font-medium">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex justify-center my-4">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={onChangeCaptcha}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-bold tracking-wide transition-all shadow-md 
              ${loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-red-600 hover:bg-red-700 hover:shadow-lg active:scale-95"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Verificando...
              </span>
            ) : "Acceder"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default SignUpModal;
import React, { useState, useRef } from "react"; // 👉 Agregamos useRef
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import ReCAPTCHA from "react-google-recaptcha"; // 👉 Importamos la librería

const LOGIN_URL = "http://localhost:8000/token/";

function SignUpModal({ isOpen, onClose, onLoginSuccess }) {
  const { loginUser } = useAuth();
  
  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // 👉 Estados para el CAPTCHA
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  if (!isOpen) return null;

  // 👉 Función que se ejecuta cuando el usuario resuelve el Captcha
  const onChangeCaptcha = (token) => {
    setCaptchaToken(token);
    // Si había un error previo de API, lo limpiamos visualmente
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    // 1. Validaciones básicas de inputs
    const newErrors = {};
    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "Debe ingresar un correo electrónico válido.";
    }
    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    // 👉 2. Validación del CAPTCHA
    if (!captchaToken) {
      setApiError("Por favor, confirma que no eres un robot.");
      return; // Detenemos la función aquí si no hay captcha
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // 👉 3. Enviamos el token junto con los datos
      const response = await axios.post(LOGIN_URL, { 
        email, 
        password,
        recaptcha_token: captchaToken // Aquí va el ticket
      });
      
      const data = response.data;
      const accessToken = data.access;

      if (accessToken) {
        const decodedToken = jwtDecode(accessToken);
        const role = decodedToken.rol;

        const usuarioSesion = {
          email: email,
          rol: role,
          token: accessToken,
        };
        sessionStorage.setItem("usuario_sesion", JSON.stringify(usuarioSesion));

        loginUser(data);
        if (onLoginSuccess) onLoginSuccess(role);

        // Limpieza exitosa
        setEmail("");
        setPassword("");
        setErrors({});
        setCaptchaToken(null); // Limpiamos token
        onClose();
      } else {
        setApiError("Respuesta inválida del servidor.");
      }
    } catch (error) {
      // 👉 4. Si falla el login, reseteamos el Captcha para que lo intenten de nuevo
      if (captchaRef.current) {
        captchaRef.current.reset();
      }
      setCaptchaToken(null);

      if (error.response?.status === 401) {
        setApiError("Correo electrónico o contraseña incorrectos.");
      } else if (error.request) {
        setApiError("Error del servidor. Inténtalo más tarde.");
      } else {
        setApiError("Error inesperado: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm z-10">
        <h2 className="text-xl font-bold text-red-600 mb-4">Iniciar Sesión</h2>
        
        {apiError && (
          <div className="text-red-600 text-sm mb-4 p-2 bg-red-100 border border-red-300 rounded">
            {apiError}
          </div>
        )}
        
        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? "border-red-500 ring-red-500" : "focus:ring-red-500"
              }`}
              placeholder="Ej: usuario@gmail.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password ? "border-red-500 ring-red-500" : "focus:ring-red-500"
              }`}
              placeholder="Contraseña Secreta"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* 👉 AQUÍ AGREGAMOS EL COMPONENTE VISUAL DEL CAPTCHA */}
          <div className="flex justify-center my-4">

          <ReCAPTCHA
            ref={captchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} // 👈 ¡Así se llama a la variable!
            onChange={onChangeCaptcha}
          />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
          >
            {loading ? "Verificando..." : "Acceder"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:underline cursor-pointer block w-full text-center"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default SignUpModal;
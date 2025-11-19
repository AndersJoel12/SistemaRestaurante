import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

const LOGIN_URL = "http://localhost:8000/token/";

function SignUpModal({ isOpen, onClose, onLoginSuccess }) {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const newErrors = {};
    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "Debe ingresar un correo electrónico válido.";
    }
    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(LOGIN_URL, { email, password });
      const data = response.data;
      const accessToken = data.access;

      if (accessToken) {
        const decodedToken = jwtDecode(accessToken);
        const role = decodedToken.rol;

        const usuarioSesion = {
          email: email, // 👈 usamos el input directamente
          rol: role,
          token: accessToken,
        };
        sessionStorage.setItem("usuario_sesion", JSON.stringify(usuarioSesion));

        loginUser(data);
        if (onLoginSuccess) onLoginSuccess(role);

        setEmail("");
        setPassword("");
        setErrors({});
        onClose();
      } else {
        setApiError("Respuesta inválida del servidor.");
      }
    } catch (error) {
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
            <label
              htmlFor="modal-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Correo Electrónico
            </label>
            <input
              type="email"
              id="modal-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-500 ring-red-500"
                  : "focus:ring-red-500"
              }`}
              placeholder="Ej: usuario@gmail.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="modal-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="modal-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-500 ring-red-500"
                  : "focus:ring-red-500"
              }`}
              placeholder="Contraseña Secreta"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
          >
            {loading ? "Accediendo..." : "Acceder"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:underline cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default SignUpModal;

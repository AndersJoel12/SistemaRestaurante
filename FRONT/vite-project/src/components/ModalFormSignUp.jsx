import React, { useState } from "react";
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from 'jwt-decode';
// Se eliminó la importación problemática: import './Components.css';

const LOGIN_URL = 'http://localhost:8000/token/';

function SignUpModal({ isOpen, onClose, onLoginSuccess }) {
  const { loginUser } = useAuth();

  // Estado para Correo y Contraseña

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loanding, setLoanding] = useState(false);

  if (!isOpen) return null;

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
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoanding(true);  

  try {
    const response = await axios.post(LOGIN_URL, {
      email: email,
      password: password
    });
    
    const data = response.data;

    const accessToken = data.access;

    if (accessToken) {
      const decodedToken = jwtDecode(accessToken);
      console.log(decodedToken);
      const role = decodedToken.rol;

      loginUser(data); // Actualiza el contexto de autenticación

      if (onLoginSuccess) {
        onLoginSuccess(role); // Notifica al componente padre sobre el inicio de sesión exitoso
      }

      setEmail('');
      setPassword('');
      setErrors('');
      setErrors({});
      onClose();

    } else {
      setApiError("Respuesta inválida del servidor.");
    }   
  } catch (error) {
    if (error.response && error.response.status === 401) {
      setApiError("Correo electrónico o contraseña incorrectos.");
    } else if (error.request) {
      setApiError("Error del servidor. Por favor, inténtelo de nuevo más tarde.");
    } else {
      setApiError('Error inesperado: ' + error.message);
    }
  } finally {
    setLoanding(false);
  }
}


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 opacity-100"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm z-10 transform transition-all duration-300 opacity-100 scale-100">
        <h2 className="text-xl font-bold text-red-600 mb-4">Iniciar Sesión</h2>
        {apiError && (
                <div className="text-red-600 text-sm mb-4 p-2 bg-red-100 border border-red-300 rounded">
                    {apiError}
                </div>
        )}
        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          {/* --- CAMPO DE CORREO ELECTRÓNICO --- */}
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
              placeholder="Ej: Alverojesus5@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-500 ring-red-500"
                  : "focus:ring-red-500"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* --- CAMPO DE CONTRASEÑA --- */}
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
              placeholder="Contraseña Secreta"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-500 ring-red-500"
                  : "focus:ring-red-500"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loanding}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition cursor-pointer"
          >
            Acceder
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

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import SignUpModal from "../components/ModalFormSignUp";
import Logo from "../assets/logo.png";
import "../views/ViewStyles.css";

// ----------------------------------------------------------------------
// 1. COMPONENTE EXTRAÍDO: Modal de Invitado
// Lo sacamos del "Home" principal para limpiar el código.
// Este componente se encarga de su propia lógica (Captcha y Mesa Dummy).
// ----------------------------------------------------------------------
const GuestAccessModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const captchaRef = useRef(null);

  // Si el modal no está abierto, no renderizamos nada (limpieza del DOM)
  if (!isOpen) return null;

  const handleCaptchaResolved = (token) => {
    if (token) {
      // Simulación de pequeña espera para UX
      setTimeout(() => {
        // DATOS: Estructura que debería coincidir con tu modelo Django/Postgres
        const virtualTable = {
          id: 999,
          number: "999",
          capacity: 1,
          status: "virtual", // Esto ayuda al backend a saber que no es una mesa física
        };

        sessionStorage.setItem("mesa_activa", JSON.stringify(virtualTable));
        onClose(); // Cerramos modal
        navigate("/menu");
      }, 500);
    }
  };

  const handleCancel = () => {
    // Reseteamos el captcha si el usuario cancela, por seguridad
    if (captchaRef.current) captchaRef.current.reset();
    onClose();
  };

  return (
    // APLICANDO REGLA 4.1.2: Accesibilidad Robusta
    // role="dialog": Dice "esto es una ventana, no parte del fondo".
    // aria-modal="true": Dice "el fondo está inactivo, enfócate aquí".
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center relative border-t-4 border-red-600 transform transition-all scale-100">
        
        {/* ID para conectar con aria-labelledby */}
        <h3 id="modal-title" className="text-xl font-extrabold text-gray-800 mb-2">
          Seguridad
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          Confirma que eres humano para ver el menú.
        </p>

        <div className="flex justify-center mb-6">
          <ReCAPTCHA
            ref={captchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaResolved}
          />
        </div>

        <button
          onClick={handleCancel}
          className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 hover:shadow-lg transition-all duration-300 active:scale-95 uppercase tracking-wide text-sm"
          aria-label="Cancelar acceso como invitado"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL: Home
// Ahora es mucho más limpio y fácil de leer.
// ----------------------------------------------------------------------
function Home() {
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const navigate = useNavigate();

  // Lógica de redirección del Staff
  const getRedirectPath = (role) => {
    const normalizedRole = (role || "").toLowerCase();
    const paths = {
      administrador: "/manage-users",
      cocinero: "/kitchen",
      mesero: "/tables",
    };
    return paths[normalizedRole] || "/unauthorized";
  };

  const handleLoginSuccess = (role) => {
    setShowStaffModal(false);
    navigate(getRedirectPath(role));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <main
        className="bg-white shadow-xl hover:shadow-2xl transition-shadow duration-500 rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center border-t-8 border-red-700 relative"
      >
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">
          Bienvenido a
          <span className="text-4xl sm:text-5xl font-black text-red-700 block mt-1">
            Dattebayo
          </span>
        </h1>

        <p className="text-gray-500 mb-6 text-sm sm:text-base">
          Sistema de Gestión de Restaurante
        </p>

        <img
          src={Logo}
          alt="Logotipo de Dattebayo Ramen"
          className="mx-auto mb-8 w-32 sm:w-40 h-auto object-contain transition-transform duration-500 hover:scale-105"
        />

        <div className="flex flex-col gap-4 text-center">
          {/* Botón Pedido */}
          <button
            onClick={() => setShowGuestModal(true)}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-yellow-500 to-red-600 text-white font-extrabold text-lg sm:text-xl rounded-xl shadow-lg shadow-red-300/50 hover:shadow-red-500/70 hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer active:scale-95 border-b-4 border-yellow-700"
            aria-label="Realizar pedido como invitado"
          >
            <span className="mr-3 text-2xl" aria-hidden="true">🛒</span>
            <span>Realizar Pedido</span>
          </button>

          <div className="text-gray-400 font-bold uppercase text-xs pt-1" aria-hidden="true">O</div>

          {/* Botón Staff */}
          <button
            onClick={() => setShowStaffModal(true)}
            className="w-full inline-flex items-center justify-center px-4 py-3 text-red-600 font-semibold text-base rounded-xl border-2 border-red-100 hover:bg-red-50 transition-colors duration-300 cursor-pointer shadow-sm active:shadow-inner"
            aria-label="Acceder al panel de personal"
          >
            <span className="mr-2 text-xl" aria-hidden="true">🧑‍🍳</span>
            <span>Acceso de Personal</span>
          </button>
        </div>

        <footer className="block text-xs text-gray-400 mt-6">
          Desarrollo y Soporte por <span className="font-semibold text-red-600 ml-1">DeliGo</span>
        </footer>
      </main>

      {/* Modales separados limpiamente */}
      <SignUpModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <GuestAccessModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
      />
    </div>
  );
}

export default Home;
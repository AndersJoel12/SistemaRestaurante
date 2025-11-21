import "../views/ViewStyles.css";
import Logo from "../assets/logo.png";
import { useState } from "react";
import SignUpModal from "../components/ModalFormSignUp";
import { useNavigate } from "react-router-dom";

function Home() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // --- LÓGICA DE REDIRECCIÓN POR ROL (SIN CAMBIOS) ---
  const getRedirectPath = (role) => {
    const normalizedRole = (role || "").toLowerCase();
    switch (normalizedRole) {
      case "administrador":
        return "/manage-users";
      case "cocinero":
        return "/kitchen";
      case "mesero":
        return "/tables";
      default:
        return "/unauthorized";
    }
  };

  const handleLoginSuccess = (role) => {
    setShowModal(false);
    if (role) {
      const path = getRedirectPath(role);
      navigate(path);
    } else {
      navigate("/unauthorized");
    }
  };

  // --- LÓGICA PARA CLIENTE (MESA 999 - SIN CAMBIOS) ---
  const handleGuestOrder = () => {
    const dummyTable = {
      id: 999,
      number: "999",
      capacity: 1,
      status: "virtual",
    };

    sessionStorage.setItem("mesa_activa", JSON.stringify(dummyTable));
    navigate("/menu");
  };

  return (
    // Contenedor principal responsive: ocupa toda la altura, centrado, fondo gris.
    // Usamos 'md:p-8' para aumentar el padding en pantallas más grandes
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Tarjeta de bienvenida: Sombra y esquinas mejoradas, ancho adaptativo */}
      <div
        className="bg-white shadow-xl hover:shadow-2xl transition-shadow duration-500 rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center border-t-8 border-red-700"
        role="main" // Indica el contenido principal de la página
        aria-label="Menú de Acceso y Pedido" // Etiqueta descriptiva para lectores de pantalla
      >
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">
          Bienvenido a{/* Nombre de la marca con énfasis visual y ARIA */}
          <span
            className="text-4xl sm:text-5xl font-black text-red-700 block mt-1"
            aria-hidden="true"
          >
            Dattebayo
          </span>
        </h1>

        <p className="text-gray-500 mb-6 text-sm sm:text-base">
          Sistema de Gestión de Restaurante
        </p>

        {/* Logo: Centrado y con accesibilidad para la imagen */}
        <img
          src={Logo}
          alt="Logo del Restaurante Dattebayo"
          className="mx-auto mb-8 w-32 sm:w-40 h-auto object-contain transition-transform duration-500 hover:scale-105"
        />

        <div
          className="flex flex-col gap-4 text-center"
          role="group"
          aria-label="Opciones de Acceso"
        >
          {/* 🎯 1. BOTÓN PRINCIPAL: REALIZAR PEDIDO (Optimizado para el toque en móviles) */}
          <button
            onClick={handleGuestOrder}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-yellow-500 to-red-600 text-white font-extrabold text-lg sm:text-xl rounded-xl shadow-lg shadow-red-300/50 hover:shadow-red-500/70 hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer active:scale-95 border-b-4 border-yellow-700"
            aria-label="Realizar Pedido como cliente" // ARIA: Acción clara
          >
            <span className="mr-3 text-2xl" aria-hidden="true">
              🛒
            </span>
            <span>Realizar Pedido</span>
          </button>

          <div
            className="text-gray-400 font-bold uppercase text-xs pt-1"
            aria-hidden="true"
          >
            O
          </div>

          {/* 🔑 2. BOTÓN SECUNDARIO: ACCESO DE PERSONAL */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full inline-flex items-center justify-center px-4 py-3 text-red-600 font-semibold text-base rounded-xl border-2 border-red-100 hover:bg-red-50 transition-colors duration-300 cursor-pointer shadow-sm active:shadow-inner"
            aria-label="Acceder al sistema de gestión de personal" // ARIA: Acción clara
          >
            <span className="mr-2 text-xl" aria-hidden="true">
              🧑‍🍳
            </span>
            <span>Acceso de Personal</span>
          </button>
        </div>

        <span className="block text-xs text-gray-400 mt-6" role="contentinfo">
          Desarrollo y Soporte por
          <span className="font-semibold text-red-600 ml-1">DeliGo</span>
        </span>
      </div>

      {/* El modal de registro debe manejar sus propios atributos ARIA (role="dialog", aria-modal="true", etc.) */}
      <SignUpModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default Home;

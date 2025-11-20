import "../views/ViewStyles.css";
import Logo from "../assets/logo.png";
import { useState } from "react";
import SignUpModal from "../components/ModalFormSignUp";
import { useNavigate } from "react-router-dom";

function Home() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-2xl hover:shadow-3xl transition-shadow duration-500 rounded-3xl p-6 sm:p-8 w-full max-w-md text-center border-t-4 border-red-700">
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-red-700 mb-2 tracking-tight">
          Bienvenido a 
          <span className="text-yellow-500 block text-5xl mt-1">Dattebayo</span>
        </h1>
        
        <p className="text-gray-500 mb-6 text-sm">Sistema de Gestión de Restaurante</p>

        <img
          src={Logo}
          alt="Logo Restaurante"
          className="mx-auto mb-8 w-40 max-w-[60%] h-auto object-contain transition-transform duration-500 hover:scale-105"
        />
        
        <div className="flex flex-col gap-4 text-center">
          
          {/* 🎯 1. BOTÓN PRINCIPAL: REALIZAR PEDIDO */}
          <button
            onClick={() => navigate("/menu")}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-extrabold text-xl rounded-xl shadow-lg shadow-red-300/50 hover:shadow-red-500/70 hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer active:scale-95 border-b-4 border-red-900"
          >
            <span className="mr-3 text-2xl">🛒</span> 
            <span>Realizar Pedido</span>
          </button>
          
          <div className="text-gray-400 font-bold uppercase text-xs pt-1">O</div>

          {/* 🔑 2. BOTÓN SECUNDARIO: ACCESO DE PERSONAL */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 text-red-600 font-semibold text-base rounded-lg border border-gray-200 hover:bg-red-50 transition-colors duration-300 cursor-pointer"
          >
            <span className="mr-2 text-xl">🧑‍🍳</span>
            <span>Acceso de Personal</span>
          </button>

        </div>
        
        <span className="block text-xs text-gray-400 mt-6">
            Desarrollo y Soporte por 
          <span className="font-semibold text-red-600"> DeliGo</span>
        </span>
      </div>
      
      <SignUpModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default Home;
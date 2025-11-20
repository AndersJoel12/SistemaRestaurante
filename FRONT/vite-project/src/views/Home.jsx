import "../views/ViewStyles.css";
import Logo from "../assets/logo.png";
import { useState } from "react";
import SignUpModal from "../components/ModalFormSignUp";

import { useNavigate } from "react-router-dom";

function Home() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate(); // Función que determina la ruta a la que se redirige el usuario según su rol

  const getRedirectPath = (role) => {
    console.log("Rol decodificado:", role);
    // Normalizamos el rol a minúsculas para una comparación robusta
    const normalizedRole = (role || "").toLowerCase();

    switch (normalizedRole) {
      case "administrador":
      case "Administrador": // Coincide con el rol de Administrador
        return "/manage-users"; // Redirige a la gestión de usuarios
      case "cocinero": // Coincide con el rol de Cocinero
      case "Cocinero":
        return "/kitchen"; // Redirige a la vista de cocina
      case "mesero":
      case "Mesero": // Coincide con el rol de Mesero/Mesonero
        return "/tables"; // Redirige a la vista de mesas/mesero principal
      default:
        return "/unauthorized"; // En caso de rol desconocido
    }
  }; // Función llamada al finalizar el login (pasa el rol decodificado)

  const handleLoginSuccess = (role) => {
    setShowModal(false);

    if (role) {
      const path = getRedirectPath(role);
      navigate(path);
      console.log("Redirigiendo a:", path);
    } else {
      console.log("Rol no reconocido, redirigiendo a no autorizado.");
      navigate("/unauthorized");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
             {" "}
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md text-center">
                   {" "}
        <h1 className="text-3xl font-bold text-red-700 mb-4">
                      Bienvenido a{" "}
          <span className="text-yellow-500">Dattebayo</span>           {" "}
        </h1>
                   {" "}
        <img
          src={Logo}
          alt="Logo Restaurante"
          className="mx-auto mb-6 w-full max-w-xs object-contain"
        />
                   {" "}
        <div className="space-y-6 text-center">
                     {" "}
          <button
            onClick={() => setShowModal(true)}
            className="relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-600 text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 hover:from-yellow-600 hover:to-red-700 transition-transform duration-300 ease-in-out cursor-pointer"
          >
                            <span className="mr-3 text-xl">🔒</span>           
                <span>Iniciar Sesión</span>           {" "}
          </button>
                     {" "}
          <span className="block text-sm text-gray-500">
                            by{" "}
            <span className="font-semibold text-red-600">DeliGo</span>         
             {" "}
          </span>
                     {" "}
        </div>
               {" "}
      </div>
             {" "}
      <SignUpModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
             {" "}
    </div>
  );
}

export default Home;

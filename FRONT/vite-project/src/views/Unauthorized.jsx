import React from "react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-2xl rounded-xl p-8 max-w-md text-center border-4 border-red-600">
        <h1 className="text-3xl font-extrabold text-red-700 mb-4">
          🚫 ACCESO NO AUTORIZADO
        </h1>
        <p className="text-gray-700 font-semibold mb-6">
          No tienes permisos para ingresar en esta sección del sistema.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-red-600 text-yellow-300 font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition duration-200"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;

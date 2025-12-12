import React from "react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    // 1. SEMÁNTICA: Usamos <main> porque es el contenido único de esta pantalla
    <main 
      className="flex items-center justify-center min-h-screen bg-gray-100 p-4"
      aria-labelledby="error-title"
    >
      <div 
        // 2. ROL DE ALERTA: Esto hace que el lector de pantalla lea esto INMEDIATAMENTE
        role="alert" 
        className="bg-white shadow-2xl rounded-xl p-8 max-w-md text-center border-t-8 border-red-600 w-full animate-bounce-in"
      >
        <h1 
          id="error-title" 
          className="text-3xl font-extrabold text-red-700 mb-4 flex flex-col items-center gap-2"
        >
          {/* 3. ARIA-HIDDEN: El emoji es decorativo, no queremos que lo lean */}
          <span className="text-5xl" aria-hidden="true">🚫</span>
          <span>ACCESO DENEGADO</span>
        </h1>
        
        <p className="text-gray-600 font-medium mb-8 text-lg">
          No tienes los permisos necesarios para ver esta sección.
          <br />
          <span className="text-sm text-gray-400 mt-2 block">
            Código: 403 Forbidden
          </span>
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition duration-200 shadow-lg hover:shadow-red-500/30 active:scale-95"
          // ACCESIBILIDAD: Explicamos a dónde lleva el botón
          aria-label="Volver a la página de inicio"
        >
          ⬅ Volver al Inicio
        </button>
      </div>
    </main>
  );
};

export default Unauthorized;

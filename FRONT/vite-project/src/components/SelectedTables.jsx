import React from "react";
import { useNavigate } from "react-router-dom";

const SelectedTables = ({ mesa }) => {
  const navigate = useNavigate();

  // Si no hay mesa, no renderizamos nada (Evita errores de renderizado)
  if (!mesa) return null;

  return (
    // SEMÁNTICA: Usamos <aside> porque es información complementaria a la vista principal.
    // ARIA: role="status" indica que esta barra muestra el estado actual del sistema (mesa activa).
    <aside 
      className="bg-yellow-400 text-red-900 border-b-4 border-yellow-500 shadow-md py-3 px-4"
      role="status" 
      aria-label="Información de la mesa activa"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* INFORMACIÓN VISUAL */}
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">📌</span>
          <span className="font-extrabold text-lg">
            Mesa {mesa.number} 
            <span className="text-red-800/70 text-sm font-semibold ml-2">
              ({mesa.capacity} sillas)
            </span>
          </span>
        </div>

        {/* BOTÓN DE NAVEGACIÓN */}
        <button
          onClick={() => navigate("/tables")}
          className="
            bg-white text-red-800 font-bold 
            px-4 py-2 rounded-lg 
            shadow-sm border border-red-100
            hover:bg-red-50 hover:text-red-900 hover:shadow-md 
            transition-all active:scale-95 text-sm
          "
          // ACCESIBILIDAD: Descripción clara de lo que hace el botón
          aria-label="Abandonar pedido actual y volver al mapa de mesas"
        >
          ⬅ Cambiar Mesa
        </button>
      </div>
    </aside>
  );
};

export default SelectedTables;
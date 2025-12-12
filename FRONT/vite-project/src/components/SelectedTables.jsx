import React from "react";
import { useNavigate } from "react-router-dom";

const SelectedTables = ({ mesa }) => {
  const navigate = useNavigate();

  if (!mesa) return null;

  return (
    // 1. ROL Y ETIQUETA DE REGIÓN
    // role="region": Define esto como un área significativa.
    // aria-label: Le da un nombre a esa área ("Barra de información...")
    <aside
      className="bg-yellow-400 text-red-900 font-bold text-center py-2 shadow-md flex flex-col md:flex-row md:items-center md:justify-between px-4 border-b-4 border-yellow-500"
      role="region"
      aria-label="Barra de información de la mesa activa"
    >
      <span className="flex items-center justify-center gap-2">
        {/* 2. ARIA-HIDDEN: Ocultamos el emoji decorativo */}
        <span aria-hidden="true" className="text-xl">📌</span>
        
        <span className="text-lg">
          Pedido para <span className="sr-only">la</span> Mesa {mesa.number}
          {/* Usamos un span con font-normal para separar visualmente los detalles */}
          <span className="ml-2 text-sm text-red-800/80 font-semibold">
             (Capacidad: {mesa.capacity} sillas)
          </span>
        </span>
      </span>

      <button
        // 3. NAME TÉCNICO (Lo que pediste)
        // Útil para testing automatizado (e.g. Jest, Cypress)
        name="btn-cambiar-mesa"
        
        // 4. ACCESIBILIDAD (Lo que necesita el usuario)
        // Describe la acción completa, no solo el texto visual.
        aria-label="Cancelar pedido actual y volver al mapa de mesas"
        
        onClick={() => navigate("/tables")}
        
        // Focus ring para navegación por teclado (importante en fondo amarillo)
        className="mt-2 md:mt-0 bg-red-700 text-white px-4 py-1 rounded-lg shadow hover:bg-red-800 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-800"
      >
        Volver a seleccionar mesas
      </button>
    </aside>
  );
};

export default SelectedTables;
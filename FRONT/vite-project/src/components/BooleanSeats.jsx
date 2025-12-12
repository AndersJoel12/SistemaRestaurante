import React from "react";

// 1. CONFIGURACIÓN VISUAL
// Adaptada para iconos grandes en lugar de etiquetas de texto.
const SEAT_CONFIG = {
  libre: {
    icon: "🍽️", // Plato: Invita a comer
    className: "bg-green-100 text-green-600 border-green-200",
  },
  ocupada: {
    icon: "😋", // Cara saboreando: Gente comiendo
    className: "bg-white text-red-500 border-red-100",
  },
  deshabilitada: {
    icon: "🔒", // Candado: No se puede usar
    className: "bg-gray-100 text-gray-400 border-gray-200 grayscale",
  },
  // Fallback
  unknown: {
    icon: "❓",
    className: "bg-gray-50 text-gray-300 border-gray-100",
  },
};

const BooleanSeats = ({ status }) => {
  // 2. NORMALIZACIÓN
  const statusKey = (status || "").toLowerCase();
  const config = SEAT_CONFIG[statusKey] || SEAT_CONFIG.unknown;

  return (
    // 3. RENDERIZADO VISUAL
    // Usamos un círculo (rounded-full) grande (w-12 h-12) para que destaque en la tarjeta.
    // NO usamos ARIA aquí porque el padre (TableCell) ya describe el estado.
    <div
      className={`
        flex items-center justify-center
        w-10 h-10 sm:w-12 sm:h-12 
        rounded-full border-2
        text-xl sm:text-2xl 
        shadow-sm mb-1
        transition-all duration-300
        ${config.className}
      `}
    >
      {config.icon}
    </div>
  );
};

export default BooleanSeats;
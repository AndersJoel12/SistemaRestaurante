import React from "react";

const Quantity = ({ value = 0, onIncrease, onDecrease, disabled = false }) => {
  // Lógica defensiva: Aseguramos que no baje de 0
  const canDecrease = !disabled && value > 0;

  return (
    // Agregamos 'items-center' para alinear verticalmente todo
    <div className="flex items-center justify-center space-x-3 mt-auto pt-2">
      
      {/* BOTÓN DISMINUIR (-) */}
      <button
        onClick={onDecrease}
        disabled={!canDecrease}
        // ACCESIBILIDAD: Explicamos qué hace el botón
        aria-label="Disminuir cantidad"
        className={`w-10 h-10 flex items-center justify-center rounded-lg font-extrabold text-xl
                    transition-all active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-yellow-400
                    ${
                      canDecrease
                        ? "bg-red-500 text-white hover:bg-red-600 shadow-md"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
      >
        <span>−</span> {/* Usamos el símbolo matemático 'minus' real, no el guion */}
      </button>

      {/* VISUALIZACIÓN DEL VALOR */}
      {/* aria-live="polite": Anuncia el cambio de número a lectores de pantalla */}
      <span 
        className="text-xl font-bold text-gray-800 w-8 text-center"
        aria-live="polite" 
      >
        {value}
      </span>

      {/* BOTÓN AUMENTAR (+) */}
      <button
        onClick={onIncrease}
        disabled={disabled}
        // ACCESIBILIDAD: Explicamos qué hace el botón
        aria-label="Aumentar cantidad"
        className={`w-10 h-10 flex items-center justify-center rounded-lg font-extrabold text-xl
                    transition-all active:scale-95 shadow-md
                    focus:outline-none focus:ring-2 focus:ring-yellow-400
                    ${
                        disabled 
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                        : "bg-red-700 text-yellow-400 hover:bg-red-600"
                    }`}
      >
        <span>+</span>
      </button>
    </div>
  );
};

export default Quantity;

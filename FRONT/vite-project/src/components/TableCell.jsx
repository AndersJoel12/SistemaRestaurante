import React from "react";
import BooleanSeats from "./BooleanSeats"; 

// 1. DICCIONARIO DE ESTILOS
// Definimos la apariencia fuera para mantener el render limpio.
const TABLE_STYLES = {
  libre: {
    base: "bg-white border-gray-300 text-gray-800 hover:bg-green-50 hover:border-green-400",
    description: "Libre"
  },
  ocupada: {
    // CAMBIO: Quitamos 'cursor-not-allowed' porque SÍ queremos clicar para ver el pedido
    base: "bg-red-100 border-red-300 text-red-800 hover:bg-red-200",
    description: "Ocupada"
  },
  deshabilitada: {
    base: "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-70",
    description: "Deshabilitada"
  }
};

const TableCell = ({ table, isSelected, onSelect, ocupacion }) => {
  // Defensive Programming: Si el estado no existe, asumimos 'deshabilitada' por seguridad
  const statusKey = table.status || "deshabilitada";
  const styles = TABLE_STYLES[statusKey] || TABLE_STYLES.deshabilitada;

  // Lógica de selección visual
  const selectionClasses = isSelected
    ? "ring-4 ring-blue-400 shadow-xl transform scale-105 border-blue-600 bg-blue-50 z-10"
    : "shadow-sm hover:shadow-md";

  // Construimos una etiqueta descriptiva para ciegos
  const accessibilityLabel = `Mesa ${table.number}, Estado: ${styles.description}, Capacidad: ${table.capacity} personas. ${isSelected ? "Seleccionada." : ""}`;

  return (
    <button
      // 2. SEMÁNTICA CORRECTA: Usamos <button> en lugar de <div>
      type="button"
      onClick={() => {
        if (statusKey !== "deshabilitada") {
          onSelect(table);
        }
      }}
      // Deshabilitamos nativamente si corresponde (el navegador se encarga de ignorar clics)
      disabled={statusKey === "deshabilitada"}
      
      // 3. ARIA (Accesibilidad)
      aria-label={accessibilityLabel}
      aria-pressed={isSelected} // Indica si este botón está en estado "activo/presionado"
      
      className={`
        relative flex flex-col items-center justify-center 
        w-full aspect-square rounded-2xl border-2 
        p-3 transition-all duration-200 ease-out
        focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-300
        ${styles.base}
        ${selectionClasses}
      `}
    >
      {/* HEADER DE LA TARJETA */}
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">
          Mesa
        </span>
        {/* Indicador visual de selección (Estrella) */}
        {isSelected && (
          <span className="text-lg animate-bounce" aria-hidden="true">✨</span>
        )}
      </div>

      {/* NÚMERO GRANDE */}
      <div className="text-3xl font-black leading-none mb-2">
        {table.number}
      </div>

      {/* COMPONENTE DE ESTADO (Visual) */}
      {/* aria-hidden="true" porque ya describimos el estado en el aria-label del botón padre */}
      <div aria-hidden="true">
        <BooleanSeats status={statusKey} />
      </div>

      {/* FOOTER: CAPACIDAD / OCUPACIÓN */}
      <div className="mt-auto pt-2 border-t border-black/5 w-full text-center">
        {statusKey === 'ocupada' && ocupacion > 0 ? (
          <span className="text-xs font-bold flex items-center justify-center gap-1">
            👤 {ocupacion}/{table.capacity}
          </span>
        ) : (
          <span className="text-xs font-medium opacity-80 flex items-center justify-center gap-1">
            👥 Cap: {table.capacity}
          </span>
        )}
      </div>
    </button>
  );
};

export default TableCell;

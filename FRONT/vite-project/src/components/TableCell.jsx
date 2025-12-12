import React from "react";
import BooleanSeats from "./BooleanSeats"; // Importación corregida

const TableCell = ({ table, isSelected, onSelect, ocupacion }) => {
  // Lógica de color y estado
  let baseColor = "bg-white border-gray-400";
  let hoverColor = "hover:bg-yellow-200";
  let textStyle = "text-gray-800";
  let cursor = "cursor-pointer";

  if (table.status === "ocupada") {
    baseColor = "bg-red-500 border-red-700";
    hoverColor = "hover:bg-red-600";
    textStyle = "text-white";
    cursor = "cursor-not-allowed";
  } else if (table.status === "deshabilitada") {
    baseColor = "bg-gray-400 border-gray-600";
    hoverColor = "hover:bg-gray-500";
    textStyle = "text-gray-900/80";
    cursor = "cursor-not-allowed";
  }

  // El color de selección será verde oscuro, para que el toggle sea visible
  if (isSelected) {
    baseColor =
      "bg-green-600 border-green-800 shadow-xl ring-4 ring-green-300 scale-[1.05]";
    hoverColor = "hover:bg-green-700";
    textStyle = "text-white";
  }

  return (
    <div
      onClick={() => {
        // La función onSelect ahora llama al toggle en TablesView
        if (table.status !== "deshabilitada") {
          onSelect(table);
        }
      }}
      className={`
 flex flex-col items-center justify-center 
border-2 rounded-xl 
 p-2 
 min-h-[90px] h-full
text-xs sm:text-sm font-bold
 ${baseColor} ${hoverColor} ${textStyle} ${cursor} 
transform transition-all duration-200 ease-in-out
 `}
    >
      <div className="font-extrabold text-sm sm:text-base">
        MESA {table.number}
      </div>
      <BooleanSeats status={table.status} />
      <div className="flex items-center text-xs font-semibold mt-1">
        <span className="text-sm sm:text-base mr-1">👥</span>
        Capacidad: {table.capacity}
      </div>
      {isSelected && <span className="text-lg mt-1">✨</span>}
      {ocupacion > 0 && table.status === "ocupada" && (
        <div className="text-[10px] sm:text-xs mt-1 font-semibold opacity-90">
          👤 {ocupacion} personas
        </div>
      )}
    </div>
  );
};

export default TableCell;

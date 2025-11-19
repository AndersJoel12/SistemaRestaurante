// src/components/TableCell.jsx
import React from "react";
import BooleanSeats from "./BooleanSeats"; // ✅ importación correcta

const TableCell = ({ table, isSelected, onSelect, ocupacion }) => {
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

  if (isSelected) {
    baseColor = "bg-green-600 border-green-800 shadow-lg scale-[1.05]";
    hoverColor = "hover:bg-green-700";
    textStyle = "text-white";
  }

  return (
    <div
      onClick={() => onSelect(table)}
      className={`flex flex-col items-center justify-center border-2 rounded-lg p-2 text-sm font-bold h-24 w-full ${baseColor} ${hoverColor} ${textStyle} ${cursor} transform transition-transform duration-200`}
    >
      <div className="font-extrabold text-base">MESA {table.number}</div>

      {/* Estado con BooleanSeats */}
      <BooleanSeats status={table.status} />

      <div className="flex items-center text-xs font-semibold mt-1">
        <span className="text-base mr-1">👥</span>
        {table.capacity} Sillas
      </div>

      {isSelected && <span className="text-lg mt-1">✅</span>}
      {ocupacion > 0 && (
        <div className="text-xs mt-1 text-blue-900 font-semibold">
          👥 {ocupacion} sentados
        </div>
      )}
    </div>
  );
};

export default TableCell;

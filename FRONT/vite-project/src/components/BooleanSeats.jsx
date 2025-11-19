// src/components/StatusBadge.jsx
import React from "react";

const StatusBadge = ({ status }) => {
  let bgColor = "bg-gray-300";
  let textColor = "text-gray-800";
  let label = "Desconocido";

  if (status === "libre") {
    bgColor = "bg-green-200";
    textColor = "text-green-800";
    label = "Libre ✅";
  } else if (status === "ocupada") {
    bgColor = "bg-red-200";
    textColor = "text-red-800";
    label = "Ocupada ❌";
  } else if (status === "deshabilitada") {
    bgColor = "bg-gray-400";
    textColor = "text-gray-900";
    label = "Deshabilitada 🚫";
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;

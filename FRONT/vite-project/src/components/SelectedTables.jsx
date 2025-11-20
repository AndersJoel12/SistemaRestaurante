// src/components/SelectedTables.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const SelectedTables = ({ mesa }) => {
  const navigate = useNavigate();

  if (!mesa) return null;

  return (
    <div className="bg-yellow-400 text-red-900 font-bold text-center py-2 shadow-md flex flex-col md:flex-row md:items-center md:justify-between px-4">
      <span>
        📌 Pedido para Mesa {mesa.number} ({mesa.capacity} sillas)
      </span>

      <button
        onClick={() => navigate("/tables")}
        className="mt-2 md:mt-0 bg-red-700 text-white px-4 py-1 rounded-lg shadow hover:bg-red-800 transition"
      >
        Volver a seleccionar mesas
      </button>
    </div>
  );
};

export default SelectedTables;

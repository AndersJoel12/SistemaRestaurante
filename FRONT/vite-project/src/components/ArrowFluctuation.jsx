// src/components/ArrowFluctuation.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const ArrowFluctuation = ({ mesa }) => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    // Por ahora siempre redirige a Menu
    navigate("/menu", { state: { mesa } });
  };

  return (
    <button
      onClick={handleRedirect}
      className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-orange-700 transition duration-200 flex items-center gap-2"
    >
      ➡️ PROCEDER PEDIDO
    </button>
  );
};

export default ArrowFluctuation;

import React from "react";
// Importamos solo useNavigate y NO el Router, ya que está en App.jsx
import { useNavigate } from "react-router-dom";
import TablesGrid from "../components/TableGrid";
// Asumimos que tienes un Header, si no lo tienes, puedes omitir la línea o importarlo
import Header from "../components/Header";
// Necesitamos NavButton para los botones de navegación
import NavButton from "../components/Navbutton";

// Esta es la vista que contiene el TablesGrid
function TablesView() {
  const navigate = useNavigate();
  /**
   * Maneja la selección de una mesa activa y la guarda en sesión.
   * @param {object} mesaActiva - Objeto de la mesa seleccionada { id, number, capacity, ... }.
   */

  const handleNavigateToMenu = (mesaActiva) => {
    // 1. Validamos que el objeto tenga al menos la ID para ser útil
    if (!mesaActiva || !mesaActiva.id) {
      console.error("Error: Objeto de mesa inválido o incompleto.");
      return;
    } // 🔥 CLAVE: Guardar el objeto en la clave "mesa_activa"
    sessionStorage.setItem("mesa_activa", JSON.stringify(mesaActiva));
    console.log(
      `✅ Mesa ${mesaActiva.number} guardada en sesión. Navegando al menú.`
    ); // 2. NAVEGACIÓN
    navigate("/menu");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex justify-center gap-4 py-3 border-b border-gray-200 bg-white">
        <NavButton
          to="/menu"
          ariaLabel="Ir a Menú"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center font-bold shadow-md"
        >
          📝 Menú
        </NavButton>

        <NavButton
          to="/orders"
          ariaLabel="Ir a Pedidos/Órdenes"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center font-bold shadow-md"
        >
          🧾 Pedidos
        </NavButton>
        <NavButton
          to="/billing"
          ariaLabel="Ir a Facturación"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center font-bold shadow-md"
        >
          💰 Facturación
        </NavButton>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TablesGrid onNavigateToMenu={handleNavigateToMenu} />
      </div>
    </div>
  );
}

export default TablesView;

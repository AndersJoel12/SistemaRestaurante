import React from "react";
// Importamos solo useNavigate y NO el Router, ya que está en App.jsx
import { useNavigate } from "react-router-dom";
import TablesGrid from "../components/TableGrid";
// Asumimos que tienes un Header, si no lo tienes, puedes omitir la línea o importarlo
import Header from "../components/Header";

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
      <div className="container mx-auto">
        {/* TablesGrid ahora maneja la cuadrícula y la lógica de selección */}
        <TablesGrid onNavigateToMenu={handleNavigateToMenu} />
      </div>
         {" "}
    </div>
  );
}

export default TablesView;

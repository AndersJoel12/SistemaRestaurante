import React from "react";
// Importamos solo useNavigate y NO el Router, ya que está en App.jsx
import { useNavigate } from "react-router-dom"; 
import TablesGrid from "../components/TableGrid"; 

// Asumimos que esta es la vista que contiene el TablesGrid
function TablesView() { 
  const navigate = useNavigate();

  /**
   * Maneja la selección de una mesa activa y la guarda en sesión.
   * @param {object} mesaActiva - Objeto de la mesa seleccionada { id, number, capacity }.
   */
  const handleNavigateToMenu = (mesaActiva) => {
    // 1. Validamos que el objeto tenga al menos la ID para ser útil
    if (!mesaActiva || !mesaActiva.id) {
        console.error("Error: Objeto de mesa inválido o incompleto.");
        return;
    }
    
    // 🔥🔥 CLAVE: Guardar el objeto como un STRING JSON en la clave "mesa_activa"
    sessionStorage.setItem("mesa_activa", JSON.stringify(mesaActiva));
    
    console.log(
      `✅ Mesa ${mesaActiva.number} (${mesaActiva.capacity} pax) guardada en sesión.`
    );

    // 2. NAVEGACIÓN
    navigate("/menu");
  };

  // Nota: Si usas este componente en las rutas '/', '/tables', etc., 
  // debe devolver el componente TablesGrid que realiza la acción de selección.
  return (
    <TablesGrid onNavigateToMenu={handleNavigateToMenu} />
  );
}

export default TablesView;
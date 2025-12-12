import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TablesGrid from "../components/TableGrid";
import Header from "../components/Header";
import NavButton from "../components/Navbutton";

function TablesView() {
  const navigate = useNavigate();
  // 🔥 ESTADO CLAVE: Objeto de la mesa actualmente seleccionada
  const [selectedTable, setSelectedTable] = useState(null);

  /**
   * Lógica de selección/deselección (Toggle "uwu")
   */
  const handleTableSelect = (mesa) => {
    // Si la mesa clicada es la misma que la seleccionada, deselecciona (setSelectedTable(null)).
    if (selectedTable && selectedTable.id === mesa.id) {
      setSelectedTable(null);
    } else {
      // Si se clica una mesa diferente o ninguna estaba seleccionada, selecciona la nueva mesa.
      setSelectedTable(mesa);
    }
  };

  /**
   * Función de navegación al Menú.
   */
  const handleNavigateToMenu = () => {
    const mesaActiva = selectedTable;
    if (!mesaActiva || !mesaActiva.id) {
      alert("Por favor, selecciona una mesa para continuar.");
      return;
    }
    sessionStorage.setItem("mesa_activa", JSON.stringify(mesaActiva));
    navigate("/menu");
  };

  /**
   * Acción de Cancelar (Redirige a pedidos y deselecciona la mesa).
   */
  const handleCancelAction = () => {
    // Deselecciona la mesa en la vista actual
    setSelectedTable(null);
    // Redirige a /orders
    navigate("/orders");
  };

  // El useCallback para getMenuButtonTitle se eliminó ya que no se usa el botón de menú superior

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {/* Bloque de Botones de Navegación Superior */}
        <div
          className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
          role="group"
          aria-label="Opciones de navegación"
        >
          {/* Botón 1: Ver Pedidos Activos (Fijo) */}
          <NavButton to="/orders" ariaLabel="Ir a la lista de pedidos activos">
            📋 Ver Pedidos Activos
          </NavButton>

          {/* Lógica de Cancelar Superior: SOLO aparece si NO hay mesa seleccionada */}
          {!selectedTable ? (
            <button
              onClick={handleCancelAction}
              className="px-6 py-2 bg-gray-500 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 transition duration-150 transform hover:-translate-y-0.5 active:scale-95"
              aria-label="Cancelar la acción y regresar a pedidos"
            >
              🗑️ Cancelar
            </button>
          ) : (
            // Espacio vacío para mantener el layout si es necesario
            <div className="px-6 py-2"></div>
          )}
        </div>

        {/* Pasamos los props de selección y acción a TablesGrid */}
        <TablesGrid
          onNavigateToMenu={handleNavigateToMenu}
          onTableSelect={handleTableSelect} // 🔥 Pasamos la función de TOGGLE (la "chamba")
          selectedTable={selectedTable} // Objeto completo
          selectedTableId={selectedTable ? selectedTable.id : null} // ID para comparación en TableCell
          onCancelAction={handleCancelAction}
        />
      </div>
    </div>
  );
}

export default TablesView;

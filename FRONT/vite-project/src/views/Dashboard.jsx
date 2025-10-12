import React, { useState } from "react";
import Menu from "./Menu.jsx";
import Orders from "./Orders.jsx";
const Dashboard = () => {
  // Estados maestros compartidos
  const [activeOrder, setActiveOrder] = useState([]);
  const [ordersList, setOrdersList] = useState([]);

  const [currentView, setCurrentView] = useState("tpv");
  const navigateTo = (viewName) => setCurrentView(viewName);

  const saveOrderToList = (newOrder) => {
    setOrdersList((prev) => [...prev, newOrder]);
    setActiveOrder([]); // Limpia la orden activa
    alert(`✅ Orden #${newOrder.id} registrada y enviada!`);
    navigateTo("orders_list");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navegación interna */}
      <div className="p-4 bg-gray-800 text-white flex justify-start space-x-4 sticky top-0 z-40">
        <button
          onClick={() => navigateTo("tpv")}
          className={`px-4 py-2 rounded font-bold ${
            currentView === "tpv"
              ? "bg-yellow-400 text-gray-800"
              : "hover:bg-gray-700"
          }`}
        >
          1. HACER ORDEN (MENÚ)
        </button>

        <button
          onClick={() => navigateTo("active_order")}
          className={`px-4 py-2 rounded font-bold ${
            currentView === "active_order"
              ? "bg-yellow-400 text-gray-800"
              : "hover:bg-gray-700"
          }`}
        >
          2. REVISAR Y ENVIAR ({activeOrder.length} ítems)
        </button>

        <button
          onClick={() => navigateTo("orders_list")}
          className={`px-4 py-2 rounded font-bold ${
            currentView === "orders_list"
              ? "bg-yellow-400 text-gray-800"
              : "hover:bg-gray-700"
          }`}
        >
          3. ÓRDENES ENVIADAS ({ordersList.length})
        </button>
      </div>

      {/* Layout principal 2 columnas */}
      <div className="flex w-full min-h-[calc(100vh-4rem)]">
        {/* Columna izquierda: Menú (60%) */}
        <div className="w-3/5 bg-white overflow-y-auto">
          {currentView === "tpv" && (
            <Menu
              activeOrder={activeOrder}
              setActiveOrder={setActiveOrder}
              navigateTo={navigateTo}
            />
          )}
        </div>

        {/* Columna derecha: Orden/Órdenes (40%) */}
        <div className="w-2/5 bg-gray-200 border-l border-gray-300">
          <div className="sticky top-16 h-full p-4">
            {currentView === "tpv" && (
              <Orders
                activeOrder={activeOrder}
                setActiveOrder={setActiveOrder} // para ajustar cantidades si decides
                isReviewAndSendView={false}
              />
            )}

            {currentView === "active_order" && (
              <Orders
                activeOrder={activeOrder}
                setActiveOrder={setActiveOrder} // necesario para editar cantidades en revisión
                saveOrderToList={saveOrderToList}
                isReviewAndSendView={true}
              />
            )}

            {currentView === "orders_list" && (
              <Orders ordersList={ordersList} isList={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

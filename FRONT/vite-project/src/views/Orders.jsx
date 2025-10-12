import React from "react";
import Quantity from "../components/Quantity.jsx";

const Orders = ({
  activeOrder = [],
  setActiveOrder, // necesario para editar cantidades aquí
  saveOrderToList,
  ordersList = [],
  isReviewAndSendView = false,
  isList = false,
}) => {
  const subtotal = activeOrder.reduce(
    (acc, item) =>
      acc +
      (typeof item.price === "number" ? item.price : 0) * (item.quantity || 0),
    0
  );

  const sendOrder = () => {
    if (!Array.isArray(activeOrder) || activeOrder.length === 0) {
      return alert("La orden está vacía.");
    }

    const newOrder = {
      id: Date.now(),
      items: activeOrder,
      subtotal: subtotal.toFixed(2),
      status: "PENDIENTE_COCINA",
      timestamp: new Date().toLocaleTimeString(),
    };

    if (typeof saveOrderToList === "function") {
      saveOrderToList(newOrder);
    }
  };

  // Helpers para ajustar cantidades desde Orders
  const increase = (dishId) => {
    const safeOrder = Array.isArray(activeOrder) ? activeOrder : [];
    setActiveOrder(
      safeOrder.map((item) =>
        item.id === dishId
          ? { ...item, quantity: (item.quantity || 0) + 1 }
          : item
      )
    );
  };

  const decrease = (dishId) => {
    const safeOrder = Array.isArray(activeOrder) ? activeOrder : [];
    setActiveOrder(
      safeOrder
        .map((item) =>
          item.id === dishId
            ? { ...item, quantity: (item.quantity || 0) - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Lista de órdenes enviadas
  if (isList) {
    return (
      <div className="p-4 bg-white shadow-xl rounded-lg h-full overflow-y-auto">
        <h1 className="text-3xl font-extrabold mb-6 text-red-700 border-b-2 pb-2">
          📜 ÓRDENES ENVIADAS
        </h1>
        {ordersList.length === 0 ? (
          <p className="text-gray-500 italic">
            Aún no hay órdenes enviadas a cocina.
          </p>
        ) : (
          <div className="space-y-4">
            {ordersList.map((order) => (
              <div
                key={order.id}
                className="p-3 border-l-4 border-yellow-400 bg-gray-50 rounded shadow-sm"
              >
                <p className="font-bold text-lg text-gray-900">
                  Orden #{order.id}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    ({order.timestamp})
                  </span>
                </p>
                <p className="text-green-600 font-extrabold">
                  Total: ${order.subtotal}
                </p>
                <p className="text-sm text-gray-600">
                  Items: {order.items?.length ?? 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de revisar y enviar (editable con Quantity)
  if (isReviewAndSendView) {
    return (
      <div className="p-4 bg-white shadow-xl rounded-lg h-full flex flex-col">
        <h2 className="text-2xl font-extrabold text-red-700 mb-4 border-b-4 border-yellow-400 pb-2 text-center">
          📋 REVISIÓN DE ORDEN
        </h2>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {activeOrder.length === 0 ? (
            <p className="text-gray-500 italic pt-4">
              La orden está vacía. Añade ítems.
            </p>
          ) : (
            activeOrder.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 p-3 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <p className="text-gray-900 font-medium">{item.name}</p>
                  <p className="text-lg font-extrabold text-red-700">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Controles de cantidad reutilizando Quantity */}
                <div className="mt-2">
                  <Quantity
                    value={item.quantity}
                    onIncrease={() => increase(item.id)}
                    onDecrease={() => decrease(item.id)}
                    disabled={item.quantity === 0}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-red-300">
          <div className="flex justify-between font-bold text-2xl mb-4">
            <span className="text-gray-900">SUBTOTAL:</span>
            <span className="text-red-700">${subtotal.toFixed(2)}</span>
          </div>

          <button
            onClick={sendOrder}
            className={`w-full p-4 rounded-xl font-extrabold text-white text-xl transition-colors shadow-lg
                        transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-400
                        ${
                          activeOrder.length > 0
                            ? "bg-red-700 hover:bg-red-600"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
            disabled={activeOrder.length === 0}
          >
            ENVIAR ORDEN A COCINA
          </button>
        </div>
      </div>
    );
  }

  // Resumen simple (sin edición)
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sticky top-0">
      <h2 className="text-2xl font-extrabold text-yellow-600 border-b-2 border-yellow-400 pb-1 mb-4">
        ORDEN DE MESA: NUEVA
      </h2>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {activeOrder.length === 0 ? (
          <p className="text-gray-500 italic">
            Usa el menú para añadir platos.
          </p>
        ) : (
          activeOrder.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm items-center"
            >
              <span className="text-gray-900 truncate">
                {item.quantity}x {item.name}
              </span>
              <span className="font-bold text-red-700">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 pt-2 border-t border-gray-300 flex justify-between font-extrabold text-xl">
        <span>SUBTOTAL:</span>
        <span className="text-red-700">${subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default Orders;

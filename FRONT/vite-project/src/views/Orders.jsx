import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lee la orden enviada desde Menu por estado de navegación
  const activeOrder = location.state?.activeOrder || [];
  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const subtotal = activeOrder
    .reduce(
      (sum, i) =>
        sum + (typeof i.price === "number" ? i.price : 0) * (i.quantity || 0),
      0
    )
    .toFixed(2);

  const handleBack = () => {
    navigate("/menu");
  };

  const handleConfirm = () => {
    if (totalItems === 0) return alert("La orden está vacía.");

    const newOrder = {
      id: Date.now(),
      items: activeOrder,
      subtotal,
      status: "Recibido",
      timestamp: new Date().toLocaleTimeString(),
    };

    // Navega a Kitchen pasando la orden confirmada por estado de navegación
    navigate("/kitchen", { state: { newOrder } });
  };

  return (
    <div className="p-4 bg-white min-h-screen flex flex-col">
      <button
        onClick={handleBack}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Volver al menú
      </button>

      <h2 className="text-2xl font-extrabold text-red-700 mb-4">
        📋 Revisión de Orden ({totalItems} plato{totalItems !== 1 ? "s" : ""})
      </h2>

      <div className="flex-1 overflow-y-auto space-y-3">
        {totalItems === 0 ? (
          <p className="text-gray-500 italic">
            La orden está vacía. Regresa al menú para añadir platos.
          </p>
        ) : (
          activeOrder.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded shadow-sm"
            >
              <span className="font-medium text-gray-900">
                {item.quantity}x {item.name}
              </span>
              <span className="font-extrabold text-red-700">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 pb-20 border-t border-gray-300">
        <div className="flex justify-between font-bold text-xl mb-4">
          <span>SUBTOTAL:</span>
          <span className="text-red-700">${subtotal}</span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={totalItems === 0}
          className={`w-full py-3 font-bold text-white rounded ${
            totalItems > 0
              ? "bg-red-700 hover:bg-red-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          ENVIAR ORDEN A COCINA
        </button>
      </div>
    </div>
  );
};

export default Orders;

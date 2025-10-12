import React from "react";

const Orders = ({ activeOrder = [] }) => {
  // Cálculo de subtotal
  const subtotal = activeOrder.reduce(
    (acc, item) =>
      acc +
      (typeof item.price === "number" ? item.price : 0) * (item.quantity || 0),
    0
  );

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-2xl font-extrabold text-yellow-600 border-b-2 border-yellow-400 pb-1 mb-4">
        ORDEN DE MESA: NUEVA
      </h2>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
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

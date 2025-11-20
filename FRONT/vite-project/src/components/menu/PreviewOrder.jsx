import React, { useState } from "react";

// Componente para la previsualización y confirmación de la orden.
// Recibe onConfirm (que es Menu.sendOrder) y showNotification del padre.
const PreviewOrder = ({ activeOrder, onConfirm, showNotification }) => {
  // --- 1. ESTADOS ---
  const [showModal, setShowModal] = useState(false); // Controla la visibilidad del modal de revisión

  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Cálculo del subtotal: sumamos (precio * cantidad) de cada item.
  const subtotal = activeOrder
    .reduce(
      (sum, i) => {
        const itemPrice = parseFloat(i.precio) || 0;
        return sum + itemPrice * (i.quantity || 0);
      },
      0
    )
    .toFixed(2); // Formatea a dos decimales

  const handleSendOrder = () => {
    if (totalItems === 0) {
      showNotification(
        "error",
        "La orden está vacía. Añade platos antes de enviar."
      );
      return;
    }

    // 🛑 IMPORTANTE: Llamada a la función del padre (Menu.jsx) que hace el POST a la API
    onConfirm(); 
    setShowModal(false); // Cierra el modal
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => {
          setShowModal(true);
        }}
        // Clases para posicionamiento y estilo impactante (fácil de tocar en móvil)
        className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-red-600 text-white text-2xl font-bold shadow-lg border border-black hover:scale-105 hover:from-yellow-600 hover:to-red-700 transition-transform duration-300 ease-in-out cursor-pointer"
      >
        🛒
      </button>

      {/* NOTIFICACIÓN: Ahora se maneja en el padre (Menu.jsx) */}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[95%] max-w-md">
            <h2 className="text-2xl font-extrabold text-red-700 border-b-2 pb-3 mb-4">
              📋 Resumen de Orden ({totalItems} plato
              {totalItems !== 1 ? "s" : ""})
            </h2>

            <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
              {totalItems === 0 ? (
                <p className="text-gray-500 italic text-center py-4">
                  La orden está vacía.
                </p>
              ) : (
                activeOrder.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border-l-4 border-red-500 shadow-sm"
                  >
                    <span className="font-medium text-gray-900">
                      <span className="font-extrabold text-red-700 mr-1">
                        {item.quantity}x
                      </span>{" "}
                      {item.nombre}
                    </span>
                    <span className="font-extrabold text-red-700">
                      ${(item.precio * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="flex justify-between font-bold text-xl mb-4">
                <span>SUBTOTAL:</span>
                <span className="text-red-700">${subtotal}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                  }}
                  className="flex-1 py-3 font-bold text-white rounded-lg bg-gray-500 hover:bg-gray-600 transition duration-150 shadow-md"
                >
                  CERRAR
                </button>
                <button
                  onClick={handleSendOrder} // Llama a la nueva función de envío
                  disabled={totalItems === 0}
                  className={`flex-1 py-3 font-bold text-white rounded-lg ${
                    totalItems > 0
                      ? "bg-red-700 hover:bg-red-800"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  ENVIAR ORDEN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// React.memo sigue siendo útil para optimización.
export default React.memo(PreviewOrder);
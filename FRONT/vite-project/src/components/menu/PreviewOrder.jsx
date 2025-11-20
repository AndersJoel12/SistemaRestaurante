import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PreviewOrder = ({ activeOrder }) => {
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const subtotal = activeOrder
    .reduce(
      (sum, i) => sum + (parseFloat(i.precio) || 0) * (i.quantity || 0),
      0
    )
    .toFixed(2);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleConfirm = () => {
    if (totalItems === 0) {
      showNotification(
        "error",
        "La orden está vacía. Añade platos antes de enviar."
      );
      return;
    }

    const newOrder = {
      id: Date.now(),
      items: activeOrder,
      subtotal,
      status: "Recibido",
      timestamp: new Date().toLocaleTimeString(),
    };

    try {
      const storageKey = "kitchen_kanban";
      const saved = sessionStorage.getItem(storageKey);
      const parsed = saved
        ? JSON.parse(saved)
        : { Recibido: [], Pendiente: [], Finalizado: [] };

      const all = [
        ...parsed.Recibido,
        ...parsed.Pendiente,
        ...parsed.Finalizado,
      ];
      const exists = all.some((o) => o.id === newOrder.id);
      if (exists) {
        showNotification(
          "warning",
          "Esta orden con el mismo ID ya fue enviada."
        );
        return;
      }

      const updated = { ...parsed, Recibido: [newOrder, ...parsed.Recibido] };
      sessionStorage.setItem(storageKey, JSON.stringify(updated));

      // 👇 mostrar aviso con el nuevo mensaje
      showNotification(
        "success",
        "Pedido enviado a cocina, redirigiendo a pedidos"
      );

      setShowModal(false);

      // 👇 redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    } catch (e) {
      showNotification(
        "error",
        "No se pudo enviar la orden. Error de almacenamiento."
      );
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-red-600 text-white text-2xl font-bold shadow-lg border border-black hover:scale-105 transition-transform"
      >
        🛒
      </button>

      {/* Notificación centrada */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div
            className={`px-8 py-6 rounded-lg shadow-2xl text-white font-bold text-xl
              ${
                notification.type === "success"
                  ? "bg-green-600"
                  : notification.type === "error"
                  ? "bg-red-600"
                  : "bg-yellow-600"
              }`}
          >
            {notification.message}
          </div>
        </div>
      )}

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
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 font-bold text-white rounded-lg bg-gray-500 hover:bg-gray-600"
                >
                  CERRAR
                </button>
                <button
                  onClick={handleConfirm}
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

export default React.memo(PreviewOrder);

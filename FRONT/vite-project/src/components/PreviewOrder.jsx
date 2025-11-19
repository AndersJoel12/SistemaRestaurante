import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Componente para la previsualización y confirmación de la orden.
// NOTA: Se asume que los items del plato tienen la propiedad 'precio' y 'nombre'
const PreviewOrder = ({ activeOrder }) => {
  // --- 1. ESTADOS ---
  const [showModal, setShowModal] = useState(false); // Controla la visibilidad del modal de revisión
  // Estado para mostrar notificaciones flotantes (reemplaza a la función alert())
  const [notification, setNotification] = useState(null);


  console.log(
    "PREVIEW_ORDER: Renderizando. Items en orden:",
    activeOrder.length
  );

  // --- 2. CÁLCULOS DERIVADOS ---

  // Cantidad total de platos en la orden
  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Cálculo del subtotal: sumamos (precio * cantidad) de cada item.
  const subtotal = activeOrder
    .reduce(
      (sum, i) =>
        // Utilizamos i.precio (asumiendo que viene de la API) para el cálculo.
        sum + (typeof i.precio === "number" ? i.precio : 0) * (i.quantity || 0),
      0
    )
    .toFixed(2); // Formatea a dos decimales

  // Función unificada para mostrar mensajes de notificación
  const showNotification = (type, message) => {
    console.log(`NOTIFICATION: Tipo: ${type}, Mensaje: ${message}`);
    setNotification({ type, message });
    // Limpia la notificación después de 3 segundos
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // --- 3. MANEJO DE CONFIRMACIÓN Y ALMACENAMIENTO ---
  const handleConfirm = () => {
    console.log(
      "CONFIRM: Iniciando el proceso de envío de orden a sessionStorage."
    );

    // Validación de orden vacía
    if (totalItems === 0) {
      showNotification(
        "error",
        "La orden está vacía. Añade platos antes de enviar."
      );
      console.warn("CONFIRM: Orden vacía. Abortando envío.");
      return;
    }

    // Construcción del objeto de la nueva orden
    const newOrder = {
      id: Date.now(), // ID basado en el timestamp, único para esta sesión
      items: activeOrder,
      subtotal: subtotal,
      status: "Recibido", // Estado inicial para el Kanban de cocina
      timestamp: new Date().toLocaleTimeString(),
    };
    console.log("CONFIRM: Objeto de orden a guardar:", newOrder);

    try {
      const storageKey = "kitchen_kanban";
      const saved = sessionStorage.getItem(storageKey);

      console.log(`STORAGE: Recuperando clave '${storageKey}'.`);

      // Inicializa la estructura del Kanban si no existe, o la parsea
      const parsed = saved
        ? JSON.parse(saved)
        : {
            Recibido: [],
            Pendiente: [],
            Finalizado: [],
          };

      // Validación de duplicado (si se hace click muy rápido)
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
        console.warn(
          "STORAGE_WARNING: Se intentó enviar la misma orden dos veces."
        );
        return;
      }

      // Añade la nueva orden al inicio de la columna 'Recibido'
      const updated = {
        ...parsed,
        Recibido: [newOrder, ...parsed.Recibido],
      };

      // Guarda el estado actualizado del Kanban en sessionStorage
      sessionStorage.setItem(storageKey, JSON.stringify(updated));
      console.log("STORAGE: Orden guardada y marcada como 'Recibido'.");

      showNotification(
        "success",
        "¡Orden enviada a cocina! Continúa añadiendo platos o cierra."
      );
      setShowModal(false); // Cierra el modal
    } catch (e) {
      console.error(
        "STORAGE_ERROR: Error al guardar la orden en sessionStorage:",
        e
      );
      showNotification(
        "error",
        "No se pudo enviar la orden. Error de almacenamiento."
      );
    }
  };

  // --- Renderizado del componente y el modal ---
  return (
    <>
      {/* Botón Flotante para Abrir el Modal */}
      <button
        onClick={() => {
          console.log("CLICK: Botón '🛒'. Abriendo modal de revisión.");
          setShowModal(true);
        }}
        // Clases para posicionamiento y estilo impactante (fácil de tocar en móvil)
        className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-red-600 text-white text-2xl font-bold shadow-lg border border-black hover:scale-105 hover:from-yellow-600 hover:to-red-700 transition-transform duration-300 ease-in-out cursor-pointer"
      >
        🛒
      </button>

      {/* Notificación Flotante (Reemplazo de alert()) */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-xl text-white font-semibold 
      ${
        notification.type === "success"
          ? "bg-green-600"
          : notification.type === "error"
          ? "bg-red-600"
          : "bg-yellow-600"
      } transition-all duration-300 ease-in-out`}
        >
          {notification.message}
        </div>
      )}

      {/* Modal de Revisión de Orden */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          // Permite cerrar el modal haciendo clic fuera de él
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[95%] max-w-md relative transition-all duration-300">
            {/* Encabezado del Modal */}
            <h2 className="text-2xl font-extrabold text-red-700 border-b-2 border-red-100 pb-3 mb-4">
              📋 Resumen de Orden ({totalItems} plato
              {totalItems !== 1 ? "s" : ""})
            </h2>

            {/* Lista de Platos (Scrollable) */}
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

            {/* Footer: Subtotal y Botones de Acción */}
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="flex justify-between font-bold text-xl mb-4">
                <span>SUBTOTAL:</span>
                <span className="text-red-700">${subtotal}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    console.log("CLICK: Botón CERRAR modal.");
                    setShowModal(false);
                  }}
                  className="flex-1 py-3 font-bold text-white rounded-lg bg-gray-500 hover:bg-gray-600 transition duration-150 shadow-md"
                >
                  CERRAR
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={totalItems === 0}
                  className={`flex-1 py-3 font-bold text-white rounded-lg transition duration-150 shadow-md ${
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

export default PreviewOrder;

import React, { useState, useMemo } from "react";

const PreviewOrder = ({ activeOrder, onConfirm, updateOrder }) => {
  const [showModal, setShowModal] = useState(false);

  // Calculamos el total de items
  const totalItems = useMemo(() => 
    activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0), 
  [activeOrder]);

  // Calculamos el precio total
  const subtotal = useMemo(() => 
    activeOrder.reduce((sum, i) => {
      const itemPrice = parseFloat(i.precio) || 0;
      return sum + itemPrice * (i.quantity || 0);
    }, 0).toFixed(2), 
  [activeOrder]);

  const handleSendOrder = () => {
    if (totalItems === 0) return;
    onConfirm();
    setShowModal(false);
  };

  // Función para eliminar items individuales desde el carrito
  const handleDeleteItem = (item) => {
    updateOrder(item, "remove");
  };

  return (
    <>
      {/* Botón Flotante (FAB) */}
      {/* 🔧 CORRECCIÓN CRÍTICA: Agregamos 'relative' aquí 👇 */}
      <button
        onClick={() => setShowModal(true)}
        className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-500 text-white text-2xl font-bold shadow-lg border-2 border-white hover:scale-110 transition-transform duration-300 ease-in-out cursor-pointer z-50"
      >
        🛒
        {/* Badge con el contador */}
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white animate-bounce-in">
            {totalItems}
          </span>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          {/* Contenedor del Modal */}
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[95%] max-w-md animate-fade-in-up">
            
            {/* Cabecera */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-extrabold text-gray-800">
                📋 Tu Pedido
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Lista de Items */}
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {totalItems === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-4xl mb-2">🥗</p>
                  <p>Tu bandeja está vacía.</p>
                </div>
              ) : (
                activeOrder.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      {/* Cantidad */}
                      <span className="bg-red-100 text-red-800 text-sm font-bold px-2 py-1 rounded">
                        {item.quantity}x
                      </span>
                      {/* Detalles del plato */}
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 leading-tight">
                          {item.nombre}
                        </span>
                        <span className="text-xs text-gray-500">
                          ${item.precio} c/u
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Subtotal por item */}
                      <span className="font-bold text-gray-800">
                        ${(item.precio * item.quantity).toFixed(2)}
                      </span>
                      
                      {/* Botón Eliminar */}
                      <button 
                        onClick={() => handleDeleteItem(item)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title="Eliminar del pedido"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer (Totales y Botón Confirmar) */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-end mb-6">
                <span className="text-gray-600 font-medium">Total a pagar:</span>
                <span className="text-3xl font-black text-red-700">${subtotal}</span>
              </div>

              <button
                onClick={handleSendOrder}
                disabled={totalItems === 0}
                className={`w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg transition-all transform active:scale-95 ${
                  totalItems > 0
                    ? "bg-red-600 hover:bg-red-700 hover:shadow-red-500/30"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                CONFIRMAR PEDIDO 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(PreviewOrder);
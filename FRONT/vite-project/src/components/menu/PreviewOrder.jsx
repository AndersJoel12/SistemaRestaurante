import React, { useState, useMemo } from "react";

// UTILIDAD: Formateador de moneda profesional (puedes moverlo a un archivo utils.js luego)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const PreviewOrder = ({ activeOrder, onConfirm, updateOrder }) => {
  const [showModal, setShowModal] = useState(false);

  // 1. CÁLCULOS OPTIMIZADOS
  const totalItems = useMemo(() => 
    activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0), 
  [activeOrder]);

  const subtotal = useMemo(() => 
    activeOrder.reduce((sum, i) => {
      const itemPrice = parseFloat(i.precio) || 0;
      return sum + itemPrice * (i.quantity || 0);
    }, 0), 
  [activeOrder]);

  // 2. MANEJADORES
  const handleSendOrder = () => {
    if (totalItems === 0) return;
    onConfirm(); // Función que viene del padre (probablemente Home o Menu)
    setShowModal(false);
  };

  const handleDeleteItem = (item) => {
    updateOrder(item, "remove", 0); // Asumimos que "remove" borra todo el item
  };

  return (
    <>
      {/* --- BOTÓN FLOTANTE (FAB) --- */}
      <button
        onClick={() => setShowModal(true)}
        // ACCESIBILIDAD: Descripción dinámica para ciegos
        aria-label={`Ver carrito de compras. Tienes ${totalItems} productos por un total de ${formatCurrency(subtotal)}`}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-16 h-16 
                   rounded-full bg-orange-600 text-white text-3xl shadow-xl shadow-orange-500/40 
                   border-4 border-white hover:scale-110 hover:bg-orange-700 
                   transition-all duration-300 ease-in-out cursor-pointer active:scale-95"
      >
        <span aria-hidden="true">🛒</span> {/* Ocultamos el emoji al lector porque ya leímos el label */}
        
        {/* Badge con el contador visual */}
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white animate-bounce-in">
            {totalItems}
          </span>
        )}
      </button>

      {/* --- MODAL --- */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          role="dialog" // Semántica correcta
          aria-modal="true"
          aria-labelledby="cart-title"
          onClick={(e) => {
            // Cerrar al hacer clic fuera del contenido
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          {/* Contenedor del Modal */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] animate-scale-up">
            
            {/* Cabecera */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 id="cart-title" className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <span>📋</span> Tu Pedido
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                aria-label="Cerrar carrito"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Lista de Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {totalItems === 0 ? (
                <div className="text-center py-10 opacity-60">
                  <p className="text-6xl mb-4">🥗</p>
                  <p className="text-lg font-medium text-gray-500">Tu bandeja está vacía.</p>
                  <p className="text-sm text-gray-400">¡Agrega algo delicioso del menú!</p>
                </div>
              ) : (
                activeOrder.map((item) => (
                  <article
                    key={item.id}
                    className="flex justify-between items-start bg-gray-50 p-3 rounded-xl border border-gray-100"
                  >
                    <div className="flex gap-3">
                      {/* Cantidad */}
                      <span className="bg-white text-red-700 border border-red-100 font-bold w-8 h-8 flex items-center justify-center rounded-lg shadow-sm text-sm shrink-0">
                        {item.quantity}x
                      </span>
                      
                      {/* Detalles */}
                      <div>
                        <h4 className="font-bold text-gray-800 leading-tight">
                          {item.nombre}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {formatCurrency(item.precio)} c/u
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Subtotal Item */}
                      <span className="font-bold text-gray-900">
                        {formatCurrency(item.precio * item.quantity)}
                      </span>
                      
                      {/* Botón Eliminar */}
                      <button 
                        onClick={() => handleDeleteItem(item)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        aria-label={`Eliminar ${item.nombre} del pedido`}
                      >
                         🗑️
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Footer (Fijo abajo) */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between items-end mb-4">
                <span className="text-gray-600 font-medium text-lg">Total a pagar</span>
                <span className="text-3xl font-black text-gray-900 tracking-tight">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <button
                onClick={handleSendOrder}
                disabled={totalItems === 0}
                className={`w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg transition-all transform active:scale-[0.98] 
                ${
                  totalItems > 0
                    ? "bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-500/40"
                    : "bg-gray-300 cursor-not-allowed grayscale"
                }`}
              >
                {totalItems > 0 ? "CONFIRMAR PEDIDO 🚀" : "Agrega productos"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(PreviewOrder);
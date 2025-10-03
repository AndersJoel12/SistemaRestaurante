// src/components/MenuItem.jsx

import React from "react";

// Usamos las props para acceder a la orden activa
const MenuItem = ({ dish, activeOrder, setActiveOrder }) => {
  const priceFormatted = `$${dish.price.toFixed(2)}`;

  // 1. Encuentra el plato en la orden actual
  const itemInOrder = activeOrder.find((item) => item.id === dish.id);
  const currentQuantity = itemInOrder ? itemInOrder.quantity : 0;

  // 2. Función central para actualizar la cantidad (Añadir/Restar/Eliminar)
  const updateQuantity = (change) => {
    const newQuantity = currentQuantity + change;

    if (newQuantity <= 0) {
      // Elimina el plato si la cantidad llega a cero
      setActiveOrder(activeOrder.filter((item) => item.id !== dish.id));
    } else if (itemInOrder) {
      // Actualiza la cantidad si ya existe
      setActiveOrder(
        activeOrder.map((item) =>
          item.id === dish.id ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      // Añade el plato con cantidad 1 (solo se llama con change = +1)
      setActiveOrder([...activeOrder, { ...dish, quantity: 1 }]);
    }
  };

  if (!dish.available) {
    // Estilo para platos agotados
    return (
      <div className="p-3 bg-gray-200 border-gray-300 opacity-60 rounded-lg shadow-sm h-full">
        <p className="font-bold text-lg text-gray-500">{dish.name}</p>
        <p className="text-sm text-red-500 font-semibold">AGOTADO</p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white border-2 border-red-100 rounded-lg shadow-md flex flex-col hover:bg-red-50 transition-colors h-full">
      {/* Sección Superior: Info del Plato y Cantidad Actual */}
      <div className="flex justify-between items-start mb-2">
        <div className="truncate pr-2">
          {/* CORRECCIÓN: Aseguramos texto negro como solicitaste */}
          <p className="font-bold text-lg text-gray-900 truncate">
            {dish.name}
          </p>
          <p className="text-sm text-red-700 font-bold mt-1">
            {priceFormatted}
          </p>
        </div>
        {/* Etiqueta de cantidad (Dorado) */}
        {currentQuantity > 0 && (
          <span className="text-sm font-extrabold p-1 px-2 bg-yellow-400 text-red-900 rounded-full">
            {currentQuantity}
          </span>
        )}
      </div>

      {/* Sección Inferior: Control de Cantidad (El TPV/POS) */}
      <div className="flex justify-center space-x-2 mt-auto pt-2">
        {/* Botón de Restar/Eliminar */}
        <button
          onClick={() => updateQuantity(-1)}
          disabled={currentQuantity === 0}
          className={`
            p-2 w-full rounded-lg font-extrabold text-xl transition-colors
            ${
              currentQuantity > 0
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          -
        </button>

        {/* Botón de Añadir */}
        <button
          onClick={() => updateQuantity(1)}
          className="p-2 w-full bg-red-700 text-yellow-400 hover:bg-red-600 rounded-lg font-extrabold text-xl transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default MenuItem;

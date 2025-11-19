import React from "react";

// Recibe la función centralizada 'updateOrder' en lugar de setActiveOrder
const MenuItem = ({ dish, activeOrder, updateOrder }) => {
  // --- Lógica de Cantidad ---
  // Busca si el plato ya existe en la orden
  const itemInOrder = activeOrder?.find((item) => item.id === dish.id);
  const quantity = itemInOrder ? itemInOrder.quantity : 0;

  console.log(
    `ITEM_RENDER: ${dish.nombre} (ID: ${dish.id}) - Cantidad actual: ${quantity}`
  );

  /**
   * Gestiona el aumento o disminución de la cantidad y llama al padre para actualizar el estado.
   * @param {number} change - El cambio de cantidad (+1 o -1).
   */
  const handleUpdateQuantity = (change) => {
    // Evita añadir platos si no están disponibles
    if (!dish.disponible && change > 0) {
      console.warn(`ACTION: Intento de añadir plato agotado: ${dish.nombre}`);
      return;
    }

    const newQuantity = quantity + change;
    console.log(
      `ACTION: Click en ${dish.nombre}. Nueva cantidad calculada: ${newQuantity}`
    );

    if (newQuantity <= 0) {
      // Si la cantidad es 0 o menos, envía la acción 'remove' al padre
      updateOrder(dish, "remove", 0);
    } else if (quantity === 0 && change > 0) {
      // Si antes no estaba en la orden, envía la acción 'add'
      updateOrder(dish, "add", newQuantity);
    } else {
      // Si ya estaba, envía la acción 'update' con la nueva cantidad
      updateOrder(dish, "update", newQuantity);
    }
  };

  // -------------------------------------------------------------------------------------------------------
  // Estilos y Renderizado
  // ---------------------------------------------------------------------------------------------------
  // Añado 'sm:p-6' para más padding en pantallas grandes, 'md:text-left' para el texto, etc.
  const cardClasses = `
  flex flex-col max-h-100 
  justify-between bg-white 
  p-3 sm:p-4 rounded-xl shadow-lg 
  transform transition duration-300 
  ${
    dish.disponible
      ? "hover:shadow-2xl hover:-translate-y-1"
      : "opacity-50 cursor-not-allowed grayscale" // Estilo para platos agotados
  }
  `;

  // Hago los botones ligeramente más pequeños en móviles 'w-7 h-7' y normales en pantallas grandes 'sm:w-8 sm:h-8'
  const buttonClass =
    "w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white font-bold transition-transform transform hover:scale-110 shadow-md flex items-center justify-center text-lg";

  const getAvailabilityStatus = () => (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        dish.disponible
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {dish.disponible ? "Disponible" : "Agotado"}
    </span>
  );

  const renderClientMode = () => (
    // Reduzco el margen superior 'mt-2' en móviles, y el tamaño del precio 'text-lg'
    <div className="flex items-center justify-between mt-2 sm:mt-3 p-1 sm:p-2">
      <span className="flex text-lg sm:text-xl font-extrabold text-black">
        <span className="text-red-700 mr-0.5 sm:mr-0">$</span>
        {/* Asegura que el precio sea un número flotante y se muestre con dos decimales */}
        {parseFloat(dish.precio || 0).toFixed(2)}
        <span className="text-red-700 ml-1">Ref</span>
      </span>

      {dish.disponible ? (
        // Reduzco el espaciado 'space-x-1' en móviles
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Botón para restar cantidad (solo visible si quantity > 0) */}
          {quantity > 0 && (
            <button
              onClick={() => handleUpdateQuantity(-1)}
              className={`${buttonClass} bg-red-500 hover:bg-red-600`}
              aria-label={`Quitar uno de ${dish.nombre}`}
            >
              -
            </button>
          )}
          {/* Muestra la cantidad actual (solo visible si quantity > 0) */}
          {quantity > 0 && (
            <span className="text-base sm:text-lg font-bold w-5 sm:w-6 text-center text-gray-800">
              {quantity}
            </span>
          )}
          {/* Botón para añadir cantidad */}
          <button
            onClick={() => handleUpdateQuantity(1)}
            className={`${buttonClass} bg-green-500 hover:bg-green-600`}
            aria-label={`Añadir uno de ${dish.nombre}`}
          >
            +
          </button>
        </div>
      ) : (
        // Muestra el estado si está agotado
        getAvailabilityStatus()
      )}
    </div>
  );

  return (
    <div className={cardClasses}>
      {/* --- Imagen del Plato --- */}
      <div className="mb-2 sm:mb-3">
        <img
          // Ajusto la altura de la imagen a 'h-36' en móviles y 'sm:h-40' en pantallas más grandes
          src={
            dish.imagen ||
            "https://placehold.co/300x160/ef4444/ffffff?text=Plato%20No%20Image"
          }
          alt={dish.nombre}
          className="w-full h-36 sm:h-40 object-cover rounded-lg"
        />
      </div>
      {/* --- Cuerpo de la Carta --- */}
      <div className="flex-grow">
        {/* Ajusto el tamaño del título 'text-lg' en móviles y 'sm:text-xl' en pantallas grandes */}
        <h3 className="text-lg sm:text-xl mt-1 sm:mt-2 font-bold text-gray-800 leading-tight">
          {dish.nombre}
        </h3>
        {/* Hago el badge de categoría ligeramente más pequeño y ajusto márgenes */}
        <span className="mt-1 text-xs text-red-600 font-semibold px-2 py-0.5 bg-red-100 rounded-full uppercase tracking-wider inline-block">
          {dish.categoria}
        </span>

        {/* Descripción (Ajusto el margen superior) */}
        <p className="text-sm text-gray-600 mt-2 mb-1 line-clamp-2">
          {dish.descripcion}
        </p>
      </div>
      {/* Renderiza el precio y los botones de cantidad */}
      {renderClientMode()}{" "}
    </div>
  );
};

export default MenuItem;
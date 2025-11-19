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
  const cardClasses = `
  flex flex-col max-h-100 
  justify-between bg-white 
  p-4 rounded-xl shadow-lg 
  transform transition duration-300 
  ${
    dish.disponible
      ? "hover:shadow-2xl hover:-translate-y-1"
      : "opacity-50 cursor-not-allowed grayscale" // Estilo para platos agotados
  }
 `;

  const buttonClass =
    "w-8 h-8 rounded-full text-white font-bold transition-transform transform hover:scale-110 shadow-md";

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
    <div className="flex items-center justify-between mt-3 p-2">
      <span className="flex text-xl font-extrabold text-black">
        <span className="text-red-700">$</span>
        {/* Asegura que el precio sea un número flotante y se muestre con dos decimales */}
        {parseFloat(dish.precio || 0).toFixed(2)}
        <span className="text-red-700 ml-1">Ref</span>
      </span>

      {dish.disponible ? (
        <div className="flex items-center space-x-2">
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
            <span className="text-lg font-bold w-6 text-center text-gray-800">
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
      <div className="mb-3">
        <img
          // Usa dish.imagen de la API. Proporciona una imagen de fallback si no existe.
          src={
            dish.imagen ||
            "https://placehold.co/300x160/ef4444/ffffff?text=Plato%20No%20Image"
          }
          alt={dish.nombre}
          className="w-full h-40 object-cover rounded-lg"
        />
      </div>
      {/* --- Cuerpo de la Carta --- */}
      <div className="flex-grow">
        <h3 className="text-xl mt-2 font-bold text-gray-800 leading-tight">
          {dish.nombre}
        </h3>
        <span className="mt-2 text-xs text-red-600 font-semibold ml-3 ml-3 px-2 py-1 bg-red-100 rounded-full uppercase tracking-wider">
          {dish.categoria}
        </span>

        {/* Descripción */}
        <p className="text-sm text-gray-600 mt-3 mb-2 line-clamp-2">
          {dish.descripcion}
        </p>
      </div>
      {/* Renderiza el precio y los botones de cantidad */}
      {renderClientMode()}{" "}
    </div>
  );
};

export default MenuItem;

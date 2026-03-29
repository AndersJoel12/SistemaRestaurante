import React from "react";

const MenuItem = ({
  dish,
  activeOrder,
  setActiveOrder,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  // --- Lógica de Cliente (Cantidad) ---
  const itemInOrder = Array.isArray(activeOrder)
    ? activeOrder.find((item) => item.id === dish.id)
    : null;
  const quantity = itemInOrder ? itemInOrder.quantity : 0;

  const handleUpdateQuantity = (change) => {
    if (!dish.available && change > 0) return;

    const safeOrder = Array.isArray(activeOrder) ? activeOrder : [];
    const newQuantity = quantity + change;

    if (newQuantity <= 0) {
      setActiveOrder(safeOrder.filter((item) => item.id !== dish.id));
    } else if (itemInOrder) {
      setActiveOrder(
        safeOrder.map((item) =>
          item.id === dish.id ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      setActiveOrder([...safeOrder, { ...dish, quantity: 1 }]);
    }
  };

  // --- Estilos y Renderizado ---
  const cardClasses = `bg-white p-4 rounded-xl shadow-lg transform transition duration-300 ${
    dish.available
      ? "hover:shadow-2xl hover:-translate-y-1"
      : "opacity-50 cursor-not-allowed grayscale"
  }`;
  const buttonClass =
    "w-8 h-8 rounded-full text-white font-bold transition-transform transform hover:scale-110 shadow-md";

  const getAvailabilityStatus = () => (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        dish.available
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {dish.available ? "Disponible" : "Agotado"}
    </span>
  );

  const renderClientMode = () => (
    <div className="flex items-center justify-between mt-3">
      <span className="text-xl font-extrabold text-red-700">
        ${dish.price.toFixed(2)}
      </span>

      {dish.available ? (
        <div className="flex items-center space-x-2">
          {quantity > 0 && (
            <button
              onClick={() => handleUpdateQuantity(-1)}
              className={`${buttonClass} bg-red-500 hover:bg-red-600`}
              aria-label={`Quitar uno de ${dish.name}`}
            >
              −
            </button>
          )}
          {quantity > 0 && (
            <span className="text-lg font-bold w-6 text-center text-gray-800">
              {quantity}
            </span>
          )}
          <button
            onClick={() => handleUpdateQuantity(1)}
            className={`${buttonClass} bg-green-500 hover:bg-green-600`}
            aria-label={`Añadir uno de ${dish.name}`}
          >
            +
          </button>
        </div>
      ) : (
        getAvailabilityStatus()
      )}
    </div>
  );

  const renderAdminMode = () => (
    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
      {getAvailabilityStatus()}
      <div className="space-x-2">
        <button
          onClick={() => onEdit(dish)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(dish.id)}
          className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  );

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-gray-800 leading-tight">
          {dish.name}
        </h3>
        <span className="text-xs text-red-500 font-medium ml-2 uppercase">
          {dish.category}
        </span>
      </div>

      <p className="text-sm text-gray-500 mt-1 mb-2">
        {dish.category === "sushi"
          ? "Fresco y auténtico sushi japonés."
          : "Plato tradicional de la casa."}
      </p>

      {isAdmin ? renderAdminMode() : renderClientMode()}
    </div>
  );
};

export default MenuItem;

import React from "react";

const MenuItem = ({ dish, activeOrder, setActiveOrder }) => {
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

  // -------------------------------------------------------------------------------------------------------
  // Estilos y Renderizado
  // ---------------------------------------------------------------------------------------------------
  const cardClasses = `
    flex flex-col max-h-100 
    justify-between bg-white 
    p-4 rounded-xl shadow-lg 
    transform transition duration-300 
    ${
      dish.available
        ? "hover:shadow-2xl hover:-translate-y-1"
        : "opacity-50 cursor-not-allowed grayscale"
    }
  `;

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
    <div className="flex items-center justify-between mt-3 p-2">
      <span className="flex text-xl font-extrabold text-black">
        <span className="text-red-700">$</span>
        {dish.price.toFixed(2)}
        <span className="text-red-700 ml-1">Ref</span>
      </span>

      {dish.available ? (
        <div className="flex items-center space-x-2">
          {quantity > 0 && (
            <button
              onClick={() => handleUpdateQuantity(-1)}
              className={`${buttonClass} bg-red-500 hover:bg-red-600`}
              aria-label={`Quitar uno de ${dish.name}`}
            >
              -
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

  return (
    <div className={cardClasses}>
      {/* --- 2. Imagen del Plato (Elemento Superior) --- */}
      <div className="mb-3">
        <img
          src={
            dish.image ||
            "https://tse3.mm.bing.net/th/id/OIP.k1cTgSGBj2CQKH2JzXBdSgHaE7?rs=1&pid=ImgDetMain&o=7&rm=3"
          }
          alt={dish.name}
          className="w-full h-40 object-cover rounded-lg"
        />
      </div>

      {/* --- 3. Cuerpo de la Carta (Crece para ocupar el espacio) --- */}
      <div className="flex-grow">
        <h3 className="text-xl mt-2 font-bold text-gray-800 leading-tight">
          {dish.name}
        </h3>
        <span className="mt-2 text-xs text-red-600 font-semibold ml-3 ml-3 px-2 py-1 bg-red-100 rounded-full uppercase tracking-wider">
          {dish.category}
        </span>

        {/* Descripción */}
        <p className="text-sm text-gray-600 mt-3 mb-2 line-clamp-2">
          {/* Aquí podrías usar una descripción más corta o la lógica actual */}
          {dish.description ||
            (dish.category === "sushi"
              ? "Fresco y auténtico sushi japonés."
              : "Plato tradicional de la casa.")}
        </p>
      </div>

      {renderClientMode()}
    </div>
  );
};

export default MenuItem;

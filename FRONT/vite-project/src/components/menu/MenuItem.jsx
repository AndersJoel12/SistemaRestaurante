import React, { useState } from "react";

const MenuItem = ({ dish, activeOrder, updateOrder }) => {
  const itemInOrder = activeOrder?.find((item) => item.id === dish.id);
  const quantity = itemInOrder ? itemInOrder.quantity : 0;
  const [showControls, setShowControls] = useState(false);

  const handleUpdateQuantity = (change) => {
    if (!dish.disponible && change > 0) return;

    const newQuantity = quantity + change;

    if (newQuantity <= 0) {
      updateOrder(dish, "remove", 0);
      setShowControls(false);
    } else if (quantity === 0 && change > 0) {
      updateOrder(dish, "add", newQuantity);
      setShowControls(true);
    } else {
      updateOrder(dish, "update", newQuantity);
    }
  };

  const cardClasses = `
    flex flex-col justify-between bg-white 
    p-3 sm:p-4 rounded-xl shadow-lg 
    transform transition duration-300 
    min-h-[300px] overflow-hidden
    ${
      dish.disponible
        ? "hover:shadow-2xl hover:-translate-y-1"
        : "opacity-50 cursor-not-allowed grayscale"
    }
  `;

  const buttonClass =
    "rounded-full text-white font-bold transition-transform transform hover:scale-110 shadow-md flex items-center justify-center";

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

  // 📱 Controles en móvil
  const renderMobileControls = () => (
    <div className="flex flex-col items-center mt-2 sm:hidden">
      {/* Precio centrado */}
      <span className="text-base font-extrabold text-black mb-2">
        <span className="text-red-700">$</span>
        {parseFloat(dish.precio || 0).toFixed(2)}
        <span className="text-red-700 ml-1">Ref</span>
      </span>

      {/* Controles alineados */}
      <div className="flex items-center space-x-2">
        {/* Botón + */}
        <button
          onClick={() => handleUpdateQuantity(1)}
          className={`${buttonClass} bg-green-500 hover:bg-green-600 w-8 h-8 text-sm`}
          aria-label={`Añadir uno de ${dish.nombre}`}
        >
          +
        </button>

        {/* Mostrar cantidad y botón – solo si hay cantidad */}
        {quantity > 0 && (
          <>
            <span className="w-8 text-center font-bold text-gray-800 bg-gray-100 rounded">
              {quantity}
            </span>
            <button
              onClick={() => handleUpdateQuantity(-1)}
              className={`${buttonClass} bg-red-500 hover:bg-red-600 w-8 h-8 text-sm`}
              aria-label={`Quitar uno de ${dish.nombre}`}
            >
              –
            </button>
          </>
        )}
      </div>
    </div>
  );

  // 💻 Controles en desktop
  const renderDesktopControls = () => (
    <div className="hidden sm:flex items-center justify-between mt-3">
      <span className="flex items-center text-lg font-extrabold text-black">
        <span className="text-red-700 mr-1">$</span>
        {parseFloat(dish.precio || 0).toFixed(2)}
        <span className="text-red-700 ml-1">Ref</span>
      </span>

      {dish.disponible ? (
        <div className="flex items-center space-x-2">
          {quantity > 0 && (
            <button
              onClick={() => handleUpdateQuantity(-1)}
              className={`${buttonClass} bg-red-500 hover:bg-red-600 w-8 h-8 text-sm`}
              aria-label={`Quitar uno de ${dish.nombre}`}
            >
              -
            </button>
          )}
          {quantity > 0 && (
            <span className="w-8 text-center font-bold text-gray-800 bg-gray-100 rounded">
              {quantity}
            </span>
          )}
          <button
            onClick={() => handleUpdateQuantity(1)}
            className={`${buttonClass} bg-green-500 hover:bg-green-600 w-8 h-8 text-sm`}
            aria-label={`Añadir uno de ${dish.nombre}`}
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
      {/* Imagen */}
      <div className="mb-2">
        <img
          src={dish.imagen} /* "https://placehold.co/300x160/ef4444/ffffff?text=Plato%20No%20Image" */
          alt={dish.nombre}
          className="w-full h-36 sm:h-40 object-cover rounded-lg aspect-[3/2]"
        />
      </div>

      {/* Info */}
      <div className="flex-grow">
        <h3 className="text-lg sm:text-xl mt-1 font-bold text-gray-800 leading-tight">
          {dish.nombre}
        </h3>
        <span className="mt-1 text-xs text-red-600 font-semibold px-2 py-0.5 bg-red-100 rounded-full uppercase tracking-wider inline-block">
          {dish.categoria}
        </span>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 mb-1 line-clamp-1 sm:line-clamp-2">
          {dish.descripcion}
        </p>
      </div>

      {/* Controles */}
      {dish.disponible ? renderMobileControls() : getAvailabilityStatus()}
      {dish.disponible && renderDesktopControls()}
    </div>
  );
};

export default React.memo(MenuItem);

import React, { useEffect } from "react";

const MenuItem = ({
  dish,
  activeOrder,
  setActiveOrder,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  // Ejecuta este log cada vez que se renderiza un plato
  useEffect(() => {
    // --- 🐛 DEBUGGING CRÍTICO: Muestra el objeto recibido ---
    console.log("--- 🐛 MenuItem RECIBIDO ---");
    console.log("Plato completo (Dish):", dish);
    console.log("  -> ID:", dish?.id);
    console.log("  -> Precio:", dish?.price, "(Debe ser un número)");
    console.log("  -> Disponible:", dish?.available, "(Debe ser un booleano)");
    console.log(
      "  -> Categoría (Filtro):",
      dish?.category,
      "(Debe coincidir con la categoría activa)"
    );
    // Si aquí ves 'undefined' en algún campo, ese es el nombre de campo que debes cambiar.
  }, [dish]);

  // --- Verificar campos esenciales y usar valores seguros ---
  // Usamos parseFloat y fallback 0.0 para evitar que .toFixed(2) falle si dish.price es null o string.
  const dishPrice = parseFloat(dish?.precio) || 0.0;
  const dishName = dish?.nombre || "Producto sin nombre";
  const isAvailable = dish?.disponible ?? true; // Si es null o undefined, asumimos disponible por defecto

  // --- Lógica de Cliente (Cantidad) ---
  const itemInOrder = Array.isArray(activeOrder)
    ? activeOrder.find((item) => item.id === dish?.id)
    : null;
  const quantity = itemInOrder ? itemInOrder.quantity : 0;

  const handleUpdateQuantity = (change) => {
    if (!isAvailable && change > 0) return;

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
    isAvailable
      ? "hover:shadow-2xl hover:-translate-y-1"
      : "opacity-50 cursor-not-allowed grayscale"
  }`;
  const buttonClass =
    "w-8 h-8 rounded-full text-white font-bold transition-transform transform hover:scale-110 shadow-md";

  const getAvailabilityStatus = () => (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isAvailable ? "Disponible" : "Agotado"}
    </span>
  );

  const renderClientMode = () => (
    <div className="flex items-center justify-between mt-3">
      <span className="text-xl font-extrabold text-red-700">
        ${dishPrice.toFixed(2)}
      </span>

      {isAvailable ? (
        <div className="flex items-center space-x-2">
          {quantity > 0 && (
            <button
              onClick={() => handleUpdateQuantity(-1)}
              className={`${buttonClass} bg-red-500 hover:bg-red-600`}
              aria-label={`Quitar uno de ${dishName}`}
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
            aria-label={`Añadir uno de ${dishName}`}
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
      {/* Contenedor de la Imagen del Plato (Nueva adición) */}
      <div className="h-40 w-full overflow-hidden rounded-xl">
        <img
          // Asume que la API devuelve la URL de la imagen en 'plato.imagen'
          src={
            dish?.imagen ||
            "https://placehold.co/600x400/8B0000/FFD700?text=DATTEBAYO"
          }
          alt={`Imagen de ${dish?.nombre}`}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            // Fallback para evitar errores si la imagen no carga
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/600x400/8B0000/FFD700?text=DATTEBAYO";
          }}
        />
      </div>

      {/* Contenido del Plato */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-red-900 leading-snug">
            {dish?.nombre}
          </h3>
          {/* Manteniendo la categoría */}
          <span className="text-xs text-red-500 font-medium ml-2 uppercase bg-red-100 px-2 py-0.5 rounded-full shadow-sm">
            {dish?.categoria || "N/A"}
          </span>
        </div>

        {/* Descripción real del plato (usando plato.descripcion) */}
        <p className="text-sm text-gray-600 mt-2 mb-4 h-10 overflow-hidden line-clamp-2">
          {dish?.descripcion || "Descripción no disponible para este plato."}
        </p>

        {/* Lógica de modo de administración/cliente (se mantiene) */}
        {isAdmin ? renderAdminMode() : renderClientMode()}
      </div>
    </div>
  );
};

export default MenuItem;

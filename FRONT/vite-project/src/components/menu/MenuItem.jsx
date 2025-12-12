import React, { useMemo } from "react";
// IMPORTANTE: Reutilizamos el componente que ya arreglamos. 
// Asegúrate de que la ruta sea correcta.
import Quantity from "../Quantity"; 

const MenuItem = ({ dish, activeOrder, updateOrder }) => {
  
  // 1. LÓGICA DE CANTIDAD
  // Usamos useMemo para evitar buscar en el array en cada render si 'activeOrder' no cambia.
  const quantity = useMemo(() => {
    const itemInOrder = activeOrder?.find((item) => item.id === dish.id);
    return itemInOrder ? itemInOrder.quantity : 0;
  }, [activeOrder, dish.id]);

  const isStockLimitReached = dish.disponible && quantity >= dish.stock;

  // 2. MANEJADORES DE EVENTOS
  // Simplificamos la lógica delegando en updateOrder
  const handleIncrease = () => {
    if (!dish.disponible || isStockLimitReached) return;

    if (quantity >= dish.stock) {
      // Opcional: Puedes agregar una notificación de que el stock es limitado.
      console.warn(`Stock limitado. No se puede añadir más de ${dish.stock} unidades.`);
      return; // Detiene la ejecución si se alcanza el stock máximo
    }

    updateOrder(dish, quantity === 0 ? "add" : "update", quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity <= 0) return;
    if (quantity === 1) {
      updateOrder(dish, "remove", 0);
    } else {
      updateOrder(dish, "update", quantity - 1);
    }
  };

  // Clases dinámicas para la tarjeta
  const cardClasses = `
    flex flex-col justify-between bg-white 
    p-4 rounded-xl shadow-lg 
    transform transition-all duration-300 
    h-full border border-transparent
    ${
      dish.disponible
        ? "hover:shadow-2xl hover:-translate-y-1 hover:border-red-100"
        : "opacity-60 grayscale cursor-not-allowed"
    }
  `;

  return (
    <article className={cardClasses} aria-label={`Tarjeta del plato ${dish.nombre}`}>
      
      {/* SECCIÓN SUPERIOR: Imagen e Información */}
      <div>
        <div className="relative mb-3 overflow-hidden rounded-lg">
          <img
            src={dish.imagen || "https://placehold.co/300x200?text=Sin+Imagen"} 
            alt={dish.nombre}
            className="w-full h-40 object-cover transform transition-transform duration-500 hover:scale-105"
            loading="lazy" // Mejora de rendimiento
          />
          
          {/* Badge de Categoría flotante */}
          <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-red-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            {dish.categoria}
          </span>
        </div>

        <h3 className="text-lg font-extrabold text-gray-800 leading-tight mb-1">
          {dish.nombre}
        </h3>
        
        <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
          {dish.descripcion}
        </p>
      </div>

      {/* SECCIÓN INFERIOR: Precio y Controles */}
      {/* Usamos Flexbox para alinear precio a la izq y controles a la der (o abajo en móvil) */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        
        {/* PRECIO */}
        <div className="text-black font-extrabold text-xl flex items-baseline">
          <span className="text-red-600 text-sm mr-0.5">$</span>
          {parseFloat(dish.precio || 0).toFixed(2)}
        </div>

        {/* CONTROLES (Reutilizando Quantity) */}
        {dish.disponible ? (
           <div className="w-full sm:w-auto">
             {/* Aquí sucede la MAGIA: 
                Renderizamos el componente Quantity. Él se encarga de mostrar 
                los botones y el número. Nosotros solo le pasamos las funciones.
             */}
             <Quantity 
                value={quantity}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                disabled={isStockLimitReached}
             />
           </div>
        ) : (
          <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full text-center">
            Agotado
          </span>
        )}
      </div>
    </article>
  );
};

// React.memo evita re-renderizados si las props no cambian (bueno para listas largas)
export default React.memo(MenuItem);
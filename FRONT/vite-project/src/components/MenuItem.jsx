import React from "react";
import Quantity from "./Quantity.jsx";

const MenuItem = ({ dish, activeOrder = [], setActiveOrder }) => {
  // Guardas defensivas
  if (!dish || typeof dish !== "object") {
    return (
      <div className="p-3 bg-gray-200 rounded-lg shadow-sm h-70">
        <p className="font-bold text-sm text-gray-600">Plato inválido</p>
      </div>
    );
  }

  const priceFormatted =
    typeof dish.price === "number" ? `$${dish.price.toFixed(2)}` : "$0.00";

  const itemInOrder = Array.isArray(activeOrder)
    ? activeOrder.find((item) => item.id === dish.id)
    : undefined;

  const currentQuantity = itemInOrder ? itemInOrder.quantity : 0;

  const increase = () => {
    const safeOrder = Array.isArray(activeOrder) ? activeOrder : [];
    if (itemInOrder) {
      setActiveOrder(
        safeOrder.map((item) =>
          item.id === dish.id
            ? { ...item, quantity: currentQuantity + 1 }
            : item
        )
      );
    } else {
      setActiveOrder([...safeOrder, { ...dish, quantity: 1 }]);
    }
  };

  const decrease = () => {
    const safeOrder = Array.isArray(activeOrder) ? activeOrder : [];
    const newQuantity = currentQuantity - 1;

    if (newQuantity <= 0) {
      setActiveOrder(safeOrder.filter((item) => item.id !== dish.id));
    } else {
      setActiveOrder(
        safeOrder.map((item) =>
          item.id === dish.id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  if (!dish.available) {
    return (
      <div className="p-3 bg-gray-200 border-gray-300 opacity-60 rounded-lg shadow-sm h-70">
        <p className="font-bold text-lg text-gray-500">{dish.name || "—"}</p>
        <p className="text-sm text-red-500 font-semibold">AGOTADO</p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white border-2 border-red-100 rounded-lg shadow-md flex flex-col hover:bg-red-50 transition-colors h-70">
      <div className="flex justify-between items-start mb-2">
        <div className="truncate pr-2">
          <p className="font-bold text-lg text-gray-900 truncate">
            {dish.name || "—"}
          </p>
          <p className="text-sm text-red-700 font-bold mt-1">
            {priceFormatted}
          </p>
        </div>
        {currentQuantity > 0 && (
          <span className="text-sm font-extrabold p-1 px-2 bg-yellow-400 text-red-900 rounded-full">
            {currentQuantity}
          </span>
        )}
      </div>

      <Quantity
        value={currentQuantity}
        onIncrease={increase}
        onDecrease={decrease}
        disabled={currentQuantity === 0}
      />
    </div>
  );
};

export default MenuItem;

import React, { useState } from "react";
import Orders from "./Orders.jsx";
import MenuItem from "../components/MenuItem.jsx";

const categories = [
  { id: "entradas", name: "ENTRADAS" },
  { id: "sushi", name: "SUSHI" },
  { id: "bebidas", name: "BEBIDAS" },
  { id: "postre", name: "POSTRE" },
];

const dishes = [
  {
    id: 101,
    category: "entradas",
    name: "Rollitos Primavera",
    price: 4.5,
    available: true,
  },
  {
    id: 102,
    category: "entradas",
    name: "Sopa Miso Tradicional",
    price: 3.0,
    available: true,
  },
  {
    id: 201,
    category: "sushi",
    name: "California Roll",
    price: 8.99,
    available: true,
  },
  {
    id: 204,
    category: "sushi",
    name: "Sashimi de Atún Fresco",
    price: 12.0,
    available: false,
  },
  {
    id: 303,
    category: "bebidas",
    name: "Refresco Cola Grande",
    price: 2.0,
    available: true,
  },
  {
    id: 402,
    category: "postre",
    name: "Helado Frito (Tempura)",
    price: 6.5,
    available: true,
  },
];

const Menu = () => {
  // Estado de la orden y vista
  const [activeOrder, setActiveOrder] = useState([]);
  const [view, setView] = useState("menu"); // "menu" | "review"

  // Conteo de ítems
  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Paso a la revisión
  const goReview = () => {
    if (totalItems === 0) {
      alert("La orden está vacía. Añade al menos un plato.");
      return;
    }
    setView("review");
  };

  // Confirmación final
  const saveOrderToList = () => {
    const subtotal = activeOrder
      .reduce(
        (sum, i) =>
          sum + (typeof i.price === "number" ? i.price : 0) * (i.quantity || 0),
        0
      )
      .toFixed(2);

    alert(
      `✅ Se enviaron ${totalItems} plato${
        totalItems !== 1 ? "s" : ""
      } a cocina.\n` + `Subtotal: $${subtotal}`
    );

    setActiveOrder([]);
    setView("menu");
  };

  // Filtrado por categoría
  const [activeCategory, setActiveCategory] = useState("entradas");
  const filteredDishes = dishes.filter((d) => d.category === activeCategory);

  if (view === "review") {
    return (
      <Orders
        activeOrder={activeOrder}
        saveOrderToList={saveOrderToList}
        onBack={() => setView("menu")}
      />
    );
  }

  // Vista de menú
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header + categorías */}
      <div className="sticky top-0 bg-red-800 text-white z-20">
        <h1 className="p-4 text-3xl font-extrabold text-center text-yellow-400">
          DatteBayo
        </h1>
        <nav className="flex justify-center space-x-2 bg-red-700 border-t border-red-900">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${
                activeCategory === cat.id
                  ? "bg-yellow-400 text-red-900"
                  : "hover:bg-red-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Platos */}
      <main className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
        {filteredDishes.length > 0 ? (
          filteredDishes.map((dish) => (
            <MenuItem
              key={dish.id}
              dish={dish}
              activeOrder={activeOrder}
              setActiveOrder={setActiveOrder}
            />
          ))
        ) : (
          <p className="col-span-full text-gray-500">
            No hay platos en esta categoría.
          </p>
        )}
      </main>

      {/* Botón “Revisar y enviar” */}
      <div className="p-4 bg-white sticky bottom-0 border-t border-gray-300">
        <button
          onClick={goReview}
          disabled={totalItems === 0}
          className={`w-full py-3 font-bold text-white rounded ${
            totalItems > 0
              ? "bg-yellow-400 text-red-900 hover:bg-yellow-500"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Revisar y enviar orden ({totalItems} plato
          {totalItems !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
};

export default Menu;

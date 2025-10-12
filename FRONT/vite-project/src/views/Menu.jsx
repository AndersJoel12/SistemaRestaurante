import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuItem from "../components/MenuItem";

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

const Menu = ({ activeOrder, setActiveOrder }) => {
  const [activeCategory, setActiveCategory] = useState("entradas");
  const navigate = useNavigate();

  const filteredDishes = dishes.filter((d) => d.category === activeCategory);
  const categoryObj = categories.find((c) => c.id === activeCategory);

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      {/* Header */}
      <div className="w-full bg-red-800 shadow-lg z-30 top-0">
        <header className="p-4 text-white">
          <h1 className="text-3xl font-extrabold text-yellow-400 text-center">
            DatteBayo
          </h1>
          <input
            type="text"
            placeholder="Buscar plato por nombre..."
            className="mt-3 p-2 w-full rounded-lg border-amber-500 border-2 text-gray-900 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 focus:outline-none"
          />
        </header>

        {/* Categorías */}
        <nav className="space-x-4 justify-center flex w-full bg-red-700 text-black shadow-md overflow-x-auto border-t-2 border-red-900">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-4 px-6 text-sm font-bold transition-colors whitespace-nowrap min-w-[120px] text-center ${
                activeCategory === cat.id
                  ? "bg-yellow-400 text-red-900 shadow-inner"
                  : "text-black hover:bg-red-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido */}
      <main className="flex mt-2">
        <div className="flex-1 p-4">
          <h2 className="text-2xl font-semibold mb-4 text-red-700 border-b pb-2 border-red-200">
            {categoryObj ? categoryObj.name : "—"}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.isArray(filteredDishes) && filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                <MenuItem
                  key={dish.id}
                  dish={dish}
                  activeOrder={activeOrder}
                  setActiveOrder={setActiveOrder}
                />
              ))
            ) : (
              <p className="text-gray-500 col-span-full">
                No hay platos disponibles en esta categoría.
              </p>
            )}
          </div>

          {/* Botón: ir a revisión */}
          <div className="mt-6">
            <button
              onClick={() => navigate("/Orders")}
              className="px-4 py-2 bg-yellow-400 text-red-900 font-bold rounded hover:bg-yellow-500 transition-transform active:scale-95"
            >
              Revisar y enviar orden
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Menu;

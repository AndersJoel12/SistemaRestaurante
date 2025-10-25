import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuItem from "../components/MenuItem.jsx";
import PreviewOrder from "../components/PreviewOrder.jsx";

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
  const navigate = useNavigate();

  // Estado local de la orden
  const [activeOrder, setActiveOrder] = useState([]);
  const [activeCategory, setActiveCategory] = useState("entradas");

  const filteredDishes = dishes.filter((d) => d.category === activeCategory);
  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const goReview = () => {
    if (totalItems === 0) {
      alert("La orden está vacía. Añade al menos un plato.");
      return;
    }
    // Navega a Orders pasando la orden por estado de navegación
    navigate("/orders", { state: { activeOrder } });
  };

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
      <main className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto" >
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
              {/* Boton de previewOrder */}
      {totalItems > 0 && <PreviewOrder activeOrder={activeOrder} />}
      </main>
    </div>
  );
};

export default Menu;

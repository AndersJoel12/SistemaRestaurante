// src/views/Menu.jsx

import React, { useState } from "react";
// ⭐️ IMPORTACIÓN: Asegúrate que esta ruta sea correcta para tu estructura:
import MenuItem from "./MenuItem";
// =====================================================================
// DATOS DE PRUEBA (MOCK DATA)
// =====================================================================
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
  const [activeCategory, setActiveCategory] = useState("entradas");
  const [activeOrder, setActiveOrder] = useState([]); // ESTADO DE LA ORDEN

  const filteredDishes = dishes.filter(
    (dish) => dish.category === activeCategory
  );

  const subtotal = activeOrder.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const sendOrder = () => {
    if (activeOrder.length === 0) return alert("La orden está vacía.");
    console.log("Orden Final a enviar:", activeOrder);
    alert(`🎉 Orden de $${subtotal.toFixed(2)} enviada a cocina!`);
    setActiveOrder([]);
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Columna Principal: MENÚ Y FILTROS (70% del ancho) */}
      <div className="flex-1 w-2/3">
        {/* HEADER y BUSCADOR (Fijo) */}
        <header className="p-4 bg-red-800 text-white shadow-lg sticky top-0 z-20">
          <h1 className="text-3xl font-extrabold text-yellow-400 text-center">
            DELIGO - TPV RÁPIDO
          </h1>
          <input
            type="text"
            placeholder="Buscar plato por nombre..."
            className="mt-3 p-2 w-full rounded-lg text-gray-800 focus:ring-2 focus:ring-yellow-400"
          />
        </header>

        {/* Navegación de Categorías (Filtros Rápidos) */}
        <nav className="flex w-full bg-red-700 text-white shadow-md sticky top-[110px] z-10 overflow-x-auto border-t-2 border-red-900">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex-1 p-3 text-sm font-bold transition-colors whitespace-nowrap min-w-[100px]
                ${
                  activeCategory === cat.id
                    ? "bg-yellow-400 text-red-900 shadow-inner"
                    : "hover:bg-red-600"
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {/* LISTA DE PLATOS */}
        <main className="p-4">
          <h2 className="text-2xl font-semibold mb-4 text-red-700 border-b pb-2 border-red-200">
            {categories.find((c) => c.id === activeCategory)?.name}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                <MenuItem // ⭐️ Usamos el nombre 'MenuItem'
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
        </main>
      </div>

      {/* Columna Derecha: PANEL DE LA ORDEN ACTIVA (30% del ancho) */}
      <aside className="w-1/3 bg-gray-100 border-l border-red-200 p-4 flex flex-col sticky top-0 h-screen">
        <h2 className="text-2xl font-bold text-red-700 mb-4 border-b-4 border-yellow-400 pb-2">
          ORDEN DE MESA: NUEVA
        </h2>

        {/* Lista de Ítems en la Orden */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {activeOrder.length === 0 ? (
            <p className="text-gray-500 italic pt-4">
              Usa el menú para añadir platos.
            </p>
          ) : (
            activeOrder.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-white p-3 rounded-xl shadow-md border border-gray-200"
              >
                <p className="text-gray-800 font-medium">
                  {item.quantity}x {item.name}
                </p>
                <p className="text-lg font-extrabold text-red-700">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Resumen y Botón de Envío */}
        <div className="mt-4 pt-4 border-t-2 border-red-300">
          <div className="flex justify-between font-bold text-xl mb-4">
            <span>SUBTOTAL:</span>
            <span className="text-red-700">${subtotal.toFixed(2)}</span>
          </div>

          <button
            onClick={sendOrder}
            disabled={activeOrder.length === 0}
            className={`w-full p-4 rounded-xl font-extrabold text-white text-xl transition-colors shadow-lg
              ${
                activeOrder.length > 0
                  ? "bg-red-700 hover:bg-red-600"
                  : "bg-gray-400 cursor-not-allowed"
              }
            `}
          >
            ENVIAR ORDEN A COCINA
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Menu;

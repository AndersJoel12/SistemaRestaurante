// src/views/Menu.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import MenuItem from "../components/menu/MenuItem.jsx";
import MenuFilterBar from "../components/menu/MenuFilterBar.jsx";
import PreviewOrder from "../components/menu/PreviewOrder.jsx";
import Header from "../components/Header.jsx";
import SelectedTables from "../components/SelectedTables.jsx"; // 👈 nuevo import

const URL_CATEGORY = "http://localhost:8000/api/categorias";
const URL_DISHES = "http://localhost:8000/api/productos";
const STORAGE_KEY = "kitchen_kanban";

const Menu = () => {
  const navigate = useNavigate();

  const [dishes, setDishes] = useState([]);
  const [category, setCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [activeOrder, setActiveOrder] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mesaActiva, setMesaActiva] = useState(null);

  // 👇 estado para mostrar mensaje/aviso
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const storedMesa = sessionStorage.getItem("mesa_activa");
    if (storedMesa) {
      setMesaActiva(JSON.parse(storedMesa));
    }
  }, []);

  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    try {
      const [catResponse, dishResponse] = await Promise.all([
        axios.get(URL_CATEGORY),
        axios.get(URL_DISHES),
      ]);

      setCategory([
        { id: "all", nombre: "Todas las categorías" },
        ...catResponse.data,
      ]);
      setDishes(dishResponse.data);
    } catch (error) {
      let errorMessage = "Ocurrió un error al obtener los datos del menú.";
      if (error.request && !error.response) {
        errorMessage = "Error de red: No se pudo alcanzar el servidor.";
      } else if (error.response) {
        errorMessage = `Error ${error.response.status}: Problema de servidor o permisos.`;
      }
      setApiError(errorMessage);
      setCategory([]);
      setDishes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  const filteredDishes = dishes.filter((d) => {
    const dishCategoryId = String(d.categoria_id);
    const activeCatString = String(activeCategory);

    const categoryMatch =
      activeCatString === "all" || dishCategoryId === activeCatString;

    const dishName = d.nombre || "";
    const searchMatch = dishName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const updateOrder = (dish, action, newQuantity) => {
    setActiveOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex(
        (item) => item.id === dish.id
      );
      let updatedOrder = [...prevOrder];

      if (existingItemIndex >= 0) {
        if (action === "update") {
          if (newQuantity <= 0) {
            updatedOrder.splice(existingItemIndex, 1);
          } else {
            updatedOrder[existingItemIndex].quantity = newQuantity;
          }
        } else if (action === "remove") {
          updatedOrder.splice(existingItemIndex, 1);
        }
      } else if (action === "add" && newQuantity > 0) {
        updatedOrder.push({ ...dish, quantity: newQuantity });
      }

      return updatedOrder;
    });
  };

  const calcularSubtotal = (order) =>
    order.reduce((sum, item) => sum + item.precio * item.quantity, 0);

  const goReview = () => {
    if (totalItems === 0) return;

    const nuevaOrden = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      subtotal: calcularSubtotal(activeOrder),
      status: "Recibido",
      items: activeOrder.map((it) => ({
        id: it.id,
        name: it.nombre,
        quantity: it.quantity,
      })),
      mesa: mesaActiva?.number || "N/A",
    };

    const saved = sessionStorage.getItem(STORAGE_KEY);
    let parsed = saved
      ? JSON.parse(saved)
      : { Recibido: [], Pendiente: [], Finalizado: [] };
    parsed.Recibido.push(nuevaOrden);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    // 👇 mostrar aviso
    setMensaje("✅ Orden creada correctamente");

    // 👇 ocultar aviso automáticamente después de 3 segundos
    setTimeout(() => setMensaje(""), 3000);

    navigate("/orders");
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* 🔐 Bloque fijo que agrupa los 3 */}
      <div className="sticky top-0 z-40 shadow-md">
        <Header />

        {/* 👉 Usamos el nuevo componente SelectedTables */}
        <SelectedTables mesa={mesaActiva} />

        <MenuFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          category={category}
        />
      </div>

      {/* 🔽 Contenido desplazable */}
      <main className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-24">
        {loading ? (
          <p className="col-span-full text-center text-red-700 font-semibold">
            ⏳ Cargando menú...
          </p>
        ) : apiError ? (
          <p className="col-span-full text-center text-red-500 font-bold">
            🚨 Error de API: {apiError}
          </p>
        ) : filteredDishes.length > 0 ? (
          filteredDishes.map((dish) => (
            <MenuItem
              key={dish.id}
              dish={dish}
              activeOrder={activeOrder}
              updateOrder={updateOrder}
            />
          ))
        ) : (
          <p className="col-span-full text-gray-500 text-center">
            🍽️ No se encontraron platos que coincidan con los criterios de
            búsqueda.
          </p>
        )}
      </main>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <PreviewOrder activeOrder={activeOrder} onReview={goReview} />
          </div>
        </div>
      )}

      {/* 🔔 Aviso / Toast */}
      {mensaje && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 
                        bg-green-500 text-white px-4 py-2 rounded shadow-lg 
                        z-50"
        >
          {mensaje}
        </div>
      )}
    </div>
  );
};

export default Menu;

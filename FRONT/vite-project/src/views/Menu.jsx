import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MenuItem from "../components/MenuItem.jsx";
import PreviewOrder from "../components/PreviewOrder.jsx";
import axios from "axios";

//Datos de la API
const URL_CATEGORY = "http://localhost:8000/api/categorias";
const URL_DISHES = "http://localhost:8000/api/productos";

//Funcion Menu
const Menu = () => {
  const navigate = useNavigate();

  const [dishes, setDishes] = useState([]); // Almacena todos los platos de la API
  const [category, setCategory] = useState([]); // Almacena todas las categorías de la API

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [activeOrder, setActiveOrder] = useState([]); // La orden actual del cliente
  // Inicializa con "all" para mostrar todos los platos al cargar
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMenuData = useCallback(async () => {
    console.log("FETCH: Iniciando la carga de datos del menú...");
    setLoading(true);
    setApiError(null);

    try {
      const [catResponse, dishResponse] = await Promise.all([
        axios.get(URL_CATEGORY),
        axios.get(URL_DISHES),
      ]);

      const fetchedCategory = catResponse.data;
      const fetchedProducts = dishResponse.data;

      setCategory([
        { id: "all", nombre: "Todas las categorías" },
        ...fetchedCategory,
      ]);
      setDishes(fetchedProducts);

      console.log("FETCH: Categorías obtenidas:", fetchedCategory);
      console.log("FETCH: Platos obtenidos:", fetchedProducts.length);

      if (fetchedCategory.length > 0 && activeCategory === "all") {
        setActiveCategory(fetchedCategory[0].id);
        console.log(
          `FETCH: Categoría inicial activa establecida a ID: ${fetchedCategory[0].id}`
        );
      } else {
        console.log("FETCH: No se establecen categorías iniciales.");
      }
    } catch (error) {
      console.error(
        "FETCH_ERROR: Error al obtener los datos del menú:",
        error.message,
        error.response?.status
      );

      let errorMessage =
        "Ocurrió un error al obtener los datos del menú. Revise la consola para detalles.";
      if (error.request && !error.response) {
        errorMessage =
          "Error de red: No se pudo alcanzar el servidor (verifique que esté corriendo en 8000).";
      } else if (error.response) {
        errorMessage = `Error ${error.response.status}: Problema de servidor o permisos.`;
      }
      setApiError(errorMessage);
      setCategory([]);
      setDishes([]);
    } finally {
      setLoading(false);
      console.log("FETCH: Proceso de carga de datos del menú finalizado.");
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  const filteredDishes = dishes.filter((d) => {
    const activeCatObj = category.find((cat) => cat.id === activeCategory);
    const activeCatName = activeCatObj ? activeCatObj.nombre : null;

    const categoryMatch =
      activeCategory === "all" ||
      (activeCatName && d.categoria === activeCatName);

    const dishName = d.nombre || "";
    const searchMatch = dishName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return categoryMatch && searchMatch;
  });

  console.log(
    `FILTRO: Mostrando ${filteredDishes.length} platos para la categoría: ${activeCategory}`
  );

  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const updateOrder = (dish, action, newQuantity) => {
    console.log(
      `UPDATE_ORDER: Llamado con plato: ${dish.nombre}, acción: ${action}, Cantidad: ${newQuantity}`
    );
    setActiveOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex(
        (item) => item.id === dish.id
      );
      let updatedOrder = [...prevOrder];

      if (existingItemIndex >= 0) {
        // El plato ya existe en la orden
        if (action === "update") {
          if (newQuantity <= 0) {
            updatedOrder.splice(existingItemIndex, 1); // Eliminar
            console.log(`UPDATE_ORDER: Eliminado plato ${dish.nombre}.`);
          } else {
            updatedOrder[existingItemIndex].quantity = newQuantity; // Actualizar
            console.log(
              `UPDATE_ORDER: Cantidad de ${dish.nombre} actualizada a ${newQuantity}.`
            );
          }
        } else if (action === "remove") {
          updatedOrder.splice(existingItemIndex, 1); // Eliminar explícitamente
          console.log(
            `UPDATE_ORDER: Eliminado plato ${dish.nombre} (Acción remove).`
          );
        }
      } else if (action === "add" && newQuantity > 0) {
        // El plato es nuevo en la orden
        updatedOrder.push({ ...dish, quantity: newQuantity });
        console.log(
          `UPDATE_ORDER: Añadido plato ${dish.nombre} con cantidad ${newQuantity}.`
        );
      }

      return updatedOrder;
    });
  };

  const goReview = () => {
    if (totalItems === 0) {
      console.error("NAVIGATION: La orden está vacía. Abortando redirección.");
      return;
    }
    console.log(
      "NAVIGATION: Redireccionando a /orders con total items:",
      totalItems
    );
    navigate("/orders", { state: { activeOrder, dishes } });
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Barra de Navegación y Filtros */}
      <nav className="sticky top-0 bg-red-700 p-4 shadow-lg z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Barra de Búsqueda */}
          <div className="flex-1 w-full sm:w-auto bg-white rounded-lg shadow-md">
            <input
              type="text"
              placeholder="Buscar plato por nombre..."
              value={searchTerm}
              onChange={(e) => {
                console.log("BUSQUEDA: Nuevo término:", e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="w-full p-2 border border-red-500 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 transition duration-150 text-gray-800"
            />
          </div>

          {/* Selector de Categoría (Filtro) */}
          <div className="w-full sm:w-48">
            <select
              // Aseguramos que el valor del select sea string para evitar warnings
              value={String(activeCategory)}
              onChange={(e) => {
                const value = e.target.value;
                // Convertimos a número si no es "all"
                const newCategory = value === "all" ? value : Number(value);
                console.log("FILTRO: Cambiando categoría a:", newCategory);
                setActiveCategory(newCategory);
                setSearchTerm("");
              }}
              className="w-full p-2 border border-red-500 rounded-lg bg-white text-gray-800 appearance-none cursor-pointer"
            >
              {category.map((cat) => (
                // Usamos cat.id como key y value
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </nav>
      {/* Contenido Principal: Platos */}
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
              updateOrder={updateOrder} // 🔑 Pasamos la función centralizada
            />
          ))
        ) : (
          <p className="col-span-full text-gray-500 text-center">
            🍽️ No se encontraron platos que coincidan con los criterios de
            categoría y búsqueda.
          </p>
        )}
      </main>
      {/* PreviewOrder (Flotante en la parte inferior) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <PreviewOrder activeOrder={activeOrder} onReview={goReview} />
          </div>
        </div>
      )}{" "}
    </div>
  );
};

export default Menu;

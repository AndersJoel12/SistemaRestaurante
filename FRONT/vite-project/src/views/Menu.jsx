import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MenuItem from "../components/MenuItem.jsx";
import PreviewOrder from "../components/PreviewOrder.jsx";
import axios from "axios";

//Datos de la API
const URL_CATEGORY = "http://localhost:8000/api/categorias";
const URL_DISHES = "http://localhost:8000/api/productos";

//Funcion Menu
const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [dishes, setDishes] = useState([]);
  const [category, setCategory] = useState([]);	

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [activeOrder, setActiveOrder] = useState([]);
  const [activeCategory, setActiveCategory] = useState("entradas");

  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    try {
      const [catResponse, dishResponse] = await Promise.all([
        axios.get(URL_CATEGORY),
        axios.get(URL_DISHES),
      ]);

      const fetchedCategory = catResponse.data;
      setCategory(fetchedCategory);

      const fetchedProducts = dishResponse.data;
      setDishes(fetchedProducts);

      if (fetchedCategory.length > 0) {
        const firstCategorySlug = fetchedCategory[0].id;
        setActiveCategory(firstCategorySlug);
      } else {
        console.log("No se encontraron categorías.");
      }
    } catch (error) {
      console.error("Error al obtener los datos del menú:", error);
      
      let errorMessage = "Ocurrió un error al obtener los datos del menú";
      if (error.response) {
        errorMessage = `Error ${error.response.status}: Problema de permisos o formato de datos.`;
        console.error("   Error de Respuesta (Status y Data):", error.response.status, error.response.data);
      } else if (error.request) {
        errorMessage = "Error de red: No se pudo alcanzar el servidor (verifique que esté corriendo en 8000).";
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


  const filteredDishes = dishes.filter((d) => d.category === activeCategory);
  console.log(`Filtro: Mostrando ${filteredDishes.length} platos para la categoría: ${activeCategory}`);

  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const goReview = () => {
    if (totalItems === 0) {
      console.error("La orden está vacía. Añade al menos un plato.");
      return;
    } // Navega a Orders, pasando la orden y el menú actual (caché)
    console.log("Iniciando redirección a /orders con total items:", totalItems);
    navigate("/orders", { state: { activeOrder, dishes } });
  };

  const updateOrder = (dish, action, newQuantity) => {
    console.log(`updateOrder llamado con dish: ${dish.name}, action: ${action}, newQuantity: ${newQuantity}`);
    setActiveOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex((item) => item.id === dish.id);
      setActiveOrder((prevOrder) => {return prevOrder;}); // Debug interno
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

      console.log("Orden actualizada:", updatedOrder);
      return updatedOrder;
    });
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="sticky top-0 bg-red-100 text-white z-20">
        {/* Categorías (Navbar) */}
      </div>
      <nav 
        className="flex justify-center space-x-2 bg-red-700 border-t border-red-900 text-white sticky top-0 z-20">
        {category.map((cat) => (
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
      {/* Platos (Main Content) */}
      {/* pb-24: Espacio al final para que el contenido no quede detrás del PreviewOrder fijo */}{" "}
      <main className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-24">
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
            No hay platos en esta categoría.{" "}
          </p>
        )}
      </main>
      {/* PreviewOrder (Flotando en la parte inferior de la pantalla) */}{" "}
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

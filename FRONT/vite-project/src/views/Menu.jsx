import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MenuItem from "../components/MenuItem.jsx";
import PreviewOrder from "../components/PreviewOrder.jsx";
import axios from "axios";

const CATEGORIES_API_URL = "http://127.0.0.1:8000/api/categorias/"; 
const PRODUCTS_API_URL = "http://127.0.0.1:8000/api/productos/";

const Menu = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [activeOrder, setActiveOrder] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // Inicialmente nulo

  const fetchMenuData = useCallback(async () => {
    console.log("Fetching menu data from API...");
    setLoading(true);
    setApiError(null);

    try {
      const [catResponse, prodResponse] = await Promise.all([
        axios.get(CATEGORIES_API_URL),
        axios.get(PRODUCTS_API_URL),
      ]);

      const fetchedCategories = catResponse.data;
      setCategories(fetchedCategories);

      const fetchedProducts = prodResponse.data;
      setDishes(fetchedProducts);

      if (fetchedCategories.length > 0) {
        const firstCategorySlug = fetchedCategories[0].id; 
        setActiveCategory(firstCategorySlug);
      } else {
        console.log("   ADVERTENCIA: No se obtuvieron categorías, categoría activa NULA.");
      }
    } catch (error) {
      console.error("--- ❌ ERROR FATAL DE CARGA DE API ---");
      console.error("Detalles del error (verifique red, URL y permisos):", error);
            
      let errorMessage = "Ocurrió un error al conectar con el servidor.";
      if (error.response) {
        errorMessage = `Error ${error.response.status}: Problema de permisos o formato de datos.`;
        console.error("   Error de Respuesta (Status y Data):", error.response.status, error.response.data);
      } else if (error.request) {
        errorMessage = "Error de red: No se pudo alcanzar el servidor (verifique que esté corriendo en 8000).";
      }

      setApiError(errorMessage);
      setCategories([]); 
      setDishes([]);
    } finally {
      setLoading(false);
    }
  }, []);  

  // Ejecuta la función de carga al montar el componente
  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

// Filtra los platos. Nota: 'dish.category' debe coincidir con 'activeCategory' (el ID de la categoría).
  const filteredDishes = dishes.filter((d) => d.categoria === activeCategory);
  console.log(`Filtro: Mostrando ${filteredDishes.length} platos para la categoría: ${activeCategory}`);

  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const goReview = () => {
    if (totalItems === 0) {
        console.error("La orden está vacía. Añade al menos un plato.");
        return;
    } 
    console.log("Iniciando redirección a /orders con total items:", totalItems);
    navigate("/orders", { state: { activeOrder, dishes } });
};

const updateOrder = (dish, action, newQuantity) => {
    console.log(`Evento de Orden: Plato ID ${dish.id}, Acción: ${action}`);
    setActiveOrder(prevOrder => {
        // ... (lógica de actualización de orden, omitida por brevedad) ...
        return prevOrder; // Mantener por el momento
    });
};


return (
  <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header + categorías (Sticky Top) */}
      <div className="sticky top-0 bg-red-800 text-white z-20 shadow-lg">
          <h1 className="p-4 text-3xl font-extrabold text-center text-yellow-400">
              DatteBayo
          </h1>
          <nav className="flex justify-center space-x-2 bg-red-700 border-t border-red-900 overflow-x-auto">
              {/* Botones de Categoría */}
              {categories.map((cat) => (
                  <button
                      key={cat.id} 
                      onClick={() => {
                          setActiveCategory(cat.id);
                          console.log("Clic: Nueva categoría activa:", cat.id);
                      }}
                      className={`flex-shrink-0 px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
                          activeCategory === cat.id
                              ? "bg-yellow-400 text-red-900 shadow-inner"
                              : "hover:bg-red-600"
                      }`}
                  >
                      {cat.nombre || cat.name} 
                  </button>
              ))}
          </nav>
      </div>

      {/* Platos (Main Content) */}
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pb-24">
          
          {loading && (
              <p className="col-span-full text-center text-red-500 font-semibold mt-10">Cargando menú y categorías...</p>
          )}

          {apiError && (
              <p className="col-span-full text-center text-red-700 bg-red-100 p-3 border border-red-300 rounded-lg mt-4">
                  {apiError} Revisa la consola para ver los pasos de la API.
              </p>
          )}

          {/* Renderizar platos */}
          {!loading && !apiError && filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                  <MenuItem
                      key={dish.id}
                      dish={dish}
                      activeOrder={activeOrder} // Prop temporal, debe ser reemplazada por orderItem
                      setActiveOrder={setActiveOrder} // Prop temporal, debe ser reemplazada por updateOrder
                  />
              ))
          ) : !loading && !apiError && (
              <p className="col-span-full text-gray-500 text-center mt-10">
                  No hay platos disponibles en la categoría **{activeCategory || 'ninguna'}**.
              </p>
          )}
      </main>

      {/* PreviewOrder (Flotando en la parte inferior de la pantalla) */}
      {totalItems > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-transparent pointer-events-none">
              <div className="max-w-4xl mx-auto pointer-events-auto">
                  <PreviewOrder activeOrder={activeOrder} onReview={goReview} />
              </div>
          </div>
      )}
  </div>
);
};

export default Menu;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// CORRECCIÓN DE RUTA: Subiendo dos niveles (../../) para asegurar que se encuentra la carpeta 'components'.
import MenuItem from "../components/MenuItem.jsx";
import PreviewOrder from "../components/PreviewOrder.jsx";

// --- URL BASE DE LA API DE DJANGO ---
// Debe coincidir con la URL de tu servidor Django
const API_URL = "http://127.0.0.1:8000/api/dishes/"; 

// Las categorías se mantienen locales
const categories = [
  { id: "entradas", name: "ENTRADAS" },
  { id: "sushi", name: "SUSHI" },
  { id: "bebidas", name: "BEBIDAS" },
  { id: "postre", name: "POSTRE" },
];

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para los platos (cargados desde la API)
  const [dishes, setDishes] = useState([]);
  
  // Estados de control de la UI/API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados locales para la orden del cliente
  const [activeOrder, setActiveOrder] = useState([]);
  const [activeCategory, setActiveCategory] = useState("entradas");

  // --- LÓGICA DE CARGA DE DATOS DESDE LA API (READ) ---
  const fetchDishes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo obtener el menú.`);
      }
      
      const data = await response.json();
      // Solo mostramos platos disponibles al cliente
      setDishes(data.filter(dish => dish.available)); 
    } catch (err) {
      console.error("Error al cargar el menú:", err);
      // Mensaje de error útil si la API no está encendida
      setError("No se pudo cargar el menú. Asegúrate de que el servidor de Django esté corriendo en 8000.");
      setDishes([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargamos el menú desde la API al montar el componente
  useEffect(() => {
    fetchDishes();
  }, []); 

  // --- LÓGICA DE ORDEN Y NAVEGACIÓN ---
  const filteredDishes = dishes.filter((d) => d.category === activeCategory);
  const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const goReview = () => {
    if (totalItems === 0) {
      // Usamos alert o un modal en lugar de console.error
      alert("La orden está vacía. Añade al menos un plato."); 
      return;
    } 
    
    // Navega a Orders, pasando solo la orden activa
    navigate("/orders", { 
        state: { activeOrder, tableId: location.state?.tableId || "X" } 
    });
  };

  // ----------------------------------------------------
  
  // Renderizado condicional para carga y error
  if (loading) {
    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
            <h2 className="text-2xl font-bold text-red-700">Cargando menú desde el servidor...</h2>
        </div>
    );
  }

  if (error) {
    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <h1 className="text-4xl font-extrabold text-red-800 text-center mb-8">¡Error al cargar el Menú!</h1>
            <p className="text-lg text-gray-700 text-center">{error}</p>
            <p className="text-center mt-4 text-gray-500">Intenta refrescar la página o contacta al administrador.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header + categorías (Sticky Top) */}
      <div className="sticky top-0 bg-red-800 text-white z-20 shadow-xl">
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
                  ? "bg-yellow-400 text-red-900 shadow-inner"
                  : "hover:bg-red-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Platos (Main Content) */}
      {/* pb-24: Espacio al final para que el contenido no quede detrás del PreviewOrder fijo */}
      <main className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-24">
        {filteredDishes.length > 0 ? (
          filteredDishes.map((dish) => (
            <MenuItem
              key={dish.id}
              dish={dish}
              activeOrder={activeOrder}
              setActiveOrder={setActiveOrder}
              // No pasamos isAdmin, por lo que es false por defecto
            />
          ))
        ) : (
          <p className="col-span-full text-gray-500 text-center pt-8">
            No hay platos disponibles en la categoría de "{activeCategory}".
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
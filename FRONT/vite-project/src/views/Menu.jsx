import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import MenuItem from "../components/menu/MenuItem.jsx";
import MenuFilterBar from "../components/menu/MenuFilterBar.jsx";
import PreviewOrder from "../components/menu/PreviewOrder.jsx"; 
import Header from "../components/Header.jsx";
import Notification from "../components/Notification.jsx"; 

// --- CONSTANTES DE API ---
const API_BASE = "http://localhost:8000/api";
const URL_CATEGORY = `${API_BASE}/categorias`;
const URL_DISHES = `${API_BASE}/productos`;
const URL_PEDIDOS = `${API_BASE}/pedidos/`; 
// [NUEVO] Endpoint para traer las mesas reales
const URL_MESAS = `${API_BASE}/mesas`; 

const Menu = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [dishes, setDishes] = useState([]);
  const [category, setCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  
  // [NUEVO] Estados para el manejo de cambio de mesa
  const [availableTables, setAvailableTables] = useState([]); // Lista de mesas reales
  const [showTableModal, setShowTableModal] = useState(false); // Controla el modal

  const [activeOrder, setActiveOrder] = useState(() => {
    const savedOrder = sessionStorage.getItem("active_order");
    return savedOrder ? JSON.parse(savedOrder) : [];
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mesaActiva, setMesaActiva] = useState(null);
  const [notification, setNotification] = useState(null); 

  // --- NOTIFICACIONES ---
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  // --- PERSISTENCIA CARRITO ---
  useEffect(() => {
    sessionStorage.setItem("active_order", JSON.stringify(activeOrder));
  }, [activeOrder]);

  // --- CARGAR MESA INICIAL ---
  useEffect(() => {
    const storedMesa = sessionStorage.getItem("mesa_activa");
    if (storedMesa) {
      try {
        const mesaParsed = JSON.parse(storedMesa);
        setMesaActiva(mesaParsed);
        
        // [NUEVO] 🕵️‍♂️ DETECTIVE DE MESA 999
        // Si detectamos la mesa virtual, activamos el modal inmediatamente
        if (mesaParsed.number === "999" || mesaParsed.id === 999) {
          setShowTableModal(true);
          fetchTables(); // Vamos a buscar las mesas reales
        }
      } catch (e) {
        console.error("Error mesa:", e);
        setMesaActiva(null);
      }
    } else {
      // Si no hay mesa, también forzamos la selección
      setShowTableModal(true);
      fetchTables();
    }
  }, []);

  // [NUEVO] Función para cargar las mesas desde la API
  const fetchTables = async () => {
    try {
      const response = await axios.get(URL_MESAS);
      // Filtramos solo las mesas disponibles si tu API tiene un campo 'estado'
      // Si no, usa response.data directamente
      setAvailableTables(response.data); 
    } catch (error) {
      console.error("Error cargando mesas:", error);
      showNotification("error", "No se pudieron cargar las mesas disponibles.");
    }
  };

  // [NUEVO] Función para confirmar el cambio de mesa
  const handleSelectTable = (mesa) => {
    setMesaActiva(mesa);
    sessionStorage.setItem("mesa_activa", JSON.stringify(mesa));
    setShowTableModal(false); // Cerramos el modal
    showNotification("success", `¡Bienvenido a la Mesa ${mesa.number}!`);
  };

  // --- CARGAR DATOS DEL MENÚ ---
  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    try {
      const [catResponse, dishResponse] = await Promise.all([
        axios.get(URL_CATEGORY),
        axios.get(URL_DISHES),
      ]);
      setCategory([{ id: "all", nombre: "Todas las categorías" }, ...catResponse.data]);
      setDishes(dishResponse.data);
    } catch (error) {
        setApiError("Error al cargar el menú.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // --- OPTIMIZACIÓN (useMemo) ---
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const catId = String(d.categoria_id);
      const activeCat = String(activeCategory);
      const matchesCategory = activeCat === "all" || catId === activeCat;
      const matchesSearch = (d.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, activeCategory, searchTerm]);

  const totalItems = useMemo(() => 
    activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0), 
  [activeOrder]);

  // --- ACTUALIZAR CARRITO ---
  const updateOrder = (dish, action, newQuantity) => {
    setActiveOrder((prev) => {
      const newOrder = [...prev];
      const index = newOrder.findIndex((item) => item.id === dish.id);
      if (index >= 0) {
        if (action === "remove" || (action === "update" && newQuantity <= 0)) {
          newOrder.splice(index, 1);
        } else {
          newOrder[index] = { ...newOrder[index], quantity: newQuantity };
        }
      } else if (action === "add" && newQuantity > 0) {
        newOrder.push({ ...dish, quantity: newQuantity });
      }
      return newOrder;
    });
  };

  // --- ENVIAR PEDIDO ---
  const sendOrder = async () => {
    // [NUEVO] Doble chequeo de seguridad
    if (!mesaActiva || mesaActiva.number === "999") {
        showNotification("warning", "Por favor selecciona una mesa válida.");
        setShowTableModal(true);
        return;
    }

    if (totalItems === 0) return;

    const tokenString = localStorage.getItem("authTokens");
    // NOTA: Si es un cliente invitado (sin login), tal vez no tengas token.
    // Si tu backend requiere token obligatoriamente, el cliente debe loguearse antes.
    // Asumiremos por ahora que tienes un usuario 'invitado' o que manejas esto.
    
    // ... (Resto de tu lógica de envío igual que antes) ...
    // (Para no repetir todo el bloque de envío que ya tenías bien, 
    //  solo recuerda que aquí usas mesaActiva.id)
    
    // SOLO COMO EJEMPLO RÁPIDO DE LA PARTE DEL ENVÍO:
    try {
        // ... lógica de token ...
        // ... axios.post ...
        showNotification("success", "Pedido enviado");
        setActiveOrder([]);
        sessionStorage.removeItem("active_order");
        setTimeout(() => navigate("/orders"), 1000);
    } catch(e) {
        showNotification("error", "Error enviando pedido");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      
      {/* Header Fijo */}
      <div className="sticky top-0 z-40 shadow-md bg-white">
        <Header />
        {mesaActiva && (
          <div className="bg-yellow-400 text-red-900 font-bold text-center py-2 shadow-sm">
            📌 Mesa {mesaActiva.number === "999" ? "Virtual (Seleccionar Mesa)" : mesaActiva.number}
          </div>
        )}
        <Notification notification={notification} /> 
        <MenuFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          category={category}
        />
      </div>

      {/* Grid de Platos */}
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-32">
        {/* ... (Tu código de carga y mapeo de platos igual que antes) ... */}
        {loading ? <p>Cargando...</p> : 
         filteredDishes.map(dish => (
            <MenuItem key={dish.id} dish={dish} activeOrder={activeOrder} updateOrder={updateOrder} />
         ))
        }
      </main>

      {/* Preview Order */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <PreviewOrder 
                activeOrder={activeOrder} 
                onConfirm={sendOrder} 
                showNotification={showNotification}
                updateOrder={updateOrder}
            />
          </div>
        </div>
      )}

      {/* [NUEVO] MODAL DE SELECCIÓN DE MESA OBLIGATORIA */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-lg text-center animate-bounce-in">
            <h2 className="text-2xl font-extrabold text-red-700 mb-2">
              📍 ¿Dónde estás sentado?
            </h2>
            <p className="text-gray-500 mb-6">
              Selecciona tu número de mesa para que podamos llevarte tu comida.
            </p>

            {availableTables.length === 0 ? (
              <div className="py-8">
                <p className="animate-pulse text-gray-400">Buscando mesas disponibles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className="p-4 bg-gray-100 hover:bg-red-100 border-2 border-gray-200 hover:border-red-500 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">🪑</span>
                    <span className="font-bold text-gray-700 group-hover:text-red-700">
                      Mesa {table.number}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-400">
              *Selección obligatoria para continuar
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Menu;
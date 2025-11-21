import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import MenuItem from "../components/menu/MenuItem.jsx";
import MenuFilterBar from "../components/menu/MenuFilterBar.jsx";
import PreviewOrder from "../components/menu/PreviewOrder.jsx"; 
import Header from "../components/Header.jsx";
import Notification from "../components/Notification.jsx"; 

// --- CONFIGURACIÓN API ---
const API_BASE = "http://localhost:8000/api";
const URL_CATEGORY = `${API_BASE}/categorias`;
const URL_DISHES = `${API_BASE}/productos`;
const URL_PEDIDOS = `${API_BASE}/pedidos/`; 
const URL_MESAS = `${API_BASE}/mesas`; 

const Menu = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [dishes, setDishes] = useState([]);
  const [category, setCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  
  const [availableTables, setAvailableTables] = useState([]); 
  const [showTableModal, setShowTableModal] = useState(false);

  const [activeOrder, setActiveOrder] = useState(() => {
    const savedOrder = sessionStorage.getItem("active_order");
    return savedOrder ? JSON.parse(savedOrder) : [];
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mesaActiva, setMesaActiva] = useState(null);
  const [notification, setNotification] = useState(null); 

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  // --- PERSISTENCIA ---
  useEffect(() => {
    sessionStorage.setItem("active_order", JSON.stringify(activeOrder));
    // LOG ESTRATÉGICO: Ver el carrito cada vez que cambia
    if (activeOrder.length > 0) {
        console.log("🛒 [CART UPDATE] Contenido actual del carrito:", activeOrder);
    }
  }, [activeOrder]);

  // --- CARGAR MESA (Sin bloqueo inicial) ---
  useEffect(() => {
    const storedMesa = sessionStorage.getItem("mesa_activa");
    console.log("🔄 [INIT] Leyendo sessionStorage...", storedMesa);
    
    if (storedMesa) {
      try {
        const parsed = JSON.parse(storedMesa);
        setMesaActiva(parsed);
        console.log("✅ [INIT] Mesa activa cargada:", parsed);
      } catch (e) {
        console.error("❌ [INIT] Error parseando mesa:", e);
        setMesaActiva(null);
      }
    } else {
        console.warn("⚠️ [INIT] No hay mesa en storage.");
    }
  }, []);

  // --- 1. FETCH MESAS CON FILTRO ---
  const fetchTables = async () => {
    console.log("📡 [API] Solicitando mesas al servidor...");
    try {
      const response = await axios.get(URL_MESAS);
      const allTables = response.data;
      console.log("📥 [API] Todas las mesas recibidas:", allTables);
      
      // 🔍 FILTRO
      const freeTables = allTables.filter(table => 
        table.estado.toLowerCase() === 'libre' || table.estado.toLowerCase() === 'disponible'
      );
      
      console.log("✨ [API] Mesas filtradas (Disponibles):", freeTables);
      setAvailableTables(freeTables);

    } catch (error) {
      console.error("❌ [API] Error cargando mesas:", error);
      showNotification("error", "No se pudieron cargar las mesas.");
    }
  };

  // --- CARGAR MENÚ ---
  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("📡 [API] Cargando categorías y productos...");
      const [catResponse, dishResponse] = await Promise.all([
        axios.get(URL_CATEGORY),
        axios.get(URL_DISHES),
      ]);
      setCategory([{ id: "all", nombre: "Todas las categorías" }, ...catResponse.data]);
      setDishes(dishResponse.data);
      console.log("✅ [API] Datos del menú cargados correctamente.");
    } catch (error) {
        console.error("❌ [API] Error menú:", error);
        setApiError("Error de conexión al cargar menú.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // --- FILTROS Y TOTALES ---
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const matchesCategory = String(activeCategory) === "all" || String(d.categoria_id) === String(activeCategory);
      const matchesSearch = (d.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, activeCategory, searchTerm]);

  const totalItems = useMemo(() => activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0), [activeOrder]);

  const updateOrder = (dish, action, newQuantity) => {
    // LOG ESTRATÉGICO: Ver qué acción está ocurriendo
    console.log(`🔧 [ACTION] ${action.toUpperCase()} - Plato: ${dish.nombre}, Nueva Cantidad: ${newQuantity}`);
    
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

  // --- 2. LÓGICA CENTRAL DE ENVÍO ---
  
  const executeOrderSubmission = async (targetTableId, targetTableNumber) => {
    console.log(`🚀 [SUBMIT] Iniciando envío para Mesa ID: ${targetTableId} (Nro: ${targetTableNumber})`);
    
    const tokenString = localStorage.getItem("authTokens");
    let token = null;
    let userId = null;

    if (tokenString) {
        const data = JSON.parse(tokenString);
        token = data.access;
        userId = jwtDecode(token).user_id;
    } 

    // Payload construction
    const payload = {
        mesa_id: targetTableId, 
        empleado_id: userId, 
        observacion: "",
        estado_pedido: "ABIERTO",
        items: activeOrder.map((it) => ({
          producto_id: it.id,
          cantidad: it.quantity,
          observacion: it.observacion || "",
        })),
    };

    // LOG ESTRATÉGICO: Este es el más importante. Muestra qué se va a enviar.
    console.log("📦 [PAYLOAD] JSON a enviar:", JSON.stringify(payload, null, 2));

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
        const response = await axios.post(URL_PEDIDOS, payload, { headers });
        console.log("✅ [SUCCESS] Respuesta del servidor:", response.data);
        
        showNotification("success", `¡Pedido enviado a Mesa ${targetTableNumber}!`);
        setActiveOrder([]);
        sessionStorage.removeItem("active_order");
        
        const mesaActualizada = { ...mesaActiva, id: targetTableId, number: targetTableNumber };
        sessionStorage.setItem("mesa_activa", JSON.stringify(mesaActualizada));
        setMesaActiva(mesaActualizada);

        setTimeout(() => navigate("/orders"), 1500);
        setShowTableModal(false);

    } catch (error) {
        console.error("❌ [ERROR] Falló el envío:", error.response?.data || error.message);
        showNotification("error", "Error al enviar el pedido.");
    }
  };

  // Esta es la función que llama el botón "CONFIRMAR PEDIDO"
  const handleInitiateOrder = () => {
    console.log("🖱️ [CLICK] Usuario presionó Confirmar Pedido.");
    
    if (totalItems === 0) return;

    // 🛑 INTERCEPTOR
    if (!mesaActiva || mesaActiva.number === "999" || mesaActiva.id === 999) {
        console.warn("🛑 [INTERCEPTOR] Mesa Virtual detectada. Abriendo modal de selección.");
        showNotification("info", "Por favor selecciona tu mesa para confirmar.");
        fetchTables(); 
        setShowTableModal(true);
        return;
    }

    console.log("✅ [DIRECT] Mesa válida detectada. Enviando directo.");
    executeOrderSubmission(mesaActiva.id, mesaActiva.number);
  };

  const handleSelectTableAndSend = (table) => {
    console.log("🖱️ [MODAL] Usuario seleccionó mesa del modal:", table);
    executeOrderSubmission(table.id, table.number);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 shadow-md bg-white">
        <Header />
        {mesaActiva && (
          <div className={`font-bold text-center py-2 shadow-sm text-sm ${mesaActiva.number === "999" ? "bg-blue-100 text-blue-800" : "bg-yellow-400 text-red-900"}`}>
            {mesaActiva.number === "999" 
                ? "🛒 Modo Cliente: Seleccionando productos..." 
                : `📌 Mesa ${mesaActiva.number}`
            }
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

      {/* Grid */}
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-32">
        {loading ? <p className="text-center w-full py-10">Cargando...</p> : 
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
                onConfirm={handleInitiateOrder} 
                showNotification={showNotification}
                updateOrder={updateOrder}
            />
          </div>
        </div>
      )}

      {/* MODAL */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-lg text-center animate-bounce-in">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-extrabold text-red-700">📍 Elige tu Mesa</h2>
                 <button onClick={() => setShowTableModal(false)} className="text-gray-400 text-xl">&times;</button>
            </div>
           
            <p className="text-gray-500 mb-6">
              Todo listo. Selecciona dónde estás sentado para enviar la orden inmediatamente.
            </p>

            {availableTables.length === 0 ? (
               <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                  {loading ? "Buscando mesas..." : "No hay mesas disponibles en este momento."}
               </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2 custom-scrollbar">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTableAndSend(table)}
                    className="p-4 bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 group shadow-sm"
                  >
                    <span className="text-2xl">🪑</span>
                    <span className="font-bold text-gray-700 group-hover:text-green-700">
                      {table.number}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Menu;
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
  
  // 🔥 NUEVO ESTADO: Para controlar el modal de "Llamar al mesero"
  const [showWaiterModal, setShowWaiterModal] = useState(false);

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
  }, [activeOrder]);

  // --- CARGAR MESA ---
  useEffect(() => {
    const storedMesa = sessionStorage.getItem("mesa_activa");
    if (storedMesa) {
      try {
        const parsed = JSON.parse(storedMesa);
        setMesaActiva(parsed);
      } catch (e) {
        console.error("❌ Error parseando mesa:", e);
        setMesaActiva(null);
      }
    }
  }, []);

  // --- FETCH MESAS (Se mantiene por si acaso, pero ya no es la prioridad para el cliente) ---
  const fetchTables = async () => {
    try {
      const response = await axios.get(URL_MESAS);
      const freeTables = response.data.filter(table => 
        table.estado.toLowerCase() === 'libre' || table.estado.toLowerCase() === 'disponible'
      );
      setAvailableTables(freeTables);
    } catch (error) {
      console.error("❌ Error cargando mesas:", error);
      showNotification("error", "No se pudieron cargar las mesas.");
    }
  };

  // --- CARGAR MENÚ ---
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
        console.error("❌ Error menú:", error);
        setApiError("Error de conexión al cargar menú.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // --- FILTROS ---
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const matchesCategory = String(activeCategory) === "all" || String(d.categoria_id) === String(activeCategory);
      const matchesSearch = (d.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, activeCategory, searchTerm]);

  const totalItems = useMemo(() => activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0), [activeOrder]);

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

  // --- ENVÍO DE PEDIDO (Solo se usa si YA hay mesa real) ---
  const executeOrderSubmission = async (targetTableId, targetTableNumber) => {
    // ... (Tu lógica de envío original se mantiene igual aquí)
    // Para ahorrar espacio en el chat, asumo que este bloque no cambia
    // Si necesitas que lo repita, avísame. 
    // La lógica es la misma: token, payload, axios.post...
    
    console.log(`🚀 Enviando a mesa ${targetTableNumber}...`);
    // (Simulación del código que ya tenías para enviar)
    // ...
    // Al finalizar exitosamente:
    showNotification("success", `¡Pedido enviado a Mesa ${targetTableNumber}!`);
    setActiveOrder([]);
    sessionStorage.removeItem("active_order");
    setTimeout(() => navigate("/orders"), 1500);
  };

  // 🔥 ESTA ES LA FUNCIÓN QUE CAMBIAMOS 🔥
  const handleInitiateOrder = () => {
    console.log("🖱️ [CLICK] Usuario presionó Confirmar Pedido.");
    
    if (totalItems === 0) return;

    // 🛑 INTERCEPTOR MODIFICADO
    // Si no hay mesa, o es la mesa virtual 999...
    if (!mesaActiva || mesaActiva.number === "999" || mesaActiva.id === 999) {
        console.warn("🛑 [INTERCEPTOR] Cliente sin mesa asignada.");
        
        // ANTES: fetchTables() y setShowTableModal(true)
        // AHORA: Solo mostramos el mensaje de "Espera al mesero"
        setShowWaiterModal(true); 
        return;
    }

    // Si ya tiene mesa real (ej: escaneó un QR real), envía directo
    console.log("✅ [DIRECT] Mesa válida detectada. Enviando directo.");
    executeOrderSubmission(mesaActiva.id, mesaActiva.number);
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

      {/* Grid de Platos */}
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-32">
        {loading ? <p className="text-center w-full py-10">Cargando...</p> : 
         filteredDishes.map(dish => (
            <MenuItem key={dish.id} dish={dish} activeOrder={activeOrder} updateOrder={updateOrder} />
         ))
        }
      </main>

      {/* Barra Inferior (Preview Order) */}
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

      {/* 🔥 NUEVO MODAL: AVISO AL MESERO 🔥 */}
      {showWaiterModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-[90%] max-w-md text-center animate-bounce-in border-t-4 border-blue-500">
            
            <div className="mb-6 flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full">
                    {/* Ícono de campana o usuario */}
                    <span className="text-4xl">🔔</span>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                ¡Listo!
            </h2>
            
            <p className="text-gray-600 text-lg mb-6">
                Mantén esta pantalla abierta. Un mesero se acercará en breve para confirmar tu pedido y asignarte una mesa.
            </p>

            {/* Muestra el total para que el cliente sepa cuánto es */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-500">Total estimado</p>
                <p className="text-xl font-bold text-green-600">
                    ${activeOrder.reduce((acc, item) => acc + (item.precio * item.quantity), 0).toFixed(2)}
                </p>
            </div>

            <button 
                onClick={() => setShowWaiterModal(false)} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                Entendido, esperar
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default Menu;
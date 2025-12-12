import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom"; // Usamos Link en lugar de NavButton custom para simplificar
import { jwtDecode } from "jwt-decode";
import axios from "axios";

// Componentes
import MenuItem from "../components/menu/MenuItem.jsx";
import MenuFilterBar from "../components/menu/MenuFilterBar.jsx";
import PreviewOrder from "../components/menu/PreviewOrder.jsx";
import Header from "../components/Header.jsx";
import Notification from "../components/Notification.jsx";

// --- CONFIGURACIÓN API (ROBUSTA) ---
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const URL_CATEGORY = `${API_BASE}/categorias`;
const URL_DISHES = `${API_BASE}/productos`;
const URL_PEDIDOS = `${API_BASE}/pedidos/`; // Ojo con la barra al final según tu backend
const URL_MESAS = `${API_BASE}/mesas`;

const Menu = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [dishes, setDishes] = useState([]);
  const [category, setCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de "Llamar al mesero"
  const [showWaiterModal, setShowWaiterModal] = useState(false);

  // Inicialización perezosa (Lazy Init) para leer sessionStorage solo una vez
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const savedOrder = sessionStorage.getItem("active_order");
      return savedOrder ? JSON.parse(savedOrder) : [];
    } catch {
      return [];
    }
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mesaActiva, setMesaActiva] = useState(null);
  const [notification, setNotification] = useState(null);

  // Helper para notificaciones
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // --- EFECTOS ---
  
  // 1. Persistencia del Pedido
  useEffect(() => {
    sessionStorage.setItem("active_order", JSON.stringify(activeOrder));
  }, [activeOrder]);

  // 2. Cargar Mesa Activa
  useEffect(() => {
    const storedMesa = sessionStorage.getItem("mesa_activa");
    if (storedMesa) {
      try {
        setMesaActiva(JSON.parse(storedMesa));
      } catch (e) {
        console.error("Error leyendo mesa:", e);
      }
    }
  }, []);

  // 3. Cargar Datos del Menú
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, dishRes] = await Promise.all([
          axios.get(URL_CATEGORY),
          axios.get(URL_DISHES),
        ]);
        
        setCategory([
          { id: "all", nombre: "Todas las categorías" },
          ...catRes.data,
        ]);
        setDishes(dishRes.data);
      } catch (error) {
        console.error("Error cargando menú:", error);
        showNotification("error", "No se pudo cargar el menú. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  // --- LÓGICA DE NEGOCIO ---

  // Filtros optimizados
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const matchesCategory =
        String(activeCategory) === "all" ||
        String(d.categoria_id) === String(activeCategory);
      
      const matchesSearch = (d.nombre || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
        
      return matchesCategory && matchesSearch;
    });
  }, [dishes, activeCategory, searchTerm]);

  // Total de items
  const totalItems = useMemo(
    () => activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0),
    [activeOrder]
  );

  // Actualizar Pedido
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

  // Enviar Pedido a API
  const executeOrderSubmission = async (targetTableId, targetTableNumber) => {
    const tokenString = localStorage.getItem("authTokens");
    let token = null;
    let userId = null;

    if (tokenString) {
      try {
        const data = JSON.parse(tokenString);
        token = data.access;
        userId = jwtDecode(token).user_id;
      } catch (e) {
        console.warn("Error decodificando token:", e);
      }
    }

    const orderToSend = activeOrder;
    if (orderToSend.length === 0) return;

    const payload = {
      mesa_id: targetTableId,
      empleado_id: userId, // Puede ser null si es auto-servicio
      observacion: "",
      estado_pedido: "ABIERTO", // O "NUEVO", según tu backend
      items: activeOrder.map((it) => ({
        producto_id: it.id,
        cantidad: it.quantity,
        observacion: it.observacion || "",
      })),
    };

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      await axios.post(URL_PEDIDOS, payload, { headers });

      const stockUpdates = orderToSend.map(async (item) => {
        const currentDish = dishes.find(d => String(d.id) === String(item.id));
        if (!currentDish) {
          console.warn(`Plato ID ${item.id} no encontrado en el estado local. No se actualiza stock.`);
          return;
        }

        const currentStock = currentDish.stock || 0;
        const newStock = currentStock - item.quantity;

        const updateData = {
          stock: Math.max(0, newStock),
        };

        try {
          await axios.patch(`${URL_DISHES}/${item.id}/`, updateData, {
            headers: { "Content-Type": "application/json" }, // Usamos JSON
          });
        } catch (patchError) {
          console.error(`Error al actualizar stock para plato ${item.id}:`, patchError);
          showNotification("warning", `Advertencia: Fallo al actualizar stock de ${item.nombre}.`);
        }
      });

      await Promise.all(stockUpdates);

      showNotification("success", `¡Pedido enviado a Mesa ${targetTableNumber}!`);
      
      // Limpieza
      setActiveOrder([]);
      sessionStorage.removeItem("active_order");

      // Redirigir a vista de pedidos
      setTimeout(() => navigate("/orders"), 1500);
      
    } catch (error) {
      console.error("Error enviando pedido:", error);
      showNotification("error", "Error al enviar el pedido. Intenta de nuevo.");
    }
  };

  // Manejador del Botón "Confirmar"
  const handleInitiateOrder = () => {
    if (totalItems === 0) return;

    // CASO: Cliente sin mesa (Modo Invitado / Mesa 999)
    if (!mesaActiva || String(mesaActiva.number) === "999") {
      setShowWaiterModal(true); // Mostrar modal "Llamar mesero"
      return;
    }

    // CASO: Mesa normal asignada
    executeOrderSubmission(mesaActiva.id, mesaActiva.number);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      
      {/* HEADER + BARRA DE INFO */}
      <div className="sticky top-0 z-40 shadow-md bg-white">
        <Header />

        <div className="flex items-center justify-between w-full px-4 py-2 bg-yellow-400 shadow-sm">
          
          {/* Botón Mesas */}
          <Link
            to="/tables"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-3 shadow-sm rounded-lg flex items-center gap-1"
            aria-label="Volver al mapa de mesas"
          >
            <span>🍽️</span> Mesas
          </Link>

          {/* Info Mesa Activa */}
          {mesaActiva && (
            <div
              className={`font-bold text-center text-xs px-3 py-1 mx-2 rounded-lg flex-1 truncate ${
                String(mesaActiva.number) === "999"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-900 border border-yellow-300"
              }`}
              role="status"
            >
              {String(mesaActiva.number) === "999"
                ? "🛒 Modo Cliente"
                : `📌 Mesa ${mesaActiva.number}`}
            </div>
          )}

          {/* Botón Órdenes */}
          <Link
            to="/orders"
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 shadow-sm rounded-lg flex items-center gap-1"
            aria-label="Ver pedidos activos"
          >
            🛒 Órdenes
          </Link>
        </div>

        <Notification notification={notification} />
        
        <MenuFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          category={category}
        />
      </div>

      {/* GRID DE PLATOS */}
      <main 
        className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-32"
        role="list"
        aria-label="Lista de platos del menú"
      >
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-20">
            <div className="animate-spin text-4xl">⏳</div>
          </div>
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
          <div className="col-span-full text-center text-gray-500 py-10 italic">
            No se encontraron platos.
          </div>
        )}
      </main>

      {/* BARRA INFERIOR (CARRITO) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <PreviewOrder
              activeOrder={activeOrder}
              onConfirm={handleInitiateOrder}
              updateOrder={updateOrder}
            />
          </div>
        </div>
      )}

      {/* MODAL: LLAMAR AL MESERO */}
      {showWaiterModal && (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="waiter-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-bounce-in border-t-8 border-blue-500">
            
            <div className="mb-6 flex justify-center">
              <div className="bg-blue-100 p-6 rounded-full shadow-inner">
                <span className="text-5xl" aria-hidden="true">🔔</span>
              </div>
            </div>

            <h2 id="waiter-modal-title" className="text-2xl font-black text-gray-800 mb-2">
                ¡Pedido Listo!
            </h2>

            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              Por favor, <strong>espera a un mesero</strong>. Él escaneará este pedido y te asignará una mesa.
            </p>

            {/* Resumen de Total */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Total Estimado
              </p>
              <p className="text-3xl font-black text-green-600">
                $ {activeOrder.reduce((acc, item) => acc + item.precio * item.quantity, 0).toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => setShowWaiterModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200"
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
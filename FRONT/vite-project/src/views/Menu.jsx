import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import MenuItem from "../components/menu/MenuItem.jsx";
import MenuFilterBar from "../components/menu/MenuFilterBar.jsx";
import PreviewOrder from "../components/menu/PreviewOrder.jsx"; // Actualizado

import Header from "../components/Header.jsx";
import Notification from "../components/Notification.jsx"; // Nuevo: Componente de Notificación

const URL_CATEGORY = "http://localhost:8000/api/categorias";
const URL_DISHES = "http://localhost:8000/api/productos";
const URL_PEDIDOS = "http://localhost:8000/api/pedidos/"; // Asegúrate de la barra al final
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
  const [notification, setNotification] = useState(null); // Nuevo estado de notificación

  // --- LÓGICA DE NOTIFICACIÓN (Extraída de PreviewOrder) ---
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    // Limpia la notificación después de 3 segundos
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);
  // --------------------------------------------------------

  useEffect(() => {
    const storedMesa = sessionStorage.getItem("mesa_activa");
    if (storedMesa) {
      setMesaActiva(JSON.parse(storedMesa));
    } else {
      showNotification("warning", "Selecciona una mesa antes de tomar un pedido.");
      navigate("/tables");
    }
  }, [navigate, showNotification]);

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

  const sendOrder = async () => {
    let token = null;
    let empleadoId = null;

    // 1. OBTENER TOKEN Y EMPLEADO ID
    try {
      const tokenString = localStorage.getItem("authTokens");

      if (tokenString) {
        const userData = JSON.parse(tokenString);
        token = userData.access;

        if (token) {
          const decodedToken = jwtDecode(token);
          empleadoId = decodedToken.user_id;

          console.log("Empleado ID decodificado:", empleadoId);
        }
      }
    } catch (error) {
      console.error("Error al obtener/decodificar el token JWT:", error);
      showNotification("error", "Error de autenticación: No se pudo verificar el empleado.");
      return;
    }

    // 2. VALIDACIONES
    if (totalItems === 0 || !mesaActiva || !mesaActiva.id) {

      console.log(totalItems, mesaActiva, mesaActiva.id);
      showNotification("warning", "La orden está vacía o no hay una mesa activa.");
      return;
    }

    if (!empleadoId) {
      console.log("Empleado ID no encontrado.", empleadoId);
      showNotification("error", "No se pudo obtener la información del empleado. ¿Sesión expirada?");
      return;
    }

    // 3. CONSTRUCCIÓN DEL PAYLOAD
    const itemsPayload = activeOrder.map((it) => ({
      producto_id: it.id,
      cantidad: it.quantity,
      // Se asume que 'observacion' se puede añadir al item, aunque no esté en el ejemplo actual.
      observacion: it.observacion || "", 
    }));

    const payload = {
      mesa_id: mesaActiva.id,
      empleado_id: empleadoId,
      observacion: "", // Observación general del pedido, si aplica
      items: itemsPayload,
    };

    // 4. CONFIGURACIÓN DE HEADERS (Importante: debe ir antes de la llamada)
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // 5. LLAMADA A LA API
    try {
      const response = await axios.post(URL_PEDIDOS, payload, {
        headers: headers,
      });

      console.log("Orden enviada exitosamente:", response.data);
      showNotification("success", `¡Orden a Mesa ${mesaActiva.number} enviada!`);
      setActiveOrder([]); // Limpiar la orden actual
      navigate("/orders"); // Navegar a la vista de órdenes para verificar
    } catch (error) {
      console.error("Error al enviar la orden:", error.response || error);
      let errorMessage = "Ocurrió un error al enviar la orden al servidor.";
      if (error.response && error.response.data) {
          // Intenta obtener un mensaje de error detallado del backend
          errorMessage = error.response.data.detail || JSON.stringify(error.response.data);
      } else if (error.request) {
          errorMessage = "Error de red: El servidor no respondió.";
      }
      showNotification("error", `Error al enviar: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />

      {mesaActiva && (
        <div className="bg-yellow-400 text-red-900 font-bold text-center py-2 shadow-md">
          📌 Pedido para Mesa {mesaActiva.number} ({mesaActiva.capacity} sillas)
        </div>
      )}

      {/* Renderiza el componente de Notificación flotante */}
      <Notification notification={notification} /> 
      
      <MenuFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        category={category}
      />

      <main className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-24">
        {/* ... Lógica de Carga y Error ... */}
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
            {/* Pasamos la función sendOrder y showNotification a PreviewOrder */}
            <PreviewOrder activeOrder={activeOrder} onConfirm={sendOrder} showNotification={showNotification} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
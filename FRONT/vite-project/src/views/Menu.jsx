import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import MenuItem from "../components/menu/MenuItem.jsx";
import MenuFilterBar from "../components/menu/MenuFilterBar.jsx";
import PreviewOrder from "../components/menu/PreviewOrder.jsx";
import Header from "../components/Header.jsx";
import Notification from "../components/Notification.jsx";

const URL_CATEGORY = "http://localhost:8000/api/categorias";
const URL_DISHES = "http://localhost:8000/api/productos";
const URL_PEDIDOS = "http://localhost:8000/api/pedidos/";

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
  const [notification, setNotification] = useState(null);

  // --- LÓGICA DE NOTIFICACIÓN ---
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  // --- VERIFICAR MESA ACTIVA ---
  useEffect(() => {
    const storedMesa = sessionStorage.getItem("mesa_activa");
    if (storedMesa) {
      const mesa = JSON.parse(storedMesa);
      setMesaActiva(mesa);
      showNotification("info", `Mesa ${mesa.number} cargada.`);
    } else {
      setMesaActiva(null);
      showNotification(
        "warning",
        "Modo menú: No hay mesa activa. No se podrá enviar la orden."
      );
    }
  }, [showNotification]);

  // --- CARGAR DATOS DEL MENÚ ---
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
        errorMessage = `Error ${error.response.status}: Problema de servidor.`;
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

  // --- FILTRADO ---
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

  // --- ACTUALIZAR CARRITO LOCAL ---
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

  // --- ENVIAR PEDIDO ---
  const sendOrder = async () => {
    let token = null;
    let empleadoId = null;

    try {
      const tokenString = localStorage.getItem("authTokens");
      if (tokenString) {
        const userData = JSON.parse(tokenString);
        token = userData.access;
        if (token) {
          const decodedToken = jwtDecode(token);
          empleadoId = decodedToken.user_id;
        }
      }
    } catch (error) {
      console.error("Error token:", error);
      showNotification("error", "Error de autenticación.");
      return;
    }

    if (totalItems === 0 || !mesaActiva?.id) {
      showNotification("warning", "La orden está vacía o no hay mesa.");
      return;
    }

    if (!empleadoId) {
      showNotification("error", "Sesión expirada. Inicia sesión de nuevo.");
      return;
    }

    const ESTADO_DEFAULT = "RECIBIDO";

    const itemsPayload = activeOrder.map((it) => ({
      producto_id: it.id,
      cantidad: it.quantity,
      observacion: it.observacion || "",
    }));

    const payload = {
      mesa_id: mesaActiva.id,
      empleado_id: empleadoId,
      observacion: "",
      estado_pedido: ESTADO_DEFAULT,
      items: itemsPayload,
    };

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      await axios.post(URL_PEDIDOS, payload, { headers });

      showNotification(
        "success",
        `¡Orden a Mesa ${mesaActiva.number} enviada!`
      );
      setActiveOrder([]);

      setTimeout(() => {
        navigate("/orders");
      }, 1000);
    } catch (error) {
      console.error("Error enviando:", error.response || error);
      let errorMessage = "Error al enviar.";
      if (error.response?.data) {
        errorMessage = JSON.stringify(error.response.data);
      }
      showNotification("error", `Fallo: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* 🔐 Bloque Fijo Superior (Sticky) */}
      <div className="sticky top-0 z-50 shadow-md bg-white">
        <Header />

        {mesaActiva && (
          <div className="bg-yellow-400 text-red-900 font-bold text-center py-2 shadow-sm text-sm md:text-base">
            📌 Pedido para Mesa {mesaActiva.number} ({mesaActiva.capacity} pax)
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
      {/* Fin del bloque sticky */}

      {/* 🔽 Contenido Desplazable (Platos) */}
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pb-32">
        {loading ? (
          <div className="col-span-full flex justify-center py-10">
            <p className="text-red-700 font-semibold text-xl animate-pulse">
              ⏳ Cargando menú...
            </p>
          </div>
        ) : apiError ? (
          <div className="col-span-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error de conexión</p>
            <p>{apiError}</p>
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
          <div className="col-span-full text-center py-10 opacity-50">
            <p className="text-4xl mb-2">🍽️</p>
            <p>No encontramos platos con ese nombre.</p>
          </div>
        )}
      </main>

      {/* Barra Inferior de "Ver Pedido" */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <PreviewOrder
              activeOrder={activeOrder}
              onConfirm={sendOrder}
              showNotification={showNotification}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;

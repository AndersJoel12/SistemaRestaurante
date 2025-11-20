// src/views/Menu.jsx
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
      setMesaActiva(JSON.parse(storedMesa));
    } else {
      showNotification(
        "warning",
        "Selecciona una mesa antes de tomar un pedido."
      );
      navigate("/tables");
    }
  }, [navigate, showNotification]);

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

  // --- FILTRADO (CORREGIDO: Sin líneas duplicadas) ---
  const filteredDishes = dishes.filter((d) => {
<<<<<<< HEAD
    const dishCategoryId = String(d.categoria_id);
    const activeCatString = String(activeCategory);

    const categoryMatch =
      activeCatString === "all" || dishCategoryId === activeCatString;
    activeCatString === "all" || dishCategoryId === activeCatString;
=======
    // Convertimos a String para asegurar comparación correcta
    const dishCategoryId = String(d.categoria_id);
    const activeCatString = String(activeCategory);

    const categoryMatch = 
      activeCatString === "all" || dishCategoryId === activeCatString;
>>>>>>> 320a35d8c696be5bcfbb685867b4eac10c2c4a36

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

  // --- ENVIAR PEDIDO A DJANGO ---
  const sendOrder = async () => {
    let token = null;
    let empleadoId = null;

    // 1. Obtener Auth
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
<<<<<<< HEAD
      console.error("Error al obtener/decodificar el token JWT:", error);
      showNotification(
        "error",
        "Error de autenticación: No se pudo verificar el empleado."
      );
      return;
    }

    // 2. VALIDACIONES
    if (totalItems === 0 || !mesaActiva || !mesaActiva.id) {
      console.log(totalItems, mesaActiva, mesaActiva.id);
      showNotification(
        "warning",
        "La orden está vacía o no hay una mesa activa."
      );
=======
      console.error("Error token:", error);
      showNotification("error", "Error de autenticación.");
      return;
    }

    // 2. Validaciones
    if (totalItems === 0 || !mesaActiva?.id) {
      showNotification("warning", "La orden está vacía o no hay mesa.");
>>>>>>> 320a35d8c696be5bcfbb685867b4eac10c2c4a36
      return;
    }

    if (!empleadoId) {
<<<<<<< HEAD
      console.log("Empleado ID no encontrado.", empleadoId);
      showNotification(
        "error",
        "No se pudo obtener la información del empleado. ¿Sesión expirada?"
      );
      return;
    }

    const ESTADO_DEFAULT = "Abierto"; // Ajusta según el estado inicial requerido
    // 3. CONSTRUCCIÓN DEL PAYLOAD
    const itemsPayload = activeOrder.map((it) => ({
      producto_id: it.id,
      cantidad: it.quantity,
      // Se asume que 'observacion' se puede añadir al item, aunque no esté en el ejemplo actual.
      observacion: it.observacion || "",
=======
      showNotification("error", "Sesión expirada. Inicia sesión de nuevo.");
      return;
    }

    // 3. Construir Payload (CORREGIDO: typo estado_pedido)
    const ESTADO_DEFAULT = "RECIBIDO"; // O "PENDIENTE", según tu backend

    const itemsPayload = activeOrder.map((it) => ({
      producto_id: it.id,
      cantidad: it.quantity,
      observacion: it.observacion || "", 
>>>>>>> 320a35d8c696be5bcfbb685867b4eac10c2c4a36
    }));

    const payload = {
      mesa_id: mesaActiva.id,
      Empleado_id: empleadoId, // Ojo: En tu serializador anterior era 'Empleado_id' (con mayúscula), verifica tu backend
      observacion: "", 
      estado_pedido: ESTADO_DEFAULT, // CORREGIDO: Antes decía estado_peido
      items: itemsPayload,
    };

<<<<<<< HEAD
    console.log("Empleado ID para el payload:", payload);
    // 4. CONFIGURACIÓN DE HEADERS (Importante: debe ir antes de la llamada)
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
=======
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
>>>>>>> 320a35d8c696be5bcfbb685867b4eac10c2c4a36

    // 4. Enviar
    try {
<<<<<<< HEAD
      const response = await axios.post(URL_PEDIDOS, payload, {
        headers: headers,
      });

      console.log("Orden enviada exitosamente:", response.data);
      showNotification(
        "success",
        `¡Orden a Mesa ${mesaActiva.number} enviada!`
      );
      setActiveOrder([]); // Limpiar la orden actual
      navigate("/orders"); // Navegar a la vista de órdenes para verificar
    } catch (error) {
      console.error("Error al enviar la orden:", error.response || error);
      let errorMessage = "Ocurrió un error al enviar la orden al servidor.";
      if (error.response && error.response.data) {
        // Intenta obtener un mensaje de error detallado del backend
        errorMessage =
          error.response.data.detail || JSON.stringify(error.response.data);
      } else if (error.request) {
        errorMessage = "Error de red: El servidor no respondió.";
=======
      await axios.post(URL_PEDIDOS, payload, { headers });
      
      showNotification("success", `¡Orden a Mesa ${mesaActiva.number} enviada!`);
      setActiveOrder([]); 
      
      // Pequeño delay para que el usuario vea el éxito antes de cambiar de página
      setTimeout(() => {
          navigate("/orders"); 
      }, 1000);

    } catch (error) {
      console.error("Error enviando:", error);
      let errorMessage = "Error al enviar.";
      
      if (error.response?.data) {
         // Intentamos leer errores específicos del backend
         errorMessage = JSON.stringify(error.response.data);
>>>>>>> 320a35d8c696be5bcfbb685867b4eac10c2c4a36
      }
      
      showNotification("error", `Fallo: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      
      {/* 🔐 Bloque Fijo Superior (Sticky) */}
      <div className="sticky top-0 z-40 shadow-md bg-white">
        <Header />

        {mesaActiva && (
<<<<<<< HEAD
          <div className="bg-yellow-400 text-red-900 font-bold text-center py-2 shadow-md">
            📌 Pedido para Mesa {mesaActiva.number} ({mesaActiva.capacity}{" "}
            sillas)
=======
          <div className="bg-yellow-400 text-red-900 font-bold text-center py-2 shadow-sm text-sm md:text-base">
            📌 Pedido para Mesa {mesaActiva.number} ({mesaActiva.capacity} pax)
          </div>
        )}

        {/* Notificación Flotante dentro del contexto visual */}
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
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-32">
        
        {loading ? (
          <div className="col-span-full flex justify-center py-10">
             <p className="text-red-700 font-semibold text-xl animate-pulse">⏳ Cargando menú...</p>
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
>>>>>>> 320a35d8c696be5bcfbb685867b4eac10c2c4a36
          </div>
        )}

<<<<<<< HEAD
        {/* Renderiza el componente de Notificación flotante */}
        <Notification notification={notification} />

        <MenuFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          category={category}
        />

        {/* 🔽 Contenido desplazable */}
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
              <PreviewOrder
                activeOrder={activeOrder}
                onConfirm={sendOrder}
                showNotification={showNotification}
              />
            </div>
          </div>
        )}

        {/* 🔔 Aviso / Toast */}
        {/*mensaje && (
          <div
            className="fixed top-20 left-1/2 transform -translate-x-1/2 
                        bg-green-500 text-white px-4 py-2 rounded shadow-lg 
                        z-50"
          >
            {mensaje}
          </div>
        )*/}

      </div>
=======
>>>>>>> 320a35d8c696be5bcfbb685867b4eac10c2c4a36
    </div>
  );
};

export default Menu;

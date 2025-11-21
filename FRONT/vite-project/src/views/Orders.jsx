import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

// Usamos 127.0.0.1 para evitar errores de red (CORS)
const API_URL = "http://127.0.0.1:8000/api/pedidos";

// Definimos los estados clave para el Mesero
const ESTADOS = {
  PREPARADO: "PREPARADO", // 🚨 Cocina terminó -> Mesero debe entregar (Prioridad)
  ENTREGADO: "ENTREGADO", // ✅ Ya en mesa -> Cliente comiendo / Esperando pago
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- 1. CARGAR ÓRDENES ---
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/`);
      
      // Filtramos: Traemos todo MENOS lo que ya se cobró (CERRADO)
      const activeOrders = response.data.filter(o => o.estado_pedido !== 'CERRADO');

      // Ordenamos: Los PREPARADO van primero porque son la prioridad
      activeOrders.sort((a, b) => {
        if (a.estado_pedido === ESTADOS.PREPARADO && b.estado_pedido !== ESTADOS.PREPARADO) return -1;
        if (a.estado_pedido !== ESTADOS.PREPARADO && b.estado_pedido === ESTADOS.PREPARADO) return 1;
        return 0;
      });

      setOrders(activeOrders);
      setError(null);
    } catch (err) {
      console.error("Error trayendo pedidos:", err);
      setError("No se pudieron cargar los pedidos de la base de datos.");
    }
  };

  // Polling: Recargar cada 5 segundos
  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // --- 2. ACCIÓN PRINCIPAL: ENTREGAR (PREPARADO -> ENTREGADO) ---
  const entregarPedido = async (id) => {
    try {
      // Enviamos PATCH para cambiar el estado
      await axios.patch(`${API_URL}/${id}/`, {
        estado_pedido: ESTADOS.ENTREGADO,
      });

      // Actualización Optimista (Feedback instantáneo en pantalla)
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id ? { ...order, estado_pedido: ESTADOS.ENTREGADO } : order
        )
      );
    } catch (err) {
      console.error("Error al entregar:", err);
      alert("Error de conexión al marcar como entregado.");
    }
  };

  // --- 3. CANCELAR ORDEN ---
  const cancelOrder = async (id) => {
    if (!window.confirm(`¿Seguro que quieres CANCELAR la orden #${id}?`)) return;

    try {
      await axios.delete(`${API_URL}/${id}/`);
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Error al cancelar la orden.");
    }
  };

  // Navegación
  const goToTables = () => navigate("/tables");
  const goToBilling = () => navigate("/manage-billing");

  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 min-h-screen font-sans antialiased">
      <Header />

      <div className="container mx-auto max-w-4xl p-4 pt-8">
        <h1 className="text-4xl font-extrabold text-red-800 text-center tracking-tight">
          Tus Pedidos
        </h1>

        {/* --- BOTONES DE NAVEGACIÓN (Estilo Original) --- */}
        <div className="flex justify-center gap-4 my-6">
          <button
            onClick={goToTables}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition transform hover:scale-[1.05]"
          >
            🗺️ Ver Mesas
          </button>
          <button
            onClick={goToBilling}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition transform hover:scale-[1.05]"
          >
            🧾 Historial de Facturas
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-3 text-center rounded-lg shadow-md mb-6 animate-pulse">
            {error}
          </div>
        )}

        {orders.length === 0 && !error && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500 italic mb-6">
            <p className="text-lg">No hay pedidos activos.</p>
            <p className="mt-2 text-sm">¡A esperar clientes!</p>
          </div>
        )}

        <div className="space-y-6">
          {orders.map((orden) => {
            // LÓGICA VISUAL:
            // Si está PREPARADO, usamos el estilo "Highlight" (Amarillo/Rojo oscuro)
            // Si no (ENTREGADO/ABIERTO), usamos el estilo "Normal" (Blanco/Rojo)
            const isPreparado = orden.estado_pedido === ESTADOS.PREPARADO;
            const isEntregado = orden.estado_pedido === ESTADOS.ENTREGADO;

            return (
              <div
                key={orden.id}
                className={`
                  p-6 rounded-2xl shadow-xl border-b-4 transition-all duration-300 ease-in-out
                  hover:scale-[1.02] hover:shadow-2xl hover:rotate-1
                  ${
                    isPreparado
                      ? "border-yellow-500 bg-gradient-to-r from-red-700 to-red-900 text-yellow-100" // Estilo LISTO
                      : "border-red-600 bg-white text-red-800" // Estilo NORMAL
                  }
                `}
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-extrabold text-3xl">Orden #{orden.id}</p>
                    <p
                      className={`text-sm opacity-80 mt-1 ${
                        isPreparado ? "text-yellow-300" : "text-gray-600"
                      }`}
                    >
                      {orden.fecha} - {orden.hora}
                    </p>
                  </div>

                  {/* Precio destacado */}
                  <div className="text-right">
                    <span
                      className={`block text-xs font-bold uppercase tracking-wide ${
                        isPreparado ? "text-yellow-400" : "text-gray-500"
                      }`}
                    >
                      Total
                    </span>
                    <span
                      className={`font-extrabold text-4xl ${
                        isPreparado ? "text-yellow-300" : "text-yellow-500"
                      }`}
                    >
                      ${orden.CostoTotal || "0.00"}
                    </span>
                  </div>
                </div>

                <hr
                  className={`my-4 ${
                    isPreparado ? "border-yellow-600" : "border-red-200"
                  }`}
                />

                <div className="flex justify-between items-center mb-4">
                  <p
                    className={`text-sm font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                      isPreparado
                        ? "bg-yellow-600 text-red-900"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <span>Status:</span>
                    <span className="uppercase font-bold">
                      {orden.estado_pedido}
                    </span>
                  </p>

                  {orden.mesa_id && (
                    <div className="flex items-center gap-4">
                      <p
                        className={`text-lg font-bold ${
                          isPreparado ? "text-yellow-200" : "text-red-700"
                        }`}
                      >
                        Mesa: <span className="ml-1">{orden.mesa_id}</span>
                      </p>
                      
                      {/* Botón pequeño para ver mapa */}
                      <button
                        onClick={goToTables}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border transition hover:shadow-md ${
                          isPreparado
                            ? "bg-yellow-400 text-red-900 border-yellow-400 hover:bg-yellow-500"
                            : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                        }`}
                      >
                        Ver Mesas 🗺️
                      </button>
                    </div>
                  )}
                </div>

                {/* Lista de productos */}
                <ul
                  className={`p-3 rounded-lg text-sm space-y-2 ${
                    isPreparado
                      ? "bg-red-800 text-yellow-200"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <p
                    className={`font-semibold text-xs mb-1 ${
                      isPreparado ? "text-yellow-400" : "text-red-500"
                    }`}
                  >
                    ITEMS DEL PEDIDO:
                  </p>
                  {orden.items &&
                    orden.items.map((it, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className="flex items-center">
                          <span
                            className={`font-bold mr-2 text-base ${
                              isPreparado ? "text-yellow-300" : "text-red-600"
                            }`}
                          >
                            {it.cantidad}x
                          </span>
                          {it.producto_nombre || "Producto"}
                        </span>
                        {/* Precio unitario opcional */}
                        {it.precio && (
                           <span className={`text-xs ${isPreparado ? "text-yellow-400" : "text-red-400"}`}>
                             ${(it.cantidad * it.precio).toFixed(2)}
                           </span>
                        )}
                      </li>
                    ))}
                </ul>

                {/* --- BOTONES DE ACCIÓN --- */}
                <div className="mt-6 flex justify-end gap-3">
                  
                  {/* CASO 1: PREPARADO -> Muestra botón de ENTREGAR */}
                  {isPreparado && (
                    <button
                      onClick={() => entregarPedido(orden.id)}
                      className="px-5 py-2 bg-yellow-500 text-red-900 font-bold rounded-full shadow-lg hover:bg-yellow-400 transition transform hover:-translate-y-1 active:scale-95 border-b-4 border-yellow-700 flex items-center gap-2 animate-bounce"
                    >
                      🏃‍♂️ ¡LLEVAR A MESA!
                    </button>
                  )}

                  {/* CASO 2: ENTREGADO -> Muestra aviso informativo */}
                  {isEntregado && (
                    <div className="px-5 py-2 bg-blue-100 text-blue-600 font-bold rounded-full border border-blue-200 flex items-center gap-2 cursor-default">
                      🍽️ Cliente Comiendo...
                    </div>
                  )}

                  {/* Botón de CANCELAR */}
                  <button
                    onClick={() => cancelOrder(orden.id)}
                    className="px-5 py-2 bg-gray-500 text-white font-bold rounded-full shadow-lg hover:bg-gray-700 transition transform hover:-translate-y-1 active:scale-95 border-b-4 border-gray-800 flex items-center gap-2"
                  >
                    🗑️ Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Orders;

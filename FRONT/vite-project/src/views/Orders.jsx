import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

// La dirección de tu backend (Pizarra Central)
const API_URL = "http://localhost:8000/api/pedidos";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- 1. CARGAR ÓRDENES (READ) ---
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/`);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error("Error trayendo pedidos:", err);
      setError("No se pudieron cargar los pedidos de la base de datos.");
    }
  };

  // useEffect: Configura la carga inicial y el Polling (Recarga Automática)
  useEffect(() => {
    fetchOrders();

    const intervalId = setInterval(() => {
      console.log("Recargando pedidos automáticamente...");
      fetchOrders();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // --- 2. CANCELAR ORDEN (DELETE) ---
  const cancelOrder = async (id) => {
    if (!window.confirm(`¿Seguro que quieres CANCELAR la orden #${id}?`))
      return;

    try {
      await axios.delete(`${API_URL}/${id}/`);
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
      alert("Orden CANCELADA correctamente");
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Hubo un error al intentar cancelar la orden.");
    }
  };

  // --- 3. CERRAR ORDEN (UPDATE/SERVIDO) ---
  const closeOrder = async (id) => {
    try {
      await axios.patch(`${API_URL}/${id}/`, {
        estado_pedido: "SERVIDO",
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id ? { ...order, estado_pedido: "SERVIDO" } : order
        )
      );
      alert(`Orden #${id} marcada como SERVIDA.`);
    } catch (err) {
      console.error("Error cerrando orden:", err);
      alert("Hubo un error al intentar cerrar la orden.");
    }
  };

  // --- 4. MOVER A FACTURACIÓN (HIDE/PASS TO BILLING) ---
  const moveToBilling = async (id) => {
    if (
      !window.confirm(
        `¿Seguro que quieres MOVER la orden #${id} a Facturación/Billing? Esta acción la ocultará.`
      )
    )
      return;

    try {
      await axios.post(`${API_URL}/${id}/facturar/`);

      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));

      alert(`Orden #${id} movida a Facturación y oculta.`);
    } catch (err) {
      console.error("Error moviendo a facturación:", err);
      alert(
        "Hubo un error al intentar mover la orden a Facturación. Revisa la consola para más detalles."
      );
    }
  };

  // --- 5. NAVEGAR A MESAS ---
  const goToTables = () => {
    navigate("/tables");
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 min-h-screen font-sans antialiased">
      <Header />

      <div className="container mx-auto max-w-4xl p-4 pt-8">
        <h1 className="text-4xl font-extrabold text-red-800 text-center tracking-tight">
          Tus Pedidos
        </h1>

        {/* --- BOTONES DE NAVEGACIÓN GLOBAL --- */}
        <div className="flex justify-center gap-4 my-6">
          <button
            onClick={() => navigate("/tables")}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition transform hover:scale-[1.05]"
          >
            🗺️ Ver Mesas
          </button>
          <button
            onClick={() => navigate("/manage-billing")}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition transform hover:scale-[1.05]"
          >
            🧾 Historial de Facturas
          </button>
        </div>
        {/* ------------------------------------- */}

        {error && (
          <div className="bg-red-500 text-white p-3 text-center rounded-lg shadow-md mb-6 animate-pulse">
            {error}
          </div>
        )}

        {orders.length === 0 && !error && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500 italic mb-6">
            <p className="text-lg">
              No hay pedidos registrados en la base de datos.
            </p>
            <p className="mt-2 text-sm">
              ¡Parece que es un buen momento para empezar a cocinar!
            </p>
          </div>
        )}

        <div className="space-y-6">
          {orders.map((orden) => (
            <div
              key={orden.id}
              className={`
                p-6 rounded-2xl shadow-xl border-b-4 transition-all duration-300 ease-in-out
                hover:scale-[1.02] hover:shadow-2xl hover:rotate-1
                ${
                  orden.estado_pedido === "SERVIDO"
                    ? "border-yellow-500 bg-gradient-to-r from-red-700 to-red-900 text-yellow-100"
                    : "border-red-600 bg-white text-red-800"
                }
              `}
            >
              {/* Cabecera de la tarjeta */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-extrabold text-3xl">Orden #{orden.id}</p>
                  <p
                    className={`text-sm opacity-80 mt-1 ${
                      orden.estado_pedido === "SERVIDO"
                        ? "text-yellow-300"
                        : "text-gray-600"
                    }`}
                  >
                    {orden.fecha} - {orden.hora}
                  </p>
                </div>

                {/* Precio destacado */}
                <div className="text-right">
                  <span
                    className={`block text-xs font-bold uppercase tracking-wide ${
                      orden.estado_pedido === "SERVIDO"
                        ? "text-yellow-400"
                        : "text-gray-500"
                    }`}
                  >
                    Total
                  </span>
                  <span
                    className={`font-extrabold text-4xl ${
                      orden.estado_pedido === "SERVIDO"
                        ? "text-yellow-300"
                        : "text-yellow-500"
                    }`}
                  >
                    ${orden.total || orden.subtotal || "0.00"}
                  </span>
                </div>
              </div>

              <hr
                className={`my-4 ${
                  orden.estado_pedido === "SERVIDO"
                    ? "border-yellow-600"
                    : "border-red-200"
                }`}
              />

              <div className="flex justify-between items-center mb-4">
                <p
                  className={`text-sm font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                    orden.estado_pedido === "SERVIDO"
                      ? "bg-yellow-600 text-red-900"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <span>Status:</span>
                  <span className="uppercase font-bold">
                    {orden.estado_pedido || "RECIBIDO"}
                  </span>
                </p>

                {orden.mesa_id && (
                  <div className="flex items-center gap-4">
                    <p
                      className={`text-lg font-bold ${
                        orden.estado_pedido === "SERVIDO"
                          ? "text-yellow-200"
                          : "text-red-700"
                      }`}
                    >
                      Mesa: <span className="ml-1">{orden.mesa_id}</span>
                    </p>

                    {/* Botón de Ir a Mesas (Individual) */}
                    <button
                      onClick={goToTables}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border transition hover:shadow-md ${
                        orden.estado_pedido === "SERVIDO"
                          ? "bg-yellow-400 text-red-900 border-yellow-400 hover:bg-yellow-500"
                          : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                      }`}
                      title="Ver mapa de mesas"
                    >
                      Ver Mesas 🗺️
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de productos */}
              <ul
                className={`p-3 rounded-lg text-sm space-y-2 ${
                  orden.estado_pedido === "SERVIDO"
                    ? "bg-red-800 text-yellow-200"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <p
                  className={`font-semibold text-xs mb-1 ${
                    orden.estado_pedido === "SERVIDO"
                      ? "text-yellow-400"
                      : "text-red-500"
                  }`}
                >
                  ITEMS DEL PEDIDO:
                </p>
                {orden.items &&
                  orden.items.map((it, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="flex items-center">
                        <span
                          className={`font-bold mr-2 text-base ${
                            orden.estado_pedido === "SERVIDO"
                              ? "text-yellow-300"
                              : "text-red-600"
                          }`}
                        >
                          {it.cantidad}x
                        </span>
                        {it.producto_nombre || it.name}
                      </span>

                      {/* Precio Individual del ítem (Cantidad * Precio Unitario) */}
                      {it.precio && (
                        <span
                          className={`font-semibold text-sm ${
                            orden.estado_pedido === "SERVIDO"
                              ? "text-yellow-300"
                              : "text-red-600"
                          }`}
                        >
                          ${(it.cantidad * it.precio).toFixed(2)}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>

              {/* Opciones de la Orden */}
              <div className="mt-6 flex justify-end gap-3">
                {/* Botón de MOVER A FACTURACIÓN (Solo si está SERVIDO) */}
                {orden.estado_pedido === "SERVIDO" ? (
                  <button
                    onClick={() => moveToBilling(orden.id)}
                    className="px-5 py-2 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700 transition transform hover:-translate-y-1 active:scale-95 border-b-4 border-green-800 flex items-center gap-2"
                  >
                    💵 Mover a Facturación
                  </button>
                ) : (
                  /* Botón de CERRAR ORDEN (Servido) (Solo si NO está SERVIDO) */
                  <button
                    onClick={() => closeOrder(orden.id)}
                    className="px-5 py-2 bg-yellow-600 text-red-900 font-bold rounded-full shadow-lg hover:bg-yellow-700 transition transform hover:-translate-y-1 active:scale-95 border-b-4 border-yellow-800 flex items-center gap-2"
                  >
                    ✅ Cerrar Orden (Servido)
                  </button>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;

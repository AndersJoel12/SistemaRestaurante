import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api/pedidos";

// Definimos los estados
const ESTADOS = {
  PREPARADO: "PREPARADO",
  ENTREGADO: "ENTREGADO",
  POR_FACTURAR: "POR_FACTURAR", // Este activa tu aviso verde de "Servido / Cerrado"
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- 1. CARGAR ÓRDENES ---
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/`);

      // 🔥 CORRECCIÓN AQUÍ: LISTA NEGRA MÁS ESTRICTA
      // Agregamos "CERRADO" y "SERVIDO" para que no salgan los pedidos viejos/antiguos.
      // Dejamos "POR_FACTURAR" visible para que puedas ver tu badge verde.
      const ESTADOS_OCULTOS = ["CANCELADO", "PAGADO", "CERRADO", "SERVIDO"];

      const activeOrders = response.data.filter(
        (o) => !ESTADOS_OCULTOS.includes(o.estado_pedido)
      );

      // Ordenar por urgencia
      activeOrders.sort((a, b) => {
        if (
          a.estado_pedido === ESTADOS.PREPARADO &&
          b.estado_pedido !== ESTADOS.PREPARADO
        )
          return -1;
        if (
          a.estado_pedido !== ESTADOS.PREPARADO &&
          b.estado_pedido === ESTADOS.PREPARADO
        )
          return 1;
        return 0;
      });

      setOrders(activeOrders);
      setError(null);
    } catch (err) {
      console.error("Error trayendo pedidos:", err);
      setError("No se pudieron cargar los pedidos.");
    }
  };

  useEffect(() => {
    fetchOrders();
    // Establece el intervalId como una variable para asegurar que se limpia correctamente
    const intervalId = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // --- 2. ENTREGAR ---
  const entregarPedido = async (id) => {
    try {
      await axios.patch(`${API_URL}/${id}/`, {
        estado_pedido: ESTADOS.ENTREGADO,
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id
            ? { ...order, estado_pedido: ESTADOS.ENTREGADO }
            : order
        )
      );
    } catch (err) {
      console.error("Error entregando:", err);
    }
  };

  // --- 3. CERRAR ORDEN (Tu lógica solicitada) ---
  const closeOrder = async (id) => {
    try {
      console.log(`🔒 Cerrando orden ${id} -> Enviando a Caja`);

      // Enviamos a POR_FACTURAR para que lo vea el cajero
      await axios.patch(`${API_URL}/${id}/`, {
        estado_pedido: ESTADOS.POR_FACTURAR,
      });

      // Actualizamos localmente para que cambie al estado "Servido" y muestre el aviso verde
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id
            ? { ...order, estado_pedido: ESTADOS.POR_FACTURAR }
            : order
        )
      );
    } catch (err) {
      console.error("❌ Error cerrando orden:", err.response?.data);
      alert("Error al cerrar orden.");
    }
  };

  // --- 4. CANCELAR ---
  const cancelOrder = async (id) => {
    if (!window.confirm(`¿Cancelar orden #${id}?`)) return;
    try {
      await axios.delete(`${API_URL}/${id}/`);
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
    } catch (err) {
      console.error("Error cancelando:", err);
      alert("Error al cancelar.");
    }
  };

  const goToTables = () => navigate("/tables");
  const goToBilling = () => navigate("/billing");

  return (
    // Agregado role="main" para el contenido principal
    <div
      className="bg-gradient-to-br from-red-50 to-red-100 min-h-screen font-sans antialiased"
      role="main"
    >
      <Header />

      <div className="container mx-auto max-w-4xl p-4 pt-8">
        {/* Agregado aria-label para describir la sección */}
        <h1
          className="text-4xl font-extrabold text-red-800 text-center tracking-tight"
          aria-label="Pedidos activos del sistema"
        >
          Tus Pedidos
        </h1>

        {/* Agregado role="group" para agrupar las acciones de navegación */}
        <div
          className="flex flex-col sm:flex-row justify-center gap-4 my-6"
          role="group"
          aria-label="Opciones de navegación principal"
        >
          {/* Añadido aria-label para describir el propósito del botón */}
          <button
            onClick={goToTables}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition transform hover:scale-[1.05]"
            aria-label="Ir a la vista de Mesas"
          >
            🗺️ Ver Mesas
          </button>
          {/* Añadido aria-label para describir el propósito del botón */}
          <button
            onClick={goToBilling}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition transform hover:scale-[1.05]"
            aria-label="Ir a la vista de Facturas"
          >
            🧾 Facturas
          </button>
        </div>

        {/* Agregado role="alert" para mensajes de error */}
        {error && (
          <div
            className="bg-red-500 text-white p-3 rounded-lg mb-6"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {/* Agregado role="region" y aria-label para la lista de órdenes */}
        <div
          className="space-y-6"
          role="region"
          aria-label="Lista de órdenes activas"
        >
          {orders.map((orden) => {
            const isPreparado = orden.estado_pedido === ESTADOS.PREPARADO;
            const isEntregado = orden.estado_pedido === ESTADOS.ENTREGADO;
            // Actualizamos la comparación también aquí
            const isServido = orden.estado_pedido === ESTADOS.POR_FACTURAR;

            console.log(`--- Orden #${orden.id} ---`);
            console.log("Valor de orden.items:", orden.items);

            return (
              // Agregado role="article" para cada tarjeta de orden
              <div
                key={orden.id}
                role="article"
                aria-labelledby={`orden-titulo-${orden.id}`}
                className={`
                  p-6 rounded-2xl shadow-xl border-b-4 transition-all duration-300 ease-in-out
                  hover:scale-[1.02] hover:shadow-2xl
                  ${
                    isPreparado
                      ? "border-yellow-500 bg-gradient-to-r from-red-700 to-red-900 text-yellow-100"
                      : isServido
                      ? "border-green-500 bg-green-50 text-green-900 opacity-75"
                      : "border-red-600 bg-white text-red-800"
                  }
                `}
              >
                {/* Header Tarjeta */}
                {/* Responsive: flex-col en móvil, flex-row en sm */}
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                  <div>
                    {/* Agregado id para aria-labelledby */}
                    <p
                      className="font-extrabold text-3xl"
                      id={`orden-titulo-${orden.id}`}
                    >
                      Orden #{orden.id}
                    </p>
                    <p
                      className={`text-sm opacity-80 mt-1 ${
                        isPreparado ? "text-yellow-300" : "text-gray-600"
                      }`}
                    >
                      {orden.fecha} - {orden.hora}
                    </p>
                  </div>
                  {/* Total: Movido a la parte de abajo en móvil para mejor flujo vertical si es necesario, pero manteniendo el layout original en sm */}
                  <div className="text-right mt-2 sm:mt-0">
                    <span className="block text-xs font-bold uppercase tracking-wide opacity-70">
                      Total
                    </span>
                    <span
                      className={`font-extrabold text-4xl ${
                        isPreparado ? "text-yellow-300" : "text-yellow-500"
                      }`}
                      aria-label={`Costo total: ${
                        orden.CostoTotal || "0.00"
                      } dólares`}
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

                {/* Info Mesa */}
                {/* Responsive: Mantener alineación en móvil y desktop */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
                  <p
                    className={`text-sm font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                      isPreparado
                        ? "bg-yellow-600 text-red-900"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <span>Status:</span>
                    {/* Agregado aria-live="polite" al estado */}
                    <span className="uppercase font-bold" aria-live="polite">
                      {orden.estado_pedido}
                    </span>
                  </p>
                  {orden.mesa_id &&
                    (console.log(orden.mesa_id),
                    (
                      <div className="flex items-center gap-4">
                        <p
                          className={`text-lg font-bold ${
                            isPreparado ? "text-yellow-200" : "text-red-700"
                          }`}
                          aria-label={`Mesa número ${orden.mesa_id}`}
                        >
                          Mesa: <span className="ml-1">{orden.mesa_id}</span>
                        </p>
                      </div>
                    ))}
                </div>

                {/* Items */}
                <ul
                  className={`p-3 rounded-lg text-sm space-y-2 ${
                    isPreparado
                      ? "bg-red-800 text-yellow-200"
                      : "bg-red-50 text-red-700"
                  }`}
                  role="list"
                  aria-label={`Detalles de los items de la orden ${orden.id}`}
                >
                  <p
                    className={`font-semibold text-xs mb-1 ${
                      isPreparado ? "text-yellow-400" : "text-red-500"
                    }`}
                  >
                    ITEMS DEL PEDIDO:
                  </p>

                  {orden.items_detalle &&
                    orden.items_detalle.map((it, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                        aria-label={`${it.cantidad} unidades de ${
                          it.producto_nombre || "Producto sin nombre"
                        }`}
                      >
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
                      </li>
                    ))}
                </ul>

                {/* --- BOTONES CON TU ESTILO PRESERVADO --- */}
                {/* Responsive: flex-col reverse en móvil, flex-row en sm */}
                <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
                  {isPreparado && (
                    <button
                      onClick={() => entregarPedido(orden.id)}
                      className="px-5 py-2 bg-yellow-500 text-red-900 font-bold rounded-full shadow-lg hover:bg-yellow-400 transition transform hover:-translate-y-1 active:scale-95 border-b-4 border-yellow-700 flex items-center justify-center sm:justify-start gap-2 animate-bounce mt-3 sm:mt-0"
                      aria-label={`Entregar a mesa la orden ${orden.id}`}
                    >
                      🏃‍♂️ ¡LLEVAR A MESA!
                    </button>
                  )}

                  {isEntregado && (
                    <button
                      onClick={() => closeOrder(orden.id)}
                      className="px-5 py-2 bg-yellow-600 text-red-900 font-bold rounded-full shadow-lg hover:bg-yellow-700 transition transform hover:-translate-y-1 active:scale-95 border-b-4 border-yellow-800 flex items-center justify-center sm:justify-start gap-2 mt-3 sm:mt-0"
                      aria-label={`Cerrar orden ${orden.id} y enviar a facturar`}
                    >
                      ✅ Cerrar Orden
                    </button>
                  )}

                  {isServido && (
                    <span
                      className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-lg border border-green-200 cursor-default flex items-center justify-center sm:justify-start mt-3 sm:mt-0"
                      aria-label="Orden servida y lista para facturación"
                    >
                      🏁 Servido / Cerrado
                    </span>
                  )}

                  <button
                    onClick={() => cancelOrder(orden.id)}
                    className="px-5 py-2 bg-gray-500 text-white font-bold rounded-full shadow-lg hover:bg-gray-700 transition transform hover:-translate-y-1 active:scale-95 border-b-4 border-gray-800 flex items-center justify-center sm:justify-start gap-2"
                    aria-label={`Cancelar y eliminar orden ${orden.id}`}
                  >
                    🗑️ Cancelar
                  </button>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <p
              className="text-center text-lg text-red-600 font-semibold mt-10 p-6 bg-white rounded-xl shadow-lg"
              role="status"
            >
              🎉 No hay pedidos activos en este momento. ¡A descansar!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;

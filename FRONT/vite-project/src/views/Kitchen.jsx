import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Header from "../components/Header"; // 👈 Importación del Header
const API_PEDIDOS = "http://localhost:8000/api/pedidos";

const ESTADOS = {
  NUEVO: "ABIERTO",
  COCINANDO: "EN_ESPERA",
  LISTO: "PREPARADO",
  ENTREGADO: "ENTREGADO",
  FINALIZADO: "CERRADO",
};

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  const formatTime = (time) => (time ? time.substring(0, 5) : "--:--");

  // --- CARGAR PEDIDOS ---
  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${API_PEDIDOS}/`);

      if (Array.isArray(response.data)) {
        const kitchenOrders = response.data.filter(
          (o) =>
            o.estado_pedido === ESTADOS.NUEVO ||
            o.estado_pedido === ESTADOS.COCINANDO ||
            o.estado_pedido === ESTADOS.LISTO
        );

        // Ordenamos por hora
        kitchenOrders.sort(
          (a, b) =>
            new Date(a.fecha + " " + a.hora) - new Date(b.fecha + " " + b.hora)
        );
        setOrders(kitchenOrders);
        setError(null);
      }
    } catch (err) {
      console.error("❌ [ERROR] Fallo al cargar cocina:", err);
      // Solo establece un error visible si no es una simple interrupción de intervalo
      setError("Error al cargar pedidos. Reintentando...");
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // --- ➡️ AVANZAR ESTADO ---
  const avanzarEstado = async (orden) => {
    let nuevoEstado = "";
    switch (orden.estado_pedido) {
      case ESTADOS.NUEVO:
        nuevoEstado = ESTADOS.COCINANDO;
        break;
      case ESTADOS.COCINANDO:
        nuevoEstado = ESTADOS.LISTO;
        break;
      default:
        return;
    }
    actualizarEstado(orden, nuevoEstado);
  };

  // --- ⬅️ RETROCEDER ESTADO (NUEVA FUNCIÓN) ---
  const retrocederEstado = async (orden) => {
    let nuevoEstado = "";
    switch (orden.estado_pedido) {
      case ESTADOS.COCINANDO:
        nuevoEstado = ESTADOS.NUEVO;
        break; // De Fuego a Nuevo
      case ESTADOS.LISTO:
        nuevoEstado = ESTADOS.COCINANDO;
        break; // De Listo a Fuego
      default:
        return;
    }
    actualizarEstado(orden, nuevoEstado);
  };

  // Función auxiliar para no repetir lógica
  const actualizarEstado = async (orden, nuevoEstado) => {
    const copiaOriginal = [...orders];
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orden.id ? { ...o, estado_pedido: nuevoEstado } : o
      )
    );

    try {
      await axios.patch(`${API_PEDIDOS}/${orden.id}/`, {
        estado_pedido: nuevoEstado,
      });
    } catch (err) {
      console.error("❌ [ERROR] Fallo update:", err);
      setOrders(copiaOriginal);
      alert("Error de conexión al actualizar el estado.");
    }
  };

  const nuevos = orders.filter((o) => o.estado_pedido === ESTADOS.NUEVO);
  const pendientes = orders.filter(
    (o) => o.estado_pedido === ESTADOS.COCINANDO
  );
  const finalizados = orders.filter((o) => o.estado_pedido === ESTADOS.LISTO);

  const OrderItemsList = ({ items, observacion }) => {
    if (!items || items.length === 0)
      return <div className="text-red-500 text-xs">Sin items</div>;
    return (
      <>
        <ul className="ml-4 list-disc text-sm text-gray-700 mb-3 space-y-1">
          {items.map((item, idx) => {
            const nombre =
              item.producto_nombre ||
              item.nombre ||
              item.producto?.nombre ||
              "Producto";
            return (
              <li key={item.id || idx}>
                <span className="font-bold">{item.cantidad || 1}x</span>{" "}
                {nombre}
              </li>
            );
          })}
        </ul>
        {observacion && (
          <div className="bg-white p-2 rounded text-xs text-red-600 border border-red-100 mb-3 italic font-bold">
            📝 {observacion}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* 👈 Uso del componente Header */}
      <Header />

      {/* Se ha quitado el título duplicado de COCINA aquí, ya que el Header lo gestiona */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 items-start h-full">
        {/* --- COLUMNA 1: RECIBIDOS --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-gray-400">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
            <span>🔔 Recibidos</span>
            <span className="bg-gray-200 text-gray-800 text-sm px-2 py-1 rounded-full">
              {nuevos.length}
            </span>
          </h2>
          <div className="space-y-3">
            {nuevos.map((orden) => (
              <div
                key={orden.id}
                className="p-4 bg-gray-50 border border-gray-300 rounded-md shadow-sm border-l-4 border-l-blue-400 animate-fade-in"
              >
                <div className="flex justify-between mb-2 border-b border-gray-200 pb-2">
                  <span className="font-bold text-gray-800">
                    #{orden.id} - Mesa {orden.mesa_id}
                  </span>
                  <span className="font-mono text-gray-500 text-sm">
                    {formatTime(orden.hora)}
                  </span>
                </div>
                <OrderItemsList
                  items={orden.items}
                  observacion={orden.observacion}
                />

                <button
                  onClick={() => avanzarEstado(orden)}
                  className="w-full bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 font-bold py-2 px-4 rounded transition-colors flex justify-center items-center gap-2 text-sm"
                >
                  🔥 A Cocinar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLUMNA 2: EN PREPARACIÓN (CON BOTÓN DE RETROCESO) --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-yellow-400">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
            <span>🔥 En Preparación</span>
            <span className="bg-yellow-200 text-yellow-800 text-sm px-2 py-1 rounded-full">
              {pendientes.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pendientes.map((orden) => (
              <div
                key={orden.id}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-md shadow-sm relative hover:shadow-md transition-shadow animate-fade-in"
              >
                <div className="absolute top-2 right-2 animate-pulse text-xl">
                  🍳
                </div>
                <div className="flex justify-between items-start border-b border-yellow-200 pb-2 mb-2">
                  <div>
                    <p className="font-bold text-lg text-gray-800">
                      Orden #{orden.id}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      Mesa: {orden.mesa_id}
                    </p>
                  </div>
                  <div className="text-right mr-6">
                    <p className="font-bold text-gray-700">
                      {formatTime(orden.hora)}
                    </p>
                  </div>
                </div>
                <OrderItemsList
                  items={orden.items}
                  observacion={orden.observacion}
                />

                <div className="flex gap-2 mt-2">
                  {/* BOTÓN RETROCEDER */}
                  <button
                    onClick={() => retrocederEstado(orden)}
                    className="px-3 py-2 bg-gray-200 text-gray-600 border border-gray-300 hover:bg-gray-300 rounded font-bold text-xs transition-colors"
                    title="Devolver a Recibidos"
                  >
                    ↩️
                  </button>

                  {/* BOTÓN AVANZAR */}
                  <button
                    onClick={() => avanzarEstado(orden)}
                    className="flex-1 bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 font-bold py-2 px-4 rounded transition-colors flex justify-center items-center gap-2"
                  >
                    Listo para Servir ➡️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLUMNA 3: LISTOS (CON BOTÓN DE RETROCESO) --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-green-500">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
            <span>✅ Listos</span>
            <span className="bg-green-200 text-green-800 text-sm px-2 py-1 rounded-full">
              {finalizados.length}
            </span>
          </h2>

          <div className="space-y-3">
            {finalizados.map((orden) => (
              <div
                key={orden.id}
                className="p-4 bg-green-50 border border-green-200 rounded-md shadow-sm opacity-90 hover:opacity-100 transition-opacity animate-fade-in"
              >
                <div className="flex justify-between items-start border-b border-green-200 pb-2 mb-2">
                  <div>
                    <p className="font-bold text-lg text-gray-800">
                      Orden #{orden.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mesa: {orden.mesa_id}
                    </p>
                  </div>
                  <span className="text-2xl animate-bounce">🍽️</span>
                </div>

                <OrderItemsList
                  items={orden.items}
                  observacion={orden.observacion}
                />

                <div className="mt-3 text-center py-2 bg-green-100 rounded border border-green-200">
                  <p className="text-sm text-green-800 font-bold flex items-center justify-center gap-2">
                    <span>🔔</span> ESPERANDO AL MESERO
                  </p>
                </div>

                {/* BOTÓN DE CORRECCIÓN (RETROCEDER) */}
                <button
                  onClick={() => retrocederEstado(orden)}
                  className="w-full mt-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 py-1 rounded transition-colors"
                >
                  ↩️ Error: Devolver a cocina
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kitchen;

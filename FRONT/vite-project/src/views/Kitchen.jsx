import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Header from "../components/Header";

// CONFIGURACIÓN DE ENTORNO
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/pedidos` 
  : "http://localhost:8000/api/pedidos";

const ESTADOS = {
  NUEVO: "ABIERTO",
  COCINANDO: "EN_ESPERA",
  LISTO: "PREPARADO",
  ENTREGADO: "ENTREGADO",
  FINALIZADO: "CERRADO",
};

// MAQUINA DE ESTADOS (Lógica Centralizada)
// Define: "Si estoy en X, al avanzar voy a Y, al retroceder voy a Z"
const TRANSICIONES = {
  [ESTADOS.NUEVO]: { next: ESTADOS.COCINANDO, prev: null },
  [ESTADOS.COCINANDO]: { next: ESTADOS.LISTO, prev: ESTADOS.NUEVO },
  [ESTADOS.LISTO]: { next: ESTADOS.ENTREGADO, prev: ESTADOS.COCINANDO },
};

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  // Indicador visual de "Refrescando..." sin bloquear la pantalla
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatTime = (time) => (time ? time.substring(0, 5) : "--:--");

  // --- CARGAR PEDIDOS ---
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const response = await axios.get(`${API_URL}/`);

      if (Array.isArray(response.data)) {
        const kitchenOrders = response.data.filter(
          (o) =>
            o.estado_pedido === ESTADOS.NUEVO ||
            o.estado_pedido === ESTADOS.COCINANDO ||
            o.estado_pedido === ESTADOS.LISTO
        );

        // Ordenamos por hora (FIFO: First In, First Out)
        kitchenOrders.sort(
          (a, b) => new Date(a.fecha + " " + a.hora) - new Date(b.fecha + " " + b.hora)
        );
        
        // Solo actualizamos si hay cambios reales (optimización React)
        // Aquí simplificamos seteando siempre, pero en apps grandes compararíamos.
        setOrders(kitchenOrders);
        setError(null);
      }
    } catch (err) {
      console.error("❌ Error Kitchen:", err);
      // No mostramos error en pantalla si es un fallo silencioso de polling
      if (!silent) setError("Error de conexión. Reintentando...");
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // POLLING INTELIGENTE
  useEffect(() => {
    fetchOrders(false); // Primera carga con spinner
    
    const interval = setInterval(() => {
        fetchOrders(true); // Cargas siguientes silenciosas
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // --- GESTIÓN DE ESTADO ---
  const cambiarEstado = async (orden, direccion = "next") => {
    const config = TRANSICIONES[orden.estado_pedido];
    if (!config) return;

    const nuevoEstado = config[direccion];
    if (!nuevoEstado) return;

    // Optimistic UI Update (Actualizamos la interfaz antes de que el servidor responda)
    const copiaOriginal = [...orders];
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orden.id ? { ...o, estado_pedido: nuevoEstado } : o
      )
    );

    try {
      await axios.patch(`${API_URL}/${orden.id}/`, {
        estado_pedido: nuevoEstado,
      });
      // Si todo sale bien, refrescamos silenciosamente para asegurar consistencia
      fetchOrders(true);
    } catch (err) {
      console.error("❌ Error update:", err);
      setOrders(copiaOriginal); // Revertimos si falla
      alert("No se pudo actualizar el estado. Verifica tu conexión.");
    }
  };

  const nuevos = orders.filter((o) => o.estado_pedido === ESTADOS.NUEVO);
  const pendientes = orders.filter((o) => o.estado_pedido === ESTADOS.COCINANDO);
  const finalizados = orders.filter((o) => o.estado_pedido === ESTADOS.LISTO);

  // --- SUBCOMPONENTE DE LISTA ---
  const OrderItemsList = ({ items, observacion, orderId }) => {
    if (!items || items.length === 0)
      return (
        <div className="text-red-500 text-xs italic p-2" role="alert">
          ⚠ Sin ítems registrados
        </div>
      );

    return (
      <div role="group" aria-label={`Detalle de orden ${orderId}`}>
        <ul className="ml-4 list-disc text-sm text-gray-800 mb-3 space-y-1 font-medium">
          {items.map((item, idx) => {
            const nombre = item.producto_nombre || item.nombre || item.producto?.nombre || "Producto";
            return (
              <li key={item.id || idx}>
                <span className="font-black text-gray-900">{item.cantidad || 1}x</span>{" "}
                {nombre}
              </li>
            );
          })}
        </ul>
        {observacion && (
          <div
            className="bg-red-50 p-2 rounded text-xs text-red-700 border border-red-200 mb-3 font-bold flex gap-1 items-start"
            role="note"
          >
            <span aria-hidden="true">📝</span>
            <span>{observacion}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-8" role="main">
      <Header />

      {/* BARRA DE ESTADO / ERROR */}
      <div className="px-4 pt-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            👨‍🍳 CONTROL DE COCINA
        </h1>
        {isRefreshing && (
            <span className="text-xs text-gray-400 animate-pulse flex items-center gap-1">
                🔄 Sincronizando...
            </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500 text-white p-3 mx-4 mt-2 rounded-lg text-center shadow-lg animate-bounce" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* KANBAN BOARD */}
      <div className="flex flex-col lg:flex-row gap-6 p-4 items-start min-h-[600px]">
        
        {/* --- COLUMNA 1: NUEVOS --- */}
        <section className="flex-1 w-full bg-white rounded-xl shadow-lg border-t-8 border-gray-500 overflow-hidden flex flex-col h-full" aria-labelledby="col-nuevos">
          <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 id="col-nuevos" className="text-lg font-black text-gray-700 uppercase tracking-wide">
                🔔 Recibidos
            </h2>
            <span className="bg-gray-800 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {nuevos.length}
            </span>
          </div>
          
          <div className="p-4 space-y-4 bg-gray-50 flex-1 min-h-[200px]">
            {nuevos.map((orden) => (
              <article 
                key={orden.id} 
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 animate-fade-in-up hover:shadow-md transition-shadow"
              >
                <header className="flex justify-between items-center mb-3 border-b pb-2">
                    <span className="font-black text-lg">#{orden.id}</span>
                    <div className="text-right">
                        <span className="block text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Mesa {orden.mesa_id}
                        </span>
                        <span className="text-xs text-gray-400 font-mono mt-1 block">
                            {formatTime(orden.hora)}
                        </span>
                    </div>
                </header>
                
                <OrderItemsList items={orden.items_detalle} observacion={orden.observacion} orderId={orden.id} />

                <button
                  onClick={() => cambiarEstado(orden, "next")}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                  aria-label={`Empezar a cocinar orden ${orden.id}`}
                >
                  🔥 A COCINAR
                </button>
              </article>
            ))}
            {nuevos.length === 0 && <EmptyState text="Esperando comandas..." icon="⏲" />}
          </div>
        </section>

        {/* --- COLUMNA 2: EN PREPARACIÓN --- */}
        <section className="flex-1 w-full bg-white rounded-xl shadow-lg border-t-8 border-yellow-400 overflow-hidden flex flex-col h-full" aria-labelledby="col-cocina">
          <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex justify-between items-center">
            <h2 id="col-cocina" className="text-lg font-black text-yellow-800 uppercase tracking-wide">
                🍳 En Fuego
            </h2>
            <span className="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {pendientes.length}
            </span>
          </div>

          <div className="p-4 space-y-4 bg-yellow-50/30 flex-1 min-h-[200px]">
            {pendientes.map((orden) => (
              <article 
                key={orden.id} 
                className="bg-white border-l-4 border-yellow-400 rounded-lg shadow-sm p-4 relative animate-fade-in-up"
              >
                {/* Timer visual o indicador */}
                <span className="absolute top-2 right-2 text-2xl animate-pulse" aria-hidden="true">🔥</span>

                <header className="flex justify-between items-start mb-3">
                    <div>
                        <span className="font-black text-xl text-gray-800">#{orden.id}</span>
                        <p className="text-sm font-bold text-gray-500">Mesa {orden.mesa_id}</p>
                    </div>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 mt-1 mr-8">
                        {formatTime(orden.hora)}
                    </span>
                </header>

                <OrderItemsList items={orden.items_detalle} observacion={orden.observacion} orderId={orden.id} />

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                        onClick={() => cambiarEstado(orden, "prev")}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Devolver a pendientes"
                        aria-label={`Devolver orden ${orden.id} a pendientes`}
                    >
                        ↩
                    </button>
                    <button
                        onClick={() => cambiarEstado(orden, "next")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        aria-label={`Marcar orden ${orden.id} como lista`}
                    >
                        ✅ LISTO
                    </button>
                </div>
              </article>
            ))}
            {pendientes.length === 0 && <EmptyState text="Fogones libres" icon="👨‍🍳" />}
          </div>
        </section>

        {/* --- COLUMNA 3: LISTOS --- */}
        <section className="flex-1 w-full bg-white rounded-xl shadow-lg border-t-8 border-green-500 overflow-hidden flex flex-col h-full" aria-labelledby="col-listos">
          <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
            <h2 id="col-listos" className="text-lg font-black text-green-800 uppercase tracking-wide">
                🚀 Para Servir
            </h2>
            <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {finalizados.length}
            </span>
          </div>

          <div className="p-4 space-y-4 bg-green-50/30 flex-1 min-h-[200px]">
            {finalizados.map((orden) => (
              <article 
                key={orden.id} 
                className="bg-white border border-green-200 rounded-lg shadow-sm p-4 opacity-90 hover:opacity-100 transition-opacity animate-fade-in"
              >
                <header className="flex justify-between items-center mb-3 border-b border-green-50 pb-2">
                    <span className="font-black text-lg text-gray-600 decoration-green-500 underline decoration-2">#{orden.id}</span>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        Mesa {orden.mesa_id}
                    </span>
                </header>

                <OrderItemsList items={orden.items_detalle} observacion={orden.observacion} orderId={orden.id} />

                <div className="bg-green-100 text-green-800 text-center py-2 mt-3 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    🔔 Llamando Mesero
                </div>
                
                <button
                    onClick={() => cambiarEstado(orden, "prev")}
                    className="w-full mt-2 text-xs text-gray-400 hover:text-red-500 hover:underline text-center py-1"
                >
                    Corrección: Volver a cocina
                </button>
              </article>
            ))}
            {finalizados.length === 0 && <EmptyState text="Sin platos en pase" icon="🍽" />}
          </div>
        </section>

      </div>
    </div>
  );
};

// Componente visual pequeño para estados vacíos
const EmptyState = ({ text, icon }) => (
    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10 opacity-50">
        <span className="text-4xl mb-2 grayscale">{icon}</span>
        <p className="font-medium text-sm">{text}</p>
    </div>
);

export default Kitchen;

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_PEDIDOS = "http://localhost:8000/api/pedidos";

// Mantenemos las constantes para evitar errores
const ESTADOS = {
  NUEVO: "RECIBIDO",
  COCINANDO: "EN_ESPERA",
  LISTO: "PREPARADO",
  FINALIZADO: "SERVIDO"
};

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

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
        kitchenOrders.sort((a, b) => new Date(a.fecha + ' ' + a.hora) - new Date(b.fecha + ' ' + b.hora));
        setOrders(kitchenOrders);
      }
    } catch (err) {
      console.error("Error cargando cocina:", err);
      setError("Error de conexión...");
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const avanzarEstado = async (orden) => {
    let nuevoEstado = "";
    
    switch (orden.estado_pedido) {
      case ESTADOS.NUEVO: nuevoEstado = ESTADOS.COCINANDO; break;
      case ESTADOS.COCINANDO: nuevoEstado = ESTADOS.LISTO; break;
      case ESTADOS.LISTO: nuevoEstado = ESTADOS.FINALIZADO; break;
      default: return;
    }

    const copiaOriginal = [...orders];
    if (nuevoEstado === ESTADOS.FINALIZADO) {
        setOrders(prev => prev.filter(o => o.id !== orden.id));
    } else {
        setOrders(prev => prev.map(o => o.id === orden.id ? { ...o, estado_pedido: nuevoEstado } : o));
    }

    try {
        await axios.patch(`${API_PEDIDOS}/${orden.id}/`, { estado_pedido: nuevoEstado });
    } catch (err) {
        alert("Error de conexión");
        setOrders(copiaOriginal);
    }
  };

  const nuevos = orders.filter(o => o.estado_pedido === ESTADOS.NUEVO);
  const pendientes = orders.filter(o => o.estado_pedido === ESTADOS.COCINANDO);
  const finalizados = orders.filter(o => o.estado_pedido === ESTADOS.LISTO);

  const formatTime = (time) => time ? time.substring(0, 5) : "--:--";

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      {/* --- 1. ENCABEZADO ORIGINAL RESTAURADO --- */}
      <div className="bg-red-800 text-white shadow-lg sticky top-0 z-10 border-b-4 border-yellow-500">
        <h1 className="p-4 text-3xl font-extrabold text-center text-yellow-400 tracking-wider flex justify-center items-center gap-3">
          COCINA
        </h1>
        {error && <div className="bg-red-600 text-white text-center text-xs p-1">{error}</div>}
      </div>

      {/* CONTENEDOR 3 COLUMNAS */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 items-start h-full">
        
        {/* --- COLUMNA 1: NUEVOS (Estilo Ticket/Entrada) --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-gray-400">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
             <span>🔔 Recibidos</span>
             <span className="bg-gray-200 text-gray-800 text-sm px-2 py-1 rounded-full">{nuevos.length}</span>
          </h2>
          
          <div className="space-y-3">
            {nuevos.length === 0 && <p className="text-gray-400 text-center italic">Esperando comandas...</p>}
            
            {nuevos.map((orden) => (
              <div key={orden.id} className="p-4 bg-gray-50 border border-gray-300 rounded-md shadow-sm border-l-4 border-l-blue-400">
                <div className="flex justify-between mb-2 border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-800">#{orden.id} - Mesa {orden.mesa_id}</span>
                    <span className="font-mono text-gray-500 text-sm">{formatTime(orden.hora)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2 italic">Nuevo pedido entrante...</p>
                
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

        {/* --- COLUMNA 2: PENDIENTES (Estilo Original Amarillo) --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-yellow-400">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
             <span>🔥 En Preparación</span>
             <span className="bg-yellow-200 text-yellow-800 text-sm px-2 py-1 rounded-full">{pendientes.length}</span>
          </h2>
          
          <div className="space-y-3">
            {pendientes.length === 0 && <p className="text-gray-400 text-center italic">Nada en los fogones...</p>}
            
            {pendientes.map((orden) => (
              <div key={orden.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-md shadow-sm relative hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start border-b border-yellow-200 pb-2 mb-2">
                    <div>
                        <p className="font-bold text-lg text-gray-800">Orden #{orden.id}</p>
                        <p className="text-xs text-gray-500 font-mono">Mesa: {orden.mesa_id || "?"}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-gray-700">{formatTime(orden.hora)}</p>
                    </div>
                </div>

                <ul className="ml-4 list-disc text-sm text-gray-700 mb-3 space-y-1">
                   {orden.items && orden.items.map((item) => (
                      <li key={item.id}>
                        <span className="font-bold">{item.cantidad}x</span> {item.producto_nombre || `Producto ${item.producto_id}`}
                      </li>
                   ))}
                </ul>

                {orden.observacion && (
                    <div className="bg-white p-2 rounded text-xs text-red-600 border border-red-100 mb-3 italic font-bold">
                        📝 {orden.observacion}
                    </div>
                )}

                <button
                  onClick={() => avanzarEstado(orden)}
                  className="w-full mt-2 bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 font-bold py-2 px-4 rounded transition-colors flex justify-center items-center gap-2"
                >
                  Listo para Servir ➡️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLUMNA 3: FINALIZADOS (Estilo Original Verde) --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-green-500">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
             <span>✅ Listos</span>
             <span className="bg-green-200 text-green-800 text-sm px-2 py-1 rounded-full">{finalizados.length}</span>
          </h2>

          <div className="space-y-3">
            {finalizados.length === 0 && <p className="text-gray-400 text-center italic">Nada pendiente de entrega.</p>}

            {finalizados.map((orden) => (
              <div key={orden.id} className="p-4 bg-green-50 border border-green-200 rounded-md shadow-sm opacity-90">
                <div className="flex justify-between items-start border-b border-green-200 pb-2 mb-2">
                    <div>
                        <p className="font-bold text-lg text-gray-800">Orden #{orden.id}</p>
                        <p className="text-xs text-gray-500">Mesa: {orden.mesa_id}</p>
                    </div>
                    <span className="text-2xl">🍽️</span>
                </div>

                <div className="text-center py-2">
                    <p className="text-sm text-green-800 font-medium">¡Esperando al mesero!</p>
                </div>

                <button
                  onClick={() => avanzarEstado(orden)}
                  className="w-full mt-2 bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 font-bold py-2 px-4 rounded transition-colors text-xs"
                >
                  Marcar como Entregado (X)
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
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_PEDIDOS = "http://localhost:8000/api/pedidos";

// 1. ACTUALIZACIÓN DE ESTADOS:
// Agregamos ENTREGADO para tener el mapa completo, aunque la cocina
// solo interactúa activamente hasta PREPARADO.
const ESTADOS = {
  NUEVO: "ABIERTO",
  COCINANDO: "EN_ESPERA",
  LISTO: "PREPARADO",
  ENTREGADO: "ENTREGADO", // El estado al que lo cambiará el mesero
  FINALIZADO: "CERRADO"
};

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  const formatTime = (time) => time ? time.substring(0, 5) : "--:--";

  // --- CARGAR PEDIDOS ---
  const fetchOrders = useCallback(async () => {
    console.log("📡 [COCINA] Buscando comandas...");
    try {
      const response = await axios.get(`${API_PEDIDOS}/`);
      
      if (Array.isArray(response.data)) {
        // 🔍 FILTRO CLAVE:
        // La cocina ve: ABIERTO, EN_ESPERA y PREPARADO.
        // En el momento que el mesero lo pasa a ENTREGADO, desaparece de aquí.
        const kitchenOrders = response.data.filter(
          (o) => 
            o.estado_pedido === ESTADOS.NUEVO || 
            o.estado_pedido === ESTADOS.COCINANDO || 
            o.estado_pedido === ESTADOS.LISTO
        );
        
        // Ordenamos: Los más viejos primero (FIFO)
        kitchenOrders.sort((a, b) => new Date(a.fecha + ' ' + a.hora) - new Date(b.fecha + ' ' + b.hora));
        setOrders(kitchenOrders);
        setError(null);
      }
    } catch (err) {
      console.error("❌ [ERROR] Fallo al cargar cocina:", err);
      // Opcional: setError("Error de conexión") si quieres feedback visual
    }
  }, []);

  // Polling cada 5 segundos
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // --- AVANZAR ESTADO ---
  const avanzarEstado = async (orden) => {
    console.log(`🔧 [ACCIÓN] Cocinero avanzando Orden #${orden.id}`);
    
    let nuevoEstado = "";
    switch (orden.estado_pedido) {
      case ESTADOS.NUEVO: 
        nuevoEstado = ESTADOS.COCINANDO; // De Abierto a En Espera
        break;
      case ESTADOS.COCINANDO: 
        nuevoEstado = ESTADOS.LISTO; // De En Espera a Preparado
        break;
      // 🛑 CASO PREPARADO:
      // No hay 'case' para ESTADOS.LISTO porque la cocina NO toca ese botón.
      // El mesero es quien lo moverá a ENTREGADO desde su propia vista.
      default: return;
    }

    // Optimistic UI (Actualización visual inmediata)
    const copiaOriginal = [...orders];
    setOrders(prev => prev.map(o => o.id === orden.id ? { ...o, estado_pedido: nuevoEstado } : o));

    try {
        await axios.patch(`${API_PEDIDOS}/${orden.id}/`, { estado_pedido: nuevoEstado });
        console.log(`✅ [ÉXITO] Orden #${orden.id} -> ${nuevoEstado}`);
    } catch (err) {
        console.error("❌ [ERROR] Fallo update:", err);
        setOrders(copiaOriginal); // Revertimos si falla
        alert("Error de conexión al actualizar estado.");
    }
  };

  const nuevos = orders.filter(o => o.estado_pedido === ESTADOS.NUEVO);
  const pendientes = orders.filter(o => o.estado_pedido === ESTADOS.COCINANDO);
  const finalizados = orders.filter(o => o.estado_pedido === ESTADOS.LISTO);

  // --- COMPONENTE DE LISTA ---
  const OrderItemsList = ({ items, observacion }) => {
    if (!items || items.length === 0) return <div className="text-red-500 text-xs">Sin items</div>;

    return (
      <>
        <ul className="ml-4 list-disc text-sm text-gray-700 mb-3 space-y-1">
          {items.map((item, idx) => {
            const nombre = item.producto_nombre || item.nombre || item.producto?.nombre || "Producto";
            const cant = item.cantidad || 1;
            return (
              <li key={item.id || idx}>
                <span className="font-bold">{cant}x</span> {nombre}
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
      
      {/* Header */}
      <div className="bg-red-800 text-white shadow-lg sticky top-0 z-10 border-b-4 border-yellow-500">
        <h1 className="p-4 text-3xl font-extrabold text-center text-yellow-400 tracking-wider flex justify-center items-center gap-3">
          COCINA
        </h1>
        {error && <div className="bg-red-600 text-white text-center text-xs p-1">{error}</div>}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 p-4 items-start h-full">
        
        {/* --- COLUMNA 1: RECIBIDOS (ABIERTO) --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-gray-400">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
             <span>🔔 Recibidos</span>
             <span className="bg-gray-200 text-gray-800 text-sm px-2 py-1 rounded-full">{nuevos.length}</span>
          </h2>
          
          <div className="space-y-3">
            {nuevos.length === 0 && <p className="text-gray-400 text-center italic">Esperando comandas...</p>}
            {nuevos.map((orden) => (
              <div key={orden.id} className="p-4 bg-gray-50 border border-gray-300 rounded-md shadow-sm border-l-4 border-l-blue-400 animate-fade-in">
                <div className="flex justify-between mb-2 border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-800">#{orden.id} - Mesa {orden.mesa_id}</span>
                    <span className="font-mono text-gray-500 text-sm">{formatTime(orden.hora)}</span>
                </div>
                <OrderItemsList items={orden.items} observacion={orden.observacion} />
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

        {/* --- COLUMNA 2: EN PREPARACIÓN (EN_ESPERA) --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-yellow-400">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
             <span>🔥 En Preparación</span>
             <span className="bg-yellow-200 text-yellow-800 text-sm px-2 py-1 rounded-full">{pendientes.length}</span>
          </h2>
          <div className="space-y-3">
            {pendientes.length === 0 && <p className="text-gray-400 text-center italic">Nada en los fogones...</p>}
            {pendientes.map((orden) => (
              <div key={orden.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-md shadow-sm relative hover:shadow-md transition-shadow animate-fade-in">
                {/* Indicador de fuego visual */}
                <div className="absolute top-2 right-2 animate-pulse text-xl">🍳</div>
                
                <div className="flex justify-between items-start border-b border-yellow-200 pb-2 mb-2">
                    <div>
                        <p className="font-bold text-lg text-gray-800">Orden #{orden.id}</p>
                        <p className="text-xs text-gray-500 font-mono">Mesa: {orden.mesa_id || "?"}</p>
                    </div>
                    <div className="text-right mr-6">
                        <p className="font-bold text-gray-700">{formatTime(orden.hora)}</p>
                    </div>
                </div>
                <OrderItemsList items={orden.items} observacion={orden.observacion} />
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

        {/* --- COLUMNA 3: LISTOS (PREPARADO) --- */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-md p-4 border-t-4 border-green-500">
          <h2 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
             <span>✅ Listos</span>
             <span className="bg-green-200 text-green-800 text-sm px-2 py-1 rounded-full">{finalizados.length}</span>
          </h2>

          <div className="space-y-3">
            {finalizados.length === 0 && <p className="text-gray-400 text-center italic">Nada pendiente de entrega.</p>}
            {finalizados.map((orden) => (
              <div key={orden.id} className="p-4 bg-green-50 border border-green-200 rounded-md shadow-sm opacity-90 hover:opacity-100 transition-opacity animate-fade-in">
                <div className="flex justify-between items-start border-b border-green-200 pb-2 mb-2">
                    <div>
                        <p className="font-bold text-lg text-gray-800">Orden #{orden.id}</p>
                        <p className="text-xs text-gray-500">Mesa: {orden.mesa_id}</p>
                    </div>
                    <span className="text-2xl animate-bounce">🍽️</span>
                </div>
                
                {/* Lista de items para referencia visual */}
                <OrderItemsList items={orden.items} observacion={orden.observacion} />

                {/* SIN BOTÓN - Se queda aquí hasta que el Mesero lo cambie a ENTREGADO */}
                <div className="mt-3 text-center py-2 bg-green-100 rounded border border-green-200">
                    <p className="text-sm text-green-800 font-bold flex items-center justify-center gap-2">
                        <span>🔔</span> ESPERANDO AL MESERO
                    </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Kitchen;
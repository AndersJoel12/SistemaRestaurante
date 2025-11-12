import React, { useEffect, useState } from "react";

const STORAGE_KEY = "kitchen_kanban";

const Orders= () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const allOrders = [
        ...parsed.Recibido,
        ...parsed.Pendiente,
        ...parsed.Finalizado,
      ];
      setOrders(allOrders);
    }
  }, []);

  return (
  <div className="flex flex-col h-screen bg-gray-100"> 
    {/* 1. Encabezado fijo (altura fija) */}
    <div className="bg-red-800 text-white z-20 flex-shrink-0"> 
      <h1 className="p-4 text-3xl font-extrabold text-center text-yellow-400">
        PEDIDOS REALIZADOS
      </h1>
    </div>

    {/* 2. Contenido principal (ocupa el espacio restante y es desplazable) */}
    <div className="flex-1 overflow-y-auto p-4"> 
      {/* El h1 vacío se mantiene por si es necesario */}
      <h1 className="text-xl font-bold mb-4"></h1> 

      <div className="space-y-4">
        {orders.map((orden) => (
          <div
            key={orden.id}
            className={`p-4 rounded-lg shadow-md border 
                        ${
                          orden.status === "Finalizado"
                            ? "border-green-500 bg-green-100"
                            : "border-gray-300 bg-white"
                        }`}
          >
            <p className="font-bold text-lg">Orden #{orden.id}</p>
            <p className="text-sm text-gray-600 mt-1">
              {orden.timestamp} — Subtotal: ${orden.subtotal}
            </p>
            <p className="text-sm font-medium mt-1">Estado: {orden.status || "Recibido"}</p>
            
            <ul className="ml-4 list-disc text-sm mt-3">
              {orden.items.map((it) => (
                <li key={it.id}>
                  {it.quantity}x {it.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
);
};

export default Orders;


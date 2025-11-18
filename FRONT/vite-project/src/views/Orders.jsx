import React, { useEffect, useState } from "react";

const STORAGE_KEY = "kitchen_kanban";

const Orders = () => {
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
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Pedidos realizados</h1>
      <div className="space-y-4">
        {orders.map((orden) => (
          <div
            key={orden.id}
            className={`p-4 rounded shadow-md border ${
              orden.status === "Finalizado"
                ? "border-green-500 bg-green-100"
                : "border-gray-300 bg-white"
            }`}
          >
            <p className="font-bold">Orden #{orden.id}</p>
            <p className="text-sm text-gray-600">
              {orden.timestamp} — Subtotal: ${orden.subtotal}
            </p>
            <p className="text-sm font-medium">
              Estado: {orden.status || "Recibido"}
            </p>
            <ul className="ml-4 list-disc text-sm mt-2">
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
  );
};

export default Orders;

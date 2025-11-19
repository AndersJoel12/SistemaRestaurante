import React, { useEffect, useState } from "react";
import Header from "../components/Header";
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
    <div className="p-6 bg-red-100 min-h-screen">
      <Header></Header>
      <h1 className="text-3xl font-extrabold text-yellow-400 mb-6 text-center">
        Pedidos realizados
      </h1>
      <div className="space-y-4">
        {orders.map((orden) => (
          <div
            key={orden.id}
            className={`p-4 rounded-xl shadow-lg border-4 ${
              orden.status === "Finalizado"
                ? "border-yellow-400 bg-red-700 text-yellow-200"
                : "border-red-600 bg-white text-red-800"
            }`}
          >
            <p className="font-bold text-lg">Orden #{orden.id}</p>
            <p className="text-sm mb-2">
              {orden.timestamp} — Subtotal:{" "}
              <span className="font-bold text-yellow-400">
                ${orden.subtotal}
              </span>
            </p>
            <p className="text-sm font-semibold">
              Estado:{" "}
              <span className="uppercase">{orden.status || "Recibido"}</span>
            </p>
            <ul className="ml-4 list-disc text-sm mt-2">
              {orden.items.map((it) => (
                <li key={it.id}>
                  <span className="text-yellow-500 font-bold">
                    {it.quantity}x
                  </span>{" "}
                  {it.name}
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

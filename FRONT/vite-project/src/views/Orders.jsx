import React, { useEffect, useState } from "react";
import Header from "../components/Header";

const STORAGE_KEY = "kitchen_kanban";

const Orders = () => {
  const [orders, setOrders] = useState([]);

  // Función para cargar órdenes desde sessionStorage
  const loadOrders = () => {
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
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 👇 Función para cancelar una orden
  const cancelOrder = (id) => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);

    // Filtramos cada estado para eliminar la orden con ese id
    parsed.Recibido = parsed.Recibido.filter((o) => o.id !== id);
    parsed.Pendiente = parsed.Pendiente.filter((o) => o.id !== id);
    parsed.Finalizado = parsed.Finalizado.filter((o) => o.id !== id);

    // Guardamos nuevamente en sessionStorage
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    // Recargamos las órdenes en el estado
    loadOrders();
  };

  return (
    <div className="p-6 bg-red-100 min-h-screen">
      <Header />
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
            <p className="text-sm mb-1">
              {orden.timestamp} — Subtotal:{" "}
              <span className="font-bold text-yellow-400">
                ${orden.subtotal}
              </span>
            </p>
            <p className="text-sm font-semibold">
              Estado:{" "}
              <span className="uppercase">{orden.status || "Recibido"}</span>
            </p>

            {/* 👇 Aquí aparece la mesa */}
            {orden.mesa && (
              <p className="text-sm font-semibold">
                Mesa:{" "}
                <span className="font-bold text-red-700">{orden.mesa}</span>
              </p>
            )}

            <ul className="ml-4 list-disc text-sm mt-2">
              {orden.items.map((it, index) => (
                <li key={index}>
                  <span className="text-yellow-500 font-bold">
                    {it.quantity}x
                  </span>{" "}
                  {it.name}
                </li>
              ))}
            </ul>

            {/* 👇 Botón para cancelar la orden */}
            <button
              onClick={() => cancelOrder(orden.id)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Cancelar Orden
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "kitchen_kanban";

const Kitchen = () => {
  const estadosOrdenados = ["Recibido", "Pendiente", "Finalizado"];
  const location = useLocation();
  const incomingOrder = location.state?.newOrder || null;

  const [kanbanData, setKanbanData] = useState({
    Recibido: [],
    Pendiente: [],
    Finalizado: [],
  });

  // Cargar del sessionStorage al montar
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setKanbanData({
          Recibido: parsed.Recibido || [],
          Pendiente: parsed.Pendiente || [],
          Finalizado: parsed.Finalizado || [],
        });
      }
    } catch (e) {
      console.warn("No se pudo leer sessionStorage:", e);
    }
  }, []);

  // Si llega una nueva orden por navegación, agregarla a Recibido sin duplicar
  useEffect(() => {
    if (!incomingOrder) return;

    setKanbanData((prev) => {
      const all = [...prev.Recibido, ...prev.Pendiente, ...prev.Finalizado];
      const exists = all.some((o) => o.id === incomingOrder.id);
      if (exists) return prev;

      const nuevaTarjeta = {
        id: incomingOrder.id,
        timestamp: incomingOrder.timestamp,
        subtotal: incomingOrder.subtotal,
        items: incomingOrder.items,
      };

      const next = {
        ...prev,
        Recibido: [nuevaTarjeta, ...prev.Recibido],
      };

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("No se pudo guardar en sessionStorage:", e);
      }

      return next;
    });
  }, [incomingOrder]);

  // Mover tareas entre columnas y persistir
  const moverTarea = (estadoActual, index, nuevoEstado) => {
    setKanbanData((prev) => {
      const tarea = prev[estadoActual][index];
      const next = {
        ...prev,
        [estadoActual]: prev[estadoActual].filter((_, i) => i !== index),
        [nuevoEstado]: [tarea, ...prev[nuevoEstado]],
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("No se pudo guardar en sessionStorage:", e);
      }
      return next;
    });
  };

  const renderBotones = (estado, index) => {
    const pos = estadosOrdenados.indexOf(estado);
    return (
      <div className="mt-2">
        {pos > 0 && (
          <button
            onClick={() => moverTarea(estado, index, estadosOrdenados[pos - 1])}
            className="text-xs bg-blue-200 px-2 py-1 rounded mr-1"
          >
            ← {estadosOrdenados[pos - 1]}
          </button>
        )}
        {pos < estadosOrdenados.length - 1 && (
          <button
            onClick={() => moverTarea(estado, index, estadosOrdenados[pos + 1])}
            className="text-xs bg-green-200 px-2 py-1 rounded"
          >
            → {estadosOrdenados[pos + 1]}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-100 min-h-screen">
      {estadosOrdenados.map((estado) => (
        <div key={estado} className="flex-1 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold mb-4 capitalize">{estado}</h2>
          <div className="space-y-2">
            {kanbanData[estado].map((orden, index) => (
              <div
                key={orden.id}
                className="p-3 bg-yellow-100 border border-yellow-400 rounded-md text-gray-800"
              >
                <p className="font-bold">Orden #{orden.id}</p>
                <p className="text-sm text-gray-600">
                  {orden.timestamp} — Subtotal: ${orden.subtotal}
                </p>
                <ul className="ml-4 list-disc text-sm">
                  {orden.items.map((it) => (
                    <li key={it.id}>
                      {it.quantity}x {it.name}
                    </li>
                  ))}
                </ul>
                {renderBotones(estado, index)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Kitchen;

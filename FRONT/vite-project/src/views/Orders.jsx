import React, { useEffect, useState } from "react";
import axios from "axios"; // 1. Importamos el mensajero
import Header from "../components/Header";

// La dirección de tu backend (Pizarra Central)
const API_URL = "http://localhost:8000/api/pedidos"; 

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  // --- 1. CARGAR ÓRDENES (READ) ---
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/`);
      // La base de datos nos devuelve la lista directa, no hace falta unir arrays manuales
      setOrders(response.data); 
    } catch (err) {
      console.error("Error trayendo pedidos:", err);
      setError("No se pudieron cargar los pedidos de la base de datos.");
    }
  };

  // useEffect: Se ejecuta una vez cuando entras a la pantalla
  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 2. CANCELAR ORDEN (DELETE) ---
  const cancelOrder = async (id) => {
    // Confirmación sencilla para evitar accidentes
    if (!window.confirm(`¿Seguro que quieres eliminar la orden #${id}?`)) return;

    try {
      // Le decimos a Django: "Borra el ID tal de la base de datos"
      await axios.delete(`${API_URL}/${id}/`);
      
      // Actualización Optimista: Lo borramos de la pantalla inmediatamente
      // para que el usuario no tenga que esperar a que recargue
      setOrders(prevOrders => prevOrders.filter(order => order.id !== id));
      
      alert("Orden eliminada correctamente");
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Hubo un error al intentar borrar la orden.");
    }
  };

  return (
    <div className="bg-red-100 min-h-screen font-sans">
      <Header />

      {error && (
        <div className="bg-red-500 text-white p-2 text-center rounded mb-4">
            {error}
        </div>
      )}

      {orders.length === 0 && !error && (
        <p className="text-center text-gray-500 italic">No hay pedidos registrados en la base de datos.</p>
      )}

      <div className="space-y-4 container mx-auto max-w-4xl">
        {orders.map((orden) => (
          <div
            key={orden.id}
            // Mantenemos tu lógica visual de colores según estado
            className={`p-4 rounded-xl shadow-lg border-4 transition-transform hover:scale-[1.01] ${
              orden.estado_pedido === "SERVIDO" // Nota: Ajusta este string según uses en tu DB (Finalizado/Servido)
                ? "border-yellow-400 bg-red-700 text-yellow-200"
                : "border-red-600 bg-white text-red-800"
            }`}
          >
            {/* Cabecera de la tarjeta */}
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-xl">Orden #{orden.id}</p>
                    <p className="text-xs opacity-75 mb-1">
                        {orden.fecha} {orden.hora}
                    </p>
                </div>
                
                {/* Precio destacado */}
                <div className="text-right">
                     <span className="block text-xs font-bold uppercase tracking-wide opacity-70">Total</span>
                     <span className="font-extrabold text-2xl text-yellow-500">
                        ${orden.total || orden.subtotal || "0.00"}
                     </span>
                </div>
            </div>

            <hr className={`my-2 ${orden.estado_pedido === "SERVIDO" ? "border-red-500" : "border-red-100"}`} />

            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600 inline-block">
                  Estado: <span className="uppercase font-bold text-gray-800">{orden.estado_pedido || "RECIBIDO"}</span>
                </p>

                {orden.mesa_id && (
                  <p className="text-sm font-semibold">
                    Mesa: <span className="font-bold text-red-600 text-lg ml-1">{orden.mesa_id}</span>
                  </p>
                )}
            </div>

            {/* Lista de productos */}
            <ul className="bg-opacity-10 bg-black rounded p-2 text-sm space-y-1">
              {orden.items && orden.items.map((it, index) => (
                <li key={index} className="flex justify-between">
                  <span>
                      <span className="font-bold text-yellow-600 mr-2">{it.cantidad}x</span> 
                      {it.producto_nombre || it.name}
                  </span>
                  {/* Si tu backend manda el precio individual, podrías mostrarlo aquí */}
                </li>
              ))}
            </ul>

            {/* Botón de cancelar */}
            <div className="mt-4 text-right">
                <button
                onClick={() => cancelOrder(orden.id)}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded shadow hover:bg-red-800 transition border border-red-800 text-sm flex items-center gap-2 ml-auto"
                >
                🗑️ Cancelar Orden
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TableCell from "./TableCell";
// import ArrowFluctuation from "./ArrowFluctuation";

// 1. CONFIGURACIÓN PROFESIONAL
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/mesas`
  : "http://localhost:8000/api/mesas";

const transformData = (apiMesas) => {
  return apiMesas.map((mesa) => ({
    id: mesa.id,
    number: mesa.numero,
    capacity: mesa.capacidad,
    status: mesa.estado ? "libre" : "ocupada",
    rawState: mesa.estado,
  }));
};

const TablesGrid = ({
  onNavigateToMenu,
  onTableSelect, // 🔥 Recibimos la función de TOGGLE del padre
  selectedTableId, // 🔥 Recibimos el ID para la selección visual
  selectedTable, // 🔥 Objeto completo para obtener info (es lo mismo que currentSelectedTable)
  onCancelAction, // Recibimos la acción de Cancelar
}) => {
  const navigate = useNavigate();

  // Estados
  const [tables, setTables] = useState([]);
  const [numPersonas, setNumPersonas] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 🔥 CORRECCIÓN 1: currentSelectedTable ahora es simplemente el prop selectedTable
  const currentSelectedTable = selectedTable;

  // --- CARGAR MESAS ---
  useEffect(() => {
    const fetchMesas = async () => {
      try {
        const response = await axios.get(`${API_URL}/`);
        const transformedTables = transformData(response.data).sort(
          (a, b) => a.number - b.number
        );
        setTables(transformedTables);
      } catch (error) {
        console.error("🔴 Error cargando mesas:", error);
        setErrorMsg("Error de conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };
    fetchMesas();
  }, []);

  // --- MANEJAR SELECCIÓN (Delegamos al padre) ---
  const handleSelect = (table) => {
    onTableSelect(table); // 🔥 Llamamos a la función de TOGGLE del padre
    setNumPersonas("");
    setErrorMsg("");
  };

  // --- VALIDACIÓN DE INPUT ---
  const handlePersonasChange = (e) => {
    const value = e.target.value;
    setErrorMsg("");

    if (value === "") {
      setNumPersonas("");
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return; // Aseguramos que sea un número positivo

    if (currentSelectedTable && num > currentSelectedTable.capacity) {
      setErrorMsg(
        `¡La mesa solo tiene ${currentSelectedTable.capacity} sillas!`
      );
    }

    setNumPersonas(num);
  };

  // --- APARTAR MESA LIBRE ---
  const handleApartar = async () => {
    // ... (Tu lógica de handleApartar se mantiene, ya que usa currentSelectedTable)
    if (!currentSelectedTable || !numPersonas) return;

    if (numPersonas > currentSelectedTable.capacity) {
      setErrorMsg("Excede la capacidad máxima.");
      return;
    }

    try {
      setLoading(true);

      // Usamos el ID real para el backend
      await axios.patch(`${API_URL}/${currentSelectedTable.id}/`, {
        estado: false,
      });

      const mesaActiva = {
        id: currentSelectedTable.id,
        number: currentSelectedTable.number,
        capacity: currentSelectedTable.capacity,
        personas: numPersonas,
      };

      if (onNavigateToMenu) {
        onNavigateToMenu(mesaActiva); // Esto es lo que navega a /menu
      } else {
        sessionStorage.setItem("mesa_activa", JSON.stringify(mesaActiva));
        navigate("/menu");
      }
    } catch (error) {
      console.error("Error al ocupar:", error);
      setErrorMsg("No se pudo reservar la mesa. Intente nuevamente.");
      setLoading(false);
    }
  };

  // --- CONTINUAR PEDIDO ---
  const handleContinuarPedido = () => {
    // ... (Tu lógica de handleContinuarPedido se mantiene)
    if (currentSelectedTable) {
      const mesaActiva = {
        id: currentSelectedTable.id,
        number: currentSelectedTable.number,
        capacity: currentSelectedTable.capacity,
      };
      sessionStorage.setItem("mesa_activa", JSON.stringify(mesaActiva));
    }

    navigate("/orders", {
      state: {
        mesaId: currentSelectedTable?.id,
        numeroMesa: currentSelectedTable?.number,
      },
    });
  };

  // --- RENDERIZADO ---
  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
          <span className="text-5xl mb-4">🍽️</span>
          <div className="text-xl font-bold text-red-800 tracking-wider">
            Cargando Restaurante...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl border border-gray-200">
        <h1 className="text-3xl font-black mb-8 text-red-800 text-center tracking-tight border-b pb-4">
          MAPA DE MESAS
        </h1>

        {errorMsg && !currentSelectedTable && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
            role="alert"
          >
            <p>{errorMsg}</p>
          </div>
        )}

        {/* GRID RESPONSIVE */}
        <div className="grid gap-6 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 justify-items-center">
          {tables.map((table) => (
            <TableCell
              key={table.number}
              table={table}
              // 🔥 CORRECCIÓN 2: Comparamos ID con ID
              isSelected={selectedTableId === table.id}
              onSelect={handleSelect} // Usa la función de TOGGLE del padre
              ocupacion={0} // Asumimos 0 si no se proporciona
            />
          ))}
        </div>

        {/* --- PANEL DE ACCIÓN --- */}
        {currentSelectedTable && (
          <div className="mt-8 pt-6 border-t border-gray-100 animate-fade-in-up">
            {/* CASO 1: MESA LIBRE */}
            {currentSelectedTable.status === "libre" ? (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-inner">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-green-800">
                      Mesa {currentSelectedTable.number} Disponible
                    </h3>
                    <p className="text-green-600 text-sm">
                      Capacidad: {currentSelectedTable.capacity} personas
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="num-personas"
                      className="font-bold text-gray-700"
                    >
                      Comensales:
                    </label>
                    <input
                      id="num-personas"
                      type="number"
                      value={numPersonas}
                      onChange={handlePersonasChange}
                      className={`border-2 rounded-lg p-2 w-20 text-center text-lg font-bold outline-none focus:ring-2 transition-colors
                        ${
                          errorMsg
                            ? "border-red-500 focus:ring-red-200 bg-red-50"
                            : "border-gray-300 focus:ring-blue-400 focus:border-blue-500"
                        }
                      `}
                      placeholder="#"
                      min="1"
                      max={currentSelectedTable.capacity} // Agregado el max para mejor UX
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="mt-2 text-red-600 font-bold text-sm text-center sm:text-right animate-pulse">
                    ⚠️ {errorMsg}
                  </p>
                )}

                {/* Contenedor de botones de acción para MESA LIBRE */}
                <div className="flex gap-4 mt-4">
                  {/* Botón 1: Confirmar Mesa (Apartar) */}
                  <button
                    onClick={handleApartar}
                    disabled={!numPersonas || !!errorMsg}
                    className={`w-full py-3 px-6 text-white font-extrabold text-lg rounded-xl shadow-lg transition-all transform
                      ${
                        !numPersonas || !!errorMsg
                          ? "bg-gray-400 cursor-not-allowed grayscale"
                          : "bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 shadow-blue-500/30"
                      }
                    `}
                  >
                    Confirmar Mesa ➡️
                  </button>

                  {/* 🔥 Botón 2: CANCELAR (Inferior) */}
                  <button
                    onClick={() => onCancelAction()}
                    className="py-3 px-6 bg-gray-500 text-white font-bold rounded-xl shadow-lg hover:bg-gray-600 transition transform active:scale-95 flex-shrink-0"
                    aria-label="Cancelar selección de mesa"
                  >
                    🗑️ Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* CASO 2: MESA OCUPADA */
              <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-inner text-center">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-red-800 flex items-center justify-center gap-2">
                    🚫 Mesa {currentSelectedTable.number} Ocupada
                  </h3>
                  <p className="text-red-600 text-sm mt-1">
                    Hay una orden activa en esta mesa.
                  </p>
                </div>

                {/* Contenedor de botones de acción para MESA OCUPADA */}
                <div className="flex gap-4 justify-center">
                  {/* Botón 1: Ver / Editar Pedido */}
                  <button
                    onClick={handleContinuarPedido}
                    className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-500/30 active:scale-95"
                  >
                    Ver / Editar Pedido 📝
                  </button>

                  {/* 🔥 Botón 2: CANCELAR (Inferior) */}
                  <button
                    onClick={() => onCancelAction()}
                    className="w-full sm:w-auto px-8 py-3 bg-gray-500 text-white font-bold rounded-xl shadow-lg hover:bg-gray-600 transition active:scale-95 flex-shrink-0"
                    aria-label="Cancelar selección de mesa"
                  >
                    🗑️ Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TablesGrid;

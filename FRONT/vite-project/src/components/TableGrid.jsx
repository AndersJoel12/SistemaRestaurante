import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TableCell from "./TableCell";
// import ArrowFluctuation from "./ArrowFluctuation"; // Descomenta si lo usas

// 1. CONFIGURACIÓN PROFESIONAL
// Usamos variables de entorno. Si no existe, usa localhost por defecto.
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

const TablesGrid = ({ onNavigateToMenu }) => {
  const navigate = useNavigate();

  // Estados
  const [tables, setTables] = useState([]);
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  
  // UX: Permitimos string vacío para facilitar el borrado
  const [numPersonas, setNumPersonas] = useState(""); 
  const [loading, setLoading] = useState(true);
  
  // UX: Estado para mostrar errores al usuario (no solo en consola)
  const [errorMsg, setErrorMsg] = useState(""); 

  const currentSelectedTable =
    tables.find((t) => t.id === selectedTableId) || null; // --- CARGAR MESAS ---

  useEffect(() => {
    const fetchMesas = async () => {
      try {
        const response = await axios.get(`${API_URL}/`);
        // Ordenamos por número para que aparezcan 1, 2, 3...
        const transformedTables = transformData(response.data).sort((a, b) => a.number - b.number);
        setTables(transformedTables);
      } catch (error) {
        console.error("🔴 Error cargando mesas:", error);
        setErrorMsg("Error de conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };
    fetchMesas();
  }, []); // --- MANEJAR SELECCIÓN (Llama al toggle en TablesView) ---

  // --- MANEJAR SELECCIÓN ---
  const handleSelect = (table) => {
    setSelectedTableNumber(table.number);
    setNumPersonas(""); // Reiniciar input
    setErrorMsg("");    // Limpiar errores previos
  };

  // --- VALIDACIÓN DE INPUT EN TIEMPO REAL ---
  const handlePersonasChange = (e) => {
    const value = e.target.value;
    setErrorMsg(""); // Limpiamos error al escribir

    // Si está vacío, lo permitimos (para poder borrar)
    if (value === "") {
      setNumPersonas("");
      return;
    }

    const num = parseInt(value, 10);

    // Validación defensiva
    if (isNaN(num)) return;

    if (currentSelectedTable && num > currentSelectedTable.capacity) {
      setErrorMsg(`¡La mesa solo tiene ${currentSelectedTable.capacity} sillas!`);
      // Aún así permitimos escribirlo visualmente o lo bloqueamos según prefieras. 
      // Aquí lo permito pero muestro error y bloquearé el botón.
    }
    
    setNumPersonas(num);
  };

  // --- APARTAR MESA LIBRE ---
  const handleApartar = async () => {
    if (!currentSelectedTable || !numPersonas) return;

    // Validación final antes de enviar
    if (numPersonas > currentSelectedTable.capacity) {
        setErrorMsg("Excede la capacidad máxima.");
        return;
    }

    try {
      setLoading(true);

      // 1. Backend: Ocupar la mesa (PATCH)
      await axios.patch(`${API_URL}/${currentSelectedTable.id}/`, {
        estado: false, // Ocupada
      });

      // 2. Frontend: Preparar objeto
      const mesaActiva = {
        id: currentSelectedTable.id,
        number: currentSelectedTable.number,
        capacity: currentSelectedTable.capacity,
        personas: numPersonas,
      };

      // 3. Navegación
      if (onNavigateToMenu) {
        onNavigateToMenu(mesaActiva);
      } else {
        // Fallback robusto por si falta la prop
        sessionStorage.setItem("mesa_activa", JSON.stringify(mesaActiva));
        navigate("/menu"); 
      }
    } catch (error) {
      console.error("Error al ocupar:", error);
      setErrorMsg("No se pudo reservar la mesa. Intente nuevamente.");
      setLoading(false);
    }
  }; // --- CONTINUAR (SI LA MESA YA ESTABA OCUPADA) ---

  const handleContinuarPedido = () => {
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
  }; // --- RENDERIZADO ---

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
          <span className="text-5xl mb-4">🍽️</span>
          <div className="text-xl font-bold text-red-800 tracking-wider">
            Cargando Restaurante...
          </div>
                 {" "}
        </div>
             {" "}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl border border-gray-200">
        <h1 className="text-3xl font-black mb-8 text-red-800 text-center tracking-tight border-b pb-4">
          MAPA DE MESAS
        </h1>

        {/* FEEDBACK DE ERROR GENERAL (ej: fallo de conexión) */}
        {errorMsg && !currentSelectedTable && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
                <p>{errorMsg}</p>
            </div>
        )}

        {/* GRID RESPONSIVE */}
        <div className="grid gap-6 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 justify-items-center">
          {tables.map((table) => (
            <TableCell
              key={table.number}
              table={table}
              isSelected={selectedTableId === table.id}
              onSelect={handleSelect}
            />
          ))}
                 {" "}
        </div>

        {/* --- PANEL DE ACCIÓN (Aparece al seleccionar) --- */}
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
                    <label htmlFor="num-personas" className="font-bold text-gray-700">
                      Comensales:
                    </label>
                    <input
                      id="num-personas"
                      type="number"
                      value={numPersonas}
                      onChange={handlePersonasChange}
                      className={`border-2 rounded-lg p-2 w-20 text-center text-lg font-bold outline-none focus:ring-2 transition-colors
                        ${errorMsg ? "border-red-500 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:ring-blue-400 focus:border-blue-500"}
                      `}
                      placeholder="#"
                      min="1"
                    />
                  </div>
                </div>

                {/* MENSAJE DE ERROR ESPECÍFICO DE VALIDACIÓN */}
                {errorMsg && (
                    <p className="mt-2 text-red-600 font-bold text-sm text-center sm:text-right animate-pulse">
                        ⚠️ {errorMsg}
                    </p>
                )}

                <button
                  onClick={handleApartar}
                  // Deshabilitamos si no hay personas o si hay un error de validación
                  disabled={!numPersonas || !!errorMsg}
                  className={`w-full mt-4 py-3 px-6 text-white font-extrabold text-lg rounded-xl shadow-lg transition-all transform
                    ${(!numPersonas || !!errorMsg) 
                        ? "bg-gray-400 cursor-not-allowed grayscale" 
                        : "bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 shadow-blue-500/30"}
                  `}
                >
                  Confirmar Mesa ➡️
                </button>
              </div>

            ) : (
              /* CASO 2: MESA OCUPADA */
              <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-inner text-center">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-red-800 flex items-center justify-center gap-2">
                    🚫 Mesa {currentSelectedTable.number} Ocupada
                  </h3>
                  <p className="text-red-600 text-sm mt-1">Hay una orden activa en esta mesa.</p>
                </div>

                <button
                  onClick={handleContinuarPedido}
                  className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-500/30 active:scale-95"
                >
                  Ver / Editar Pedido 📝
                </button>
              </div>
            )}
          </div>
        )}
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default TablesGrid;

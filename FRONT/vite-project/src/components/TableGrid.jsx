import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import TableCell from "./TableCell";
import ArrowFluctuation from "./ArrowFluctuation";

// CONFIGURACIÓN
const API_URL = "http://localhost:8000/api/mesas";

// --- 1. CORRECCIÓN AQUÍ: INVERTIMOS LA LÓGICA DE LECTURA ---
const transformData = (apiMesas) => {
  return apiMesas.map((mesa) => ({
    id: mesa.id, 
    number: mesa.numero,
    capacity: mesa.capacidad,
    // ANTES: mesa.estado ? "ocupada" : "libre"
    // AHORA: Si estado es TRUE, es LIBRE. Si es FALSE, es OCUPADA.
    status: mesa.estado ? "libre" : "ocupada", 
  }));
};

const TablesGrid = () => {
  const navigate = useNavigate(); 

  // Estados
  const [tables, setTables] = useState([]);
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [numPersonas, setNumPersonas] = useState("");
  const [loading, setLoading] = useState(true);
  const [occupiedSelectedTable, setOccupiedSelectedTable] = useState(null);

  // --- CARGAR MESAS ---
  useEffect(() => {
    const fetchMesas = async () => {
      try {
        const response = await axios.get(`${API_URL}/`);
        const transformedTables = transformData(response.data);
        transformedTables.sort((a, b) => a.number - b.number);
        setTables(transformedTables);
      } catch (error) {
        console.error("🔴 Error cargando mesas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMesas();
  }, []);

  const currentSelectedTable = tables.find((t) => t.number === selectedTableNumber) || null;

  // --- MANEJAR SELECCIÓN ---
  const handleSelect = (table) => {
    setSelectedTableNumber(table.number);
    setNumPersonas(""); 

    if (table.status === "ocupada") {
      setOccupiedSelectedTable(table);
    } else {
      setOccupiedSelectedTable(null);
    }
  };

  useEffect(() => {
    if (occupiedSelectedTable) {
      sessionStorage.setItem("mesa_activa", JSON.stringify(occupiedSelectedTable));
    } else {
      sessionStorage.removeItem("mesa_activa");
    }
  }, [occupiedSelectedTable]);

  // --- 2. CORRECCIÓN AQUÍ: INVERTIMOS LA LÓGICA DE ESCRITURA ---
  const handleApartar = async () => {
    if (!currentSelectedTable || !numPersonas) return;

    try {
        setLoading(true);
        
        // Al apartar, la mesa deja de estar libre.
        // Si True era Libre, ahora enviamos FALSE (Ocupada).
        await axios.patch(`${API_URL}/${currentSelectedTable.id}/`, {
            estado: false 
        });

        // Navegar al Menú
        navigate("/menu", { 
            state: { 
                mesaId: currentSelectedTable.id,
                numeroMesa: currentSelectedTable.number,
                personas: numPersonas
            } 
        });

    } catch (error) {
        console.error("Error al ocupar mesa:", error);
        alert("Hubo un error al conectar con el servidor.");
        setLoading(false);
    }
  };

  // --- CONTINUAR (SI LA MESA YA ESTABA OCUPADA) ---
  const handleContinuarPedido = () => {
      if (!occupiedSelectedTable) return;
      
      navigate("/orders", { 
        state: { 
            mesaId: occupiedSelectedTable.id,
            numeroMesa: occupiedSelectedTable.number
        } 
    });
  };

  // --- RENDERIZADO ---
  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
            <span className="text-4xl mb-2">🍽️</span>
            <div className="text-xl font-bold text-red-800">Cargando Restaurante...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-sm md:max-w-xl lg:max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 text-red-800 text-center">
          MESAS
        </h1>

        <div className="grid gap-4 mx-auto grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4">
          {tables.map((table) => (
            <TableCell
              key={table.number}
              table={table}
              isSelected={selectedTableNumber === table.number}
              onSelect={handleSelect}
              ocupacion={0} 
            />
          ))}
        </div>

        {/* APARTAR MESA LIBRE */}
        {currentSelectedTable && currentSelectedTable.status === "libre" && (
          <div className="mt-6 flex flex-col gap-4 animate-fade-in-up">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-800 mb-2">Mesa {currentSelectedTable.number} Disponible</h3>
                <div className="flex items-center gap-2 justify-between">
                <label className="font-semibold text-gray-700 text-sm">
                    Personas:
                </label>
                <input
                    type="number"
                    value={numPersonas}
                    onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value <= currentSelectedTable.capacity) {
                        setNumPersonas(value);
                    } else if (!isNaN(value)) {
                        alert(`La mesa solo tiene ${currentSelectedTable.capacity} sillas`);
                    }
                    }}
                    className="border rounded-lg p-2 w-20 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    min="1"
                    max={currentSelectedTable.capacity}
                    placeholder="1"
                />
                </div>
            </div>

            <button
              onClick={handleApartar}
              className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg transform active:scale-95"
            >
              Apartar e Ir al Menú ➡️
            </button>
          </div>
        )}

        {/* VER MESA OCUPADA */}
        {occupiedSelectedTable && (
            <div className="mt-6 animate-fade-in-up">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center mb-4">
                    <p className="text-red-800 font-bold">Mesa {occupiedSelectedTable.number} Ocupada</p>
                    <p className="text-xs text-red-600">Pedido en curso...</p>
                </div>
                
                <ArrowFluctuation mesa={occupiedSelectedTable.number} />

                <button
                    onClick={handleContinuarPedido}
                    className="w-full mt-4 py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg"
                >
                    Ver Pedido / Agregar Items 📝
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TablesGrid;
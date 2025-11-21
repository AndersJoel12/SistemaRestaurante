import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TableCell from "./TableCell";
import ArrowFluctuation from "./ArrowFluctuation";

// CONFIGURACIÓN
const API_URL = "http://localhost:8000/api/mesas";

// Función de transformación de datos de la API
const transformData = (apiMesas) => {
  return apiMesas.map((mesa) => ({
    id: mesa.id,
    number: mesa.numero,
    capacity: mesa.capacidad,
    // Se mantiene la lógica de inversión (Si estado es TRUE, es LIBRE)
    status: mesa.estado ? "libre" : "ocupada",
    // Añadimos el estado crudo por si se necesita más adelante
    rawState: mesa.estado,
  }));
};

// AHORA ACEPTA PROPS para usar la función del componente padre (TablesView)
const TablesGrid = ({ onNavigateToMenu }) => {
  const navigate = useNavigate();

  // Estados
  const [tables, setTables] = useState([]);
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [numPersonas, setNumPersonas] = useState("");
  const [loading, setLoading] = useState(true);

  // Usamos el objeto de la mesa seleccionada, independientemente de su estado
  const currentSelectedTable =
    tables.find((t) => t.number === selectedTableNumber) || null;

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

  // --- MANEJAR SELECCIÓN (Solo actualiza el estado local) ---
  const handleSelect = (table) => {
    setSelectedTableNumber(table.number);
    setNumPersonas("");
  };

  // --- APARTAR MESA LIBRE (Lógica de Navegación Corregida) ---
  const handleApartar = async () => {
    if (!currentSelectedTable || !numPersonas) {
      console.error("Faltan datos para apartar la mesa.");
      return;
    }

    try {
      setLoading(true);

      // 1. Ocupar la mesa en el backend (estado: false)
      await axios.patch(`${API_URL}/${currentSelectedTable.id}/`, {
        estado: false,
      });

      // 2. Crear el objeto de mesa activa que espera TablesView
      const mesaActiva = {
        id: currentSelectedTable.id,
        number: currentSelectedTable.number,
        capacity: currentSelectedTable.capacity,
        personas: numPersonas, // Datos adicionales útiles
      };

      // 3. LLAMAR AL PROP: TablesView se encarga de guardar la mesa en sessionStorage y navegar a /menu.
      if (onNavigateToMenu) {
        onNavigateToMenu(mesaActiva);
      } else {
        // Fallback si por alguna razón no se pasó la función
        console.error(
          "Error: onNavigateToMenu no está definida. No se puede guardar la mesa."
        );
      }
    } catch (error) {
      console.error(
        "Error al ocupar mesa:",
        error.response?.data || error.message
      );
      // Usar Notificación en lugar de alert()
      console.warn(
        "Hubo un error al conectar con el servidor o al ocupar la mesa."
      );
      setLoading(false);
    }
  };

  // --- CONTINUAR (SI LA MESA YA ESTABA OCUPADA) ---
  const handleContinuarPedido = () => {
    // Si la mesa estaba ocupada, asumimos que el mesero quiere ver el pedido existente.
    // 1. Guardar la mesa en sesión antes de navegar (para que Menu o Orders la detecten)
    if (currentSelectedTable) {
      // La estructura de la mesa ocupada es la misma que espera TablesView
      const mesaActiva = {
        id: currentSelectedTable.id,
        number: currentSelectedTable.number,
        capacity: currentSelectedTable.capacity,
      };
      sessionStorage.setItem("mesa_activa", JSON.stringify(mesaActiva));
    }

    // 2. Navegar a /orders
    navigate("/orders", {
      state: {
        mesaId: currentSelectedTable.id,
        numeroMesa: currentSelectedTable.number,
      },
    });
  };

  // --- RENDERIZADO ---
  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
          <span className="text-4xl mb-2">🍽️</span>
          <div className="text-xl font-bold text-red-800">
            Cargando Restaurante...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-sm md:max-w-xl lg:max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 text-red-800 text-center">
          SELECCIÓN DE MESAS
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
              <h3 className="font-bold text-green-800 mb-2">
                Mesa {currentSelectedTable.number} Disponible
              </h3>
              <div className="flex items-center gap-2 justify-between">
                <label className="font-semibold text-gray-700 text-sm">
                  Personas:
                </label>
                <input
                  type="number"
                  value={numPersonas}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    // Sustituir alert()
                    if (
                      !isNaN(value) &&
                      value <= currentSelectedTable.capacity
                    ) {
                      setNumPersonas(value);
                    } else if (!isNaN(value)) {
                      console.warn(
                        `La mesa solo tiene ${currentSelectedTable.capacity} sillas`
                      );
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
              disabled={!numPersonas}
            >
              Apartar e Ir al Menú ➡️
            </button>
          </div>
        )}

        {/* VER MESA OCUPADA */}
        {currentSelectedTable && currentSelectedTable.status === "ocupada" && (
          <div className="mt-6 animate-fade-in-up">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center mb-4">
              <p className="text-red-800 font-bold">
                Mesa {currentSelectedTable.number} Ocupada
              </p>
              <p className="text-xs text-red-600">Pedido en curso...</p>
            </div>

            {/* Asumiendo que ArrowFluctuation acepta el prop number */}
            {/* <ArrowFluctuation mesa={currentSelectedTable.number} /> */}

            <button
              onClick={handleContinuarPedido}
              className="disabled:cursor-not-allowed w-full mt-4 py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg"
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

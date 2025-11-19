import React, { useState, useEffect } from "react";
import TableCell from "./TableCell";
import ArrowFluctuation from "./ArrowFluctuation";

// Definimos el tamaño máximo de la cuadrícula para pantallas grandes (se mantiene como referencia, pero se usa más Tailwind)
const GRID_SIZE = 4;
// URL de la API
const API_URL = "http://localhost:8000/api/mesas";

// Función para transformar los datos de la API
// API: { id: 1, numero: 1, capacidad: 4, ubicacion: "...", estado: true/false }
// Componente: { number: 1, capacity: 4, status: "libre"/"ocupada"/"deshabilitada" }
const transformData = (apiMesas) => {
  return apiMesas.map((mesa) => ({
    number: mesa.numero,
    capacity: mesa.capacidad,
    // TRUE en la API significa libre/disponible (asumimos por el contexto de 'apartar')
    // Aunque 'estado: true' en el modelo de BD a menudo significa 'activo',
    // para un sistema de mesas, 'estado: true' en la tabla 'mesas' a menudo significa 'disponible/libre'
    // y un segundo campo (como 'ocupada_por_pedido_id') indica la ocupación.
    // ASUMIMOS: estado: true = 'libre', estado: false = 'ocupada'.
    // Si la lógica es al revés, solo invierte la condición.
    // Además, la mesa 7 y 12 están 'deshabilitada' en tu mock, pero la API no tiene ese campo.
    // Por simplicidad, solo usaremos 'libre' y 'ocupada'.
    status: mesa.estado ? "libre" : "ocupada", 
  }));
};

const TablesGrid = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  // Inicializamos tables como un array vacío, se llenará con los datos de la API
  const [tables, setTables] = useState([]); 
  const [numPersonas, setNumPersonas] = useState("");
  const [ocupacionMesas, setOcupacionMesas] = useState({});
  const [loading, setLoading] = useState(true); // Nuevo estado para la carga

  const [occupiedSelectedTable, setOccupiedSelectedTable] = useState(null);

  // --- NUEVA LÓGICA DE CARGA DE DATOS ---
  useEffect(() => {
    const fetchMesas = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        // Transformar y establecer los datos
        const transformedTables = transformData(data);
        setTables(transformedTables);
        setLoading(false); // La carga ha terminado
      } catch (error) {
        console.error("Error al obtener las mesas de la API:", error);
        // Si hay error, puedes dejar las tablas vacías o usar un mock de fallback
        setTables([]); 
        setLoading(false); 
      }
    };

    fetchMesas();
  }, []);
  // ----------------------------------------

  const currentSelectedTable =
    tables.find((t) => t.number === selectedTable) || null;

  const handleSelect = (table) => {
    setSelectedTable(table.number);
    setNumPersonas("");

    if (table.status === "ocupada") {
      setOccupiedSelectedTable(table);
    } else {
      setOccupiedSelectedTable(null);
    }
  };

  useEffect(() => {
    if (occupiedSelectedTable) {
      sessionStorage.setItem(
        "mesa_activa",
        JSON.stringify(occupiedSelectedTable)
      );
    } else {
      sessionStorage.removeItem("mesa_activa");
    }
  }, [occupiedSelectedTable]);

  // Esta función `handleApartar` **debería** llamar a un endpoint de la API
  // para cambiar el estado de la mesa a 'ocupada'.
  // Por ahora, solo mantendremos la lógica local tal como estaba en tu código original,
  // pero la **recomendación** es agregar aquí una llamada `fetch` (POST/PUT) a la API.
  const handleApartar = () => {
    if (!currentSelectedTable || !numPersonas) return;

    // Lógica local para simular la ocupación (debería ir la llamada a la API)
    setOcupacionMesas({
      ...ocupacionMesas,
      [currentSelectedTable.number]: numPersonas,
    });

    const updatedTables = tables.map((t) =>
      t.number === currentSelectedTable.number ? { ...t, status: "ocupada" } : t
    );
    setTables(updatedTables);

    const nuevaMesa = { ...currentSelectedTable, status: "ocupada" };
    setOccupiedSelectedTable(nuevaMesa);

    alert(
      `Mesa ${currentSelectedTable.number} apartada para ${numPersonas} personas (LOCALMENTE).`
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-xl font-bold text-red-800">Cargando Mesas...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-sm md:max-w-xl lg:max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 text-red-800 text-center">
          MESAS
        </h1>

        <div
          className="grid gap-4 mx-auto grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4"
        >
          {tables.map((table) => (
            <TableCell
              key={table.number}
              table={table}
              isSelected={selectedTable === table.number}
              onSelect={handleSelect}
              ocupacion={ocupacionMesas[table.number] || 0}
            />
          ))}
        </div>

        {currentSelectedTable && currentSelectedTable.status === "libre" && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-gray-700">
                ¿Cuántas personas son?
              </label>
              <input
                type="number"
                value={numPersonas}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value <= currentSelectedTable.capacity) {
                    setNumPersonas(value);
                  } else if (!isNaN(value)) {
                    alert(
                      `La mesa solo tiene ${currentSelectedTable.capacity} sillas`
                    );
                  }
                }}
                className="border rounded-lg p-2 w-20 text-center"
                min="1"
                max={currentSelectedTable.capacity}
              />
            </div>

            <button
              onClick={handleApartar}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Apartar
            </button>
          </div>
        )}
      </div>

      {occupiedSelectedTable && (
        <ArrowFluctuation mesa={occupiedSelectedTable.number} />
      )}
    </div>
  );
};

export default TablesGrid;
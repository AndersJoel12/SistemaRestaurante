// src/components/TablesGrid.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TableCell from "./TableCell";
import ArrowFluctuation from "./ArrowFluctuation";

const GRID_SIZE = 4;

const INITIAL_TABLES_DATA = [
  { number: 1, capacity: 4, status: "libre" },
  { number: 2, capacity: 8, status: "libre" },
  { number: 3, capacity: 9, status: "libre" },
  { number: 4, capacity: 6, status: "libre" },
  { number: 5, capacity: 4, status: "ocupada" },
  { number: 6, capacity: 8, status: "libre" },
  { number: 7, capacity: 6, status: "deshabilitada" },
  { number: 8, capacity: 4, status: "libre" },
  { number: 9, capacity: 4, status: "libre" },
  { number: 10, capacity: 8, status: "libre" },
  { number: 11, capacity: 6, status: "ocupada" },
  { number: 12, capacity: 4, status: "deshabilitada" },
  { number: 13, capacity: 4, status: "libre" },
  { number: 14, capacity: 6, status: "ocupada" },
  { number: 15, capacity: 6, status: "libre" },
  { number: 16, capacity: 4, status: "libre" },
];

const TablesGrid = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState(INITIAL_TABLES_DATA);
  const [numPersonas, setNumPersonas] = useState("");
  const [ocupacionMesas, setOcupacionMesas] = useState({});

  // 👇 Nueva: mesa ocupada actualmente seleccionada
  const [occupiedSelectedTable, setOccupiedSelectedTable] = useState(null);

  const navigate = useNavigate();

  const currentSelectedTable =
    tables.find((t) => t.number === selectedTable) || null;

  const handleSelect = (table) => {
    setSelectedTable(table.number);
    setNumPersonas("");

    if (table.status === "ocupada") {
      // Actualiza la mesa ocupada seleccionada SIEMPRE al hacer click
      setOccupiedSelectedTable(table);
    } else {
      // Si la mesa no está ocupada, limpiamos la referencia
      setOccupiedSelectedTable(null);
    }
  };

  // Mantener sessionStorage sincronizado con la mesa ocupada seleccionada
  useEffect(() => {
    if (occupiedSelectedTable) {
      sessionStorage.setItem(
        "mesa_activa",
        JSON.stringify(occupiedSelectedTable)
      );
    } else {
      // Opcional: si no quieres que quede la anterior al seleccionar una libre,
      // limpia el storage:
      sessionStorage.removeItem("mesa_activa");
    }
  }, [occupiedSelectedTable]);

  const handleApartar = () => {
    if (!currentSelectedTable || !numPersonas) return;

    setOcupacionMesas({
      ...ocupacionMesas,
      [currentSelectedTable.number]: numPersonas,
    });

    const updatedTables = tables.map((t) =>
      t.number === currentSelectedTable.number ? { ...t, status: "ocupada" } : t
    );
    setTables(updatedTables);

    // Al apartar, esta mesa pasa a ser la ocupada seleccionada
    const nuevaMesa = { ...currentSelectedTable, status: "ocupada" };
    setOccupiedSelectedTable(nuevaMesa);

    alert(
      `Mesa ${currentSelectedTable.number} apartada para ${numPersonas} personas`
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center justify-center relative">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
        <h1 className="text-3xl font-extrabold mb-4 text-red-800 text-center">
          CROQUIS DE MESAS (GRID)
        </h1>

        <div
          className="grid gap-4 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(80px, 1fr))`,
          }}
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
                className="border rounded-lg p-2 w-24 text-center"
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

      {/* Usamos ArrowFluctuation con la mesa ocupada seleccionada, no con la anterior */}
      {occupiedSelectedTable && (
        <ArrowFluctuation mesa={occupiedSelectedTable.number} />
      )}
    </div>
  );
};

export default TablesGrid;

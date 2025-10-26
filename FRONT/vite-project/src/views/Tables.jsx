import React, { useState } from "react";

const GRID_SIZE = 4;

const Tables = ({ onSelect }) => {
    const [selectedTable, setSelectedTable] = useState(null);

    const [tables, setTables] = useState(
        Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        return {
            number: i + 1,
            row,
            col,
            status:
            i === 5 || i === 12
                ? "deshabilitada"
                : i === 7
                ? "ocupada"
                : "libre",
        };
        })
    );

    const handleSelect = (table) => {
        if (table.status === "deshabilitada" || table.status === "ocupada") return;
        setSelectedTable(table.number);
        if (onSelect) onSelect(table.number);
    };

    const renderCell = (table) => {
        const isSelected = selectedTable === table.number;

        let bgColor = "bg-white hover:bg-yellow-100";
        if (table.status === "ocupada") bgColor = "bg-red-300 cursor-not-allowed";
        if (table.status === "deshabilitada") bgColor = "bg-gray-300 cursor-not-allowed";
        if (isSelected) bgColor = "bg-green-500 text-white";

        return (
        <div
            key={table.number}
            onClick={() => handleSelect(table)}
            className={`flex items-center justify-center border rounded text-sm font-bold h-16 w-24 ${bgColor}`}
        >
            Mesa {table.number}
        </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        {/* Encabezado */}
        <h1 className="text-2xl font-bold mb-4 text-red-700">Mapa de Mesas</h1>

        {/* Recibidor al norte */}
        <div className="mb-2 text-center text-sm text-gray-600 font-medium">
            🧍‍♂️ Recibidor
        </div>

        {/* Grilla de mesas */}
        <div
            className="grid gap-2 mb-2"
            style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(60px, 1fr))`,
            }}
        >
            {tables.map((table) => renderCell(table))}
        </div>

        {/* Entrada al sur */}
        <div className="mt-2 text-center text-sm text-gray-600 font-medium">
            🡇 Entrada principal
        </div>

        {/* Mesa seleccionada */}
        {selectedTable && (
            <div className="mt-4 text-lg font-semibold text-green-700">
            Mesa seleccionada: {selectedTable}
            </div>
        )}
        </div>
    );
};

export default Tables;

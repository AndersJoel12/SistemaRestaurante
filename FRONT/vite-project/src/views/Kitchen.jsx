import React, { useState } from 'react';

const Kitchen = () => {
    const [kanbanData, setKanbanData] = useState({
        recibido: ['Tarea 1', 'Tarea 2'],
        enProceso: ['Tarea 3'],
        finalizado: ['Tarea 4'],
    });

    const moverTarea = (estadoActual, index, nuevoEstado) => {
        const tarea = kanbanData[estadoActual][index];

        setKanbanData(prev => {
        const nuevo = { ...prev };
        nuevo[estadoActual] = nuevo[estadoActual].filter((_, i) => i !== index);
        nuevo[nuevoEstado] = [...nuevo[nuevoEstado], tarea];
        return nuevo;
        });
    };

    const renderBotones = (estado, index) => {
        const botones = [];

        if (estado !== 'recibido') {
        botones.push(
            <button
            key="recibido"
            onClick={() => moverTarea(estado, index, 'recibido')}
            className="text-xs bg-blue-200 px-2 py-1 rounded mr-1"
            >
            ← Recibido
            </button>
        );
        }

        if (estado !== 'enProceso') {
        botones.push(
            <button
            key="enProceso"
            onClick={() => moverTarea(estado, index, 'enProceso')}
            className="text-xs bg-yellow-200 px-2 py-1 rounded mr-1"
            >
            → En Proceso
            </button>
        );
        }

        if (estado !== 'finalizado') {
        botones.push(
            <button
            key="finalizado"
            onClick={() => moverTarea(estado, index, 'finalizado')}
            className="text-xs bg-green-200 px-2 py-1 rounded"
            >
            ✔ Finalizado
            </button>
        );
        }

        return <div className="mt-2">{botones}</div>;
    };

    return (
        <div className="flex gap-4 p-4 bg-gray-100 min-h-screen">
        {Object.entries(kanbanData).map(([estado, tareas]) => (
            <div key={estado} className="flex-1 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-bold mb-4 capitalize">{estado}</h2>
            <div className="space-y-2">
                {tareas.map((tarea, index) => (
                <div
                    key={index}
                    className="p-3 bg-yellow-100 border border-yellow-400 rounded-md text-gray-800"
                >
                    <div>{tarea}</div>
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
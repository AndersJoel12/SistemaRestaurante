import React, { useState } from 'react';

const Kitchen = () => {
    const [kanbanData, setKanbanData] = useState({
        Recibido: ['Tarea 1', 'Tarea 2'],
        Pendiente: ['Tarea 3'],
        Finalizado: ['Tarea 4'],
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

        if (estado !== 'Recibido') {
        botones.push(
            <button
            key="Recibido"
            onClick={() => moverTarea(estado, index, 'Recibido')}
            className="text-xs bg-blue-200 px-2 py-1 rounded mr-1"
            >
            ← Recibido
            </button>
        );
        }

        if (estado !== 'Pendiente') {
        botones.push(
            <button
            key="Pendiente"
            onClick={() => moverTarea(estado, index, 'Pendiente')}
            className="text-xs bg-yellow-200 px-2 py-1 rounded mr-1"
            >
            → En Proceso
            </button>
        );
        }

        if (estado !== 'Finalizado') {
        botones.push(
            <button
            key="Finalizado"
            onClick={() => moverTarea(estado, index, 'Finalizado')}
            className="text-xs bg-green-200 px-2 py-1 rounded"
            >
            ✔ Finalizado
            </button>
        );
        }

        return <div className="mt-2">{botones}</div>;
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-100 min-h-screen">
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
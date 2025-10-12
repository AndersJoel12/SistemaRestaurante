import React, { useState } from 'react';

const Kitchen = ({ ordersList }) => {
    const estadosOrdenados = ['Recibido', 'Pendiente', 'Finalizado'];

    const [kanbanData, setKanbanData] = useState({
        Recibido: [],
        Pendiente: [],
        Finalizado: [],
    });

  /*   useEffect(() => {
    // Convertir órdenes enviadas en tareas "Recibido"
    const tareasRecibidas = ordersList.map(order => `Orden #${order.id}`);
    setKanbanData(prev => ({
        ...prev,
        Recibido: tareasRecibidas,
    }));
    }, [ordersList]); */

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
        const posicion = estadosOrdenados.indexOf(estado);

        // Botón para mover al estado anterior (si existe)
        if (posicion > 0) {
        const anterior = estadosOrdenados[posicion - 1];
        botones.push(
            <button
            key={anterior}
            onClick={() => moverTarea(estado, index, anterior)}
            className="text-xs bg-blue-200 px-2 py-1 rounded mr-1"
            >
            ← {anterior}
            </button>
        );
        }

        // Botón para mover al estado siguiente (si existe)
        if (posicion < estadosOrdenados.length - 1) {
        const siguiente = estadosOrdenados[posicion + 1];
        botones.push(
            <button
            key={siguiente}
            onClick={() => moverTarea(estado, index, siguiente)}
            className="text-xs bg-green-200 px-2 py-1 rounded"
            >
            → {siguiente}
            </button>
        );
        }

        return <div className="mt-2">{botones}</div>;
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-100 min-h-screen">
        {estadosOrdenados.map(estado => (
            <div key={estado} className="flex-1 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-bold mb-4 capitalize">{estado}</h2>
            <div className="space-y-2">
                {kanbanData[estado].map((tarea, index) => (
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

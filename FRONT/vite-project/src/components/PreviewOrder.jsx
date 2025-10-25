/* import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PreviewOrder = () => {
const navigate = useNavigate();
const location = useLocation();

// Lee la orden enviada desde Menu por estado de navegación
const activeOrder = location.state?.activeOrder || [];
const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);
const subtotal = activeOrder
    .reduce(
    (sum, i) =>
        sum + (typeof i.price === "number" ? i.price : 0) * (i.quantity || 0),
    0
    )
    .toFixed(2);

const handleBack = () => {
    navigate("/menu");
};

const handleConfirm = () => {
    if (totalItems === 0) return alert("La orden está vacía.");

    const newOrder = {
    id: Date.now(),
    items: activeOrder,
    subtotal,
    status: "Recibido",
    timestamp: new Date().toLocaleTimeString(),
    };

    // Navega a Kitchen pasando la orden confirmada por estado de navegación
    navigate("/kitchen", { state: { newOrder } });
};

return (
    <div className="p-4 bg-white min-h-screen flex flex-col">
    <button
        onClick={handleBack}
        className="mb-4 text-sm text-blue-600 hover:underline"
    >
        ← Volver al menú
    </button>

    <h2 className="text-2xl font-extrabold text-red-700 mb-4">
        📋 Revisión de Orden ({totalItems} plato{totalItems !== 1 ? "s" : ""})
    </h2>

    <div className="flex-1 overflow-y-auto space-y-3">
        {totalItems === 0 ? (
        <p className="text-gray-500 italic">
            La orden está vacía. Regresa al menú para añadir platos.
        </p>
        ) : (
        activeOrder.map((item) => (
            <div
            key={item.id}
            className="flex justify-between items-center bg-gray-50 p-3 rounded shadow-sm"
            >
            <span className="font-medium text-gray-900">
                {item.quantity}x {item.name}
            </span>
            <span className="font-extrabold text-red-700">
                ${(item.price * item.quantity).toFixed(2)}
            </span>
            </div>
        ))
        )}
    </div>

    <div className="mt-4 pt-4 pb-20 border-t border-gray-300">
        <div className="flex justify-between font-bold text-xl mb-4">
        <span>SUBTOTAL:</span>
        <span className="text-red-700">${subtotal}</span>
        </div>

        <button
        onClick={handleConfirm}
        disabled={totalItems === 0}
        className={`w-full py-3 font-bold text-white rounded ${
            totalItems > 0
            ? "bg-red-700 hover:bg-red-600"
            : "bg-gray-400 cursor-not-allowed"
        }`}
        >
        ENVIAR ORDEN A COCINA
        </button>
    </div>
    </div>
);
}; */



import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PreviewOrder({ activeOrder }) {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const totalItems = activeOrder.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const subtotal = activeOrder
        .reduce(
        (sum, i) =>
            sum + (typeof i.price === 'number' ? i.price : 0) * (i.quantity || 0),
        0
        )
        .toFixed(2);

    const handleConfirm = () => {
        if (totalItems === 0) return alert('La orden está vacía.');

        const newOrder = {
            id: Date.now(),
            items: activeOrder,
            subtotal,
            status: 'Recibido',
            timestamp: new Date().toLocaleTimeString(),
        };

        try {
            const saved = sessionStorage.getItem('kitchen_kanban');
            const parsed = saved ? JSON.parse(saved) : {
            Recibido: [],
            Pendiente: [],
            Finalizado: [],
            };

            const all = [...parsed.Recibido, ...parsed.Pendiente, ...parsed.Finalizado];
            const exists = all.some((o) => o.id === newOrder.id);
            if (exists) {
            alert('Esta orden ya fue enviada.');
            return;
            }

            const updated = {
            ...parsed,
            Recibido: [newOrder, ...parsed.Recibido],
            };

            sessionStorage.setItem('kitchen_kanban', JSON.stringify(updated));
            alert('¡Orden enviada a cocina!');
            setShowModal(false);
        } catch (e) {
            console.error('Error al guardar la orden:', e);
            alert('No se pudo enviar la orden.');
        }
    };


    return (
        <>
        <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-red-600 text-white text-2xl font-bold shadow-lg border border-black hover:scale-105 hover:from-yellow-600 hover:to-red-700 transition-transform duration-300 ease-in-out cursor-pointer"
        >
        🛒
        </button>
        
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md relative">
                {/* <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                ✖
                </button> */}

                <h2 className="text-xl font-extrabold text-red-700 mb-4">
                📋 Revisión de Orden ({totalItems} plato{totalItems !== 1 ? 's' : ''})
                </h2>

                <div className="max-h-64 overflow-y-auto space-y-3">
                {totalItems === 0 ? (
                    <p className="text-gray-500 italic">
                    La orden está vacía. Regresa al menú para añadir platos.
                    </p>
                ) : (
                    activeOrder.map((item) => (
                    <div
                        key={item.id}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded shadow-sm"
                    >
                        <span className="font-medium text-gray-900">
                        {item.quantity}x {item.name}
                        </span>
                        <span className="font-extrabold text-red-700">
                        ${(item.price * item.quantity).toFixed(2)}
                        </span>
                    </div>
                    ))
                )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex justify-between font-bold text-xl mb-4">
                    <span>SUBTOTAL:</span>
                    <span className="text-red-700">${subtotal}</span>
                </div>

                <div className="flex gap-4">
                <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 font-bold text-white rounded bg-gray-600 hover:bg-gray-700 cursor-pointer"
                >
                    CERRAR
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={totalItems === 0}
                    className={`flex-1 py-3 font-bold text-white rounded cursor-pointer ${
                    totalItems > 0
                        ? 'bg-red-700 hover:bg-red-600'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                    ENVIAR ORDEN
                </button>
                </div>
                </div>

            </div>
            </div>
        )}
        </>
    );
}
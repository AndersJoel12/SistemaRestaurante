import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TableCell from "./TableCell";
import ArrowFluctuation from "./ArrowFluctuation"; // Asumimos que existe

// CONFIGURACIÓN
const API_URL = "http://localhost:8000/api/mesas";

// Función de transformación de datos de la API
const transformData = (apiMesas) => {
  return apiMesas.map((mesa) => ({
    id: mesa.id,
    number: mesa.numero,
    capacity: mesa.capacidad,
    status: mesa.estado ? "libre" : "ocupada",
    rawState: mesa.estado,
  }));
};

// Acepta los nuevos props, incluyendo onCancelAction
const TablesGrid = ({
  onNavigateToMenu,
  onTableSelect,
  selectedTableId,
  onCancelAction, // 🔥 Recibimos la función de Cancelar del padre
}) => {
  const navigate = useNavigate(); // Estados

  const [tables, setTables] = useState([]);
  const [numPersonas, setNumPersonas] = useState("");
  const [loading, setLoading] = useState(true); // CLAVE: Derivamos la mesa seleccionada del prop selectedTableId

  const currentSelectedTable =
    tables.find((t) => t.id === selectedTableId) || null; // --- CARGAR MESAS ---

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
  }, []); // --- MANEJAR SELECCIÓN (Llama al toggle en TablesView) ---

  const handleSelect = (table) => {
    onTableSelect(table); // Limpiamos el input de personas al seleccionar una nueva mesa
    if (!currentSelectedTable || currentSelectedTable.id !== table.id) {
      setNumPersonas("");
    }
  }; // --- APARTAR MESA LIBRE ---

  const handleApartar = async () => {
    if (
      !currentSelectedTable ||
      currentSelectedTable.status !== "libre" ||
      !numPersonas
    ) {
      console.error("Faltan datos para apartar la mesa.");
      return;
    }

    try {
      setLoading(true);
      await axios.patch(`${API_URL}/${currentSelectedTable.id}/`, {
        estado: false,
      });
      const mesaActiva = {
        id: currentSelectedTable.id,
        number: currentSelectedTable.number,
        capacity: currentSelectedTable.capacity,
        personas: numPersonas,
      };
      if (onNavigateToMenu) {
        onNavigateToMenu(mesaActiva);
      }
    } catch (error) {
      console.error(
        "Error al ocupar mesa:",
        error.response?.data || error.message
      );
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
        mesaId: currentSelectedTable.id,
        numeroMesa: currentSelectedTable.number,
      },
    });
  }; // --- RENDERIZADO ---

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex items-center justify-center">
               {" "}
        <div className="flex flex-col items-center animate-pulse">
                    <span className="text-4xl mb-2">🍽️</span>         {" "}
          <div className="text-xl font-bold text-red-800">
                        Cargando Restaurante...          {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col items-center justify-start">
           {" "}
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-sm md:max-w-xl lg:max-w-2xl">
               {" "}
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 text-red-800 text-center">
                    VISTA DE MESAS        {" "}
        </h1>
               {" "}
        <div className="grid gap-4 mx-auto grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4">
                   {" "}
          {tables.map((table) => (
            <TableCell
              key={table.number}
              table={table}
              isSelected={selectedTableId === table.id}
              onSelect={handleSelect}
              ocupacion={0}
            />
          ))}
                 {" "}
        </div>
                {/* BLOQUE DE ACCIÓN CONDICIONAL */}       
        {/* APARTAR MESA LIBRE (Mesa Seleccionada Y Libre) */}       {" "}
        {currentSelectedTable && currentSelectedTable.status === "libre" && (
          <div className="mt-6 flex flex-col gap-4 animate-fade-in-up">
                       {" "}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                           {" "}
              <h3 className="font-bold text-green-800 mb-2">
                                Mesa {currentSelectedTable.number} Disponible  
                           {" "}
              </h3>
                           {" "}
              <div className="flex items-center gap-2 justify-between">
                               {" "}
                <label className="font-semibold text-gray-700 text-sm">
                                    Personas:                {" "}
                </label>
                               {" "}
                <input
                  type="number"
                  value={numPersonas}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (
                      !isNaN(value) &&
                      value <= currentSelectedTable.capacity
                    ) {
                      setNumPersonas(value);
                    }
                  }}
                  className="border rounded-lg p-2 w-20 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  min="1"
                  max={currentSelectedTable.capacity}
                  placeholder="1"
                />
                             {" "}
              </div>
                         {" "}
            </div>
            {/* Contenedor de botones de acción */}
            <div className="flex gap-4">
              {/* Botón 1: Apartar e Ir al Menú */}
              <button
                onClick={handleApartar}
                className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg transform active:scale-95"
                disabled={!numPersonas}
              >
                Apartar e Ir al Menú ➡️
              </button>

              {/* 🔥 Botón 2: CANCELAR (Llama a la acción pasada por TablesView) */}
              <button
                onClick={onCancelAction}
                className="py-3 px-4 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition shadow-lg transform active:scale-95 flex-shrink-0"
                aria-label="Cancelar selección de mesa"
              >
                🗑️ Cancelar
              </button>
            </div>
                     {" "}
          </div>
        )}
                {/* VER MESA OCUPADA (Mesa Seleccionada Y Ocupada) */}       {" "}
        {currentSelectedTable && currentSelectedTable.status === "ocupada" && (
          <div className="mt-6 flex flex-col gap-4 animate-fade-in-up">
                       {" "}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center mb-4">
                           {" "}
              <p className="text-red-800 font-bold">
                                Mesa {currentSelectedTable.number} Ocupada      
                       {" "}
              </p>
                           {" "}
              <p className="text-xs text-red-600">Pedido en curso...</p>       
                 {" "}
            </div>
            {/* Contenedor de botones de acción para mesa ocupada */}
            <div className="flex gap-4">
              {/* Botón 1: Ver Pedido / Agregar Items */}
              <button
                onClick={handleContinuarPedido}
                className="disabled:cursor-not-allowed w-full py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg"
              >
                Ver Pedido / Agregar Items 📝
              </button>

              {/* 🔥 Botón 2: CANCELAR */}
              <button
                onClick={onCancelAction}
                className="py-3 px-4 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition shadow-lg flex-shrink-0"
                aria-label="Cancelar selección de mesa"
              >
                🗑️ Cancelar
              </button>
            </div>
                     {" "}
          </div>
        )}
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default TablesGrid;

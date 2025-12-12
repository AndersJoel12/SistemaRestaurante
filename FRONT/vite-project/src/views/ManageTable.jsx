import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
// Asegúrate de que estos componentes existan en tu proyecto
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import NavBar from "../components/Navigation.jsx";
import Header from "../components/Header.jsx";

// --- CONFIGURACIÓN ---
const API_URL = "http://localhost:8000/api/mesas";

const GestionMesas = () => {
  // --- ESTADOS ---
  const [message, setMessage] = useState(null);
  const [mesas, setMesas] = useState([]);
  const [editingItem, setEditingItem] = useState(null); // Controla el Modal
  const [loading, setLoading] = useState(false); // Filtros

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState(""); // --- 1. CARGA DE DATOS ---

  const fetchMesas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/`);
      setMesas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("🔴 [FETCH] Error:", error);
      setMessage({
        type: "error",
        text: "No se pudo conectar con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]); // --- 2. FILTRADO ---

  const filteredMesas = useMemo(() => {
    return mesas.filter((mesa) => {
      const term = searchTerm.toLowerCase(); // Buscamos por número o ubicación
      const numStr = String(mesa.numero);
      const ubicacionStr = (mesa.ubicacion || "").toLowerCase();
      const matchesSearch =
        numStr.includes(term) || ubicacionStr.includes(term); // Filtro de Estado

      const estadoStr = mesa.estado ? "true" : "false";
      const matchesEstado = filterEstado === "" || estadoStr === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [mesas, searchTerm, filterEstado]); // --- 3. HANDLERS ---

  const handleFormChange = (arg1, arg2) => {
    let name, value;
    if (arg1 && arg1.target) {
      name = arg1.target.name;
      value = arg1.target.value;
    } else {
      name = arg1;
      value = arg2;
    }
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (item = null) => {
    setMessage(null);
    if (item) {
      // MODO EDICIÓN
      setEditingItem({
        id: item.id,
        numero: item.numero,
        capacidad: item.capacidad,
        ubicacion: item.ubicacion || "",
        estado: item.estado ? "true" : "false", // String para el select
      });
    } else {
      // MODO CREAR (Calculamos el siguiente número disponible sugerido)
      const nextNum =
        mesas.length > 0 ? Math.max(...mesas.map((m) => m.numero)) + 1 : 1;
      setEditingItem({
        id: null,
        numero: nextNum,
        capacidad: 4,
        ubicacion: "Salón Principal",
        estado: "true",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Validaciones
      if (
        !editingItem.numero ||
        !editingItem.capacidad ||
        !String(editingItem.ubicacion).trim()
      ) {
        setMessage({
          type: "error",
          text: "Todos los campos son obligatorios.",
        });
        setLoading(false);
        return;
      } // Payload

      const payload = {
        numero: parseInt(editingItem.numero, 10),
        capacidad: parseInt(editingItem.capacidad, 10),
        ubicacion: editingItem.ubicacion,
        estado: editingItem.estado === "true",
      };

      let response;
      if (editingItem.id) {
        // PATCH
        response = await axios.patch(`${API_URL}/${editingItem.id}/`, payload);
        setMesas((prev) =>
          prev.map((m) => (m.id === editingItem.id ? response.data : m))
        );
        setMessage({ type: "success", text: "Mesa actualizada." });
      } else {
        // POST
        response = await axios.post(`${API_URL}/`, payload);
        setMesas((prev) => [...prev, response.data]);
        setMessage({ type: "success", text: "Mesa creada." });
      }
      setEditingItem(null);
    } catch (error) {
      console.error("🔴 [SAVE] Error:", error);
      if (error.response?.data) {
        const errData = error.response.data;
        const firstKey = Object.keys(errData)[0];
        const msg = Array.isArray(errData[firstKey])
          ? errData[firstKey][0]
          : errData[firstKey];
        setMessage({ type: "error", text: `Error en '${firstKey}': ${msg}` });
      } else {
        setMessage({ type: "error", text: "Error al guardar." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta mesa?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}/`);
      setMesas((prev) => prev.filter((m) => m.id !== id));
      setMessage({ type: "warning", text: "Mesa eliminada." });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error al eliminar (asegúrate de que no tenga pedidos).",
      });
    } finally {
      setLoading(false);
    }
  }; // --- RENDER RESPONSIVE ---

  return (
    <div className="bg-gray-100 min-h-screen font-sans pb-24">
            <Header></Header>     {" "}
      {/* Contenedor Principal con padding adaptativo */}     {" "}
      <div className="p-4 md:p-6 max-w-7xl mx-auto" role="main">
               {" "}
        {loading && (
          <span
            className="text-sm font-medium bg-red-800 text-white px-3 py-1 rounded-full animate-pulse inline-block mb-4"
            aria-live="polite"
          >
                        Procesando...          {" "}
          </span>
        )}
                {!editingItem && <MessageAlert msg={message} />}       {" "}
        {/* CONTROLES (Stack en mobile, Row en Desktop) */}       {" "}
        <div
          className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-lg sticky top-2 z-10"
          role="toolbar"
          aria-label="Filtros y acciones de mesa"
        >
                   {" "}
          <div
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-2/3"
            role="group"
          >
                       {" "}
            <label htmlFor="search-input" className="sr-only">
                            Buscar mesa por número o ubicación            {" "}
            </label>
                       {" "}
            <input
              id="search-input"
              type="text"
              placeholder="🔍 Buscar mesa (Número o Ubicación)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              aria-controls="table-grid"
            />
                       {" "}
            <label htmlFor="status-filter" className="sr-only">
                            Filtrar por estado            {" "}
            </label>
                       {" "}
            <select
              id="status-filter"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer appearance-none"
              aria-controls="table-grid"
            >
                            <option value="">Todos los Estados</option>         
                  <option value="true">🟢 Disponibles</option>             {" "}
              <option value="false">🔴 Ocupadas / Inactivas</option>           {" "}
            </select>
                     {" "}
          </div>
                   {" "}
          <button
            onClick={() => openModal(null)}
            disabled={loading}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-300"
            aria-label="Crear una nueva mesa"
          >
                        + Nueva Mesa          {" "}
          </button>
                 {" "}
        </div>
                {/* --- GRID VISUAL DE MESAS (RESPONSIVE) --- */}       {" "}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          role="list"
          id="table-grid"
        >
                   {" "}
          {filteredMesas.length === 0 ? (
            <div
              className="col-span-full text-center py-10 bg-white rounded-xl text-gray-500 text-lg shadow-md"
              role="status"
            >
                            No se encontraron mesas con estos filtros.          
               {" "}
            </div>
          ) : (
            filteredMesas.map((mesa) => (
              <div
                key={mesa.id}
                onClick={() => openModal(mesa)}
                role="listitem"
                tabIndex="0" // Permite enfocar con teclado
                aria-label={`Mesa número ${mesa.numero}. Capacidad: ${
                  mesa.capacidad
                } personas. Estado: ${
                  mesa.estado ? "Disponible" : "Ocupada"
                }. Ubicación: ${mesa.ubicacion}`}
                className={`relative group rounded-2xl p-4 shadow-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl cursor-pointer flex flex-col items-center justify-center h-32 sm:h-40 focus:outline-none focus:ring-4 focus:ring-red-300
                  ${
                  mesa.estado
                    ? "bg-white border-green-400 hover:border-green-600"
                    : "bg-gray-100 border-red-300 hover:border-red-500 opacity-90"
                }`}
              >
                                {/* Indicador de Estado (Punto de color) */}   
                           {" "}
                <div
                  className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                    mesa.estado ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                  aria-hidden="true"
                ></div>
                               {" "}
                {/* Número de Mesa Gigante (TAMAÑO REDUCIDO AQUÍ) */}           
                   {" "}
                <div
                  className={`text-4xl sm:text-5xl font-extrabold mb-1 leading-none ${
                    mesa.estado ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                                    {mesa.numero}               {" "}
                </div>
                               {" "}
                {/* Detalles - Manejo de Truncamiento y Centrado */}           
                   {" "}
                <div className="text-center w-full">
                                   {" "}
                  <p
                    className="text-xs font-bold text-gray-500 uppercase tracking-wider w-full whitespace-nowrap overflow-hidden text-ellipsis px-1"
                    title={mesa.ubicacion}
                  >
                                        {mesa.ubicacion}                 {" "}
                  </p>
                                   {" "}
                  <p className="text-sm text-gray-600 mt-1">
                                        👥{" "}
                    <span className="font-semibold">{mesa.capacidad}</span>{" "}
                    pers.                  {" "}
                  </p>
                                 {" "}
                </div>
                             {" "}
              </div>
            ))
          )}
                 {" "}
        </div>
             {" "}
      </div>
            {/* --- MODAL (FORMULARIO) RESPONSIVE Y ACCESIBLE --- */}     {" "}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setEditingItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
                   {" "}
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
                       {" "}
            <div className="bg-red-700 p-5 text-white flex justify-between items-center">
                           {" "}
              <h2 id="modal-title" className="text-2xl font-bold">
                               {" "}
                {editingItem.id
                  ? `Editar Mesa #${editingItem.numero}`
                  : "Crear Nueva Mesa"}
                             {" "}
              </h2>
                           {" "}
              <button
                onClick={() => setEditingItem(null)}
                className="text-white hover:text-gray-300 text-3xl leading-none font-light p-1 rounded-full hover:bg-red-600 transition-colors"
                aria-label="Cerrar formulario"
              >
                                &times;              {" "}
              </button>
                         {" "}
            </div>
                       {" "}
            <div className="p-6">
                           {" "}
              <div className="mb-5">
                                <MessageAlert msg={message} />             {" "}
              </div>
                           {" "}
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                                {/* Responsive Grid para Número y Capacidad */} 
                             {" "}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {" "}
                  <InputField
                    label="Número de Mesa"
                    name="numero"
                    type="number"
                    value={editingItem.numero}
                    onChange={handleFormChange}
                    min="1"
                    required={true}
                  />
                                   {" "}
                  <InputField
                    label="Capacidad (Personas)"
                    name="capacidad"
                    type="number"
                    value={editingItem.capacidad}
                    onChange={handleFormChange}
                    min="1"
                    required={true}
                  />
                                 {" "}
                </div>
                               {" "}
                <InputField
                  label="Ubicación"
                  name="ubicacion"
                  value={editingItem.ubicacion}
                  onChange={handleFormChange}
                  placeholder="Ej: Terraza, Salón, VIP..."
                  required={true}
                />
                               {" "}
                <div>
                                   {" "}
                  <label
                    htmlFor="estado-select"
                    className="block text-sm font-bold text-gray-700 mb-1"
                  >
                                        Estado                  {" "}
                  </label>
                                   {" "}
                  <select
                    id="estado-select"
                    name="estado"
                    value={editingItem.estado}
                    onChange={handleFormChange}
                    className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 font-semibold transition-all appearance-none cursor-pointer ${
                      editingItem.estado === "true"
                        ? "border-green-300 text-green-700 focus:ring-green-500 bg-green-50"
                        : "border-red-300 text-red-700 focus:ring-red-500 bg-red-50"
                    }`}
                  >
                                       {" "}
                    <option value="true">🟢 Disponible</option>                 
                      <option value="false">🔴 Ocupada / Inactiva</option>     
                               {" "}
                  </select>
                                 {" "}
                </div>
                               {" "}
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-4 border-t border-gray-200">
                                   {" "}
                  {editingItem.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingItem.id)}
                      className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-red-300"
                      aria-label={`Eliminar mesa #${editingItem.numero}`}
                    >
                                            Eliminar                    {" "}
                    </button>
                  )}
                                   {" "}
                  <div
                    className={`flex gap-3 ${
                      editingItem.id ? "sm:ml-auto" : "w-full justify-end"
                    }`}
                  >
                                       {" "}
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                                            Cancelar                    {" "}
                    </button>
                                       {" "}
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-transform active:scale-95 shadow-md w-full sm:w-auto focus:outline-none focus:ring-4 focus:ring-green-300"
                    >
                                           {" "}
                      {loading ? "Guardando..." : "Guardar"}                   {" "}
                    </button>
                                     {" "}
                  </div>
                                 {" "}
                </div>
                             {" "}
              </form>
                         {" "}
            </div>
                     {" "}
          </div>
                 {" "}
        </div>
      )}
            <NavBar />   {" "}
    </div>
  );
};

export default GestionMesas;

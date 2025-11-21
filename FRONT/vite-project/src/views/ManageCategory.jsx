import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import NavBar from "../components/Navigation.jsx";
import Header from "../components/Header.jsx";

// --- CONFIGURACIÓN ---
const API_URL = "http://localhost:8000/api/categorias";

const GestionCategorias = () => {
  // --- ESTADOS (Lógica preservada) ---
  const [message, setMessage] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false); // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // --- 1. CARGA DE DATOS (Lógica preservada) ---
  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/`);
      setCategorias(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("🔴 [FETCH] Error:", error);
      setMessage({
        type: "error",
        text: "No se pudo cargar la lista de categorías.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // --- HELPER: Formato de Fecha (Lógica preservada) ---
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // --- 2. FILTRADO (Lógica preservada) ---
  const filteredCategorias = useMemo(() => {
    return categorias.filter((cat) => {
      const term = searchTerm.toLowerCase();
      const nombreStr = (cat.nombre || "").toLowerCase();
      const matchesSearch = nombreStr.includes(term);

      const estadoStr = cat.estado ? "true" : "false";
      const matchesEstado = filterEstado === "" || estadoStr === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [categorias, searchTerm, filterEstado]);

  // --- 3. HANDLERS (Lógica preservada) ---
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
      setEditingItem({
        id: item.id,
        nombre: item.nombre || "",
        estado: item.estado ? "true" : "false",
      });
    } else {
      setEditingItem({
        id: null,
        nombre: "",
        estado: "true",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const nombreStr = String(editingItem.nombre || "").trim();

      if (!nombreStr) {
        setMessage({
          type: "error",
          text: "El nombre de la categoría es obligatorio.",
        });
        setLoading(false);
        return;
      }

      const payload = {
        nombre: nombreStr,
        estado: editingItem.estado === "true",
      };

      let response;
      if (editingItem.id) {
        const url = `${API_URL}/${editingItem.id}/`;
        response = await axios.patch(url, payload);
        setCategorias((prev) =>
          prev.map((c) => (c.id === editingItem.id ? response.data : c))
        );
        setMessage({
          type: "success",
          text: "Categoría actualizada correctamente.",
        });
      } else {
        response = await axios.post(`${API_URL}/`, payload);
        setCategorias((prev) => [...prev, response.data]);
        setMessage({ type: "success", text: "Categoría creada exitosamente." });
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
        setMessage({
          type: "error",
          text: "Error de conexión con el servidor.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Estás seguro de eliminar esta categoría?`)) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}/`);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      setMessage({ type: "warning", text: "Categoría eliminada." });
    } catch (error) {
      console.error("🔴 [DELETE]", error);
      setMessage({
        type: "error",
        text: "No se puede eliminar (quizás tiene productos asociados).",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO RESPONSIVE Y ARIA ---

  return (
    // Rol principal para el contenido de la página
    <div
      className="bg-gray-100 min-h-screen font-sans pb-24"
      role="main"
      aria-label="Gestión de Categorías"
    >
      <Header />

      {/* Contenedor Principal con padding adaptativo */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 sr-only">
          Gestión de Categorías
        </h1>
        {/* Indicador de carga accesible */}
        {loading && (
          <div className="flex justify-center mb-4" aria-live="polite">
            <span
              className="text-sm animate-pulse font-medium bg-red-800 text-white px-3 py-1 rounded-full shadow-lg"
              aria-busy="true"
            >
              Procesando...
            </span>
          </div>
        )}

        {/* Alerta visible si no hay modal abierto */}
        {!editingItem && <MessageAlert msg={message} />}

        {/* BARRA DE CONTROL (Stack en mobile, Row en Desktop) */}
        <div
          className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-lg sticky top-0 md:top-2 z-10 border border-gray-200"
          role="region"
          aria-label="Filtros y Acciones"
        >
          {/* Grupo de Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-2/3">
            {/* Buscador */}
            <label htmlFor="search-input" className="sr-only">
              Buscar categoría por nombre
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="🔍 Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-base"
              aria-label="Buscar categoría"
            />
            {/* Filtro Estado */}
            <label htmlFor="filter-estado" className="sr-only">
              Filtrar por estado
            </label>
            <select
              id="filter-estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer text-base appearance-none pr-8"
              aria-controls="categorias-list categories-table" // Enlaza al listado/tabla
            >
              <option value="">Todos los Estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Botón Nueva Categoría */}
          <button
            onClick={() => openModal(null)}
            disabled={loading}
            className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 transition-transform active:scale-95 text-base"
            aria-label="Crear nueva categoría"
          >
            + Nueva Categoría
          </button>
        </div>

        {/* --- VISTA MÓVIL (CARDS) - Se oculta en MD --- */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden"
          id="categorias-list"
          role="list"
          aria-label="Lista de Categorías (Vista Móvil)"
        >
          {filteredCategorias.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl text-gray-500 col-span-full shadow-md">
              No se encontraron categorías.
            </div>
          ) : (
            filteredCategorias.map((cat) => {
              const statusClass = cat.estado
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700";
              const statusText = cat.estado ? "ACTIVO" : "INACTIVO";
              return (
                <div
                  key={cat.id}
                  className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3 border border-gray-100 transition-shadow hover:shadow-lg"
                  role="listitem"
                  aria-labelledby={`cat-name-${cat.id}`}
                >
                  {/* Línea Principal: Nombre y Estado */}
                  <div className="flex justify-between items-start pb-2 border-b">
                    <h3
                      id={`cat-name-${cat.id}`}
                      className="font-extrabold text-xl text-gray-800 leading-tight"
                    >
                      {cat.nombre}
                    </h3>
                    <span
                      className={`py-1 px-3 rounded-full text-xs font-bold ${statusClass}`}
                      aria-label={`Estado: ${statusText}`}
                    >
                      {statusText}
                    </span>
                  </div>

                  {/* Detalle: Fecha y ID */}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span className="truncate">
                      ID:{" "}
                      <span
                        className="font-mono text-gray-700"
                        aria-hidden="true"
                      >
                        {cat.id}
                      </span>
                    </span>
                    <span className="text-right">
                      Creada:{" "}
                      <time dateTime={cat.created_at || ""}>
                        {formatDate(cat.created_at)}
                      </time>
                    </span>
                  </div>

                  {/* Acciones */}
                  <div
                    className="flex justify-end gap-3 pt-3 border-t"
                    role="group"
                    aria-label={`Acciones para ${cat.nombre}`}
                  >
                    <button
                      onClick={() => openModal(cat)}
                      className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                      aria-label={`Editar categoría ${cat.nombre}`}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      aria-label={`Eliminar categoría ${cat.nombre}`}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- VISTA DE ESCRITORIO (TABLE) - Se oculta en Móvil --- */}
        <div
          className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100"
          role="region"
          aria-labelledby="categories-table-title"
        >
          <h2 id="categories-table-title" className="sr-only">
            Tabla de Categorías
          </h2>
          <table
            className="min-w-full divide-y divide-gray-200"
            role="table"
            aria-live="polite"
            id="categories-table"
          >
            <thead className="bg-gray-50">
              <tr className="text-gray-600 uppercase text-xs font-bold tracking-wider">
                <th
                  scope="col"
                  className="py-4 px-6 text-center w-20"
                  aria-sort="none"
                >
                  ID
                </th>
                <th scope="col" className="py-4 px-6 text-left">
                  Nombre de Categoría
                </th>
                <th scope="col" className="py-4 px-6 text-left">
                  Fecha Creación
                </th>
                <th scope="col" className="py-4 px-6 text-center">
                  Estado
                </th>
                <th scope="col" className="py-4 px-6 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
              {filteredCategorias.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No se encontraron categorías.
                  </td>
                </tr>
              ) : (
                filteredCategorias.map((cat) => {
                  const statusText = cat.estado ? "ACTIVO" : "INACTIVO";
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="py-3 px-6 text-center text-gray-500 font-mono">
                        {cat.id}
                      </td>
                      <td className="py-3 px-6 text-left font-bold text-gray-800 text-lg">
                        {cat.nombre}
                      </td>
                      <td className="py-3 px-6 text-left text-gray-500">
                        <time dateTime={cat.created_at || ""}>
                          {formatDate(cat.created_at)}
                        </time>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`py-1 px-3 rounded-full text-xs font-bold ${
                            cat.estado
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                          aria-label={`Estado: ${statusText}`}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center space-x-4">
                        <div
                          role="group"
                          aria-label={`Acciones para ${cat.nombre}`}
                        >
                          <button
                            onClick={() => openModal(cat)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2 decoration-indigo-200 hover:decoration-indigo-600 transition-all"
                            aria-label={`Editar categoría ${cat.nombre}`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="text-red-600 hover:text-red-800 font-semibold underline decoration-2 decoration-red-200 hover:decoration-red-600 transition-all ml-4"
                            aria-label={`Eliminar categoría ${cat.nombre}`}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FLOTANTE (Responsive y con ARIA) */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado del Modal */}
            <div className="bg-red-800 p-4 text-white flex justify-between items-center">
              <h2 id="modal-title" className="text-xl font-bold">
                {editingItem.id ? "Editar Categoría" : "Crear Categoría"}
              </h2>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white hover:text-gray-300 text-2xl leading-none"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            {/* Cuerpo del Formulario */}
            <div className="p-6">
              {/* Alerta DENTRO del Modal */}
              <div className="mb-5">
                <MessageAlert msg={message} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="space-y-5">
                  {/* Campo Nombre de la Categoría */}
                  {/* Nota: Usando InputField, asumo que maneja su propia accesibilidad interna */}
                  <InputField
                    label="Nombre de la Categoría"
                    name="nombre"
                    value={editingItem.nombre}
                    onChange={handleFormChange}
                    placeholder="Ej: Bebidas, Postres..."
                    required={true}
                    // Se añade aria-required="true" en el componente InputField
                  />

                  {/* Selector de Estado */}
                  <div>
                    <label
                      htmlFor="estado-select"
                      className="block text-sm font-bold text-gray-700 mb-1"
                    >
                      Estado
                    </label>
                    <select
                      id="estado-select"
                      name="estado"
                      value={editingItem.estado}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none pr-8 text-base cursor-pointer"
                    >
                      <option value="true">✅ Activo (Visible)</option>
                      <option value="false">⛔ Inactivo (Oculto)</option>
                    </select>
                  </div>

                  {/* Botones de Acción */}
                  <div
                    className="flex justify-end gap-3 mt-6 pt-4 border-t"
                    role="toolbar"
                  >
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      onClick={handleSave}
                      disabled={loading}
                      className="px-5 py-2.5 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 shadow-md disabled:opacity-50 transition-transform active:scale-95"
                      aria-live="polite"
                    >
                      {loading ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Navegación Fija (asumiendo que es un footer nav) */}
      <NavBar />
    </div>
  );
};

export default GestionCategorias;

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import NavBar from "../components/Navigation.jsx";
import Header from "../components/Header.jsx";

// 1. CONFIGURACIÓN ROBUSTA (Variables de entorno)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE}/categorias`;

const GestionCategorias = () => {
  // --- ESTADOS ---
  const [message, setMessage] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // --- CARGA DE DATOS ---
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

  // --- HELPER FORMATO ---
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // --- FILTRADO ---
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

  // --- HANDLERS ---
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
        // PATCH
        response = await axios.patch(`${API_URL}/${editingItem.id}/`, payload);
        setCategorias((prev) =>
          prev.map((c) => (c.id === editingItem.id ? response.data : c))
        );
        setMessage({
          type: "success",
          text: "Categoría actualizada correctamente.",
        });
      } else {
        // POST
        response = await axios.post(`${API_URL}/`, payload);
        setCategorias((prev) => [...prev, response.data]);
        setMessage({ type: "success", text: "Categoría creada exitosamente." });
      }
      setEditingItem(null);
    } catch (error) {
      console.error("🔴 [SAVE] Error:", error);
      const errData = error.response?.data;
      if (errData) {
        const firstKey = Object.keys(errData)[0];
        const msg = Array.isArray(errData[firstKey])
          ? errData[firstKey][0]
          : errData[firstKey];
        setMessage({ type: "error", text: `Error: ${msg}` });
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
        text: "No se puede eliminar (posiblemente tiene productos asociados).",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---

  return (
    <div
      className="bg-gray-100 min-h-screen font-sans pb-24"
      role="main"
      aria-label="Página de Gestión de Categorías"
    >
      <Header />

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 sr-only">
          Gestión de Categorías
        </h1>

        {/* Indicador de Carga */}
        {loading && (
          <div className="flex justify-center mb-4" aria-live="polite">
            <span className="text-sm animate-pulse font-medium bg-red-800 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
              <span aria-hidden="true" className="animate-spin">↻</span> Procesando...
            </span>
          </div>
        )}

        {!editingItem && <MessageAlert msg={message} />}

        {/* BARRA DE CONTROL */}
        <div
          className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-lg sticky top-0 md:top-4 z-10 border border-gray-200"
          role="search" // Indica que es una zona de búsqueda/filtrado
          aria-label="Barra de herramientas de categorías"
        >
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-2/3">
            <label htmlFor="search-category" className="sr-only">Buscar categoría</label>
            <input
              id="search-category"
              name="search" // Name para autocompletado/testing
              type="text"
              placeholder="🔍 Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-base"
            />

            <label htmlFor="filter-estado" className="sr-only">Filtrar por estado</label>
            <select
              id="filter-estado"
              name="filterEstado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer text-base appearance-none pr-8"
            >
              <option value="">Todos los Estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <button
            onClick={() => openModal(null)}
            disabled={loading}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 transition-transform active:scale-95 text-base"
            aria-label="Crear nueva categoría"
          >
            <span aria-hidden="true">+</span> Nueva Categoría
          </button>
        </div>

        {/* --- LISTA MÓVIL (Cards) --- */}
        <div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden"
            role="list"
            aria-label="Lista de tarjetas de categorías"
        >
          {filteredCategorias.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl text-gray-500 col-span-full shadow-md italic">
              No se encontraron categorías.
            </div>
          ) : (
            filteredCategorias.map((cat) => {
              const statusClass = cat.estado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
              const statusText = cat.estado ? "ACTIVO" : "INACTIVO";
              
              return (
                <article
                  key={cat.id}
                  className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3 border border-gray-100 transition-shadow hover:shadow-lg"
                  role="listitem"
                >
                  <div className="flex justify-between items-start pb-2 border-b">
                    <h3 className="font-extrabold text-xl text-gray-800 leading-tight">
                      {cat.nombre}
                    </h3>
                    <span
                      className={`py-1 px-3 rounded-full text-xs font-bold ${statusClass}`}
                      role="status" // Semántica de estado
                      aria-label={`Estado: ${statusText}`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-gray-500">
                    <span>ID: <span className="font-mono text-gray-700">{cat.id}</span></span>
                    <span>{formatDate(cat.created_at)}</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                      onClick={() => openModal(cat)}
                      name={`btn-edit-${cat.id}`} // Name único
                      className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-1"
                      aria-label={`Editar categoría ${cat.nombre}`}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      name={`btn-delete-${cat.id}`} // Name único
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center gap-1"
                      aria-label={`Eliminar categoría ${cat.nombre}`}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* --- TABLA DE ESCRITORIO --- */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
          <table 
            className="min-w-full divide-y divide-gray-200"
            aria-label="Tabla de inventario de categorías"
          >
            <thead className="bg-gray-50">
              <tr className="text-gray-600 uppercase text-xs font-bold tracking-wider">
                <th scope="col" className="py-4 px-6 text-center w-20">ID</th>
                <th scope="col" className="py-4 px-6 text-left">Nombre</th>
                <th scope="col" className="py-4 px-6 text-left">Creada</th>
                <th scope="col" className="py-4 px-6 text-center">Estado</th>
                <th scope="col" className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
              {filteredCategorias.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 italic">
                    No hay registros disponibles.
                  </td>
                </tr>
              ) : (
                filteredCategorias.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 text-center text-gray-500 font-mono">{cat.id}</td>
                    <td className="py-3 px-6 text-left font-bold text-gray-800 text-lg">
                      {cat.nombre}
                    </td>
                    <td className="py-3 px-6 text-left text-gray-500">
                      {formatDate(cat.created_at)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span
                        className={`py-1 px-3 rounded-full text-xs font-bold ${
                          cat.estado
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                        role="status"
                      >
                        {cat.estado ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center space-x-4">
                      <button
                        onClick={() => openModal(cat)}
                        name={`btn-edit-${cat.id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline"
                        aria-label={`Editar categoría ${cat.nombre}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        name={`btn-delete-${cat.id}`}
                        className="text-red-600 hover:text-red-900 font-medium hover:underline"
                        aria-label={`Eliminar categoría ${cat.nombre}`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-800 p-4 text-white flex justify-between items-center">
              <h2 id="modal-title" className="text-xl font-bold flex items-center gap-2">
                {editingItem.id ? "✏️ Editar Categoría" : "✨ Nueva Categoría"}
              </h2>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white hover:text-gray-300 text-2xl leading-none"
                aria-label="Cerrar ventana"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <MessageAlert msg={message} />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="space-y-5">
                  <InputField
                    label="Nombre de la Categoría"
                    name="nombre"
                    id="cat-nombre" // ID explícito para accesibilidad
                    value={editingItem.nombre}
                    onChange={handleFormChange}
                    placeholder="Ej: Bebidas, Entradas..."
                    required={true}
                    // InputField ya maneja el label+id internamente si le pasas name/id
                  />

                  <div>
                    <label htmlFor="cat-estado" className="block text-sm font-bold text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      id="cat-estado"
                      name="estado"
                      value={editingItem.estado}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                    >
                      <option value="true">✅ Activo (Visible en menú)</option>
                      <option value="false">⛔ Inactivo (Oculto)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      name="btn-save-category"
                      className="px-5 py-2.5 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 shadow-md disabled:opacity-50 transition-transform active:scale-95"
                    >
                      {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  );
};

export default GestionCategorias;
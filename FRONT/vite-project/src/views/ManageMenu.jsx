import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import NavBar from "../components/Navigation.jsx";
import Header from "../components/Header.jsx";

const API_PRODUCTOS = "http://localhost:8000/api/productos";
const API_CATEGORIAS = "http://localhost:8000/api/categorias";

const GestionMenu = () => {
  const [message, setMessage] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resProductos, resCategorias] = await Promise.all([
          axios.get(`${API_PRODUCTOS}/`),
          axios.get(`${API_CATEGORIAS}/`),
        ]);
        setPlatos(Array.isArray(resProductos.data) ? resProductos.data : []);
        setCategorias(
          Array.isArray(resCategorias.data) ? resCategorias.data : []
        );
      } catch (error) {
        console.error("Error load:", error);
        setMessage({
          type: "error",
          text: "No se pudo conectar con el servidor.",
        });
      }
    };
    cargarDatos();
  }, []); // --- HELPERS ---

  const getCategoryId = (item) => {
    if (!item) return null;
    if (item.categoria_id !== undefined && item.categoria_id !== null)
      return parseInt(item.categoria_id, 10);
    if (item.categoria && typeof item.categoria === "object")
      return item.categoria.id;
    if (item.category)
      return typeof item.category === "object"
        ? item.category.id
        : parseInt(item.category, 10);
    return null;
  };

  const getCategoryName = (item) => {
    const catId = getCategoryId(item);
    if (!catId && item.categoria && typeof item.categoria === "string")
      return item.categoria;
    if (!catId) return "---";
    const found = categorias.find((c) => String(c.id) === String(catId));
    return found ? found.nombre : "---";
  };

  const platosFiltrados = useMemo(() => {
    return platos.filter((dish) => {
      const texto = busqueda.toLowerCase();
      const nombre = (dish.nombre || dish.name || "").toLowerCase();
      const matchTexto =
        nombre.includes(texto) ||
        (dish.descripcion || "").toLowerCase().includes(texto);
      const catId = getCategoryId(dish);
      const matchCategoria =
        filtroCategoria === "" || String(catId) === String(filtroCategoria);
      return matchTexto && matchCategoria;
    });
  }, [platos, busqueda, filtroCategoria, categorias]); // --- HANDLERS ---

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0])
      setImagenArchivo(e.target.files[0]);
  };

  const openModal = (item = null) => {
    setMessage(null);
    setImagenArchivo(null);
    const defaultCatId = categorias.length > 0 ? categorias[0].id : "";

    if (item) {
      const catId = getCategoryId(item);
      const isAvail = item.available ?? item.disponible ?? true;

      setEditingItem({
        id: item.id,
        name: item.nombre || item.name || "",
        descripcion: item.descripcion || "",
        price: item.precio || item.price || 0,
        category: String(catId || defaultCatId),
        available: isAvail ? "true" : "false",
        imagen: item.imagen,
      });
    } else {
      setEditingItem({
        id: null,
        name: "",
        descripcion: "",
        price: 0,
        imagen: null,
        category: String(defaultCatId),
        available: "true",
      });
    }
  };

  const handleSave = async () => {
    if (!editingItem.name.trim()) {
      setMessage({ type: "error", text: "El nombre es obligatorio." });
      return;
    }

    const formData = new FormData();
    formData.append("nombre", editingItem.name);
    formData.append("descripcion", editingItem.descripcion);
    formData.append("precio", editingItem.price);

    const catInt = parseInt(editingItem.category, 10); // --- ESTRATEGIA "ESCOPETA" --- // Enviamos AMBOS campos para compatibilidad con diferentes backends (Django, Flask, etc.)

    formData.append("categoria", catInt);
    formData.append("categoria_id", catInt);

    const valPython = editingItem.available === "true" ? "True" : "False";
    formData.append("disponible", valPython);

    if (imagenArchivo) formData.append("imagen", imagenArchivo);

    try {
      const headers = { "Content-Type": "multipart/form-data" };
      let response;

      if (editingItem.id) {
        response = await axios.patch(
          `${API_PRODUCTOS}/${editingItem.id}/`,
          formData,
          { headers }
        );
      } else {
        response = await axios.post(`${API_PRODUCTOS}/`, formData, { headers });
      }

      setPlatos((prev) => {
        if (editingItem.id)
          return prev.map((p) =>
            p.id === response.data.id ? response.data : p
          );
        return [...prev, response.data];
      });
      setMessage({ type: "success", text: "Guardado correctamente." });
      setEditingItem(null);
    } catch (error) {
      console.error("🔴 [ERROR] Fallo al guardar:", error);
      setMessage({ type: "error", text: "Error al guardar." });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar?")) return;
    try {
      await axios.delete(`${API_PRODUCTOS}/${id}/`);
      setPlatos((prev) => prev.filter((p) => p.id !== id));
      setMessage({ type: "warning", text: "Eliminado." });
    } catch (e) {
      setMessage({ type: "error", text: "Error al eliminar." });
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans pb-48 relative">
      <Header></Header>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <MessageAlert msg={message} />
        {/* Controles (Búsqueda, Filtro, Botón Crear) */}
        <div
          className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-md sticky top-2 z-10"
          role="toolbar"
          aria-label="Filtros y acciones de menú"
        >
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="🔍 Buscar plato..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 w-full sm:w-64 focus:ring-2 focus:ring-red-500 outline-none"
              aria-label="Buscar plato por nombre o descripción"
            />

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 w-full sm:w-auto bg-white focus:ring-2 focus:ring-red-500 cursor-pointer"
              aria-label="Filtrar por categoría"
            >
              <option value="">📂 Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => openModal(null)}
            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md active:scale-95"
            aria-label="Abrir formulario para crear un nuevo plato"
          >
            + Crear Plato
          </button>
        </div>
        {/* Vista de Tarjetas (Dispositivos pequeños) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
          {platosFiltrados.map((dish) => {
            const catName = getCategoryName(dish);
            const isAvailable = dish.available ?? dish.disponible ?? true;
            return (
              <div
                key={dish.id}
                className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3 border border-gray-100"
                role="listitem"
              >
                <div className="flex gap-4">
                  <img
                    src={dish.imagen || "https://placehold.co/80"}
                    alt={`Imagen de ${dish.nombre || dish.name || "plato"}`}
                    className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                  />

                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">
                      {dish.nombre || dish.name}
                    </h3>

                    {/* CAMBIO AQUÍ: line-clamp-2 cambiado a line-clamp-3 */}

                    <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                      {dish.descripcion}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm border-t pt-2 mt-1">
                  <span className="font-semibold text-gray-600 bg-gray-100 px-2 rounded">
                    {catName}
                  </span>

                  <span className="font-extrabold text-xl text-red-700">
                    ${parseFloat(dish.precio || dish.price).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-1 gap-2">
                  <span
                    className={`py-1 px-2 rounded text-[10px] font-bold uppercase ${
                      isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isAvailable ? "Disponible" : "Agotado"}
                  </span>

                  <div
                    className="flex gap-2"
                    role="group"
                    aria-label={`Acciones para ${dish.nombre || dish.name}`}
                  >
                    <button
                      onClick={() => openModal(dish)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                      aria-label={`Editar ${dish.nombre || dish.name}`}
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDelete(dish.id)}
                      className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      aria-label={`Eliminar ${dish.nombre || dish.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Vista de Tabla (Dispositivos grandes - md:block) */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
          <table
            className="min-w-full divide-y divide-gray-200"
            role="table"
            aria-label="Lista de platos del menú"
          >
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="py-4 px-6 text-center text-xs font-bold text-gray-600 uppercase"
                >
                  Imagen
                </th>
                <th
                  scope="col"
                  className="py-4 px-6 text-left text-xs font-bold text-gray-600 uppercase"
                >
                  Nombre
                </th>

                <th
                  scope="col"
                  className="py-4 px-6 text-left text-xs font-bold text-gray-600 uppercase"
                >
                  Categoría
                </th>

                <th
                  scope="col"
                  className="py-4 px-6 text-center text-xs font-bold text-gray-600 uppercase"
                >
                  Precio
                </th>

                <th
                  scope="col"
                  className="py-4 px-6 text-center text-xs font-bold text-gray-600 uppercase"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="py-4 px-6 text-center text-xs font-bold text-gray-600 uppercase"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody
              className="text-gray-700 text-sm divide-y divide-gray-200"
              role="rowgroup"
            >
              {platosFiltrados.map((dish) => {
                const catName = getCategoryName(dish);
                const isAvailable = dish.available ?? dish.disponible ?? true;
                return (
                  <tr
                    key={dish.id}
                    className="hover:bg-red-50 transition-colors group"
                    role="row"
                  >
                    <td className="py-3 px-6 text-center" role="cell">
                      <img
                        src={dish.imagen || "https://placehold.co/40"}
                        alt={`Imagen de ${dish.nombre || dish.name || "plato"}`}
                        className="w-12 h-12 rounded-lg object-cover mx-auto shadow-sm border"
                      />
                    </td>
                    <td className="py-3 px-6 text-left" role="cell">
                      <div className="font-bold text-gray-800 text-base">
                        {dish.nombre || dish.name}
                      </div>

                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        {dish.descripcion}
                      </div>
                    </td>

                    <td className="py-3 px-6 text-left" role="cell">
                      <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold border border-gray-200">
                        {catName}
                      </span>
                    </td>

                    <td
                      className="py-3 px-6 text-center font-bold text-gray-700 text-base"
                      role="cell"
                    >
                      ${parseFloat(dish.precio || dish.price).toFixed(2)}
                    </td>

                    <td className="py-3 px-6 text-center" role="cell">
                      <span
                        className={`py-1 px-3 rounded-full text-xs font-bold ${
                          isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isAvailable ? "DISPONIBLE" : "AGOTADO"}
                      </span>
                    </td>
                    <td
                      className="py-3 px-6 text-center space-x-4 opacity-80 group-hover:opacity-100"
                      role="cell"
                    >
                      <button
                        onClick={() => openModal(dish)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                        aria-label={`Editar ${dish.nombre || dish.name}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(dish.id)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                        aria-label={`Eliminar ${dish.nombre || dish.name}`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* MODAL DE EDICIÓN/CREACIÓN */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setEditingItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-800 p-4 text-white flex justify-between items-center">
              <h2 id="modal-title" className="text-xl font-bold">
                {editingItem.id ? "Editar Plato" : "Crear Plato"}
              </h2>

              <button
                onClick={() => setEditingItem(null)}
                className="text-white text-2xl"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
              <InputField
                label="Nombre"
                name="name"
                value={editingItem.name}
                onChange={handleFormChange}
                aria-required="true"
              />

              <div>
                <label
                  htmlFor="descripcion"
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={editingItem.descripcion}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  aria-label="Descripción del plato"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-bold text-gray-700 mb-1"
                  >
                    Categoría
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={editingItem.category}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    {categorias.length === 0 && (
                      <option value="">Cargando...</option>
                    )}

                    {categorias.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="Precio"
                  name="price"
                  type="number"
                  value={editingItem.price}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label
                  htmlFor="imagen-file"
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Imagen
                </label>

                <div className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
                  {editingItem.imagen && !imagenArchivo && (
                    <img
                      src={editingItem.imagen}
                      alt="Imagen actual del plato"
                      className="w-16 h-16 rounded object-cover border"
                    />
                  )}

                  <input
                    id="imagen-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
                    aria-label="Seleccionar archivo de imagen"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="disponibilidad"
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Disponibilidad
                </label>

                <select
                  id="disponibilidad"
                  name="available"
                  value={editingItem.available}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  aria-label="Estado de disponibilidad del plato"
                >
                  <option value="true">✅ Disponible</option>
                  <option value="false">⛔ Agotado</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-5 py-2.5 rounded-lg text-gray-700 hover:bg-gray-200"
                aria-label="Cancelar y cerrar formulario"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-red-700 text-white rounded-lg hover:bg-red-800 font-bold shadow-md"
                aria-label="Guardar cambios del plato"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      <NavBar />
    </div>
  );
};

export default GestionMenu;

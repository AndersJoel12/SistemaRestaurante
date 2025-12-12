import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import MessageAlert from "../components/MessageAlert.jsx";
import NavBar from "../components/Navigation.jsx";
import Header from "../components/Header.jsx";

// 1. CONFIGURACIÓN ROBUSTA (Para que funcione en producción y local)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_PRODUCTOS = `${API_BASE}/productos`;
const API_CATEGORIAS = `${API_BASE}/categorias`;

const normalizePlato = (plato) => {
  if (!plato) return null;

  const rawStock = parseInt(plato.stock || 0, 10);
  const isAvailable = plato.disponible ?? plato.available ?? rawStock > 0;


  return {
    id: plato.id,
    name: plato.nombre || plato.name || "",
    descripcion: plato.descripcion || plato.description || "",
    price: parseFloat(plato.precio || plato.price || 0),
    stock: rawStock,
    available: isAvailable,
    category: plato.categoria,
    category_id: plato.categoria_id,
    imagen_url: plato.imagen,
  };
};

const GestionMenu = () => {
  const [message, setMessage] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resProductos, resCategorias] = await Promise.all([
        axios.get(`${API_PRODUCTOS}/`),
        axios.get(`${API_CATEGORIAS}/`),
      ]);

      setPlatos(
        Array.isArray(resProductos.data)
          ? resProductos.data.map(normalizePlato)
          : []
      );
      setCategorias(
        Array.isArray(resCategorias.data) ? resCategorias.data : []
      );
    } catch (error) {
      console.error("🔴 [FETCH] Error load:", error);
      setMessage({
        type: "error",
        text: "No se pudo conectar con el servidor para cargar datos.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const platosFiltrados = useMemo(() => {
    return platos.filter((dish) => {
      const texto = busqueda.toLowerCase();
      const nombre = (dish.name || "").toLowerCase();
      const matchTexto =
        nombre.includes(texto) ||
        (dish.descripcion || "").toLowerCase().includes(texto);

      const catId = dish.category_id;

      const matchCategoria =
        filtroCategoria === "" || String(catId) === String(filtroCategoria);

      return matchTexto && matchCategoria;
    });
  }, [platos, busqueda, filtroCategoria]);

  // 🔥 CORRECCIÓN TÉCNICA:
  // Reemplazamos 'arguments' (que no existe en arrow functions) por parámetros explícitos.
  // Esto mantiene tu lógica de aceptar (evento) O (nombre, valor).
  const handleFormChange = (arg1, arg2) => {
    let name, value;
    if (arg1 && arg1.target) {
      // Caso 1: Es un evento (onChange normal)
      name = arg1.target.name;
      value = arg1.target.value;
    } else {
      // Caso 2: Llamada manual (handleFormChange('precio', 50))
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
    const normalized = normalizePlato(item);

    if (item) {
      setEditingItem({
        id: normalized.id,
        name: normalized.name,
        descripcion: normalized.descripcion,
        price: normalized.price,
        stock: normalized.stock,
        category: String(normalized.category_id || defaultCatId),
        available: normalized.available ? "true" : "false",
        imagen: normalized.imagen_url,
      });
    } else {
      setEditingItem({
        id: null,
        name: "",
        descripcion: "",
        price: 0,
        stock: 0,
        imagen: null,
        category: String(defaultCatId),
        available: "true",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    if (!editingItem.name.trim()) {
      setMessage({ type: "error", text: "El nombre es obligatorio." });
      setLoading(false);
      return;
    }

    const rawStock = parseInt(editingItem.stock || "0", 10);
    if (isNaN(rawStock) || rawStock < 0) {
      setMessage({
        type: "error",
        text: "El Stock debe ser un número positivo.",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("nombre", editingItem.name);
    formData.append("descripcion", editingItem.descripcion);
    formData.append("precio", editingItem.price);
    formData.append("stock", rawStock);

    let isAvailableForAPI;
    if (rawStock <= 0) {
      isAvailableForAPI = "False";

      if (editingItem.available === "true") {
        setMessage({
          type: "warning",
          text: "Stock es 0, plato marcado automáticamente como NO disponible.",
        });
      }
    } else {
      isAvailableForAPI = editingItem.available === "true" ? "True" : "False";
    }
    formData.append("disponible", isAvailableForAPI);


    const catInt = parseInt(editingItem.category, 10);
    formData.append("categoria_id", catInt);
    formData.append("categoria_escritura", catInt);

    if (imagenArchivo) {
      formData.append("imagen", imagenArchivo);
    }

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

      const savedPlato = normalizePlato(response.data);
      setPlatos((prev) => {
        if (editingItem.id)
          return prev.map((p) => (p.id === savedPlato.id ? savedPlato : p));
        return [...prev, savedPlato];
      });

      setMessage({ type: "success", text: "Plato guardado correctamente." });
      setEditingItem(null);
    } catch (error) {
      console.error(
        "🔴 [SAVE] Fallo al guardar:",
        error.response?.data || error
      );
      const errorText = error.response?.data?.detail
        ? `Error: ${error.response.data.detail}`
        : "Error al guardar. Revise los campos.";
      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este plato permanentemente?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_PRODUCTOS}/${id}/`);
      setPlatos((prev) => prev.filter((p) => p.id !== id));
      setMessage({ type: "warning", text: "Plato eliminado." });
    } catch (e) {
      console.error("🔴 [DELETE] Error:", e);
      setMessage({
        type: "error",
        text: "Error al eliminar. Puede que esté referenciado en alguna orden.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (dish) => {
    const category = categorias.find(
      (c) => String(c.id) === String(dish.category_id)
    );
    return category ? category.nombre : "Sin Categoría";
  };

  return (
    <div
      className="bg-gray-100 min-h-screen font-sans pb-48 relative"
      role="main"
    >
      <Header />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <MessageAlert msg={message} />

        {/* Controles */}
        <div
          className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-md sticky top-2 z-10"
          role="search"
          aria-label="Filtros y acciones"
        >
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <label htmlFor="search-input" className="sr-only">
              Buscar plato
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="🔍 Buscar plato..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 w-full sm:w-64 focus:ring-2 focus:ring-red-500 outline-none"
            />

            <label htmlFor="cat-filter" className="sr-only">
              Filtrar categoría
            </label>
            <select
              id="cat-filter"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 w-full sm:w-auto bg-white focus:ring-2 focus:ring-red-500 cursor-pointer"
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
            aria-label="Crear nuevo plato"
          >
            + Crear Plato
          </button>
        </div>

        {/* Vista de Tarjetas (Móvil) */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden"
          role="list"
        >
          {platosFiltrados.map((dish) => {
            const catName = getCategoryName(dish);
            const isAvailable = dish.available ?? true;
            const stock = dish.stock || 0;

            return (
              <div
                key={dish.id}
                className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3 border border-gray-100"
                role="listitem"
              >
                <div className="flex gap-4">
                  <img
                    src={dish.imagen_url || "https://placehold.co/80"}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                    aria-hidden="true"
                  />

                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">
                      {dish.name}
                    </h3>

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
                    ${parseFloat(dish.price).toFixed(2)}
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  Stock: <span className="font-bold">{dish.stock}</span>
                </div>

                <div className="flex justify-between items-center mt-1 gap-2">
                  {/* Badge de estado */}
                  <span
                    className={`py-1 px-2 rounded text-[10px] font-bold uppercase ${
                      stock <= 0
                        ? "bg-red-100 text-red-700"
                        : isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                    role="status"
                    aria-label={`Estado: ${
                      stock <= 0
                        ? "Agotado"
                        : isAvailable
                        ? "Disponible"
                        : "Pausado"
                    }`}
                  >
                    {stock <= 0
                      ? "AGOTADO"
                      : isAvailable
                      ? "DISPONIBLE"
                      : "PAUSADO"}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(dish)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                      aria-label={`Editar ${dish.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id)}
                      className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      aria-label={`Eliminar ${dish.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Vista de Tabla (Escritorio) */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
          <table
            className="min-w-full divide-y divide-gray-200"
            aria-label="Inventario de platos"
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
                  Detalles
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
                  Stock
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
            <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
              {platosFiltrados.map((dish) => {
                const catName = getCategoryName(dish);
                const isAvailable = dish.available ?? true;
                const stock = dish.stock || 0;

                return (
                  <tr
                    key={dish.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-6 text-center">
                      <img
                        src={dish.imagen_url || "https://placehold.co/40"}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover mx-auto shadow-sm border"
                        aria-hidden="true"
                      />
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="font-bold text-gray-800 text-base">
                        {dish.name}
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        {dish.descripcion}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">
                      <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold border border-gray-200">
                        {catName}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center font-bold text-gray-700 text-base">
                      ${parseFloat(dish.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-center font-bold text-gray-700 text-base">
                      {dish.stock}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span
                        className={`py-1 px-3 rounded-full text-xs font-bold ${
                          stock <= 0
                            ? "bg-red-100 text-red-700"
                            : isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                        role="status"
                      >
                        {stock <= 0
                          ? "AGOTADO"
                          : isAvailable
                          ? "DISPONIBLE"
                          : "PAUSADO"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center space-x-3">
                      <button
                        onClick={() => openModal(dish)}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold"
                        aria-label={`Editar ${dish.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(dish.id)}
                        className="text-red-600 hover:text-red-900 font-semibold"
                        aria-label={`Eliminar ${dish.name}`}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CON ESTILO ORIGINAL */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-red-700 p-4 text-white flex justify-between items-center">
              <h2 id="modal-title" className="text-xl font-bold">
                {editingItem.id ? "Editar Plato" : "Crear Plato"}
              </h2>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-4">
                <label
                  htmlFor="field-name"
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Nombre
                </label>
                <input
                  id="field-name"
                  type="text"
                  name="name"
                  value={editingItem.name}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                  aria-required="true"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="field-desc"
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Descripción
                </label>
                <textarea
                  id="field-desc"
                  name="descripcion"
                  value={editingItem.descripcion}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="field-price"
                    className="block text-sm font-bold text-gray-700 mb-1"
                  >
                    Precio ($)
                  </label>
                  <input
                    id="field-price"
                    type="number"
                    name="price"
                    value={editingItem.price}
                    onChange={handleFormChange}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label
                    htmlFor="field-stock"
                    className="block text-sm font-bold text-gray-700 mb-1"
                  >
                    Stock
                  </label>
                  <input
                    id="field-stock"
                    type="number"
                    name="stock"
                    value={editingItem.stock}
                    onChange={handleFormChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="field-cat"
                    className="block text-sm font-bold text-gray-700 mb-1"
                  >
                    Categoría
                  </label>
                  <select
                    id="field-cat"
                    name="category"
                    value={editingItem.category}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="field-avail"
                    className="block text-sm font-bold text-gray-700 mb-1"
                  >
                    Disponibilidad
                  </label>
                  <select
                    id="field-avail"
                    name="available"
                    value={editingItem.available}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Pausado</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="field-img"
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Imagen
                </label>
                <input
                  id="field-img"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 border transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <NavBar />
    </div>
  );
};

export default GestionMenu;

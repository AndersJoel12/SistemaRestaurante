import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import NavBar from "../components/Navigation.jsx";
import Header from "../components/Header.jsx";

const API_PRODUCTOS = "http://localhost:8000/api/productos";
const API_CATEGORIAS = "http://localhost:8000/api/categorias";

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
    category_id:
      (plato.categoria && plato.categoria.id) ||
      plato.categoria ||
      plato.category,
    imagen_url: plato.imagen,
  };
};

const GestionMenu = () => {
  const [message, setMessage] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editingItem, setEditingItem] = useState(null); // Producto en edición/creación
  const [imagenArchivo, setImagenArchivo] = useState(null); // Archivo de imagen seleccionado
  const [loading, setLoading] = useState(false); // Indicador de carga

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
      const nombre = (dish.nombre || "").toLowerCase();
      const matchTexto =
        nombre.includes(texto) ||
        (dish.descripcion || "").toLowerCase().includes(texto);

      const catId = dish.category_id;

      const matchCategoria =
        filtroCategoria === "" || String(catId) === String(filtroCategoria);

      return matchTexto && matchCategoria;
    });
  }, [platos, busqueda, filtroCategoria]);

  const handleFormChange = (e) => {
    const { name, value } = e.target || { name: e, value: arguments[1] };

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
    // Busca en la lista de categorías (estado)
    const category = categorias.find(
      (c) => String(c.id) === String(dish.category_id)
    );

    console.log(category);
    // Devuelve el nombre de la categoría o un texto por defecto
    return category ? category.nombre : "Sin Categoría";
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

                {/* NUEVA LÍNEA: Mostrar Stock */}
                <div className="text-sm text-gray-600">
                  Stock: <span className="font-bold">{dish.stock}</span>
                </div>

                <div className="flex justify-between items-center mt-1 gap-2">
                  {/* LÓGICA DE ESTADO MEJORADA */}
                  {(() => {
                    const isAvailable = dish.available ?? true;
                    const stock = dish.stock || 0;
                    
                    let statusText = "Desconocido";
                    let statusClass = "bg-gray-100 text-gray-700";

                    if (stock <= 0) {
                      statusText = "AGOTADO";
                      statusClass = "bg-red-100 text-red-700";
                    } else if (isAvailable) {
                      statusText = "DISPONIBLE";
                      statusClass = "bg-green-100 text-green-700";
                    } else {
                      statusText = "PAUSADO (Stock)";
                      statusClass = "bg-yellow-100 text-yellow-700";
                    }

                    return (
                      <span
                        className={`py-1 px-2 rounded text-[10px] font-bold uppercase ${statusClass}`}
                      >
                        {statusText}
                      </span>
                    );
                  })()}

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
                  Nombres
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
                
                {/* NUEVO ENCABEZADO: Stock */}
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
            <tbody
              className="text-gray-700 text-sm divide-y divide-gray-200"
              role="rowgroup"
            >
              {platosFiltrados.map((dish) => {
                const catName = getCategoryName(dish);
                
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
                    
                    {/* NUEVA CELDA: Stock */}
                    <td 
                      className="py-3 px-6 text-center font-bold text-gray-700 text-sm"
                      role="cell"
                    >
                      {dish.stock}
                    </td>

                    {/* CELDA ESTADO (Lógica mejorada) */}
                    <td className="py-3 px-6 text-center" role="cell">
                      {(() => {
                        const isAvailable = dish.available ?? true;
                        const stock = dish.stock || 0;
                        
                        let statusText = "ERROR";
                        let statusClass = "bg-gray-100 text-gray-700";

                        if (stock <= 0) {
                          statusText = "❌ AGOTADO";
                          statusClass = "bg-red-100 text-red-700";
                        } else if (isAvailable) {
                          statusText = "✅ DISPONIBLE";
                          statusClass = "bg-green-100 text-green-700";
                        } else {
                          statusText = "⏸️ PAUSADO";
                          statusClass = "bg-yellow-100 text-yellow-700";
                        }

                        return (
                          <span
                            className={`py-1 px-3 rounded-full text-xs font-bold ${statusClass}`}
                          >
                            {statusText}
                          </span>
                        );
                      })()}
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

              {/* GRUPO 1: Categoría y Stock */}
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
                
                {/* NUEVO CAMPO: Stock */}
                <InputField
                  label="Stock (Unidades disponibles)"
                  name="stock"
                  type="number"
                  value={editingItem.stock}
                  onChange={handleFormChange}
                  min="0"
                  aria-required="true"
                />
              </div>

              {/* GRUPO 2: Precio y Disponibilidad Manual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Precio"
                  name="price"
                  type="number"
                  value={editingItem.price}
                  onChange={handleFormChange}
                  step="0.01"
                  aria-required="true"
                />

                {/* CAMPO DISPONIBILIDAD MANUAL */}
                <div>
                  <label
                    htmlFor="disponibilidad"
                    className="block text-sm font-bold text-gray-700 mb-1"
                  >
                    Disponibilidad Manual
                  </label>

                  <select
                    id="disponibilidad"
                    name="available"
                    value={editingItem.available}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    aria-label="Estado de disponibilidad manual del plato"
                  >
                    <option value="true">✅ Activo (Mostrar en menú)</option>
                    <option value="false">⏸️ Pausado (Ocultar)</option>
                  </select>
                </div>
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

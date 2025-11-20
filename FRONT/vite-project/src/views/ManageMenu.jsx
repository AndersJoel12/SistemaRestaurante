import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";
import NavBar from "../components/Navigation.jsx";

// --- CONFIGURACIÓN DE APIS ---
const API_PRODUCTOS = 'http://localhost:8000/api/productos'; 
const API_CATEGORIAS = 'http://localhost:8000/api/categorias'; 

const GestionMenu = () => {
  // --- ESTADOS ---
  const [message, setMessage] = useState(null);
  const [platos, setPlatos] = useState([]); 
  const [categorias, setCategorias] = useState([]); // Aquí guardamos las categorías de la BD
  const [editingItem, setEditingItem] = useState(null);
  const [imagenArchivo, setImagenArchivo] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState(""); 
  const [filtroCategoria, setFiltroCategoria] = useState(""); 

  // --- 1. CARGA DE DATOS SIMULTÁNEA ---
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargamos productos y categorías al mismo tiempo
        const [resProductos, resCategorias] = await Promise.all([
           axios.get(`${API_PRODUCTOS}/`),
           axios.get(`${API_CATEGORIAS}/`)
        ]);

        setPlatos(Array.isArray(resProductos.data) ? resProductos.data : []);
        setCategorias(Array.isArray(resCategorias.data) ? resCategorias.data : []);

      } catch (error) {
        console.error("🔴 Error cargando datos:", error);
        setMessage({ type: "error", text: "No se pudo conectar con el servidor." });
      }
    };
    cargarDatos();
  }, []);

  // --- 2. HELPERS PARA CATEGORÍAS (CRÍTICOS) ---

  // Obtiene el ID limpio, sin importar si viene como objeto o numero
  const getCategoryId = (item) => {
    if (!item) return null;
    
    // Intentamos leer la propiedad de varias formas comunes en Django/React
    const val = item.categoria || item.categoria_id || item.category;

    // Caso A: Es un objeto (ej: { id: 5, nombre: "Bebidas" })
    if (val && typeof val === 'object') return val.id;
    
    // Caso B: Es un número o string numérico (ej: 5 o "5")
    if (val !== null && val !== undefined) return parseInt(val, 10);

    return null; 
  };

  // Obtiene el NOMBRE visible buscando en el array de categorías descargado
  const getCategoryName = (item) => {
      const catId = getCategoryId(item);
      if (!catId) return "---";

      // Comparamos como String para evitar errores de tipo (5 vs "5")
      const found = categorias.find(c => String(c.id) === String(catId));
      
      // Retornamos el nombre si existe, si no, indicamos "Desconocido" (útil para debug)
      return found ? (found.nombre || found.name) : "Desconocido";
  };

  // --- 3. FILTRADO INTELIGENTE ---
  const platosFiltrados = useMemo(() => {
    return platos.filter((dish) => {
      const texto = busqueda.toLowerCase();
      const nombre = (dish.nombre || dish.name || "").toLowerCase();
      const desc = (dish.descripcion || "").toLowerCase();
      
      const matchTexto = nombre.includes(texto) || desc.includes(texto);
      
      const catId = getCategoryId(dish);
      const matchCategoria = filtroCategoria === "" || String(catId) === String(filtroCategoria);

      return matchTexto && matchCategoria;
    });
  }, [platos, busqueda, filtroCategoria, categorias]);

  // --- 4. HANDLERS ---
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
    if (e.target.files && e.target.files[0]) {
      setImagenArchivo(e.target.files[0]);
    }
  };

  const openModal = (item = null) => {
    setMessage(null);
    setImagenArchivo(null);

    // Si no hay categorías cargadas, usamos string vacío
    const defaultCatId = categorias.length > 0 ? categorias[0].id : "";

    if (item) {
      const catId = getCategoryId(item);
      // Normalizamos disponibilidad
      const isAvail = item.available ?? item.disponible ?? item.is_available ?? true;
      
      setEditingItem({
        id: item.id,
        name: item.nombre || item.name || "", 
        descripcion: item.descripcion || "",
        price: item.precio || item.price || 0,
        category: String(catId || defaultCatId), 
        available: isAvail ? "true" : "false",
        imagen: item.imagen
      });
    } else {
      setEditingItem({
        id: null, name: "", descripcion: "", price: 0, imagen: null,
        category: String(defaultCatId), 
        available: "true", 
      });
    }
  };

  const handleSave = async () => {
    // Validaciones simples
    if (!editingItem.name.trim()) {
      setMessage({ type: "error", text: "El nombre es obligatorio." });
      return;
    }
    if (!editingItem.category) {
        setMessage({ type: "error", text: "Selecciona una categoría válida." });
        return;
    }

    const formData = new FormData();
    formData.append('nombre', editingItem.name); 
    formData.append('descripcion', editingItem.descripcion);
    formData.append('precio', editingItem.price); 
    formData.append('categoria_id', parseInt(editingItem.category, 10)); 
    
    // Convertimos booleano string a string Python compatible si es necesario, o booleano puro
    const valPython = editingItem.available === "true" ? "True" : "False";
    formData.append('disponible', valPython); 
    
    if (imagenArchivo) {
      formData.append('imagen', imagenArchivo);
    }

    try {
      const headers = { 'Content-Type': 'multipart/form-data' };
      let response;

      if (editingItem.id) {
        response = await axios.patch(`${API_PRODUCTOS}/${editingItem.id}/`, formData, { headers });
        setPlatos(prev => prev.map(p => p.id === response.data.id ? response.data : p));
        setMessage({ type: "success", text: "Plato actualizado." });
      } else {
        response = await axios.post(`${API_PRODUCTOS}/`, formData, { headers });
        setPlatos(prev => [...prev, response.data]);
        setMessage({ type: "success", text: "Plato creado." });
      }
      setEditingItem(null); 
    } catch (error) {
      console.error("Error save:", error);
      const errorData = error.response?.data;
      // Manejo de errores más legible
      const errorMsg = errorData 
        ? Object.entries(errorData).map(([k, v]) => `${k}: ${v}`).join(", ") 
        : "Error de conexión o servidor.";
      setMessage({ type: "error", text: errorMsg });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este plato?")) return;
    try {
      await axios.delete(`${API_PRODUCTOS}/${id}/`);
      setPlatos(prev => prev.filter(p => p.id !== id));
      setMessage({ type: "warning", text: "Eliminado correctamente." });
    } catch (e) { 
      setMessage({ type: "error", text: "Error al eliminar." }); 
    }
  };

  // --- RENDERIZADO ---
  return (
    // 🔥 CORRECCIÓN NAVBAR: pb-40 da suficiente espacio al final para que el NavBar no tape nada
    <div className="bg-gray-100 min-h-screen font-sans pb-40 relative">
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <MessageAlert msg={message} />
        
        {/* HEADER */}
        <div className="bg-red-800 text-white p-4 md:p-6 rounded-xl shadow-xl mb-6">
          <h1 className="text-2xl md:text-4xl font-extrabold text-center text-yellow-400 tracking-wide">
            Gestión de Productos
          </h1>
        </div>

        {/* BARRA DE CONTROL */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-md sticky top-2 z-10">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
              type="text" placeholder="🔍 Buscar plato..." 
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 w-full sm:w-64 focus:ring-2 focus:ring-red-500 outline-none transition-all"
            />
            
            {/* SELECT FILTRO DINÁMICO */}
            <select 
              value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} 
              className="border border-gray-300 rounded-lg px-4 py-3 w-full sm:w-auto bg-white focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
            >
              <option value="">📂 Todas las Categorías</option>
              {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>

          </div>
          <button 
            onClick={() => openModal(null)} 
            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>+</span> Crear Plato
          </button>
        </div>

        {/* --- VISTA MÓVIL (CARDS) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
          {platosFiltrados.length === 0 ? (
             <div className="text-center p-8 bg-white rounded-xl text-gray-500 col-span-full">
               {categorias.length === 0 ? "Cargando datos..." : "No se encontraron productos."}
             </div>
          ) : (
            platosFiltrados.map((dish) => {
              const catName = getCategoryName(dish); 
              const isAvailable = dish.available ?? dish.disponible ?? dish.is_available ?? true;

              return (
                <div key={dish.id} className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3 border border-gray-100">
                  <div className="flex gap-4">
                    <img src={dish.imagen || "https://placehold.co/80"} alt="img" className="w-20 h-20 rounded-lg object-cover bg-gray-100"/>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">{dish.nombre || dish.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dish.descripcion}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm border-t pt-2 mt-1">
                    <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {catName}
                    </span>
                    <span className="font-extrabold text-xl text-red-700">${parseFloat(dish.precio || dish.price || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center mt-1 gap-2">
                    <span className={`py-1 px-2 rounded text-[10px] font-bold uppercase tracking-wide ${
                      isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {isAvailable ? "Disponible" : "Agotado"}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(dish)} className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100">✏️</button>
                      <button onClick={() => handleDelete(dish.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100">🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- VISTA DE ESCRITORIO (TABLE) --- */}
        <div className="hidden md:block overflow-hidden bg-white rounded-xl shadow-md border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-gray-600 uppercase text-xs font-bold tracking-wider">
                <th className="py-4 px-6 text-center">Imagen</th>
                <th className="py-4 px-6 text-left">Nombre</th>
                <th className="py-4 px-6 text-left">Categoría</th>
                <th className="py-4 px-6 text-center">Precio</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
              {platosFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">
                    {categorias.length === 0 ? "Cargando..." : "No se encontraron resultados."}
                </td></tr>
              ) : (
                platosFiltrados.map((dish) => {
                  const catName = getCategoryName(dish);
                  const isAvailable = dish.available ?? dish.disponible ?? dish.is_available ?? true;

                  return (
                    <tr key={dish.id} className="hover:bg-red-50 transition-colors group">
                      <td className="py-3 px-6 text-center">
                        <img src={dish.imagen || "https://placehold.co/40"} alt="img" className="w-12 h-12 rounded-lg object-cover mx-auto shadow-sm border"/>
                      </td>
                      <td className="py-3 px-6 text-left">
                        <div className="font-bold text-gray-800 text-base">{dish.nombre || dish.name}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">{dish.descripcion}</div>
                      </td>
                      <td className="py-3 px-6 text-left">
                        <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold border border-gray-200">
                          {catName}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center font-bold text-gray-700 text-base">
                        ${parseFloat(dish.precio || dish.price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-center">
                          <span className={`py-1 px-3 rounded-full text-xs font-bold ${
                            isAvailable ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
                          }`}>
                            {isAvailable ? "DISPONIBLE" : "AGOTADO"}
                          </span>
                      </td>
                      <td className="py-3 px-6 text-center space-x-4 opacity-80 group-hover:opacity-100">
                        <button onClick={() => openModal(dish)} className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2 decoration-indigo-200 hover:decoration-indigo-600 transition-all">Editar</button>
                        <button onClick={() => handleDelete(dish.id)} className="text-red-600 hover:text-red-800 font-semibold underline decoration-2 decoration-red-200 hover:decoration-red-600 transition-all">Eliminar</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL RESPONSIVE */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
            <div className="bg-red-800 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingItem.id ? "Editar Plato" : "Crear Nuevo Plato"}</h2>
              <button onClick={() => setEditingItem(null)} className="text-white hover:text-gray-300 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="space-y-5">
                <InputField label="Nombre del Plato" name="name" value={editingItem.name} onChange={handleFormChange} placeholder="Ej. Hamburguesa Doble" />
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                    <textarea 
                        name="descripcion" value={editingItem.descripcion} onChange={handleFormChange} rows="3"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                        placeholder="Ingredientes y detalles..."
                    ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
                        {/* SELECT MODAL DINÁMICO */}
                        <select 
                            name="category" 
                            value={editingItem.category} 
                            onChange={handleFormChange} 
                            className="w-full border border-gray-300 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            {categorias.length === 0 && <option value="">Cargando...</option>}
                            {categorias.map(c => (
                                <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <InputField label="Precio ($)" name="price" type="number" value={editingItem.price} onChange={handleFormChange} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Imagen</label>
                    <div className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
                        {editingItem.imagen && !imagenArchivo && (
                            <img src={editingItem.imagen} alt="Preview" className="w-16 h-16 rounded object-cover border" />
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 cursor-pointer"/>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Disponibilidad</label>
                    <select name="available" value={editingItem.available} onChange={handleFormChange} className="w-full border border-gray-300 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                        <option value="true">✅ Disponible para ordenar</option>
                        <option value="false">⛔ Agotado temporalmente</option>
                    </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
              <button type="button" onClick={() => setEditingItem(null)} className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
              <button type="button" onClick={handleSave} className="px-5 py-2.5 bg-red-700 text-white rounded-lg hover:bg-red-800 font-bold shadow-md transition-transform active:scale-95">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      <NavBar/>
    </div>
  );
};

export default GestionMenu;
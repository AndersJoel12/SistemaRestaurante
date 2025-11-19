import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// URL base de tu API
const API_URL = 'http://localhost:8000/api/productos'; 

// CATEGORÍAS (IDs numéricos obligatorios)
const categories = [
  { id: 1, name: "Entradas" },
  { id: 2, name: "Sushi" },
  { id: 3, name: "Bebidas" },
  { id: 4, name: "Postre" },
];

const booleanOptions = [
  { label: "SÍ (Disponible)", value: "true" },
  { label: "NO (Agotado)", value: "false" },
];

const GestionMenu = () => {
  const [message, setMessage] = useState(null);
  const [platos, setPlatos] = useState([]); 
  const [editingItem, setEditingItem] = useState(null);
  const [imagenArchivo, setImagenArchivo] = useState(null);

  const [busqueda, setBusqueda] = useState(""); 
  const [filtroCategoria, setFiltroCategoria] = useState(""); 

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    const cargarPlatos = async () => {
      try {
        const response = await axios.get(API_URL);
        if (Array.isArray(response.data)) {
          setPlatos(response.data);
        } else {
          setPlatos([]);
        }
      } catch (error) {
        console.error("--- ERROR AL CARGAR ---", error);
        setMessage({ type: "error", text: "No se pudo cargar el menú." });
      }
    };
    cargarPlatos();
  }, []);

  // --- MANEJO DE INPUTS (CORREGIDO) ---
  const handleFormChange = useCallback((arg1, arg2) => {
    let name, value;
    if (arg1 && arg1.target) {
        name = arg1.target.name;
        value = arg1.target.value;
    } else {
        name = arg1;
        value = arg2;
    }
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImagenArchivo(file);
  };

  // --- FILTRADO ---
  const platosFiltrados = platos.filter((dish) => {
    const textoBuscar = busqueda.toLowerCase();
    const nombrePlato = (dish.nombre || dish.name || "").toLowerCase();
    const descPlato = (dish.descripcion || "").toLowerCase();
    const coincideTexto = nombrePlato.includes(textoBuscar) || descPlato.includes(textoBuscar);

    let rawCat = dish.categoria_id || dish.categoria || dish.category;
    let realCatID = rawCat;

    if (typeof rawCat === 'object' && rawCat !== null) realCatID = rawCat.id;
    else if (typeof rawCat === 'string' && isNaN(rawCat)) {
        const catEncontrada = categories.find(c => c.name.toLowerCase() === rawCat.toLowerCase());
        if (catEncontrada) realCatID = catEncontrada.id;
    }

    const coincideCategoria = filtroCategoria === "" || String(realCatID) === String(filtroCategoria);
    return coincideTexto && coincideCategoria;
  });

  // --- 2. GUARDADO (SOLUCIÓN "TIPO INCORRECTO") ---
  const handleSave = async (data) => {
    setMessage(null);

    if (!data.name || data.name.trim() === "") {
        setMessage({ type: "error", text: "El nombre es obligatorio." });
        return;
    }

    const formData = new FormData();
    formData.append('nombre', data.name); 
    formData.append('descripcion', data.descripcion);
    formData.append('precio', parseFloat(data.price) || 0);
    
    // --- ¡AQUÍ ESTÁ EL FIX! ---
    // Usamos parseInt() para asegurarnos de enviar un NÚMERO ENTERO (1) y no texto ("1")
    // El 10 indica base decimal.
    const catIdNumber = parseInt(data.category, 10);
    formData.append('categoria_id', catIdNumber); 
    
    formData.append('available', data.available === "true" ? "True" : "False"); 

    if (imagenArchivo) {
      formData.append('imagen', imagenArchivo);
    }

    // Debug para ver qué enviamos
    console.log(`Enviando categoria_id: ${catIdNumber} (Tipo: ${typeof catIdNumber})`);

    try {
      let response;
      if (data.id) {
        const url = `${API_URL}/${data.id}/`;
        response = await axios.put(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPlatos(prev => prev.map(item => item.id === response.data.id ? response.data : item));
        setMessage({ type: "success", text: "Plato actualizado." });
      } else {
        const url = `${API_URL}/`;
        response = await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPlatos(prev => [...prev, response.data]);
        setMessage({ type: "success", text: "Plato creado." });
      }
    } catch (error) {
      console.error("Error save:", error);
      if (error.response) {
        const errorData = error.response.data;
        console.log("DATA ERROR:", errorData);
        
        if (error.response.status === 400) {
            // Si devuelve { categoria_id: ['Error...'] }
            const key = Object.keys(errorData)[0];
            const msg = Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key];
            setMessage({ type: "error", text: `Error en ${key}: ${msg}` });
        } else {
            setMessage({ type: "error", text: `Error del servidor: ${error.response.status}` });
        }
      } else {
        setMessage({ type: "error", text: "Error de conexión." });
      }
    }
    setEditingItem(null);
    setImagenArchivo(null);
  };

  // --- HANDLERS ---
  const handleEdit = (item) => {
    setMessage(null);
    setImagenArchivo(null);
    
    let catID = item.categoria_id || item.categoria || item.category;
    if (typeof catID === 'object' && catID !== null) catID = catID.id;
    
    // Si viene texto, intentamos buscar el ID
    if (typeof catID === 'string' && isNaN(catID)) {
        const found = categories.find(c => c.name.toLowerCase() === catID.toLowerCase());
        if (found) catID = found.id;
    }

    let isAvail = true;
    if (item.available !== undefined) isAvail = item.available;
    else if (item.disponible !== undefined) isAvail = item.disponible;

    setEditingItem({
      id: item.id,
      name: item.nombre || item.name || "", 
      descripcion: item.descripcion || "",
      price: item.precio || item.price || 0,
      category: catID || categories[0].id,
      available: isAvail ? "true" : "false",
      imagen: item.imagen
    });
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm(`¿Eliminar plato ID ${itemId}?`)) return;
    try {
      await axios.delete(`${API_URL}/${itemId}/`);
      setPlatos(prev => prev.filter((item) => item.id !== itemId));
      setMessage({ type: "warning", text: "Plato eliminado." });
    } catch (error) {
      setMessage({ type: "error", text: "No se pudo eliminar." });
    }
  };

  const handleCreateNew = () => {
    setMessage(null);
    setImagenArchivo(null); 
    setEditingItem({
      id: null, name: "", descripcion: "", imagen: null,
      category: categories[0].id, price: 0, available: "true",
    });
  };

  // --- RENDER FORM ---
  const renderForm = () => {
    if (!editingItem) return null;
    const isNew = editingItem.id === null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={() => setEditingItem(null)}>
        <div className="bg-white rounded-xl shadow-2xl border-t-4 border-red-500 w-full max-w-lg overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">{isNew ? "Crear Plato" : "Editar Plato"}</h2>
            <div className="space-y-4">
              <InputField label="Nombre" name="name" value={editingItem.name} onChange={handleFormChange} />
              <InputField label="Descripción" name="descripcion" value={editingItem.descripcion} onChange={handleFormChange} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                {!isNew && editingItem.imagen && !imagenArchivo && (
                  <img src={editingItem.imagen} alt="Preview" className="w-20 h-20 rounded-md object-cover mb-2" />
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
              </div>
              <InputField label="Precio" name="price" type="number" value={editingItem.price} onChange={handleFormChange} />
              
              <InputField 
                label="Categoría" 
                name="category" 
                type="select" 
                options={categories.map((c) => ({ label: c.name, value: c.id }))} 
                value={editingItem.category} 
                onChange={handleFormChange} 
              />
              
              <InputField label="Disponibilidad" name="available" type="select" options={booleanOptions} value={editingItem.available} onChange={handleFormChange} />
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2 border rounded-lg hover:bg-gray-100">Cancelar</button>
                <button type="button" onClick={() => handleSave(editingItem)} className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 font-semibold">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER TABLE ---
  const renderTableContent = () => {
    const getCategoryName = (catValue) => {
      if (!catValue) return "---";
      const catFound = categories.find((c) => c.id == catValue);
      return catFound ? catFound.name : catValue;
    };

    return (
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-center">Imagen</th>
              <th className="py-3 px-6 text-left">Nombre</th>
              <th className="py-3 px-6 text-left">Descripción</th>
              <th className="py-3 px-6 text-left">Categoría</th>
              <th className="py-3 px-6 text-center">Precio</th>
              <th className="py-3 px-6 text-center">Disponible</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 text-sm font-light divide-y divide-gray-200">
            {platosFiltrados.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-500">
                  {platos.length === 0 ? "Cargando datos..." : "No hay platos con este filtro."}
              </td></tr>
            ) : (
              platosFiltrados.map((dish) => (
                <tr key={dish.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-center">
                    <img src={dish.imagen || "https://via.placeholder.com/40"} alt="img" className="w-10 h-10 rounded-md object-cover mx-auto"/>
                  </td>
                  <td className="py-3 px-6 text-left font-medium">{dish.nombre || dish.name}</td>
                  <td className="py-3 px-6 text-left">
                    {dish.descripcion && dish.descripcion.length > 30 ? `${dish.descripcion.substring(0, 30)}...` : dish.descripcion}
                  </td>
                  <td className="py-3 px-6 text-left">{getCategoryName(dish.categoria_id || dish.categoria || dish.category)}</td>
                  <td className="py-3 px-6 text-center">${parseFloat(dish.precio || dish.price || 0).toFixed(2)}</td>
                  <td className="py-3 px-6 text-center">
                    <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                        (dish.available !== undefined ? dish.available : (dish.disponible !== undefined ? dish.disponible : true)) ? "bg-green-200 text-green-600" : "bg-red-200 text-red-600"
                    }`}>
                      {(dish.available !== undefined ? dish.available : (dish.disponible !== undefined ? dish.disponible : true)) ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center space-x-2">
                    <button onClick={() => handleEdit(dish)} className="text-indigo-600 font-medium">Editar</button>
                    <button onClick={() => handleDelete(dish.id)} className="text-red-600 font-medium">Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <MessageAlert msg={message} />
      <div className="bg-red-800 text-white p-4 rounded-lg shadow-xl mb-6">
        <h1 className="text-3xl font-extrabold text-center text-yellow-400">Gestión de Productos</h1>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text" placeholder="🔍 Buscar plato..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64"
          />
          <select
            value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="">📂 Todas las Categorías</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <button onClick={handleCreateNew} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md w-full md:w-auto">
          + Crear Nuevo Plato
        </button>
      </div>

      {renderForm()}
      {renderTableContent()}
    </div>
  );
};

export default GestionMenu;
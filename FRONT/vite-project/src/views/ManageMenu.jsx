import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import MessageAlert from "../components/MessageAlert.jsx";
import InputField from "../components/InputField.jsx";

// --- ¡CORRECCIÓN! ---
// La URL base de tu API, sin endpoints específicos
const API_URL = 'http://127.0.0.1:8000/api/platos'; 
// Asegúrate de que tu API de Django esté corriendo en 'http://localhost:8000'

const categories = [
  { id: "entradas", name: "Entradas" },
  { id: "sushi", name: "Sushi" },
  { id: "bebidas", name: "Bebidas" },
  { id: "postre", name: "Postre" },
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

  // --- Carga con Axios y Logs ---
  useEffect(() => {
    const cargarPlatos = async () => {
      const url = `${API_URL}/platos/`;
      console.log(`[DEBUG] 1. Cargando datos desde: ${url}`);
      
      try {
        const response = await axios.get(url);
        
        console.log("[DEBUG] 2. Datos recibidos:", response.data);
        // Es buena idea verificar si es un array antes de guardarlo
        if (Array.isArray(response.data)) {
          setPlatos(response.data);
        } else {
          console.warn("[DEBUG] La API no devolvió un array. Se esperaba un array de platos.");
          setPlatos([]); // Pone un array vacío para evitar que .map() falle
        }

      } catch (error) {
        console.error("--- ¡ERROR AL CARGAR! ---");
        
        if (error.response) {
          // El servidor respondió con un error (404, 500, 403)
          console.error("[DEBUG] Error Response Data:", error.response.data);
          console.error("[DEBUG] Error Response Status:", error.response.status);
        } else if (error.request) {
          // La solicitud se hizo pero no hubo respuesta (CORS o servidor caído)
          console.error("[DEBUG] Error Request:", error.request);
          setMessage({ type: "error", text: "Error de red o CORS. Revisa la consola (F12) y la terminal de Django." });
        } else {
          // Error al configurar la solicitud
          console.error("[DEBUG] Error General:", error.message);
        }
        
        if (error.response?.status !== 404) {
          setMessage({ type: "error", text: "No se pudieron cargar los platos. Revisa la consola." });
        } else {
           setMessage({ type: "error", text: "Endpoint no encontrado (404). Revisa la URL." });
        }
      }
    };

    cargarPlatos();
  }, []);

  const handleFormChange = useCallback((name, value) => {
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("[DEBUG] Archivo seleccionado:", file ? file.name : "Ninguno");
    setImagenArchivo(file);
  };

  // --- Guardado con Axios y Logs ---
  const handleSave = async (data) => {
    setMessage(null);
    console.log("[DEBUG] 3. Intentando guardar...", data);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('descripcion', data.descripcion);
    formData.append('price', parseFloat(data.price) || 0);
    formData.append('category', data.category);
    formData.append('available', data.available === "true");

    if (imagenArchivo) {
      formData.append('imagen', imagenArchivo);
      console.log("[DEBUG] Añadiendo archivo al FormData:", imagenArchivo.name);
    } else {
      console.log("[DEBUG] No se seleccionó un archivo de imagen nuevo.");
    }

    try {
      if (data.id) {
        // --- UPDATE (PUT) ---
        const url = `${API_URL}/platos/${data.id}/`;
        console.log(`[DEBUG] 4. Actualizando (PUT) en: ${url}`);
        
        const response = await axios.put(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log("[DEBUG] 5. Actualización exitosa:", response.data);
        setPlatos(platos.map(item => item.id === response.data.id ? response.data : item));
        setMessage({ type: "success", text: `Plato "${response.data.name}" actualizado.` });

      } else {
        // --- CREATE (POST) ---
        const url = `${API_URL}/platos/`;
        console.log(`[DEBUG] 4. Creando (POST) en: ${url}`);
        
        const response = await axios.post(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log("[DEBUG] 5. Creación exitosa:", response.data);
        setPlatos([...platos, response.data]);
        setMessage({ type: "success", text: `Plato "${response.data.name}" creado.` });
      }
    } catch (error) {
      console.error("--- ¡ERROR AL GUARDAR! ---");
      if (error.response) {
        console.error("[DEBUG] Error Response Data:", error.response.data);
        console.error("[DEBUG] Error Response Status:", error.response.status);
        // Un error 400 (Bad Request) es común si falta un campo
        if(error.response.status === 400) {
           setMessage({ type: "error", text: "Error 400: Datos incorrectos. Revisa que todos los campos estén bien." });
        } else {
           setMessage({ type: "error", text: `Error del servidor (${error.response.status}). Revisa la consola.` });
        }
      } else if (error.request) {
        console.error("[DEBUG] Error Request:", error.request);
         setMessage({ type: "error", text: "Error de red o CORS al guardar." });
      } else {
        console.error("[DEBUG] Error General:", error.message);
      }
    }

    setEditingItem(null);
    setImagenArchivo(null);
  };

  const handleEdit = (item) => {
    console.log("[DEBUG] Abriendo modal para editar:", item);
    setMessage(null);
    setImagenArchivo(null);
    const itemData = {
      ...item,
      available: item.available ? "true" : "false", 
    };
    setEditingItem(itemData);
  };

  // --- Borrado con Axios y Logs ---
  const handleDelete = async (itemId) => {
    setMessage(null);
    
    if (window.confirm(`¿Seguro que quieres eliminar el Plato ID ${itemId}?`)) {
      const url = `${API_URL}/platos/${itemId}/`;
      console.log(`[DEBUG] 6. Intentando eliminar (DELETE) en: ${url}`);
      
      try {
        await axios.delete(url);
        
        console.log("[DEBUG] 7. Eliminación exitosa.");
        setPlatos(platos.filter((item) => item.id !== itemId));
        setMessage({ type: "warning", text: `Plato ID ${itemId} eliminado.` });
      
      } catch (error) {
        console.error("--- ¡ERROR AL ELIMINAR! ---");
        if (error.response) {
          console.error("[DEBUG] Error Response Data:", error.response.data);
          console.error("[DEBUG] Error Response Status:", error.response.status);
        } else if (error.request) {
          console.error("[DEBUG] Error Request:", error.request);
        } else {
          console.error("[DEBUG] Error General:", error.message);
        }
         setMessage({ type: "error", text: "No se pudo eliminar el plato." });
      }
    }
  };

  const handleCreateNew = () => {
    console.log("[DEBUG] Abriendo modal para crear nuevo plato.");
    setMessage(null);
    setImagenArchivo(null); 
    setEditingItem({
      name: "",
      descripcion: "",
      imagen: null,
      category: categories[0].id,
      price: 0,
      available: "true",
      id: null,
    });
  };

  // ... (El resto de tu código, 'renderForm' y 'renderTableContent', no cambia) ...

  const renderForm = () => {
    if (!editingItem) return null;
    
    const isNew = editingItem.id === null;
    const title = isNew ? "Crear Nuevo PLATO" : "Editar PLATO";

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
        onClick={() => {
          setEditingItem(null);
          setImagenArchivo(null);
        }} 
      >
        <div
          className="bg-white rounded-xl shadow-2xl border-t-4 border-red-500 w-full max-w-lg overflow-y-auto max-h-[90vh]"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">{title}</h2>
            <div className="space-y-4">
              <InputField
                label="Nombre del Plato"
                name="name"
                value={editingItem.name}
                onChange={handleFormChange}
              />
              <InputField
                label="Descripción"
                name="descripcion"
                value={editingItem.descripcion}
                onChange={handleFormChange}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen
                </label>
                {!isNew && editingItem.imagen && (
                  <img 
                    src={editingItem.imagen} 
                    alt={editingItem.name} 
                    className="w-20 h-20 rounded-md object-cover mb-2" 
                  />
                )}
                <input
                  type="file"
                  name="imagen"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-red-50 file:text-red-700
                    hover:file:bg-red-100"
                />
                {imagenArchivo && (
                  <span className="text-sm text-green-600">
                    Nuevo archivo: {imagenArchivo.name}
                  </span>
                )}
              </div>

              <InputField
                label="Precio"
                name="price"
                type="number"
                value={editingItem.price}
                onChange={handleFormChange}
              />
              <InputField
                label="Categoría"
                name="category"
                type="select"
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                value={editingItem.category}
                onChange={handleFormChange}
              />
              <InputField
                label="Disponibilidad"
                name="available"
                type="select"
                options={booleanOptions}
                value={editingItem.available}
                onChange={handleFormChange}
              />
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setImagenArchivo(null);
                  }}
                  className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(editingItem)}
                  className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 font-semibold transition"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTableContent = () => {
    const getCategoryName = (categoryId) => {
      const category = categories.find((c) => c.id === categoryId);
      return category ? category.name : categoryId;
    };

    return (
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
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
            {platos.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-gray-500 py-8">
                  Cargando platos o no hay datos en el servidor...
                </td>
              </tr>
            ) : (
              platos.map((dish) => (
                <tr
                  key={dish.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {dish.id}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <img
                      src={dish.imagen || "https://via.placeholder.com/40x40.png?text=Sin+Img"}
                      alt={dish.name}
                      className="w-10 h-10 rounded-md object-cover mx-auto"
                    />
                  </td>
                  <td className="py-3 px-6 text-left font-medium">
                    {dish.name}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {dish.descripcion && dish.descripcion.length > 40
                      ? `${dish.descripcion.substring(0, 40)}...`
                      : dish.descripcion}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {getCategoryName(dish.category)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    ${parseFloat(dish.price).toFixed(2)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span
                      className={`py-1 px-3 rounded-full text-xs font-semibold ${
                        dish.available
                          ? "bg-green-200 text-green-600"
                          : "bg-red-200 text-red-600"
                      }`}
                    >
                      {dish.available ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(dish)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id)}
                      className="text-red-600 hover:text-red-900 font-medium transition"
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
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <MessageAlert msg={message} />

      <div className="bg-red-800 text-white p-4 rounded-lg shadow-xl mb-6">
        <h1 className="text-3xl font-extrabold text-center text-yellow-400">
          Gestión de Productos
        </h1>
      </div>

      <div className="mb-6 flex justify-end items-center bg-white p-4 rounded-xl shadow-md space-x-3">
        <button
          onClick={handleCreateNew}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
        >
          + Crear Nuevo PLATO
        </button>
      </div>

      {renderForm()}
      {renderTableContent()}
    </div>
  );
};

export default GestionMenu;
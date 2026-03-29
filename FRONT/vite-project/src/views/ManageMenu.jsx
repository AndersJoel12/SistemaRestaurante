import React, { useState, useEffect, useCallback } from "react";
import MenuItem from "../components/MenuItem.jsx";
import InputField from "../components/InputField.jsx";

// URL base de tu API de Django
const API_URL = "http://127.0.0.1:8000/api";

// Opciones para los <select> de 'true'/'false'
const booleanOptions = [
  { label: "SÍ (Disponible)", value: "true" },
  { label: "NO (Agotado)", value: "false" },
];

const GestionMenu = ({ setMessage }) => {
  // --- Estados de Datos ---
  const [platos, setPlatos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  // --- Estados de UI ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Carga de Datos (READ) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMessage(null);
      setError(null);

      try {
        // Carga platos y categorías en paralelo
        const [platosResponse, categoriasResponse] = await Promise.all([
          fetch(`${API_URL}/productos/`),
          fetch(`${API_URL}/categorias/`),
        ]);

        if (!platosResponse.ok || !categoriasResponse.ok) {
          throw new Error("Error al cargar los datos de la API.");
        }

        const platosData = await platosResponse.json();
        const categoriasData = await categoriasResponse.json();

        setPlatos(platosData);
        setCategories(categoriasData);
      } catch (err) {
        setError(err.message);
        setMessage({ type: "error", text: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setMessage]); // Agregamos setMessage como dependencia

  // Manejador de formulario estable
  const handleFormChange = useCallback((name, value) => {
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  }, []);

  // --- Lógica CRUD (CREATE / UPDATE) ---
  const handleSave = async (data) => {
    setMessage(null);
    
    // 1. Traduce los datos del formulario a lo que espera la API de Django
    const datosParaAPI = {
      ...data,
      nombre: data.name,
      precio: parseFloat(data.price) || 0,
      disponible: data.available === "true", // Convierte a booleano real
      categoria: parseInt(data.category_id, 10), // Convierte a ID numérico
      descripcion: data.descripcion || "", // Asegura que 'descripcion' exista
    };
    
    // 2. Limpia campos que el formulario usa pero Django no
    delete datosParaAPI.name;
    delete datosParaAPI.category_id;
    delete datosParaAPI.available;

    const isNew = !datosParaAPI.id;
    const url = isNew
      ? `${API_URL}/productos/`
      : `${API_URL}/productos/${datosParaAPI.id}/`;
    const method = isNew ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaAPI),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = Object.values(errorData).join(", ");
        throw new Error(errorMsg || "Error al guardar el plato.");
      }

      const platoGuardado = await response.json();

      if (isNew) {
        // CREATE
        setPlatos((prev) => [...prev, platoGuardado]);
        setMessage({ type: "success", text: "Plato creado con éxito." });
      } else {
        // UPDATE
        setPlatos((prev) =>
          prev.map((p) => (p.id === platoGuardado.id ? platoGuardado : p))
        );
        setMessage({ type: "success", text: "Plato actualizado con éxito." });
      }
      setEditingItem(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Prepara el formulario para editar
  const handleEdit = (item) => {
    setMessage(null);
    // Traduce los datos de Django a lo que espera el formulario
    const itemData = {
      ...item,
      name: item.nombre,
      price: item.precio,
      available: item.disponible ? "true" : "false", // Convierte booleano a string
      category_id: item.categoria, // Asigna el ID de categoría
    };
    setEditingItem(itemData);
  };

  // --- Lógica CRUD (DELETE) ---
  const handleDelete = async (itemId) => {
    setMessage(null);
    if (window.confirm(`¿Seguro que quieres eliminar el Plato ID ${itemId}?`)) {
      try {
        const response = await fetch(`${API_URL}/productos/${itemId}/`, {
          method: "DELETE",
        });

        // 204 (No Content) es la respuesta exitosa estándar para DELETE
        if (!response.ok && response.status !== 204) {
          throw new Error("No se pudo eliminar el plato.");
        }

        setPlatos((prev) => prev.filter((p) => p.id !== itemId));
        setMessage({ type: "warning", text: `Plato eliminado.` });
      } catch (err) {
        setMessage({ type: "error", text: err.message });
      }
      setEditingItem(null);
    }
  };

  // Prepara el formulario para crear
  const handleCreateNew = () => {
    setMessage(null);
    setEditingItem({
      name: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      price: 0,
      available: "true",
      id: null,
    });
  };

  // --- Renderizado del Formulario ---
  const renderForm = () => {
    if (!editingItem) return null;
    const isNew = editingItem.id === null;
    const title = isNew ? "Crear Nuevo PLATO" : "Editar PLATO";

    return (
      <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl border-t-4 border-red-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">{title}</h2>
        <div className="space-y-4">
          <InputField
            label="Nombre del Plato"
            name="name"
            value={editingItem.name}
            onChange={handleFormChange}
          />
          <InputField
            label="Precio"
            name="price"
            type="number"
            value={editingItem.price}
            onChange={handleFormChange}
          />
          <InputField
            label="Categoría"
            name="category_id"
            type="select"
            options={categories.map((c) => ({ label: c.nombre, value: c.id }))}
            value={editingItem.category_id}
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
              onClick={() => setEditingItem(null)}
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
    );
  };

  // --- Renderizado de la Lista de Platos ---
  const renderTableContent = () => {
    if (loading) {
      return <p className="text-center text-gray-500 py-8">Cargando...</p>;
    }
    if (error) {
      return <p className="text-center text-red-600 font-bold py-8">{error}</p>;
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    	{platos.length === 0 ? (
      	  <p className="col-span-full text-center text-gray-500 py-8">
        	No hay platos registrados.
      	  </p>
    	) : (
      	  platos.map((dish) => (
        	<MenuItem
          	  key={dish.id}
              // **CORRECCIÓN CLAVE**: 
              // Pasa los props con los nombres que espera MenuItem.
              // Asumimos que MenuItem espera: name, price, available.
          	  dish={{
            	...dish,
            	name: dish.nombre,
            	price: dish.precio,
            	available: dish.disponible,
          	  }}
          	  isAdmin={true}
          	  onEdit={() => handleEdit(dish)}
          	  onDelete={() => handleDelete(dish.id)}
        	/>
      	  ))
    	)}
      </div>
    );
  };

  // --- Renderizado Principal del Módulo ---
  return (
    <div>
      <div className="mb-6 flex justify-end">
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
import React from "react";

// Recibimos 'category' con un valor por defecto [] para evitar errores si la API tarda.
const MenuFilterBar = ({
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  category = [], 
}) => {
  
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    // Convertimos a número si no es 'all', para que coincida con los IDs de Postgres
    const newCategory = value === 'all' ? value : Number(value);

    setActiveCategory(newCategory);
    setSearchTerm(''); // Limpiamos la búsqueda al cambiar de categoría (buena UX)
  };

  return (
    <nav className="sticky top-0 bg-red-700 p-4 shadow-lg z-20">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
        
        {/* --- CAMPO DE BÚSQUEDA --- */}
        <div className="flex-1 w-full sm:w-auto relative">
          {/* ACCESIBILIDAD 4.1.2: Label invisible vinculada con htmlFor */}
          <label htmlFor="search-input" className="sr-only">
            Buscar plato
          </label>
          
          <input
            id="search-input"
            type="text"
            placeholder="🔍 Buscar plato por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-4 bg-white border border-red-500 rounded-lg 
                       focus:ring-2 focus:ring-yellow-400 focus:outline-none 
                       transition duration-150 text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* --- SELECTOR DE CATEGORÍA --- */}
        <div className="w-full sm:w-48 relative">
          {/* ACCESIBILIDAD 4.1.2: Label invisible */}
          <label htmlFor="category-select" className="sr-only">
            Filtrar por categoría
          </label>

          <div className="relative">
            <select
              id="category-select"
              value={String(activeCategory)}
              onChange={handleCategoryChange}
              // Quitamos 'appearance-none' para que el usuario vea la flecha nativa del navegador
              // O usamos un wrapper con icono (aquí uso estilo nativo para ser Robusto)
              className="w-full p-2 border border-red-500 rounded-lg bg-white text-gray-800 
                         cursor-pointer focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            >
              {/* Opción estática que siempre debe existir */}
              <option value="all">🍽️ Todas</option>
              
              {/* Renderizado seguro: (cat) => (...) */}
              {category.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default MenuFilterBar;
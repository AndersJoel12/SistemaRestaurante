import React from "react";

const MenuFilterBar = ({
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  category,
}) => {
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    const newCategory = value === 'all' ? value : Number(value);

    setActiveCategory(newCategory);
    setSearchTerm('');
  };

  return (
    <nav className="sticky top-0 bg-red-700 p-4 shadow-lg z-20">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
        
        {/* Campo de Búsqueda */}
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar plato por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-white border border-red-500 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 transition duration-150 text-gray-800"
          />
        </div>

        {/* Selector de Categoría */}
        <div className="w-full sm:w-48">
          <select
            value={String(activeCategory)}
            onChange={handleCategoryChange}
            className="w-full p-2 border border-red-500 rounded-lg bg-white text-gray-800 appearance-none cursor-pointer"
          >
            {category.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
};

export default MenuFilterBar;
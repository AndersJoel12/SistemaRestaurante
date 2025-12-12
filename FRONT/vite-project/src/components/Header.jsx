import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// IMPORTANTE: Usamos el contexto para mantener la sesión sincronizada en tiempo real
import { useAuth } from "../context/AuthContext"; 
import Logo from "../assets/logo.png";

// Configuración de títulos fuera del componente (Mejor rendimiento)
const PAGE_TITLES = {
  "": "MENÚ",
  "menu": "MENÚ",
  "orders": "ÓRDENES DE COCINA",
  "kitchen": "PANTALLA DE COCINA",
  "tables": "GESTIÓN DE MESAS",
  "billing": "FACTURACIÓN",
  "manage-users": "ADMINISTRACIÓN USUARIOS",
  "manage-menu": "ADMINISTRACIÓN MENÚ",
  "manage-table": "ADMINISTRACIÓN MESA",
  "manage-category": "ADMINISTRACIÓN CATEGORÍA",
  "manage-billing": "ADMINISTRACIÓN FACTURAS",
  "unauthorized": "ACCESO DENEGADO"
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 1. REEMPLAZO DE SESSION STORAGE MANUAL
  // Usamos el hook useAuth. Asumimos que tu contexto expone 'user' y 'logout'.
  // Si tu contexto se llama diferente, ajusta estas variables.
  const { user, logout } = useAuth(); 
  
  const navigate = useNavigate();
  const location = useLocation();

  // 2. LÓGICA DE TÍTULO ROBUSTA
  // Obtenemos el primer segmento de la URL (ej: /menu/detalles -> menu)
  const pathSegment = location.pathname.split("/")[1] || "";
  const currentTitle = PAGE_TITLES[pathSegment.toLowerCase()] || "DATTEBAYO";

  const handleLogout = () => {
    logout(); // Usamos la función del contexto para limpiar todo limpiamente
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-red-800 shadow-xl w-full">
        <div className="w-full px-4">
          <div className="flex justify-between items-center h-16 w-full">
            
            {/* --- IZQUIERDA: LOGO --- */}
            <div className="w-1/3 flex justify-start items-center">
              <Link to="/" className="flex items-center group">
                <img
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
                  src={Logo}
                  alt="Ir al inicio"
                />
              </Link>
            </div>

            {/* --- CENTRO: TÍTULO --- */}
            <div className="flex-1 flex justify-center items-center px-2 min-w-0">
              <h1 className="text-amber-300 text-lg md:text-xl font-extrabold tracking-widest truncate drop-shadow-md">
                {currentTitle}
              </h1>
            </div>

            {/* --- DERECHA: USUARIO / MENÚ --- */}
            <div className="w-1/3 flex justify-end items-center">
              <div className="relative">
                
                {/* Botón Trigger del Menú */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  // ACCESIBILIDAD: Le decimos al navegador el estado del menú
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  aria-label="Abrir menú de usuario"
                  className="flex items-center space-x-2 text-amber-300 hover:bg-red-700/50 transition p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>

                  {/* Mostramos nombre solo si hay usuario, sino "Invitado" */}
                  <span className="hidden md:block font-bold truncate text-sm max-w-[100px]">
                    {user?.nombre || "Invitado"}
                  </span>
                  
                  {/* Pequeña flecha para indicar que es un dropdown */}
                  <svg className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {/* DROPDOWN MENU */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-fade-in-up origin-top-right">
                    
                    {/* Sección de Info del Usuario */}
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                      {user ? (
                        <>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Sesión Activa
                          </p>
                          <p className="text-gray-900 font-bold text-base truncate">
                            {user.nombre}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            {user.rol || "Staff"}
                          </span>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Estás navegando como invitado.</p>
                      )}
                    </div>

                    {/* Botones de Acción */}
                    <div className="py-2">
                      {user ? (
                         <button
                           onClick={handleLogout}
                           className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors flex items-center gap-2"
                         >
                           <span>🚪</span> Cerrar Sesión
                         </button>
                      ) : (
                        <Link 
                          to="/"
                          onClick={() => setIsMenuOpen(false)}
                          className="block w-full text-left px-5 py-3 text-sm text-blue-600 hover:bg-blue-50 font-semibold transition-colors"
                        >
                          🔑 Iniciar Sesión
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 3. BACKDROP INVISIBLE (Cierra el menú al hacer clic fuera) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default Header;
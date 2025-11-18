import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// 👈 AQUÍ ESTÁ LA IMPORTACIÓN REQUERIDA
import Logo from "../assets/logo.png";

/**
 * Cabecera simplificada con logo a la izquierda, título central dinámico
 * y menú desplegable de usuario a la derecha.
 * NOTA: El logo se importa directamente como 'Logo' desde '../assets/logo.png'.
 */
const Header = () => {
  // Ya no necesitamos 'logoSrc' como prop
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Mapeo de rutas a nombres de vista legibles
  const getPageTitle = (pathname) => {
    const pathSegment = pathname.split("/")[1] || "menu";

    const titles = {
      menu: "MENÚ",
      orders: "ÓRDENES",
      admin: "ADMIN",
      kitchen: "COCINA",
      "": "MENÚ", // Ruta raíz
    };

    return titles[pathSegment.toLowerCase()] || pathSegment.toUpperCase();
  };

  const currentTitle = getPageTitle(location.pathname);

  // Icono del Usuario
  const UserIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const handleLogout = () => {
    console.log("Cerrando sesión y redirigiendo a la ruta raíz (Home)...");
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 bg-red-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 1. SECCIÓN IZQUIERDA: LOGO IMPORTADO */}
          <div className="w-1/3 flex justify-start items-center">
            <Link to="/">
              {/* 👈 USAMOS LA VARIABLE 'Logo' IMPORTADA */}
              <img
                className="h-10 w-auto"
                src={Logo}
                alt="Logo de la Aplicación"
              />
            </Link>
          </div>

          {/* 2. SECCIÓN CENTRAL: TÍTULO DINÁMICO (DORADO) */}
          <div className="w-1/3 flex justify-center">
            <span className="text-amber-300 text-xl font-extrabold tracking-widest">
              {currentTitle}
            </span>
          </div>

          {/* 3. SECCIÓN DERECHA: Menú de Usuario (DORADO) */}
          <div className="w-1/3 flex justify-end">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-amber-300 px-3 py-2 rounded-lg hover:bg-red-700 transition"
              >
                {UserIcon}
                <span className="font-semibold">Usuario</span>
              </button>

              {/* Menú Desplegable */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-40">
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-100 hover:text-red-700 font-medium transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

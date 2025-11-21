// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [usuarioSesion, setUsuarioSesion] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sesionGuardada = sessionStorage.getItem("usuario_sesion");
    if (sesionGuardada) {
      setUsuarioSesion(JSON.parse(sesionGuardada));
    }
  }, []);

  const getPageTitle = (pathname) => {
    const pathSegment = pathname.split("/")[1] || "menu";
    const titles = {
      menu: "MENÚ",
      orders: "ÓRDENES",
      kitchen: "COCINA",
      tables: "MESAS",
      unauthorized: "NO AUTORIZADO",
      "": "MENÚ",
      // === Nuevas Vistas de Administración ===
      "manage-billing": "HISTORIAL DE FACTURAS",
      "manage-category": "GESTIÓN DE CATEGORÍAS",
      "manage-menu": "GESTIÓN DE MENÚ",
      "manage-table": "GESTIÓN DE MESAS",
      "manage-users": "GESTIÓN DE USUARIOS",
      billing: "FACTURACIÓN",
    };
    return titles[pathSegment.toLowerCase()] || pathSegment.toUpperCase();
  };

  const currentTitle = getPageTitle(location.pathname);

  const handleLogout = () => {
    sessionStorage.removeItem("usuario_sesion");
    setUsuarioSesion(null);
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-red-800 shadow-xl w-full">
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-16 w-full">
          {/* IZQUIERDA: LOGO */}
          <div className="w-1/3 flex justify-start items-center">
            <Link to="/" className="flex items-center">
              <img
                className="h-10 w-auto"
                src={Logo}
                alt="Logo de la Aplicación"
              />
            </Link>
          </div>

          {/* CENTRO: TÍTULO RESPONSIVO */}
          <div className="flex-1 flex justify-center items-center px-2 min-w-0">
            <span className="text-amber-300 text-lg md:text-xl font-extrabold tracking-widest truncate">
              {currentTitle}
            </span>
          </div>

          {/* DERECHA: USUARIO */}
          <div className="w-1/3 flex justify-end items-center">
            <div className="relative flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-amber-300 h-full hover:bg-red-700 transition p-2 rounded-lg"
              >
                {/* Ícono siempre visible */}
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

                {/* Texto: Muestra SOLO el nombre del usuario */}
                <span className="hidden md:block font-semibold truncate text-sm">
                  {usuarioSesion
                    ? `${usuarioSesion.nombre || "Usuario"}`
                    : "Invitado"}
                </span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-2 px-4 text-sm text-gray-700 border-b border-gray-200">
                    {usuarioSesion ? (
                      <>
                        <div className="text-xs text-gray-500">
                          Sesión activa como:
                        </div>
                        {/* Nombre del Usuario (Destacado) */}
                        <div className="font-bold text-red-700 text-base">
                          {usuarioSesion.nombre || "Usuario"}
                        </div>
                        {/* Rol (Detalle debajo del nombre) */}
                        <div className="text-xs text-gray-500 mt-1">
                          {usuarioSesion.rol?.toUpperCase() || "ROL"}
                        </div>
                      </>
                    ) : (
                      <div>No hay sesión activa</div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-2 px-4 text-sm text-gray-700 hover:bg-red-100 hover:text-red-700 font-medium transition-colors"
                  >
                    Cerrar Sesión
                  </button>
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

// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [usuarioSesion, setUsuarioSesion] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔐 Leer sesión al montar
  useEffect(() => {
    const sesionGuardada = sessionStorage.getItem("usuario_sesion");
    if (sesionGuardada) {
      setUsuarioSesion(JSON.parse(sesionGuardada));
    }
  }, []);

  // 🔠 Título dinámico según ruta
  const getPageTitle = (pathname) => {
    const pathSegment = pathname.split("/")[1] || "menu";
    const titles = {
      menu: "MENÚ",
      orders: "ÓRDENES",
      kitchen: "COCINA",
      tables: "MESAS",
      "manage-users": "ADMIN USUARIOS",
      "manage-menu": "ADMIN MENÚ",
      unauthorized: "NO AUTORIZADO",
      "": "MENÚ",
    };
    return titles[pathSegment.toLowerCase()] || pathSegment.toUpperCase();
  };

  const currentTitle = getPageTitle(location.pathname);

  // 🔚 Cerrar sesión
  const handleLogout = () => {
    sessionStorage.removeItem("usuario_sesion");
    setUsuarioSesion(null);
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 bg-red-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* IZQUIERDA: LOGO */}
          <div className="w-1/3 flex justify-start items-center">
            <Link to="/">
              <img
                className="h-10 w-auto"
                src={Logo}
                alt="Logo de la Aplicación"
              />
            </Link>
          </div>

          {/* CENTRO: TÍTULO */}
          <div className="w-1/3 flex justify-center">
            <span className="text-amber-300 text-xl font-extrabold tracking-widest">
              {currentTitle}
            </span>
          </div>

          {/* DERECHA: USUARIO */}
          <div className="w-1/3 flex justify-end">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-amber-300 px-3 py-2 rounded-lg hover:bg-red-700 transition"
              >
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
                <span className="font-semibold">
                  {usuarioSesion
                    ? `${usuarioSesion.rol?.toUpperCase() || "ROL"} - ${
                        usuarioSesion.nombre || "SIN CORREO"
                      }`
                    : "Invitado"}
                </span>
              </button>

              {/* MENÚ DESPLEGABLE */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-40">
                  <div className="py-2 px-4 text-sm text-gray-700 border-b border-gray-200">
                    {usuarioSesion ? (
                      <>
                        <div>Sesión activa como:</div>
                        <div className="font-bold text-red-700">
                          {usuarioSesion.rol?.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {usuarioSesion.email || "Correo no disponible"}
                        </div>
                      </>
                    ) : (
                      <div>No hay sesión activa</div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-100 hover:text-red-700 font-medium transition-colors"
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

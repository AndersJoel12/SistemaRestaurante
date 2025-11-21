import { Link, useLocation } from "react-router-dom";
import './Components.css';

function NavBar() {
  // Si quieres ocultarlo en ciertas rutas, descomenta esto:
  // const location = useLocation();
  // const hiddenRoutes = ['/kitchen', '/'];
  // if (hiddenRoutes.includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-red-800 border-t border-red-900 shadow-2xl z-50">
      
      {/* Contenedor principal centrado */}
      <div className="w-full h-16 flex items-center justify-center">
        
        {/* Grupo de enlaces: 
            - flex: Para alinearlos en fila.
            - gap-6: Espacio entre enlaces en móviles.
            - md:gap-12: Espacio más amplio en pantallas grandes.
        */}
        <div className="flex items-center gap-6 md:gap-12 text-sm md:text-base text-yellow-400 font-bold tracking-wide">
          
          <Link to="/manage-users" className="group flex flex-col items-center transition duration-300">
            {/* Efecto hover: cambia a blanco y escala un poco */}
            <span className="group-hover:text-white group-hover:scale-110 transition-transform">Usuarios</span>
          </Link>

          <Link to="/manage-menu" className="group flex flex-col items-center transition duration-300">
            <span className="group-hover:text-white group-hover:scale-110 transition-transform">Productos</span>
          </Link>

          <Link to="/manage-category" className="group flex flex-col items-center transition duration-300">
            <span className="group-hover:text-white group-hover:scale-110 transition-transform">Categorías</span>
          </Link>

          <Link to="/manage-table" className="group flex flex-col items-center transition duration-300">
            <span className="group-hover:text-white group-hover:scale-110 transition-transform">Mesas</span>
          </Link>

          <Link to="/manage-billing" className="group flex flex-col items-center transition duration-300">
            <span className="group-hover:text-white group-hover:scale-110 transition-transform">Facturación</span>
          </Link>

        </div>
      </div>
    </nav>
  );
}

export default NavBar;



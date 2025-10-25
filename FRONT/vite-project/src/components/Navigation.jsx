import { Link, useLocation } from "react-router-dom";
import './Components.css';

function NavBar() {
  // Si quieres ocultarlo en ciertas rutas, descomenta esto:
  // const location = useLocation();
  // const hiddenRoutes = ['/kitchen', '/'];
  // if (hiddenRoutes.includes(location.pathname)) return null;

  return (
  <nav className="fixed bottom-0 left-0 right-0 bg-red-800 border-t shadow-md z-50">
    <div className="max-w-screen-xl mx-auto px-4">
      <div className="grid grid-cols-4 md:flex md:justify-between items-center h-16 text-sm md:text-base text-yellow-400 font-medium">
        <Link to="/" className="flex flex-col items-center hover:text-red-600 transition py-2">
          <span>Inicio</span>
        </Link>
        <Link to="/menu" className="flex flex-col items-center hover:text-red-600 transition py-2">
          <span>Menú</span>
        </Link>
        <Link to="/orders" className="flex flex-col items-center hover:text-red-600 transition py-2">
          <span>Pedidos</span>
        </Link>
        <Link to="/kitchen" className="flex flex-col items-center hover:text-red-600 transition py-2">
          <span>Cocina</span>
        </Link>
      </div>
    </div>
  </nav>
  );
}

export default NavBar;



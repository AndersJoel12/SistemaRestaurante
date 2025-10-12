import { Link, useLocation } from "react-router-dom";
import './Components.css';

function NavBar() {
  const location = useLocation();
  const hiddenRoutes = ['/kitchen', '/'];

  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-red-800 border-t shadow-md z-50">
      <div className="flex justify-around items-center h-14 text-sm text-yellow-400 font-medium">
        <Link to="/" className="flex flex-col items-center hover:text-red-600 transition">
          <span>Inicio</span>
        </Link>
        <Link to="/menu" className="flex flex-col items-center hover:text-red-600 transition">
          <span>Menú</span>
        </Link>
        <Link to="/orders" className="flex flex-col items-center hover:text-red-600 transition">
          <span>Pedidos</span>
        </Link>
        <Link to="/kitchen" className="flex flex-col items-center hover:text-red-600 transition">
          <span>Cocina</span>
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;


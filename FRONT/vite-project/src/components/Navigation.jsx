import { Link } from "react-router-dom";
import './Components.css'

function NavBar() {
  return (
    <nav>
      <Link to="/">Inicio</Link>
      <span className="p-2"></span>
      <Link to="/menu">Menu</Link>
      <span className="p-2"></span>
      <Link to="/orders">Pedidos</Link>
      <span className="p-2"></span>
      <Link to="/kitchen">Cocina</Link>
      <span className="p-2"></span>
      <Link to="/dashboard">Dashboard</Link>
    </nav>
  );
}

export default NavBar;

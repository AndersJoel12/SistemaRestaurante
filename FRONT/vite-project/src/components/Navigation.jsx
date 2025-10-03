import { Link } from "react-router-dom";
import './Components.css'

function NavBar() {
    return(
        <nav>
            <Link to="/">Inicio</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/orders">Pedidos</Link>
            <Link to="/kitchen">Cocina</Link>
        </nav>
    )
}

export default NavBar
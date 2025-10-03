import { Link } from "react-router-dom";

function NavBar() {
    return(
        <nav>
            <Link to="/">Inicio</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/orders">Pedidos</Link>
        </nav>
    )
}

export default NavBar
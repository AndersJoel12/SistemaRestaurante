import { AuthProvider } from "./context/AuthContext.jsx";
import { Routes, Route } from "react-router-dom";


import HomePage from "./views/Home.jsx";
import Menu from "./views/Menu.jsx";
import Admin from "./views/Admin.jsx";
import Kitchen from "./views/Kitchen.jsx";
import Orders from "./views/Orders.jsx";
import Tables from "./views/Tables.jsx";

function App() {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Menu" element={<Menu />} />
          <Route path="/Admin" element={<Admin />} />
          <Route path="/Kitchen" element={<Kitchen />} />
          <Route path="/Orders" element={<Orders />} />
          <Route path="/Tables" element={<Tables />} />
        </Routes>
    </AuthProvider>
  );
}

export default App;

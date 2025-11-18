import { AuthProvider } from "./context/AuthContext.jsx"
import { Routes, Route } from "react-router-dom"

import HomePage    from "./views/Home.jsx"
import Tables      from "./views/Tables.jsx"
import Menu        from "./views/Menu.jsx"
import Orders      from "./views/Orders.jsx"
import Kitchen     from "./views/Kitchen.jsx"
import ManageUsers from "./views/ManageUsers.jsx"
import ManageMenu  from "./views/ManageMenu.jsx"


function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/manage-menu" element={<ManageMenu />} />
      </Routes> 
    </AuthProvider>
  );
}

export default App;

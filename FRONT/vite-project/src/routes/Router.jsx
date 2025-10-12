import { Routes, Route } from "react-router-dom";
import Home from "../views/Home";
import Menu from "../views/Menu";
import Orders from "../views/Orders";
import Kitchen from "../views/Kitchen";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/kitchen" element={<Kitchen />} />
    </Routes>
  );
}

export default AppRouter;

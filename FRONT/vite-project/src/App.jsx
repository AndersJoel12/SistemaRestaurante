import React, { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./views/Home"));
const Menu = lazy(() => import("./views/Menu"));
const Orders = lazy(() => import("./views/Orders"));
const Kitchen = lazy(() => import("./views/Kitchen"));
const Tables = lazy(() => import("./views/Tables"));

/*Menu de administrador*/
const ManageUsers = lazy(() => import("./views/ManageUsers"));
const ManageMenu = lazy(() => import("./views/ManageMenu"));
const ManageCategory = lazy(() => import("./views/ManageCategory"));
const ManageTable = lazy(() => import("./views/ManageTable"));

/*Personal no Autorizado*/
const Unauthorized = lazy(() => import("./views/Unauthorized.jsx"));

function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center h-screen fondoRojo text-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4"></div>
            <p className="text-lg font-semibold">Cargando vista...</p>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/manage-menu" element={<ManageMenu />} />
          <Route path="/manage-category" element={<ManageCategory />} />
          <Route path="/manage-table" element={<ManageTable />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;

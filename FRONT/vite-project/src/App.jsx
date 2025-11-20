// src/App.jsx
import React, { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx"; // ✅ Importamos el protector

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
          {/* Público */}
          <Route path="/" element={<Home />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Mesero */}
          <Route
            path="/tables"
            element={
              <ProtectedRoute
                roles={["mesero", "Mesero", "Administrador", "administrador"]}
              >
                <Tables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <ProtectedRoute
                roles={["Mesero", "mesero", "Administrador", "administrador"]}
              >
                <Menu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute
                roles={["Mesero", "mesero", "Administrador", "administrador"]}
              >
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Cocinero */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute roles={["Cocinero", "cocinero", "Ddministrador", "administrador"]}>
                <Kitchen />
              </ProtectedRoute>
            }
          />

          {/* Administración */}
          <Route
            path="/manage-users"
            element={
              <ProtectedRoute roles={["Administrador", "administrador"]}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-menu"
            element={
              <ProtectedRoute roles={["Administrador", "administrador"]}>
                <ManageMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-category"
            element={
              <ProtectedRoute roles={["Administrador", "administrador"]}>
                <ManageCategory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-table"
            element={
              <ProtectedRoute roles={["Administrador", "administrador"]}>
                <ManageTable />
              </ProtectedRoute>
            }
          />
          
          {/* Default */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;

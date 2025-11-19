import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, roles }) => {
  const usuarioSesion = JSON.parse(sessionStorage.getItem("usuario_sesion"));

  if (!usuarioSesion) return <Navigate to="/unauthorized" replace />;

  const rol = (usuarioSesion.rol || "").toLowerCase();
  const rolesNormalizados = roles.map((r) => r.toLowerCase());

  if (!rolesNormalizados.includes(rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;

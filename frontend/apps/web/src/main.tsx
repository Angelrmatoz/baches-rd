import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
// import { Dashboard } from "@/pages/Dashboard";

createRoot(document.getElementById("app")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Mock: descomenta Dashboard y cambia la ruta "/" cuando quieras ver el mapa */}
      {/* <Route path="/" element={<Dashboard />} /> */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>,
);

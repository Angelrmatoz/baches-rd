import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import "./index.css";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";

const MOCK_AUTH_KEY = "baches-mock-auth";

function isMockAuthed() {
  return sessionStorage.getItem(MOCK_AUTH_KEY) === "1";
}

/** Rutas públicas: si ya hay sesión mock, manda al mapa */
function GuestOnly() {
  if (isMockAuthed()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** Rutas privadas mock: sin sesión → login */
function RequireAuth() {
  if (!isMockAuthed()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

createRoot(document.getElementById("app")!).render(
  <BrowserRouter>
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>,
);

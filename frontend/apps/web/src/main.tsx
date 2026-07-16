import { createRoot } from "react-dom/client";
import "./index.css";
import { Dashboard } from "@/pages/Dashboard";

createRoot(document.getElementById("app")!).render(<Dashboard />);

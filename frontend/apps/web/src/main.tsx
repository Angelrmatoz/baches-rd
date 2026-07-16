import { createRoot } from "react-dom/client";
import "./index.css";
import { CivicDashboard } from "@/components/civic-dashboard";

createRoot(document.getElementById("app")!).render(<CivicDashboard />);

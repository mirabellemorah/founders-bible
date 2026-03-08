import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore saved theme style
const savedPrimary = localStorage.getItem("fb-theme-primary");
const savedGold = localStorage.getItem("fb-theme-gold");
const savedAccent = localStorage.getItem("fb-theme-accent");
if (savedPrimary) document.documentElement.style.setProperty("--primary", savedPrimary);
if (savedGold) document.documentElement.style.setProperty("--gold", savedGold);
if (savedAccent) document.documentElement.style.setProperty("--highlight", savedAccent);

createRoot(document.getElementById("root")!).render(<App />);

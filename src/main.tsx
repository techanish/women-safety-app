import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/serviceWorker";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for offline maps
if (import.meta.env.PROD || import.meta.env.DEV) {
  registerServiceWorker().then((registration) => {
    if (registration) {
      console.log('✅ Service Worker registered for offline maps');
    }
  });
}

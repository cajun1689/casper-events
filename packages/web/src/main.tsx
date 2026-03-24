import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./app.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

try {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  console.error("Failed to mount app:", err);
  rootEl.innerHTML = `
    <div style="font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:1.5rem;line-height:1.5">
      <h1 style="font-size:1.25rem;margin:0 0 0.5rem">Calendar couldn’t load</h1>
      <p style="color:#444;margin:0 0 1rem">Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R), or clear site data for this domain and reload.</p>
      <button type="button" onclick="location.reload()" style="padding:0.5rem 1rem;border-radius:0.5rem;border:none;background:#4f46e5;color:#fff;font-weight:600;cursor:pointer">Reload</button>
    </div>
  `;
}

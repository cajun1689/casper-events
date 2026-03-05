import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EmbedApp } from "./components/EmbedApp";
import type { CYHCalendarConfig } from "./types";

import embedStyles from "./embed.css?inline";

const roots = new Map<Element, Root>();

function init(config: CYHCalendarConfig): void {
  const container = document.querySelector(config.container);
  if (!container) {
    console.error(`[CYH Calendar] Container not found: ${config.container}`);
    return;
  }

  if (roots.has(container)) {
    console.warn("[CYH Calendar] Already initialized on this container. Call destroy() first.");
    return;
  }

  const shadow = container.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = embedStyles;
  shadow.appendChild(styleEl);

  const mountPoint = document.createElement("div");
  mountPoint.setAttribute("id", "cyh-embed-root");
  shadow.appendChild(mountPoint);

  const root = createRoot(mountPoint);
  root.render(createElement(EmbedApp, { config }));
  roots.set(container, root);
}

function destroy(containerSelector: string): void {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }

  if (container.shadowRoot) {
    container.shadowRoot.innerHTML = "";
  }
}

export { init, destroy };
export type { CYHCalendarConfig, EmbedEvent } from "./types";

declare global {
  interface Window {
    CYHCalendar: { init: typeof init; destroy: typeof destroy };
  }
}

if (typeof window !== "undefined") {
  window.CYHCalendar = { init, destroy };
}

import { useEffect } from "react";

const SITE = "Droptaxi Express";

function upsertMeta(selector: string, create: () => HTMLElement, set: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  set(el);
}

// Per-page <title>, meta description, canonical, OG tags and optional JSON-LD —
// Google renders the SPA, so each route page gets its own search snippet.
export function usePageMeta(title: string, description: string, jsonLd?: object) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    document.title = title.includes(SITE) ? title : `${title} | ${SITE}`;
    upsertMeta('meta[name="description"]', () => Object.assign(document.createElement("meta"), { name: "description" }), (el) =>
      el.setAttribute("content", description),
    );
    upsertMeta('meta[property="og:title"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:title");
      return m;
    }, (el) => el.setAttribute("content", document.title));
    upsertMeta('meta[property="og:description"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:description");
      return m;
    }, (el) => el.setAttribute("content", description));
    const url = `${window.location.origin}${window.location.pathname}`;
    upsertMeta('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), (el) =>
      el.setAttribute("href", url),
    );
    upsertMeta('meta[property="og:url"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:url");
      return m;
    }, (el) => el.setAttribute("content", url));

    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.pageLd = "true";
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [title, description, ld]);
}

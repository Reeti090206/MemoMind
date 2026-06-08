export function getApiBase(): string {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  
  if (typeof window !== "undefined") {
    // If the base URL is local (127.0.0.1 or localhost), check if tls_secure is enabled
    const isLocal = baseUrl.includes("127.0.0.1:8000") || baseUrl.includes("localhost:8000");
    if (isLocal) {
      try {
        const stored = localStorage.getItem("MemoMind_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.tls_secure) {
            baseUrl = baseUrl.replace("http://", "https://");
          } else {
            baseUrl = baseUrl.replace("https://", "http://");
          }
        }
      } catch (e) {
        console.warn("Failed to parse MemoMind_settings for TLS secure base URL:", e);
      }
    }
  }
  
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  return baseUrl;
}

export function getWsUrl(path: string): string {
  const apiBase = getApiBase();
  const wsProtocol = apiBase.startsWith("https://") ? "wss://" : "ws://";
  const cleanBase = apiBase.replace(/^https?:\/\//, "");
  return `${wsProtocol}${cleanBase}${path}`;
}

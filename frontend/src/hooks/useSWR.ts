import { useState, useEffect, useCallback } from "react";

const cache: Record<string, any> = {};

export function useSWR<T>(url: string | null, options: { initialData?: T } = {}) {
  const [data, setData] = useState<T | null>(() => {
    if (!url) return null;
    if (cache[url]) return cache[url];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`MemoMind_cache_${url}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          cache[url] = parsed;
          return parsed;
        }
      } catch (e) {
        console.warn("SWR cache read error:", e);
      }
    }
    return options.initialData || null;
  });

  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);
  const [isColdStarting, setIsColdStarting] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (!url) return;
    if (!isManual && !data) {
      setIsLoading(true);
    }
    setError(null);

    let coldStartTimeout = setTimeout(() => {
      setIsColdStarting(true);
    }, 2500);

    try {
      const res = await fetch(url);
      clearTimeout(coldStartTimeout);
      setIsColdStarting(false);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      
      setData(json);
      cache[url] = json;
      try {
        localStorage.setItem(`MemoMind_cache_${url}`, JSON.stringify(json));
      } catch (e) {}
      setError(null);
    } catch (err: any) {
      clearTimeout(coldStartTimeout);
      setIsColdStarting(false);
      setError(err);
      console.error(`SWR fetch error for ${url}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [url, data]);

  useEffect(() => {
    fetchData();
  }, [url]);

  const mutate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return { data, setData, isLoading, error, isColdStarting, mutate };
}

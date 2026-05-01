"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export function useApiData(path, options = {}) {
  const {
    initialData = null,
    enabled = true,
    refreshIntervalMs = 0,
    revalidateOnWindowFocus = false,
  } = options;
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(
    async ({ background = false } = {}) => {
      if (!enabled) {
        setIsLoading(false);
        setIsRefreshing(false);
        return null;
      }

      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      try {
        const result = await apiRequest(path);
        setData(result.data);
        setLastUpdated(new Date());
        return result.data;
      } catch (requestError) {
        setError(requestError.message || "Could not load data.");
        return null;
      } finally {
        if (background) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [enabled, path],
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!enabled) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const result = await apiRequest(path);

        if (isMounted) {
          setData(result.data);
          setLastUpdated(new Date());
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Could not load data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [enabled, path]);

  useEffect(() => {
    if (!enabled || !refreshIntervalMs) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      load({ background: true });
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, load, refreshIntervalMs]);

  useEffect(() => {
    if (!enabled || !revalidateOnWindowFocus) {
      return undefined;
    }

    function handleFocus() {
      load({ background: true });
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, load, revalidateOnWindowFocus]);

  return {
    data,
    setData,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh: load,
  };
}

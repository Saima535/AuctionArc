"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export function useApiData(path, options = {}) {
  const {
    initialData = null,
    enabled = true,
  } = options;
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

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

  return { data, setData, isLoading, error };
}

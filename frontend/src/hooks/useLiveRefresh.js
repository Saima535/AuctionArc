"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl, getStoredToken } from "@/lib/auth";

function parseEventBlock(block) {
  const lines = block.split("\n");
  let event = "message";
  const dataLines = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line) {
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  try {
    return {
      event,
      payload: JSON.parse(dataLines.join("\n")),
    };
  } catch {
    return null;
  }
}

export function useLiveRefresh({ channels = [], onEvent, enabled = true }) {
  const [connectionState, setConnectionState] = useState("idle");
  const [connectionError, setConnectionError] = useState("");
  const channelQuery = useMemo(
    () => channels.filter(Boolean).join(","),
    [channels],
  );

  useEffect(() => {
    if (!enabled || !channelQuery) {
      setConnectionState("idle");
      setConnectionError("");
      return undefined;
    }

    const apiBaseUrl = getApiBaseUrl();
    const token = getStoredToken();

    if (!apiBaseUrl || !token) {
      setConnectionState("idle");
      return undefined;
    }

    let isActive = true;
    let reader = null;
    let reconnectTimer = null;
    const controller = new AbortController();
    const decoder = new TextDecoder();

    async function connect() {
      setConnectionState("connecting");
      setConnectionError("");

      try {
        const response = await fetch(
          `${apiBaseUrl}/live/stream?channels=${encodeURIComponent(channelQuery)}`,
          {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok || !response.body) {
          throw new Error("Live updates are unavailable right now.");
        }

        setConnectionState("connected");
        reader = response.body.getReader();
        let buffer = "";

        while (isActive) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const block of parts) {
            const parsed = parseEventBlock(block);

            if (!parsed || parsed.event === "heartbeat" || parsed.event === "connected") {
              continue;
            }

            startTransition(() => {
              onEvent?.(parsed);
            });
          }
        }

        if (isActive) {
          throw new Error("Live updates disconnected.");
        }
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setConnectionState("reconnecting");
        setConnectionError(error.message || "Live updates disconnected.");
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      isActive = false;
      controller.abort();
      reader?.cancel().catch(() => {});
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, [channelQuery, enabled, onEvent]);

  return {
    connectionState,
    connectionError,
    isConnected: connectionState === "connected",
  };
}

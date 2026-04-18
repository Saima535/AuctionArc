export function formatCurrency(amount = 0, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactNumber(value = 0) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRelativeTime(date) {
  if (!date) {
    return "Unknown";
  }

  const diffMs = new Date(date).getTime() - Date.now();
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);

  if (absMinutes < 1) {
    return "just now";
  }

  const units = [
    { unit: "day", value: 1440 },
    { unit: "hour", value: 60 },
    { unit: "minute", value: 1 },
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const item of units) {
    if (absMinutes >= item.value || item.unit === "minute") {
      const amount = Math.round(diffMs / 60000 / item.value);
      return formatter.format(amount, item.unit);
    }
  }

  return "just now";
}

export function formatCountdown(date) {
  if (!date) {
    return "Pending";
  }

  const distance = new Date(date).getTime() - Date.now();

  if (distance <= 0) {
    return "Ended";
  }

  const totalSeconds = Math.floor(distance / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

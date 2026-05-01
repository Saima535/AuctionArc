export async function fetchPublicAuctions() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    return [];
  }

  try {
    const response = await fetch(`${apiBaseUrl}/auctions/public`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return Array.isArray(result.data) ? result.data : [];
  } catch {
    return [];
  }
}

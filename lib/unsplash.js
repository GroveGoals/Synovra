// Free-tier Unsplash search — used as a fallback when a note has no
// images of its own for "Explain this" to walk through.
export async function fetchRelevantImage(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.error("[unsplash] UNSPLASH_ACCESS_KEY is not set.");
    return null;
  }
  if (!query?.trim()) {
    console.error("[unsplash] No query provided — nothing to search for.");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[unsplash] Search request failed (${res.status}): ${detail}`);
      return null;
    }

    const data = await res.json();
    const photo = data?.results?.[0];
    if (!photo) {
      console.error(`[unsplash] No results for query: "${query}"`);
      return null;
    }

    fetch(`https://api.unsplash.com/photos/${photo.id}/download`, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    }).catch((err) => console.error("[unsplash] Download-tracking ping failed:", err));

    return {
      url: photo.urls.regular,
      photographerName: photo.user.name,
      photographerUrl: photo.user.links.html,
    };
  } catch (err) {
    console.error("[unsplash] Fetch threw an error:", err);
    return null;
  }
}

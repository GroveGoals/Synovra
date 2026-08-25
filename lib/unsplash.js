// Free-tier Unsplash search — used as a fallback when a note has no
// images of its own for "Explain this" to walk through.
export async function fetchRelevantImage(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || !query?.trim()) return null;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const photo = data?.results?.[0];
    if (!photo) return null;

    // Unsplash guidelines require pinging the download endpoint
    // whenever a photo is actually used in-app, not just previewed.
    fetch(`https://api.unsplash.com/photos/${photo.id}/download`, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    }).catch(() => {});

    return {
      url: photo.urls.regular,
      photographerName: photo.user.name,
      photographerUrl: photo.user.links.html,
    };
  } catch {
    return null;
  }
}
import { useState, useEffect, useCallback } from "react";
const load = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities?q=${encodeURIComponent(q || "")}`);
      const data = await res.json();
      if (!res.ok) {
        setCommunities([]);
        setLoading(false);
        return;
      }
      setCommunities(data.communities || []);
    } catch (err) {
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, []);
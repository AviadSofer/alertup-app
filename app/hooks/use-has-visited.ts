import { useState, useEffect } from "react";

const HAS_VISITED_KEY = "stockup_has_visited";

/**
 * Custom hook to track if the user has visited the app before.
 * Returns true if it's a repeat visit, false if it's the first time.
 * Persists state in localStorage.
 */
export function useHasVisited() {
  const [hasVisited, setHasVisited] = useState<boolean>(true); // Default to true (collapsed) during SSR and before check

  useEffect(() => {
    const storedValue = localStorage.getItem(HAS_VISITED_KEY);
    
    if (storedValue === "true") {
      setHasVisited(true);
    } else {
      setHasVisited(false);
      // Mark as visited so next time it's true
      localStorage.setItem(HAS_VISITED_KEY, "true");
    }
  }, []);

  return hasVisited;
}

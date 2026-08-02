import { useEffect, useState } from "react";

export function useCanHover(): boolean {
  const [canHover, setCanHover] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(hover: hover)");
    const sync = () => setCanHover(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return canHover;
}

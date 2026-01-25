import { useEffect, useState } from "react";

const useAboveBreakpoint = (breakpoint = "md") => {
  const [isAbove, setIsAbove] = useState(false);

  useEffect(() => {
    // Tailwind breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px
    const breakpoints: { [key: string]: string } = {
      sm: "(min-width: 640px)",
      md: "(min-width: 768px)",
      lg: "(min-width: 1024px)",
      xl: "(min-width: 1280px)",
    };

    const mediaQuery = window.matchMedia(breakpoints[breakpoint]);
    setIsAbove(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsAbove(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [breakpoint]);

  return isAbove;
};

export default useAboveBreakpoint;

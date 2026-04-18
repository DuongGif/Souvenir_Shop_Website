import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const prevPathnameRef = useRef(pathname);
  const prevSearchRef = useRef(search);

  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    const prevSearch = prevSearchRef.current;

    const pathnameChanged = prevPathname !== pathname;
    const searchChanged = prevSearch !== search;

    // Nếu đổi trang thật sự thì scroll lên đầu
    if (pathnameChanged) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
    // Nếu chỉ đổi query string ở trang khác products thì vẫn scroll
    else if (searchChanged && pathname !== "/products") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    prevPathnameRef.current = pathname;
    prevSearchRef.current = search;
  }, [pathname, search]);

  return null;
}
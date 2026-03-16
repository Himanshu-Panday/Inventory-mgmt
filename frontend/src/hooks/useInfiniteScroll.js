import { useEffect, useRef, useState } from "react";

const useInfiniteScroll = (total, step = 50) => {
  const [visibleCount, setVisibleCount] = useState(step);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(step);
  }, [total, step]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + step, total));
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [total, step]);

  return { visibleCount, sentinelRef };
};

export default useInfiniteScroll;

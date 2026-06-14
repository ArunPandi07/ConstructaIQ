import { useEffect, useState } from "react";

type AnimationType = "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  animation?: AnimationType;
  delay?: number;
  triggerOnce?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = "0px 0px -40px 0px",
  animation = "fade-up",
  delay = 0,
  triggerOnce = true,
}: UseScrollAnimationOptions = {}) {
  const [node, setNode] = useState<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(node);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold, rootMargin, triggerOnce]);

  const animClass = `animate-${animation}`;

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "none" : getTransform(animation),
    transition: `opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)`,
    transitionDelay: `${delay}ms`,
  };

  return { ref: setNode, isVisible, style, className: isVisible ? animClass : "" };
}

function getTransform(animation: AnimationType): string {
  switch (animation) {
    case "fade-up": return "translateY(24px)";
    case "scale-in": return "scale(0.92)";
    case "slide-left": return "translateX(24px)";
    case "slide-right": return "translateX(-24px)";
    default: return "translateY(24px)";
  }
}

export function useStaggeredAnimation<T extends HTMLElement = HTMLDivElement>(
  count: number,
  options: UseScrollAnimationOptions & { baseDelay?: number } = {},
) {
  const { baseDelay = 80, threshold = 0.05, rootMargin = "0px 0px -40px 0px" } = options;
  const [containerNode, setContainerNode] = useState<T | null>(null);
  const [containerVisible, setContainerVisible] = useState(false);

  useEffect(() => {
    if (!containerNode) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setContainerVisible(true);
          observer.unobserve(containerNode);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(containerNode);
    return () => observer.disconnect();
  }, [containerNode, threshold, rootMargin]);

  const itemStyles = Array.from({ length: count }, (_, i) => ({
    opacity: containerVisible ? 1 : 0,
    transform: containerVisible ? "none" : "translateY(20px)",
    transition: `opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)`,
    transitionDelay: `${i * baseDelay}ms`,
  }));

  return { containerRef: setContainerNode, containerVisible, itemStyles };
}

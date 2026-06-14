import { Variants } from "framer-motion";

export const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];

export const weekSlideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { duration: 0.18, ease: easeOutQuart },
      opacity: { duration: 0.18, ease: easeOutQuart },
      scale: { duration: 0.18, ease: easeOutQuart },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
    position: "absolute",
    width: "100%",
    transition: {
      x: { duration: 0.18, ease: easeOutQuart },
      opacity: { duration: 0.18, ease: easeOutQuart },
      scale: { duration: 0.18, ease: easeOutQuart },
    },
  }),
};

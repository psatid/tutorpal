import { Variants } from "framer-motion";

export const INITIAL_BUFFER_DAYS = 7;
export const LOAD_MORE_DAYS = 7;

export const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

export const weekdayItemVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: easeOut,
    },
  },
};

export const calendarContainerVariants: Variants = {
  hidden: { opacity: 0, y: -15, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.1,
      ease: easeOut,
      when: "beforeChildren",
      staggerChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.96,
    transition: {
      duration: 0.2,
      ease: easeOut,
      when: "afterChildren",
    },
  },
};

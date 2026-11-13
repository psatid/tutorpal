import type { Transition } from "motion/react";

export const modalEnterTransition = {
  duration: 0.2,
  ease: "easeOut",
} satisfies Transition;

export const modalExitTransition = {
  duration: 0.15,
  ease: "easeIn",
} satisfies Transition;

export const modalPopupFrom = "top" as const;

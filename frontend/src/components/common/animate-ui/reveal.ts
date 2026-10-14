import type { Transition } from 'framer-motion';

export const CONTENT_REVEAL_INITIAL = {
  opacity: 0,
  filter: 'blur(4px)',
} as const;

export const CONTENT_REVEAL_ANIMATE = {
  opacity: 1,
  filter: 'blur(0px)',
} as const;

export const CONTENT_REVEAL_EXIT = {
  opacity: 0,
  filter: 'blur(4px)',
} as const;

export const CONTENT_REVEAL_TRANSITION: Transition = {
  duration: 0.5,
  ease: 'easeInOut',
};

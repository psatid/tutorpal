import {
  motion,
  useIsPresent,
  useReducedMotion,
  type HTMLMotionProps,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CONTENT_REVEAL_ANIMATE,
  CONTENT_REVEAL_EXIT,
  CONTENT_REVEAL_INITIAL,
  CONTENT_REVEAL_TRANSITION,
} from '@/components/ui/animate-ui/reveal';

type ContentRevealProps = Omit<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'exit' | 'transition' | 'aria-hidden' | 'inert'
>;

function ContentReveal({ className, style, ...props }: ContentRevealProps) {
  const isPresent = useIsPresent();
  const prefersReducedMotion = useReducedMotion() === true;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : CONTENT_REVEAL_INITIAL}
      animate={CONTENT_REVEAL_ANIMATE}
      exit={CONTENT_REVEAL_EXIT}
      transition={
        prefersReducedMotion ? { duration: 0 } : CONTENT_REVEAL_TRANSITION
      }
      aria-hidden={isPresent ? undefined : true}
      inert={isPresent ? undefined : true}
      style={{
        ...style,
        pointerEvents: isPresent ? style?.pointerEvents : 'none',
      }}
      className={cn('min-w-0', className)}
      {...props}
    />
  );
}

export { ContentReveal, type ContentRevealProps };

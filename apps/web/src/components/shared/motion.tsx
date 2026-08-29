'use client';

import { type Variants, motion, useReducedMotion } from 'motion/react';
import type * as React from 'react';

const MOTION_EASING = [0.4, 0, 0.2, 1] as const;
const DURATION = 0.4;

type MotionDivProps = React.ComponentProps<typeof motion.div>;

/** Fade + slide-up on mount. Honors prefers-reduced-motion. */
export function FadeIn({ children, className, ...props }: MotionDivProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION, ease: MOTION_EASING }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: MOTION_EASING } },
};

/** Container that staggers its <StaggerItem> children when scrolled into view. */
export function StaggerContainer({ children, className, ...props }: MotionDivProps) {
  const reduce = useReducedMotion();
  const inViewProps = reduce
    ? {}
    : ({ whileInView: 'visible', viewport: { once: true, amount: 0.15 } } as const);
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial={reduce ? false : 'hidden'}
      {...inViewProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }: MotionDivProps) {
  const reduce = useReducedMotion();
  const itemProps = reduce ? {} : { variants: itemVariants };
  return (
    <motion.div className={className} {...itemProps} {...props}>
      {children}
    </motion.div>
  );
}

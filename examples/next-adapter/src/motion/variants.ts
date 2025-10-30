import { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const fadeInUpReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const scaleInReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const stagger = (delay = 0.08): Variants => ({
  visible: {
    transition: {
      staggerChildren: delay,
    },
  },
});

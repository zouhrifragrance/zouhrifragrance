"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "bas" | "gauche" | "droite";

const conteneur: Variants = {
  cache: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const variantes: Record<Direction, Variants> = {
  bas: {
    cache: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  },
  gauche: {
    cache: { opacity: 0, x: -44 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  },
  droite: {
    cache: { opacity: 0, x: 44 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  },
};

interface ApparitionProps {
  children: ReactNode;
  className?: string;
}

interface ApparitionElementProps extends ApparitionProps {
  direction?: Direction;
}

export function ApparitionGroupe({ children, className }: ApparitionProps) {
  const reduire = useReducedMotion();

  if (reduire) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={conteneur}
      initial="cache"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function ApparitionElement({
  children,
  className,
  direction = "bas",
}: ApparitionElementProps) {
  const reduire = useReducedMotion();

  if (reduire) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={variantes[direction]}>
      {children}
    </motion.div>
  );
}

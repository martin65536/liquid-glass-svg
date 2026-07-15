"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useInteractiveHighlight — faithful port of
 * `app/.../catalog/utils/InteractiveHighlight.kt`.
 *
 * Tracks press progress (a spring 0→1 while the pointer is down) and the
 * current pointer position relative to the press start (the `offset`). These
 * drive the LiquidButton layer block (tanh translation + asymmetric drag
 * scale + press scale) and the radial highlight glow.
 *
 * Springs are approximated with requestAnimationFrame tweens toward the
 * target value (the original uses Compose `Animatable` with
 * `spring(dampingRatio, stiffness, visibilityThreshold)`).
 */

// spring(dampingRatio=0.5f, stiffness=300f) — a soft, slightly bouncy spring,
// approximated as a per-frame lerp factor.
const SPRING = 0.18;

export interface InteractiveHighlight {
  /** 0..1 — how pressed-in the element is right now. */
  pressProgress: number;
  /** Drag offset from the press start (px), already spring-smoothed. */
  offset: { x: number; y: number };
  /** Whether the pointer is currently down. */
  pressing: boolean;
  /** Latest pointer position relative to the element (for the radial glow). */
  position: { x: number; y: number };
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

export function useInteractiveHighlight(): InteractiveHighlight {
  const [pressing, setPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // raw pointer state (mutable, not React state)
  const startRef = useRef({ x: 0, y: 0 });
  const rawPosRef = useRef({ x: 0, y: 0 });
  const pressingRef = useRef(false);
  // animated values
  const pressRef = useRef(0);
  const posAnimRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // One persistent rAF loop that runs whenever there is animation work to do.
  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      const pressTarget = pressingRef.current ? 1 : 0;
      const posTarget = pressingRef.current
        ? rawPosRef.current
        : startRef.current;

      pressRef.current += (pressTarget - pressRef.current) * SPRING;
      posAnimRef.current.x += (posTarget.x - posAnimRef.current.x) * SPRING;
      posAnimRef.current.y += (posTarget.y - posAnimRef.current.y) * SPRING;

      const stop =
        Math.abs(pressTarget - pressRef.current) < 0.001 &&
        Math.abs(posTarget.x - posAnimRef.current.x) < 0.5 &&
        Math.abs(posTarget.y - posAnimRef.current.y) < 0.5;
      if (stop) {
        pressRef.current = pressTarget;
        posAnimRef.current = { x: posTarget.x, y: posTarget.y };
      }

      setPressProgress(pressRef.current);
      setOffset({
        x: posAnimRef.current.x - startRef.current.x,
        y: posAnimRef.current.y - startRef.current.y,
      });
      setPosition({ x: posAnimRef.current.x, y: posAnimRef.current.y });

      if (!stop) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    // kick the loop; it self-terminates when settled.
    const kick = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };
    // expose kick via a ref so handlers can start the loop.
    kickRef.current = kick;

    return () => {
      mounted = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const kickRef = useRef<() => void>(() => {});

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    startRef.current = { x: p.x, y: p.y };
    rawPosRef.current = { x: p.x, y: p.y };
    posAnimRef.current = { x: p.x, y: p.y };
    pressingRef.current = true;
    setPressing(true);
    setPressProgress(0);
    setOffset({ x: 0, y: 0 });
    setPosition({ x: p.x, y: p.y });
    kickRef.current();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pressingRef.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    rawPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!pressingRef.current) return;
    pressingRef.current = false;
    setPressing(false);
    kickRef.current();
  }, []);

  return {
    pressProgress,
    offset,
    pressing,
    position,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

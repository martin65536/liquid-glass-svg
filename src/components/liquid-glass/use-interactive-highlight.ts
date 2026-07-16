"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useInteractiveHighlight — faithful port of
 * `app/.../catalog/utils/InteractiveHighlight.kt`.
 *
 * Uses a real underdamped spring simulation to match Compose's
 * `spring(dampingRatio = 0.5f, stiffness = 300f)` — i.e. the press progress
 * and pointer position overshoot and oscillate before settling, giving the
 * signature bouncy liquid-glass feel.
 *
 * The press/drag layer block (tanh translation + asymmetric drag scale + press
 * bulge) is computed by the consumer (LiquidButton).
 */

// Spring constants matching Compose spring(dampingRatio=0.5, stiffness=300).
const STIFFNESS = 300;
const DAMPING_RATIO = 0.5;
const MASS = 1;
const DAMPING = 2 * DAMPING_RATIO * Math.sqrt(STIFFNESS * MASS); // ≈ 17.32
const DT = 1 / 60;

/** Integrate one spring step (semi-implicit Euler). Returns [newPos, newVel]. */
function springStep(
  pos: number,
  vel: number,
  target: number,
): [number, number] {
  const force = -STIFFNESS * (pos - target) - DAMPING * vel;
  const acc = force / MASS;
  const newVel = vel + acc * DT;
  const newPos = pos + newVel * DT;
  return [newPos, newVel];
}

export interface InteractiveHighlight {
  /** 0..~1.15 — how pressed-in the element is (may overshoot). */
  pressProgress: number;
  /** Drag offset from the press start (px), spring-smoothed. */
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

  // raw pointer state
  const startRef = useRef({ x: 0, y: 0 });
  const rawPosRef = useRef({ x: 0, y: 0 });
  const pressingRef = useRef(false);
  // spring-simulated values + velocities
  const pressRef = useRef(0);
  const pressVelRef = useRef(0);
  const posRef = useRef({ x: 0, y: 0 });
  const posVelRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // One persistent rAF loop running the spring simulation.
  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      const pressTarget = pressingRef.current ? 1 : 0;
      const posTarget = pressingRef.current
        ? rawPosRef.current
        : startRef.current;

      // Spring-integrate press progress.
      [pressRef.current, pressVelRef.current] = springStep(
        pressRef.current,
        pressVelRef.current,
        pressTarget,
      );
      // Spring-integrate position (x and y independently).
      let nx: number;
      let nvx: number;
      [nx, nvx] = springStep(posRef.current.x, posVelRef.current.x, posTarget.x);
      let ny: number;
      let nvy: number;
      [ny, nvy] = springStep(posRef.current.y, posVelRef.current.y, posTarget.y);
      posRef.current = { x: nx, y: ny };
      posVelRef.current = { x: nvx, y: nvy };

      setPressProgress(pressRef.current);
      setOffset({
        x: posRef.current.x - startRef.current.x,
        y: posRef.current.y - startRef.current.y,
      });
      setPosition({ x: posRef.current.x, y: posRef.current.y });

      // Stop when both springs have settled.
      const pressSettled =
        Math.abs(pressTarget - pressRef.current) < 0.001 &&
        Math.abs(pressVelRef.current) < 0.01;
      const posSettled =
        Math.abs(posTarget.x - posRef.current.x) < 0.1 &&
        Math.abs(posTarget.y - posRef.current.y) < 0.1 &&
        Math.abs(posVelRef.current.x) < 1 &&
        Math.abs(posVelRef.current.y) < 1;
      if (pressSettled && posSettled) {
        pressRef.current = pressTarget;
        posRef.current = { x: posTarget.x, y: posTarget.y };
        pressVelRef.current = 0;
        posVelRef.current = { x: 0, y: 0 };
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const kick = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };
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
    posRef.current = { x: p.x, y: p.y };
    posVelRef.current = { x: 0, y: 0 };
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

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pressingRef.current) return;
      pressingRef.current = false;
      setPressing(false);
      kickRef.current();
    },
    [],
  );

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

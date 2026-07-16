"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useDampedDragAnimation — faithful port of
 * `app/.../catalog/utils/DampedDragAnimation.kt`.
 *
 * Runs five independent spring simulations (matching the original's five
 * `Animatable` instances with their specific spring specs):
 *
 *   value          spring(1f, 1000f, visThreshold)   — drag value (0..1)
 *   velocity       spring(0.5f, 300f, visThreshold*10)— tracked velocity
 *   pressProgress  spring(1f, 1000f, 0.001)          — 0→1 press
 *   scaleX         spring(0.6f, 250f, 0.001)         — press scale X
 *   scaleY         spring(0.7f, 250f, 0.001)         — press scale Y
 *
 * The drag gesture (pointer down/move/up) drives `onDrag(deltaX)`, which the
 * consumer maps to value changes. `press()`/`release()` animate the press
 * progress and scale springs.
 */

// Spring integration (semi-implicit Euler). Compose's spring(dampingRatio,
// stiffness) maps to: damping = 2*dampingRatio*sqrt(stiffness*mass),
// force = -stiffness*(pos-target) - damping*vel, mass=1.
const DT = 1 / 60;

function springStep(
  pos: number,
  vel: number,
  target: number,
  stiffness: number,
  dampingRatio: number,
): [number, number] {
  const damping = 2 * dampingRatio * Math.sqrt(stiffness);
  const force = -stiffness * (pos - target) - damping * vel;
  const newVel = vel + (force / 1) * DT;
  const newPos = pos + newVel * DT;
  return [newPos, newVel];
}

const SPRINGS = {
  value: { stiffness: 1000, dampingRatio: 1 }, // critically damped
  velocity: { stiffness: 300, dampingRatio: 0.5 }, // underdamped
  press: { stiffness: 1000, dampingRatio: 1 },
  scaleX: { stiffness: 250, dampingRatio: 0.6 },
  scaleY: { stiffness: 250, dampingRatio: 0.7 },
} as const;

export interface DampedDragAnimation {
  /** Current drag value (0..1). */
  value: number;
  /** 0..1 press progress. */
  pressProgress: number;
  /** Current X scale (springs from 1 → pressedScale on press). */
  scaleX: number;
  /** Current Y scale. */
  scaleY: number;
  /** Tracked velocity (normalized). */
  velocity: number;
  /** Begin a press (pointer down). */
  press: () => void;
  /** End a press (pointer up / cancel). */
  release: () => void;
  /** Animate the value to a target (e.g. programmatic toggle). */
  animateToValue: (v: number) => void;
  /** Update the drag value from a pointer delta (clamped 0..1). */
  updateValue: (v: number) => void;
  /** Pointer-down handler to attach to the knob. */
  onPointerDown: (e: React.PointerEvent) => void;
  /** Pointer-up handler. */
  onPointerUp: (e: React.PointerEvent) => void;
}

export function useDampedDragAnimation(opts: {
  initialValue: number;
  pressedScale: number;
  onDragStarted?: () => void;
  onDragStopped?: () => void;
  onDrag?: (deltaX: number) => void;
}): DampedDragAnimation {
  const { initialValue, pressedScale, onDragStarted, onDragStopped, onDrag } = opts;

  const [value, setValue] = useState(initialValue);
  const [pressProgress, setPressProgress] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [velocity, setVelocity] = useState(0);

  // Refs for the simulation.
  const valueRef = useRef(initialValue);
  const valueVelRef = useRef(0);
  const velocityRef = useRef(0);
  const velocityVelRef = useRef(0);
  const pressRef = useRef(0);
  const pressVelRef = useRef(0);
  const scaleXRef = useRef(1);
  const scaleXVelRef = useRef(0);
  const scaleYRef = useRef(1);
  const scaleYVelRef = useRef(0);
  // targets
  const valueTargetRef = useRef(initialValue);
  const pressTargetRef = useRef(0);
  const scaleXTargetRef = useRef(1);
  const scaleYTargetRef = useRef(1);
  const velocityTargetRef = useRef(0);

  const pressingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastValuePosRef = useRef({ x: initialValue, t: 0 });

  const kick = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
  }, []);

  function tick() {
    // Integrate all five springs.
    [valueRef.current, valueVelRef.current] = springStep(
      valueRef.current,
      valueVelRef.current,
      valueTargetRef.current,
      SPRINGS.value.stiffness,
      SPRINGS.value.dampingRatio,
    );
    [velocityRef.current, velocityVelRef.current] = springStep(
      velocityRef.current,
      velocityVelRef.current,
      velocityTargetRef.current,
      SPRINGS.velocity.stiffness,
      SPRINGS.velocity.dampingRatio,
    );
    [pressRef.current, pressVelRef.current] = springStep(
      pressRef.current,
      pressVelRef.current,
      pressTargetRef.current,
      SPRINGS.press.stiffness,
      SPRINGS.press.dampingRatio,
    );
    [scaleXRef.current, scaleXVelRef.current] = springStep(
      scaleXRef.current,
      scaleXVelRef.current,
      scaleXTargetRef.current,
      SPRINGS.scaleX.stiffness,
      SPRINGS.scaleX.dampingRatio,
    );
    [scaleYRef.current, scaleYVelRef.current] = springStep(
      scaleYRef.current,
      scaleYVelRef.current,
      scaleYTargetRef.current,
      SPRINGS.scaleY.stiffness,
      SPRINGS.scaleY.dampingRatio,
    );

    setValue(valueRef.current);
    setVelocity(velocityRef.current);
    setPressProgress(pressRef.current);
    setScaleX(scaleXRef.current);
    setScaleY(scaleYRef.current);

    // Settled?
    const settled =
      Math.abs(valueTargetRef.current - valueRef.current) < 0.0005 &&
      Math.abs(valueVelRef.current) < 0.005 &&
      Math.abs(velocityTargetRef.current - velocityRef.current) < 0.05 &&
      Math.abs(velocityVelRef.current) < 0.5 &&
      Math.abs(pressTargetRef.current - pressRef.current) < 0.0005 &&
      Math.abs(pressVelRef.current) < 0.005 &&
      Math.abs(scaleXTargetRef.current - scaleXRef.current) < 0.0005 &&
      Math.abs(scaleXVelRef.current) < 0.005 &&
      Math.abs(scaleYTargetRef.current - scaleYRef.current) < 0.0005 &&
      Math.abs(scaleYVelRef.current) < 0.005;
    if (settled) {
      valueRef.current = valueTargetRef.current;
      pressRef.current = pressTargetRef.current;
      scaleXRef.current = scaleXTargetRef.current;
      scaleYRef.current = scaleYTargetRef.current;
      rafRef.current = null;
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const press = useCallback(() => {
    pressingRef.current = true;
    pressTargetRef.current = 1;
    scaleXTargetRef.current = pressedScale;
    scaleYTargetRef.current = pressedScale;
    kick();
  }, [pressedScale, kick]);

  const release = useCallback(() => {
    pressingRef.current = false;
    pressTargetRef.current = 0;
    scaleXTargetRef.current = 1;
    scaleYTargetRef.current = 1;
    velocityTargetRef.current = 0;
    kick();
  }, [kick]);

  const updateValue = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      valueTargetRef.current = clamped;
      // Track velocity from value position over time (VelocityTracker).
      const now = performance.now();
      const dt = (now - lastValuePosRef.current.t) / 1000;
      if (dt > 0.001) {
        const instVel = (clamped - lastValuePosRef.current.x) / dt;
        velocityTargetRef.current = Math.max(
          -5,
          Math.min(5, instVel),
        );
        lastValuePosRef.current = { x: clamped, t: now };
      }
      kick();
    },
    [kick],
  );

  const animateToValue = useCallback(
    (v: number) => {
      press();
      valueTargetRef.current = Math.max(0, Math.min(1, v));
      // release after the value settles will be handled by the consumer via
      // release(); but for a programmatic animate, we release immediately
      // after setting the target (the value spring runs concurrently).
      setTimeout(() => release(), 0);
    },
    [press, release],
  );

  // Pointer handlers for the drag gesture.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      lastValuePosRef.current = { x: valueRef.current, t: performance.now() };
      onDragStarted?.();
      press();
    },
    [onDragStarted, press],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      onDragStopped?.();
      release();
    },
    [onDragStopped, release],
  );

  // Expose onDrag via a ref so the consumer can feed drag deltas.
  const dragHandlerRef = useRef(onDrag);
  dragHandlerRef.current = onDrag;

  return {
    value,
    pressProgress,
    scaleX,
    scaleY,
    velocity,
    press,
    release,
    animateToValue,
    updateValue,
    onPointerDown,
    onPointerUp,
  };
}

/** Helper: attach a pointer-move drag handler that calls onDrag(deltaX). */
export function attachDragHandler(
  el: HTMLElement,
  onDrag: (deltaX: number) => void,
  onDragEnd: () => void,
) {
  let lastX = 0;
  let dragging = false;
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    onDrag(dx);
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    onDragEnd();
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  el.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
}

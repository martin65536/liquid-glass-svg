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
 */

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
  const newVel = vel + force * DT;
  const newPos = pos + newVel * DT;
  return [newPos, newVel];
}

const SPRINGS = {
  value: { stiffness: 1000, dampingRatio: 1 },
  velocity: { stiffness: 300, dampingRatio: 0.5 },
  press: { stiffness: 1000, dampingRatio: 1 },
  scaleX: { stiffness: 250, dampingRatio: 0.6 },
  scaleY: { stiffness: 250, dampingRatio: 0.7 },
} as const;

export interface DampedDragAnimation {
  value: number;
  pressProgress: number;
  scaleX: number;
  scaleY: number;
  velocity: number;
  press: () => void;
  release: () => void;
  animateToValue: (v: number) => void;
  updateValue: (v: number) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onDrag?: (deltaX: number) => void;
}

export function useDampedDragAnimation(opts: {
  initialValue: number;
  pressedScale: number;
  onDragStarted?: () => void;
  onDragStopped?: () => void;
  onDrag?: (deltaX: number) => void;
}): DampedDragAnimation {
  const { initialValue, pressedScale } = opts;

  const [value, setValue] = useState(initialValue);
  const [pressProgress, setPressProgress] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [velocity, setVelocity] = useState(0);

  // Simulation state (mutable refs — no re-render on each integration).
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
  const valueTargetRef = useRef(initialValue);
  const pressTargetRef = useRef(0);
  const scaleXTargetRef = useRef(1);
  const scaleYTargetRef = useRef(1);
  const velocityTargetRef = useRef(0);
  const lastValuePosRef = useRef({ x: initialValue, t: 0 });
  const rafRef = useRef<number | null>(null);
  const pressedScaleRef = useRef(pressedScale);
  useEffect(() => {
    pressedScaleRef.current = pressedScale;
  }, [pressedScale]);

  // Keep the latest onDrag/onDragStopped/onDragStarted callbacks in refs so the
  // pointer handlers (stable) always call the freshest version.
  const onDragRef = useRef(opts.onDrag);
  const onDragStartedRef = useRef(opts.onDragStarted);
  const onDragStoppedRef = useRef(opts.onDragStopped);
  useEffect(() => {
    onDragRef.current = opts.onDrag;
    onDragStartedRef.current = opts.onDragStarted;
    onDragStoppedRef.current = opts.onDragStopped;
  });

  // One persistent rAF loop running the spring simulation. It self-terminates
  // when all springs have settled.
  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      [valueRef.current, valueVelRef.current] = springStep(
        valueRef.current, valueVelRef.current, valueTargetRef.current,
        SPRINGS.value.stiffness, SPRINGS.value.dampingRatio,
      );
      [velocityRef.current, velocityVelRef.current] = springStep(
        velocityRef.current, velocityVelRef.current, velocityTargetRef.current,
        SPRINGS.velocity.stiffness, SPRINGS.velocity.dampingRatio,
      );
      [pressRef.current, pressVelRef.current] = springStep(
        pressRef.current, pressVelRef.current, pressTargetRef.current,
        SPRINGS.press.stiffness, SPRINGS.press.dampingRatio,
      );
      [scaleXRef.current, scaleXVelRef.current] = springStep(
        scaleXRef.current, scaleXVelRef.current, scaleXTargetRef.current,
        SPRINGS.scaleX.stiffness, SPRINGS.scaleX.dampingRatio,
      );
      [scaleYRef.current, scaleYVelRef.current] = springStep(
        scaleYRef.current, scaleYVelRef.current, scaleYTargetRef.current,
        SPRINGS.scaleY.stiffness, SPRINGS.scaleY.dampingRatio,
      );

      setValue(valueRef.current);
      setVelocity(velocityRef.current);
      setPressProgress(pressRef.current);
      setScaleX(scaleXRef.current);
      setScaleY(scaleYRef.current);

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
    };
    kickRef.current = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };
    return () => {
      mounted = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const kickRef = useRef<() => void>(() => {});

  const press = useCallback(() => {
    pressTargetRef.current = 1;
    scaleXTargetRef.current = pressedScaleRef.current;
    scaleYTargetRef.current = pressedScaleRef.current;
    kickRef.current();
  }, []);

  const release = useCallback(() => {
    pressTargetRef.current = 0;
    scaleXTargetRef.current = 1;
    scaleYTargetRef.current = 1;
    velocityTargetRef.current = 0;
    kickRef.current();
  }, []);

  const updateValue = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    valueTargetRef.current = clamped;
    const now = performance.now();
    const dt = (now - lastValuePosRef.current.t) / 1000;
    if (dt > 0.001) {
      const instVel = (clamped - lastValuePosRef.current.x) / dt;
      velocityTargetRef.current = Math.max(-5, Math.min(5, instVel));
      lastValuePosRef.current = { x: clamped, t: now };
    }
    kickRef.current();
  }, []);

  const animateToValue = useCallback(
    (v: number) => {
      press();
      valueTargetRef.current = Math.max(0, Math.min(1, v));
      setTimeout(() => release(), 0);
    },
    [press, release],
  );

  // Pointer handlers (stable). Drag tracking is done via window listeners so
  // the knob keeps receiving moves even if the pointer leaves it.
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    lastValuePosRef.current = { x: valueRef.current, t: performance.now() };
    onDragStartedRef.current?.();
    press();

    const startClientX = e.clientX;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startClientX;
      // We pass cumulative delta from last move instead — but the original
      // passes per-move dragAmount. Track lastX.
      onDragRef.current?.(ev.movementX);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onDragStoppedRef.current?.();
      release();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [press, release]);

  const onPointerUp = useCallback(() => {
    // Handled by the window listener in onPointerDown.
  }, []);

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
    onDrag: opts.onDrag,
  };
}

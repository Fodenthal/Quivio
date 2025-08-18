"use client";

import { useEffect } from "react";

/**
 * MobileScaleFix keeps the viewport scale at 1 on mobile Safari/Chrome
 * by preventing focus/gesture zoom and restoring scale after route changes.
 */
export function MobileScaleFix(): null {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]'
    );

    const lockScale = () => {
      if (!meta) return;
      const content = meta.getAttribute("content") || "";
      const next = content
        .replace(/maximum-scale=\d(\.\d+)?/g, "maximum-scale=1")
        .replace(/minimum-scale=\d(\.\d+)?/g, "minimum-scale=1")
        .replace(/initial-scale=\d(\.\d+)?/g, "initial-scale=1")
        .replace(/user-scalable=[^,]+/g, "user-scalable=no");
      meta.setAttribute("content", next);
    };

    lockScale();

    // Prevent pinch-zoom and bounce back to scale 1
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        lockScale();
      }
    };

    // Prevent double-tap zoom
    let lastTouch = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouch < 300) {
        e.preventDefault();
        lockScale();
      }
      lastTouch = now;
    };

    // If user manually zooms, try to bounce back by resetting viewport
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      lockScale();
    };

    // Ensure focused inputs don't trigger zoom by bumping font-size
    const onFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        const el = target as HTMLElement;
        const prev = el.style.fontSize;
        if (parseInt(getComputedStyle(el).fontSize, 10) < 16) {
          el.style.fontSize = "16px";
          // Restore after blur
          const onBlur = () => {
            el.style.fontSize = prev;
            el.removeEventListener("blur", onBlur);
          };
          el.addEventListener("blur", onBlur);
        }
      }
    };

    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    document.addEventListener("gesturestart", onGestureStart as EventListener);
    document.addEventListener("gesturechange", onGestureStart as EventListener);
    document.addEventListener("gestureend", onGestureStart as EventListener);
    document.addEventListener("focus", onFocus, true);

    return () => {
      document.removeEventListener("wheel", onWheel as EventListener);
      document.removeEventListener("touchend", onTouchEnd as EventListener);
      document.removeEventListener("gesturestart", onGestureStart as EventListener);
      document.removeEventListener("gesturechange", onGestureStart as EventListener);
      document.removeEventListener("gestureend", onGestureStart as EventListener);
      document.removeEventListener("focus", onFocus as EventListener, true);
    };
  }, []);

  return null;
}



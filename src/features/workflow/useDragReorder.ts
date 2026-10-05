"use client";

import { useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

/** A row on the move: where it started, where it would land, and how far it has travelled. */
type Drag = { from: number; to: number; dy: number; rects: DOMRect[] };

/**
 * The place the pointer is over, read against where the rows stood when the drag began. Above the
 * list is the first place and below it the last, so either end is always reachable whatever the rows'
 * heights.
 */
function landing(rects: DOMRect[], pointerY: number) {
  const index = rects.findIndex((rect) => pointerY < rect.bottom);
  return index === -1 ? rects.length - 1 : index;
}

/**
 * Drag-to-reorder for a short vertical list, by pointer — mouse, touch or pen — or by keyboard.
 *
 * <p>The list carries `data-reorder-list`; its rows carry `data-reorder-row` and `rowStyle(index)`;
 * each row's handle spreads `handleProps(index, count)`. A dragged row follows the pointer and the
 * rows it passes slide out of its way, so where it will land shows before it is let go. On a focused
 * handle the arrow keys move the row one place, which is how the list is reordered without a pointer.
 *
 * <p>The drag in progress lives in the pointer-down handler's own closure, not in state: pointer
 * events can arrive faster than React renders, and a handler reading state would see the drag as
 * not yet started. State only draws it.
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<Drag | null>(null);

  const handleProps = (index: number, count: number) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      // Measured once, when the drag starts: the rows only move on screen until it ends.
      const list = event.currentTarget.closest("[data-reorder-list]");
      const rects = Array.from(list?.querySelectorAll<HTMLElement>("[data-reorder-row]") ?? []).map((row) =>
        row.getBoundingClientRect(),
      );
      if (rects.length < 2 || !rects[index]) return;
      const startY = event.clientY;
      let current: Drag = { from: index, to: index, dy: 0, rects };
      setDrag(current);

      const move = (moved: globalThis.PointerEvent) => {
        const own = rects[index];
        // Drawn inside the list: dragged past either end, the row waits at that end.
        const dy = Math.min(
          Math.max(moved.clientY - startY, rects[0].top - own.top),
          rects[rects.length - 1].bottom - own.bottom,
        );
        current = { ...current, dy, to: landing(rects, moved.clientY) };
        setDrag(current);
      };
      const finish = (commit: boolean) => () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", drop);
        window.removeEventListener("pointercancel", abandon);
        setDrag(null);
        if (commit && current.to !== current.from) onReorder(current.from, current.to);
      };
      const drop = finish(true);
      const abandon = finish(false);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", drop);
      window.addEventListener("pointercancel", abandon);
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowUp" && index > 0) {
        event.preventDefault();
        onReorder(index, index - 1);
      } else if (event.key === "ArrowDown" && index < count - 1) {
        event.preventDefault();
        onReorder(index, index + 1);
      }
    },
  });

  /** Where each row is drawn while one is dragged. Nothing is reordered until it is let go. */
  const rowStyle = (index: number): CSSProperties => {
    if (!drag) return {};
    if (index === drag.from) {
      return {
        transform: `translateY(${drag.dy}px)`,
        position: "relative",
        zIndex: 1,
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
      };
    }
    const height = drag.rects[drag.from]?.height ?? 0;
    const shift =
      drag.from < drag.to && index > drag.from && index <= drag.to
        ? -height
        : drag.to < drag.from && index >= drag.to && index < drag.from
          ? height
          : 0;
    return { transform: `translateY(${shift}px)`, transition: "transform 150ms ease" };
  };

  /** The place a row would take if the drag ended now — what its number reads meanwhile. */
  const placeOf = (index: number) => {
    if (!drag) return index;
    if (index === drag.from) return drag.to;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return index - 1;
    if (drag.to < drag.from && index >= drag.to && index < drag.from) return index + 1;
    return index;
  };

  return { handleProps, rowStyle, placeOf, dragging: drag !== null };
}

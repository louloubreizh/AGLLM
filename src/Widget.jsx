import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";

const arrowOffsets = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };

export function Widget({ element, label, icon }) {
  const [collapsed, setCollapsed] = useState(false);
  const position = useRef({ x: 0, y: 0 });
  const pointer = useRef(null);
  const scope = element.ownerDocument.defaultView;

  function move(dx, dy) {
    const { left, right, top, bottom } = element.getBoundingClientRect();
    position.current.x += Math.max(4 - left, Math.min(dx, scope.innerWidth - right - 4));
    position.current.y += Math.max(4 - top, Math.min(dy, scope.innerHeight - bottom - 4));
    element.style.translate = `${position.current.x}px ${position.current.y}px`;
  }

  function raise() {
    element.ownerDocument.querySelector(".widget-raised")?.classList.remove("widget-raised");
    element.classList.add("widget-raised");
  }

  function resize(dx, dy) {
    const bounds = element.getBoundingClientRect();
    const maxWidth = scope.innerWidth - 8;
    const maxHeight = scope.innerHeight - 8;
    const width = Math.max(Math.min(215, maxWidth), Math.min(bounds.width + dx, maxWidth));
    const height = Math.max(Math.min(110, maxHeight), Math.min(bounds.height + dy, maxHeight));

    element.style.setProperty("--widget-width", `${width}px`);
    element.style.setProperty("--widget-height", `${height}px`);
    element.setAttribute("data-resized", "");
    const resized = element.getBoundingClientRect();
    move(bounds.left - resized.left, bounds.top - resized.top);
  }

  function startPointer(event, change) {
    if (event.button !== 0) return;
    raise();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, change };
  }

  function trackPointer(event) {
    const previous = pointer.current;
    if (previous?.id !== event.pointerId) return;
    previous.change(event.clientX - previous.x, event.clientY - previous.y);
    previous.x = event.clientX;
    previous.y = event.clientY;
  }

  function releasePointer() {
    pointer.current = null;
  }

  function handleArrows(event, change) {
    if (!Object.hasOwn(arrowOffsets, event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    raise();
    change(...arrowOffsets[event.key]);
  }

  function stopArrowShortcut(event) {
    if (Object.hasOwn(arrowOffsets, event.key)) event.stopPropagation();
  }

  useLayoutEffect(() => {
    function reset() {
      position.current = { x: 0, y: 0 };
      element.style.removeProperty("translate");
      element.style.removeProperty("--widget-width");
      element.style.removeProperty("--widget-height");
      element.removeAttribute("data-resized");
    }
    scope.addEventListener("resize", reset);
    return () => scope.removeEventListener("resize", reset);
  }, [element, scope]);

  useLayoutEffect(() => {
    element.toggleAttribute("data-collapsed", collapsed);
    if (element.getClientRects().length) {
      move(0, 0);
    }
  }, [collapsed, element]);

  return createPortal(
    <div className="widget-bar">
      <button
        type="button"
        className="widget-grip"
        aria-label={`Déplacer ${label}`}
        title="Glisser ou utiliser les flèches pour déplacer"
        onPointerDown={(event) => startPointer(event, move)}
        onPointerMove={trackPointer}
        onLostPointerCapture={releasePointer}
        onKeyDown={(event) => handleArrows(event, move)}
        onKeyUp={stopArrowShortcut}
      >
        <span className="drag-mark"><Icon name="grip" /></span><Icon name={icon} /><span>{label}</span>
      </button>
      <div className="widget-controls">
        {!collapsed && (
          <button type="button" className="widget-resize" aria-label={`Redimensionner ${label}`}
            title="Glisser ou utiliser les flèches pour redimensionner"
            onPointerDown={(event) => startPointer(event, resize)}
            onPointerMove={trackPointer}
            onLostPointerCapture={releasePointer}
            onKeyDown={(event) => handleArrows(event, resize)} onKeyUp={stopArrowShortcut}>
            <Icon name="resize" />
          </button>
        )}
        <button type="button" className="widget-collapse" aria-label={`${collapsed ? "Agrandir" : "Réduire"} ${label}`}
          aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
          <Icon name={collapsed ? "plus" : "minus"} />
        </button>
      </div>
    </div>,
    element.querySelector(".widget-slot")
  );
}

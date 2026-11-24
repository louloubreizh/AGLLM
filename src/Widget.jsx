import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon.jsx";

const arrowOffsets = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };

export function Widget({ element, label, icon }) {
  const [collapsed, setCollapsed] = useState(false);
  const [size, setSize] = useState(100);
  const sizeMenu = useId();
  const pointer = useRef(null);
  const scope = element.ownerDocument.defaultView;

  function move(dx, dy) {
    const { left, top, width, height } = element.getBoundingClientRect();
    const area = element.parentElement.getBoundingClientRect();
    if (!width || !height) return;
    const x = Math.max(0, Math.min(left - area.left + dx, area.width - width));
    const y = Math.max(0, Math.min(top - area.top + dy, area.height - height));
    if (!element.hasAttribute("data-positioned") && !collapsed) {
      element.style.setProperty("--widget-height", `${height}px`);
    }
    element.style.setProperty("--widget-width", `${width}px`);
    element.style.setProperty("--widget-x", `${x}px`);
    element.style.setProperty("--widget-y", `${y}px`);
    element.style.setProperty("--widget-limit", `${area.height - y}px`);
    element.toggleAttribute("data-positioned", true);
  }

  function raise() {
    const siblings = [...element.parentElement.querySelectorAll(":scope > .game-widget")];
    const layer = (widget) => Number(widget.style.getPropertyValue("--widget-layer"));
    if (layer(element) === siblings.length) return;
    siblings.filter((widget) => widget !== element).sort((a, b) => layer(a) - layer(b))
      .forEach((widget, index) => widget.style.setProperty("--widget-layer", index + 1));
    element.style.setProperty("--widget-layer", siblings.length);
  }

  function resize(dx, dy) {
    const bounds = element.getBoundingClientRect();
    const { width: maxWidth, height: maxHeight } = element.parentElement.getBoundingClientRect();
    const width = Math.max(Math.min(215, maxWidth), Math.min(bounds.width + dx, maxWidth));
    const availableHeight = maxHeight - (bounds.top - element.parentElement.getBoundingClientRect().top);
    const height = Math.max(Math.min(110, maxHeight), Math.min(bounds.height + dy, maxHeight));

    move(0, 0);
    element.style.setProperty("--widget-width", `${width}px`);
    element.style.setProperty("--widget-height", `${height}px`);
    element.style.setProperty("--widget-limit", `${Math.max(availableHeight, height)}px`);
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
      pointer.current = null;
      for (const key of ["width", "height", "x", "y", "limit", "layer"]) {
        element.style.removeProperty(`--widget-${key}`);
      }
      element.removeAttribute("data-positioned");
      element.removeAttribute("data-resized");
    }
    scope.addEventListener("resize", reset);
    element.addEventListener("pointerdown", raise);
    element.addEventListener("focusin", raise);
    return () => {
      scope.removeEventListener("resize", reset);
      element.removeEventListener("pointerdown", raise);
      element.removeEventListener("focusin", raise);
    };
  }, [element, scope]);

  useLayoutEffect(() => {
    element.toggleAttribute("data-collapsed", collapsed);
    if (element.hasAttribute("data-positioned") && element.getClientRects().length) {
      element.style.setProperty("--widget-limit", `${element.parentElement.clientHeight}px`);
      move(0, 0);
    }
  }, [collapsed, element]);

  useLayoutEffect(() => {
    element.style.setProperty("--widget-content-zoom", size / 100);
    return () => element.style.removeProperty("--widget-content-zoom");
  }, [element, size]);

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
        {!collapsed && <>
          <button type="button" className="widget-size" aria-label={`Taille du contenu · ${label}`} popoverTarget={sizeMenu}>
            <span aria-hidden="true">A<span>A</span></span>
          </button>
          <div id={sizeMenu} className="widget-size-menu" popover="auto" role="group" aria-label={`Taille · ${label}`}>
            <button type="button" disabled={size >= 150} onClick={() => setSize(size + 10)}>Taille +</button>
            <button type="button" disabled={size <= 70} onClick={() => setSize(size - 10)}>Taille −</button>
          </div>
        </>}
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

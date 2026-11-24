import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";

export function NavbarPopover({ icon, title, value, warning, active, onActive, children, onAction, saved }) {
  const id = useId();
  const heading = useId();
  const menu = useRef(null);
  const button = useRef(null);
  const [pinned, setPinned] = useState(false);
  const open = active === id;

  const close = useCallback((restoreFocus = false) => {
    setPinned(false);
    onActive((current) => current === id ? null : current);
    if (restoreFocus) button.current.focus();
  }, [id, onActive]);

  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!menu.current.contains(event.target)) close();
    }
    function escape(event) {
      if (event.key === "Escape") close(menu.current.contains(document.activeElement));
    }
    function leavePage() {
      if (document.activeElement?.tagName === "IFRAME") close();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("blur", leavePage);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("blur", leavePage);
    };
  }, [open, close]);

  if (onAction) return (
    <div className="info-menu">
      <button className="info-button navbar-direct-action" type="button" data-saved={saved} aria-label={title}
        aria-description={saved === undefined ? undefined : saved ? "Partie sauvegardée" : "Sauvegarde disponible"}
        onClick={() => { onActive(null); onAction(); }}>
        <Icon name={saved === undefined ? icon : saved ? "saveComplete" : "savePending"} />
      </button>
    </div>
  );

  return (
    <div ref={menu} className="info-menu"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && !open) {
          setPinned(false);
          onActive(id);
        }
      }}
      onPointerLeave={() => { if (!pinned) close(); }}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close();
      }}>
      <button ref={button} className={`info-button ${value ? "metric-button" : ""}`} type="button"
        data-warning={warning || undefined} aria-label={value ? `${title} · ${value}` : title}
        aria-controls={id} aria-expanded={open}
        onClick={() => {
          if (open && pinned) close();
          else {
            setPinned(true);
            onActive(id);
          }
        }}>
        <Icon name={icon} />{value && <span>{value}</span>}
      </button>
      <section className="info-popover" id={id} aria-labelledby={heading} hidden={!open}>
        <h2 className="popover-heading" id={heading}><Icon name={icon} />{title}</h2>
        {open && children?.()}
      </section>
    </div>
  );
}

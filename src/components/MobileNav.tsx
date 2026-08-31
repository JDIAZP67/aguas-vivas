"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="mobile-menu" onClick={() => setOpen(false)}>
          <Link href="/plan-de-salvacion">Plan de Salvación</Link>
          <a href="/#vivo">En vivo</a>
          <Link href="/estudios">Estudios bíblicos</Link>
          <a href="/#mayordomia">Mayordomía</a>
          <Link href="/acceso" className="mobile-login">
            Iniciar sesión
          </Link>
        </div>
      )}
    </div>
  );
}

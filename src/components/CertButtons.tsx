"use client";

export default function CertButtons() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        left: 0,
        right: 0,
        display: "flex",
        gap: 12,
        justifyContent: "center",
      }}
    >
      <button className="btn btn-primary" onClick={() => window.print()}>
        Imprimir / Guardar PDF
      </button>
      <a className="btn" href="/mi-perfil">← Volver a mi perfil</a>
    </div>
  );
}
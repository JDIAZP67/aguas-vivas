"use client";

import { useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onError?: (message: string | null) => void;
}

const ALLOWED_IMAGE_RE = /^image\/(png|jpeg|webp)$/;
const MAX_BYTES = 500_000;
const MAX_WIDTH = 300;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_WIDTH / (img.naturalWidth || 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
      canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo procesar la imagen."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mime =
        file.type === "image/jpeg"
          ? "image/jpeg"
          : file.type === "image/webp"
            ? "image/webp"
            : "image/png";
      resolve(canvas.toDataURL(mime, 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Archivo de imagen inválido."));
    };
    img.src = objectUrl;
  });
}

export default function LogoPicker({ value, onChange, onError }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleSelectLogo(file: File | null) {
    onError?.(null);
    if (!file) return;

    if (!ALLOWED_IMAGE_RE.test(file.type)) {
      onError?.("Formato no permitido: usa PNG, JPG o WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      onError?.("La imagen es muy grande: máximo 500 KB.");
      return;
    }

    setBusy(true);
    try {
      const dataUri = await resizeImage(file);
      onChange(dataUri);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "No se pudo procesar el logo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="logo-upload-row">
      {value ? (
        <img
          src={value}
          alt="Logo"
          className="logo-preview"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="logo-placeholder">Logotipo</span>
      )}
      <div className="logo-actions">
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "Procesando…" : value ? "Cambiar logo" : "Subir logo"}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => {
              onChange("");
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            Quitar logo
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: "none" }}
          onChange={(e) => handleSelectLogo(e.currentTarget.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}
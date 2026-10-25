import { useEffect, useState } from "react";

// Muestra la imagen; si no hay o falla la carga, una inicial dorada sobre fondo crema.
export default function PerfumeImg({ src, nombre }) {
  const [fallo, setFallo] = useState(false);

  useEffect(() => setFallo(false), [src]);

  if (!src || fallo) {
    return (
      <span className="pf-ph" aria-hidden="true">
        {nombre?.trim()?.[0]?.toUpperCase() || "✦"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={nombre ? `Frasco de ${nombre}` : ""}
      loading="lazy"
      onError={() => setFallo(true)}
    />
  );
}

import { ImageResponse } from "next/og";

/**
 * Favicon generado (sin binarios en el repo): el icono "layers" de lucide —
 * el "stack" del nombre — en oscuro sobre el verde de marca.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#34d399",
          borderRadius: 7,
        }}
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0b0e14"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <path d="M22 17.65 12.83 21.8a2 2 0 0 1-1.66 0L2 17.65" />
          <path d="M22 12.65 12.83 16.8a2 2 0 0 1-1.66 0L2 12.65" />
        </svg>
      </div>
    ),
    size,
  );
}

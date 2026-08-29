import { ImageResponse } from "next/og";

/**
 * Favicon generado (sin binarios en el repo): capas apiladas — el "stack" del
 * nombre — en verde de marca. A 32px tres barras se leen mejor que una letra.
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          background: "#34d399",
          borderRadius: 7,
        }}
      >
        <div style={{ width: 18, height: 4, borderRadius: 2, background: "#0b0e14" }} />
        <div style={{ width: 14, height: 4, borderRadius: 2, background: "#0b0e14" }} />
        <div style={{ width: 10, height: 4, borderRadius: 2, background: "#0b0e14" }} />
      </div>
    ),
    size,
  );
}

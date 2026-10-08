import { ImageResponse } from "next/og";

// The site's share image (every page without its own; case studies use their cover).
export const alt = "The Skyline Agency, a digital agency in Dallas, TX";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK =
  "M214.4,536.5c118.4,0,227.3-71.7,238.1-158.9c16.8-130.2-111.3-147-178.2-160.1c-26.3-3.6-102.9-3.6-98.1-44.2c4.8-33.4,44.3-59.8,87.3-59.8c64.6,0,81.4,26.3,80.2,38.2h122c8.3-65.7-50.3-136.2-189.1-136.2c-114.8,0-216.5,71.7-228.5,158.9c-12,93.2,82.6,118.3,138.8,130.2c32.3,7.1,145.9,10.7,137.6,74.1c-3.6,31-50.2,58.6-96.9,58.6c-87.3,0-83.8-65.7-83.8-66.9h-128C7.5,437.4,63.6,536.5,214.4,536.5z M466.4,536.5h114.7l15.5-112.9H482L466.4,536.5z";

// ImageResponse takes literal colors; these are the ink, ground, orange and mute tokens.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#101010", color: "#f4f4f4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <svg width="150" height="136" viewBox="0 0 610.3 552.1" fill="#ff4f00">
            <path d={MARK} />
          </svg>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, color: "#9a9a9a" }}>32.7767° N / 96.7970° W</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 0.9, letterSpacing: -4 }}>WE LAUNCH</div>
          <div style={{ fontSize: 120, fontWeight: 300, lineHeight: 0.9, letterSpacing: -4, color: "#ff4f00" }}>BRANDS</div>
          <div style={{ marginTop: 36, fontSize: 30, color: "#9a9a9a" }}>The Skyline Agency · Dallas, TX</div>
        </div>
      </div>
    ),
    size,
  );
}

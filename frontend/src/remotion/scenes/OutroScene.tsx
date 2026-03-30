import React from "react";
import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  AbsoluteFill,
  Easing,
} from "remotion";
import { BRAND, FONTS } from "../constants";

/* ------------------------------------------------------------------ */
/*  Tech label with spring-in animation                                */
/* ------------------------------------------------------------------ */

interface TechLabelProps {
  name: string;
  startFrame: number;
  index: number;
}

const TechLabel: React.FC<TechLabelProps> = ({ name, startFrame, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.5 },
  });
  const scale = interpolate(entrySpring, [0, 1], [0.6, 1]);
  const rotation = interpolate(entrySpring, [0, 1], [index % 2 === 0 ? -8 : 8, 0]);
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        padding: "12px 28px",
        borderRadius: 12,
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        fontFamily: FONTS.mono,
        fontSize: 18,
        fontWeight: 600,
        color: BRAND.primary,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {name}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  OutroScene                                                         */
/* ------------------------------------------------------------------ */

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * Scene timing (165 frames = 5.5s):
   * 0-20:   "Powered By" appears
   * 15-65:  Tech stack labels spring in staggered
   * 70-100: Transition to final logo
   * 90-165: MedBridge logo with gold line, shimmer
   */

  // "Powered By" text
  const poweredBySpring = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.7 },
  });
  const poweredByY = interpolate(poweredBySpring, [0, 1], [25, 0]);
  const poweredByOpacity = interpolate(frame, [3, 15, 70, 85], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Tech grid opacity (fades out before final logo)
  const gridOpacity = interpolate(frame, [70, 90], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Final logo
  const logoStart = 85;
  const logoLocal = Math.max(0, frame - logoStart);
  const logoSpring = spring({
    frame: logoLocal,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.7 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.8, 1]);
  const logoOpacity = interpolate(logoLocal, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const logoY = interpolate(logoSpring, [0, 1], [20, 0]);

  // Gold accent line under logo
  const lineStart = logoStart + 12;
  const lineWidth = interpolate(
    frame,
    [lineStart, lineStart + 20],
    [0, 280],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  // Shimmer effect
  const shimmerX = interpolate(
    frame,
    [lineStart + 15, lineStart + 45],
    [-200, 500],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }
  );
  const shimmerOpacity = interpolate(
    frame,
    [lineStart + 15, lineStart + 25, lineStart + 35, lineStart + 45],
    [0, 0.6, 0.6, 0],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }
  );

  // Logo icon
  const iconSpring = spring({
    frame: Math.max(0, logoLocal - 5),
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.5 },
  });
  const iconScale = interpolate(iconSpring, [0, 1], [0, 1]);

  const techStack = [
    { name: "LangGraph", delay: 15 },
    { name: "FastAPI", delay: 21 },
    { name: "Next.js", delay: 27 },
    { name: "React 19", delay: 33 },
    { name: "SQLAlchemy", delay: 39 },
    { name: "Tailwind", delay: 45 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: BRAND.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* "Powered By" + Tech grid (fades out) */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          opacity: gridOpacity,
        }}
      >
        {/* "Powered By" */}
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 36,
            fontWeight: 700,
            color: BRAND.primary,
            opacity: poweredByOpacity,
            transform: `translateY(${poweredByY}px)`,
            letterSpacing: "-0.01em",
          }}
        >
          Powered By
        </div>

        {/* Tech grid: 3x2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          {techStack.map((tech, i) => (
            <TechLabel
              key={tech.name}
              name={tech.name}
              startFrame={tech.delay}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Final MedBridge logo */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: logoOpacity,
          transform: `scale(${logoScale}) translateY(${logoY}px)`,
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: BRAND.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            transform: `scale(${iconScale})`,
            boxShadow: `0 8px 32px rgba(27, 32, 33, 0.2)`,
          }}
        >
          <span
            style={{
              color: BRAND.secondary,
              fontFamily: FONTS.serif,
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            M
          </span>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 72,
            fontWeight: 700,
            color: BRAND.primary,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          MedBridge
          {/* Shimmer overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: shimmerX,
              width: 100,
              height: "100%",
              background: `linear-gradient(90deg, transparent, ${BRAND.accent}80, transparent)`,
              opacity: shimmerOpacity,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Gold accent line */}
        <div
          style={{
            width: lineWidth,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${BRAND.secondary}, ${BRAND.accent})`,
            marginTop: 12,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

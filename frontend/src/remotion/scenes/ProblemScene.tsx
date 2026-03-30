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
/*  ProblemScene                                                       */
/* ------------------------------------------------------------------ */

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline: "Patients struggle with exercise adherence"
  const headlineSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.7 },
  });
  const headlineY = interpolate(headlineSpring, [0, 1], [40, 0]);
  const headlineOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Stat number: counts up
  const statStart = 25;
  const statLocal = Math.max(0, frame - statStart);
  const statSpring = spring({
    frame: statLocal,
    fps,
    config: { damping: 15, stiffness: 60, mass: 1 },
  });
  const statValue = Math.round(interpolate(statSpring, [0, 1], [0, 35]));
  const statOpacity = interpolate(statLocal, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const statScale = interpolate(statSpring, [0, 1], [0.8, 1]);

  // Description text
  const descStart = 40;
  const descOpacity = interpolate(frame, [descStart, descStart + 15], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const descY = interpolate(frame, [descStart, descStart + 15], [12, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Decorative bar
  const barWidth = interpolate(frame, [15, 45], [0, 120], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background: BRAND.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 900,
          textAlign: "center",
        }}
      >
        {/* Decorative top bar */}
        <div
          style={{
            width: barWidth,
            height: 3,
            borderRadius: 2,
            background: BRAND.secondary,
            marginBottom: 40,
          }}
        />

        {/* Headline */}
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 48,
            fontWeight: 700,
            color: BRAND.primary,
            lineHeight: 1.2,
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
            marginBottom: 48,
          }}
        >
          Patients struggle with{" "}
          <span style={{ color: BRAND.primary }}>exercise adherence</span>
        </div>

        {/* Stat */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: statOpacity,
            transform: `scale(${statScale})`,
          }}
        >
          {/* The big number */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: FONTS.serif,
                fontSize: 120,
                fontWeight: 700,
                color: BRAND.primary,
                lineHeight: 1,
              }}
            >
              {statValue}
            </span>
            <span
              style={{
                fontFamily: FONTS.serif,
                fontSize: 64,
                fontWeight: 700,
                color: BRAND.secondary,
                lineHeight: 1,
              }}
            >
              %
            </span>
          </div>

          {/* Stat description */}
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 22,
              color: BRAND.textMuted,
              marginTop: 12,
              opacity: descOpacity,
              transform: `translateY(${descY}px)`,
            }}
          >
            complete their home exercise programs
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

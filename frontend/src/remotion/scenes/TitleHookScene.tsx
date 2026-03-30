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
/*  TitleHookScene — Brand intro + problem stat (110 frames = 3.7s)    */
/* ------------------------------------------------------------------ */

export const TitleHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * 0-15:   Logo + title spring in
   * 10-30:  Gold underline expands
   * 20-38:  Tagline fades up
   * 42-50:  Brand section fades out
   * 50-65:  Big "35%" stat counts up
   * 55-72:  "complete their exercise programs" fades in
   * 78-95:  "Let AI close the gap." slides up
   * 95-110: Hold
   */

  // Logo icon spring
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // "MedBridge" slide up
  const titleSpring = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.8 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleOpacity = interpolate(frame, [3, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Gold underline
  const underlineWidth = interpolate(frame, [10, 30], [0, 280], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const taglineY = interpolate(frame, [20, 35], [12, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Brand section fades out to make room for stat
  const brandOpacity = interpolate(frame, [42, 50], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Stat "35%"
  const statStart = 50;
  const statLocal = Math.max(0, frame - statStart);
  const statSpring = spring({
    frame: statLocal,
    fps,
    config: { damping: 15, stiffness: 60, mass: 1 },
  });
  const statValue = Math.round(interpolate(statSpring, [0, 1], [0, 35]));
  const statOpacity = interpolate(frame, [statStart, statStart + 10], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const statScale = interpolate(statSpring, [0, 1], [0.85, 1]);

  // Description under stat
  const descStart = 55;
  const descOpacity = interpolate(frame, [descStart, descStart + 12], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Pivot line
  const pivotStart = 78;
  const pivotSpring = spring({
    frame: Math.max(0, frame - pivotStart),
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.7 },
  });
  const pivotOpacity = interpolate(
    frame,
    [pivotStart, pivotStart + 10],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );
  const pivotY = interpolate(pivotSpring, [0, 1], [15, 0]);

  return (
    <AbsoluteFill
      style={{
        background: BRAND.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Brand section (logo + title + tagline) — fades out */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: brandOpacity,
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 17,
            background: BRAND.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            boxShadow: "0 8px 32px rgba(27, 32, 33, 0.2)",
          }}
        >
          <span
            style={{
              color: BRAND.secondary,
              fontFamily: FONTS.serif,
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            M
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 76,
            fontWeight: 700,
            color: BRAND.primary,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          MedBridge
        </div>

        {/* Gold underline */}
        <div
          style={{
            width: underlineWidth,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${BRAND.secondary}, ${BRAND.accent})`,
            marginTop: 10,
            marginBottom: 16,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 24,
            fontWeight: 400,
            color: BRAND.textMuted,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: "0.04em",
          }}
        >
          AI-Powered Health Coaching
        </div>
      </div>

      {/* Stat section — fades in after brand fades out */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: statOpacity,
          transform: `scale(${statScale})`,
        }}
      >
        {/* Big number */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: FONTS.serif,
              fontSize: 110,
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
              fontSize: 56,
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
            marginTop: 8,
            opacity: descOpacity,
            textAlign: "center",
          }}
        >
          of patients complete their exercise programs
        </div>

        {/* Pivot */}
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 32,
            fontWeight: 600,
            color: BRAND.secondary,
            marginTop: 28,
            opacity: pivotOpacity,
            transform: `translateY(${pivotY}px)`,
          }}
        >
          Let AI close the gap.
        </div>
      </div>
    </AbsoluteFill>
  );
};

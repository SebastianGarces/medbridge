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
/*  ColdOpenScene — Dark cinematic problem statement (120 frames = 4s) */
/* ------------------------------------------------------------------ */

export const ColdOpenScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * 0-5:    Dark screen, grid fades in
   * 5-25:   "35" counts up large, white serif
   * 12-22:  "%" appears in gold with scale spring
   * 28-42:  "of patients complete their home exercises" fades up
   * 42-68:  Hold — let the viewer read
   * 68-78:  Stat section fades out
   * 70-88:  Gold line sweeps across center
   * 85-102: "What if AI could change that?" fades in
   * 102-120: Hold for transition
   */

  // --- Grid overlay ---
  const gridOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // --- Stat number ---
  const numSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 15, stiffness: 80, mass: 0.8 },
  });
  const numScale = interpolate(numSpring, [0, 1], [0.7, 1]);
  const numOpacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Count up
  const countSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 20, stiffness: 50, mass: 1 },
  });
  const statValue = Math.round(interpolate(countSpring, [0, 1], [0, 35]));

  // --- Percent sign ---
  const pctSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.5 },
  });
  const pctScale = interpolate(pctSpring, [0, 1], [0.5, 1]);
  const pctOpacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // --- Description ---
  const descOpacity = interpolate(frame, [28, 42], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const descY = interpolate(frame, [28, 42], [12, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // --- Stat section fade-out ---
  const statSectionOpacity = interpolate(frame, [68, 78], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // --- Gold line sweep ---
  const lineStart = 70;
  const lineWidth = interpolate(frame, [lineStart, lineStart + 18], [0, 240], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const lineOpacity = interpolate(
    frame,
    [lineStart, lineStart + 8, lineStart + 25, lineStart + 35],
    [0, 0.8, 0.8, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );

  // --- Question text ---
  const questionStart = 85;
  const questionSpring = spring({
    frame: Math.max(0, frame - questionStart),
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.7 },
  });
  const questionOpacity = interpolate(
    frame,
    [questionStart, questionStart + 12],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );
  const questionY = interpolate(questionSpring, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 45%, #222728, ${BRAND.primaryDark})`,
      }}
    >
      {/* Subtle grid overlay for cinematic depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: gridOpacity,
        }}
      />

      {/* Ambient gold glow — very subtle */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,190,18,0.04), transparent 70%)`,
          transform: "translate(-50%, -50%)",
          filter: "blur(60px)",
        }}
      />

      {/* Stat section (fades out) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: statSectionOpacity,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            opacity: numOpacity,
            transform: `scale(${numScale})`,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.serif,
              fontSize: 160,
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {statValue}
          </span>
          <span
            style={{
              fontFamily: FONTS.serif,
              fontSize: 80,
              fontWeight: 700,
              color: BRAND.secondary,
              lineHeight: 1,
              opacity: pctOpacity,
              transform: `scale(${pctScale})`,
              transformOrigin: "bottom left",
            }}
          >
            %
          </span>
        </div>

        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 24,
            fontWeight: 400,
            color: "rgba(255,255,255,0.45)",
            marginTop: 18,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
            letterSpacing: "0.02em",
          }}
        >
          of patients complete their home exercises
        </div>
      </div>

      {/* Gold line sweep */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: lineWidth,
          height: 2,
          borderRadius: 1,
          background: `linear-gradient(90deg, transparent, ${BRAND.secondary}, transparent)`,
          opacity: lineOpacity,
        }}
      />

      {/* Question */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: questionOpacity,
          transform: `translateY(${questionY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.serif,
            fontSize: 44,
            fontWeight: 600,
            color: BRAND.secondary,
            letterSpacing: "-0.01em",
          }}
        >
          What if AI could change that?
        </span>
      </div>
    </AbsoluteFill>
  );
};

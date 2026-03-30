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
/*  Floating geometric shapes (very subtle background)                 */
/* ------------------------------------------------------------------ */

interface FloatingShapeProps {
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
  shape: "circle" | "square" | "diamond";
}

const FloatingShape: React.FC<FloatingShapeProps> = ({
  x,
  y,
  size,
  rotation,
  delay,
  shape,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);

  const opacity = interpolate(local, [0, 20], [0, 0.06], {
    extrapolateRight: "clamp",
  });
  const drift = Math.sin(local * 0.02) * 8;
  const rot = rotation + local * 0.3;

  const borderRadius = shape === "circle" ? "50%" : shape === "diamond" ? 4 : 6;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + drift,
        width: size,
        height: size,
        borderRadius,
        border: `2px solid ${BRAND.secondary}`,
        opacity,
        transform: `rotate(${rot}deg)`,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  TitleScene                                                         */
/* ------------------------------------------------------------------ */

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "MedBridge" slide up with spring
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.8 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Gold underline expands
  const underlineWidth = interpolate(frame, [12, 40], [0, 320], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Tagline fades in with delay
  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const taglineY = interpolate(frame, [30, 50], [15, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Logo icon spring
  const logoSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoOpacity = interpolate(frame, [5, 15], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
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
      {/* Floating background shapes */}
      <FloatingShape x={150} y={120} size={60} rotation={0} delay={5} shape="circle" />
      <FloatingShape x={1650} y={200} size={45} rotation={45} delay={10} shape="diamond" />
      <FloatingShape x={300} y={700} size={50} rotation={15} delay={8} shape="square" />
      <FloatingShape x={1500} y={650} size={55} rotation={30} delay={12} shape="circle" />
      <FloatingShape x={900} y={100} size={35} rotation={60} delay={15} shape="diamond" />
      <FloatingShape x={100} y={400} size={40} rotation={10} delay={18} shape="square" />
      <FloatingShape x={1700} y={450} size={48} rotation={25} delay={7} shape="circle" />

      {/* Center content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: BRAND.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            boxShadow: `0 8px 32px rgba(27, 32, 33, 0.2)`,
          }}
        >
          <span
            style={{
              color: BRAND.secondary,
              fontFamily: FONTS.serif,
              fontSize: 40,
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
            fontSize: 82,
            fontWeight: 700,
            color: BRAND.primary,
            letterSpacing: "-0.02em",
            lineHeight: 1,
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
            marginTop: 12,
            marginBottom: 20,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 26,
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
    </AbsoluteFill>
  );
};

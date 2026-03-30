import React from "react";
import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  AbsoluteFill,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { BRAND, FONTS } from "../constants";

/* ------------------------------------------------------------------ */
/*  Value prop card                                                    */
/* ------------------------------------------------------------------ */

interface ValuePropProps {
  icon: React.ReactNode;
  text: string;
  startFrame: number;
}

const ValueProp: React.FC<ValuePropProps> = ({ icon, text, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
  });
  const y = interpolate(entrySpring, [0, 1], [30, 0]);
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "20px 36px",
        borderRadius: 16,
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        minWidth: 420,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          background: `linear-gradient(135deg, rgba(255,190,18,0.12), rgba(255,211,94,0.2))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: FONTS.sans,
          fontSize: 22,
          fontWeight: 600,
          color: BRAND.primary,
        }}
      >
        {text}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ClosingScene — Value props + logo (240 frames = 8s)                */
/* ------------------------------------------------------------------ */

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * 0-10:    Fade transition in
   * 12-50:   Value props stagger in
   * 75-95:   Props fade out
   * 90-110:  Logo springs in
   * 105-125: Gold underline expands
   * 115-145: Shimmer
   * 145-220: Hold
   */

  // Value props section opacity
  const propsOpacity = interpolate(frame, [75, 95], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Full logo — spring in + clip-path reveal
  const logoStart = 90;
  const logoLocal = Math.max(0, frame - logoStart);
  const logoSpring = spring({
    frame: logoLocal,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.7 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.9, 1]);
  const logoOpacity = interpolate(logoLocal, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });
  const logoY = interpolate(logoSpring, [0, 1], [20, 0]);

  // Clip-path wipe reveals the SVG from left to right
  const revealStart = logoStart + 5;
  const logoReveal = interpolate(
    frame,
    [revealStart, revealStart + 30],
    [0, 100],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  return (
    <AbsoluteFill
      style={{
        background: BRAND.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Value props */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          alignItems: "center",
          opacity: propsOpacity,
        }}
      >
        <ValueProp
          startFrame={12}
          text="Personalized AI Coaching"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BRAND.secondary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          }
        />
        <ValueProp
          startFrame={22}
          text="Real-Time Clinical Oversight"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BRAND.secondary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        />
        <ValueProp
          startFrame={32}
          text="Built-in Safety Guardrails"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BRAND.secondary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        />
      </div>

      {/* Full logo — clip-path reveal from left to right */}
      <div
        style={{
          position: "absolute",
          opacity: logoOpacity,
          transform: `scale(${logoScale}) translateY(${logoY}px)`,
        }}
      >
        <Img
          src={staticFile("Medbridge_logo_Color_RGB.svg")}
          style={{
            height: 100,
            clipPath: `inset(0 ${100 - logoReveal}% 0 0)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

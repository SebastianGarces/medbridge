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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ------------------------------------------------------------------ */
/*  Animated arrow                                                     */
/* ------------------------------------------------------------------ */

interface ArrowProps {
  startFrame: number;
  height?: number;
}

const AnimatedArrow: React.FC<ArrowProps> = ({ startFrame, height = 48 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const arrowSpring = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.5 },
  });
  const scaleY = interpolate(arrowSpring, [0, 1], [0, 1]);
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity,
        height,
        justifyContent: "center",
        transform: `scaleY(${scaleY})`,
        transformOrigin: "top center",
      }}
    >
      <div
        style={{
          width: 2,
          flex: 1,
          background: BRAND.border,
        }}
      />
      <svg
        width="12"
        height="8"
        viewBox="0 0 12 8"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M1 1L6 6L11 1"
          stroke={BRAND.textLight}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Filter step                                                        */
/* ------------------------------------------------------------------ */

interface FilterStepProps {
  label: string;
  icon: React.ReactNode;
  startFrame: number;
  color: string;
}

const FilterStep: React.FC<FilterStepProps> = ({
  label,
  icon,
  startFrame,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 13, stiffness: 100, mass: 0.6 },
  });
  const scale = interpolate(entrySpring, [0, 1], [0.7, 1]);
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 28px",
        borderRadius: 14,
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: hexToRgba(color, 0.1),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: FONTS.sans,
          fontSize: 17,
          fontWeight: 600,
          color: BRAND.primary,
        }}
      >
        {label}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  SafetyLayerScene                                                   */
/* ------------------------------------------------------------------ */

export const SafetyLayerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * Scene timing (165 frames = 5.5s):
   * 0-15:   Cross-fade in, title appears
   * 15-30:  Message box appears
   * 30-40:  Arrow 1 descends
   * 40-55:  Keyword Filter appears
   * 55-65:  Arrow 2 descends
   * 65-80:  LLM Classifier appears
   * 80-90:  Arrow 3 descends
   * 90-115: SAFE checkmark pops in
   * 110-140: "Every response verified" slides in
   * 140-165: Hold / fade out
   */

  // Title
  const titleSpring = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.7 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);
  const titleOpacity = interpolate(frame, [3, 18], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Message box
  const msgStart = 15;
  const msgLocal = Math.max(0, frame - msgStart);
  const msgSpring = spring({
    frame: msgLocal,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
  });
  const msgScale = interpolate(msgSpring, [0, 1], [0.8, 1]);
  const msgOpacity = interpolate(msgLocal, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Typing animation in the message box
  const msgText = "Coach response generated...";
  const typingStart = msgStart + 8;
  const charsToShow =
    frame > typingStart
      ? Math.min(
          Math.floor((frame - typingStart) * 1.5),
          msgText.length
        )
      : 0;
  const displayText = msgText.slice(0, charsToShow);

  // SAFE checkmark
  const safeStart = 90;
  const safeLocal = Math.max(0, frame - safeStart);
  const safeSpring = spring({
    frame: safeLocal,
    fps,
    config: { damping: 10, stiffness: 120, mass: 0.5 },
  });
  const safeScale = interpolate(safeSpring, [0, 1], [0, 1]);
  const safeOpacity = interpolate(safeLocal, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  // "Every response verified" text
  const verifiedStart = 110;
  const verifiedOpacity = interpolate(
    frame,
    [verifiedStart, verifiedStart + 12],
    [0, 1],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }
  );
  const verifiedX = interpolate(
    frame,
    [verifiedStart, verifiedStart + 12],
    [-30, 0],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 44,
            fontWeight: 700,
            color: BRAND.primary,
            marginBottom: 48,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            letterSpacing: "-0.02em",
          }}
        >
          Built-in Safety Guardrails
        </div>

        {/* Flow diagram */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Message box */}
          <div
            style={{
              opacity: msgOpacity,
              transform: `scale(${msgScale})`,
              padding: "18px 32px",
              borderRadius: 14,
              background: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 320,
            }}
          >
            {/* Chat bubble icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: hexToRgba(BRAND.primary, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={BRAND.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: BRAND.textMuted,
              }}
            >
              {displayText}
              {charsToShow < msgText.length && (
                <span
                  style={{
                    opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                    color: BRAND.primary,
                  }}
                >
                  |
                </span>
              )}
            </span>
          </div>

          {/* Arrow 1 */}
          <AnimatedArrow startFrame={30} />

          {/* Keyword Filter */}
          <FilterStep
            label="Keyword Filter"
            startFrame={40}
            color={BRAND.warning}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            }
          />

          {/* Arrow 2 */}
          <AnimatedArrow startFrame={55} />

          {/* LLM Classifier */}
          <FilterStep
            label="LLM Classifier"
            startFrame={65}
            color="#6366F1"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a4 4 0 014 4c0 1.5-.8 2.8-2 3.5v1h3a3 3 0 013 3v1" />
                <path d="M12 2a4 4 0 00-4 4c0 1.5.8 2.8 2 3.5v1H7a3 3 0 00-3 3v1" />
                <circle cx="12" cy="18" r="3" />
                <circle cx="4" cy="18" r="2" />
                <circle cx="20" cy="18" r="2" />
              </svg>
            }
          />

          {/* Arrow 3 */}
          <AnimatedArrow startFrame={80} />

          {/* SAFE result */}
          <div
            style={{
              opacity: safeOpacity,
              transform: `scale(${safeScale})`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 36px",
              borderRadius: 16,
              background: hexToRgba(BRAND.success, 0.08),
              border: `2px solid ${BRAND.success}`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: BRAND.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={BRAND.white}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: FONTS.sans,
                fontSize: 24,
                fontWeight: 700,
                color: BRAND.success,
                letterSpacing: "0.06em",
              }}
            >
              SAFE
            </span>
          </div>

          {/* "Every response verified" */}
          <div
            style={{
              marginTop: 32,
              opacity: verifiedOpacity,
              transform: `translateX(${verifiedX}px)`,
            }}
          >
            <span
              style={{
                fontFamily: FONTS.sans,
                fontSize: 20,
                fontWeight: 500,
                color: BRAND.textMuted,
              }}
            >
              Every response verified
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

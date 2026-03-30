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
/*  Shadow presets for layered depth                                    */
/* ------------------------------------------------------------------ */

const SHADOW = {
  primary: "0 20px 60px rgba(0,0,0,0.07), 0 6px 20px rgba(0,0,0,0.04)",
  secondary: "0 12px 36px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)",
  glow: "0 8px 24px rgba(255,190,18,0.25)",
};

/* ------------------------------------------------------------------ */
/*  Floating coach bubble                                              */
/* ------------------------------------------------------------------ */

interface BubbleProps {
  text: string;
  startFrame: number;
}

const CoachBubble: React.FC<BubbleProps> = ({ text, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const s = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
  });
  const x = interpolate(s, [0, 1], [-50, 0]);
  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        alignSelf: "flex-start",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.secondary})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.sans,
          fontSize: 16,
          fontWeight: 700,
          color: BRAND.primary,
          flexShrink: 0,
          boxShadow: SHADOW.glow,
        }}
      >
        AI
      </div>
      <div
        style={{
          maxWidth: 480,
          padding: "18px 24px",
          borderRadius: "8px 22px 22px 22px",
          background: BRAND.white,
          fontFamily: FONTS.sans,
          fontSize: 18,
          lineHeight: 1.6,
          color: BRAND.text,
          boxShadow: SHADOW.primary,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Floating patient bubble                                            */
/* ------------------------------------------------------------------ */

const PatientBubble: React.FC<BubbleProps> = ({ text, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const s = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
  });
  const x = interpolate(s, [0, 1], [50, 0]);
  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        alignSelf: "flex-end",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          padding: "18px 24px",
          borderRadius: "22px 8px 22px 22px",
          background: BRAND.primary,
          fontFamily: FONTS.sans,
          fontSize: 18,
          lineHeight: 1.6,
          color: BRAND.white,
          boxShadow:
            "0 16px 48px rgba(27,32,33,0.15), 0 4px 16px rgba(27,32,33,0.08)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Typing indicator                                                   */
/* ------------------------------------------------------------------ */

const TypingDots: React.FC<{ startFrame: number; endFrame: number }> = ({
  startFrame,
  endFrame,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || frame >= endFrame) return null;

  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        display: "flex",
        gap: 16,
        alignItems: "center",
        alignSelf: "flex-start",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.secondary})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.sans,
          fontSize: 16,
          fontWeight: 700,
          color: BRAND.primary,
          flexShrink: 0,
          boxShadow: SHADOW.glow,
        }}
      >
        AI
      </div>
      <div
        style={{
          padding: "18px 28px",
          borderRadius: "8px 22px 22px 22px",
          background: BRAND.white,
          display: "flex",
          gap: 7,
          alignItems: "center",
          boxShadow: SHADOW.primary,
        }}
      >
        {[0, 1, 2].map((i) => {
          const bounce = Math.sin(local * 0.3 - i * 1.2);
          return (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: BRAND.textLight,
                transform: `translateY(${bounce * 3}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Adherence ring card — floating stats                               */
/* ------------------------------------------------------------------ */

const AdherenceCard: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.7 },
  });
  const y = interpolate(entrySpring, [0, 1], [60, 0]);
  const scale = interpolate(entrySpring, [0, 1], [0.85, 1]);
  const opacity = interpolate(local, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Progress ring
  const circumference = 2 * Math.PI * 36;
  const progressSpring = spring({
    frame: Math.max(0, local - 10),
    fps,
    config: { damping: 20, stiffness: 60, mass: 1 },
  });
  const progress = interpolate(progressSpring, [0, 1], [0, 0.8]);
  const strokeDashoffset = circumference * (1 - progress);
  const percentValue = Math.round(progress * 100);

  // Streak icon entrance
  const streakSpring = spring({
    frame: Math.max(0, local - 18),
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.5 },
  });
  const streakScale = interpolate(streakSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        display: "flex",
        gap: 28,
        padding: "28px 36px",
        borderRadius: 24,
        background: BRAND.white,
        alignItems: "center",
        boxShadow: SHADOW.primary,
      }}
    >
      {/* Ring */}
      <div style={{ position: "relative", width: 88, height: 88 }}>
        <svg width={88} height={88} viewBox="0 0 88 88">
          <circle
            cx={44}
            cy={44}
            r={36}
            fill="none"
            stroke={BRAND.border}
            strokeWidth={5}
          />
          <circle
            cx={44}
            cy={44}
            r={36}
            fill="none"
            stroke={BRAND.success}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90, 44, 44)"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.sans,
            fontSize: 20,
            fontWeight: 700,
            color: BRAND.primary,
          }}
        >
          {percentValue}%
        </div>
      </div>

      {/* Labels */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 12,
            fontWeight: 600,
            color: BRAND.textLight,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Adherence
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            transform: `scale(${streakScale})`,
            transformOrigin: "left center",
          }}
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill={BRAND.secondary}
          >
            <path d="M12 23c-3.866 0-7-3.134-7-7 0-3 2-5.5 3.5-7.5.4-.533 1.1-.3 1.2.3.3 1.5.8 2.7 1.8 3.7.2.2.5.1.5-.2 0-1.5.5-3.5 2-5.8.3-.467.9-.467 1.2 0C17 9.5 19 12.5 19 16c0 3.866-3.134 7-7 7z" />
          </svg>
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 18,
              fontWeight: 700,
              color: BRAND.primary,
            }}
          >
            4-day streak
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Goal progress card — floating context                              */
/* ------------------------------------------------------------------ */

const GoalCard: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.6 },
  });
  const x = interpolate(entrySpring, [0, 1], [60, 0]);
  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Progress bar fill
  const fillSpring = spring({
    frame: Math.max(0, local - 8),
    fps,
    config: { damping: 20, stiffness: 50, mass: 1 },
  });
  const fillWidth = interpolate(fillSpring, [0, 1], [0, 65]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        width: 260,
        padding: "22px 24px",
        borderRadius: 20,
        background: BRAND.white,
        boxShadow: SHADOW.secondary,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 11,
          fontWeight: 600,
          color: BRAND.textLight,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        Current Goal
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 15,
          fontWeight: 600,
          color: BRAND.primary,
          marginBottom: 6,
        }}
      >
        Improve shoulder mobility
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 12,
          color: BRAND.textMuted,
          marginBottom: 14,
        }}
      >
        Target: March 15
      </div>
      {/* Progress bar */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: BRAND.primaryLight,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${fillWidth}%`,
            height: "100%",
            borderRadius: 4,
            background: `linear-gradient(90deg, ${BRAND.success}, #22C55E)`,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 13,
          fontWeight: 600,
          color: BRAND.success,
          marginTop: 8,
          textAlign: "right",
        }}
      >
        {Math.round(fillWidth)}%
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Weekly activity card                                               */
/* ------------------------------------------------------------------ */

const WeeklyCard: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.6 },
  });
  const x = interpolate(entrySpring, [0, 1], [60, 0]);
  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const done = [true, true, true, true, false, false, false];

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        width: 260,
        padding: "20px 24px",
        borderRadius: 20,
        background: BRAND.white,
        boxShadow: SHADOW.secondary,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 11,
          fontWeight: 600,
          color: BRAND.textLight,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 14,
        }}
      >
        This Week
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {days.map((d, i) => {
          const dotDelay = startFrame + 8 + i * 4;
          const dotLocal = frame - dotDelay;
          const dotSpring =
            dotLocal > 0 && done[i]
              ? spring({
                  frame: dotLocal,
                  fps,
                  config: { damping: 12, stiffness: 120, mass: 0.4 },
                })
              : 0;
          const dotScale = done[i] ? interpolate(dotSpring, [0, 1], [0.5, 1]) : 1;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: done[i] ? BRAND.successLight : "#F0F0F0",
                  border: done[i]
                    ? `2px solid ${BRAND.success}`
                    : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${dotScale})`,
                }}
              >
                {done[i] && dotSpring > 0.5 && (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={BRAND.success}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 9,
                  color: BRAND.textLight,
                  fontWeight: 500,
                }}
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ChatShowcaseScene (300 frames = 10s)                               */
/* ------------------------------------------------------------------ */

export const ChatShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * Phase 1 — Conversation (0-100):
   *   Floating bubbles appear on warm gradient
   *   Subtle camera push-in
   *
   * Phase 2 — Data reveal (100-160):
   *   Adherence card rises with parallax
   *   Chat bubbles dim + blur (depth of field)
   *
   * Phase 3 — Context (160-220):
   *   Bubbles shift left, blur clears
   *   Goal card + Weekly card float in from right
   *
   * Phase 4 — Hold (220-300):
   *   Subtle floating drift on all elements
   */

  // --- Camera scale (push in then pull back) ---
  const cameraScale = interpolate(
    frame,
    [0, 100, 160, 220],
    [1.0, 1.04, 1.04, 0.94],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  // --- Depth of field on chat bubbles ---
  const chatBlur = interpolate(
    frame,
    [100, 125, 170, 195],
    [0, 2.5, 2.5, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );
  const chatDim = interpolate(
    frame,
    [100, 125, 170, 195],
    [1, 0.65, 0.65, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );

  // --- Chat group shifts left in Phase 3 ---
  const chatShiftX = interpolate(frame, [160, 200], [0, -160], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // --- Adherence card position (rises with parallax) ---
  const adherenceY = interpolate(frame, [105, 140], [80, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // --- Adherence card shifts left with chat in Phase 3 ---
  const adherenceShiftX = interpolate(frame, [160, 200], [0, -160], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // --- Subtle floating drift on hold ---
  const driftY = frame > 220 ? Math.sin((frame - 220) * 0.015) * 4 : 0;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 38%, #FFFFFF, #F7F2EC)`,
      }}
    >
      {/* Warm ambient glow behind chat area */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "42%",
          width: 500,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,190,18,0.05), transparent 70%)",
          transform: "translate(-50%, -50%)",
          filter: "blur(80px)",
        }}
      />

      {/* Camera container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${cameraScale}) translateY(${driftY}px)`,
          transformOrigin: "center 42%",
        }}
      >
        {/* Chat bubbles layer */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(calc(-50% + ${chatShiftX}px), -58%)`,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            width: 620,
            filter: `blur(${chatBlur}px)`,
            opacity: chatDim,
          }}
        >
          <CoachBubble
            startFrame={10}
            text="Good morning Sarah! How are your exercises feeling today?"
          />
          <PatientBubble
            startFrame={42}
            text="My shoulder is feeling much stronger! The stretches are getting easier."
          />
          <TypingDots startFrame={68} endFrame={82} />
          <CoachBubble
            startFrame={82}
            text="That's fantastic! Your 4-day streak shows real commitment."
          />
        </div>

        {/* Adherence card — emerges from below with parallax */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(calc(-50% + ${adherenceShiftX}px), calc(-50% + 160px + ${adherenceY}px))`,
          }}
        >
          <AdherenceCard startFrame={105} />
        </div>

        {/* Context cards — float in from right */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: 160,
            transform: "translateY(-55%)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <GoalCard startFrame={170} />
          <WeeklyCard startFrame={185} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

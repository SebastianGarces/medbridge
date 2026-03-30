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
/*  Coach avatar                                                       */
/* ------------------------------------------------------------------ */

const CoachAvatar: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.secondary})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONTS.sans,
      fontSize: size * 0.36,
      fontWeight: 700,
      color: BRAND.primary,
      flexShrink: 0,
      boxShadow: `0 4px 12px ${hexToRgba(BRAND.secondary, 0.3)}`,
    }}
  >
    AI
  </div>
);

/* ------------------------------------------------------------------ */
/*  Coach message bubble                                               */
/* ------------------------------------------------------------------ */

interface CoachBubbleProps {
  text: string;
  startFrame: number;
}

const CoachBubble: React.FC<CoachBubbleProps> = ({ text, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const s = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
  });
  const x = interpolate(s, [0, 1], [-40, 0]);
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        marginBottom: 20,
      }}
    >
      <CoachAvatar />
      <div
        style={{
          maxWidth: 520,
          padding: "16px 20px",
          borderRadius: "6px 20px 20px 20px",
          background: BRAND.white,
          border: `1px solid ${BRAND.border}`,
          fontFamily: FONTS.sans,
          fontSize: 17,
          lineHeight: 1.6,
          color: BRAND.text,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Patient message bubble                                             */
/* ------------------------------------------------------------------ */

interface PatientBubbleProps {
  text: string;
  startFrame: number;
}

const PatientBubble: React.FC<PatientBubbleProps> = ({ text, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const s = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.6 },
  });
  const x = interpolate(s, [0, 1], [40, 0]);
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          padding: "16px 20px",
          borderRadius: "20px 6px 20px 20px",
          background: BRAND.primary,
          fontFamily: FONTS.sans,
          fontSize: 17,
          lineHeight: 1.6,
          color: BRAND.white,
          boxShadow: `0 2px 12px ${hexToRgba(BRAND.primary, 0.2)}`,
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

interface TypingIndicatorProps {
  startFrame: number;
  endFrame: number;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
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
        gap: 14,
        alignItems: "flex-start",
        marginBottom: 20,
      }}
    >
      <CoachAvatar />
      <div
        style={{
          padding: "18px 24px",
          borderRadius: "6px 20px 20px 20px",
          background: BRAND.white,
          border: `1px solid ${BRAND.border}`,
          display: "flex",
          gap: 6,
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
                transform: `translateY(${bounce * 4}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Adherence stats card                                               */
/* ------------------------------------------------------------------ */

interface StatsCardProps {
  startFrame: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const cardSpring = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.7 },
  });
  const cardScale = interpolate(cardSpring, [0, 1], [0.3, 1]);
  const cardOpacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Circular progress ring
  const circumference = 2 * Math.PI * 32;
  const progressSpring = spring({
    frame: Math.max(0, local - 8),
    fps,
    config: { damping: 20, stiffness: 60, mass: 1 },
  });
  const progress = interpolate(progressSpring, [0, 1], [0, 0.8]);
  const strokeDashoffset = circumference * (1 - progress);

  // Count up percentage
  const percentValue = Math.round(progress * 100);

  // Flame icon entrance
  const flameDelay = 15;
  const flameLocal = Math.max(0, local - flameDelay);
  const flameSpring = spring({
    frame: flameLocal,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.5 },
  });
  const flameScale = interpolate(flameSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        opacity: cardOpacity,
        transform: `scale(${cardScale})`,
        display: "flex",
        gap: 32,
        padding: "28px 36px",
        borderRadius: 20,
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)`,
        alignItems: "center",
      }}
    >
      {/* Circular progress */}
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <svg width={80} height={80} viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx={40}
            cy={40}
            r={32}
            fill="none"
            stroke={BRAND.border}
            strokeWidth={6}
          />
          {/* Progress circle */}
          <circle
            cx={40}
            cy={40}
            r={32}
            fill="none"
            stroke={BRAND.success}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90, 40, 40)"
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
            fontSize: 18,
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
            fontSize: 13,
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
            transform: `scale(${flameScale})`,
          }}
        >
          {/* Flame emoji/icon */}
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill={BRAND.secondary}
            stroke="none"
          >
            <path d="M12 23c-3.866 0-7-3.134-7-7 0-3 2-5.5 3.5-7.5.4-.533 1.1-.3 1.2.3.3 1.5.8 2.7 1.8 3.7.2.2.5.1.5-.2 0-1.5.5-3.5 2-5.8.3-.467.9-.467 1.2 0C17 9.5 19 12.5 19 16c0 3.866-3.134 7-7 7z" />
          </svg>
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 20,
              fontWeight: 700,
              color: BRAND.primary,
            }}
          >
            Streak: 4 days
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sidebar (for zoom-out reveal)                                      */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  opacity: number;
}

const Sidebar: React.FC<SidebarProps> = ({ opacity }) => (
  <div
    style={{
      width: 240,
      background: BRAND.white,
      borderRight: `1px solid ${BRAND.border}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      opacity,
    }}
  >
    {/* Logo */}
    <div
      style={{
        padding: "20px 18px 8px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: BRAND.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: BRAND.secondary,
            fontFamily: FONTS.serif,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          M
        </span>
      </div>
      <span
        style={{
          fontFamily: FONTS.serif,
          fontSize: 17,
          fontWeight: 700,
          color: BRAND.primary,
        }}
      >
        MedBridge
      </span>
    </div>

    {/* User */}
    <div
      style={{
        padding: "16px 18px",
        borderBottom: `1px solid ${BRAND.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: BRAND.accentLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.sans,
            fontSize: 13,
            fontWeight: 700,
            color: BRAND.accentDark,
          }}
        >
          SJ
        </div>
        <div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 13,
              fontWeight: 600,
              color: BRAND.primary,
            }}
          >
            Sarah Johnson
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 11,
              color: BRAND.textLight,
            }}
          >
            Patient
          </div>
        </div>
      </div>
    </div>

    {/* Nav items (simplified) */}
    <div
      style={{
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {[
        { label: "Chat", active: true },
        { label: "My Goals", active: false },
        { label: "Exercises", active: false },
        { label: "Settings", active: false },
      ].map((item) => (
        <div
          key={item.label}
          style={{
            padding: "8px 14px",
            borderRadius: 7,
            background: item.active ? BRAND.accentLight : "transparent",
            fontFamily: FONTS.sans,
            fontSize: 13,
            fontWeight: item.active ? 600 : 400,
            color: item.active ? BRAND.accentDark : BRAND.textMuted,
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Right panel (for zoom-out reveal)                                  */
/* ------------------------------------------------------------------ */

interface RightPanelProps {
  opacity: number;
}

const RightPanel: React.FC<RightPanelProps> = ({ opacity }) => (
  <div
    style={{
      width: 260,
      background: BRAND.white,
      borderLeft: `1px solid ${BRAND.border}`,
      padding: "18px",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      opacity,
    }}
  >
    {/* Goal card */}
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          fontWeight: 600,
          color: BRAND.textLight,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 6,
        }}
      >
        Current Goal
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 13,
          fontWeight: 600,
          color: BRAND.primary,
          marginBottom: 10,
        }}
      >
        Improve shoulder mobility
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: BRAND.primaryLight,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "65%",
            height: "100%",
            borderRadius: 3,
            background: BRAND.success,
          }}
        />
      </div>
    </div>

    {/* Adherence card */}
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          fontWeight: 600,
          color: BRAND.textLight,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 6,
        }}
      >
        Adherence
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 28,
          fontWeight: 700,
          color: BRAND.primary,
          lineHeight: 1,
        }}
      >
        80%
      </div>
    </div>

    {/* Weekly */}
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          fontWeight: 600,
          color: BRAND.textLight,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 10,
        }}
      >
        This Week
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
          const done = i < 4;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: done ? BRAND.successLight : "#F0F0F0",
                  border: done
                    ? `2px solid ${BRAND.success}`
                    : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done && (
                  <svg
                    width="10"
                    height="10"
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
                  fontSize: 8,
                  color: BRAND.textLight,
                }}
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main ChatCloseUpScene                                              */
/* ------------------------------------------------------------------ */

export const ChatCloseUpScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * Scene timing (300 frames = 10s):
   * 0-12:    Transition in (slide from right)
   * 12-35:   First coach message
   * 45-65:   Patient reply
   * 75-88:   Typing indicator
   * 88-110:  Coach response
   * 115-140: Stats card appears
   * 155-180: Zoom out to full UI (25 frames, snappy)
   * 180-300: Hold full UI
   */

  // Zoom level: starts zoomed in (scale ~1.35), holds, then snaps out
  const zoomOutStart = 155;
  const zoomPhase = interpolate(
    frame,
    [0, 5, zoomOutStart, zoomOutStart + 25],
    [1.35, 1.35, 1.35, 1],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  // Pan position: when zoomed in, offset to show chat area; at zoom out, center
  const panX = 0;
  const panY = interpolate(
    frame,
    [0, 5, zoomOutStart, zoomOutStart + 25],
    [-60, -60, -60, 0],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  // Sidebar/right panel appear during zoom out
  const chromeOpacity = interpolate(
    frame,
    [zoomOutStart + 5, zoomOutStart + 20],
    [0, 1],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }
  );

  const statsStart = 115;

  return (
    <AbsoluteFill style={{ background: BRAND.surface }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${zoomPhase}) translate(${panX}px, ${panY}px)`,
          transformOrigin: "center center",
          display: "flex",
        }}
      >
        {/* Left sidebar (visible during zoom out) */}
        <Sidebar opacity={chromeOpacity} />

        {/* Center chat area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: BRAND.surface,
          }}
        >
          {/* Chat header */}
          <div
            style={{
              padding: "14px 28px",
              borderBottom: `1px solid ${BRAND.border}`,
              background: BRAND.white,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <CoachAvatar size={36} />
            <div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 15,
                  fontWeight: 600,
                  color: BRAND.primary,
                }}
              >
                AI Health Coach
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: BRAND.success,
                  }}
                />
                <span
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 12,
                    color: BRAND.success,
                  }}
                >
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              padding: "24px 32px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <CoachBubble
              startFrame={12}
              text="Good morning Sarah! I see you've completed 4 of 5 sessions this week. How are your exercises feeling?"
            />
            <PatientBubble
              startFrame={45}
              text="My shoulder is feeling much stronger! The stretches are getting easier."
            />
            <TypingIndicator startFrame={75} endFrame={88} />
            <CoachBubble
              startFrame={88}
              text="That's fantastic progress! Your 4-day streak shows real commitment."
            />

            {/* Stats card */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 12,
                transform: "scale(1)",
              }}
            >
              <StatsCard startFrame={statsStart} />
            </div>
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: "12px 28px",
              borderTop: `1px solid ${BRAND.border}`,
              background: BRAND.white,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: BRAND.surfaceAlt,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 14,
                  color: BRAND.textLight,
                  flex: 1,
                }}
              >
                Type a message...
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: BRAND.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={BRAND.white}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel (visible during zoom out) */}
        <RightPanel opacity={chromeOpacity} />
      </div>
    </AbsoluteFill>
  );
};

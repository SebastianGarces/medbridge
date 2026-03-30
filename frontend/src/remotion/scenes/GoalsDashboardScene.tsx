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
/*  Metric card                                                        */
/* ------------------------------------------------------------------ */

interface MetricCardProps {
  label: string;
  value: string;
  accentColor: string;
  startFrame: number;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  accentColor,
  startFrame,
  icon,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const s = spring({
    frame: local,
    fps,
    config: { damping: 13, stiffness: 100, mass: 0.6 },
  });
  const y = interpolate(s, [0, 1], [30, 0]);
  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        flex: 1,
        padding: "22px 24px",
        borderRadius: 16,
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: hexToRgba(accentColor, 0.12),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 28,
            fontWeight: 700,
            color: BRAND.primary,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 13,
            color: BRAND.textMuted,
            marginTop: 4,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Weekly activity dots                                               */
/* ------------------------------------------------------------------ */

const DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

interface WeeklyDotsProps {
  startFrame: number;
}

const WeeklyDots: React.FC<WeeklyDotsProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dayStatus = [true, true, true, true, false, false, false];

  return (
    <div
      style={{
        display: "flex",
        gap: 18,
        justifyContent: "flex-start",
        marginTop: 16,
      }}
    >
      {DAYS.map((d, i) => {
        const localStart = startFrame + i * 6;
        const local = frame - localStart;
        const fillSpring =
          local > 0 && dayStatus[i]
            ? spring({
                frame: local,
                fps,
                config: { damping: 12, stiffness: 120, mass: 0.4 },
              })
            : 0;
        const scale = dayStatus[i]
          ? interpolate(fillSpring, [0, 1], [0.5, 1])
          : 1;
        const dotOpacity =
          local > 0
            ? interpolate(local, [0, 8], [0, 1], {
                extrapolateRight: "clamp",
              })
            : i <= 4
              ? 1
              : 0.4;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              opacity: dotOpacity,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: dayStatus[i]
                  ? BRAND.successLight
                  : i === 4
                    ? "transparent"
                    : "#F0F0F0",
                border:
                  i === 4
                    ? `2px solid ${BRAND.accent}`
                    : dayStatus[i]
                      ? `2px solid ${BRAND.success}`
                      : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${scale})`,
              }}
            >
              {dayStatus[i] && fillSpring > 0.5 && (
                <svg
                  width="18"
                  height="18"
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
                fontSize: 12,
                color: BRAND.textMuted,
                fontWeight: 500,
              }}
            >
              {d}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  GoalsDashboardScene                                                */
/* ------------------------------------------------------------------ */

export const GoalsDashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * Scene timing (135 frames = 4.5s):
   * 0-15:   Slide in, title appears
   * 10-50:  Progress bar zoomed in, fills up
   * 50-60:  "Track Progress in Real-Time" overlay
   * 55-90:  Zoom out to reveal metric cards
   * 80-110: Metric cards stagger in
   * 100-135: Weekly dots fill in
   */

  // Zoom effect: start zoomed into progress bar, then pull back
  const zoomLevel = interpolate(frame, [0, 10, 55, 85], [1.6, 1.6, 1.6, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const panY = interpolate(frame, [0, 10, 55, 85], [-100, -100, -100, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Progress bar animation
  const progressStart = 10;
  const progressLocal = Math.max(0, frame - progressStart);
  const progressSpring = spring({
    frame: progressLocal,
    fps,
    config: { damping: 20, stiffness: 50, mass: 1.2 },
  });
  const progressWidth = interpolate(progressSpring, [0, 1], [0, 65]);
  const progressPercent = Math.round(progressWidth);

  // Text overlay "Track Progress in Real-Time"
  const overlayStart = 40;
  const overlayOpacity = interpolate(
    frame,
    [overlayStart, overlayStart + 10, 80, 90],
    [0, 1, 1, 0],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }
  );
  const overlayY = interpolate(
    frame,
    [overlayStart, overlayStart + 10],
    [20, 0],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  // Slide transition entrance
  const slideX = interpolate(frame, [0, 15], [60, 0], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const slideOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BRAND.surface }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${zoomLevel}) translateY(${panY}px) translateX(${slideX}px)`,
          transformOrigin: "center 40%",
          opacity: slideOpacity,
        }}
      >
        {/* Content */}
        <div
          style={{
            padding: "48px 80px",
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          {/* Page title */}
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 32,
              fontWeight: 700,
              color: BRAND.primary,
              marginBottom: 32,
            }}
          >
            My Goals
          </div>

          {/* Main goal card with progress bar */}
          <div
            style={{
              padding: 32,
              borderRadius: 20,
              background: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              marginBottom: 32,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 22,
                    fontWeight: 600,
                    color: BRAND.primary,
                  }}
                >
                  Improve shoulder mobility
                </div>
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 14,
                    color: BRAND.textMuted,
                    marginTop: 4,
                  }}
                >
                  Target: Full range of motion by March 15
                </div>
              </div>
              <div
                style={{
                  padding: "6px 16px",
                  borderRadius: 24,
                  background: BRAND.successLight,
                  color: BRAND.success,
                  fontFamily: FONTS.sans,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ON TRACK
              </div>
            </div>

            {/* Progress label and number */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 15,
                  color: BRAND.textMuted,
                }}
              >
                Progress
              </span>
              <span
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 28,
                  fontWeight: 700,
                  color: BRAND.success,
                }}
              >
                {progressPercent}%
              </span>
            </div>

            {/* Animated progress bar */}
            <div
              style={{
                height: 14,
                borderRadius: 7,
                background: BRAND.primaryLight,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressWidth}%`,
                  height: "100%",
                  borderRadius: 7,
                  background: `linear-gradient(90deg, ${BRAND.success}, #22C55E)`,
                  transition: "none",
                }}
              />
            </div>
          </div>

          {/* Metric cards row */}
          <div style={{ display: "flex", gap: 20, marginBottom: 32 }}>
            <MetricCard
              label="Adherence Rate"
              value="80%"
              accentColor={BRAND.success}
              startFrame={80}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              }
            />
            <MetricCard
              label="Current Streak"
              value="4 days"
              accentColor={BRAND.secondary}
              startFrame={86}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              }
            />
            <MetricCard
              label="Sessions"
              value="16/20"
              accentColor="#3B82F6"
              startFrame={92}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
          </div>

          {/* Weekly activity */}
          <div
            style={{
              padding: 28,
              borderRadius: 20,
              background: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 18,
                fontWeight: 600,
                color: BRAND.primary,
                marginBottom: 4,
              }}
            >
              Weekly Activity
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 14,
                color: BRAND.textMuted,
                marginBottom: 8,
              }}
            >
              4 of 5 sessions completed
            </div>
            <WeeklyDots startFrame={100} />
          </div>
        </div>
      </div>

      {/* Text overlay: "Track Progress in Real-Time" */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: overlayOpacity,
          transform: `translateY(${overlayY}px)`,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            padding: "14px 40px",
            borderRadius: 16,
            background: hexToRgba(BRAND.primary, 0.9),
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              fontFamily: FONTS.serif,
              fontSize: 28,
              fontWeight: 600,
              color: BRAND.white,
              letterSpacing: "-0.01em",
            }}
          >
            Track Progress in Real-Time
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

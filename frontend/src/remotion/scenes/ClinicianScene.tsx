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
/*  Stat card with counting animation                                  */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  targetValue: number;
  suffix?: string;
  iconColor: string;
  startFrame: number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  targetValue,
  suffix = "",
  iconColor,
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
  const y = interpolate(s, [0, 1], [28, 0]);
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Count up
  const countSpring = spring({
    frame: Math.max(0, local - 5),
    fps,
    config: { damping: 20, stiffness: 60, mass: 1 },
  });
  const displayValue = Math.round(
    interpolate(countSpring, [0, 1], [0, targetValue])
  );

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
          background: hexToRgba(iconColor, 0.12),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconColor,
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
          {displayValue}
          {suffix}
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
/*  Patient table row                                                  */
/* ------------------------------------------------------------------ */

interface PatientRowProps {
  name: string;
  initials: string;
  phase: string;
  phaseColor: string;
  adherence: string;
  adherencePercent: number;
  adherenceColor: string;
  lastActive: string;
  startFrame: number;
}

const PatientRow: React.FC<PatientRowProps> = ({
  name,
  initials,
  phase,
  phaseColor,
  adherence,
  adherencePercent,
  adherenceColor,
  lastActive,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0) return null;

  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(local, [0, 12], [10, 0], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        display: "grid",
        gridTemplateColumns: "1.8fr 1fr 1.2fr 1fr",
        gap: 12,
        alignItems: "center",
        padding: "14px 24px",
        borderBottom: `1px solid ${BRAND.border}`,
        fontFamily: FONTS.sans,
        fontSize: 14,
      }}
    >
      {/* Name */}
      <div
        style={{
          fontWeight: 600,
          color: BRAND.primary,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: BRAND.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: BRAND.primary,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        {name}
      </div>

      {/* Phase badge */}
      <div>
        <span
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            background: hexToRgba(phaseColor, 0.12),
            color: phaseColor,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {phase}
        </span>
      </div>

      {/* Adherence with bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: BRAND.textMuted, minWidth: 36 }}>
          {adherence}
        </span>
        {adherencePercent > 0 && (
          <div
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: BRAND.primaryLight,
              overflow: "hidden",
              maxWidth: 80,
            }}
          >
            <div
              style={{
                width: `${adherencePercent}%`,
                height: "100%",
                borderRadius: 3,
                background: adherenceColor,
              }}
            />
          </div>
        )}
      </div>

      {/* Last Active */}
      <div style={{ color: BRAND.textMuted }}>{lastActive}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Alert card (zoomed in)                                             */
/* ------------------------------------------------------------------ */

interface AlertCardProps {
  startFrame: number;
  acknowledgeFrame: number;
}

const AlertCard: React.FC<AlertCardProps> = ({
  startFrame,
  acknowledgeFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 13, stiffness: 90, mass: 0.6 },
  });
  const x = interpolate(entrySpring, [0, 1], [50, 0]);
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Pulsing left border
  const pulseBorder =
    local > 10
      ? interpolate(Math.sin(local * 0.15), [-1, 1], [0.4, 1])
      : 1;

  // Acknowledge animation
  const isAcked = frame >= acknowledgeFrame;
  const ackLocal = Math.max(0, frame - acknowledgeFrame);
  const ackSpring = spring({
    frame: ackLocal,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.5 },
  });
  const ackScale = isAcked ? interpolate(ackSpring, [0, 1], [0.85, 1]) : 1;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        padding: "20px 24px",
        borderRadius: 16,
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        borderLeft: `5px solid ${hexToRgba(BRAND.critical, pulseBorder)}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: hexToRgba(BRAND.critical, 0.1),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={BRAND.critical}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 6,
              background: BRAND.criticalLight,
              color: BRAND.critical,
              fontFamily: FONTS.sans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Safety Alert
          </span>
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 16,
            fontWeight: 600,
            color: BRAND.primary,
            marginBottom: 4,
          }}
        >
          Patient reported severe pain
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 14,
            color: BRAND.textMuted,
            lineHeight: 1.5,
          }}
        >
          Immediate clinical review recommended
        </div>
      </div>

      {/* Acknowledge button */}
      <div
        style={{
          padding: "8px 18px",
          borderRadius: 10,
          background: isAcked
            ? hexToRgba(BRAND.success, 0.1)
            : BRAND.surfaceAlt,
          border: `1px solid ${isAcked ? BRAND.success : BRAND.border}`,
          fontFamily: FONTS.sans,
          fontSize: 13,
          fontWeight: 600,
          color: isAcked ? BRAND.success : BRAND.textMuted,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
          transform: `scale(${ackScale})`,
        }}
      >
        {isAcked ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BRAND.success}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Done
          </>
        ) : (
          "Acknowledge"
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ClinicianScene                                                     */
/* ------------------------------------------------------------------ */

export const ClinicianScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * Scene timing (300 frames = 10s):
   * 0-8:    Wipe transition from TransitionSeries
   * 10-40:  Stats cards count up (staggered)
   * 45-85:  Zoom out from stats to full view, table rows stagger in
   * 90-120: Alert card slides in with pulse
   * 145-165: Acknowledge button animation
   * 165-300: Hold
   */

  // Zoom: start slightly zoomed into stats area, then pull back to full view
  const zoomLevel = interpolate(
    frame,
    [0, 5, 45, 65],
    [1.15, 1.15, 1.15, 1],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  const panY = interpolate(
    frame,
    [0, 5, 45, 65],
    [-40, -40, -40, 0],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  // Alert badge pulse
  const alertPulse =
    frame > 90
      ? interpolate(Math.sin((frame - 90) * 0.2), [-1, 1], [1, 1.2])
      : 1;

  return (
    <AbsoluteFill style={{ background: BRAND.surface }}>
      {/* Main dashboard content */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${zoomLevel}) translateY(${panY}px)`,
          transformOrigin: "center 35%",
        }}
      >
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
          {/* Clinician sidebar */}
          <div
            style={{
              width: 240,
              background: BRAND.primaryDark,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: "24px 18px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: BRAND.secondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      color: BRAND.primary,
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
                    color: BRAND.white,
                  }}
                >
                  MedBridge
                </span>
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  marginLeft: 38,
                }}
              >
                Clinician Portal
              </div>
            </div>

            {/* Nav */}
            <div
              style={{
                padding: "6px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {[
                { label: "Dashboard", active: true },
                { label: "Patients", active: false },
                { label: "Alerts", active: false, badge: 3 },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 14px",
                    borderRadius: 7,
                    background: item.active
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                    color: item.active
                      ? BRAND.white
                      : "rgba(255,255,255,0.5)",
                    fontFamily: FONTS.sans,
                    fontSize: 13,
                    fontWeight: item.active ? 600 : 400,
                  }}
                >
                  {item.label}
                  {"badge" in item && item.badge && (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: BRAND.critical,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: BRAND.white,
                        transform: `scale(${alertPulse})`,
                      }}
                    >
                      {item.badge}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            {/* Doctor profile */}
            <div
              style={{
                padding: "14px 18px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: hexToRgba(BRAND.accent, 0.2),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.sans,
                  fontSize: 12,
                  fontWeight: 700,
                  color: BRAND.accent,
                }}
              >
                ER
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 12,
                    fontWeight: 600,
                    color: BRAND.white,
                  }}
                >
                  Dr. Emily Rodriguez
                </div>
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  Physiotherapist
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              flex: 1,
              padding: "32px 40px",
              overflow: "hidden",
            }}
          >
            {/* Title */}
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 26,
                fontWeight: 700,
                color: BRAND.primary,
                marginBottom: 24,
              }}
            >
              Dashboard
            </div>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: 18, marginBottom: 28 }}>
              <StatCard
                label="Active Patients"
                targetValue={12}
                iconColor={BRAND.accentDark}
                startFrame={12}
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                }
              />
              <StatCard
                label="Avg Adherence"
                targetValue={87}
                suffix="%"
                iconColor={BRAND.success}
                startFrame={18}
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                }
              />
              <StatCard
                label="Pending Alerts"
                targetValue={3}
                iconColor={BRAND.critical}
                startFrame={24}
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                }
              />
            </div>

            {/* Patient table */}
            <div
              style={{
                borderRadius: 16,
                background: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                overflow: "hidden",
                marginBottom: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1fr 1.2fr 1fr",
                  gap: 12,
                  padding: "12px 24px",
                  background: BRAND.surfaceAlt,
                  fontFamily: FONTS.sans,
                  fontSize: 11,
                  fontWeight: 600,
                  color: BRAND.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: `1px solid ${BRAND.border}`,
                }}
              >
                <div>Name</div>
                <div>Phase</div>
                <div>Adherence</div>
                <div>Last Active</div>
              </div>

              <PatientRow
                name="Sarah Johnson"
                initials="SJ"
                phase="ACTIVE"
                phaseColor={BRAND.success}
                adherence="80%"
                adherencePercent={80}
                adherenceColor={BRAND.success}
                lastActive="Today"
                startFrame={55}
              />
              <PatientRow
                name="Michael Chen"
                initials="MC"
                phase="RE_ENGAGING"
                phaseColor={BRAND.critical}
                adherence="45%"
                adherencePercent={45}
                adherenceColor={BRAND.warning}
                lastActive="3 days ago"
                startFrame={62}
              />
              <PatientRow
                name="Lisa Park"
                initials="LP"
                phase="ONBOARDING"
                phaseColor={BRAND.warning}
                adherence="\u2014"
                adherencePercent={0}
                adherenceColor={BRAND.textLight}
                lastActive="Today"
                startFrame={69}
              />
            </div>

            {/* Alert card (zoomed into at end) */}
            <AlertCard startFrame={95} acknowledgeFrame={150} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

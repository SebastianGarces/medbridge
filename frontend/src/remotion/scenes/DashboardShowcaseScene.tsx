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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const SHADOW = {
  card: "0 20px 60px rgba(0,0,0,0.07), 0 6px 20px rgba(0,0,0,0.04)",
  sidebar: "6px 0 30px rgba(0,0,0,0.12)",
  alert:
    "0 20px 60px rgba(220,38,38,0.08), 0 6px 20px rgba(0,0,0,0.05)",
};

/* ------------------------------------------------------------------ */
/*  Floating sidebar strip                                             */
/* ------------------------------------------------------------------ */

const SidebarStrip: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 16, stiffness: 90, mass: 0.7 },
  });
  const x = interpolate(entrySpring, [0, 1], [-220, 0]);
  const opacity = interpolate(local, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const alertPulse =
    local > 40
      ? interpolate(Math.sin((local - 40) * 0.2), [-1, 1], [1, 1.15])
      : 1;

  const navItems = [
    { label: "Dashboard", active: true },
    { label: "Patients", active: false },
    { label: "Alerts", active: false, badge: 3 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: "50%",
        transform: `translateX(${x}px) translateY(-50%)`,
        opacity,
        width: 200,
        height: 480,
        borderRadius: 20,
        background: BRAND.primaryDark,
        boxShadow: SHADOW.sidebar,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 18px 12px",
        }}
      >
        <Img
          src={staticFile("Medbridge_logo_White_RGB.svg")}
          style={{
            height: 26,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          padding: "0 20px 16px",
          letterSpacing: "0.04em",
        }}
      >
        Clinician Portal
      </div>

      {/* Nav items */}
      <div
        style={{
          padding: "4px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 14px",
              borderRadius: 8,
              background: item.active ? "rgba(255,255,255,0.1)" : "transparent",
              color: item.active ? BRAND.white : "rgba(255,255,255,0.5)",
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
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: hexToRgba(BRAND.accent, 0.2),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.sans,
            fontSize: 11,
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
              fontSize: 11,
              fontWeight: 600,
              color: BRAND.white,
            }}
          >
            Dr. Emily Rodriguez
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Physiotherapist
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Floating stat card                                                 */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  targetValue: number;
  suffix?: string;
  iconColor: string;
  startFrame: number;
  icon: React.ReactNode;
  fromX?: number;
  fromY?: number;
}

const FloatingStatCard: React.FC<StatCardProps> = ({
  label,
  targetValue,
  suffix = "",
  iconColor,
  startFrame,
  icon,
  fromX = 80,
  fromY = -20,
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
  const x = interpolate(s, [0, 1], [fromX, 0]);
  const y = interpolate(s, [0, 1], [fromY, 0]);
  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Count up
  const countSpring = spring({
    frame: Math.max(0, local - 5),
    fps,
    config: { damping: 20, stiffness: 60, mass: 1 },
  });
  const displayValue = Math.round(
    interpolate(countSpring, [0, 1], [0, targetValue]),
  );

  return (
    <div
      style={{
        opacity,
        transform: `translate(${x}px, ${y}px)`,
        padding: "20px 24px",
        borderRadius: 20,
        background: BRAND.white,
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: SHADOW.card,
        minWidth: 210,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 13,
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
            fontSize: 12,
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
/*  Patient table card                                                 */
/* ------------------------------------------------------------------ */

const PatientTableCard: React.FC<{ startFrame: number }> = ({
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.7 },
  });
  const y = interpolate(entrySpring, [0, 1], [60, 0]);
  const opacity = interpolate(local, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });

  const patients = [
    {
      name: "Sarah Johnson",
      initials: "SJ",
      phase: "ACTIVE",
      phaseColor: BRAND.success,
      adherence: 80,
      lastActive: "Today",
    },
    {
      name: "Michael Chen",
      initials: "MC",
      phase: "RE_ENGAGING",
      phaseColor: BRAND.critical,
      adherence: 45,
      lastActive: "3 days ago",
    },
    {
      name: "Lisa Park",
      initials: "LP",
      phase: "ONBOARDING",
      phaseColor: BRAND.warning,
      adherence: 0,
      lastActive: "Today",
    },
  ];

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        borderRadius: 20,
        background: BRAND.white,
        overflow: "hidden",
        boxShadow: SHADOW.card,
        width: 680,
      }}
    >
      {/* Header */}
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

      {/* Rows */}
      {patients.map((p, i) => {
        const rowDelay = startFrame + 8 + i * 6;
        const rowLocal = frame - rowDelay;
        const rowOpacity =
          rowLocal > 0
            ? interpolate(rowLocal, [0, 10], [0, 1], {
                extrapolateRight: "clamp",
              })
            : 0;
        const rowY =
          rowLocal > 0
            ? interpolate(rowLocal, [0, 10], [8, 0], {
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              })
            : 8;

        return (
          <div
            key={p.name}
            style={{
              opacity: rowOpacity,
              transform: `translateY(${rowY}px)`,
              display: "grid",
              gridTemplateColumns: "1.8fr 1fr 1.2fr 1fr",
              gap: 12,
              alignItems: "center",
              padding: "12px 24px",
              borderBottom:
                i < patients.length - 1
                  ? `1px solid ${BRAND.border}`
                  : "none",
              fontFamily: FONTS.sans,
              fontSize: 13,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: BRAND.primary,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: BRAND.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {p.initials}
              </div>
              {p.name}
            </div>
            <div>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: hexToRgba(p.phaseColor, 0.12),
                  color: p.phaseColor,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {p.phase}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {p.adherence > 0 && (
                <>
                  <span style={{ color: BRAND.textMuted, minWidth: 30 }}>
                    {p.adherence}%
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 3,
                      background: BRAND.primaryLight,
                      overflow: "hidden",
                      maxWidth: 70,
                    }}
                  >
                    <div
                      style={{
                        width: `${p.adherence}%`,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          p.adherence > 70 ? BRAND.success : BRAND.warning,
                      }}
                    />
                  </div>
                </>
              )}
              {p.adherence === 0 && (
                <span style={{ color: BRAND.textLight }}>{"\u2014"}</span>
              )}
            </div>
            <div style={{ color: BRAND.textMuted }}>{p.lastActive}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Alert card with acknowledge interaction                            */
/* ------------------------------------------------------------------ */

const AlertCardFloat: React.FC<{
  startFrame: number;
  ackFrame: number;
}> = ({ startFrame, ackFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const entrySpring = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 90, mass: 0.6 },
  });
  const x = interpolate(entrySpring, [0, 1], [80, 0]);
  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Pulse red border
  const pulse =
    local > 12
      ? interpolate(Math.sin(local * 0.15), [-1, 1], [0.4, 1])
      : 1;

  // Acknowledge state
  const isAcked = frame >= ackFrame;
  const ackLocal = Math.max(0, frame - ackFrame);
  const ackSpring = spring({
    frame: ackLocal,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.5 },
  });
  const ackScale = isAcked ? interpolate(ackSpring, [0, 1], [0.9, 1]) : 1;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        padding: "20px 24px",
        borderRadius: 20,
        background: BRAND.white,
        borderLeft: `5px solid ${hexToRgba(BRAND.critical, pulse)}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        boxShadow: SHADOW.alert,
        width: 400,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
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

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 6,
              background: hexToRgba(BRAND.critical, 0.08),
              color: BRAND.critical,
              fontFamily: FONTS.sans,
              fontSize: 10,
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
            fontSize: 15,
            fontWeight: 600,
            color: BRAND.primary,
            marginBottom: 3,
          }}
        >
          Patient reported severe pain
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 13,
            color: BRAND.textMuted,
            lineHeight: 1.4,
          }}
        >
          Immediate clinical review recommended
        </div>
      </div>

      {/* Acknowledge button */}
      <div
        style={{
          padding: "8px 16px",
          borderRadius: 10,
          background: isAcked ? hexToRgba(BRAND.success, 0.1) : BRAND.surfaceAlt,
          border: `1px solid ${isAcked ? BRAND.success : BRAND.border}`,
          fontFamily: FONTS.sans,
          fontSize: 12,
          fontWeight: 600,
          color: isAcked ? BRAND.success : BRAND.textMuted,
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
          transform: `scale(${ackScale})`,
          whiteSpace: "nowrap",
        }}
      >
        {isAcked ? (
          <>
            <svg
              width="14"
              height="14"
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
/*  Cursor SVG                                                         */
/* ------------------------------------------------------------------ */

const Cursor: React.FC<{
  startFrame: number;
  endFrame: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}> = ({ startFrame, endFrame, fromX, fromY, toX, toY }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || frame > endFrame) return null;

  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const x = interpolate(progress, [0, 1], [fromX, toX]);
  const y = interpolate(progress, [0, 1], [fromY, toY]);

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 6, endFrame - 4, endFrame],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        zIndex: 50,
        pointerEvents: "none",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3l14 8.5L12 14l-2.5 7.5L5 3z"
          fill={BRAND.white}
          stroke={BRAND.primary}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  DashboardShowcaseScene (270 frames = 9s)                           */
/* ------------------------------------------------------------------ */

export const DashboardShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /*
   * 0-10:    Transition in (slide from right)
   * 5-20:    Dark sidebar strip slides in from left
   * 12-40:   Three stat cards fly in staggered from right
   * 45-80:   Patient table card rises from below
   * 85-115:  Alert card slides in from right
   * 85-115:  Camera pushes in slightly toward alert area
   * 125-142: Cursor drifts toward Acknowledge button
   * 142:     Acknowledge triggers (button turns green)
   * 150-270: Hold with gentle breathing
   */

  // --- Camera push-in toward alert ---
  const cameraScale = interpolate(
    frame,
    [0, 85, 130, 270],
    [1, 1, 1.06, 1.06],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );
  const cameraPanX = interpolate(frame, [85, 130], [0, 25], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const cameraPanY = interpolate(frame, [85, 130], [0, 35], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Subtle floating
  const driftY = frame > 155 ? Math.sin((frame - 155) * 0.012) * 3 : 0;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, #F5F5F5, #EAEAEA)`,
      }}
    >
      {/* Subtle cool glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "30%",
          width: 500,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(27,32,33,0.03), transparent 70%)",
          transform: "translate(50%, -50%)",
          filter: "blur(80px)",
        }}
      />

      {/* Camera container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${cameraScale}) translate(${cameraPanX}px, ${cameraPanY + driftY}px)`,
          transformOrigin: "72% 62%",
        }}
      >
        {/* Sidebar strip */}
        <SidebarStrip startFrame={5} />

        {/* Stat cards — staggered from right */}
        <div
          style={{
            position: "absolute",
            top: 235,
            left: 700,
            display: "flex",
            gap: 18,
          }}
        >
          <FloatingStatCard
            label="Active Patients"
            targetValue={12}
            iconColor={BRAND.accentDark}
            startFrame={12}
            fromX={100}
            fromY={-30}
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
          <FloatingStatCard
            label="Avg Adherence"
            targetValue={87}
            suffix="%"
            iconColor={BRAND.success}
            startFrame={20}
            fromX={80}
            fromY={-40}
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
          <FloatingStatCard
            label="Pending Alerts"
            targetValue={3}
            iconColor={BRAND.critical}
            startFrame={28}
            fromX={60}
            fromY={-50}
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
            position: "absolute",
            top: 355,
            left: 700,
          }}
        >
          <PatientTableCard startFrame={48} />
        </div>

        {/* Alert card */}
        <div
          style={{
            position: "absolute",
            top: 590,
            left: 850,
          }}
        >
          <AlertCardFloat startFrame={88} ackFrame={145} />
        </div>

        {/* Cursor interaction */}
        <Cursor
          startFrame={125}
          endFrame={144}
          fromX={1050}
          fromY={480}
          toX={1200}
          toY={645}
        />
      </div>
    </AbsoluteFill>
  );
};

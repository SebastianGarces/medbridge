"use client";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "success" | "primary" | "warning" | "secondary";
  icon: React.ReactNode;
}

const colorMap = {
  success: {
    bg: "bg-success-light",
    text: "text-success",
    iconBg: "bg-success/10",
  },
  primary: {
    bg: "bg-accent-light",
    text: "text-accent-dark",
    iconBg: "bg-accent/10",
  },
  warning: {
    bg: "bg-warning-light",
    text: "text-warning",
    iconBg: "bg-warning/10",
  },
  secondary: {
    bg: "bg-secondary-light",
    text: "text-secondary",
    iconBg: "bg-secondary/10",
  },
};

export default function MetricCard({
  label,
  value,
  subtitle,
  color = "primary",
  icon,
}: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted font-medium">{label}</p>
          <p className={`text-2xl font-semibold mt-1 ${colors.text}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-text-faint mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center ${colors.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

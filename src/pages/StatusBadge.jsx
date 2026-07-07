// BUG FIX: old statuses (approved, on_delivery, closed, declined) don't exist in backend.
// Backend OrderStatus enum: scheduled, pending, paid, preparing, ready, delivered, cancelled
import { useState, useEffect } from "react";

const STATUS_STYLES = {
  scheduled: "bg-indigo-100 text-indigo-800",
  pending:   "bg-yellow-100 text-yellow-800",
  paid:      "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready:     "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// Human-readable labels for each status
const STATUS_LABELS = {
  scheduled: "Scheduled",
  pending:   "Pending",
  paid:      "Paid",
  preparing: "Preparing",
  ready:     "Ready for Pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatCountdown(ms) {
  if (ms <= 0) return "starting now";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * StatusBadge — shows the order status pill.
 *
 * For `scheduled` orders, pass `scheduledFor` (ISO string) and `isProBite`
 * to also render a live countdown to the scheduled time. The countdown is
 * a ProBite perk — free-plan callers should omit `isProBite` (or pass
 * false) so only the plain "Scheduled" pill shows, with no time details,
 * matching the free-plan restriction on cancelling scheduled orders too.
 */
export default function StatusBadge({ status, scheduledFor, isProBite }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status !== "scheduled" || !scheduledFor || !isProBite) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status, scheduledFor, isProBite]);

  const showCountdown = status === "scheduled" && scheduledFor && isProBite;
  const msRemaining = showCountdown ? new Date(scheduledFor).getTime() - now : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
      {showCountdown && (
        <span className="opacity-75 font-normal">· {formatCountdown(msRemaining)}</span>
      )}
    </span>
  );
}

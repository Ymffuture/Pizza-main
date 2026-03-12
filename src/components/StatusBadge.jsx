// BUG FIX: old statuses (approved, on_delivery, closed, declined) don't exist in backend.
// Backend OrderStatus enum: pending, paid, preparing, ready, delivered, cancelled
const STATUS_STYLES = {
  pending:   "bg-yellow-100 text-yellow-800",
  paid:      "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready:     "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// Human-readable labels for each status
const STATUS_LABELS = {
  pending:   "Pending",
  paid:      "Paid",
  preparing: "Preparing",
  ready:     "Ready for Pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

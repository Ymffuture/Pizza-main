const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  on_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  closed: "bg-gray-200 text-gray-800",
  declined: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        STATUS_STYLES[status] || "bg-gray-100"
      }`}
    >
      {status}
    </span>
  );
}

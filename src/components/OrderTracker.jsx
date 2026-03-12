import StatusBadge from "./StatusBadge";

// BUG FIX: was order.order_status → backend returns order.status
// BUG FIX: was order.customer_name → backend returns order.user_id
// BUG FIX: was order.total_amount displayed raw → format as currency
export default function OrderTracker({ order }) {
  return (
    <div className="border p-6 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">
        Order #{order.id?.slice(-8).toUpperCase()}
      </h2>

      {/* BUG FIX: was order.order_status */}
      <StatusBadge status={order.status} />

      <div className="mt-4 space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-medium">Total:</span> R{order.total_amount?.toFixed(2)}
        </p>
        {/* BUG FIX: backend does not return customer_name — show user_id instead */}
        <p>
          <span className="font-medium">User:</span> {order.user_id}
        </p>
        {order.delivery_address && (
          <p>
            <span className="font-medium">Address:</span> {order.delivery_address}
          </p>
        )}
        {order.items?.length > 0 && (
          <div className="mt-3">
            <p className="font-medium mb-1">Items:</p>
            <ul className="space-y-1">
              {order.items.map((item, i) => (
                <li key={i} className="text-gray-600">
                  • {item.name} ×{item.quantity} — R{item.price?.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

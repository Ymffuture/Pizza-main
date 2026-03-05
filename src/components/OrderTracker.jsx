import StatusBadge from "./StatusBadge";

export default function OrderTracker({ order }) {
  return (
    <div className="border p-6 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">
        Order #{order.id}
      </h2>

      <StatusBadge status={order.order_status} />

      <div className="mt-4">
        <p>Total: R{order.total_amount}</p>
        <p>Customer: {order.customer_name}</p>
      </div>
    </div>
  );
}

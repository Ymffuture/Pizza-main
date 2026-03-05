import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useOrder from "../hooks/useOrder";
import usePolling from "../hooks/usePolling";
import OrderTracker from "../components/OrderTracker";

export default function OrderStatus() {
  const { id } = useParams();
  const { fetchOrder } = useOrder();
  const [order, setOrder] = useState(null);

  const load = async () => {
    const data = await fetchOrder(id);
    setOrder(data);
  };

  useEffect(() => {
    load();
  }, [id]);

  usePolling(load, 5000);

  if (!order) return <p>Loading...</p>;

  return <OrderTracker order={order} />;
}

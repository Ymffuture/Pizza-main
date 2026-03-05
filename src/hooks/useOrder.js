import { useState } from "react";
import { createOrder, getOrderById } from "../api/orders.api";

export default function useOrder() {
  const [loading, setLoading] = useState(false);

  const submitOrder = async (data) => {
    setLoading(true);
    try {
      const res = await createOrder(data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async (id) => {
    const res = await getOrderById(id);
    return res.data;
  };

  return { submitOrder, fetchOrder, loading };
}

import { initializePayment } from "../api/payments.api";

export default function usePayment() {
  const startPayment = async (orderId) => {
    const res = await initializePayment(orderId);
    window.location.href = res.data.authorization_url;
  };

  return { startPayment };
}

import { initializePayment } from "../api/payments.api";

export default function usePayment() {
  const startPayment = async (orderId) => {
    const res = await initializePayment(orderId);

    // ✅ FIX: Paystack's response shape is:
    //   { status: true, message: "...", data: { authorization_url: "...", ... } }
    // axios wraps this in res.data, so the URL is at res.data.data.authorization_url
    // Old code used res.data.authorization_url → always undefined → redirect to "undefined"
    const url =
      res?.data?.data?.authorization_url ||   // Paystack standard
      res?.data?.authorization_url;           // fallback if backend unwraps it

    if (!url) throw new Error("No authorization URL returned from Paystack");

    window.location.href = url;
  };

  return { startPayment };
}

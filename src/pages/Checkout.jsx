import { useState } from "react";
import useOrder from "../hooks/useOrder";
import usePayment from "../hooks/usePayment";

export default function Checkout() {
  const { submitOrder } = useOrder();
  const { startPayment } = usePayment();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const order = await submitOrder(form);
    await startPayment(order.id);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 space-y-4"
    >
      <input
        placeholder="Name"
        className="w-full border p-2"
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />
      <input
        placeholder="Phone"
        className="w-full border p-2"
        onChange={(e) =>
          setForm({ ...form, phone: e.target.value })
        }
      />
      <input
        placeholder="Email"
        className="w-full border p-2"
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />
      <button className="bg-black text-white w-full py-2 rounded">
        Pay & Order
      </button>
    </form>
  );
}

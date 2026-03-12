import { useNavigate } from "react-router-dom";

// Placeholder — replace with your real cart UI
export default function Cart() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-black">Your Cart</h1>
      <p className="text-gray-500">Cart items will appear here.</p>
      <button
        onClick={() => navigate("/menu")}
        className="bg-[#DA291C] text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition"
      >
        ← Back to Menu
      </button>
      <button
        onClick={() => navigate("/checkout")}
        className="bg-[#FFC72C] text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-yellow-300 transition"
      >
        Proceed to Checkout →
      </button>
    </div>
  );
}

import { formatCurrency } from "../utils/formatCurrency";

export default function MenuCard({ item, onSelect }) {
  return (
    <div className="border rounded-xl p-4 shadow-sm">
      <img
        src={item.image}
        alt={item.name}
        className="h-48 w-full object-cover rounded-lg"
        loading="lazy"
      />
      <h3 className="text-lg font-semibold mt-3">{item.name}</h3>
      <p className="text-gray-600">{formatCurrency(item.price)}</p>
      <button
        onClick={() => onSelect(item)}
        className="mt-3 bg-black text-white px-4 py-2 rounded-lg w-full"
      >
        Order
      </button>
    </div>
  );
}

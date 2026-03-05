import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold">Kota Ordering</h1>
      <Link
        to="/menu"
        className="mt-6 inline-block bg-black text-white px-6 py-3 rounded-lg"
      >
        View Menu
      </Link>
    </div>
  );
}

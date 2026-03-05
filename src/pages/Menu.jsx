import { useEffect, useState } from "react";
import { getMenu } from "../api/menu.api";
import MenuCard from "../components/MenuCard";
import Loader from "./components/Loader" ;
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMenu()
      .then((res) => setMenu(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Loader/>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DA291C] via-[#DA291C] to-[#FFC72C] pb-12">
      {/* Header */}
      <div className="bg-[#DA291C] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FFC72C] rounded-full flex items-center justify-center shadow-inner">
              <span className="text-[#DA291C] text-2xl font-black">M</span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight italic">
                OUR MENU
              </h1>
              <p className="text-[#FFC72C] font-bold text-sm tracking-widest uppercase">
                I'm lovin' it
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.map((item, index) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Golden Arches accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFC72C] via-[#DA291C] to-[#FFC72C]"></div>
              
              <MenuCard
                item={item}
                onSelect={() => navigate(`/checkout?item=${item.id}`)}
                className="h-full"
              />
              
              {/* Hover overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#DA291C]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/cart')}
        className="fixed bottom-6 right-6 bg-[#DA291C] hover:bg-[#b91c1c] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3 z-50 border-4 border-[#FFC72C]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>
    </div>
  );
}

import { useState } from 'react';
import { formatCurrency } from "../utils/formatCurrency";

export default function MenuCard({ item, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div 
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="w-full h-full bg-white rounded-2xl" />
        </div>
      </div>

      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer bg-[length:200%_100%]" />
        )}
        
        {/* BUG FIX: was item.image — backend returns item.image_url */}
        <img
          src={item.image_url}
          alt={item.name}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
            isHovered ? 'scale-110 rotate-1' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />

        <div className="absolute top-3 left-3 transform transition-all duration-300 group-hover:scale-105">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            Available
          </span>
        </div>

        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-2 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105"
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5 space-y-3">
        <div className="relative inline-block">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-500 transition-all duration-300">
            {item.name}
          </h3>
          <div className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-500 ${
            isHovered ? 'w-full' : 'w-0'
          }`} />
        </div>

        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Price</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {formatCurrency(item.price)}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 transition-all duration-300 ${
                  i < (item.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-200'
                }`}
                style={{ transitionDelay: `${i * 50}ms` }}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSelect(item)}
          className={`relative w-full mt-4 py-3.5 rounded-xl font-bold text-white overflow-hidden transition-all duration-300 transform ${
            isPressed ? 'scale-95' : 'scale-100'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 animate-gradient-x bg-[length:200%_100%]" />
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
          <span className="relative flex items-center justify-center space-x-2">
            <span>Add to Order</span>
            <svg className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>

      <div className={`absolute top-4 right-4 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      {/* BUG FIX: was <style jsx> — "jsx" is not a valid HTML attribute and breaks the style tag.
          This project does NOT use styled-components/emotion, so it must be plain <style>. */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-shimmer { animation: shimmer 1.5s infinite; }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }
      `}</style>
    </div>
  );
}

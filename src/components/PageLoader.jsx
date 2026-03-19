export default function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        
        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-orange-500 border-t-black rounded-full animate-spin"></div>

        {/* Text */}
        <p className="text-black font-semibold tracking-wide">
          Loading KotaBites...
        </p>

      </div>
    </div>
  );
}

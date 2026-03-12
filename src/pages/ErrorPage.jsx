import { useNavigate, useRouteError } from "react-router-dom";

// BUG FIX: was importing Layout from '../components/Layout' which does not exist
// in this project — removed the import and replaced with a plain div wrapper
export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex justify-center flex-col items-center py-10 space-y-3 text-center px-6">
        <h1 className="text-4xl font-bold">Oops!</h1>
        <p className="text-gray-600">Sorry, an unexpected error has occurred.</p>
        <p className="text-red-500 italic">
          {error?.statusText || error?.message || "Unknown error"}
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

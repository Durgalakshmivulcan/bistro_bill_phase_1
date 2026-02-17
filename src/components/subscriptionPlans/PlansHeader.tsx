import { useNavigate } from "react-router-dom";

const PlansHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-800">
        Plans
      </h1>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search here..."
          className="border px-4 py-2 rounded-md text-sm"
        />

        <button
          onClick={() => navigate("/subscription-plans/create")}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
        >
          Create New Plan
        </button>
      </div>
    </div>
  );
};

export default PlansHeader;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LoadingSpinner from "../Common/LoadingSpinner";
import { getAdvertisement, Advertisement } from "../../services/marketingService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ViewAdvertisement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadAdvertisement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAdvertisement = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdvertisement(id!);
      if (response.success && response.data) {
        setAdvertisement(response.data);
      } else {
        setError("Advertisement not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load advertisement");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatNumber = (n: number) => {
    return n.toLocaleString("en-IN");
  };

  if (loading) {
    return (
      <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading advertisement..." />
      </div>
    );
  }

  if (error || !advertisement) {
    return (
      <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Advertisement not found"}</p>
          <button
            onClick={() => navigate("/marketing/advertisements")}
            className="bg-bb-primary px-4 py-2 rounded"
          >
            Back to Advertisements
          </button>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Impressions", value: advertisement.impressions, fill: "#3B82F6" },
    { name: "Clicks", value: advertisement.clicks, fill: "#10B981" },
    { name: "Conversions", value: advertisement.conversions, fill: "#F59E0B" },
  ];

  const funnelData = [
    {
      name: "Funnel",
      Impressions: advertisement.impressions,
      Clicks: advertisement.clicks,
      Conversions: advertisement.conversions,
    },
  ];

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/marketing/advertisements")}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{advertisement.title}</h1>
            <p className="text-sm text-gray-500">Campaign Performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              advertisement.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {advertisement.status}
          </span>
          <button
            onClick={() => navigate(`/marketing/advertisements/edit/${id}`)}
            className="bg-black text-white px-4 py-2 rounded text-sm"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Impressions</p>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(advertisement.impressions)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Clicks</p>
          <p className="text-2xl font-bold text-green-600">{formatNumber(advertisement.clicks)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">CTR</p>
          <p className="text-2xl font-bold text-purple-600">{advertisement.ctr}%</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Conversions</p>
          <p className="text-2xl font-bold text-amber-600">{formatNumber(advertisement.conversions)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-2xl font-bold text-rose-600">{advertisement.conversionRate}%</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Impressions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Clicks" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Conversions" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ad Details */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Advertisement Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Description</span>
              <span className="font-medium text-right max-w-[60%]">{advertisement.description || "N/A"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Start Date</span>
              <span className="font-medium">{formatDate(advertisement.startDate)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">End Date</span>
              <span className="font-medium">{formatDate(advertisement.endDate)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Created</span>
              <span className="font-medium">{formatDate(advertisement.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Linked Discounts */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Linked Discounts</h2>
          {advertisement.linkedDiscounts.length === 0 ? (
            <p className="text-gray-500 text-sm">No discounts linked to this advertisement</p>
          ) : (
            <div className="space-y-2">
              {advertisement.linkedDiscounts.map((discount) => (
                <div
                  key={discount.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                >
                  <span className="font-medium">{discount.name}</span>
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {discount.code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {advertisement.image && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Advertisement Image</h2>
          <img
            src={advertisement.image}
            alt={advertisement.title}
            className="max-h-[300px] rounded-lg object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}

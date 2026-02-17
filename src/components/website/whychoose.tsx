import { CheckCircle } from "lucide-react";

const WHY_CARDS = [
  {
    title: "Real-time Kitchen-POS Integration",
    desc:
      "Orders flow instantly from POS to kitchen with automatic timing and status updates.",
    highlight: "Reduce order preparation time by 30%",
  },
  {
    title: "Automated Inventory Deduction",
    desc:
      "Every sale automatically updates inventory levels with smart reorder alerts.",
    highlight: "Eliminate 95% of manual inventory tracking",
  },
  {
    title: "Smart Table Reservations",
    desc:
      "AI-powered table allocation with customer preferences and optimal seating.",
    highlight: "Increase table turnover by 25%",
  },
  {
    title: "Multi-channel Sales Control",
    desc:
      "Manage dine-in, takeaway, delivery, and catering from one unified platform.",
    highlight: "Streamline operations across all channels",
  },
  {
    title: "Data-rich Customer Profiles",
    desc:
      "Comprehensive customer insights for personalized service and targeted marketing.",
    highlight: "Boost customer retention by 40%",
  },
  {
    title: "Scalable Architecture",
    desc:
      "Seamlessly expand from single outlet to multiple branches with centralized control.",
    highlight: "Scale without operational complexity",
  },
];

const WhyChoose = () => {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 space-y-16">

        {/* ===== HEADER ===== */}
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-3xl font-bold">
            Why Choose Bistro Bill?
          </h2>
          <p className="mt-3 text-gray-600">
            Experience the power of integrated restaurant management
            with measurable business impact.
          </p>
        </div>

        {/* ===== FEATURE CARDS ===== */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_CARDS.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl border p-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="text-[#FDC836]" size={20} />
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.desc}
                  </p>

                  <span className="inline-block mt-3 px-3 py-1 text-xs rounded-md bg-[#FFF3CD] text-[#B88700]">
                    {item.highlight}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== BUILT FOR SCALE ===== */}
        <div className="bg-[#F3F3F3] rounded-2xl p-8 lg:p-12 grid lg:grid-cols-3 gap-8">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-2xl font-bold">
              Built for Scale: Single Outlet to Enterprise
            </h3>

            <p className="text-gray-600">
              Start with one location and expand confidently. Bistro Bill grows
              with your business, providing enterprise-grade features whether
              you're managing one restaurant or a hundred.
            </p>

            <ul className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
              {[
                "Single dashboard for all locations",
                "Unified customer database",
                "Brand-consistent operations",
                "Centralized inventory management",
                "Cross-location analytics",
                "Remote management capabilities",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#FDC836]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT STATS CARD */}
          <div className="bg-[#FFFCF2] rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold mb-4">Growth Statistics</h4>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Revenue Increase</span>
                <span className="font-medium text-[#FDC836]">23%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Operational Efficiency</span>
                <span className="font-medium text-[#FDC836]">35%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer Satisfaction</span>
                <span className="font-medium text-[#FDC836]">4.8/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Setup Time</span>
                <span className="font-medium text-[#FDC836]">24hrs</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyChoose;

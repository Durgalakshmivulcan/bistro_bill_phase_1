import { Check } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="bg-[#F5F5F5] py-20">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">

        {/* ================= LEFT CONTENT ================= */}
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            Streamline Your{" "}
            <span className="block text-[#FDC836]">Restaurant</span>
            Operation
          </h1>

          <p className="mt-5 text-gray-600 max-w-xl text-sm leading-relaxed">
            Bistro Bill is the all-in-one restaurant management platform that
            connects your POS, kitchen, inventory, and customer data. Scale from
            single outlet to multiple branches with ease.
          </p>

          {/* FEATURES LIST */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-700">
            {[
              "Real-time Kitchen-POS Integration",
              "Multi-channel Sales Control",
              "Automated Inventory Management",
              "Smart Table Reservations",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check size={14} className="text-[#FDC836]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* CTA BUTTONS */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="bg-[#FDC836] hover:bg-[#f5c12a] px-6 py-3 rounded-md text-sm text-white font-medium transition">
              Book Free Demo
            </button>

            <button className="border border-[#FDC836] text-[#FDC836] px-6 py-3 rounded-md text-sm font-medium hover:bg-[#FDC836]/10 transition">
              Start Free Trial
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Trusted by 500+ restaurants · No setup fees · 24/7 support
          </p>
        </div>

        {/* ================= RIGHT MOCK CARD ================= */}
        <div className="relative flex justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md transform rotate-[3deg]">
            
            {/* CARD HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-sm">Kitchen Display</h4>
              <span className="text-xs bg-[#FDC836] text-white px-3 py-1 rounded-full">
                Live
              </span>
            </div>

            {/* ORDER LIST */}
            <div className="space-y-3 text-sm bg-[#F3F3F3] p-3">
              <div className="flex justify-between items-center border-l-4 border-yellow-400 px-3 py-2 rounded bg-white">
                <span>Table 12 – Pasta Carbonara</span>
                <span className="text-yellow-600 text-xs">2 Min</span>
              </div>

              <div className="flex justify-between items-center border-l-4 border-green-500 px-3 py-2 rounded bg-white">
                <span>Table 12 – Pasta Carbonara</span>
                <span className="text-green-600 text-xs">Ready</span>
              </div>

              <div className="flex justify-between items-center border-l-4 border-red-500 px-3 py-2 rounded bg-white">
                <span>Table 12 – Pasta Carbonara</span>
                <span className="text-red-500 text-xs">5 Min</span>
              </div>
            </div>
          </div>

          {/* INVENTORY ALERT BADGE */}
          <div className="absolute -bottom-6 left-12 bg-[#FDC836] text-white text-xs px-4 py-2 rounded-lg shadow-md">
            Inventory Alert<br />
            Tomatoes: 12kg left
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;

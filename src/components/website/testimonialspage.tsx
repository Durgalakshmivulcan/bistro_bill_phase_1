import { Star, Quote } from "lucide-react";
// import DashboardLayout from "../layout/DashboardLayout";
import Footer from "../footer";
import PublicHeader from "../publicHeader";

const STATS = [
  { value: "500+", label: "Happy Restaurants", sub: "across 50+ countries" },
  { value: "99.9%", label: "Uptime Guarantee", sub: "24/7 availability" },
  { value: "35%", label: "Average Efficiency Gain", sub: "reduced order times" },
  { value: "48hrs", label: "Quick Setup", sub: "from signup to live" },
];

const TESTIMONIALS = Array.from({ length: 6 }).map((_, i) => ({
  id: i,
  text:
    "Bistro Bill transformed our operations completely. The real-time kitchen integration alone saved us 2 hours daily, and our customer satisfaction scores improved dramatically.",
  name: "Sarah Chen",
  role: "Owner, Garden Bistro",
  location: "San Francisco, CA",
  image: "/images/website/userprofile.jpg", // replace with actual image
}));

export default function TestimonialsPage() {
  return (
    <><PublicHeader />
      <div className="bg-[#FFFDF6] min-h-screen pt-16">

        {/* ================= HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold">What Our Customers Say</h1>
          <p className="text-black mt-2 text-sm">
            Real stories from restaurant owners who transformed their operations
            with Bistro Bill.
          </p>
        </div>

        {/* ================= STATS ================= */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-[#FDC836]">{s.value}</p>
              <p className="text-black font-bold">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ================= TESTIMONIAL GRID ================= */}
        <div className="mt-16 w-full bg-[#F3F3F3] p-6">

        <div className="mt-10 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto bg-[#F3F3F3] p-6">

          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              {/* Quote + Stars */}
              <div className="flex items-center justify-between mb-3">
                <Quote size={18} className="text-[#FDC836]" />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="fill-[#FDC836] text-[#FDC836]"
                    />
                  ))}
                </div>
              </div>

              {/* Testimonial Text */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {t.text}
              </p>

              {/* User Info */}
              <div className="flex items-center gap-3 mt-4">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-8 h-8 rounded object-cover"
                />
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                  <p className="text-xs text-[#FDC836]">{t.location}</p>
                </div>
              </div>
            </div>
          ))}

        </div>
          </div>
      </div>
     <Footer /></>
  );
}

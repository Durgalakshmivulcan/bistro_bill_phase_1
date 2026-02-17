import { Quote } from "lucide-react";

const STATS = [
    { value: "500+", label: "Restaurants" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
    { value: "50+", label: "Countries" },
];

const TESTIMONIALS = [
    {
        name: "Sarah Chen",
        role: "Owner, Garden Bistro",
        location: "San Francisco, CA",
        text:
            "Bistro Bill transformed our operations completely. The real-time kitchen integration alone saved us 2 hours daily, and our customer satisfaction scores improved dramatically.",
        image: "/images/website/userprofile.jpg",
    },
    {
        name: "Marco Rodriguez",
        role: "COO, Bello Trattoria Chain",
        location: "Austin, TX",
        text:
            "Bistro Bill transformed our operations completely. The real-time kitchen integration closed our 2-hour daily gap, and our customer satisfaction scores improved dramatically.",
        image: "/images/website/userprofile.jpg",
    },
    {
        name: "Jennifer Park",
        role: "Manager, Seoul Kitchen",
        location: "Los Angeles, CA",
        text:
            "Bistro Bill transformed our operations completely. The real-time kitchen integration closed our 2-hour daily gap, and our customer satisfaction scores improved dramatically.",
        image: "/images/website/userprofile.jpg",
    },
];

const SECURITY = [
    {
        label: "SSL Encryption",
        image: "/images/website/lock.jpg",
    },
    {
        label: "Cloud Backup",
        image: "/images/website/cloud.jpg",
    },
    {
        label: "PCI Compliant",
        image: "/images/website/laptop.jpg",
    },
    {
        label: "Mobile Ready",
        image: "/images/website/mobile.jpg",
    },
];


const TrustSection = () => {
    return (
        <section className="bg-[#F3F3F3] py-20">
            <div className="max-w-7xl mx-auto px-6 space-y-16">

                {/* ===== HEADER ===== */}
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold">
                        Trusted by Restaurant Owners Worldwide
                    </h2>
                    <p className="mt-3 text-gray-600 text-sm">
                        Join hundreds of successful restaurants that have transformed
                        their operations with Bistro Bill.
                    </p>
                </div>

                {/* ===== STATS ===== */}
                <div className="flex flex-wrap justify-center gap-12 text-sm">
                    {STATS.map((s) => (
                        <div key={s.label} className="text-center">
                            <p className="text-2xl font-bold text-[#FDC836]">
                                {s.value}
                            </p>
                            <p className="text-gray-700">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ===== TESTIMONIAL CARDS ===== */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TESTIMONIALS.map((t) => (
                        <div
                            key={t.name}
                            className="
        bg-white
        rounded-2xl
        p-8
        border
        shadow-sm
        flex flex-col
        justify-between
      "
                        >
                            {/* QUOTE ICON */}
                            <Quote
                                size={22}
                                className="text-[#FDC836] mb-4"
                                strokeWidth={3}
                            />

                            {/* TESTIMONIAL TEXT */}
                            <p className="text-[15px] leading-relaxed text-gray-700 mb-8">
                                {t.text}
                            </p>

                            {/* AUTHOR */}
                            <div className="flex items-center gap-4">
                                {/* AVATAR */}
                                <img
                                    src={t.image}
                                    alt={t.name}
                                    className="w-12 h-12 rounded-md object-cover"
                                />

                                {/* DETAILS */}
                                <div>
                                    <p className="text-lg font-bold leading-tight">
                                        {t.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {t.role}
                                    </p>
                                    <p className="text-sm text-[#FDC836] font-medium">
                                        {t.location}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                {/* ===== SECURITY & COMPLIANCE ===== */}
                <div className="bg-white rounded-2xl py-10 px-6">
                    <h3 className="text-center font-semibold mb-8">
                        Enterprise-Grade Security & Compliance
                    </h3>

                    <div className="flex flex-wrap justify-center gap-16 text-sm text-gray-600">
                        {SECURITY.map((s) => (
                            <div key={s.label} className="flex flex-col items-center gap-3">

                                {/* ICON CIRCLE */}
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <img
                                        src={s.image}
                                        alt={s.label}
                                        className="w-12 h-12 rounded-full"
                                    />
                                </div>

                                {/* LABEL */}
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>

                </div>

            </div>
        </section>
    );
};

export default TrustSection;

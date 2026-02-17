import PublicHeader from "../../components/publicHeader";
import Footer from "../../components/footer";
import {
    ShoppingCart,
    Monitor,
    CalendarCheck,
    Boxes,
    Users,
    Heart,
    Utensils,
    BarChart3,
    CheckCircle,
    ArrowRight,
} from "lucide-react";

export const FEATURES = [
    {
        title: "Point of Sale (POS) System",
        module: "Module-1",
        desc: "Complete point-of-sale solution for all dining formats with real-time order processing and payment integration.",
        icon: ShoppingCart,
        bg: "bg-blue-50",
    },
    {
        title: "Kitchen Display System (KDS)",
        module: "Module-2",
        desc: "Real-time kitchen operations management with order prioritization, timing controls, and seamless POS integration.",
        icon: Monitor,
        bg: "bg-orange-50",
    },
    {
        title: "Table & Reservations",
        module: "Module-3",
        desc: "Smart table management system with automated reservations, floor planning, and customer preference tracking.",
        icon: CalendarCheck,
        bg: "bg-green-50",
    },
    {
        title: "Inventory Management",
        module: "Module-4",
        desc: "Automated inventory tracking with intelligent purchase orders, supplier management, and cost analysis.",
        icon: Boxes,
        bg: "bg-purple-50",
    },
    {
        title: "Staff Management",
        module: "Module-5",
        desc: "Comprehensive staff management with role-based access, shift scheduling, performance tracking, and payroll integration.",
        icon: Users,
        bg: "bg-blue-50",
    },
    {
        title: "Customer Loyalty & Marketing",
        module: "Module-6",
        desc: "Advanced customer relationship management with loyalty programs, targeted marketing campaigns, and retention analytics.",
        icon: Heart,
        bg: "bg-pink-50",
    },
    {
        title: "Menu Management",
        module: "Module-7",
        desc: "Multi-channel menu control with dynamic pricing, category management, brand organization, and seasonal updates.",
        icon: Utensils,
        bg: "bg-yellow-50",
    },
    {
        title: "Analytics & Reporting",
        module: "Module-8",
        desc: "Comprehensive business intelligence with sales analytics, performance metrics, financial reports, and predictive insights.",
        icon: BarChart3,
        bg: "bg-emerald-50",
    },
];

const INTEGRATIONS = [
    "POS ↔ Kitchen Synchronization",
    "Cloud-based Restaurant Analytics",
    "Real-time Inventory Updates",
    "Multi-location Data Sync",
    "AI-powered Reporting Engine",
    "24/7 Customer Support Monitoring",
];

const CompleteRestaurantFeatures = () => {
    return (
        <><PublicHeader />
            <section className="bg-[#F3F3F3] py-20">
                <div className="max-w-7xl mx-auto px-6">

                    {/* HEADER */}
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold">
                            Complete Restaurant Management{" "}
                            <span className="text-[#FDC836]">Features</span>
                        </h2>
                        <p className="mt-3 text-sm text-gray-600">
                            Discover how Bistro Bill’s integrated modules work together to
                            streamline every aspect of your restaurant operations.
                        </p>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500 justify-items-center max-w-sm mx-auto">
                            <span><span className="text-bb-primary">✔</span> Core Modules</span>
                            <span><span className="text-bb-primary">✔ </span>Real-time Integration</span>
                            <span className="sm:col-span-2 text-center"><span className="text-bb-primary">✔ </span>Cloud-based</span>
                        </div>

                    </div>
                </div>
                <section className="bg-white py-3 mt-5">
                    <div className="max-w-7xl mx-auto px-6">

                        {/* GRID */}
                        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 cards-container">
                            {FEATURES.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.title}
                                        className={`rounded-xl p-6 border ${f.bg}`}
                                    >
                                        {/* ICON */}
                                        <div className="w-10 h-10 rounded-lg bg-[#FDC836] flex items-center justify-center">
                                            <Icon size={18} className="text-white" />
                                        </div>

                                        {/* TITLE + MODULE */}
                                        <div className="mt-4 flex items-center gap-2">
                                            <h4 className="font-semibold text-sm">{f.title}</h4>
                                            <span className="text-[10px] bg-[#FDC836] text-black px-2 py-0.5 rounded-full">
                                                {f.module}
                                            </span>
                                        </div>

                                        {/* DESCRIPTION */}
                                        <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                                            {f.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </section>

                {/* SEAMLESS INTEGRATION */}
                <div className="mt-20 bg-[#F3F3F3] rounded-2xl p-10 text-center">
                    <h3 className="text-xl font-bold">
                        Seamless Integration Architecture
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 max-w-2xl mx-auto">
                        All modules work together in perfect harmony, ensuring data flows
                        seamlessly across your restaurant operations.
                    </p>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {INTEGRATIONS.map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg"
                            >
                                <CheckCircle className="text-[#FDC836]" size={20} />
                                <span className="text-gray-700">{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <button className="mt-8 bg-[#FDC836] px-6 py-2 rounded-md flex items-center gap-2 text-white font-medium">
                            Book Demo
                            <ArrowRight size={20} />
                        </button>
                    </div>

                </div>
            </section >
            <Footer /></>
    );
};

export default CompleteRestaurantFeatures;

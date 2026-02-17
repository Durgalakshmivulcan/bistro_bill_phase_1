import {
    CreditCard,
    ChefHat,
    Armchair,
    Boxes,
    Users,
    Heart,
    Menu,
    BarChart3,
} from "lucide-react";

const FEATURES = [
    {
        title: "POS System",
        desc:
            "Complete point-of-sale for dine-in, takeaway, delivery, and catering with real-time order processing.",
        icon: CreditCard,
        points: [
            "Dine-in Orders",
            "Takeaway & Delivery",
            "Subscription Models",
            "Catering Management",
        ],
    },
    {
        title: "Kitchen Display System",
        desc:
            "Real-time kitchen operations with order tracking, timing, and seamless POS integration.",
        icon: ChefHat,
        points: [
            "Live Order Display",
            "Prep Time Tracking",
            "Kitchen Analytics",
            "Staff Notifications",
        ],
    },
    {
        title: "Table & Reservations",
        desc:
            "Smart table management with automated reservations, floor planning, and customer preferences.",
        icon: Armchair,
        points: [
            "Table Management",
            "Reservation System",
            "Floor Planning",
            "Waitlist Management",
        ],
    },
    {
        title: "Inventory Management",
        desc:
            "Automated inventory tracking with purchase orders, supplier management, and cost analysis.",
        icon: Boxes,
        points: [
            "Stock Tracking",
            "Purchase Orders",
            "Supplier Management",
            "Cost Analysis",
        ],
    },
    {
        title: "Staff Management",
        desc:
            "Role-based access control, shift scheduling, performance tracking, and payroll integration.",
        icon: Users,
        points: [
            "Role Management",
            "Shift Scheduling",
            "Performance Tracking",
            "Access Control",
        ],
    },
    {
        title: "Customer Loyalty",
        desc:
            "Comprehensive customer profiles, loyalty programs, targeted marketing, and retention tools.",
        icon: Heart,
        points: [
            "Customer Profiles",
            "Loyalty Programs",
            "Marketing Campaigns",
            "Retention Analytics",
        ],
    },
    {
        title: "Menu Management",
        desc:
            "Multi-channel menu control with dynamic pricing, category organization, and brand consistency.",
        icon: Menu,
        points: [
            "Channel-wise Menus",
            "Dynamic Pricing",
            "Category Management",
            "Brand Organization",
        ],
    },
    {
        title: "Analytics & Reports",
        desc:
            "Data-rich insights with sales analytics, performance metrics, and business intelligence.",
        icon: BarChart3,
        points: [
            "Sales Analytics",
            "Performance Metrics",
            "Financial Reports",
            "Business Intelligence",
        ],
    },
];

const FeaturesGrid = () => {
    return (
        <section className="bg-[#F3F3F3] py-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* HEADER */}
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-black">
                        Everything Your Restaurant Needs
                    </h2>
                    <p className="mt-3 text-gray-600 text-sm max-w-lg mx-auto">
                        From front-of-house to back-of-house, Bistro Bill covers every aspect
                        of your restaurant operations with integrated modules designed for
                        seamless workflow.
                    </p>
                </div>

                {/* GRID */}
                <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.title}
                                className="
                  bg-white
                  rounded-2xl
                  p-6
                  border
                  hover:shadow-lg
                  transition
                  flex flex-col
                "
                            >
                                {/* ICON */}
                                <div className="mb-4">
                                    <Icon className="w-6 h-6 text-black" />
                                </div>

                                {/* TITLE */}
                                <h3 className="font-semibold text-base text-black">
                                    {f.title}
                                </h3>

                                {/* DESCRIPTION */}
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                    {f.desc}
                                </p>

                                {/* BULLETS */}
                                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                                    {f.points.map((p) => (
                                        <li key={p} className="flex items-start gap-2">
                                            <span className="text-[#FDC836] mt-1">•</span>
                                            <span>{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* BOTTOM STRIP */}
                <div className="mt-16 bg-white rounded-2xl px-6 py-8 text-center shadow-sm">
                    <h4
                        className="font-bold text-lg"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Seamless Integration Architecture
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 max-w-3xl mx-auto">
                        All modules work together in real-time. When a customer places an
                        order, inventory automatically updates, kitchen receives
                        notification, and customer data is enriched for future marketing.
                    </p>

                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                        <div>
                            <p className="text-[#FDC836] font-semibold">Real-time</p>
                            <p className="text-gray-600">Data Sync</p>
                        </div>
                        <div>
                            <p className="text-[#FDC836] font-semibold">99.9%</p>
                            <p className="text-gray-600">Uptime</p>
                        </div>
                        <div>
                            <p className="text-[#FDC836] font-semibold">24/7</p>
                            <p className="text-gray-600">Support</p>
                        </div>
                        <div>
                            <p className="text-[#FDC836] font-semibold">Cloud</p>
                            <p className="text-gray-600">Based</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;

import { Search, MessageCircle, Phone, Mail, FileText, ChevronDown, Clock } from "lucide-react";
import Footer from "../footer";
import PublicHeader from "../publicHeader";

const SUPPORT_CARDS = [
    {
        title: "Live Chat",
        desc: "Get instant help from our support team",
        note: "24/7 for paid plans",
        button: "Start Chat",
        icon: MessageCircle,
    },
    {
        title: "Phone Support",
        desc: "Speak directly with our experts",
        note: "Mon–Fri 8AM–8PM EST",
        button: "Call Now",
        icon: Phone,
    },
    {
        title: "Email Support",
        desc: "Send us your questions anytime",
        note: "Response within 4 hours",
        button: "Send Email",
        icon: Mail,
    },
    {
        title: "Documentation",
        desc: "Comprehensive guides and tutorials",
        note: "Always available",
        button: "Browse Docs",
        icon: FileText,
    },
];

const FAQS = [
    "How do I set up my first restaurant location?",
    "Can I integrate Bistro Bill with my existing payment processor?",
    "How does the kitchen display system sync with orders?",
    "Is my data secure and backed up?",
    "Can I manage multiple restaurant locations?",
    "What kind of reporting and analytics are available?",
    "How do I train my staff on the new system?",
    "What happens if I need help during peak hours?",
];

export default function SupportPage() {
    return (
        <><PublicHeader />
            <div className="bg-white">

                {/* ================= HERO ================= */}
                <section className="bg-[#FFFBED] py-16 text-center">
                    <h1 className="text-3xl font-bold">
                        How Can We <span className="text-[#FDC836]">Help You?</span>
                    </h1>
                    <p className="text-sm text-gray-600 mt-2">
                        Get the support you need to make the most of your Bistro Bill experience.
                    </p>

                    <div className="mt-6 flex justify-center">
                        <div className="relative w-full max-w-md">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                placeholder="Search For Help..."
                                className="w-full border rounded-md pl-9 pr-3 py-2 text-sm bg-white"
                            />
                        </div>
                    </div>
                </section>

                {/* ================= SUPPORT OPTIONS ================= */}
                <section className="py-16 bg-[#F5F5F5]">
                    <div className="max-w-7xl mx-auto px-6">

                        <h2 className="text-3xl font-bold text-center">
                            Get Support Your Way
                        </h2>

                        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {SUPPORT_CARDS.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={card.title}
                                        className="bg-white border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF3CD] flex items-center justify-center">
                                            <Icon size={20} className="text-[#FDC836]" />
                                        </div>

                                        <h4 className="mt-4 font-semibold text-sm">
                                            {card.title}
                                        </h4>

                                        <p className="text-xs text-black mt-1">
                                            {card.desc}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                                            <Clock size={14} className="text-black" />
                                            {card.note}
                                        </div>
                                        <button className="mt-4 w-full bg-[#FDC836] text-[#F6FAF9] py-2 rounded-md font-medium">
                                            {card.button}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ================= FAQ ================= */}
                <section className="py-16 bg-white">
                    <div className="max-w-3xl mx-auto px-6">

                        <h2 className="text-3xl font-semibold text-center">
                            Frequently Asked Questions
                        </h2>

                        <p className="text-xs text-gray-500 text-center mt-1">
                            Get the latest restaurant industry insights delivered straight to your inbox.
                        </p>

                        <div className="mt-8 space-y-3">
                            {FAQS.map((q) => (
                                <div
                                    key={q}
          className="border !border-[#E5D8B2] rounded-md px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"

                                >
                                    <span className="text-sm text-gray-700">{q}</span>
                                    <ChevronDown size={20} className="text-[#E5D8B2]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </div>
            <Footer /></>
    );
}

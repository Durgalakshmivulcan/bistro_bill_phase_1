import { Check } from "lucide-react";

const FinalCTA = () => {
    return (
        <section className="bg-[#FFF9ED] py-20">
            <div className="max-w-6xl mx-auto px-6 text-center">

                {/* TITLE */}
                <h2 className="text-3xl font-bold mb-2">
                    Ready to Transform Your Restaurant?
                </h2>

                <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                    Join hundreds of successful restaurants using Bistro Bill to
                    streamline operations, increase revenue, and delight customers.
                </p>

                {/* CHECK LIST */}
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-700 mb-8">
                    {[
                        "Full platform access for 14 days",
                        "No credit card required",
                        "Setup assistance included",
                        "24/7 support during trial",
                    ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#FDC836] flex items-center justify-center">
                                <Check size={12} className="text-white" />
                            </span>
                            <span>{item}</span>
                        </div>
                    ))}
                </div>

                {/* CTA BUTTONS */}
                <div className="flex justify-center gap-4 flex-wrap mb-4">
                    <button className="bg-[#FDC836] hover:bg-[#f5c12a] text-black px-6 py-3 rounded-md font-medium transition">
                        Start Free 14-Day Trial
                    </button>

                    <button className="border border-[#FDC836] text-[#FDC836] px-6 py-3 rounded-md font-medium hover:bg-[#FDC836]/10 transition">
                        Book Live Demo
                    </button>
                </div>

                {/* CONTACT */}
                <p className="text-sm text-gray-600 mb-10">
                    Questions? Call us at{" "}
                    <span className="text-[#FDC836] font-medium">
                        +91 90099812 BISTRO
                    </span>{" "}
                    or email{" "}
                    <span className="text-[#FDC836] font-medium">
                        hello@bistrobill.com
                    </span>
                </p>

                {/* LIVE DEMO PREVIEW */}
                <div className="bg-[#FFFFFF] rounded-xl shadow-sm p-3 max-w-3xl mx-auto">
                    <div className="bg-[#F3F3F3] rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
                        <h4 className="text-sm font-semibold mb-4 text-left">
                            Live Demo Preview
                        </h4>

                        <div className="grid sm:grid-cols-3 gap-4 text-left">
                            {/* CARD 1 */}
                            <div className="bg-white border rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Today's Sales</p>
                                <p className="text-lg font-bold">$3,247</p>
                                <p className="text-xs text-green-600">
                                    ▲ 12% vs yesterday
                                </p>
                            </div>

                            {/* CARD 2 */}
                            <div className="bg-white border rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">
                                    Orders Processing
                                </p>
                                <p className="text-lg font-bold">8</p>
                                <p className="text-xs text-gray-500">
                                    Avg. 4.2 min prep time
                                </p>
                            </div>

                            {/* CARD 3 */}
                            <div className="bg-white border rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">
                                    Tables Occupied
                                </p>
                                <p className="text-lg font-bold text-[#FDC836]">
                                    12/16
                                </p>
                                <p className="text-xs text-gray-500">75% capacity</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FinalCTA;

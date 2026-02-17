import { ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Bistro Bill"
              className="h-14 w-auto"
            />
          </div>
          <p className="text-sm text-gray-400 max-w-md">
            The all-in-one restaurant management platform that helps you streamline operations,
            increase revenue, and delight customers.
          </p>
          <div>
            <p className="text-sm font-medium mb-2">Stay Updated</p>
            <div className="flex flex-wrap gap-3">
              <input
                placeholder="Enter your email"
                className="flex-1 bg-[#1A1A1A] border border-gray-700 px-4 py-2 text-sm rounded focus:outline-none"
              />
              <button className="bg-bb-primary text-black px-4 py-2 text-sm rounded font-medium flex items-center gap-1">
                Submit
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 pt-4">
            © 2024 Bistro Bill. All rights reserved.
          </p>
        </div>
        <FooterColumn
          title="Product"
          items={[
            "Orders",
            "POS System",
            "Kitchen Display",
            "Inventory Management",
            "Customer Loyalty",
            "Analytics",
          ]}
        />

        <FooterColumn
          title="Solutions"
          items={[
            "Single Restaurant",
            "Multi-location Chains",
            "Quick Service",
            "Fine Dining",
            "Food Trucks",
            "Catering",
          ]}
        />

        <FooterColumn
          title="Resources"
          items={[
            "Blog",
            "Help Center",
            "API Documentation",
            "Video Tutorials",
            "Webinars",
            "Case Studies",
          ]}
        />

        <FooterColumn
          title="Company"
          items={[
            "About Us",
            "Careers",
            "Press",
            "Partners",
            "Contact",
            "Security",
          ]}
        />
      </div>
      <div className="border-t border-gray-800 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <p className="text-[#FDC836] font-medium">Live Demo Preview</p>
            <p className="text-xs text-gray-400">
              Our team is available 24/7 for existing customers
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400 flex gap-3">
              <span className="cursor-pointer hover:text-white">Privacy Policy</span>
              <span className="cursor-pointer hover:text-white">Terms of Service</span>
              <span className="cursor-pointer hover:text-white">Cookie Policy</span>
            </div>

            <button className="border border-yellow-400 text-bb-primary px-4 py-1.5 rounded-md text-sm font-medium hover:bg-yellow-400 hover:text-black transition">
              Emergency Support
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h4 className="text-white font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-sm text-gray-400">
        {items.map((item) => (
          <li
            key={item}
            className="cursor-pointer hover:text-white transition"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

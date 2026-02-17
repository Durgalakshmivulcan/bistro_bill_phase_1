import { Calendar, Clock } from "lucide-react";
import Footer from "../footer";
import PublicHeader from "../publicHeader";

const CATEGORIES = [
  "All",
  "Operations",
  "Technology",
  "Marketing",
  "Sustainability",
  "Management",
];

const INSIGHTS = [
  {
    category: "Operations",
    image: "/images/website/blogs/blog1.jpg",
    date: "09/09/2024",
    read: "5 min read",
    title: "10 Ways to Optimize Your Restaurant’s Kitchen Workflow",
    desc:
      "Discover proven strategies to streamline your kitchen operations and reduce wait times with smart technology integration.",
    author: "Sarah Johnson",
  },
  {
    category: "Technology",
    image: "/images/website/blogs/blog2.jpg",
    date: "14/09/2024",
    read: "7 min read",
    title: "The Future of Restaurant POS Systems: What to Expect in 2024",
    desc:
      "Explore the latest trends in point-of-sale technology and how they’re revolutionizing dining experiences.",
    author: "Emma Rodriguez",
  },
  {
    category: "Marketing",
    image: "/images/website/blogs/blog3.jpg",
    date: "18/09/2024",
    read: "6 min read",
    title: "Building Customer Loyalty in the Digital Age",
    desc:
      "Learn how modern loyalty programs and personalized experiences can increase customer retention by up to 40%.",
    author: "Mark Chen",
  },
  {
    category: "Sustainability",
    image: "/images/website/blogs/blog4.jpg",
    date: "15/09/2024",
    read: "6 min read",
    title: "How to Reduce Food Waste with Smart Kitchen Technology",
    desc:
      "Implement data-driven strategies to minimize waste and maximize profitability in your restaurant operations.",
    author: "Emma Rodriguez",
  },
  {
    category: "Management",
    image: "/images/website/blogs/blog5.jpg",
    date: "08/09/2024",
    read: "6 min read",
    title: "Staff Training in the Digital Restaurant Era",
    desc:
      "Effective strategies for training your team on new technologies while maintaining excellent customer service.",
    author: "Emma Rodriguez",
  },
  {
    category: "Operations",
    image: "/images/website/blogs/blog6.jpg",
    date: "20/09/2024",
    read: "5 min read",
    title: "10 Ways to Optimize Your Restaurant’s Kitchen Workflow",
    desc:
      "Discover proven strategies to streamline your kitchen operations and reduce wait times with smart technology integration.",
    author: "Sarah Johnson",
  },
];

export default function BlogPage() {
  return (
    <><PublicHeader />
    <section className="bg-[#FFF9EF] py-20">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold">
            Restaurant Industry <span className="text-[#FDC836]">Insights</span>
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Stay ahead with expert tips, industry trends, and best practices
            for modern restaurant management.
          </p>
        </div>

        {/* FILTER TABS */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-md text-sm border
                ${
                  i === 0
                    ? "bg-[#FDC836] border-black font-medium"
                    : "bg-white border-black hover:border-black"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* BLOG GRID */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INSIGHTS.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {/* IMAGE */}
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-48 w-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-[#FDC836] text-xs font-medium px-2 py-1 rounded">
                  {item.category}
                </span>
              </div>

              {/* CONTENT */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {item.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {item.read}
                  </span>
                </div>

                <h4 className="font-semibold leading-snug">
                  {item.title}
                </h4>

                <p className="text-sm text-gray-600">
                  {item.desc}
                </p>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-gray-500">{item.author}</span>
                  <span className="text-[#FDC836] font-medium cursor-pointer">
                    Read More →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* NEWSLETTER */}
        <div className="mt-20 text-center">
          <h3 className="text-xl font-semibold">Never Miss an Update</h3>
          <p className="text-sm text-gray-600 mt-1">
            Get the latest restaurant industry insights delivered straight to your inbox.
          </p>

          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <input
              type="email"
              placeholder="Enter your email"
              className="border rounded-md px-4 py-2 text-sm w-64"
            />
            <button className="bg-[#FDC836] px-6 py-2 rounded-md text-sm font-medium">
              Submit
            </button>
          </div>
        </div>

      </div>
    </section>
     <Footer /></>
  );
}

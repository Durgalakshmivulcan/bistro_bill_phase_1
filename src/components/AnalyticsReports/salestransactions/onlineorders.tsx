import DashboardLayout from "../../../layout/DashboardLayout";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
const OnlineOrders = () => {
  return (
      <div className="mx-4 mt-4">

        {/* Title + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-xl font-semibold text-bb-text">
                  Online Orders by Calendar Date
                </h2>
        
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                      placeholder="Search here..."
                      className="w-full border border-grey rounded-md px-3 pr-10 py-2 text-sm bg-bb-bg placeholder:text-black"
                    />
                  </div>
                  <ReportActions />
{/*         
                  <button className="bb-btn-secondary bg-bb-bg border border-black rounded-md">
                    Email Report
                  </button>
        
                  <button className="bb-btn bg-bb-secondary text-white rounded-md hover:bg-black/90">
                    Download Full Report
                  </button> */}
                </div>
              </div>
        
              {/* Filters */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
                {/* Filter by Date */}
                <div className="w-full sm:w-56">
                  <Select
                    value="Filter by Date"
                    options={[
                      { label: "Filter by Date", value: "Filter by Date" },
                      { label: "Today", value: "Today" },
                      { label: "This Month", value: "This Month" },
                    ]}
                  />
                </div>
        
                {/* Options */}
                <div className="w-full sm:w-56">
                  <Select
                    value="Options"
                    options={[
                      { label: "Options", value: "Options" },
                      { label: "Dine In", value: "Dine In" },
                      { label: "Take Away", value: "Take Away" },
                    ]}
                  />
                </div>
        
                {/* Clear Button */}
                <button className="bg-yellow-400 px-4 py-2 rounded border border-black w-full sm:w-auto">
                  Clear
                </button>
              </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-bb-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1600px] text-sm">
              <thead className="bg-bb-primary">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Branch Name</th>
                  <th className="px-4 py-3">Branch Code</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Offline Number</th>
                  <th className="px-4 py-3">Transferred to Order</th>
                  <th className="px-4 py-3">Order No.</th>
                  <th className="px-4 py-3">Order Source</th>
                  <th className="px-4 py-3">Source Order Number</th>
                  <th className="px-4 py-3">Source Outlet Id</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3">Hitech city</td>
                  <td className="px-4 py-3">001</td>
                  <td className="px-4 py-3">Brand</td>
                  <td className="px-4 py-3">09/02/2025</td>
                  <td className="px-4 py-3">INV-2025-089</td>
                  <td className="px-4 py-3">Offline Number</td>
                  <td className="px-4 py-3">Transferred to Order</td>
                  <td className="px-4 py-3">#ORD-3225</td>
                  <td className="px-4 py-3">Dine In</td>
                  <td className="px-4 py-3">#ORD-3225</td>
                  <td className="px-4 py-3">Outlet Id</td>
                </tr>

                <tr>
                  <td className="px-4 py-3">Uppal</td>
                  <td className="px-4 py-3">002</td>
                  <td className="px-4 py-3">Brand</td>
                  <td className="px-4 py-3">19/02/2025</td>
                  <td className="px-4 py-3">INV-2025-110</td>
                  <td className="px-4 py-3">Offline Number</td>
                  <td className="px-4 py-3">Transferred to Order</td>
                  <td className="px-4 py-3">#ORD-4879</td>
                  <td className="px-4 py-3">Take Away</td>
                  <td className="px-4 py-3">#ORD-4879</td>
                  <td className="px-4 py-3">Outlet Id</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          <Pagination />
      </div>
  );
};

export default  OnlineOrders;

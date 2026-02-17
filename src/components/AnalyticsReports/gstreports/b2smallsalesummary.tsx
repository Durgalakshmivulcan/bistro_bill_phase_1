import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";

const B2smallTrasaction = () => {
  return (
    <div className="mx-3 md:mx-4 mt-4 space-y-4">

      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-semibold text-bb-text">
          B2C Small Sale Summary
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

          {/* <button className="bb-btn-secondary bg-bb-bg border border-black rounded-md">
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

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl border border-bb-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-bb-primary sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  Type
                </th>
                <th className="px-4 py-3 text-right">
                  Place of Supply
                </th>
                <th className="px-4 py-3 text-right">
                  Applicable % of Tax
                </th>
                <th className="px-4 py-3 text-right">
                  E-commerce GSTIN
                </th>
                <th className="px-4 py-3 text-right">
                  Rate
                </th>
                <th className="px-4 py-3 text-right">
                  Taxable Value
                </th>
                <th className="px-4 py-3 text-right">
                  Cess Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {[
                {
                  type: "Restaurant Sales",
                  place: "Telangana",
                  tax: "5%",
                  gstin: "NA",
                  rate: "5%",
                  taxable: "₹ 579",
                  cess: "₹ 0",
                },
                {
                  type: "Online Sales",
                  place: "Telangana",
                  tax: "5%",
                  gstin: "NA",
                  rate: "5%",
                  taxable: "₹ 7,800",
                  cess: "₹ 0",
                },
                {
                  type: "Restaurant Sales",
                  place: "Telangana",
                  tax: "5%",
                  gstin: "NA",
                  rate: "5%",
                  taxable: "₹ 579",
                  cess: "₹ 0",
                },
                {
                  type: "Online Sales",
                  place: "Telangana",
                  tax: "5%",
                  gstin: "NA",
                  rate: "5%",
                  taxable: "₹ 7,800",
                  cess: "₹ 0",
                },
              ].map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 1 ? "bg-bb-hover" : "border-b"}
                >
                  <td className="px-4 py-3">
                    {row.type}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.place}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.tax}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.gstin}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.rate}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {row.taxable}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {row.cess}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="pt-2">
        <Pagination />
      </div>

    </div>
  );
};

export default B2smallTrasaction;

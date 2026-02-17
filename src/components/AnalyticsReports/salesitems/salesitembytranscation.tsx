import { useState, useEffect, useMemo, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { getProductSales } from "../../../services/reportsService";
import { getBranches, Branch } from "../../../services/branchService";
import LoadingSpinner from "../../Common/LoadingSpinner";

/* ===================== TABLE COLUMNS ===================== */
const TABLE_COLUMNS = [
  { key: "branchName", label: "Branch Name" },
  { key: "branchCode", label: "Branch Code" },
  { key: "branchLabels", label: "Branch Labels" },
  { key: "businessBrand", label: "Business Brand" },
  { key: "businessDate", label: "Business Date" },
  { key: "invoiceDate", label: "Invoice Date" },
  { key: "invoiceType", label: "Invoice Type" },
  { key: "invoiceNumber", label: "Invoice Number" },
  { key: "billSplitGroupName", label: "Bill Split Group Name" },
  { key: "statementNumber", label: "Statement Number" },
  { key: "orderSource", label: "Order Source" },
  { key: "sourceOrderNumber", label: "Source Order Number" },
  { key: "sourceOutletId", label: "Source Outlet Id" },
  { key: "saleStatus", label: "Sale Status" },
  { key: "productSku", label: "Product SKU" },
  { key: "type", label: "Type" },
  { key: "productName", label: "Product Name" },
  { key: "tags", label: "Tags" },
  { key: "originalQuantity", label: "Original Quantity" },
  { key: "saleItemQuantity", label: "Sale Item Quantity" },
  { key: "modifiedQuantity", label: "Modified Quantity" },
  { key: "unitRate", label: "Unit Rate" },
  { key: "verifiedQuantity", label: "Verified Quantity" },
  { key: "measuringQuantity", label: "Measuring Quantity" },
  { key: "suggestedBatch", label: "Suggested Batch" },
  { key: "verifiedBatch", label: "Verified Batch" },
  { key: "amountBeforeModification", label: "Amount Before Modification" },
  { key: "valueOfModification", label: "Value of Modification" },
  { key: "averageGrossAmount", label: "Average Gross Amount" },
  { key: "grossAmount", label: "Gross Amount" },
  { key: "discounts", label: "Discounts" },
  { key: "netAmount", label: "Net Amount" },
  { key: "taxes", label: "Taxes" },
  { key: "taxCollectedByAggregator", label: "Tax Collected by Aggregator" },
  { key: "businessTaxId", label: "Business Tax Id" },
  { key: "directCharge", label: "Direct Charge" },
  { key: "indirectCharge", label: "Indirect Charge" },
  { key: "taxRate", label: "Tax Rate" },
  { key: "productTaxCode", label: "Product Tax Code" },
  { key: "materialsCost", label: "Materials Cost" },
  { key: "suppliesCost", label: "Supplies Cost" },
  { key: "customerId", label: "Customer Id" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "customerName", label: "Customer Name" },
  { key: "customerTaxId", label: "Customer Tax Id" },
  { key: "createdBy", label: "Created by" },
  { key: "createdOn", label: "Created On" },
  { key: "ticketNumber", label: "Ticket Number" },
  { key: "timeToPrepare", label: "Time to Prepare" },
  { key: "preparedTimestamp", label: "Prepared Timestamp" },
  { key: "inProcessTimestamp", label: "In Process Timestamp" },
  { key: "timeToInProcess", label: "Time to In Process" },
  { key: "notes", label: "Notes" },
  { key: "modifiedAfterPrint", label: "Modified after Print" },
  { key: "changeLog", label: "Change Log" },
  { key: "lastModifiedBy", label: "Last Modified by" },
  { key: "lastModifiedTime", label: "Last Modified Time" },
  { key: "channelName", label: "Channel Name" },
  { key: "channelLabel", label: "Channel Label" },
  { key: "session", label: "Session" },
  { key: "category", label: "Category" },
  { key: "subCategory", label: "Sub-Category" },
  { key: "productBrand", label: "Product Brand" },
  { key: "accountName", label: "Account Name" },
  { key: "productGroupName", label: "Product Group Name" },
  { key: "variants", label: "Variants" },
  { key: "reasonForCancel", label: "Reason for Cancel/Void/Non Chargeable" },
  { key: "remarksForCancel", label: "Remarks for Cancel/Void/Non Chargeable" },
  { key: "punchedName", label: "Punched Name" },
  { key: "resourceName", label: "Resource Name" },
  { key: "resourceGroupName", label: "Resource Group Name" },
  { key: "productDiscountRemarks", label: "Product Discount Remarks" },
  { key: "productDiscountCodes", label: "Product Discount Codes" },
  { key: "productDiscountReasons", label: "Product Discount Reasons" },
  { key: "billDiscountRemarks", label: "Bill Discount Remarks" },
  { key: "billDiscountCodes", label: "Bill Discount Codes" },
  { key: "paymentModes", label: "Payments Modes" },
];

/* ===================== DATE HELPERS ===================== */
function getDateRange(filter: string) {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  if (filter === "This Month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  } else if (filter === "Last 30 days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    start = d.toISOString().split("T")[0];
  }
  return { startDate: start, endDate: end };
}

const SalesItemByTranscation = () => {
  const [tableData, setTableData] = useState<Record<string, string | number>[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("This Month");
  const [optionFilter, setOptionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranches(res.data.branches || []);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateFilter);
      const res = await getProductSales(startDate, endDate, undefined, 1, 100, selectedBranch || undefined);
      if (res.success && res.data) {
        const mapped = res.data.map((item) => ({
          branchName: "-",
          branchCode: "-",
          branchLabels: "-",
          businessBrand: "-",
          businessDate: "-",
          invoiceDate: "-",
          invoiceType: "Sale",
          invoiceNumber: "-",
          billSplitGroupName: "-",
          statementNumber: "-",
          orderSource: "-",
          sourceOrderNumber: "-",
          sourceOutletId: "-",
          saleStatus: "Completed",
          productSku: item.product.sku || "-",
          type: "Product",
          productName: item.product.name,
          tags: "-",
          originalQuantity: item.quantitySold,
          saleItemQuantity: item.quantitySold,
          modifiedQuantity: 0,
          unitRate: `₹ ${item.avgPrice}`,
          verifiedQuantity: item.quantitySold,
          measuringQuantity: item.quantitySold,
          suggestedBatch: "-",
          verifiedBatch: "-",
          amountBeforeModification: `₹ ${item.revenue}`,
          valueOfModification: "₹ 0",
          averageGrossAmount: `₹ ${item.avgPrice}`,
          grossAmount: `₹ ${item.revenue}`,
          discounts: "₹ 0",
          netAmount: `₹ ${item.revenue}`,
          taxes: "₹ 0",
          taxCollectedByAggregator: "₹ 0",
          businessTaxId: "-",
          directCharge: "₹ 0",
          indirectCharge: "₹ 0",
          taxRate: "-",
          productTaxCode: "-",
          materialsCost: "₹ 0",
          suppliesCost: "₹ 0",
          customerId: "-",
          phoneNumber: "-",
          customerName: "-",
          customerTaxId: "-",
          createdBy: "-",
          createdOn: "-",
          ticketNumber: "-",
          timeToPrepare: "-",
          preparedTimestamp: "-",
          inProcessTimestamp: "-",
          timeToInProcess: "-",
          notes: "-",
          modifiedAfterPrint: "-",
          changeLog: "-",
          lastModifiedBy: "-",
          lastModifiedTime: "-",
          channelName: "-",
          channelLabel: "-",
          session: "-",
          category: item.product.categoryName || "-",
          subCategory: "-",
          productBrand: "-",
          accountName: "-",
          productGroupName: "-",
          variants: "-",
          reasonForCancel: "-",
          remarksForCancel: "-",
          punchedName: "-",
          resourceName: "-",
          resourceGroupName: "-",
          productDiscountRemarks: "-",
          productDiscountCodes: "-",
          productDiscountReasons: "-",
          billDiscountRemarks: "-",
          billDiscountCodes: "-",
          paymentModes: "-",
        }));
        setTableData(mapped);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [tableData, searchQuery]);

  const handleClear = () => {
    setDateFilter("This Month");
    setOptionFilter("");
    setSearchQuery("");
    setSelectedBranch("");
  };

  return (
    <div className="mx-3 md:mx-4 mt-4 space-y-4">

      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-semibold text-bb-text">
          Sales Items by Transaction
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-grey rounded-md px-3 pr-10 py-2 text-sm bg-bb-bg placeholder:text-black"
            />
          </div>
          <ReportActions />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
        <div className="w-full sm:w-56">
          <Select
            value={dateFilter}
            onChange={(value) => setDateFilter(value)}
            options={[
              { label: "Today", value: "Today" },
              { label: "This Month", value: "This Month" },
              { label: "Last 30 days", value: "Last 30 days" },
            ]}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={selectedBranch}
            onChange={(value) => setSelectedBranch(value)}
            options={[
              { label: "All Branches", value: "" },
              ...branches.map((b) => ({ label: b.name, value: b.id })),
            ]}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={optionFilter}
            onChange={(value) => setOptionFilter(value)}
            options={[
              { label: "All Types", value: "" },
              { label: "Dine In", value: "DineIn" },
              { label: "Take Away", value: "Takeaway" },
            ]}
          />
        </div>

        <button
          onClick={handleClear}
          className="bg-yellow-400 px-4 py-2 rounded border border-black w-full sm:w-auto"
        >
          Clear
        </button>
      </div>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading data..." />
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!loading && (
        <div className="bg-white rounded-xl border border-bb-border">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] text-sm whitespace-nowrap">
              <thead className="bg-bb-primary sticky top-0 z-10">
                <tr>
                  {TABLE_COLUMNS.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left font-semibold">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index} className={index % 2 === 1 ? "bg-bb-hover" : "border-b"}>
                    {TABLE_COLUMNS.map(col => (
                      <td key={col.key} className="px-4 py-3">
                        {row[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length} className="px-4 py-8 text-center text-bb-textSoft">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      <div className="pt-2">
        <Pagination />
      </div>

    </div>
  );
};

export default SalesItemByTranscation;

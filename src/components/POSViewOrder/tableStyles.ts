export type TableStatus = "available" | "reserved" | "running";

export const statusStyles: Record<TableStatus, string> = {
  available: "bg-green-200 text-green-700",
  reserved: "bg-red-200 text-red-700",
  running: "bg-blue-200 text-blue-700",
};

export const chairStyle = "bg-[#E6E4E0]";
export const tableBorder = "border border-[#C46A3C]";

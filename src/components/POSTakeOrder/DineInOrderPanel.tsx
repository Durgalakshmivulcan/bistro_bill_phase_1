import { useState } from "react";
import AccordionItem from "./AccordionItem";
import TableCaptainDetails from "./AccordionDetails.tsx/TableCaptainDetails";
import CustomerDetails from "./AccordionDetails.tsx/CustomerDetails";
import AddItems from "./AccordionDetails.tsx/AddItems";
import PaymentSummary from "./AccordionDetails.tsx/PaymentSummary";

const DineInOrderPanel = () => {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (key: string) =>
    setOpen(prev => (prev === key ? null : key));

  return (
    <>
      <AccordionItem
        title="Table & Captain Details"
        isOpen={open === "table"}
        onToggle={() => toggle("table")}
      >
        <TableCaptainDetails />
      </AccordionItem>

      <AccordionItem
        title="Customer Details"
        isOpen={open === "customer"}
        onToggle={() => toggle("customer")}
      >
        <CustomerDetails addressEditable={false} />
      </AccordionItem>

      <AccordionItem
        title="Add Items"
        isOpen={open === "items"}
        onToggle={() => toggle("items")}
      >
        <AddItems />
      </AccordionItem>

      <AccordionItem
        title="Payment Summary"
        isOpen={open === "payment"}
        onToggle={() => toggle("payment")}
      >
        <PaymentSummary />
      </AccordionItem>
    </>
  );
};

export default DineInOrderPanel;

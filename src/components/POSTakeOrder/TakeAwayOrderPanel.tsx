import { useState } from "react";
import AccordionItem from "./AccordionItem";
import CaptainDetails from "./AccordionDetails.tsx/CaptainDetails";
import CustomerDetails from "./AccordionDetails.tsx/CustomerDetails";
import AddItems from "./AccordionDetails.tsx/AddItems";
import PaymentSummary from "./AccordionDetails.tsx/PaymentSummary";

const TakeAwayOrderPanel = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenAccordion(prev => (prev === key ? null : key));
  };

  return (
    <>
      <AccordionItem
        title="Captain Detail's"
        isOpen={openAccordion === "captain"}
        onToggle={() => toggle("captain")}
      >
        <CaptainDetails />
      </AccordionItem>

      <AccordionItem
        title="Customer Details"
        isOpen={openAccordion === "customer"}
        onToggle={() => toggle("customer")}
      >
        <CustomerDetails />
      </AccordionItem>

      <AccordionItem
        title="Add Items"
        isOpen={openAccordion === "items"}
        onToggle={() => toggle("items")}
      >
        <AddItems />
      </AccordionItem>

      <AccordionItem
        title="Payment Summary"
        isOpen={openAccordion === "payment"}
        onToggle={() => toggle("payment")}
      >
        <PaymentSummary />
      </AccordionItem>
    </>
  );
};

export default TakeAwayOrderPanel;

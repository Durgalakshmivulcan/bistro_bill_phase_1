import { useState } from "react";
import AccordionItem from "./AccordionItem";
import CustomerDetails from "./AccordionDetails.tsx/CustomerDetails";
import AddItems from "./AccordionDetails.tsx/AddItems";
import PaymentSummary from "./AccordionDetails.tsx/PaymentSummary";
import { useOrder } from "../../contexts/OrderContext";

const CateringOrderPanel = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const { eventName, setEventName, eventDate, setEventDate } = useOrder();

  const toggle = (key: string) => {
    setOpenAccordion(prev => (prev === key ? null : key));
  };

  return (
    <>
      <AccordionItem
        title="Event Details"
        isOpen={openAccordion === "event"}
        onToggle={() => toggle("event")}
      >
        <div className="space-y-4">
          <input
            className="w-full h-10 border rounded-lg px-3"
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
          <input
            type="date"
            className="w-full h-10 border rounded-lg px-3"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>
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

export default CateringOrderPanel;

import { useState } from "react";
import AccordionItem from "./AccordionItem";
import CustomerDetails from "./AccordionDetails.tsx/CustomerDetails";
import AddItems from "./AccordionDetails.tsx/AddItems";
import PaymentSummary from "./AccordionDetails.tsx/PaymentSummary";
import { useOrder } from "../../contexts/OrderContext";

const CateringOrderPanel = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const { eventDate, setEventDate, eventTime, setEventTime } = useOrder();

  const toggle = (key: string) => {
    setOpenAccordion(prev => (prev === key ? null : key));
  };

  return (
    <>
      <AccordionItem
        title="Time Slot Information"
        isOpen={openAccordion === "event"}
        onToggle={() => toggle("event")}
      >
        <div className="space-y-4">
          <input
            type="date"
            className="w-full h-10 border rounded-lg px-3"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <input
              type="time"
              className="w-full h-10 border rounded-lg px-3"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
            <button
              type="button"
              className={`h-10 px-4 border rounded-lg ${eventTime && eventTime.includes('AM') ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setEventTime(prev => {
                const base = prev?.replace(/\\s?(AM|PM)$/i, '') || '11:30';
                return `${base} AM`;
              })}
            >
              AM
            </button>
            <button
              type="button"
              className={`h-10 px-4 border rounded-lg ${eventTime && eventTime.includes('PM') ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setEventTime(prev => {
                const base = prev?.replace(/\\s?(AM|PM)$/i, '') || '11:30';
                return `${base} PM`;
              })}
            >
              PM
            </button>
          </div>
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

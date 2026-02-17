import { useState } from "react";
import {
  RotateCcw,
  Pencil,
  Ban,
  Hand,
} from "lucide-react";

import OrderNotesModal from "./Modals/OrderNotesModal";
import ActionAlertModal from "./Modals/ActionAlertModal";
import CancelOrderModal from "./Modals/CancelOrderAlertModal";

import resetImg from "../../assets/resetalert.png";
import holdImg from "../../assets/holdalert.png";
import cancelledImg from "../../assets/cancelledalert.png";

type ActionKey = "reset" | "notes" | "cancel" | "hold" | null;

const actions = [
  { label: "Reset Order", key: "reset", icon: RotateCcw },
  { label: "Order Note's", key: "notes", icon: Pencil },
  { label: "Cancel Order", key: "cancel", icon: Ban },
  { label: "Hold Order", key: "hold", icon: Hand },
];

interface OrderActionsProps {
  onResetOrder?: () => void;
  onHoldOrder?: () => void;
  onCancelOrder?: (reason: string, remarks?: string) => void;
  onSaveNotes?: (note: string) => void;
  currentNotes?: string;
}

const OrderActions = ({ onResetOrder, onHoldOrder, onCancelOrder, onSaveNotes, currentNotes = "" }: OrderActionsProps) => {
  const [showNotes, setShowNotes] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // ✅ track active button
  const [activeAction, setActiveAction] = useState<ActionKey>(null);

  const closeAll = () => {
    setResetOpen(false);
    setHoldOpen(false);
    setCancelOpen(false);
    setCancelSuccess(false);
    setShowNotes(false);
    setActiveAction(null);
  };

  return (
    <>
      {/* ACTION BUTTONS */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {actions.map(({ label, icon: Icon, key }) => {
          const isActive = activeAction === key;

          return (
            <button
              key={key}
              onClick={() => {
                setActiveAction(key as ActionKey);

                if (key === "notes") setShowNotes(true);
                if (key === "reset") setResetOpen(true);
                if (key === "hold") setHoldOpen(true);
                if (key === "cancel") setCancelOpen(true);
              }}
              className={`
                flex flex-col items-center justify-center gap-2
                rounded-xl p-3 text-sm font-medium transition
                active:scale-95
                ${
                  isActive
                    ? "bg-bb-primary text-black"
                    : "bg-gray-100 hover:bg-gray-200"
                }
              `}
            >
              <Icon
                size={20}
                className={isActive ? "text-black" : "text-gray-600"}
              />
              {label}
            </button>
          );
        })}
      </div>

      {/* ORDER NOTES */}
      {showNotes && (
        <OrderNotesModal
          open={showNotes}
          value={currentNotes}
          onClose={closeAll}
          onSave={(note) => {
            if (onSaveNotes) {
              onSaveNotes(note);
            }
            closeAll();
          }}
        />
      )}

      {/* RESET */}
      <ActionAlertModal
        open={resetOpen}
        image={resetImg}
        title="Reset Order"
        description="This will reset the order state. Do you want to Continue?"
        onClose={closeAll}
        onConfirm={() => {
          // Call the reset handler passed from parent
          if (onResetOrder) {
            onResetOrder();
          }
          closeAll();
        }}
      />

      {/* HOLD */}
      <ActionAlertModal
        open={holdOpen}
        image={holdImg}
        title="Hold Order"
        description="Do you want to Hold Order?"
        onClose={closeAll}
        onConfirm={() => {
          // Call the hold handler passed from parent
          if (onHoldOrder) {
            onHoldOrder();
          }
          closeAll();
        }}
      />

      {/* CANCEL FLOW */}
      <CancelOrderModal
        open={cancelOpen}
        onClose={closeAll}
        onSubmit={(reason, remarks) => {
          // Call the cancel handler passed from parent
          if (onCancelOrder) {
            onCancelOrder(reason, remarks);
          }
          setCancelOpen(false);
          setCancelSuccess(true);
        }}
      />

      {/* CANCEL SUCCESS */}
      <ActionAlertModal
        open={cancelSuccess}
        image={cancelledImg}
        title="Order Cancelled"
        description="Your Order has been Cancelled Successfully!"
        cancelText="Close"
        onClose={closeAll}
      />
    </>
  );
};

export default OrderActions;

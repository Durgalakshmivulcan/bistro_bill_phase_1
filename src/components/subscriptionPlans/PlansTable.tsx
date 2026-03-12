import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import type { Plan } from "../../types/plan";
import deleteIcon from "../../assets/deleteConformImg.png";
import deleteIcon1 from "../../assets/deleteSuccessImg.png";
import { Pencil, Trash2 } from "lucide-react";
import { deleteSubscriptionPlanApi } from "../../services/settingsService";

interface Props {
  plans: Plan[];
  onDeleted?: () => void;
}

type Mode = null | "confirm-delete" | "deleted";

const PlansTable = ({ plans, onDeleted }: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const navigate = useNavigate();

  const closeAll = () => {
    setMode(null);
    setActivePlan(null);
    setOpenId(null);
    setDeleteError(null);
  };

  const confirmDelete = (plan: Plan) => {
    setActivePlan(plan);
    setMode("confirm-delete");
    setOpenId(null);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!activePlan) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await deleteSubscriptionPlanApi(activePlan.id);
      if (response.success) {
  setMode("deleted");

  setTimeout(() => {
    closeAll();
    onDeleted?.();
  }, 2000);
      } else {
        setDeleteError(response.message || "Failed to delete plan");
      }
    } catch {
      setDeleteError("Failed to delete plan");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-yellow-400">
            <tr>
              <th className="px-6 py-3">Plan Name</th>
              <th className="px-6 py-3">Plan Duration</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Trial Days</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <p className="mb-4">No subscription plans found</p>
                  <button
                    onClick={() => navigate("/subscription-plans/create")}
                    className="bg-black text-white px-4 py-2 rounded text-sm inline-block"
                  >
                    Add Your First Plan
                  </button>
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="border-b relative">
                  <td className="px-6 py-4 font-medium">{plan.name}</td>
                  <td className="px-6 py-4">{plan.duration}</td>
                  <td className="px-6 py-4">{plan.price}</td>
                  <td className="px-6 py-4">{plan.trialDays}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={plan.status} />
                  </td>

                  {/* ACTION MENU */}
                  <td className="px-6 py-4 relative text-center">
                    <button
                      onClick={() =>
                        setOpenId(openId === plan.id ? null : plan.id)
                      }
                      className="text-xl"
                    >
                      ⋮
                    </button>

                    {openId === plan.id && (
                      <div className="absolute right-6 top-10 w-36 bg-white border rounded-md shadow z-10">
                        {/* EDIT */}
                        <button
                          onClick={() =>
                            navigate(`/subscription-plans/edit/${plan.id}`)
                          }
                          className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                        >
                          <Pencil size={16} className="text-gray-700" />
                          <span>Edit</span>
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => confirmDelete(plan)}
                          className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {mode === "confirm-delete" && activePlan && (
        <Overlay>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center relative">
            <button
              onClick={closeAll}
              className="absolute right-3 top-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-4">Delete</h3>

            <img
              src={deleteIcon}
              className="mx-auto h-12 w-12 mb-4"
              alt="delete"
            />

            <p className="text-sm mb-6">
              This action cannot be undone. Do you want to proceed with
              deletion?
            </p>

            {deleteError && (
              <p className="text-sm text-red-500 mb-4">{deleteError}</p>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={closeAll}
                className="border px-4 py-2 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-yellow-400 px-6 py-2 rounded-md disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes"}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ================= DELETE SUCCESS ================= */}
      {mode === "deleted" && (
        <Overlay>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center relative">
            <button
              onClick={closeAll}
              className="absolute right-3 top-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-2">Deleted!</h3>

            <img
              src={deleteIcon1}
              className="mx-auto h-12 w-12 my-4"
              alt="success"
            />

            <p className="text-sm">
              Subscription Plan has been successfully removed.
            </p>
          </div>
        </Overlay>
      )}
    </>
  );
};

export default PlansTable;

/* ================= SHARED OVERLAY ================= */

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3">
      {children}
    </div>
  );
}

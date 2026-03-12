import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Eye,
  Pencil,
  Move,
  Trash2,
  ArrowUpDown,
  Paperclip,
} from "lucide-react";
import TickImg from "../../assets/tick.png";
import DeleteImg from "../../assets/deleteConformImg.png";
import { deleteLead, updateLeadStage, LeadStage } from "../../services/contactService";
import CreateLeadModal from "./addContactLead";

/* ================= TYPES ================= */

type ContactItem = {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string | null;
  businessType: string | null;
  inquiryType: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zipCode: string | null;
  address: string | null;
  description: string | null;
  stage: LeadStage;
  avatarUrl?: string | null;
  attachmentCount?: number | null;
  attachments?: unknown[] | null;
};

type Props = {
  item: ContactItem;
  onRefresh: () => void;
};

/* ================= REUSABLE MENU ITEM ================= */

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
};

const MenuItem = ({ icon, label, danger, onClick }: MenuItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 ${
      danger ? "text-red-600" : "text-gray-700"
    }`}
  >
    {icon}
    {label}
  </button>
);

/* ================= MAIN CARD ================= */

export default function ContactCard({ item, onRefresh }: Props) {
  const [openMenu, setOpenMenu] = useState(false);

  /* MODALS */
  const [viewDetail, setViewDetail] = useState(false);
  const [editDetail, setEditDetail] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const [moveSelect, setMoveSelect] = useState(false);
  const [moveConfirm, setMoveConfirm] = useState(false);
  const [moveSuccess, setMoveSuccess] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStage | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  /* CLOSE MENU ON OUTSIDE CLICK */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* HANDLE DELETE */
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteLead(item.id);

      if (response.success) {
        setDeleteConfirm(false);
        setDeleteSuccess(true);

        // Refresh the list after showing success modal for 1.5 seconds
        setTimeout(() => {
          setDeleteSuccess(false);
          onRefresh();
        }, 1500);
      } else {
        alert(response.message || 'Failed to delete contact');
        setDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
      setDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  /* HANDLE MOVE/STATUS UPDATE */
  const handleMove = async () => {
    if (!selectedStatus) {
      alert('Please select a status');
      return;
    }

    try {
      setIsMoving(true);
      const response = await updateLeadStage(item.id, selectedStatus);

      if (response.success) {
        setMoveConfirm(false);
        setMoveSuccess(true);

        // Refresh the list after showing success modal for 1.5 seconds
        setTimeout(() => {
          setMoveSuccess(false);
          onRefresh();
        }, 1500);
      } else {
        alert(response.message || 'Failed to update contact status');
        setMoveConfirm(false);
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Failed to update contact status');
      setMoveConfirm(false);
    } finally {
      setIsMoving(false);
    }
  };

  const ownerInitials = item.ownerName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const rawAttachmentCount =
    typeof item.attachmentCount === "number"
      ? item.attachmentCount
      : Array.isArray(item.attachments)
      ? item.attachments.length
      : 0;

  const attachmentCount = Math.max(0, rawAttachmentCount);

  return (
    <>
      {/* ================= CARD ================= */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 relative shadow-sm">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <span className="px-3 py-1 text-xs rounded-lg bg-purple-100 text-purple-600 font-medium">
            {item.inquiryType || 'Lead'}
          </span>

          <button
            onClick={() => setOpenMenu((v) => !v)}
            className="text-gray-500 hover:text-gray-800"
          >
            <MoreVertical size={18} />
          </button>

          {/* DROPDOWN */}
          {openMenu && (
            <div
              ref={menuRef}
              className="absolute right-4 top-10 w-40 bg-white border rounded-md shadow-lg z-50"
            >
              <MenuItem
                icon={<Eye size={16} />}
                label="View"
                onClick={() => {
                  setOpenMenu(false);
                  setViewDetail(true);
                }}
              />

              <MenuItem
                icon={<Pencil size={16} />}
                label="Edit"
                onClick={() => {
                  setOpenMenu(false);
                  setEditDetail(true);
                }}
              />

              <MenuItem
                icon={<Move size={16} />}
                label="Move"
                onClick={() => {
                  setOpenMenu(false);
                  setMoveSelect(true);
                }}
              />

              <MenuItem
                icon={<Trash2 size={16} />}
                label="Delete"
                danger
                onClick={() => {
                  setOpenMenu(false);
                  setDeleteConfirm(true);
                }}
              />
            </div>
          )}
        </div>

        {/* CONTENT */}
        <h3 className="text-2xl leading-tight font-semibold text-gray-900">
          {item.restaurantName}
        </h3>
        <p className="text-sm text-gray-500">{item.ownerName}</p>

        <p className="text-[18px] leading-tight text-gray-600 line-clamp-3">
          &ldquo;{item.description || "No message provided."}&rdquo;
        </p>

        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {item.avatarUrl ? (
              <img
                src={item.avatarUrl}
                alt={item.ownerName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 text-gray-700 font-medium flex items-center justify-center">
                {ownerInitials || "NA"}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Paperclip size={24} />
            <span className="text-[40px] leading-none select-none">
              {attachmentCount.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* ================= VIEW DETAIL ================= */}
      {viewDetail && (
        <CreateLeadModal
          open={viewDetail}
          mode="view"
          initialData={item}
          onClose={() => setViewDetail(false)}
        />
      )}

      {/* ================= EDIT ================= */}
      {editDetail && (
        <CreateLeadModal
          open={editDetail}
          mode="edit"
          initialData={item}
          onClose={() => setEditDetail(false)}
          onSaved={onRefresh}
        />
      )}

      {/* ================= DELETE ================= */}
      {deleteConfirm && (
        <ConfirmModal
          icon={
            <img
              src={DeleteImg}
              alt="success"
              className="w-9 h-9 object-contain"
            />
          }
          title="Delete"
          message="This action cannot be undone. Do you want to proceed?"
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      )}

      {deleteSuccess && (
        <AlertModal
          icon={
            <img
              src={DeleteImg}
              alt="success"
              className="w-9 h-9 object-contain"
            />
          }
          title="Deleted!"
          message="Contact Lead has been successfully removed."
          onClose={() => setDeleteSuccess(false)}
        />
      )}

      {/* ================= MOVE ================= */}
      {moveSelect && (
        <MoveModal
          onCancel={() => {
            setMoveSelect(false);
            setSelectedStatus(null);
          }}
          onMove={(stage) => {
            setSelectedStatus(stage);
            setMoveSelect(false);
            setMoveConfirm(true);
          }}
        />
      )}

      {moveConfirm && (
        <ConfirmModal
          title="Move Contact Lead"
          icon={<ArrowUpDown size={36} className="text-blue-500" />}
          message="Are you sure you want to update the status?"
          onCancel={() => {
            setMoveConfirm(false);
            setSelectedStatus(null);
          }}
          onConfirm={handleMove}
          isLoading={isMoving}
        />
      )}

      {moveSuccess && (
        <AlertModal
          icon={
            <img
              src={TickImg}
              alt="success"
              className="w-9 h-9 object-contain"
            />
          }
          title="Moved Successfully"
          message="Contact Lead Updated Successfully!"
          onClose={() => setMoveSuccess(false)}
        />
      )}
    </>
  );
}

/* ================= MODALS ================= */

const AlertModal = ({
  icon,
  title,
  message,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-80 text-center space-y-3">
      <div className="flex justify-center">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{message}</p>
      <button
        onClick={onClose}
        className="mt-3 bg-[#FDC836] px-5 py-2 rounded text-sm"
      >
        OK
      </button>
    </div>
  </div>
);

const ConfirmModal = ({
  icon,
  title,
  message,
  onCancel,
  onConfirm,
  isLoading = false,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-80 text-center space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <div className="flex justify-center">{icon}</div>
      <p className="text-sm text-gray-600">{message}</p>

      <div className="flex justify-center gap-3 mt-3">
        <button
          onClick={onCancel}
          className="border px-4 py-2 rounded text-sm"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-[#FDC836] px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Yes'}
        </button>
      </div>
    </div>
  </div>
);

const MoveModal = ({
  onCancel,
  onMove,
}: {
  onCancel: () => void;
  onMove: (stage: LeadStage) => void;
}) => {
  const [selectedStatus, setSelectedStatus] = useState<LeadStage>('NewRequest');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-80">
        <h3 className="font-semibold mb-4 text-center">Move Contact Lead</h3>

        <select
          className="w-full border rounded-md px-3 py-2 text-sm mb-4"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as LeadStage)}
        >
          <option value="NewRequest">New Leads</option>
          <option value="InitialContacted">Initial Contacted</option>
          <option value="ScheduledDemo">Scheduled Demo</option>
          <option value="Completed">Completed</option>
          <option value="ClosedWin">Closed Won</option>
          <option value="ClosedLoss">Closed Lost</option>
        </select>

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="border px-4 py-2 rounded text-sm">
            Cancel
          </button>
          <button
            onClick={() => onMove(selectedStatus)}
            className="bg-[#FDC836] px-4 py-2 rounded text-sm"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
};

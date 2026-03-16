import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import tickImg from "../../assets/tick.png";
import { createSupplier, updateSupplier, CreateSupplierData, UpdateSupplierData, getSupplierContacts, createSupplierContact, updateSupplierContact, deleteSupplierContact, SupplierContact } from "../../services/supplierService";
import { getBranches, Branch } from "../../services/branchService";
import PurchaseOrderTabs from "../NavTabs/PurchaseOrderTabs";

type Mode = "add" | "edit" | "view";

interface SupplierFormProps {
  mode: Mode;
  defaultValues?: any;
}

export default function SupplierForm({
  mode,
  defaultValues,
}: SupplierFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isView = mode === "view";

  // ---------------- STATE ----------------
  const [successOpen, setSuccessOpen] = useState(false);
  const [successNavTo, setSuccessNavTo] = useState<string>("/purchaseorder");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    defaultValues?.branches || []
  );

  // Contact state
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SupplierContact | null>(null);
  const [contactFormData, setContactFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Form field states
  const [formData, setFormData] = useState({
    name: defaultValues?.name || "",
    code: defaultValues?.code || "",
    gst: defaultValues?.gstNumber || "",
    tin: defaultValues?.tinNumber || "",
    taxCode: defaultValues?.taxStateCode || "",
    status: defaultValues?.status || "",
    address: defaultValues?.address || "",
    account: defaultValues?.bankAccount || "",
    bank: defaultValues?.bankName || "",
    branch: defaultValues?.bankBranch || "",
    ifsc: defaultValues?.ifscCode || "",
    phone: defaultValues?.phone || "",
    email: defaultValues?.email || "",
    contactName: "",
  });

  const [quickContact, setQuickContact] = useState({
    // In edit/view, prefill from supplier's primary fields so the section isn't blank.
    name: "",
    email: defaultValues?.email || "",
    phone: defaultValues?.phone || "",
  });

  const [pendingContacts, setPendingContacts] = useState<SupplierContact[]>([]);

  const handleBranchSelect = (value: string) => {
    if (!value || isView) return;

    setSelectedBranches((prev) =>
      prev.includes(value) ? prev : [...prev, value]
    );
  };

  const removeBranch = (value: string) => {
    if (isView) return;
    setSelectedBranches((prev) => prev.filter((b) => b !== value));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      setLoadingBranches(true);
      try {
        const response = await getBranches({ status: 'Active' });
        if (response.success && response.data) {
          setBranches(response.data.branches || []);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      } finally {
        setLoadingBranches(false);
      }
    };
    loadBranches();
  }, []);

  // Fetch contacts when editing/viewing supplier
  useEffect(() => {
    const loadContacts = async () => {
      if (id && (mode === 'edit' || mode === 'view')) {
        setLoadingContacts(true);
        try {
          const response = await getSupplierContacts(id);
          if (response.success && response.data) {
            const raw: any = response.data;
            const list: SupplierContact[] =
              raw.contacts ||
              raw?.data?.contacts ||
              raw?.supplierContacts ||
              [];

            setContacts(list || []);

            // In view mode, show the first contact in the (disabled) contact fields as well.
            if (mode === "view") {
              const first = (list || [])[0];
              if (first) {
                setQuickContact((prev) => ({
                  name: prev.name || first.name || "",
                  email: prev.email || first.email || "",
                  phone: prev.phone || first.phone || "",
                }));
              }
            }
          }
        } catch (err) {
          console.error('Failed to load contacts:', err);
        } finally {
          setLoadingContacts(false);
        }
      }
    };
    loadContacts();
  }, [id, mode]);

  // If supplier data is loaded for edit/view, make sure the contact section shows something.
  useEffect(() => {
    if (mode === "add") return;
    if (!defaultValues) return;

    setQuickContact((prev) => ({
      name: prev.name,
      email: prev.email || defaultValues.email || "",
      phone: prev.phone || defaultValues.phone || "",
    }));
  }, [defaultValues, mode]);

  const handleSubmit = async () => {
    if (isView) return;

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Supplier Name is required");
      return;
    }
    if (!formData.phone.trim() && !quickContact.phone.trim()) {
      setError("Phone Number is required");
      return;
    }

    // Validate GST format (15 characters)
    if (formData.gst.trim() && formData.gst.trim().length !== 15) {
      setError("GST Number must be exactly 15 characters");
      return;
    }

    // Validate IFSC format (11 characters)
    if (formData.ifsc.trim() && formData.ifsc.trim().length !== 11) {
      setError("IFSC Code must be exactly 11 characters");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (mode === "add") {
        // Create new supplier
        const createData: CreateSupplierData = {
          name: formData.name,
          phone: formData.phone || quickContact.phone,
          code: formData.code || undefined,
          email: (formData.email || quickContact.email) || undefined,
          address: formData.address || undefined,
          gstNumber: formData.gst || undefined,
          tinNumber: formData.tin || undefined,
          taxStateCode: formData.taxCode || undefined,
          bankAccount: formData.account || undefined,
          bankName: formData.bank || undefined,
          bankBranch: formData.branch || undefined,
          ifscCode: formData.ifsc || undefined,
          status: (formData.status ? (formData.status as 'active' | 'inactive') : undefined),
        };

        const response = await createSupplier(createData);

        if (response.success) {
          const createdSupplierId = (response.data as any)?.id as string | undefined;
          // If user added contacts before saving supplier, persist them now.
          if (createdSupplierId && pendingContacts.length > 0) {
            for (const c of pendingContacts) {
              await createSupplierContact(createdSupplierId, {
                name: c.name,
                email: c.email || undefined,
                phone: c.phone || undefined,
              });
            }
          }

          setSuccessNavTo("/purchaseorder");
          setSuccessOpen(true);
        } else {
          setError(response.error?.message || "Failed to create supplier");
        }
      } else if (mode === "edit" && id) {
        // Update existing supplier
        const updateData: UpdateSupplierData = {
          name: formData.name,
          phone: formData.phone,
          code: formData.code || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          gstNumber: formData.gst || undefined,
          tinNumber: formData.tin || undefined,
          taxStateCode: formData.taxCode || undefined,
          bankAccount: formData.account || undefined,
          bankName: formData.bank || undefined,
          bankBranch: formData.branch || undefined,
          ifscCode: formData.ifsc || undefined,
          status: (formData.status ? (formData.status as 'active' | 'inactive') : undefined),
        };

        const response = await updateSupplier(id, updateData);

        if (response.success) {
          setSuccessNavTo("/purchaseorder");
          setSuccessOpen(true);
        } else {
          setError(response.error?.message || "Failed to update supplier");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Contact management functions
  const openAddContactModal = () => {
    setEditingContact(null);
    setContactFormData({ name: "", email: "", phone: "" });
    setContactModalOpen(true);
  };

  const openEditContactModal = (contact: SupplierContact) => {
    setEditingContact(contact);
    setContactFormData({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
    });
    setContactModalOpen(true);
  };

  const handleContactSubmit = async () => {
    if (!id) {
      // Allow local edits/adds before supplier is saved.
      if (!contactFormData.name.trim()) {
        setError("Contact name is required");
        return;
      }

      if (editingContact) {
        const updated: SupplierContact = {
          ...editingContact,
          name: contactFormData.name,
          email: contactFormData.email || null,
          phone: contactFormData.phone || null,
        };
        setContacts((prev) => prev.map((c) => (c.id === editingContact.id ? updated : c)));
        setPendingContacts((prev) => prev.map((c) => (c.id === editingContact.id ? updated : c)));
        setContactModalOpen(false);
        return;
      }

      const tmp: SupplierContact = {
        id: `tmp-${Date.now()}`,
        supplierId: "tmp",
        name: contactFormData.name,
        email: contactFormData.email || null,
        phone: contactFormData.phone || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setContacts((prev) => [...prev, tmp]);
      setPendingContacts((prev) => [...prev, tmp]);
      setContactModalOpen(false);
      return;
    }

    if (!contactFormData.name.trim()) {
      setError("Contact name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingContact) {
        // Update existing contact
        const response = await updateSupplierContact(id, editingContact.id, contactFormData);
        if (response.success && response.data) {
          setContacts((prev) =>
            prev.map((c) => (c.id === editingContact.id ? response.data! : c))
          );
          setContactModalOpen(false);
        } else {
          setError(response.error?.message || "Failed to update contact");
        }
      } else {
        // Create new contact
        const response = await createSupplierContact(id, contactFormData);
        if (response.success && response.data) {
          setContacts((prev) => [...prev, response.data!]);
          setContactModalOpen(false);
        } else {
          setError(response.error?.message || "Failed to create contact");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleContactDelete = async (contactId: string) => {
    // Local removal if supplier not saved yet.
    if (!id) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setPendingContacts((prev) => prev.filter((c) => c.id !== contactId));
      return;
    }

    if (!window.confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await deleteSupplierContact(id, contactId);
      if (response.success) {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
      } else {
        setError(response.error?.message || "Failed to delete contact");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAddContact = async () => {
    if (isView) return;

    if (!quickContact.name.trim()) {
      setError("Contact name is required");
      return;
    }
    if (!quickContact.phone.trim()) {
      setError("Phone Number is required");
      return;
    }

    // Keep supplier primary phone/email in sync (needed for supplier create).
    if (!formData.phone && quickContact.phone) {
      setFormData((prev) => ({ ...prev, phone: quickContact.phone }));
    }
    if (!formData.email && quickContact.email) {
      setFormData((prev) => ({ ...prev, email: quickContact.email }));
    }

    setSaving(true);
    setError("");
    try {
      if (id) {
        const response = await createSupplierContact(id, {
          name: quickContact.name,
          email: quickContact.email || undefined,
          phone: quickContact.phone || undefined,
        });
        if (response.success && response.data) {
          setContacts((prev) => [...prev, response.data!]);
        } else {
          setError(response.error?.message || "Failed to create contact");
          return;
        }
      } else {
        const tmp: SupplierContact = {
          id: `tmp-${Date.now()}`,
          supplierId: "tmp",
          name: quickContact.name,
          email: quickContact.email || null,
          phone: quickContact.phone || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setContacts((prev) => [...prev, tmp]);
        setPendingContacts((prev) => [...prev, tmp]);
      }

      setQuickContact({ name: "", email: "", phone: "" });
    } finally {
      setSaving(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="space-y-6">
      <PurchaseOrderTabs />

      <h1 className="text-4xl font-extrabold tracking-tight text-black">
        {mode === "add" && "Add New Supplier"}
        {mode === "edit" && "Edit Supplier"}
        {mode === "view" && "View Supplier"}
      </h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ================= SUPPLIER DETAILS ================= */}
      <div className="bg-[#FFFBF3] border border-[#EADFC2] rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-yellow-600">
          Suppliers Detail's
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Supplier Name"
            placeholder="Paramount Products"
            value={formData.name}
            onChange={(v) => handleInputChange("name", v)}
            disabled={isView}
          />
          <Field
            label="Supplier Code"
            placeholder="123452"
            value={formData.code}
            onChange={(v) => handleInputChange("code", v)}
            disabled={isView}
          />

          <Field
            label="GST Number"
            placeholder="124567892"
            value={formData.gst}
            onChange={(v) => handleInputChange("gst", v)}
            disabled={isView}
          />
          <Field
            label="TIN"
            placeholder="TIN7895556"
            value={formData.tin}
            onChange={(v) => handleInputChange("tin", v)}
            disabled={isView}
          />

          <Field
            label="Tax State Code"
            placeholder="45612"
            value={formData.taxCode}
            onChange={(v) => handleInputChange("taxCode", v)}
            disabled={isView}
          />
          <SelectField
            label="Status"
            value={formData.status}
            disabled={isView}
            onChange={(v) => handleInputChange("status", v)}
            options={[
              { label: "Select Status", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />

          {/* Managing Branches */}
          <div className="space-y-1">
            <SelectField
              label="Managing by Branches"
              value=""
              disabled={isView || loadingBranches}
              onChange={handleBranchSelect}
              options={[
                {
                  label: loadingBranches
                    ? "Loading branches..."
                    : branches.length === 0
                      ? "No branches available"
                      : "Select Branches",
                  value: "",
                },
                ...branches.map((branch) => ({
                  label: branch.name,
                  value: branch.id,
                })),
              ]}
            />

            {/* Selected Chips */}
            <div className="flex gap-2 flex-wrap">
              {selectedBranches.map((branchId) => {
                const branch = branches.find(b => b.id === branchId);
                const displayName = branch?.name || branchId;
                return (
                  <span
                    key={branchId}
                    className="px-3 py-1 text-xs bg-[#EADFC2] rounded-full flex items-center gap-2"
                  >
                    {displayName}
                    {!isView && (
                      <button
                        type="button"
                        onClick={() => removeBranch(branchId)}
                        className="text-gray-700 hover:text-black"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          <Field
            label="Address"
            placeholder="4341 Valley Street, Columbus, OH 4321"
            value={formData.address}
            onChange={(v) => handleInputChange("address", v)}
            disabled={isView}
          />
        </div>
      </div>

      {/* ================= BANK DETAILS ================= */}
      <div className="bg-[#FFFBF3] border border-[#EADFC2] rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-yellow-600">
          Bank Detail's
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Bank Account Number"
            placeholder="123456789012"
            value={formData.account}
            onChange={(v) => handleInputChange("account", v)}
            disabled={isView}
          />
          <Field
            label="Bank Name"
            placeholder="Andhra Bank"
            value={formData.bank}
            onChange={(v) => handleInputChange("bank", v)}
            disabled={isView}
          />
          <Field
            label="Bank Branch"
            placeholder="Select bank Branch"
            value={formData.branch}
            onChange={(v) => handleInputChange("branch", v)}
            disabled={isView}
          />
          <Field
            label="IFSC Code"
            placeholder="UBIN0801678"
            value={formData.ifsc}
            onChange={(v) => handleInputChange("ifsc", v)}
            disabled={isView}
          />
        </div>
      </div>

      {/* ================= CONTACT DETAILS ================= */}
      <div className="bg-[#FFFBF3] border border-[#EADFC2] rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-yellow-600">
          Contact Detail's
        </h2>

        {!isView && (
          <div className="border border-[#EADFC2] rounded-md bg-[#FFFBF3] p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Name"
                value={quickContact.name}
                onChange={(v) => setQuickContact((prev) => ({ ...prev, name: v }))}
                disabled={isView}
              />
              <Field
                label="Email Address"
                value={quickContact.email}
                onChange={(v) => setQuickContact((prev) => ({ ...prev, email: v }))}
                disabled={isView}
              />
              <PhoneField
                label="Phone Number"
                value={quickContact.phone}
                onChange={(v) => setQuickContact((prev) => ({ ...prev, phone: v }))}
                disabled={isView}
              />
            </div>

            <button
              type="button"
              onClick={handleQuickAddContact}
              disabled={saving}
              className="mt-4 w-full border border-black rounded-md py-2 text-sm flex items-center justify-center gap-2 bg-[#FFFDF5] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              + Add New Contact Detail's
            </button>
          </div>
        )}

        {loadingContacts ? (
          <div className="text-sm text-gray-600 text-center py-4">
            Loading contacts...
          </div>
        ) : (
          <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-yellow-400 text-black">
                <tr>
                  <th className="px-4 py-2 text-left">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left">
                    Email Address
                  </th>
                  <th className="px-4 py-2 text-left">
                    Phone Number
                  </th>
                  {!isView && (
                    <th className="px-4 py-2 text-center">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr className="border-t">
                    <td colSpan={isView ? 3 : 4} className="px-4 py-4 text-center text-gray-500">
                      No contacts available
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact, idx) => (
                    <tr
                      key={contact.id}
                      className={`border-t ${idx % 2 ? "bg-[#FFF9E8]" : "bg-white"}`}
                    >
                      <td className="px-4 py-2">{contact.name}</td>
                      <td className="px-4 py-2">
                        {contact.email || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {contact.phone || "-"}
                      </td>
                      {!isView && (
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-4">
                            <Pencil
                              size={16}
                              className="cursor-pointer hover:text-blue-600"
                              onClick={() => openEditContactModal(contact)}
                            />
                            <Trash2
                              size={16}
                              className="cursor-pointer hover:text-red-600"
                              onClick={() => handleContactDelete(contact.id)}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border border-black px-8 py-2 rounded-md bg-white"
          disabled={saving}
        >
          Cancel
        </button>

        {mode === "view" ? (
          <button
            type="button"
            onClick={() => {
              if (!id) return;
              navigate(`/purchaseorder/suppliers/edit/${id}`);
            }}
            className="bg-yellow-400 px-10 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!id}
          >
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-yellow-400 px-10 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : mode === "add" ? "Save" : "Update"}
          </button>
        )}
      </div>

      {/* ================= SUCCESS MODAL ================= */}
      <Modal
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          navigate(successNavTo);
        }}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          {mode === "add"
            ? "New Supplier Added"
            : "Supplier Updated"}
        </h2>

        <div className="flex justify-center mb-6">
          <img
            src={tickImg}
            alt="Success"
            className="w-16 h-16"
          />
        </div>

        <p className="text-sm text-gray-600">
          {mode === "add"
            ? "New Supplier Details added Successfully."
            : "Supplier Details Updated Successfully."}
        </p>
      </Modal>

      {/* ================= CONTACT MODAL ================= */}
      <Modal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        className="w-[90%] max-w-md p-6"
      >
        <h2 className="text-xl font-bold mb-6">
          {editingContact ? "Edit Contact" : "Add New Contact"}
        </h2>

        <div className="space-y-4">
          <Field
            label="Name *"
            placeholder="Enter contact name"
            value={contactFormData.name}
            onChange={(v) => setContactFormData({ ...contactFormData, name: v })}
          />
          <Field
            label="Email"
            placeholder="Enter email address"
            value={contactFormData.email}
            onChange={(v) => setContactFormData({ ...contactFormData, email: v })}
          />
          <Field
            label="Phone"
            placeholder="Enter phone number"
            value={contactFormData.phone}
            onChange={(v) => setContactFormData({ ...contactFormData, phone: v })}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => setContactModalOpen(false)}
            className="border px-4 py-2 rounded"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContactSubmit}
            disabled={saving}
            className="bg-yellow-400 px-6 py-2 rounded border border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : editingContact ? "Update" : "Add"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const bg = disabled ? "bg-[#E5E5E5]" : "bg-[#FFFDF5]";
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-black">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full h-[42px] border border-gray-200 rounded-md px-4 ${bg} text-sm ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-black">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full h-[42px] border border-gray-200 rounded-md px-4 pr-10 ${
            disabled ? "bg-[#E5E5E5]" : "bg-[#FFFDF5]"
          } text-sm appearance-none ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
      </div>
    </div>
  );
}

function PhoneField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-black">{label}</label>
      <div
        className={`flex items-center w-full h-[42px] border border-gray-200 rounded-md ${
          disabled ? "bg-[#E5E5E5]" : "bg-[#FFFDF5]"
        } overflow-hidden ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        <div className="relative h-full">
          <select
            disabled={true}
            className={`h-full px-3 pr-8 text-sm appearance-none border-r border-gray-200 ${
              disabled ? "bg-[#E5E5E5]" : "bg-[#FFFDF5]"
            }`}
          >
            <option>+91</option>
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="9875642310"
          className="flex-1 h-full px-3 text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}

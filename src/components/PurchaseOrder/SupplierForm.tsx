import { useNavigate, useParams } from "react-router-dom";
import Input from "../form/Input";
import Select from "../form/Select";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import tickImg from "../../assets/tick.png";
import { createSupplier, updateSupplier, CreateSupplierData, UpdateSupplierData, getSupplierContacts, createSupplierContact, updateSupplierContact, deleteSupplierContact, SupplierContact } from "../../services/supplierService";
import { CRUDToasts } from "../../utils/toast";
import { getBranches, Branch } from "../../services/branchService";

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
    status: defaultValues?.status || "active",
    address: defaultValues?.address || "",
    account: defaultValues?.bankAccount || "",
    bank: defaultValues?.bankName || "",
    branch: defaultValues?.bankBranch || "",
    ifsc: defaultValues?.ifscCode || "",
    phone: defaultValues?.phone || "",
    email: defaultValues?.email || "",
  });

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
            setContacts(response.data.contacts || []);
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

  const handleSubmit = async () => {
    if (isView) return;

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Supplier Name is required");
      return;
    }
    if (!formData.phone.trim()) {
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
          status: formData.status as 'active' | 'inactive',
        };

        const response = await createSupplier(createData);

        if (response.success) {
          CRUDToasts.created("Supplier");
          setSuccessOpen(true);
          setTimeout(() => {
            setSuccessOpen(false);
            navigate("/purchaseorder/suppliers");
          }, 2000);
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
          status: formData.status as 'active' | 'inactive',
        };

        const response = await updateSupplier(id, updateData);

        if (response.success) {
          CRUDToasts.updated("Supplier");
          setSuccessOpen(true);
          setTimeout(() => {
            setSuccessOpen(false);
            navigate("/purchaseorder/suppliers");
          }, 2000);
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
      setError("Supplier must be saved before adding contacts");
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
          CRUDToasts.updated("Contact");
          setContactModalOpen(false);
        } else {
          setError(response.error?.message || "Failed to update contact");
        }
      } else {
        // Create new contact
        const response = await createSupplierContact(id, contactFormData);
        if (response.success && response.data) {
          setContacts((prev) => [...prev, response.data!]);
          CRUDToasts.created("Contact");
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
    if (!id) return;

    if (!window.confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await deleteSupplierContact(id, contactId);
      if (response.success) {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        CRUDToasts.deleted("Contact");
      } else {
        setError(response.error?.message || "Failed to delete contact");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">
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
      <div className="bg-[#FFF9ED] border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-yellow-600">
          Suppliers Detail's
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Supplier Name"
            placeholder="Paramount Products"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            disabled={isView}
          />
          <Input
            label="Supplier Code"
            placeholder="123452"
            value={formData.code}
            onChange={(value) => handleInputChange('code', value)}
            disabled={isView}
          />

          <Input
            label="GST Number"
            placeholder="124567892"
            value={formData.gst}
            onChange={(value) => handleInputChange('gst', value)}
            disabled={isView}
          />
          <Input
            label="TIN"
            placeholder="TIN7895556"
            value={formData.tin}
            onChange={(value) => handleInputChange('tin', value)}
            disabled={isView}
          />

          <Input
            label="Tax State Code"
            placeholder="45612"
            value={formData.taxCode}
            onChange={(value) => handleInputChange('taxCode', value)}
            disabled={isView}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => handleInputChange('status', value)}
            disabled={isView}
            options={[
              { label: "Select Status", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />

          {/* Managing Branches */}
          <div className="space-y-1">
            <Select
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
                  value: ""
                },
                ...branches.map(branch => ({
                  label: branch.name,
                  value: branch.id
                }))
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
                    className="px-3 py-1 text-xs bg-gray-200 rounded-full flex items-center gap-1"
                  >
                    {displayName}
                    {!isView && (
                      <button
                        type="button"
                        onClick={() => removeBranch(branchId)}
                        className="text-gray-600 hover:text-black"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          <Input
            label="Address"
            placeholder="4341 Valley Street, Columbus, OH 4321"
            value={formData.address}
            onChange={(value) => handleInputChange('address', value)}
            disabled={isView}
          />
        </div>
      </div>

      {/* ================= BANK DETAILS ================= */}
      <div className="bg-[#FFF9ED] border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-yellow-600">
          Bank Detail's
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Bank Account Number"
            placeholder="123456789012"
            value={formData.account}
            onChange={(value) => handleInputChange('account', value)}
            disabled={isView}
          />
          <Input
            label="Bank Name"
            placeholder="Andhra Bank"
            value={formData.bank}
            onChange={(value) => handleInputChange('bank', value)}
            disabled={isView}
          />
          <Input
            label="Bank Branch"
            placeholder="Enter bank branch"
            value={formData.branch}
            onChange={(value) => handleInputChange('branch', value)}
            disabled={isView}
          />
          <Input
            label="IFSC Code"
            placeholder="UBIN0801678"
            value={formData.ifsc}
            onChange={(value) => handleInputChange('ifsc', value)}
            disabled={isView}
          />
        </div>
      </div>

      {/* ================= CONTACT DETAILS ================= */}
      <div className="bg-[#FFF9ED] border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-yellow-600">
          Contact Detail's
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Name"
            disabled={isView}
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
          />
          <Input
            label="Email Address"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            disabled={isView}
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(value) => handleInputChange('phone', value)}
            disabled={isView}
          />
        </div>

        {!isView && id && (
          <button
            type="button"
            onClick={openAddContactModal}
            className="w-full border rounded-md py-2 text-sm flex items-center justify-center gap-2 hover:bg-bb-bg"
          >
            <Plus size={14} /> Add New Contact Detail's
          </button>
        )}

        {!id && mode === "add" && (
          <div className="text-sm text-gray-600 text-center py-4">
            Please save the supplier first before adding contacts.
          </div>
        )}

        {loadingContacts ? (
          <div className="text-sm text-gray-600 text-center py-4">
            Loading contacts...
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FFD24C]">
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
                  <th className="px-4 py-2 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr className="border-t">
                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                      No contacts available
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="border-t">
                      <td className="px-4 py-2">{contact.name}</td>
                      <td className="px-4 py-2">
                        {contact.email || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {contact.phone || "-"}
                      </td>
                      <td className="px-4 py-2 text-center flex justify-center gap-3">
                        {!isView && (
                          <>
                            <Pencil
                              size={14}
                              className="cursor-pointer hover:text-blue-600"
                              onClick={() => openEditContactModal(contact)}
                            />
                            <Trash2
                              size={14}
                              className="cursor-pointer hover:text-red-600"
                              onClick={() => handleContactDelete(contact.id)}
                            />
                          </>
                        )}
                      </td>
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
          className="border px-4 py-2 rounded"
          disabled={saving}
        >
          {isView ? "Back" : "Cancel"}
        </button>

        {mode !== "view" && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-yellow-400 px-6 py-2 rounded border border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : mode === "add" ? "Save" : "Update"}
          </button>
        )}
      </div>

      {/* ================= SUCCESS MODAL ================= */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
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
          <Input
            label="Name *"
            placeholder="Enter contact name"
            value={contactFormData.name}
            onChange={(value) => setContactFormData({ ...contactFormData, name: value })}
          />
          <Input
            label="Email"
            placeholder="Enter email address"
            value={contactFormData.email}
            onChange={(value) => setContactFormData({ ...contactFormData, email: value })}
          />
          <Input
            label="Phone"
            placeholder="Enter phone number"
            value={contactFormData.phone}
            onChange={(value) => setContactFormData({ ...contactFormData, phone: value })}
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

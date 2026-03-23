import { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import Select from "../../form/Select";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import successIcon from "../../../assets/tick.png";
import { useOrder } from "../../../contexts/OrderContext";
import { getCustomers, getCustomer, createCustomer, Customer } from "../../../services/customerService";
import { showSuccessToast, showErrorToast } from "../../../utils/toast";

interface CustomerDetailsProps {
  /**
   * Controls whether the address field can be edited.
   * For Dine In this should be disabled; for Take Away it stays enabled.
   */
  addressEditable?: boolean;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ addressEditable = true }) => {
  const [mode, setMode] = useState<"view" | "add">("view");
  const { customer, setCustomer } = useOrder();

  // view mode state
  const [phone, setPhone] = useState(customer.customerPhone || "");
  const [customerName, setCustomerName] = useState(customer.customerName || "");
  const [address, setAddress] = useState(customer.address || "");
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [gstinNumber, setGstinNumber] = useState(customer.gstinNumber || "");
  const [taxStateCode, setTaxStateCode] = useState(customer.taxStateCode || "");
  const [companyName, setCompanyName] = useState(customer.companyName || "");

  // add mode form state
  const [customerGroup, setCustomerGroup] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [annDay, setAnnDay] = useState("");
  const [annMonth, setAnnMonth] = useState("");
  const [annYear, setAnnYear] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= PHONE LOOKUP ================= */
  const handlePhoneLookup = useCallback(async (phoneValue: string) => {
    const trimmed = phoneValue.trim().replace(/\s+/g, "");
    if (!trimmed || trimmed.length < 4) return;

    setLookupLoading(true);
    try {
      const res = await getCustomers({ search: trimmed, limit: 1 });
      if (res.success && res.data?.customers?.length) {
        const c = res.data.customers[0];
        let resolvedAddress = c.address || "";
        let resolvedGstin = c.gstin || "";
        let resolvedTaxState = taxStateCode;
        let resolvedCompany = companyName;
        try {
          const detail = await getCustomer(c.id);
          if (detail.success && detail.data) {
            resolvedAddress = detail.data.address || resolvedAddress || "";
            resolvedGstin = detail.data.gstin || resolvedGstin;
            // Pick up optional fields if backend sends them
            // @ts-expect-error backend may include these even if not typed
            resolvedTaxState = detail.data.taxStateCode || resolvedTaxState;
            // @ts-expect-error backend may include these even if not typed
            resolvedCompany = detail.data.companyName || resolvedCompany;
          }
        } catch {
          resolvedAddress = resolvedAddress || "";
        }
        setFoundCustomer(c);
        setCustomerName(c.name);
        setAddress(resolvedAddress);
        setGstinNumber(resolvedGstin);
        setTaxStateCode(resolvedTaxState || "");
        setCompanyName(resolvedCompany || "");
        setLookupDone(true);
        setCustomer({
          customerId: c.id,
          customerName: c.name,
          customerPhone: c.phone,
          address: resolvedAddress || undefined,
          gstinNumber: resolvedGstin || undefined,
          taxStateCode: resolvedTaxState || undefined,
          companyName: resolvedCompany || undefined,
        });
      } else {
        setFoundCustomer(null);
        setCustomerName("");
        setAddress("");
        setLookupDone(true);
      }
    } catch {
      setFoundCustomer(null);
      setCustomerName("");
      setAddress("");
      setLookupDone(true);
    } finally {
      setLookupLoading(false);
    }
  }, [setCustomer]);

  /* ================= VIEW MODE ================= */
  if (mode === "view") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm">Customer Details</h4>
          <button
            onClick={() => {
              setAddPhone(phone);
              setMode("add");
            }}
            className="text-xs px-3 py-1 rounded-md bg-black text-white"
          >
            Add New
          </button>
        </div>

        <div>
          <label className="text-sm font-medium">Phone Number</label>
          <div className="relative">
            <input
              className="w-full h-10 border rounded-lg px-3 mt-1"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setLookupDone(false);
                setFoundCustomer(null);
                setCustomerName("");
              }}
              onBlur={() => handlePhoneLookup(phone)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePhoneLookup(phone);
              }}
            />
            {lookupLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-xs text-gray-400">
                Searching...
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Customer Name</label>
          <input
            className="w-full h-10 border rounded-lg px-3 mt-1 bg-gray-100"
            disabled
            value={customerName}
            placeholder={lookupDone && !foundCustomer ? "Not found" : ""}
          />
        </div>

        {lookupDone && !foundCustomer && (
          <p className="text-xs text-gray-500">
            No customer found.{" "}
            <button
              className="text-blue-600 underline"
              onClick={() => {
                setAddPhone(phone);
                setMode("add");
              }}
            >
              Add New
            </button>
          </p>
        )}

        <div>
          <label className="text-sm font-medium">Address</label>
          <input
            className={`w-full h-10 border rounded-lg px-3 mt-1 ${
              addressEditable ? "bg-white" : "bg-gray-100 text-gray-700"
            }`}
            placeholder={
              foundCustomer
                ? addressEditable
                  ? "Edit or keep auto-filled address"
                  : "Auto-filled address"
                : addressEditable
                ? "Enter address"
                : "Lookup customer to auto-fill"
            }
            disabled={!addressEditable}
            readOnly={!addressEditable}
            value={address}
            onChange={(e) => {
              if (!addressEditable) return;
              const value = e.target.value;
              setAddress(value);
        setCustomer({
          customerId: foundCustomer?.id || customer.customerId,
          customerName: foundCustomer?.name || customer.customerName,
          customerPhone: foundCustomer?.phone || customer.customerPhone,
          address: value || undefined,
          gstinNumber: gstinNumber || undefined,
          taxStateCode: taxStateCode || undefined,
          companyName: companyName || undefined,
        });
            }}
          />
        </div>
      </div>
    );
  }

  /* ================= RESET ADD FORM ================= */
  const resetAddForm = () => {
    setCustomerGroup("");
    setAddPhone("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setGender("");
    setDobDay("");
    setDobMonth("");
    setDobYear("");
    setAnnDay("");
    setAnnMonth("");
    setAnnYear("");
    setGstinNumber("");
    setTaxStateCode("");
    setCompanyName("");
    setAddress("");
  };

  /* ================= SAVE HANDLER ================= */
  const handleSave = async () => {
    if (!addPhone.trim() || !firstName.trim()) {
      showErrorToast("Phone number and first name are required");
      return;
    }

    const name = lastName.trim()
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName.trim();

    let dob: string | undefined;
    if (dobDay && dobMonth && dobYear) {
      dob = new Date(
        parseInt(dobYear),
        parseInt(dobMonth) - 1,
        parseInt(dobDay)
      ).toISOString();
    }

    setSaving(true);
    try {
      const res = await createCustomer({
        name,
        phone: addPhone.trim(),
        email: email.trim() || undefined,
        gender: gender || undefined,
        dob,
        type: customerGroup === "vip" ? "VIP" : customerGroup === "corporate" ? "Wholesale" : "Regular",
        gstin: gstinNumber || undefined,
        taxStateCode: taxStateCode || undefined,
        companyName: companyName || undefined,
        address: address || undefined,
      });

      if (res.success && res.data) {
        const c = res.data;
        setCustomer({
          customerId: c.id,
          customerName: c.name,
          customerPhone: c.phone,
          address: address || undefined,
          gstinNumber: gstinNumber || undefined,
          taxStateCode: taxStateCode || undefined,
          companyName: companyName || undefined,
        });
        setPhone(c.phone);
        setCustomerName(c.name);
        setFoundCustomer(c);
        setLookupDone(true);

        await Swal.fire({
          title: "Saved!",
          html: `
            <div style="display:flex; justify-content:center; margin:16px 0;">
              <img src="${successIcon}" style="width:56px; height:56px;" />
            </div>
            <p style="font-size:14px; color:#6b7280; text-align:center;">
              Customer details have been saved successfully.
            </p>
          `,
          confirmButtonText: "OK",
          buttonsStyling: false,
          didOpen: () => {
            const confirm = Swal.getConfirmButton();
            const actions = Swal.getActions();

            if (actions) {
              actions.style.display = "flex";
              actions.style.justifyContent = "center";
            }

            if (confirm) {
              confirm.style.background = "#facc15";
              confirm.style.color = "#000";
              confirm.style.padding = "8px 28px";
              confirm.style.border = "none";
              confirm.style.borderRadius = "4px";
              confirm.style.fontWeight = "500";
              confirm.style.minWidth = "100px";
            }
          },
        });

        resetAddForm();
        setMode("view");
      } else {
        showErrorToast(res.error?.message || "Failed to create customer");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  /* ================= ADD MODE ================= */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMode("view")}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Customer Information
        </button>

        <button
          onClick={() => {
            resetAddForm();
            setMode("view");
          }}
          className="text-xs px-3 py-1 rounded-md border"
        >
          Reset
        </button>
      </div>

      {/* Customer Group */}
      <Select
        label="Customer Group"
        required
        value={customerGroup}
        onChange={setCustomerGroup}
        options={[
          { label: "Regular", value: "regular" },
          { label: "VIP", value: "vip" },
          { label: "Corporate", value: "corporate" },
        ]}
      />

      {/* Phone */}
      <div>
        <label className="text-xs font-medium">
          Phone Number<span className="text-red-500">*</span>
        </label>
        <input
          className="w-full h-10 border rounded-lg px-3 mt-1"
          value={addPhone}
          onChange={(e) => setAddPhone(e.target.value)}
        />
      </div>

      {/* Names */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">
            First Name<span className="text-red-500">*</span>
          </label>
          <input
            className="w-full h-10 border rounded-lg px-3 mt-1"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium">
            Last Name<span className="text-red-500">*</span>
          </label>
          <input
            className="w-full h-10 border rounded-lg px-3 mt-1"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="text-xs font-medium">Email</label>
        <input
          className="w-full h-10 border rounded-lg px-3 mt-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Gender (RADIO BUTTONS) */}
      <div>
        <label className="text-xs font-medium">Gender</label>
        <div className="flex gap-6 mt-2">
          {["male", "female", "others"].map((g) => (
            <label key={g} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gender"
                value={g}
                checked={gender === g}
                onChange={() => setGender(g)}
              />
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* DOB */}
      <div>
        <label className="text-xs font-medium">Date of Birth</label>
        <div className="grid grid-cols-3 gap-3 mt-1">
          <Select
            value={dobDay}
            onChange={setDobDay}
            options={[...Array(31)].map((_, i) => ({
              label: `${i + 1}`,
              value: `${i + 1}`,
            }))}
          />
          <Select
            value={dobMonth}
            onChange={setDobMonth}
            options={[...Array(12)].map((_, i) => ({
              label: `${i + 1}`,
              value: `${i + 1}`,
            }))}
          />
          <Select
            value={dobYear}
            onChange={setDobYear}
            options={[...Array(70)].map((_, i) => ({
              label: `${1955 + i}`,
              value: `${1955 + i}`,
            }))}
          />
        </div>
      </div>

      {/* Anniversary */}
      <div>
        <label className="text-xs font-medium">Anniversary</label>
        <div className="grid grid-cols-3 gap-3 mt-1">
          <Select
            value={annDay}
            onChange={setAnnDay}
            options={[...Array(31)].map((_, i) => ({
              label: `${i + 1}`,
              value: `${i + 1}`,
            }))}
          />
          <Select
            value={annMonth}
            onChange={setAnnMonth}
            options={[...Array(12)].map((_, i) => ({
              label: `${i + 1}`,
              value: `${i + 1}`,
            }))}
          />
          <Select
            value={annYear}
            onChange={setAnnYear}
            options={[...Array(50)].map((_, i) => ({
              label: `${1975 + i}`,
              value: `${1975 + i}`,
            }))}
          />
        </div>
      </div>

      {/* GSTIN / Tax State Code */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">GSTIN</label>
          <input
            className="w-full h-10 border rounded-lg px-3 mt-1"
            value={gstinNumber}
            onChange={(e) => setGstinNumber(e.target.value)}
            placeholder="Enter GSTIN Number"
          />
        </div>
        <div>
          <label className="text-xs font-medium">Tax State Code</label>
          <input
            className="w-full h-10 border rounded-lg px-3 mt-1"
            value={taxStateCode}
            onChange={(e) => setTaxStateCode(e.target.value)}
            placeholder="Enter Tax State Code"
          />
        </div>
      </div>

      {/* Company */}
      <div>
        <label className="text-xs font-medium">Company</label>
        <input
          className="w-full h-10 border rounded-lg px-3 mt-1"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company Name"
        />
      </div>

      {/* Address */}
      <div>
        <label className="text-xs font-medium">Address</label>
        <input
          className="w-full h-10 border rounded-lg px-3 mt-1"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Address"
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-[#FFC533] font-semibold disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default CustomerDetails;

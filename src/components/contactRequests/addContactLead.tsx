import { X } from "lucide-react";
import { useState } from "react";
import Input from "../form/Input";
import Select from "../form/Select";
import Textarea from "../form/Textarea";
import SuccessAlert from "./successAlert";
import { createLead } from "../../services/contactService";

type Props = {
  open: boolean;
  onClose: () => void;
};

/* ================= LOCATION DATA ================= */
const LOCATION_DATA = {
  India: {
    Telangana: ["Hyderabad", "Warangal", "Karimnagar"],
    Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
    TamilNadu: ["Chennai", "Coimbatore", "Madurai"],
  },
  USA: {
    California: ["Los Angeles", "San Francisco", "San Diego"],
    Texas: ["Austin", "Dallas", "Houston"],
  },
} as const;

type Country = keyof typeof LOCATION_DATA;
type CityList = readonly string[];

export default function CreateLeadModal({ open, onClose }: Props) {
  const [country, setCountry] = useState<Country | "">("");
  const [state, setState] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Form fields
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const cities: CityList =
    country && state && state in LOCATION_DATA[country]
      ? LOCATION_DATA[country][
          state as keyof typeof LOCATION_DATA[typeof country]
        ]
      : [];

  const handleSubmit = async () => {
    // Basic validation
    if (!restaurantName || !ownerName || !email || !phone || !inquiryType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);

      const response = await createLead({
        restaurantName,
        ownerName,
        email,
        phone,
        businessType: businessType || undefined,
        inquiryType: inquiryType || undefined,
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        zipCode: zipCode || undefined,
        address: address || undefined,
        description: description || undefined,
      });

      if (response.success) {
        setShowSuccess(true);
        // Reset form
        setRestaurantName("");
        setOwnerName("");
        setEmail("");
        setPhone("");
        setBusinessType("");
        setInquiryType("");
        setCountry("");
        setState("");
        setCity("");
        setZipCode("");
        setAddress("");
        setDescription("");
      } else {
        alert(response.message || 'Failed to create contact');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* ================= CREATE LEAD MODAL ================= */}
      <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto">
        <div className="min-h-screen flex items-start sm:items-center justify-center px-4 py-6">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create Lead</h2>
              <button onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Restaurant Name"
                placeholder="Enter restaurant name"
                required
                value={restaurantName}
                onChange={setRestaurantName}
              />
              <Input
                label="Owner's Full Name"
                placeholder="Enter contact person"
                required
                value={ownerName}
                onChange={setOwnerName}
              />
              <Input
                label="Email Address"
                placeholder="Enter email"
                required
                value={email}
                onChange={setEmail}
              />
              <Input
                label="Phone Number"
                placeholder="+91 XXXXX XXXXX"
                required
                value={phone}
                onChange={setPhone}
              />

              <Select
                label="Business Type"
                required
                value={businessType}
                onChange={(val) => setBusinessType(val)}
                options={[
                  { label: "Quick Service Restaurant (QSR)", value: "qsr" },
                  { label: "Full-Service Restaurant", value: "full_service" },
                  { label: "Cafe", value: "cafe" },
                  { label: "Cloud Kitchen", value: "cloud_kitchen" },
                  { label: "Food Truck", value: "food_truck" },
                  { label: "Catering Service", value: "catering" },
                  { label: "Others", value: "others" },
                ]}
              />

              <Select
                label="Inquiry Type"
                required
                value={inquiryType}
                onChange={(val) => setInquiryType(val)}
                options={[
                  { label: "Product Demo Request", value: "demo" },
                  { label: "Pricing Inquiry", value: "pricing" },
                  { label: "Technical Support", value: "support" },
                  { label: "Feedback", value: "feedback" },
                  { label: "Partnership Inquiry", value: "partnership" },
                  { label: "Others", value: "others" },
                ]}
              />

              <Select
                label="Country"
                required
                value={country}
                onChange={(val) => {
                  setCountry(val as Country);
                  setState("");
                  setCity("");
                }}
                options={Object.keys(LOCATION_DATA).map((c) => ({
                  label: c,
                  value: c,
                }))}
              />

              <Select
                label="State"
                required
                value={state}
                onChange={(val) => {
                  setState(val as string);
                  setCity("");
                }}
                options={
                  country
                    ? Object.keys(LOCATION_DATA[country]).map((s) => ({
                        label: s,
                        value: s,
                      }))
                    : []
                }
              />

              <Select
                label="City"
                required
                value={city}
                onChange={(val) => setCity(val as string)}
                options={cities.map((c) => ({
                  label: c,
                  value: c,
                }))}
              />

              <Input
                label="Zip Code / Pin Code"
                placeholder="Enter Zip Code"
                required
                value={zipCode}
                onChange={setZipCode}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Address"
                  placeholder="Business Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  placeholder="Enter notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-5 py-2 border rounded-md text-sm"
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-5 py-2 bg-[#FDC836] rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SUCCESS ALERT ================= */}
      <SuccessAlert
        open={showSuccess}
        title="Lead Created"
        message="Contact lead has been created successfully!"
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }}
      />
    </>
  );
}

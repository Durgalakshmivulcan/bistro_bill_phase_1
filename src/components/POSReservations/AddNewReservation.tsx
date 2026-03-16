import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Clock } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import Input from "../form/Input";
import Select from "../form/Select";
import Modal from "../../components/ui/Modal";
import tickImg from "../../assets/tick.png";
import { useBranch } from "../../contexts/BranchContext";
import { createReservation, CreateReservationInput } from "../../services/reservationService";
import { getCustomers, Customer } from "../../services/customerService";
import { getFloors, getTables, Floor, Table } from "../../services/tableService";

const AddNewReservation: React.FC = () => {
  const navigate = useNavigate();
  const { currentBranchId, currentBranch, availableBranches, isAllLocationsSelected } = useBranch();

  const branchId =
    !isAllLocationsSelected && currentBranchId
      ? currentBranchId
      : currentBranch?.id || availableBranches[0]?.id || "";

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [floorId, setFloorId] = useState("");
  const [tableId, setTableId] = useState("");
  const [notes, setNotes] = useState("");
  const [guestCount, setGuestCount] = useState(1);

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  // UI state
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [error, setError] = useState("");

  /* 🔹 Time Slot State */
  const [openTimeSlot, setOpenTimeSlot] = useState(false);
  const [timeSlot, setTimeSlot] = useState("");

  // Generate time slots dynamically (9:00 AM to 10:30 PM in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 22; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      slots.push(`${displayHour.toString().padStart(2, '0')}:00 ${period}`);
      if (hour < 22) {
        slots.push(`${displayHour.toString().padStart(2, '0')}:30 ${period}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const formatTableStatus = (status: string) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const response = await getCustomers({ limit: 1000 });
        if (response.success && response.data?.customers) {
          setCustomers(response.data.customers);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch floors on mount
  useEffect(() => {
    if (!branchId) return;

    const fetchFloors = async () => {
      setLoadingFloors(true);
      try {
        const response = await getFloors(branchId, 'active');
        if (response.success && response.data?.floors) {
          setFloors(response.data.floors);
        }
      } catch (err) {
        console.error('Failed to fetch floors:', err);
      } finally {
        setLoadingFloors(false);
      }
    };

    fetchFloors();
  }, [branchId]);

  // Fetch tables when floor changes
  useEffect(() => {
    if (!floorId) {
      setTables([]);
      setTableId("");
      return;
    }

    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const response = await getTables(floorId);
        if (response.success && response.data?.tables) {
          const branchTables = response.data.tables.filter(
            (table) => table.capacity >= guestCount && table.status !== "maintenance"
          );
          setTables(branchTables);
        }
      } catch (err) {
        console.error('Failed to fetch tables:', err);
      } finally {
        setLoadingTables(false);
      }
    };

    fetchTables();
  }, [floorId, guestCount]);

  // Handle customer selection
  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    const selectedCustomer = customers.find((c) => c.id === value);
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.name);
      setPhone(selectedCustomer.phone);
      setEmail(selectedCustomer.email || "");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!customerName.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!date) {
      setError("Reservation date is required");
      return;
    }
    if (!timeSlot) {
      setError("Reservation time slot is required");
      return;
    }
    if (!branchId) {
      setError("Branch information is missing");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Convert time slot to HH:MM format
      const [time, period] = timeSlot.split(' ');
      const [hour, minute] = time.split(':');
      let hour24 = parseInt(hour);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      const startTime = `${hour24.toString().padStart(2, '0')}:${minute}`;

      // Calculate end time (1 hour after start)
      const endHour = (hour24 + 1) % 24;
      const endTime = `${endHour.toString().padStart(2, '0')}:${minute}`;

      const reservationData: CreateReservationInput = {
        branchId,
        tableId: tableId || null,
        customerId: customerId || null,
        customerName,
        customerPhone: phone,
        date,
        startTime,
        endTime,
        guestCount,
        notes: notes.trim() || undefined,
      };

      const response = await createReservation(reservationData);

      if (response.success) {
        setSuccessOpen(true);
      } else {
        setError(response.message || "Failed to create reservation");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the reservation");
    } finally {
      setLoading(false);
    }
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setSuccessOpen(false);
    navigate("/pos/reservations");
  };

  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-4 sm:p-6 space-y-6">
        {/* PAGE TITLE */}
        <h1 className="text-2xl sm:text-3xl font-bold">
          Add New Reservation
        </h1>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* FORM CARD */}
        <div className="bg-bb-bg rounded-xl border p-4 sm:p-6 space-y-6">
          {/* BASIC DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Customer Name"
              required
              value={customerId}
              onChange={handleCustomerChange}
              options={[
                { label: loadingCustomers ? "Loading..." : "Enter/Select Customer Name", value: "" },
                ...customers.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />

            <Input
              label="Email Address"
              value={email}
              onChange={setEmail}
            />

            <Input
              label="Phone Number"
              required
              value={phone}
              onChange={setPhone}
            />

            <Input
              label="Reservation Date"
              required
              type="date"
              value={date}
              onChange={setDate}
            />

            {/* 🔹 TIME SLOT INPUT */}
            <div onClick={() => setOpenTimeSlot(true)}>
              <Input
                label="Reservation Time Slot"
                required
                value={timeSlot}
                placeholder="Select Time Slot"
                readOnly
                rightIcon={<Clock size={18} />}
              />
            </div>

            <Select
              label="Floor / Area"
              value={floorId}
              onChange={setFloorId}
              options={[
                { label: loadingFloors ? "Loading..." : "Select Floor/Area", value: "" },
                ...floors.map((f) => ({ label: f.name, value: f.id })),
              ]}
            />
          </div>

          {/* GUEST + TABLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            {/* GUEST COUNT */}
            <div>
              <label className="text-sm font-medium">
                Guest Count <span className="text-red-500">*</span>
              </label>

              <div className="mt-2 inline-flex items-center rounded-full overflow-hidden border">
                <button
                  type="button"
                  onClick={() =>
                    setGuestCount((g) => Math.max(1, g - 1))
                  }
                  className="px-4 py-2 bg-black text-white"
                >
                  <Minus size={16} />
                </button>

                <span className="px-6 font-medium">
                  {guestCount}
                </span>

                <button
                  type="button"
                  onClick={() => setGuestCount((g) => g + 1)}
                  className="px-4 py-2 bg-black text-white"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* TABLE */}
            <Select
              label="Table"
              value={tableId}
              onChange={setTableId}
              options={[
                { label: loadingTables ? "Loading..." : "Select Table", value: "" },
                ...tables.map((t) => ({
                  label: `${t.tableNumber} (Capacity: ${t.capacity}) - ${formatTableStatus(t.status)}`,
                  value: t.id,
                })),
              ]}
            />
          </div>

          {/* NOTES */}
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              placeholder="Add Notes here..."
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="
                mt-2 w-full rounded-lg border
                px-4 py-3 text-sm
                bg-transparent
              "
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="border border-black px-6 py-2 rounded"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ TIME SLOT MODAL */}
      <Modal
        open={openTimeSlot}
        onClose={() => setOpenTimeSlot(false)}
        className="w-[95%] max-w-lg p-5"
      >
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Time Slots</h2>
          <p className="text-sm text-gray-500">
            Choose Your Reservation Slot
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 text-sm">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => {
                setTimeSlot(slot);
                setOpenTimeSlot(false);
              }}
              className={`
                border rounded-md py-2
                ${
                  timeSlot === slot
                    ? "bg-yellow-400 font-medium"
                    : "hover:bg-gray-100"
                }
              `}
            >
              {slot}
            </button>
          ))}
        </div>
      </Modal>

      {/* ✅ SUCCESS MODAL */}
      <Modal
        open={successOpen}
        onClose={handleSuccessClose}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          Reservation Added
        </h2>

        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          New Reservation has been added <br />
          Successfully.
        </p>

        <button
          onClick={handleSuccessClose}
          className="mt-6 bg-yellow-400 px-6 py-2 rounded font-medium"
        >
          OK
        </button>
      </Modal>
    </DashboardLayout>
  );
};

export default AddNewReservation;

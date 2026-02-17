import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import Input from "../form/Input";
import Select from "../form/Select";
import Modal from "../../components/ui/Modal";
import tickImg from "../../assets/tick.png";
import { useAuth } from "../../contexts/AuthContext";
import { useBranch } from "../../contexts/BranchContext";
import { getReservation, updateReservation, Reservation, UpdateReservationInput } from "../../services/reservationService";
import { getCustomers, Customer } from "../../services/customerService";
import { getFloors, getTables, Floor, Table } from "../../services/tableService";

const EditReservation = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  // Use branchId from BranchContext
  const branchId = currentBranchId;

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
  const [timeSlot, setTimeSlot] = useState("");

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  // UI state
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openTimeSlot, setOpenTimeSlot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingReservation, setLoadingReservation] = useState(true);
  const [error, setError] = useState("");

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

  // Convert 24-hour time to 12-hour AM/PM format
  const formatTimeTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Convert 12-hour AM/PM time to 24-hour format
  const formatTimeTo24Hour = (time12: string): string => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '';

    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Fetch reservation data on mount
  useEffect(() => {
    if (!id) return;

    const fetchReservation = async () => {
      setLoadingReservation(true);
      setError("");
      try {
        const response = await getReservation(id);
        if (response.success && response.data) {
          const reservation = response.data;
          setCustomerId(reservation.customerId || "");
          setCustomerName(reservation.customerName);
          setPhone(reservation.customerPhone);
          setEmail(reservation.customer?.email || "");
          setDate(reservation.date.split('T')[0]); // Extract YYYY-MM-DD from ISO date
          setTimeSlot(formatTimeTo12Hour(reservation.startTime));
          setGuestCount(reservation.guestCount);
          setTableId(reservation.tableId || "");
          setFloorId(reservation.table?.floorId || "");
          setNotes(reservation.notes || "");
        } else {
          setError("Reservation not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load reservation");
      } finally {
        setLoadingReservation(false);
      }
    };

    fetchReservation();
  }, [id]);

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
      return;
    }

    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const response = await getTables(floorId, 'active');
        if (response.success && response.data?.tables) {
          // Filter tables by capacity >= guestCount
          const availableTables = response.data.tables.filter(
            (table) => table.capacity >= guestCount
          );
          setTables(availableTables);
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
  const handleUpdate = async () => {
    if (!id) return;

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
      setError("Time slot is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Convert time slot to 24-hour format
      const startTime = formatTimeTo24Hour(timeSlot);

      // Calculate end time (1 hour after start time)
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHours = (hours + 1) % 24;
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const updateData: UpdateReservationInput = {
        customerName,
        customerPhone: phone,
        date,
        startTime,
        endTime,
        guestCount,
        tableId: tableId || null,
        notes: notes || undefined,
      };

      const response = await updateReservation(id, updateData);

      if (response.success) {
        setOpenSuccess(true);
      } else {
        setError(response.error?.message || "Failed to update reservation");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update reservation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Edit Reservation</h1>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loadingReservation ? (
          <div className="bg-bb-bg rounded-xl border p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bb-primary mb-4"></div>
              <p className="text-gray-600">Loading reservation details...</p>
            </div>
          </div>
        ) : (
          <div className="bg-bb-bg rounded-xl border p-4 sm:p-6 space-y-6">
            {/* BASIC DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Customer Name"
                required
                value={customerId}
                onChange={handleCustomerChange}
                options={
                  loadingCustomers
                    ? [{ label: "Loading...", value: "" }]
                    : [
                        { label: "-- Select Customer --", value: "" },
                        ...customers.map((c) => ({ label: c.name, value: c.id })),
                      ]
                }
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
                value={date}
                onChange={setDate}
                type="date"
              />

              <div onClick={() => setOpenTimeSlot(true)}>
                <Input
                  label="Reservation Time Slot"
                  required
                  value={timeSlot}
                  readOnly
                />
              </div>

              <Select
                label="Floor / Area"
                value={floorId}
                onChange={setFloorId}
                options={
                  loadingFloors
                    ? [{ label: "Loading...", value: "" }]
                    : [
                        { label: "-- Select Floor --", value: "" },
                        ...floors.map((f) => ({ label: f.name, value: f.id })),
                      ]
                }
              />
            </div>

            {/* GUEST + TABLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-sm font-medium">
                  Guest Count <span className="text-red-500">*</span>
                </label>

                <div className="mt-2 inline-flex items-center rounded-full overflow-hidden border">
                  <button
                    onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                    className="px-4 py-2 bg-black text-white"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="px-6">{guestCount}</span>

                  <button
                    onClick={() => setGuestCount((g) => g + 1)}
                    className="px-4 py-2 bg-black text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <Select
                label="Table"
                value={tableId}
                onChange={setTableId}
                options={
                  loadingTables
                    ? [{ label: "Loading...", value: "" }]
                    : [
                        { label: "-- Select Table --", value: "" },
                        ...tables.map((t) => ({
                          label: `${t.tableNumber} (Capacity: ${t.capacity})`,
                          value: t.id,
                        })),
                      ]
                }
              />
            </div>

            {/* NOTES */}
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                rows={4}
                className="mt-2 w-full rounded-lg border px-4 py-3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => navigate(-1)}
                className="border border-black px-6 py-2 rounded"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || loadingReservation}
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={openSuccess}
        onClose={() => {
          setOpenSuccess(false);
          navigate("/pos/reservations");
        }}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-semibold mb-4">Details Updated</h2>

        <div className="flex justify-center mb-4">
          <img src={tickImg} alt="success" className="w-20 h-20" />
        </div>

        <p className="text-sm text-gray-600">
          Reservation details updated successfully.
        </p>

        <button
          onClick={() => {
            setOpenSuccess(false);
            navigate("/pos/reservations");
          }}
          className="mt-4 bg-bb-primary px-6 py-2 rounded font-medium"
        >
          OK
        </button>
      </Modal>

      <Modal
        open={openTimeSlot}
        onClose={() => setOpenTimeSlot(false)}
        className="w-[95%] max-w-lg p-5"
      >
        {/* HEADER */}
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Time Slots</h2>
          <p className="text-sm text-gray-500">Choose Your Reservation Slot</p>
        </div>

        {/* TIME GRID */}
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
    </DashboardLayout>
  );
};

export default EditReservation;

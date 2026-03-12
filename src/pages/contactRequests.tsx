import DashboardLayout from "../layout/DashboardLayout";
import ContactColumn from "../components/contactRequests/ContactColumn";
import CreateLeadModal from "../components/contactRequests/addContactLead";
import { useState, useMemo, useEffect } from "react";
import { getLeadsByStage, Lead } from "../services/contactService";
import { LoadingSpinner } from "../components/Common";
import { Search } from "lucide-react";

const ContactRequestsPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<{ newLeads: Lead[], initialContacted: Lead[], scheduledDemo: Lead[] }>({
    newLeads: [],
    initialContacted: [],
    scheduledDemo: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leads from API
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLeadsByStage();

      if (response.success && response.data) {
        // Map the API response stages to the UI column structure
        setContacts({
          newLeads: response.data['NewRequest'] || [],
          initialContacted: response.data['InitialContacted'] || [],
          scheduledDemo: response.data['ScheduledDemo'] || []
        });
      } else {
        setError(response.message || 'Failed to load contacts');
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts based on search query across all columns
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }

    const query = searchQuery.toLowerCase();
    const filterArray = (data: Lead[]) =>
      data.filter((lead) =>
        lead.ownerName.toLowerCase().includes(query) ||
        lead.restaurantName.toLowerCase().includes(query) ||
        (lead.inquiryType?.toLowerCase().includes(query) ?? false) ||
        (lead.description?.toLowerCase().includes(query) ?? false)
      );

    return {
      newLeads: filterArray(contacts.newLeads),
      initialContacted: filterArray(contacts.initialContacted),
      scheduledDemo: filterArray(contacts.scheduledDemo),
    };
  }, [searchQuery, contacts]);

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold">
            Contact List
          </h1>

          <div className="flex gap-3">
            <div className="relative w-full lg:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}

              className="w-full border rounded-md bg-bb-bg px-3 pr-10 py-2 text-sm"
            />
          </div>
            <button
              onClick={() => setOpenModal(true)}
              className="bg-black text-white px-4 py-2 rounded-md text-sm"
            >
              Add New
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" message="Loading contacts..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
            <button
              onClick={fetchContacts}
              className="ml-4 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Columns */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ContactColumn
              title="New Leads"
              color="bg-pink-500"
              data={filteredContacts.newLeads}
              onRefresh={fetchContacts}
            />

            <ContactColumn
              title="Initial Contacted"
              color="bg-emerald-400"
              data={filteredContacts.initialContacted}
              onRefresh={fetchContacts}
            />

            <ContactColumn
              title="Scheduled Demo"
              color="bg-blue-500"
              data={filteredContacts.scheduledDemo}
              onRefresh={fetchContacts}
            />
          </div>
        )}
      </div>
      <CreateLeadModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          fetchContacts(); // Refresh data after modal closes
        }}
      />
    </DashboardLayout>
  );
};

export default ContactRequestsPage;

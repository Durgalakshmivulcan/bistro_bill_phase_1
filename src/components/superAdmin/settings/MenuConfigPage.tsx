import { useState, useEffect, useCallback } from "react";
import {
  getAllMenuVisibility,
  updateMenuVisibility,
  MenuVisibilityItem,
} from "../../../services/menuVisibilityService";
import { sidebarItems } from "../../../data/sidebarItems";

const USER_TYPES = ["SuperAdmin", "BusinessOwner", "Staff"] as const;
type UserType = (typeof USER_TYPES)[number];

const TAB_LABELS: Record<UserType, string> = {
  SuperAdmin: "Super Admin",
  BusinessOwner: "Business Owner",
  Staff: "Staff",
};

export default function MenuConfigPage() {
  const [activeTab, setActiveTab] = useState<UserType>("SuperAdmin");
  const [config, setConfig] = useState<MenuVisibilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllMenuVisibility();
      if (response.success && response.data) {
        setConfig(response.data.items);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load menu config" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const getVisibility = (userType: string, menuKey: string): boolean => {
    const item = config.find(
      (c) => c.userType === userType && c.menuKey === menuKey
    );
    return item ? item.isVisible : false;
  };

  const toggleVisibility = (menuKey: string) => {
    setConfig((prev) => {
      const idx = prev.findIndex(
        (c) => c.userType === activeTab && c.menuKey === menuKey
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], isVisible: !updated[idx].isVisible };
        return updated;
      }
      // New entry not in config yet
      return [
        ...prev,
        {
          id: "",
          userType: activeTab,
          menuKey,
          isVisible: true,
          createdAt: "",
          updatedAt: "",
        },
      ];
    });
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Send only the items for the active tab
      const items = sidebarItems.map((si) => ({
        userType: activeTab,
        menuKey: si.key,
        isVisible: getVisibility(activeTab, si.key),
      }));

      const response = await updateMenuVisibility({ items });
      if (response.success) {
        setMessage({
          type: "success",
          text: `Menu visibility for ${TAB_LABELS[activeTab]} saved successfully`,
        });
        await fetchConfig();
      } else {
        setMessage({
          type: "error",
          text: response.error?.message || "Failed to save",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save menu config" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bb-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-bb-text">
          Menu Visibility Configuration
        </h2>
        <p className="text-sm text-bb-textSoft mt-1">
          Control which sidebar menu items are visible for each user type.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {USER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => {
              setActiveTab(type);
              setMessage(null);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === type
                ? "bg-bb-primary text-bb-text shadow-sm"
                : "text-bb-textSoft hover:text-bb-text"
            }`}
          >
            {TAB_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Menu items table */}
      <div className="bg-white rounded-xl shadow-bb-card border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-sm font-medium text-bb-textSoft">
                Menu Item
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-bb-textSoft">
                Path
              </th>
              <th className="text-center px-6 py-3 text-sm font-medium text-bb-textSoft">
                Visible
              </th>
            </tr>
          </thead>
          <tbody>
            {sidebarItems.map((item) => {
              const isVisible = getVisibility(activeTab, item.key);
              return (
                <tr
                  key={item.key}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {item.imgSrc ? (
                        <img
                          src={item.imgSrc}
                          alt={item.name}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        item.icon && (
                          <i
                            className={`bi ${item.icon} text-bb-textSoft`}
                          />
                        )
                      )}
                      <span className="text-sm text-bb-text font-medium">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <code className="text-xs text-bb-textSoft bg-gray-100 px-2 py-1 rounded">
                      {item.path}
                    </code>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleVisibility(item.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isVisible ? "bg-bb-primary" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          isVisible ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-bb-primary hover:bg-bb-primary/90 text-bb-text px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

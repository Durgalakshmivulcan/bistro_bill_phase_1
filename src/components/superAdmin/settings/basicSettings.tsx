// src/pages/Settings/BasicSettings.tsx
import { useState } from "react";
import Select from "../../../components/form/Select";
import FileUploadInput from "../../../components/form/fileUploadInput";
import { CRUDToasts } from "../../../utils/toast";

export default function BasicSettings() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Stub: no backend endpoint yet — just show success
      await new Promise((resolve) => setTimeout(resolve, 500));
      CRUDToasts.updated("Basic Settings");
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* LEFT FORM */}
      <div className="space-y-6 max-w-md">
        <FileUploadInput
          label="Logo"
          required
          placeholder={logoFile ? logoFile.name : "Upload Logo"}
          onChange={setLogoFile}
        />
        <FileUploadInput
          label="Favicon"
          required
          placeholder={faviconFile ? faviconFile.name : "Upload Favicon"}
          onChange={setFaviconFile}
        />

        <Select
          label="Language"
          required
          value={language}
          onChange={setLanguage}
          options={[
            { label: "English", value: "en" },
            { label: "Hindi", value: "hi" },
          ]}
        />
      </div>

      {/* RIGHT PREVIEW */}
      <div className="flex flex-col items-start gap-10">
        <img
          src={logoFile ? URL.createObjectURL(logoFile) : "/logo.png"}
          alt="logo"
          className="w-28"
        />
        <img
          src={faviconFile ? URL.createObjectURL(faviconFile) : "/favicon.png"}
          alt="favicon"
          className="w-16"
        />
      </div>

      {/* ACTION */}
      <div className="col-span-full flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

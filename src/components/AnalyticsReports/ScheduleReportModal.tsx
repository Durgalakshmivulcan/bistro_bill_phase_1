import { useState } from 'react';
import type { ScheduleConfig } from '../../services/customReportService';

interface ScheduleReportModalProps {
  reportName: string;
  existingSchedule: ScheduleConfig | null;
  onSave: (schedule: ScheduleConfig) => void;
  onRemove: () => void;
  onClose: () => void;
  saving?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const ScheduleReportModal = ({
  reportName,
  existingSchedule,
  onSave,
  onRemove,
  onClose,
  saving = false,
}: ScheduleReportModalProps) => {
  const [frequency, setFrequency] = useState<ScheduleConfig['frequency']>(
    existingSchedule?.frequency || 'Weekly'
  );
  const [time, setTime] = useState(existingSchedule?.time || '08:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(existingSchedule?.dayOfWeek ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(existingSchedule?.dayOfMonth ?? 1);
  const [emailsInput, setEmailsInput] = useState(
    existingSchedule?.emails.join(', ') || ''
  );
  const [format, setFormat] = useState<ScheduleConfig['format']>(
    existingSchedule?.format || 'CSV'
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = () => {
    setValidationError(null);

    // Parse and validate emails
    const emails = emailsInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emails.length === 0) {
      setValidationError('At least one email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      setValidationError(`Invalid email(s): ${invalidEmails.join(', ')}`);
      return;
    }

    const schedule: ScheduleConfig = {
      frequency,
      time,
      emails,
      format,
    };

    if (frequency === 'Weekly') {
      schedule.dayOfWeek = dayOfWeek;
    }
    if (frequency === 'Monthly') {
      schedule.dayOfMonth = dayOfMonth;
    }

    onSave(schedule);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-1">Schedule Email Delivery</h3>
        <p className="text-sm text-bb-textSoft mb-4">
          Schedule automated email delivery for <span className="font-medium text-bb-text">{reportName}</span>.
        </p>

        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-4">
            <p className="text-xs text-red-700">{validationError}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Frequency */}
          <div>
            <label className="block text-xs font-medium text-bb-textSoft mb-1.5">Frequency</label>
            <div className="flex gap-2">
              {(['Daily', 'Weekly', 'Monthly'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    frequency === f
                      ? 'bg-bb-primary text-bb-text'
                      : 'bg-gray-100 text-bb-textSoft hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-medium text-bb-textSoft mb-1.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
            />
          </div>

          {/* Day of Week (Weekly) */}
          {frequency === 'Weekly' && (
            <div>
              <label className="block text-xs font-medium text-bb-textSoft mb-1.5">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Day of Month (Monthly) */}
          {frequency === 'Monthly' && (
            <div>
              <label className="block text-xs font-medium text-bb-textSoft mb-1.5">Day of Month</label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Email Recipients */}
          <div>
            <label className="block text-xs font-medium text-bb-textSoft mb-1.5">
              Email Recipients
            </label>
            <textarea
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
            />
            <p className="text-xs text-bb-textSoft mt-1">Separate multiple emails with commas.</p>
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs font-medium text-bb-textSoft mb-1.5">Export Format</label>
            <div className="flex gap-2">
              {(['CSV', 'PDF', 'Both'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    format === f
                      ? 'bg-bb-primary text-bb-text'
                      : 'bg-gray-100 text-bb-textSoft hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {existingSchedule && (
            <button
              onClick={onRemove}
              disabled={saving}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-bb-text hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : existingSchedule ? 'Update Schedule' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleReportModal;

// src/components/Dashboard/EarningsChart.tsx

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import Select from "../form/Select";
import { Calendar } from "lucide-react";

interface EarningsChartProps {
    data: {
        labels: string[];
        earnings: number[];
        users: number[];
    };
    selectedYear?: string;
    onYearChange?: (year: string) => void;
}

export default function EarningsChart({ data, selectedYear, onYearChange }: EarningsChartProps) {
    const currentYear = new Date().getFullYear();
    const yearOptions = [
        { label: "Filter by Year", value: "" },
        ...Array.from({ length: 5 }, (_, i) => {
            const y = String(currentYear - i);
            return { label: y, value: y };
        }),
    ];

    const chartData = data.labels.map((label: string, i: number) => ({
        month: label,
        earnings: data.earnings[i],
        users: data.users[i],
    }));

    return (
        <div className="bg-bb-bg border rounded-xl p-6">
            <div className="flex justify-between mb-4">
                <h3 className="font-semibold">Earnings & Registrations</h3>
                <div className="w-[180px]">
  <div className="flex items-center gap-2 border border-bb-coloredborder bg-white px-3 py-2 rounded-md text-sm">
    <Calendar size={16} className="text-bb-textSoft" />

    <Select
      value={selectedYear || ""}
      onChange={onYearChange}
      options={yearOptions}
      className="border-0 p-0 mt-0 bg-transparent"
      containerClassName="w-full"
    />
  </div>
</div>

            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="earnings" fill="#FDC836" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

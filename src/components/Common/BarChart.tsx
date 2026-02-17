import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Props = {
  labels: string[];
  values: number[];
  max?: number;
};

export default function FeedbackBarChart({
  labels,
  values,
  max = 100,
}: Props) {
  return (
    <div className="h-56">
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: "#FDC836",
              borderRadius: 6,
              barThickness: 32,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { size: 12 },
              },
            },
            y: {
              min: 0,
              max,
              ticks: {
                stepSize: 25,
                font: { size: 11 },
              },
              grid: {
                color: "#E5E7EB",
              },
            },
          },
        }}
      />
    </div>
  );
}

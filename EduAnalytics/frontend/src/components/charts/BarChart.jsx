import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BarChart({ data, options, title }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#E0E7FF' }
      },
      title: {
        display: !!title,
        text: title,
        color: '#FFFFFF',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#A5B4FC' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#A5B4FC' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        min: 0,
        max: 60
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Bar data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}

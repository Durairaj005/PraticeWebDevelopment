import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ChartDataLabels);

export default function LineChart({ data, options, title }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#E0E7FF', font: { size: 13, weight: '600' } }
      },
      title: {
        display: !!title,
        text: title,
        color: '#FFFFFF',
        font: { size: 16, weight: 'bold' }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: { color: '#A5B4FC', font: { size: 12 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#A5B4FC', font: { size: 12 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        min: 0,
        max: 100
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Line data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}

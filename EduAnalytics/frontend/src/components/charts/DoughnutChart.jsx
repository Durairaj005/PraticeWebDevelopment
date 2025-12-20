import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DoughnutChart({ data, options, title }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          color: '#E0E7FF',
          padding: 15,
          font: { size: 12 }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: '#FFFFFF',
        font: { size: 16, weight: 'bold' }
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Doughnut data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}

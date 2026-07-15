import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RadarChart({ data, options, title }) {
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
      r: {
        ticks: { 
          color: '#A5B4FC',
          backdropColor: 'transparent'
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#E0E7FF' }
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Radar data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}

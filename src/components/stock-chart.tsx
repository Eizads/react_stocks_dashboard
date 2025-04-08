"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js"
import { Line } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface StockChartProps {
  data: {
    labels: string[]
    values: number[]
  }
  title?: string
}

export function StockChart({ data, title = "Stock Price" }: StockChartProps) {
  const chartData: ChartData<"line"> = {
    labels: data.labels,
    datasets: [
      {
        label: "Price",
        data: data.values,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  }

  return (
    <div className="h-[400px] w-full">
      <Line data={chartData} options={options} />
    </div>
  )
} 
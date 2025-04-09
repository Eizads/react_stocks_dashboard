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
  TimeScale,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { useEffect, useRef } from "react"
import 'chartjs-adapter-date-fns'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

interface StockChartProps {
  data: {
    labels: string[]
    values: number[]
  }
  livePrice?: number | null
  title?: string
}

export function StockChart({ data, livePrice, title = "Stock Price" }: StockChartProps) {
  console.log('Chart received data:', data)
  
  const chartRef = useRef<ChartJS<"line">>(null)

  useEffect(() => {
    if (livePrice && chartRef.current) {
      const chart = chartRef.current
      const lastIndex = chart.data.datasets[0].data.length - 1
      chart.data.datasets[0].data[lastIndex] = livePrice
      chart.update()
    }
  }, [livePrice])

  // Add error handling for missing data
  if (!data?.labels?.length || !data?.values?.length) {
    console.log('No data available for chart')
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const chartData: ChartData<"line"> = {
    labels: data.labels.map(label => {
      const date = new Date(label)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }),
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

  console.log('Processed chart data:', chartData)

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
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
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `$${value.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        type: 'category',
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: (value) => `$${value}`
        }
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  }

  return (
    <div className="h-[400px] w-full">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  )
} 
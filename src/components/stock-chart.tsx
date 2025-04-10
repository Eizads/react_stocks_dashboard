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
    values: (number | null)[]
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
      const now = new Date()
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      
      console.log('Live update:', {
        currentTime,
        livePrice,
        availableLabels: chart.data.labels?.slice(0, 5)
      })

      // Find the index in our fixed time points array that matches the current time
      const timeIndex = chart.data.labels?.findIndex((value: unknown) => {
        const label = value as string
        return label === currentTime
      })

      console.log('Found time index:', timeIndex)

      // If we found a matching time slot, update the price
      if (timeIndex !== -1 && timeIndex !== undefined && chart.data.datasets[0].data) {
        console.log('Updating price at index:', timeIndex, 'with value:', livePrice)
        // Ensure we're working with numbers
        const data = chart.data.datasets[0].data as number[]
        data[timeIndex] = Number(livePrice)
        
        // Clear all prices after the current time point
        for (let i = timeIndex + 1; i < data.length; i++) {
          data[i] = NaN
        }
        
        chart.update('none') // Use 'none' to prevent animation
      } else {
        console.log('No matching time slot found for current time')
      }
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
        data: data.values.map((value, index) => {
          // If the value is null, it means it's past the last timestamp
          if (value === null) {
            return NaN
          }
          
          // Find the last non-null value index
          const lastValidIndex = data.values.findLastIndex(v => v !== null)
          
          // If we're past the last valid index, return NaN
          if (index > lastValidIndex) {
            return NaN
          }
          
          return Number(value)
        }),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        spanGaps: true
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
            return !isNaN(value) ? `$${value.toFixed(2)}` : 'No data'
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
          maxTicksLimit: 6,
          callback: (value) => {
            const date = new Date(data.labels[value as number])
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        }
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
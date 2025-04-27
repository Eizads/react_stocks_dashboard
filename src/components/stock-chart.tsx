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
import annotationPlugin from 'chartjs-plugin-annotation'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  annotationPlugin
)

interface StockChartProps {
  data: {
    labels: string[]
    values: (number | null)[]
  }
  livePrice?: number | null
  title?: string
  previousClose: number
}

export function StockChart({ data, livePrice, title = "Stock Price", previousClose }: StockChartProps) {
  console.log('Chart received data:', data)
  // This is the number of labels to add to the chart to extend the chart to the right
  let extraLabels = 20
  if (window.innerWidth < 900) {
    extraLabels = 60
  }

  
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
        
        // Update the current time slot with live price
        data[timeIndex] = Number(livePrice)
        
        // For any null or undefined values before current time, use the last known price
        let lastKnownPrice = Number(livePrice)
        for (let i = timeIndex - 1; i >= 0; i--) {
          if (isNaN(data[i])) {
            data[i] = lastKnownPrice
          } else {
            lastKnownPrice = data[i]
          }
        }
        
        chart.update('none') // Use 'none' to prevent animation
      } else {
        console.log('No matching time slot found for current time')
      }
    }
  }, [livePrice])

  // useEffect(() => {
  //   const handleResize = () => {
  //     if (chartRef.current) {
  //       chartRef.current.resize()
  //       const chart = chartRef.current
  //       if (chart.options.scales && chart.options.scales.x && chart.options.scales.x.ticks) {
  //         chart.options.scales.x.ticks.maxTicksLimit = window.innerWidth < 1024 ? 4 : 8
  //         chart.update()
  //       }
  //     }
  //   }

  //   window.addEventListener('resize', handleResize)
  //   handleResize() // Initial call to set the correct ticks

  //   return () => {
  //     window.removeEventListener('resize', handleResize)
  //   }
  // }, [])

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
    labels: [
      ...data.labels.map(label => {
        const date = new Date(label)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }),
      // Add empty labels for the extension
      ...Array(extraLabels).fill('')
    ],
    datasets: [
      {
        label: "Price",
        data: [
          ...data.values.map((value, index) => {
            if (value === null) {
              // Find the last valid value before this point
              const previousValues = data.values.slice(0, index)
              const lastValidValue = previousValues.reverse().find(v => v !== null)
              return lastValidValue !== undefined ? Number(lastValidValue) : NaN
            }
            return Number(value)
          }),
          // Add null values for the extension
          ...Array(extraLabels).fill(null)
        ],
        borderColor: livePrice !== undefined && livePrice !== null 
          ? ((data.values?.[data.values.length - 1] ?? 0) >= previousClose ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)")
          : "rgb(156, 163, 175)", // gray color for historical data
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        spanGaps: true
      }
    ],
  }

  console.log('Processed chart data:', chartData)

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    layout: {
      padding: {
        right: 10,
        top: 60,
        bottom: 10,
        left: 10
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: "bold",
        },
        padding: {
          bottom: 10
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return !isNaN(value) ? `$${value.toFixed(2)}` : 'No data'
          }
        }
      },
      annotation: {
        common: {
          drawTime: 'beforeDatasetsDraw'
        },
        annotations: {
          previousCloseLine: {
            type: 'line',
            yMin: previousClose,
            yMax: previousClose,
            xMin: 0,
            xMax: data.labels.length + extraLabels,
            borderColor: 'rgb(156, 163, 175)',
            borderDash: [5, 5],
            borderWidth: 1,
            label: {
              display: true,
              content: ['Previous','Close', `${previousClose.toFixed(2)}`],
              position: 'end',
              backgroundColor: 'white',
              color: 'rgb(156, 163, 175)',
              font: {
                size: 10
              },
              textAlign: 'left',
              xAdjust: 0,
              yAdjust: 0,
              padding: {
                left: 0,
                top: 0,
                bottom: 0,
                right: 0
              },
              z: 1000
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        offset: true,
        type: 'category',
        ticks: {
          maxRotation: 0,
          autoSkip: false,
          maxTicksLimit: 4,
          callback: (value) => {
            // Only show specific time labels
            const specificTimes = ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'];
            const date = new Date(data.labels[value as number]);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true});
            // console.log('Time string:', timeString)
            return specificTimes.includes(timeString) ? timeString : '';
          }
        },
        min: 0,
        max: data.labels.length + extraLabels
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: (value) => value
        },
        position: 'left',
        beginAtZero: false,
        suggestedMin: Math.min(previousClose * 0.995, ...data.values.filter(v => v !== null) as number[]),
        suggestedMax: Math.max(previousClose * 1.005, ...data.values.filter(v => v !== null) as number[]),
        grace: '10%'
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  }

  return (

    <div className="h-[400px] overflow-hidden relative">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
    
  )
} 
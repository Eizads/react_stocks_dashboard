/**
 * Market hours in Eastern Time (ET)
 * Regular trading hours: 9:30 AM - 4:00 PM ET
 * Pre-market: 4:00 AM - 9:30 AM ET
 * After-hours: 4:00 PM - 8:00 PM ET
 */

const MARKET_OPEN_HOUR = 9
const MARKET_OPEN_MINUTE = 30
const MARKET_CLOSE_HOUR = 16
const MARKET_CLOSE_MINUTE = 0

export function isMarketOpen(): boolean {
  const now = new Date()
  const etTime = convertToET(now)
  
  // Check if it's a weekday (1-5 = Monday-Friday)
  const isWeekday = etTime.getDay() >= 1 && etTime.getDay() <= 5
  
  if (!isWeekday) return false

  const currentHour = etTime.getHours()
  const currentMinute = etTime.getMinutes()

  // Check if current time is within market hours
  if (currentHour < MARKET_OPEN_HOUR) return false
  if (currentHour === MARKET_OPEN_HOUR && currentMinute < MARKET_OPEN_MINUTE) return false
  if (currentHour > MARKET_CLOSE_HOUR) return false
  if (currentHour === MARKET_CLOSE_HOUR && currentMinute >= MARKET_CLOSE_MINUTE) return false

  return true
}

export function isWeekend(): boolean {
  const now = new Date()
  const etTime = convertToET(now)
  return etTime.getDay() === 0 || etTime.getDay() === 6
}

export function getNextMarketOpen(): Date {
  const now = new Date()
  const etTime = convertToET(now)
  
  // If it's a weekday and before market open, return today's market open
  if (isWeekday(etTime) && isBeforeMarketOpen(etTime)) {
    return setMarketOpenTime(etTime)
  }

  // Otherwise, find the next weekday
  const nextOpen = new Date(etTime)
  do {
    nextOpen.setDate(nextOpen.getDate() + 1)
  } while (!isWeekday(nextOpen))

  return setMarketOpenTime(nextOpen)
}

function isWeekday(date: Date): boolean {
  return date.getDay() >= 1 && date.getDay() <= 5
}

function isBeforeMarketOpen(date: Date): boolean {
  return (
    date.getHours() < MARKET_OPEN_HOUR ||
    (date.getHours() === MARKET_OPEN_HOUR && date.getMinutes() < MARKET_OPEN_MINUTE)
  )
}

function setMarketOpenTime(date: Date): Date {
  const marketOpen = new Date(date)
  marketOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0)
  return marketOpen
}

function convertToET(date: Date): Date {
  const options = { timeZone: 'America/New_York' }
  const etTimeString = date.toLocaleString('en-US', options)
  return new Date(etTimeString)
} 
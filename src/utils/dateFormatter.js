import dayjs from 'dayjs'
import jalaliday from 'jalaliday'
import DatabaseService from '../services/DatabaseService'

// Extend dayjs with jalaliday
dayjs.extend(jalaliday)

let cachedDateFormat = null

/**
 * Get the current date format setting from database
 */
export async function getDateFormat() {
  if (!cachedDateFormat) {
    try {
      const format = await DatabaseService.getSetting('dateFormat')
      cachedDateFormat = format || 'Shamsi'
    } catch (error) {
      console.error('Error loading date format:', error)
      cachedDateFormat = 'Shamsi'
    }
  }
  return cachedDateFormat
}

/**
 * Update the cached date format (call this when user changes setting)
 */
export function updateDateFormat(newFormat) {
  cachedDateFormat = newFormat
}

/**
 * Format a date based on the selected format
 * @param {string|Date|dayjs.Dayjs} date - The date to format
 * @param {string} format - Optional format string (default: 'YYYY-MM-DD')
 * @returns {string} - Formatted date string
 */
export async function formatDate(date, format = 'YYYY-MM-DD') {
  const dateFormat = await getDateFormat()
  const dayjsDate = dayjs(date)

  if (dateFormat === 'Shamsi') {
    // Format as Shamsi (Jalali)
    return dayjsDate.calendar('jalali').format(format)
  } else {
    // Format as Miladi (Gregorian)
    return dayjsDate.calendar('gregorian').format(format)
  }
}

/**
 * Format date for display (with time)
 * @param {string|Date|dayjs.Dayjs} date - The date to format
 * @returns {string} - Formatted date string with time
 */
export async function formatDateWithTime(date, timeFormat = 'HH:mm') {
  const dateFormat = await getDateFormat()
  const dayjsDate = dayjs(date)

  if (dateFormat === 'Shamsi') {
    return dayjsDate.calendar('jalali').format(`YYYY-MM-DD ${timeFormat}`)
  } else {
    return dayjsDate.calendar('gregorian').format(`YYYY-MM-DD ${timeFormat}`)
  }
}

/**
 * Get current date in the selected format
 * @returns {string} - Current date as string
 */
export async function getCurrentDate() {
  return formatDate(dayjs())
}

/**
 * Parse a date string and return it as the selected calendar type
 * @param {string} dateString - The date string to parse
 * @returns {dayjs.Dayjs} - Dayjs object
 */
export function parseDate(dateString) {
  return dayjs(dateString)
}

/**
 * Check if a date is in Shamsi format
 * @returns {boolean}
 */
export async function isShamsi() {
  const format = await getDateFormat()
  return format === 'Shamsi'
}

/**
 * Check if a date is in Miladi format
 * @returns {boolean}
 */
export async function isMiladi() {
  const format = await getDateFormat()
  return format === 'Miladi'
}

export default {
  getDateFormat,
  updateDateFormat,
  formatDate,
  formatDateWithTime,
  getCurrentDate,
  parseDate,
  isShamsi,
  isMiladi
}

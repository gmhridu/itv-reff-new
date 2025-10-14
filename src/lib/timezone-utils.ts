/**
 * Timezone Utilities
 * 
 * Provides timezone-aware date calculations and conversions.
 * Uses environment variables for timezone configuration to allow for future control.
 */

/**
 * Get the timezone offset from environment variables or use default
 * @returns The timezone offset in hours (e.g., 5 for UTC+5)
 */
export function getTimezoneOffset(): number {
  // Default to Asia/Karachi timezone (UTC+5)
  const defaultOffset = 5;
  
  // Check for environment variable
  const envOffset = process.env.TIMEZONE_OFFSET;
  
  if (envOffset) {
    const parsedOffset = parseFloat(envOffset);
    if (!isNaN(parsedOffset)) {
      return parsedOffset;
    }
  }
  
  return defaultOffset;
}

/**
 * Get the timezone identifier from environment variables or use default
 * @returns The timezone identifier (e.g., 'Asia/Karachi')
 */
export function getTimezoneIdentifier(): string {
  // Default to Asia/Karachi
  const defaultTimezone = 'Asia/Karachi';
  
  // Check for environment variable
  const envTimezone = process.env.TIMEZONE_IDENTIFIER;
  
  if (envTimezone) {
    return envTimezone;
  }
  
  return defaultTimezone;
}

/**
 * Convert a date to the configured timezone
 * @param date - The date to convert
 * @returns The date in the configured timezone
 */
export function toDateInTimezone(date: Date = new Date()): Date {
  const offset = getTimezoneOffset();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * offset));
}

/**
 * Get the start of the day in the configured timezone
 * @param date - The date to calculate from (defaults to current date)
 * @returns The start of the day (00:00:00) in the configured timezone
 */
export function getStartOfDayInTimezone(date: Date = new Date()): Date {
  const timezoneDate = toDateInTimezone(date);
  return new Date(timezoneDate.getFullYear(), timezoneDate.getMonth(), timezoneDate.getDate());
}

/**
 * Convert a date in the configured timezone to UTC
 * @param date - The date in the configured timezone
 * @returns The date in UTC
 */
export function toUTCFromDateInTimezone(date: Date): Date {
  const offset = getTimezoneOffset();
  return new Date(date.getTime() - (offset * 3600000));
}

/**
 * Format a date according to the configured timezone
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatInTimezone(date: Date = new Date(), options?: Intl.DateTimeFormatOptions): string {
  const timezone = getTimezoneIdentifier();
  
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    ...options
  }).format(date);
}

/**
 * Get current time in the configured timezone
 * @returns Current time in the configured timezone
 */
export function getCurrentTimeInTimezone(): Date {
  return toDateInTimezone(new Date());
}
/**
 * Parse various date/time formats and normalize to database format: YYYY-MM-DD HH:mm:ss.SSS
 * Supports:
 * - ISO dates: 2019-01-07, 2019-01-07T11:00:00
 * - US dates: 01/07/2019, 1/7/2019, 01-07-2019
 * - European dates: 07/01/2019, 7/1/2019, 07-01-2019
 * - Written dates: January 7, 2019, Jan 7 2019, 7 Jan 2019, 7th January 2019
 * - Time formats: 11:00, 11:00 AM, 11:00:00, 11:00:00.900
 * - Combined: January 7, 2019 11:00 AM
 */

/**
 * Normalize a date/time string to database format or return searchable pattern
 * @param {string} input - The date/time string to parse
 * @returns {string|null} - Normalized date string in format YYYY-MM-DD or YYYY-MM-DD HH:mm:ss.SSS, or null if invalid
 */
export function normalizeDateTime(input) {
  if (!input || typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // If already in database format, return as-is
  if (/^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}(:\d{2}(\.\d{3})?)?)?$/.test(trimmed)) {
    return trimmed;
  }

  // Try to parse with JavaScript Date object (handles many formats)
  let date = null;

  // Try direct Date parsing first (handles most written formats like "January 7, 2019")
  const parsedDate = new Date(trimmed);
  if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900) {
    // Valid date and reasonable year
    date = parsedDate;
  } else {
    // Try common format variations
    const formats = [
      // US format: MM/DD/YYYY or M/D/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(\s+(\d{1,2}):(\d{2})(:(\d{2})(\.(\d{3}))?)?(\s*(AM|PM))?)?$/i,
      // European format: DD/MM/YYYY or D/M/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(\s+(\d{1,2}):(\d{2})(:(\d{2})(\.(\d{3}))?)?(\s*(AM|PM))?)?$/i,
      // ISO-like: YYYY-MM-DD or YYYY/MM/DD
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(\s+(\d{1,2}):(\d{2})(:(\d{2})(\.(\d{3}))?)?(\s*(AM|PM))?)?$/i,
      // DD-MM-YYYY or D-M-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})(\s+(\d{1,2}):(\d{2})(:(\d{2})(\.(\d{3}))?)?(\s*(AM|PM))?)?$/i,
    ];

    for (const format of formats) {
      const match = trimmed.match(format);
      if (match) {
        let year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0;

        if (format === formats[0]) {
          // US format: MM/DD/YYYY
          month = parseInt(match[1], 10) - 1;
          day = parseInt(match[2], 10);
          year = parseInt(match[3], 10);
          if (match[5]) {
            hour = parseInt(match[5], 10);
            minute = parseInt(match[6], 10);
            if (match[8]) second = parseInt(match[8], 10);
            if (match[10]) millisecond = parseInt(match[10], 10);
            if (match[12] && match[12].toUpperCase() === "PM" && hour < 12) hour += 12;
            if (match[12] && match[12].toUpperCase() === "AM" && hour === 12) hour = 0;
          }
        } else if (format === formats[1]) {
          // Try European format: DD/MM/YYYY (ambiguous, try both)
          const month1 = parseInt(match[1], 10);
          const day1 = parseInt(match[2], 10);
          const year1 = parseInt(match[3], 10);
          
          // If first part > 12, it's likely DD/MM/YYYY
          if (month1 > 12) {
            day = month1;
            month = day1 - 1;
            year = year1;
          } else if (day1 > 12) {
            // If second part > 12, it's likely MM/DD/YYYY
            month = month1 - 1;
            day = day1;
            year = year1;
          } else {
            // Ambiguous - default to MM/DD/YYYY (US format)
            month = month1 - 1;
            day = day1;
            year = year1;
          }
          
          if (match[5]) {
            hour = parseInt(match[5], 10);
            minute = parseInt(match[6], 10);
            if (match[8]) second = parseInt(match[8], 10);
            if (match[10]) millisecond = parseInt(match[10], 10);
            if (match[12] && match[12].toUpperCase() === "PM" && hour < 12) hour += 12;
            if (match[12] && match[12].toUpperCase() === "AM" && hour === 12) hour = 0;
          }
        } else if (format === formats[2]) {
          // ISO-like: YYYY-MM-DD
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1;
          day = parseInt(match[3], 10);
          if (match[5]) {
            hour = parseInt(match[5], 10);
            minute = parseInt(match[6], 10);
            if (match[8]) second = parseInt(match[8], 10);
            if (match[10]) millisecond = parseInt(match[10], 10);
            if (match[12] && match[12].toUpperCase() === "PM" && hour < 12) hour += 12;
            if (match[12] && match[12].toUpperCase() === "AM" && hour === 12) hour = 0;
          }
        } else if (format === formats[3]) {
          // DD-MM-YYYY
          const day1 = parseInt(match[1], 10);
          const month1 = parseInt(match[2], 10);
          const year1 = parseInt(match[3], 10);
          
          if (day1 > 12) {
            day = day1;
            month = month1 - 1;
            year = year1;
          } else {
            // Ambiguous - try DD-MM-YYYY first
            day = day1;
            month = month1 - 1;
            year = year1;
          }
          
          if (match[5]) {
            hour = parseInt(match[5], 10);
            minute = parseInt(match[6], 10);
            if (match[8]) second = parseInt(match[8], 10);
            if (match[10]) millisecond = parseInt(match[10], 10);
            if (match[12] && match[12].toUpperCase() === "PM" && hour < 12) hour += 12;
            if (match[12] && match[12].toUpperCase() === "AM" && hour === 12) hour = 0;
          }
        }

        date = new Date(year, month, day, hour, minute, second, millisecond);
        if (!isNaN(date.getTime())) {
          break;
        }
      }
    }

    // If still no date, try Date.parse with common written formats
    if (!date || isNaN(date.getTime())) {
      const writtenDate = new Date(trimmed);
      if (!isNaN(writtenDate.getTime())) {
        date = writtenDate;
      }
    }
  }

  if (!date || isNaN(date.getTime())) {
    // If we can't parse it, return the original string for contains() search
    return trimmed;
  }

  // Format to database format: YYYY-MM-DD HH:mm:ss.SSS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  // Check if time component was provided in input
  const hasTime = /(\d{1,2}):(\d{2})/.test(trimmed);
  
  if (hasTime) {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  } else {
    // Date only - return YYYY-MM-DD format
    return `${year}-${month}-${day}`;
  }
}

/**
 * Extract search pattern from date/time input
 * Returns a pattern that can be used with contains() or begins_with()
 */
export function getDateTimeSearchPattern(input) {
  const normalized = normalizeDateTime(input);
  if (!normalized) {
    return input; // Return original if can't normalize
  }

  // If normalized to date only (YYYY-MM-DD), return it for begins_with()
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  // If normalized to full datetime, return it for contains()
  return normalized;
}


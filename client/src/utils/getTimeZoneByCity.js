import cityTimezones from 'city-timezones';

/**
 * 根據城市名稱回傳對應的 IANA 時區（如 "Asia/Taipei"）
 * @param city 城市名稱（英文，例如 "Taipei"）
 */
export function getTimeZoneByCity(city){
  if (!city) return 'UTC';

  const matches = cityTimezones.lookupViaCity(city);

  if (matches.length > 0) {
    const exactMatch = matches.find(item => item.city.toLowerCase() === city.toLowerCase());
    return exactMatch?.timezone || matches[0].timezone;
  }

  return 'UTC'; 
}

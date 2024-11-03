const API_URL = 'https://api.open-meteo.com/v1/forecast';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @typedef {Object} Forecast
 * @property {string} time
 * @property {number} temperature
 * @property {number} precipitation
 */

/**
 * Tekur við gögnum frá Open Meteo og skilar fylki af spám í formi Forecast.
 * @param {unknown} data Gögn frá Open Meteo.
 * @returns {Array<Forecast>}
 */
function parseResponse(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    !('hourly' in data) ||
    !data.hourly
  ) {
    throw new Error('Veður gögn ekki á réttu formi');
  }

  const { hourly } = data;

  if (
    !hourly ||
    typeof hourly !== 'object' ||
    !('time' in hourly) ||
    !('temperature_2m' in hourly) ||
    !('precipitation' in hourly) ||
    !Array.isArray(hourly.time) ||
    !Array.isArray(hourly.temperature_2m) ||
    !Array.isArray(hourly.precipitation)
  ) {
    throw new Error('Veður spá ekki á réttu formi');
  }

  const { time, temperature_2m, precipitation } = hourly;

  /** @type Array<Forecast> */
  const forecast = [];

  for (let i = 0; i < time.length; i++) {
    const datetime = new Date(time[i]);
    const hours = datetime.getHours();

    const t = `${hours.toString().padStart(2, '0')}:00`;
    const temp = temperature_2m[i];
    const precip = precipitation[i];

    forecast.push({
      time: t,
      temperature: temp,
      precipitation: precip,
    });
  }

  return forecast;
}

/**
 * Framkvæmir leit að veðurspám fyrir gefna staðsetningu.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Array<Forecast>>} Fylki af spám fyrir staðsetningu.
 */
export async function weatherSearch(lat, lng) {
  // Querystring sem við viljum senda með leit
  // latitude={lat}&longitude={lng}}&hourly=temperature_2m,precipitation&timezone=GMT&forecast_days=1

  const qs = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'temperature_2m,precipitation',
    timezone: 'GMT',
    forecast_days: '1',
  });
  const url = new URL(API_URL);
  url.search = qs.toString();

  await sleep(1000);

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.error('Error fetching weather', error);
    throw new Error('Villa við að sækja veður');
  }

  if (!response.ok) {
    throw new Error('Gat ekki sótt veður');
  }

  /** @type unknown */
  const data = await response.json();

  return parseResponse(data);
}

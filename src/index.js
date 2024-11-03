import { el, empty } from './lib/elements.js';
import { weatherSearch } from './lib/weather.js';

/**
 * @typedef {Object} SearchLocation
 * @property {string} title
 * @property {number} lat
 * @property {number} lng
 */

/**
 * Allar staðsetning sem hægt er að fá veður fyrir.
 * @type Array<SearchLocation>
 */
const locations = [
  {
    title: 'Reykjavík',
    lat: 64.1355,
    lng: -21.8954,
  },
  {
    title: 'Akureyri',
    lat: 65.6835,
    lng: -18.0878,
  },
  {
    title: 'New York',
    lat: 40.7128,
    lng: -74.006,
  },
  {
    title: 'Tokyo',
    lat: 35.6764,
    lng: 139.65,
  },
  {
    title: 'Sydney',
    lat: 33.8688,
    lng: 151.2093,
  },
];

/**
 * Hreinsar fyrri niðurstöður, passar að niðurstöður séu birtar og birtir element.
 * @param {Element} element
 * @returns
 */
function renderIntoResultsContent(element) {
  const resultsElement = document.querySelector('.results');

  if (!resultsElement) {
    console.error('results element not found');
    return;
  }

  resultsElement.classList.remove('hidden');

  const resultsContent = resultsElement.querySelector('.results__content');

  if (!resultsContent) {
    console.error('results content element not found');
    return;
  }
  empty(resultsContent);

  resultsContent.appendChild(element);
}

/**
 * Birtir niðurstöður í viðmóti.
 * @param {SearchLocation} location
 * @param {Array<import('./lib/weather.js').Forecast>} results
 */
function renderResults(location, results) {
  const locationElement = el(
    'div',
    { class: 'location' },
    el('h3', { class: 'location__title' }, location.title),
    el(
      'p',
      { class: 'location__description' },
      `Spá fyrir daginn á breiddargráðu ${location.lat} og lengdargráðu ${location.lng}.`,
    ),
  );

  const forecastRows = results.map((result) =>
    el(
      'tr',
      { class: 'forecast__row' },
      el('td', {}, result.time),
      el('td', {}, result.temperature.toString()),
      el('td', {}, result.precipitation.toString()),
    ),
  );
  const forecastTable = el(
    'table',
    { class: 'forecast' },
    el(
      'thead',
      { class: 'forecast__header' },
      el(
        'tr',
        {},
        el('th', {}, 'Klukkutími'),
        el('th', {}, 'Hiti (°C)'),
        el('th', {}, 'Úrkoma (mm)'),
      ),
    ),
    el('tbody', { class: 'forecast__body' }, ...forecastRows),
  );

  renderIntoResultsContent(
    el('div', { class: 'results' }, locationElement, forecastTable),
  );
}

/**
 * Birta villu í viðmóti.
 * @param {Error} error
 */
function renderError(error) {
  renderIntoResultsContent(el('p', { class: 'error' }, error.message));
}

/**
 * Birta biðstöðu í viðmóti.
 */
function renderLoading() {
  renderIntoResultsContent(el('p', {}, 'Leita...'));
}

/**
 * Framkvæmir leit að veðri fyrir gefna staðsetningu.
 * Birtir biðstöðu, villu eða niðurstöður í viðmóti.
 * @param {SearchLocation} location Staðsetning sem á að leita eftir.
 */
async function onSearch(location) {
  renderLoading();

  try {
    const results = await weatherSearch(location.lat, location.lng);
    renderResults(location, results);
  } catch (error) {
    renderError(error);
  }
}

/**
 * Framkvæmir leit að veðri fyrir núverandi staðsetningu.
 * Biður notanda um leyfi gegnum vafra.
 */
async function onSearchMyLocation() {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const location = {
        title: 'Mín staðsetning',
        lat: latitude,
        lng: longitude,
      };
      onSearch(location);
    },
    (error) => {
      console.error('error getting current position', error);
      renderError(new Error('Gat ekki sótt staðsetningu'));
    },
  );
}

/**
 * Býr til takka fyrir staðsetningu.
 * @param {string} locationTitle
 * @param {() => void} onSearch
 * @returns {HTMLElement}
 */
function renderLocationButton(locationTitle, onSearch) {
  const locationElement = el(
    'li',
    { class: 'locations__location' },
    el(
      'button',
      { class: 'locations__button', click: onSearch },
      locationTitle,
    ),
  );

  /* Til smanburðar við el fallið
  const locationElement = document.createElement('li');
  locationElement.classList.add('locations__location');
  const locationButton = document.createElement('button');
  locationButton.appendChild(document.createTextNode(locationTitle));
  locationButton.addEventListener('click', onSearch);
  locationElement.appendChild(locationButton);
  */

  return locationElement;
}

/**
 * Býr til grunnviðmót: haus og lýsingu, lista af staðsetningum og niðurstöður (falið í byrjun).
 * @param {Element} container HTML element sem inniheldur allt.
 * @param {Array<SearchLocation>} locations Staðsetningar sem hægt er að fá veður fyrir.
 * @param {(location: SearchLocation) => void} onSearch
 * @param {() => void} onSearchMyLocation
 */
function render(container, locations, onSearch, onSearchMyLocation) {
  // Búum til <main> og setjum `weather` class
  const parentElement = document.createElement('main');
  parentElement.classList.add('weather');

  // Búum til <header> með beinum DOM aðgerðum
  const headerElement = document.createElement('header');
  const heading = document.createElement('h1');
  heading.appendChild(document.createTextNode('☀️ Veðrið 🌨'));
  headerElement.appendChild(heading);
  parentElement.appendChild(headerElement);

  // Búum til inngangstexta með því að nota `el` fallið
  const introElement = el(
    'p',
    { class: 'intro' },
    'Veldu stað til að sjá hita- og úrkomuspá.',
  );
  parentElement.appendChild(introElement);

  const locationsElement = document.createElement('section');
  locationsElement.classList.add('locations');
  const locationsHeading = document.createElement('h2');
  locationsHeading.classList.add('locations__heading');
  locationsHeading.textContent = 'Staðsetningar';
  locationsElement.appendChild(locationsHeading);

  const locationsList = document.createElement('ul');
  locationsList.classList.add('locations__list');

  locationsList.appendChild(
    renderLocationButton('Mín staðsetning (þarf leyfi)', onSearchMyLocation),
  );

  for (const location of locations) {
    const locationElement = renderLocationButton(location.title, () =>
      onSearch(location),
    );
    locationsList.appendChild(locationElement);
  }
  locationsElement.appendChild(locationsList);

  parentElement.appendChild(locationsElement);

  const resultsElement = document.createElement('section');
  resultsElement.classList.add('results');
  resultsElement.classList.add('hidden');
  const resultsHeading = document.createElement('h2');
  resultsHeading.classList.add('results__heading');
  resultsHeading.textContent = 'Niðurstöður';
  const resultsContent = document.createElement('div');
  resultsContent.classList.add('results__content');
  resultsElement.appendChild(resultsHeading);
  resultsElement.appendChild(resultsContent);
  parentElement.appendChild(resultsElement);

  container.appendChild(parentElement);
}

// Þetta fall býr til grunnviðmót og setur það í `document.body`
render(document.body, locations, onSearch, onSearchMyLocation);

// Configuración del escenario y la capa
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight - document.getElementById('controls').offsetHeight,
});
const layer = new Konva.Layer();
stage.add(layer);

// Variables globales
let rects = [];   // mesas
let imageSize, padding;  // tamaño de las sillas y distancia entre ellas y las mesas

// Carga de la imagen de las sillas
const imageObj = new Image();
imageObj.src = 'images/chair.png';

// Selección de elementos del DOM
const feedbackMessage = document.getElementById('feedbackMessage');
const remainingPlaces = document.getElementById('remainingPlaces');
const rectangleSelect = document.getElementById('rectangleSelect');
const addPlacesButton = document.getElementById('addPlacesButton');

// Ajustar tamaño del escenario al cambiar la ventana
window.addEventListener('resize', () => {
  stage.width(window.innerWidth);
  stage.height(window.innerHeight - document.getElementById('controls').offsetHeight);
});

// Cargar datos del JSON
async function loadJson() {
  try {
    const response = await fetch('data/data.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (!data.rectangles || !data.places) throw new Error('Datos JSON faltantes');

    imageSize = data.places[0].size;
    padding = data.places[0].padding;

    setupRectangles(data);
  } catch (error) {
    console.error('Error al cargar JSON:', error);
  }
}

// Configurar rectángulos
function setupRectangles(data) {
  const rectangleCount = parseInt(document.getElementById('rectangleCount').value) || 2;

  layer.destroyChildren();
  rects = [];
  rectangleSelect.innerHTML = ''; // Limpiar select

  const rectWidth = data.rectangles[0].width;
  const rectHeight = data.rectangles[0].height;
  const spacing = 70;
  const margin = 50;
  const availableWidth = stage.width() - 2 * margin;
  const rectsPerRow = Math.floor(availableWidth / (rectWidth + spacing));

  for (let i = 0; i < rectangleCount; i++) {
    const x = (i % rectsPerRow) * (rectWidth + spacing) + margin;
    const y = Math.floor(i / rectsPerRow) * (rectHeight + spacing) + margin;

    createRectangle(data.rectangles[0], x, y, i + 1);
  }

  layer.draw();
  rectangleSelect.style.display = 'inline-block';
  addPlacesButton.style.display = 'inline-block';
}

// Crear un rectángulo con texto y opción en el select
function createRectangle(data, x, y, index) {
  const rect = new Konva.Rect({
    x,
    y,
    width: data.width,
    height: data.height,
    fill: data.color,
    stroke: 'black',
    strokeWidth: 2,
    rectId: `rect-${index}`,
  });
  rects.push(rect);
  layer.add(rect);

  const text = new Konva.Text({
    x,
    y: y + data.height / 2 - 10,
    text: `Mesa ${index}`,
    fontSize: 18,
    fontFamily: 'Calibri',
    fill: 'white',
    width: data.width,
    align: 'center',
  });
  layer.add(text);

  const option = document.createElement('option');
  option.value = rect.attrs.rectId;
  option.text = `Mesa ${index}`;
  rectangleSelect.appendChild(option);
}

// Agregar sillas alrededor de una mesa
function addPlaces() {
  const selectedRectId = rectangleSelect.value;
  const specificRect = rects.find(rect => rect.attrs.rectId === selectedRectId);

  if (!specificRect) return;

  const chairCount = specificRect.chairCount || 0;
  if (chairCount >= 10) {
    feedbackMessage.textContent = `No hay más lugares disponibles en la Mesa ${selectedRectId.split('-')[1]}.`;
    feedbackMessage.style.display = 'block';
    return;
  }

  const rectWidth = specificRect.width();
  const rectHeight = specificRect.height();
  const x = specificRect.x();
  const y = specificRect.y();

  const places = [
    { x: x - imageSize - padding, y: y - imageSize - padding },
    { x: x + rectWidth + padding, y: y - imageSize - padding },
    { x: x - imageSize - padding, y: y + rectHeight + padding },
    { x: x + rectWidth + padding, y: y + rectHeight + padding },
    { x: x + rectWidth / 4 - imageSize / 2, y: y - imageSize - padding },
    { x: x + (3 * rectWidth) / 4 - imageSize / 2, y: y - imageSize - padding },
    { x: x + rectWidth / 4 - imageSize / 2, y: y + rectHeight + padding },
    { x: x + (3 * rectWidth) / 4 - imageSize / 2, y: y + rectHeight + padding },
    { x: x - imageSize - padding, y: y + rectHeight / 2 - imageSize / 2 },
    { x: x + rectWidth + padding, y: y + rectHeight / 2 - imageSize / 2 },
  ];

  const place = places[chairCount];

  const chair = new Konva.Image({
    x: place.x,
    y: place.y,
    image: imageObj,
    width: imageSize,
    height: imageSize,
  });
  layer.add(chair);
  layer.batchDraw();

  specificRect.chairCount = chairCount + 1;
  updateRemainingPlaces(selectedRectId);
  feedbackMessage.style.display = 'none';
}

// Actualizar lugares restantes
function updateRemainingPlaces(selectedRectId) {
  const specificRect = rects.find(rect => rect.attrs.rectId === selectedRectId);
  const chairCount = specificRect.chairCount || 0;
  remainingPlaces.textContent = `Lugares restantes para Mesa ${selectedRectId.split('-')[1]}: ${10 - chairCount}`;
}

// Eventos
rectangleSelect.addEventListener('change', () => {
  updateRemainingPlaces(rectangleSelect.value);
  feedbackMessage.style.display = 'none';
});
document.getElementById('generateRectanglesButton').addEventListener('click', loadJson);
addPlacesButton.addEventListener('click', addPlaces);

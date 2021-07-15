import 'ol/ol.css';

import Draw from 'ol/interaction/Draw';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Fill, Stroke, Style } from 'ol/style';
import View from 'ol/View';

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource({wrapX: false});

const colorSelect = document.getElementById('color')

let userStyle = createStyle(colorSelect.value);

const highlightStyle = createStyle("#3399CC");

const vector = new VectorLayer({
  source: source,
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
  }),
});

const typeSelect = document.getElementById('type');

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelect.value;
  
  if (value !== 'None') {
    let style;
    userStyle ? style = createStyle(colorSelect.value) : null;
    draw = new Draw({
      source: source,
      type: typeSelect.value,
      style: style
    })
    map.addInteraction(draw);

  }
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteraction();
};

colorSelect.onchange = function () {
  userStyle = createStyle(colorSelect.value);
  map.removeInteraction(draw);
  addInteraction();
}

const selected = []; //here features will be stored

let linesMap = {}; //here feature IDs and feature colors will be stored

document.addEventListener('keydown', function(event) {  //filtering Ctrl, Alt and CMd click events
  if (event.altKey || event.ctrlKey || event.metaKey) {
    map.on('click', function (e) {
      map.forEachFeatureAtPixel(e.pixel, function (f) {
        f.setStyle(highlightStyle); //highlight selected features
        selected.push(f);
        return true;
      });
    });
  }
})

// Handle event of creating new feature
vector.getSource().on('addfeature', function(e) {
  let style = createStyle(colorSelect.value)
  selected.forEach(function(feature) {
    feature.setStyle(style)
  })
  selected.splice(0, selected.length);

  e.feature.setId(new Date().getTime());
  linesMap[e.feature.getId()] = userStyle.getStroke().getColor();
  localStorage.setItem('linesMap', JSON.stringify(linesMap));

  e.feature.setStyle(userStyle);
  map.removeInteraction(draw);
  addInteraction();
});

// create style from given color
function createStyle(color) {
  return new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
      color: color,
      width: 2,
    }),
  })
}

//confirm changing color of selected features by clicking the button
document.getElementById('changeColorButton').addEventListener('click', function () {
  linesMap = {};
  linesMap = JSON.parse(localStorage.getItem('linesMap'))

  let style = createStyle(colorSelect.value)
  selected.forEach(function(feature) {
    feature.setStyle(style)
    linesMap[feature.getId()] = colorSelect.value;

  })
  selected.splice(0, selected.length);
  localStorage.setItem('linesMap', JSON.stringify(linesMap));
})

document.getElementById('undo').addEventListener('click', function () {
  draw.removeLastPoint();
});

addInteraction();


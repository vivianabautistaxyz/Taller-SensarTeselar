const COLORES = [[33,150,243],[76,175,80],[255,235,59],[244,67,54]]; // azul-verde-amarillo-rojo
const FREQ_MIN = 220, FREQ_MAX = 880; // La3 a La5

const map = L.map('map').setView([4.6118, -74.0689], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const puntosLayer = L.layerGroup().addTo(map);
let rutaLinea = null;
let cursorMarker = null;
let datos = [];
let reproduciendo = false;
let timerId = null;
let audioCtx = null;
let oscilador = null;

const inputArchivo = document.getElementById('archivo');
const archivoNombre = document.getElementById('archivoNombre');
const selVariable = document.getElementById('variable');
const selVelocidad = document.getElementById('velocidad');
const btnPlay = document.getElementById('btnPlay');
const btnStop = document.getElementById('btnStop');
const statusBox = document.getElementById('status');
const legendTitle = document.getElementById('legendTitle');
const legMin = document.getElementById('legMin');
const legMax = document.getElementById('legMax');

function interpolar(t, campos) {
  const escala = t * (campos.length - 1);
  const i0 = Math.max(0, Math.min(campos.length - 2, Math.floor(escala)));
  const frac = escala - i0;
  return campos[i0].map((v, idx) => v + (campos[i0 + 1][idx] - v) * frac);
}

function normalizar(valor, min, max) {
  return max === min ? 0.5 : (valor - min) / (max - min);
}

function minMax(campo) {
  const vals = datos.map(d => d[campo]);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

function cargarArchivo(file) {
  detener();
  const lector = new FileReader();
  lector.onload = () => {
    datos = JSON.parse(lector.result);
    dibujarRuta();
  };
  lector.readAsText(file);
}

function dibujarRuta() {
  puntosLayer.clearLayers();
  if (rutaLinea) map.removeLayer(rutaLinea);
  if (cursorMarker) { map.removeLayer(cursorMarker); cursorMarker = null; }
  if (!datos.length) return;

  const campo = selVariable.value;
  const { min, max } = minMax(campo);
  legendTitle.textContent = campo === 'temp' ? 'Temperatura (°C)' : 'Humedad (%)';
  legMin.textContent = min.toFixed(1);
  legMax.textContent = max.toFixed(1);

  rutaLinea = L.polyline(datos.map(d => [d.lat, d.lon]), { color: '#2e7d32', weight: 2, opacity: 0.5 }).addTo(map);

  datos.forEach(d => {
    const [r, g, b] = interpolar(normalizar(d[campo], min, max), COLORES).map(Math.round);
    L.circleMarker([d.lat, d.lon], {
      radius: 5, color: `rgb(${r},${g},${b})`, fillColor: `rgb(${r},${g},${b})`, fillOpacity: 0.9, weight: 1
    }).bindTooltip(`Temp: ${d.temp}°C · Hum: ${d.hum}%`).addTo(puntosLayer);
  });

  map.fitBounds(rutaLinea.getBounds(), { padding: [30, 30] });
}

function reproducir() {
  if (!datos.length || reproduciendo) return;
  reproduciendo = true;
  btnPlay.disabled = true;
  btnStop.disabled = false;
  statusBox.style.display = 'block';

  const campo = selVariable.value;
  const { min, max } = minMax(campo);
  const intervalo = Number(selVelocidad.value);

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  oscilador = audioCtx.createOscillator();
  const ganancia = audioCtx.createGain();
  oscilador.type = 'sine';
  ganancia.gain.value = 0.15;
  oscilador.connect(ganancia).connect(audioCtx.destination);
  oscilador.start();

  cursorMarker = L.circleMarker([datos[0].lat, datos[0].lon], {
    radius: 9, color: '#000', fillColor: '#fff', fillOpacity: 1, weight: 2
  }).addTo(map);

  let i = 0;
  const paso = () => {
    if (i >= datos.length) { detener(); return; }
    const d = datos[i];
    const freq = FREQ_MIN + normalizar(d[campo], min, max) * (FREQ_MAX - FREQ_MIN);

    cursorMarker.setLatLng([d.lat, d.lon]);
    oscilador.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.03);

    document.getElementById('stIdx').textContent = i + 1;
    document.getElementById('stTotal').textContent = datos.length;
    document.getElementById('stVal').textContent = d[campo] + (campo === 'temp' ? '°C' : '%');
    document.getElementById('stFreq').textContent = freq.toFixed(0);

    i++;
    timerId = setTimeout(paso, intervalo);
  };
  paso();
}

function detener() {
  reproduciendo = false;
  clearTimeout(timerId);
  if (oscilador) { oscilador.stop(); oscilador.disconnect(); oscilador = null; }
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  btnPlay.disabled = false;
  btnStop.disabled = true;
}

inputArchivo.addEventListener('change', () => {
  const file = inputArchivo.files[0];
  if (!file) return;
  archivoNombre.textContent = file.name;
  cargarArchivo(file);
});
selVariable.addEventListener('change', () => { detener(); dibujarRuta(); });
btnPlay.addEventListener('click', reproducir);
btnStop.addEventListener('click', detener);

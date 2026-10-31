# Teselar — Mapa Sonoro

Mapa (OpenStreetMap/Leaflet) que convierte una ruta con datos de sensores
(lat, lon, temperatura, humedad) en un recorrido sonoro: un oscilador
cambia de frecuencia según el dato elegido mientras un marcador avanza
por la ruta.

## Uso

1. Abrí `index.html` en el navegador (o la versión publicada en GitHub Pages).
2. Subí un archivo `.json` con el formato:
   ```json
   [{ "ms": 123, "lat": 4.61, "lon": -74.06, "temp": 21.0, "hum": 62.3 }, ...]
   ```
3. Elegí qué dato sonificar (temperatura o humedad) y la velocidad.
4. Reproducí.

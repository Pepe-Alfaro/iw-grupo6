# Pruebas de rendimiento (Locust)

Estas pruebas generan carga contra la API para medir latencia, tasa de errores y throughput.

## Requisitos

- Tener la app levantada con `docker compose up -d`.

## Ejecutar (recomendado, sin instalar nada local)

Lanza Locust en Docker, conectado a la misma red de `docker compose`:

```bash
docker run --rm --network iw-grupo6_default \
  -v "$PWD/perf:/work" -w /work \
  -p 8089:8089 \
  locustio/locust:2.32.10 \
  -f locustfile.py -H http://backend:8000
```

Luego abre el panel: `http://localhost:8089`

Valores típicos para una prueba corta:

- Users: 50
- Spawn rate: 5
- Run time: 2m

## Ejecutar en modo headless (CI / informe)

Ejemplo: 50 usuarios, 5 usuarios/seg, 2 minutos, reporte CSV:

```bash
docker run --rm --network iw-grupo6_default \
  -v "$PWD/perf:/work" -w /work \
  locustio/locust:2.32.10 \
  -f locustfile.py -H http://backend:8000 \
  --headless -u 50 -r 5 -t 2m \
  --csv=results
```

Esto genera ficheros `results_*.csv` en `perf/`.

## Credenciales

Por defecto usa:

- Email: `jorge@remarket.com`
- Password: `Test1234!`

Puedes cambiarlas con:

- `LOCUST_USER_EMAIL`
- `LOCUST_USER_PASSWORD`

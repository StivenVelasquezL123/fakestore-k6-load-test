PRUEBA DE CARGA DEL LOGIN CON K6

Herramientas y versiones
- Grafana k6 2.3.0 o superior
- JavaScript compatible con k6; no requiere Node.js ni navegador
- Archivo de datos: CSV UTF-8 en data/users.csv
- Endpoint de prueba: https://fakestoreapi.com/auth/login

Objetivo
Validar el comportamiento del servicio de autenticación bajo una carga constante, evaluando latencia, tasa de error, validación de token y estabilidad del sistema.

Requisitos
1. Instalar k6 desde la documentación oficial de Grafana.
2. Ejecutar desde la carpeta del proyecto para que k6 encuentre data/users.csv.
3. Mantener conexión a internet para consultar el endpoint de prueba.
4. Usar solo la carga sugerida para evitar impactos sobre servicios públicos sin autorización.

Ejecución básica
1. Abrir la terminal en la carpeta principal del proyecto.
2. Ejecutar:
   k6 run script.js
3. Revisar el resultado final que imprime k6.

Guardar resumen y métricas crudas
En macOS/Linux:
    mkdir -p results
    set -o pipefail
    k6 run --out json=results/metrics.json script.js 2>&1 | tee results/summary.txt

En PowerShell:
    New-Item -ItemType Directory -Force results
    k6 run --out json=results/metrics.json script.js 2>&1 | Tee-Object results/summary.txt

Cambiar la base del servicio
    k6 run -e BASE_URL=https://host-autorizado.example script.js

Configuración de carga
- 20 iteraciones por segundo con constant-arrival-rate durante cinco minutos.
- Cada iteración envía una solicitud POST /auth/login.
- Se preasignan 40 VUs y se permiten hasta 140 para mantener la tasa bajo latencia variable.
- El archivo CSV se carga una sola vez y se reutiliza entre iteraciones.
- El valor del token se valida con un check para confirmar que la autenticación responde correctamente.

Umbrales de aceptación
- Duración máxima de la solicitud menor a 1.5 segundos.
- Percentil p95 menor a 1.5 segundos.
- Tasa de solicitudes HTTP fallidas menor al 3%.
- Más del 97% de checks correctos.
- Cero iteraciones descartadas.
- Al menos 6,000 solicitudes contabilizadas en cinco minutos.

Observaciones
El script incluye validaciones reforzadas para manejar CSV con BOM, líneas vacías y contraseñas que puedan incluir comas. Esto reduce errores al ejecutar la prueba en distintos entornos.
Los umbrales estrictos hacen que k6 termine con error cuando algún criterio no se cumple. No ejecutar cargas mayores a las indicadas contra servicios públicos o entornos sin autorización.

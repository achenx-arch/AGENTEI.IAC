# Instrucciones para Agentes de IA - Oracle HR Database

## 🏗️ Arquitectura del Proyecto
- `backend/`: Servidor Node.js + Agente IA
  - `server.js`: Punto de entrada principal, maneja API REST
  - `agent-simple.js`: Generador de consultas SQL usando IA
  - `agent-learning.js`: Sistema de aprendizaje basado en consultas anteriores
  - `knexfile.js`: Configuración de conexión a base de datos
- `frontend/`: SPA simple HTML/CSS/JS
  - `index.html`: Interfaz web única
  - `script.js`: Manejo de consultas y respuestas
  - `style.css`: Estilos y temas

## 🔄 Flujo de Datos
1. Usuario → Frontend → `/api/query` → Agente IA → SQL → Oracle DB
2. Sistema de confirmación para operaciones INSERT/UPDATE/DELETE
3. Aprendizaje automático almacenado en `learned-queries.json`

## 🛠️ Patrones Específicos
- Usar el modelo tablas HR: employees, departments, regions, countries, locations, jobs, job_history
- Siempre requerir confirmación para operaciones de modificación de datos
- Las operaciones DROP/TRUNCATE/ALTER están bloqueadas por seguridad
- Los cambios son visibles inmediatamente (COMMIT automático)

## 🔑 Comandos Clave
```bash
# Iniciar servidor
cd backend && node server.js

# Con script automático
.\INICIAR-AGENTE-DEFINITIVO.bat

# Instalar dependencias Oracle
npm install oracledb --save
```

## 📡 Puntos de Integración
1. API REST endpoints:
   - GET `/api/query`: Procesa consultas en lenguaje natural
   - GET `/api/learning-stats`: Estadísticas de aprendizaje
2. Conexión Oracle via `oracledb` + `knex`
3. OpenAI GPT-4 para procesamiento de lenguaje natural

## 🔧 Variables de Entorno (.env)
```env
DB_CLIENT=oracledb
DB_USER=HR
DB_PASSWORD=****
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XE
DB_SCHEMA=HR
```

## 🎯 Patrones de Testing
- Verificar conexión: "¿Cuántos departamentos hay?" (debe ser 27)
- Probar operaciones seguras primero (SELECT) antes de modificaciones
- Validar conteos: employees (107), departments (27)

## ⚠️ Consideraciones Especiales
1. Requiere Oracle Instant Client en PATH
2. Esquema HR debe estar instalado y accesible
3. Firewall debe permitir puerto 3000 para acceso en red
4. Preferir consultas específicas sobre consultas genéricas para mejor rendimiento
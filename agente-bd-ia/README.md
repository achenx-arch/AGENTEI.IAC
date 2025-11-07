# Agente IA - Oracle HR (Proyecto listo)

## Contenido
- backend/: Código Node.js (server, agente que usa GPT-4, knex config)
- frontend/: Interfaz web simple (HTML/CSS/JS)
- .env.example (configuración de claves y conexión)

## Instrucciones rápidas
1. Instala Oracle Instant Client y configura PATH / LD_LIBRARY_PATH.
2. Abre `backend/.env.example`, copia como `.env` y completa tus credenciales (OPENAI_API_KEY, DB_...).
3. En VS Code abre terminal y ejecuta: `cd backend && npm install`
4. Inicia el servidor: `node server.js`
5. Abre `frontend/index.html` con Live Server o un pequeño servidor estático.
6. Usa la interfaz para escribir consultas en lenguaje natural.

## Notas
- Revisa el README del driver oracledb si tienes errores de instalación.
- El proyecto usa GPT-4; si no tienes acceso cambia el modelo en `backend/agent.js`.

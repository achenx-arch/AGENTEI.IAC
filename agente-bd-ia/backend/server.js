require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Knex = require('knex');
// Create a safe default knex that doesn't require external DB at boot
let defaultKnex;
try {
  if ((process.env.DB_CLIENT || '').toLowerCase() === 'sqlite3') {
    const filename = process.env.SQLITE_PATH || path.join(__dirname, 'database.sqlite');
    defaultKnex = Knex({ client: 'sqlite3', connection: { filename }, useNullAsDefault: true });
  } else {
    // Fallback to in-memory SQLite so the app always starts
    defaultKnex = Knex({ client: 'sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true });
  }
} catch (e) {
  defaultKnex = Knex({ client: 'sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true });
}
const { generateQuery } = require('./agent-simple');
const { saveLearnedQuery, getLearningStats } = require('./agent-learning');
const fetch = require('node-fetch');

const connections = new Map();
function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function getKnexFromRequest(req) {
  const id = req.headers['x-connection-id'] || req.query?.connectionId || (req.body && req.body.connectionId);
  if (id && connections.has(id)) return connections.get(id);
  return defaultKnex;
}

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0'; // Permitir acceso desde la red

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Health check for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

app.post('/api/connect', async (req, res) => {
  try {
    const { client, config } = req.body || {};
    if (!client) return res.status(400).json({ error: 'client requerido' });

    let knexInstance;
    if (client === 'oracledb') {
      const user = config?.user;
      const password = config?.password;
      const host = config?.host || 'localhost';
      const port = config?.port || '1521';
      const service = config?.service || 'XE';
      const connection = { user, password, connectString: `${host}:${port}/${service}` };
      knexInstance = Knex({ client: 'oracledb', connection, pool: { min: 0, max: 7 } });
      await knexInstance.raw('SELECT 1 FROM dual');
    } else if (client === 'sqlite3' || client === 'sqlite') {
      const filename = config?.filename || './database.sqlite';
      knexInstance = Knex({ client: 'sqlite3', connection: { filename }, useNullAsDefault: true });
      await knexInstance.raw('SELECT 1');
    } else {
      return res.status(400).json({ error: 'Cliente no soportado' });
    }

    const id = genId();
    connections.set(id, knexInstance);
    res.json({ connectionId: id });
  } catch (err) {
    res.status(500).json({ error: 'Error conectando', details: err.message });
  }
});

app.delete('/api/disconnect', async (req, res) => {
  try {
    const id = req.headers['x-connection-id'] || req.query?.connectionId || (req.body && req.body.connectionId);
    if (!id || !connections.has(id)) return res.status(400).json({ error: 'connectionId inválido' });
    const k = connections.get(id);
    connections.delete(id);
    await k.destroy();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error desconectando', details: err.message });
  }
});

app.get('/api/schema', async (req, res) => {
  try {
    // Obtener esquema de SQLite
    const knex = getKnexFromRequest(req);
    const tables = await knex.raw("SELECT name FROM sqlite_master WHERE type='table'");
    let schemaText = '';
    
    for (const table of tables) {
      const columns = await knex.raw(`PRAGMA table_info(${table.name})`);
      columns.forEach(col => {
        schemaText += `Tabla: ${table.name}, Columna: ${col.name} (${col.type})\n`;
      });
    }

    res.json({ schema: schemaText });
  } catch (err) {
    console.error('Error schema:', err);
    res.status(500).json({ error: 'Error al obtener esquema', details: err.message });
  }
});

app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'La pregunta es requerida.' });

  try {
    console.log('Pregunta recibida:', question);
    
    const knex = getKnexFromRequest(req);
    const activeClient = (knex && knex.client && knex.client.config && knex.client.config.client) || (process.env.DB_CLIENT || '').toLowerCase();
    const sql = generateQuery(question, activeClient);
    console.log('SQL generado:', sql);

    // Detectar operaciones de modificación
    const isModification = /\b(INSERT|UPDATE|DELETE)\b/i.test(sql);
    const isSelect = /^\s*SELECT/i.test(sql);
    
    let execResult, data = [];
    let rowsAffected = 0;
    
    if (isModification && !isSelect) {
      console.log('⚠️ Operación de modificación detectada:', sql);
      // Para operaciones de modificación, necesitamos confirmación antes de ejecutar
      res.json({ 
        result: sql, 
        data: [], 
        requiresConfirmation: true,
        operationType: sql.match(/\b(INSERT|UPDATE|DELETE)\b/i)?.[0] || 'MODIFY'
      });
      return;
    }
    
    // Ejecutar consulta SELECT
    execResult = await knex.raw(sql);
    
    // Manejar resultados según el tipo de base de datos
    if (Array.isArray(execResult)) {
      if (execResult.length > 0 && Array.isArray(execResult[0])) {
        data = execResult[0];
      } else {
        data = execResult;
      }
    } else if (execResult && execResult.rows) {
      // Oracle devuelve rows
      data = execResult.rows;
    }

    console.log('Datos obtenidos:', data.length || 'Sin datos');

    // Guardar en el sistema de aprendizaje
    saveLearnedQuery(question, sql);

    res.json({ result: sql, data, requiresConfirmation: false });
  } catch (err) {
    console.error('Error /api/ask:', err);
    res.status(500).json({ error: 'Error procesando la consulta', details: err.message });
  }
});

// Endpoint separado para ejecutar operaciones de modificación confirmadas
app.post('/api/confirm-execute', async (req, res) => {
  const { sql } = req.body;
  
  if (!sql) return res.status(400).json({ error: 'SQL es requerido' });

  try {
    console.log('Ejecutando operación confirmada:', sql);
    
    const knex = getKnexFromRequest(req);
    const result = await knex.raw(sql);
    let rowsAffected = 0;
    
    // Obtener número de filas afectadas según el tipo de base de datos
    if (result && result.rowCount !== undefined) {
      rowsAffected = result.rowCount;
    } else if (result && result.changes !== undefined) {
      rowsAffected = result.changes;
    } else if (Array.isArray(result)) {
      rowsAffected = result.length;
    }
    
    // Realizar commit explícito si es Oracle
    if (process.env.DB_CLIENT === 'oracledb') {
      const knex = getKnexFromRequest(req);
      await knex.raw('COMMIT');
    }
    
    res.json({ 
      success: true, 
      sql, 
      message: `Operación ejecutada correctamente. Filas afectadas: ${rowsAffected}`,
      rowsAffected 
    });
  } catch (err) {
    console.error('Error /api/confirm-execute:', err);
    res.status(500).json({ error: 'Error ejecutando la operación', details: err.message });
  }
});

// Aprender: guardar mapeo pregunta -> SQL
app.post('/api/learn', (req, res) => {
  try {
    const { question, sql } = req.body || {};
    if (!question || !sql) return res.status(400).json({ error: 'question y sql son requeridos' });
    saveLearnedQuery(question, sql);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error aprendiendo consulta', details: err.message });
  }
});

// Endpoint para ver estadísticas de aprendizaje
app.get('/api/learning-stats', (req, res) => {
  try {
    const stats = getLearningStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadísticas', details: err.message });
  }
});

// SPA fallback: serve index.html for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, host, () => {
  console.log(`=================================`);
  console.log(`🚀 Servidor Agente IA Activo`);
  console.log(`=================================`);
  console.log(`📍 Local:  http://localhost:${port}`);
  console.log(`🌐 Red:    http://${require('os').networkInterfaces().Ethernet?.[0]?.address || '127.0.0.1'}:${port}`);
  console.log(`📊 Base de datos: dinámica por sesión`);
  console.log(`=================================`);
});

process.on('SIGINT', async () => {
  for (const k of connections.values()) { try { await k.destroy(); } catch (e) {} }
  process.exit(0);
});

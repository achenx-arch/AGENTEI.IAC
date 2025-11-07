document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('query-form');
  const input = document.getElementById('question-input');
  const sqlBox = document.getElementById('sql-query');
  const resultsContainer = document.getElementById('results-table-container');

  // Conexión UI
  const connectForm = document.getElementById('connect-form');
  const dbClient = document.getElementById('db-client');
  const oracleFields = document.getElementById('oracle-fields');
  const sqliteFields = document.getElementById('sqlite-fields');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const connectBtn = document.getElementById('connect-btn');
  const connStatus = document.getElementById('conn-status');

  let connectionId = '';

  dbClient.addEventListener('change', () => {
    const c = dbClient.value;
    if (c === 'oracledb') {
      oracleFields.style.display = '';
      sqliteFields.style.display = 'none';
    } else {
      oracleFields.style.display = 'none';
      sqliteFields.style.display = '';
    }
  });

  connectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      connectBtn.disabled = true;
      connStatus.textContent = 'Conectando...';

      const client = dbClient.value;
      let config = {};
      if (client === 'oracledb') {
        config = {
          user: document.getElementById('db-user').value,
          password: document.getElementById('db-pass').value,
          host: document.getElementById('db-host').value || 'localhost',
          port: document.getElementById('db-port').value || '1521',
          service: document.getElementById('db-service').value || 'XE',
        };
      } else {
        config = {
          filename: document.getElementById('db-filename').value || './backend/database.sqlite'
        };
      }

      const resp = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client, config })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      connectionId = data.connectionId;
      connStatus.textContent = `Conectado (${client})`;
      disconnectBtn.disabled = false;
      input.disabled = false;
      form.querySelector('button[type="submit"]').disabled = false;
    } catch (err) {
      connStatus.textContent = 'Error de conexión';
      alert(err.message || 'Error conectando');
    } finally {
      connectBtn.disabled = false;
    }
  });

  disconnectBtn.addEventListener('click', async () => {
    try {
      if (!connectionId) return;
      disconnectBtn.disabled = true;
      const resp = await fetch(`/api/disconnect?connectionId=${encodeURIComponent(connectionId)}`, {
        method: 'DELETE',
        headers: { 'X-Connection-Id': connectionId }
      });
      // ignorar errores si ya no existe
    } catch {}
    connectionId = '';
    connStatus.textContent = 'Desconectado';
    input.disabled = true;
    form.querySelector('button[type="submit"]').disabled = true;
  });

  // Modales
  const confirmModal = document.getElementById('confirm-modal');
  const resultModal = document.getElementById('result-modal');
  const modalSqlText = document.getElementById('modal-sql-text');
  const resultMessage = document.getElementById('result-message');
  
  // Variables para almacenar el SQL pendiente de ejecución
  let pendingSql = '';

  // Aprender: enviar mapeo pregunta->SQL
  const learnForm = document.getElementById('learn-form');
  const learnQuestion = document.getElementById('learn-question');
  const learnSql = document.getElementById('learn-sql');
  const learnStatus = document.getElementById('learn-status');
  if (learnForm) {
    learnForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        learnStatus.textContent = 'Guardando...';
        const q = (learnQuestion.value || '').trim();
        const s = (learnSql.value || '').trim();
        if (!q || !s) { learnStatus.textContent = 'Completa ambos campos'; return; }
        const resp = await fetch('/api/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, sql: s })
        });
        if (!resp.ok) throw new Error(await resp.text());
        learnStatus.textContent = 'Aprendido ✅';
      } catch (err) {
        learnStatus.textContent = 'Error guardando';
      }
    });
  }

  // Botones del modal de confirmación
  document.getElementById('confirm-yes').addEventListener('click', async () => {
    confirmModal.style.display = 'none';
    await executeConfirmedQuery(pendingSql);
  });
  
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    confirmModal.style.display = 'none';
    pendingSql = '';
  });
  
  // Botón del modal de resultado
  document.getElementById('result-ok').addEventListener('click', () => {
    resultModal.style.display = 'none';
  });

  async function executeConfirmedQuery(sql) {
    try {
      sqlBox.textContent = 'Ejecutando operación...';
      if (!connectionId) throw new Error('No hay conexión activa');
      const resp = await fetch('/api/confirm-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Connection-Id': connectionId },
        body: JSON.stringify({ sql, connectionId })
      });

      if (!resp.ok) throw new Error(`Servidor: ${resp.statusText}`);

      const { success, message, rowsAffected } = await resp.json();
      
      if (success) {
        sqlBox.textContent = sql;
        resultMessage.textContent = message;
        resultsContainer.innerHTML = `<div class="success-message">${message}</div><p>Los cambios se aplicaron a la base de datos. Puedes verificar los cambios en Oracle SQL Developer.</p>`;
        
        // Mostrar modal de éxito
        resultModal.style.display = 'flex';
      }
    } catch (err) {
      console.error(err);
      sqlBox.textContent = 'Error ejecutando la operación.';
      resultsContainer.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    sqlBox.textContent = 'Generando consulta...';
    resultsContainer.innerHTML = '';

    try {
      if (!connectionId) {
        resultsContainer.innerHTML = '<p style="color:orange">Conéctate a una base de datos primero.</p>';
        sqlBox.textContent = '';
        return;
      }
      const resp = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Connection-Id': connectionId },
        body: JSON.stringify({ question, connectionId })
      });

      if (!resp.ok) throw new Error(`Servidor: ${resp.statusText}`);

      const { result, data, requiresConfirmation, operationType } = await resp.json();
      
      // Si requiere confirmación, mostrar modal
      if (requiresConfirmation) {
        pendingSql = result;
        sqlBox.textContent = result;
        
        // Configurar mensaje según tipo de operación
        const operations = {
          'INSERT': 'Esta operación INSERTARÁ nuevos datos en la base de datos.',
          'UPDATE': 'Esta operación MODIFICARÁ datos existentes en la base de datos.',
          'DELETE': 'Esta operación ELIMINARÁ datos de la base de datos.',
          'MODIFY': 'Esta operación MODIFICARÁ la base de datos.'
        };
        
        document.querySelector('#modal-message').textContent = 
          operations[operationType] || '¿Estás seguro de que deseas ejecutar esta operación?';
        
        modalSqlText.textContent = result;
        confirmModal.style.display = 'flex';
        
        resultsContainer.innerHTML = '<p style="color:orange">⚠️ Operación de modificación detectada. Requiere confirmación.</p>';
        return;
      }
      
      // Si es SELECT, mostrar resultados normalmente
      sqlBox.textContent = result;

      if (!data || data.length === 0) {
        resultsContainer.innerHTML = '<p>No hay resultados.</p>';
        return;
      }

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const tbody = document.createElement('tbody');

      const headers = Object.keys(data[0]);
      const headerRow = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th'); 
        th.textContent = h; 
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);

      data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
          const td = document.createElement('td');
          td.textContent = row[h] === undefined ? '' : String(row[h]);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      table.appendChild(thead);
      table.appendChild(tbody);
      resultsContainer.appendChild(table);

    } catch (err) {
      console.error(err);
      sqlBox.textContent = 'Error generando o ejecutando la consulta.';
      resultsContainer.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
  });
});

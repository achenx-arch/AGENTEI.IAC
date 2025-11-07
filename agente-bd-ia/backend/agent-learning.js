const fs = require('fs');
const path = require('path');

// Archivo para almacenar las consultas aprendidas
const learningFile = path.join(__dirname, 'learned-queries.json');

// Cargar consultas aprendidas
function loadLearnedQueries() {
  try {
    if (fs.existsSync(learningFile)) {
      const data = fs.readFileSync(learningFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error cargando consultas aprendidas:', error);
  }
  return {};
}

// Guardar una nueva consulta aprendida
function saveLearnedQuery(question, sql) {
  try {
    const queries = loadLearnedQueries();
    
    // Normalizar la pregunta como clave
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Agregar la consulta si no existe
    if (!queries[normalizedQuestion]) {
      queries[normalizedQuestion] = {
        sql: sql,
        count: 1,
        createdAt: new Date().toISOString()
      };
    } else {
      // Incrementar contador si ya existe
      queries[normalizedQuestion].count += 1;
    }
    
    // Guardar en archivo
    fs.writeFileSync(learningFile, JSON.stringify(queries, null, 2));
    console.log(`📚 Consulta aprendida: "${normalizedQuestion}"`);
  } catch (error) {
    console.error('Error guardando consulta aprendida:', error);
  }
}

// Buscar consulta aprendida
function findLearnedQuery(question) {
  const queries = loadLearnedQueries();
  const normalizedQuestion = question.toLowerCase().trim();
  
  // Buscar coincidencia exacta
  if (queries[normalizedQuestion]) {
    return queries[normalizedQuestion].sql;
  }
  
  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(queries)) {
    if (normalizedQuestion.includes(key) || key.includes(normalizedQuestion)) {
      console.log(`💡 Usando consulta aprendida: "${key}"`);
      return value.sql;
    }
  }
  
  return null;
}

// Obtener estadísticas de aprendizaje
function getLearningStats() {
  const queries = loadLearnedQueries();
  return {
    totalQueries: Object.keys(queries).length,
    totalUses: Object.values(queries).reduce((sum, q) => sum + q.count, 0),
    queries: queries
  };
}

// Borrar todas las consultas aprendidas
function clearLearnedQueries() {
  try {
    if (fs.existsSync(learningFile)) {
      fs.unlinkSync(learningFile);
      console.log('🗑️ Consultas aprendidas eliminadas');
    }
  } catch (error) {
    console.error('Error eliminando consultas:', error);
  }
}

module.exports = {
  saveLearnedQuery,
  findLearnedQuery,
  getLearningStats,
  clearLearnedQueries
};





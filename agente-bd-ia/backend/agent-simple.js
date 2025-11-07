// Agente IA mejorado con soporte para CREATE, READ, UPDATE, DELETE + Sistema de Aprendizaje
const knex = require('knex');
const knexConfig = require('./knexfile');
const { saveLearnedQuery, findLearnedQuery } = require('./agent-learning');

const db = knex(knexConfig.development);

// Reglas predefinidas para generar SQL - Todas las tablas del esquema HR
const rules = {
  // EMPLOYEES
  'cuantos empleados': 'SELECT COUNT(*) as total_empleados FROM employees',
  'cuántos empleados': 'SELECT COUNT(*) as total_empleados FROM employees',
  'numero de empleados': 'SELECT COUNT(*) as total_empleados FROM employees',
  'número de empleados': 'SELECT COUNT(*) as total_empleados FROM employees',
  'total empleados': 'SELECT COUNT(*) as total_empleados FROM employees',
  'mostrar empleados': 'SELECT * FROM employees',
  'muestra empleados': 'SELECT * FROM employees',
  'muestrame todos los empleados': 'SELECT * FROM employees',
  'listar empleados': 'SELECT * FROM employees',
  'todos los empleados': 'SELECT * FROM employees',
  'empleados': 'SELECT * FROM employees',
  
  // DEPARTMENTS
  'cuantos departamentos': 'SELECT COUNT(*) as total_departamentos FROM departments',
  'cuántos departamentos': 'SELECT COUNT(*) as total_departamentos FROM departments',
  'numero de departamentos': 'SELECT COUNT(*) as total_departamentos FROM departments',
  'número de departamentos': 'SELECT COUNT(*) as total_departamentos FROM departments',
  'total departamentos': 'SELECT COUNT(*) as total_departamentos FROM departments',
  'mostrar departamentos': 'SELECT * FROM departments',
  'muestra departamentos': 'SELECT * FROM departments',
  'departamentos': 'SELECT * FROM departments',
  'lista departamentos': 'SELECT * FROM departments',
  
  // REGIONS
  'cuantas regiones': 'SELECT COUNT(*) as total_regiones FROM regions',
  'cuántas regiones': 'SELECT COUNT(*) as total_regiones FROM regions',
  'numero de regiones': 'SELECT COUNT(*) as total_regiones FROM regions',
  'número de regiones': 'SELECT COUNT(*) as total_regiones FROM regions',
  'total regiones': 'SELECT COUNT(*) as total_regiones FROM regions',
  'mostrar regiones': 'SELECT * FROM regions',
  'muestra regiones': 'SELECT * FROM regions',
  'regiones': 'SELECT * FROM regions',
  'lista regiones': 'SELECT * FROM regions',
  'mostrar todas las regiones': 'SELECT * FROM regions',
  
  // COUNTRIES
  'cuantos paises': 'SELECT COUNT(*) as total_paises FROM countries',
  'cuántos países': 'SELECT COUNT(*) as total_paises FROM countries',
  'numero de paises': 'SELECT COUNT(*) as total_paises FROM countries',
  'número de países': 'SELECT COUNT(*) as total_paises FROM countries',
  'total paises': 'SELECT COUNT(*) as total_paises FROM countries',
  'mostrar paises': 'SELECT * FROM countries',
  'muestra paises': 'SELECT * FROM countries',
  'paises': 'SELECT * FROM countries',
  'countries': 'SELECT * FROM countries',
  'mostrar todos los paises': 'SELECT * FROM countries',
  
  // LOCATIONS
  'cuantas ubicaciones': 'SELECT COUNT(*) as total_ubicaciones FROM locations',
  'cuántas ubicaciones': 'SELECT COUNT(*) as total_ubicaciones FROM locations',
  'numero de ubicaciones': 'SELECT COUNT(*) as total_ubicaciones FROM locations',
  'número de ubicaciones': 'SELECT COUNT(*) as total_ubicaciones FROM locations',
  'total ubicaciones': 'SELECT COUNT(*) as total_ubicaciones FROM locations',
  'mostrar ubicaciones': 'SELECT * FROM locations',
  'muestra ubicaciones': 'SELECT * FROM locations',
  'ubicaciones': 'SELECT * FROM locations',
  'locations': 'SELECT * FROM locations',
  'mostrar todas las ubicaciones': 'SELECT * FROM locations',
  
  // JOBS
  'cuantos trabajos': 'SELECT COUNT(*) as total_trabajos FROM jobs',
  'cuántos trabajos': 'SELECT COUNT(*) as total_trabajos FROM jobs',
  'numero de trabajos': 'SELECT COUNT(*) as total_trabajos FROM jobs',
  'número de trabajos': 'SELECT COUNT(*) as total_trabajos FROM jobs',
  'total trabajos': 'SELECT COUNT(*) as total_trabajos FROM jobs',
  'mostrar trabajos': 'SELECT * FROM jobs',
  'muestra trabajos': 'SELECT * FROM jobs',
  'trabajos': 'SELECT * FROM jobs',
  'jobs': 'SELECT * FROM jobs',
  'puestos de trabajo': 'SELECT * FROM jobs',
  'mostrar todos los trabajos': 'SELECT * FROM jobs',
  
  // JOB_HISTORY
  'historial de trabajo': 'SELECT * FROM job_history',
  'historial empleo': 'SELECT * FROM job_history',
  'historial trabajos': 'SELECT * FROM job_history',
  'job history': 'SELECT * FROM job_history',
  'mostrar historial de trabajo': 'SELECT * FROM job_history',
  
  // SALARIOS
  'salario mayor': 'SELECT * FROM employees WHERE salary > 5000',
  'salario alto': 'SELECT * FROM employees WHERE salary > 5000',
  'empleados con salario': 'SELECT * FROM employees WHERE salary > 5000',
  'salarios altos': 'SELECT * FROM employees WHERE salary > 5000',
  'empleados salarios': 'SELECT employee_id, first_name, last_name, salary FROM employees',
  
  // NOMBRES
  'nombres empleados': 'SELECT first_name, last_name FROM employees',
  'nombres y salarios': 'SELECT first_name, last_name, salary FROM employees',
  'nombres departamentos': 'SELECT department_name FROM departments'
};

function sanitizeIdentifier(id) {
  return id.replace(/[^a-z0-9_]/gi, '');
}

function parseLimit(question) {
  const mTop = question.match(/top\s+(\d+)/i);
  if (mTop) return parseInt(mTop[1], 10);
  const mLimit = question.match(/limit\s+(\d+)/i);
  if (mLimit) return parseInt(mLimit[1], 10);
  const mPrimeros = question.match(/primer(?:os)?\s+(\d+)/i);
  if (mPrimeros) return parseInt(mPrimeros[1], 10);
  return null;
}

function parseOrderBy(question) {
  const orderRegex = /(ordenar por|order by)\s+([a-z_]+)(?:\s+(asc|desc))?/i;
  const m = question.match(orderRegex);
  if (!m) return null;
  return { column: sanitizeIdentifier(m[2]), direction: (m[3] || 'asc').toUpperCase() };
}

function parseWhereClauses(question, tableAlias) {
  const clauses = [];
  const params = [];

  // salary comparisons
  const salaryGt = question.match(/salario\s*(?:>|mayor que|superior a)\s*(\d+(?:[.,]\d+)?)/i);
  if (salaryGt) clauses.push(`${tableAlias}.salary > ${salaryGt[1].replace(',', '.')}`);
  const salaryGe = question.match(/salario\s*(?:>=|mayor o igual a)\s*(\d+(?:[.,]\d+)?)/i);
  if (salaryGe) clauses.push(`${tableAlias}.salary >= ${salaryGe[1].replace(',', '.')}`);
  const salaryLt = question.match(/salario\s*(?:<|menor que|inferior a)\s*(\d+(?:[.,]\d+)?)/i);
  if (salaryLt) clauses.push(`${tableAlias}.salary < ${salaryLt[1].replace(',', '.')}`);
  const salaryLe = question.match(/salario\s*(?:<=|menor o igual a)\s*(\d+(?:[.,]\d+)?)/i);
  if (salaryLe) clauses.push(`${tableAlias}.salary <= ${salaryLe[1].replace(',', '.')}`);
  const salaryBetween = question.match(/salario\s*(?:entre|between)\s*(\d+(?:[.,]\d+)?)\s*y\s*(\d+(?:[.,]\d+)?)/i);
  if (salaryBetween) clauses.push(`${tableAlias}.salary BETWEEN ${salaryBetween[1].replace(',', '.')} AND ${salaryBetween[2].replace(',', '.')}`);

  // department filter
  const depEq = question.match(/departamento\s*(?:=|igual a|es)\s*(\d+)/i);
  if (depEq) clauses.push(`${tableAlias}.department_id = ${depEq[1]}`);
  const depIn = question.match(/departamento(?:s)?\s*(?:en|in)\s*\(([^)]+)\)/i);
  if (depIn) {
    const list = depIn[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n));
    if (list.length) clauses.push(`${tableAlias}.department_id IN (${list.join(', ')})`);
  }

  // name like
  const lastNameLike = question.match(/apellido\s*(?:contiene|como|like)\s*'([^']+)'/i) || question.match(/apellido\s*contiene\s*(\w+)/i);
  if (lastNameLike) {
    const val = (lastNameLike[1] || '').toUpperCase();
    clauses.push(`UPPER(${tableAlias}.last_name) LIKE '%${val}%'`);
  }
  const nameStarts = question.match(/nombre\s*(?:empieza|comienza)\s*por\s*'([^']+)'/i);
  if (nameStarts) clauses.push(`UPPER(${tableAlias}.first_name) LIKE '${nameStarts[1].toUpperCase()}%'`);

  // null checks
  if (/(commission|comision).*(no\s+nulo|not\s+null)/i.test(question)) {
    clauses.push(`${tableAlias}.commission_pct IS NOT NULL`);
  } else if (/(commission|comision).*(nulo|null)/i.test(question)) {
    clauses.push(`${tableAlias}.commission_pct IS NULL`);
  }
  if (/sin\s+manager/i.test(question)) clauses.push(`${tableAlias}.manager_id IS NULL`);

  return clauses;
}

function detectMainTables(question) {
  const tables = [];
  if (/emplead/i.test(question)) tables.push('employees');
  if (/departament/i.test(question)) tables.push('departments');
  if (/job_history|historial/i.test(question)) tables.push('job_history');
  if (/jobs?|puesto/i.test(question)) tables.push('jobs');
  if (/region/i.test(question)) tables.push('regions');
  if (/countr|pa[ií]s/i.test(question)) tables.push('countries');
  if (/ubicaci|location/i.test(question)) tables.push('locations');
  return Array.from(new Set(tables));
}

function buildSelectWithJoin(question, dbClient) {
  const wantsJoin = /join|inner join|departament|nombre del departamento|por departamento|empleados y departamentos/i.test(question);
  const tables = detectMainTables(question);
  const useEmployees = tables.includes('employees') || wantsJoin;
  const useDepartments = tables.includes('departments') || /departament/i.test(question) || wantsJoin;

  // Aggregates
  const wantsAvg = /(promedio|avg)/i.test(question);
  const wantsSum = /(suma|sum)/i.test(question);
  const wantsMin = /(mínimo|min)/i.test(question);
  const wantsMax = /(máximo|max)/i.test(question);
  const wantsCount = /(cuenta|contar|count)/i.test(question);
  const groupByDepartment = /por departamento/i.test(question) || (useDepartments && (wantsAvg || wantsSum || wantsMin || wantsMax || wantsCount));
  const groupByYear = /(por\s+a(?:ñ|n)o\b|a(?:ñ|n)o\s+de\s+contrataci|contratad[oa]s?\s+por\s+a(?:ñ|n)o)/i.test(question);
  const groupByMonth = /(por\s+mes\b|mes\s+de\s+contrataci|contratad[oa]s?\s+por\s+mes)/i.test(question);

  // Base FROM and aliases
  let from = 'FROM employees e';
  const wantsAnyAgg = wantsCount || wantsAvg || wantsSum || wantsMin || wantsMax;
  let selectCols = wantsAnyAgg && !groupByDepartment && !groupByYear && !groupByMonth ? [] : ['e.*'];
  if (useDepartments) {
    from += ' INNER JOIN departments d ON e.department_id = d.department_id';
    if (!groupByDepartment && !wantsAnyAgg && !groupByYear && !groupByMonth) selectCols.push('d.department_name AS department_name');
  }

  // SELECT columns with aggregates
  const selectParts = [];
  if (wantsCount) selectParts.push('COUNT(*) AS total');
  if (wantsAvg) selectParts.push('AVG(e.salary) AS promedio_salario');
  if (wantsSum) selectParts.push('SUM(e.salary) AS suma_salario');
  if (wantsMin) selectParts.push('MIN(e.salary) AS minimo_salario');
  if (wantsMax) selectParts.push('MAX(e.salary) AS maximo_salario');

  if (groupByDepartment) {
    // show department with aggregates
    selectCols = [/*'d.department_id',*/ 'd.department_name'];
    if (selectParts.length === 0) selectParts.push('COUNT(*) AS total');
  }

  // WHERE
  const whereClauses = parseWhereClauses(question, 'e');

  // GROUP BY / HAVING
  let groupBy = '';
  let having = '';
  let yearExpr = '';
  let monthExpr = '';
  if (groupByYear || groupByMonth) {
    const client = (dbClient || process.env.DB_CLIENT || '').toLowerCase();
    yearExpr = client === 'oracledb' ? 'EXTRACT(YEAR FROM e.hire_date)' : "CAST(strftime('%Y', e.hire_date) AS INTEGER)";
    monthExpr = client === 'oracledb' ? 'EXTRACT(MONTH FROM e.hire_date)' : "CAST(strftime('%m', e.hire_date) AS INTEGER)";
    if (groupByYear && groupByMonth) {
      groupBy = `GROUP BY ${yearExpr}, ${monthExpr}`;
      selectCols = [yearExpr + ' AS year', monthExpr + ' AS month'];
    } else if (groupByYear) {
      groupBy = `GROUP BY ${yearExpr}`;
      selectCols = [yearExpr + ' AS year'];
    } else if (groupByMonth) {
      groupBy = `GROUP BY ${monthExpr}`;
      selectCols = [monthExpr + ' AS month'];
    }
    if (selectParts.length === 0) selectParts.push('COUNT(*) AS total');
  } else if (groupByDepartment) {
    groupBy = 'GROUP BY d.department_id, d.department_name';
    const havingMatch = question.match(/having\s*(?:>|<|=)\s*(\d+(?:[.,]\d+)?)/i) || question.match(/(mayor|menor)\s+que\s+(\d+(?:[.,]\d+)?)/i);
    if (havingMatch && (wantsAvg || wantsSum || wantsMin || wantsMax || wantsCount)) {
      const value = (havingMatch[1] || havingMatch[2]).replace(',', '.');
      const measure = wantsAvg ? 'AVG(e.salary)' : wantsSum ? 'SUM(e.salary)' : wantsMin ? 'MIN(e.salary)' : wantsMax ? 'MAX(e.salary)' : 'COUNT(*)';
      const op = /menor/i.test(question) ? '<' : '>';
      having = `HAVING ${measure} ${op} ${value}`;
    }
  }

  // ORDER BY
  const order = parseOrderBy(question);
  let orderBy = '';
  if (order) {
    const known = ['salary', 'hire_date', 'department_id', 'employee_id', 'last_name', 'first_name'];
    const col = known.includes(order.column) ? `e.${order.column}` : order.column === 'department_name' ? 'd.department_name' : `e.${order.column}`;
    orderBy = `ORDER BY ${col} ${order.direction}`;
  }

  // LIMIT / FETCH FIRST
  const limit = parseLimit(question);
  let limitClause = '';
  if (limit) {
    const client = (dbClient || process.env.DB_CLIENT || '').toLowerCase();
    if (client === 'oracledb') {
      limitClause = `FETCH FIRST ${limit} ROWS ONLY`;
    } else {
      limitClause = `LIMIT ${limit}`;
    }
  }

  const selectList = [...selectCols, ...selectParts].join(', ');
  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `SELECT ${selectList} ${from} ${where} ${groupBy} ${having} ${orderBy} ${limitClause}`.replace(/\s+/g, ' ').trim();
  return sql;
}

function generateQuery(userQuestion, dbClient) {
  // Si el usuario ya escribe SQL, devolver tal cual para ejecutar directamente
  if (/^\s*(select|with|insert|update|delete)\b/i.test(userQuestion)) {
    return userQuestion.trim();
  }

  const question = userQuestion.toLowerCase();
  
  // Primero, buscar en las consultas aprendidas
  const learnedQuery = findLearnedQuery(question);
  if (learnedQuery) {
    return learnedQuery;
  }

  // Comandos CRUD básicos
  if (question.includes('eliminar') || question.includes('borrar') || question.includes('delete')) {
    const idMatch = question.match(/id\s+(\d+)|empleado\s+(\d+)/);
    if (idMatch) {
      const id = idMatch[1] || idMatch[2];
      if (question.includes('empleado')) {
        return `DELETE FROM employees WHERE employee_id = ${id}`;
      }
      if (question.includes('departamento')) {
        return `DELETE FROM departments WHERE department_id = ${id}`;
      }
    }
  }
  
  if (question.includes('agregar') || question.includes('añadir') || question.includes('insertar')) {
    const salaryMatch = question.match(/salario\s+(\d+)/i);
    if (question.includes('empleado')) {
      let salary = salaryMatch ? salaryMatch[1] : '5000';
      return `INSERT INTO employees (first_name, last_name, phone_number, salary, email) VALUES ('John', 'Doe', NULL, ${salary}, 'john.doe@example.com')`;
    }
    if (question.includes('departamento')) {
      return `INSERT INTO departments (department_name, department_id) VALUES ('Nuevo Departamento', (SELECT NVL(MAX(department_id),0)+1 FROM departments))`;
    }
  }
  
  if (question.includes('actualizar') || question.includes('modificar') || question.includes('update') || question.includes('cambiar')) {
    const idMatch = question.match(/id\s+(\d+)|empleado\s+(\d+)/);
    if (idMatch) {
      const id = idMatch[1] || idMatch[2];
      if (question.includes('salario')) {
        const salaryMatch = question.match(/salario\s+(\d+)|a\s+(\d+)/i);
        const newSalary = salaryMatch ? (salaryMatch[1] || salaryMatch[2]) : '6000';
        if (question.includes('empleado')) {
          return `UPDATE employees SET salary = ${newSalary} WHERE employee_id = ${id}`;
        }
      }
      if (question.includes('departamento') && question.includes('nombre')) {
        return `UPDATE departments SET department_name = 'Nuevo Nombre' WHERE department_id = ${id}`;
      }
    }
  }

  // Consultas avanzadas: WHERE, JOIN, AGG, GROUP BY, ORDER BY, LIMIT
  if (/where|entre|between|in\s*\(|like|nulo|null|join|inner|promedio|avg|suma|sum|mínimo|min|máximo|max|contar|count|por departamento|ordenar por|order by|top\s+\d+|primeros?\s+\d+|limit\s+\d+/i.test(question)) {
    // Si se menciona empleados o se necesita datos de salarios, partir de employees con opcional join a departments
    return buildSelectWithJoin(question, dbClient);
  }

  // Buscar coincidencias en las reglas (READ)
  for (const [pattern, sql] of Object.entries(rules)) {
    if (question.includes(pattern)) {
      return sql;
    }
  }
  
  // Detección por palabras clave de tablas
  if (question.includes('regiones') || question.includes('region')) {
    return 'SELECT * FROM regions';
  }
  if (question.includes('países') || question.includes('pais') || question.includes('countries')) {
    return 'SELECT * FROM countries';
  }
  if (question.includes('ubicacion') || question.includes('locations')) {
    return 'SELECT * FROM locations';
  }
  if (question.includes('trabajo') || question.includes('job')) {
    if (question.includes('historial')) {
      return 'SELECT * FROM job_history';
    }
    return 'SELECT * FROM jobs';
  }
  if (question.includes('departamento') || question.includes('department')) {
    return 'SELECT * FROM departments';
  }
  if (question.includes('empleado') || question.includes('employee')) {
    return 'SELECT * FROM employees';
  }

  // Palabras clave genéricas
  const tableKeywords = {
    'regiones': 'SELECT * FROM regions',
    'regions': 'SELECT * FROM regions',
    'países': 'SELECT * FROM countries',
    'countries': 'SELECT * FROM countries',
    'ubicaciones': 'SELECT * FROM locations',
    'locations': 'SELECT * FROM locations',
    'jobs': 'SELECT * FROM jobs',
    'historial': 'SELECT * FROM job_history',
    'job_history': 'SELECT * FROM job_history'
  };
  for (const [keyword, sql] of Object.entries(tableKeywords)) {
    if (question.includes(keyword)) {
      return sql;
    }
  }

  // Consulta por defecto
  const client = (dbClient || process.env.DB_CLIENT || '').toLowerCase();
  const defaultQuery = client === 'oracledb'
    ? 'SELECT * FROM employees FETCH FIRST 5 ROWS ONLY'
    : 'SELECT * FROM employees LIMIT 5';
  return defaultQuery;
}

// Función mejorada para generar consultas con aprendizaje
async function generateQueryWithLearning(userQuestion) {
  const sql = generateQuery(userQuestion);
  return sql;
}

async function executeQuery(sql) {
  try {
    const result = await db.raw(sql);
    return result;
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
    throw error;
  }
}

module.exports = { generateQuery, executeQuery };
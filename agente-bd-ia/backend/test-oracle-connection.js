require('dotenv').config();
const knex = require('knex')(require('./knexfile').development);

async function testConnection() {
  try {
    console.log('🔄 Probando conexión con Oracle...');
    console.log(`Cliente: ${process.env.DB_CLIENT}`);
    console.log(`Usuario: ${process.env.DB_USER}`);
    
    // Probar consulta simple
    const result = await knex.raw('SELECT COUNT(*) as total FROM employees');
    
    // Resultado de Oracle puede venir en diferentes formatos
    let total = 0;
    if (result.rows && result.rows.length > 0) {
      total = result.rows[0].TOTAL || result.rows[0].total;
    } else if (Array.isArray(result) && result.length > 0) {
      total = result[0].TOTAL || result[0].total;
    }
    
    console.log('✅ Conexión exitosa!');
    console.log(`📊 Total de empleados en Oracle: ${total}`);
    
    // Probar departamentos
    const deptResult = await knex.raw('SELECT COUNT(*) as total FROM departments');
    let totalDept = 0;
    if (deptResult.rows && deptResult.rows.length > 0) {
      totalDept = deptResult.rows[0].TOTAL || deptResult.rows[0].total;
    } else if (Array.isArray(deptResult) && deptResult.length > 0) {
      totalDept = deptResult[0].TOTAL || deptResult[0].total;
    }
    
    console.log(`📊 Total de departamentos en Oracle: ${totalDept}`);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n💡 Verifica:');
    console.log('  1. Que Oracle esté corriendo');
    console.log('  2. Las credenciales en el archivo .env');
    console.log('  3. Que el esquema HR esté instalado');
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

testConnection();





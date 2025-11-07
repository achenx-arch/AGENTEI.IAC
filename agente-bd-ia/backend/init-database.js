const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig.development);

async function initDatabase() {
  try {
    console.log('Inicializando base de datos...');
    
    // Crear tabla empleados
    await db.schema.dropTableIfExists('employees');
    await db.schema.createTable('employees', (table) => {
      table.increments('id').primary();
      table.string('first_name', 50);
      table.string('last_name', 50);
      table.string('email', 100);
      table.string('phone_number', 20);
      table.date('hire_date');
      table.string('job_id', 20);
      table.decimal('salary', 8, 2);
      table.decimal('commission_pct', 2, 2);
      table.integer('manager_id');
      table.integer('department_id');
    });

    // Crear tabla departamentos
    await db.schema.dropTableIfExists('departments');
    await db.schema.createTable('departments', (table) => {
      table.increments('id').primary();
      table.string('name', 50);
      table.integer('manager_id');
      table.integer('location_id');
    });

    // Insertar datos de prueba
    await db('departments').insert([
      { id: 10, name: 'Administration', manager_id: 200, location_id: 1700 },
      { id: 20, name: 'Marketing', manager_id: 201, location_id: 1800 },
      { id: 30, name: 'Purchasing', manager_id: 114, location_id: 1700 },
      { id: 40, name: 'Human Resources', manager_id: 203, location_id: 2400 },
      { id: 50, name: 'Shipping', manager_id: 121, location_id: 1500 },
      { id: 60, name: 'IT', manager_id: 103, location_id: 1400 },
      { id: 70, name: 'Public Relations', manager_id: 204, location_id: 2700 },
      { id: 80, name: 'Sales', manager_id: 145, location_id: 2500 },
      { id: 90, name: 'Executive', manager_id: 100, location_id: 1700 },
      { id: 100, name: 'Finance', manager_id: 108, location_id: 1700 },
      { id: 110, name: 'Accounting', manager_id: 205, location_id: 1700 }
    ]);

    await db('employees').insert([
      { id: 100, first_name: 'Steven', last_name: 'King', email: 'SKING', phone_number: '515.123.4567', hire_date: '2003-06-17', job_id: 'AD_PRES', salary: 24000.00, commission_pct: null, manager_id: null, department_id: 90 },
      { id: 101, first_name: 'Neena', last_name: 'Kochhar', email: 'NKOCHHAR', phone_number: '515.123.4568', hire_date: '2005-09-21', job_id: 'AD_VP', salary: 17000.00, commission_pct: null, manager_id: 100, department_id: 90 },
      { id: 102, first_name: 'Lex', last_name: 'De Haan', email: 'LDEHAAN', phone_number: '515.123.4569', hire_date: '2001-01-13', job_id: 'AD_VP', salary: 17000.00, commission_pct: null, manager_id: 100, department_id: 90 },
      { id: 103, first_name: 'Alexander', last_name: 'Hunold', email: 'AHUNOLD', phone_number: '590.423.4567', hire_date: '2006-01-03', job_id: 'IT_PROG', salary: 9000.00, commission_pct: null, manager_id: 102, department_id: 60 },
      { id: 104, first_name: 'Bruce', last_name: 'Ernst', email: 'BERNST', phone_number: '590.423.4568', hire_date: '2007-05-21', job_id: 'IT_PROG', salary: 6000.00, commission_pct: null, manager_id: 103, department_id: 60 },
      { id: 105, first_name: 'David', last_name: 'Austin', email: 'DAUSTIN', phone_number: '590.423.4569', hire_date: '2005-06-25', job_id: 'IT_PROG', salary: 4800.00, commission_pct: null, manager_id: 103, department_id: 60 },
      { id: 106, first_name: 'Valli', last_name: 'Pataballa', email: 'VPATABAL', phone_number: '590.423.4560', hire_date: '2006-02-05', job_id: 'IT_PROG', salary: 4800.00, commission_pct: null, manager_id: 103, department_id: 60 },
      { id: 107, first_name: 'Diana', last_name: 'Lorentz', email: 'DLORENTZ', phone_number: '590.423.5567', hire_date: '2007-02-07', job_id: 'IT_PROG', salary: 4200.00, commission_pct: null, manager_id: 103, department_id: 60 },
      { id: 108, first_name: 'Nancy', last_name: 'Greenberg', email: 'NGREENBE', phone_number: '515.124.4569', hire_date: '2002-08-17', job_id: 'FI_MGR', salary: 12008.00, commission_pct: null, manager_id: 101, department_id: 100 },
      { id: 109, first_name: 'Daniel', last_name: 'Faviet', email: 'DFAVIET', phone_number: '515.124.4169', hire_date: '2002-08-16', job_id: 'FI_ACCOUNT', salary: 9000.00, commission_pct: null, manager_id: 108, department_id: 100 },
      { id: 110, first_name: 'John', last_name: 'Chen', email: 'JCHEN', phone_number: '515.124.4269', hire_date: '2005-09-28', job_id: 'FI_ACCOUNT', salary: 8200.00, commission_pct: null, manager_id: 108, department_id: 100 }
    ]);

    console.log(' Base de datos inicializada correctamente');
    console.log('Datos insertados:');
    console.log('   - 11 departamentos');
    console.log('   - 11 empleados');
    console.log('');
    console.log(' Ahora puedes probar tu agente IA!');
    
  } catch (error) {
    console.error(' Error inicializando base de datos:', error);
  } finally {
    await db.destroy();
  }
}

initDatabase();









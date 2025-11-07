require('dotenv').config();

module.exports = {
  development: {
    client: process.env.DB_CLIENT || 'oracledb',
    connection: process.env.DB_CLIENT === 'oracledb' ? {
      user: process.env.DB_USER || 'HR',
      password: process.env.DB_PASSWORD,
      connectString: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '1521'}/${process.env.DB_SERVICE || 'XE'}`,
      schema: process.env.DB_SCHEMA || 'HR'
    } : {
      filename: './database.sqlite'
    },
    useNullAsDefault: process.env.DB_CLIENT !== 'oracledb',
    pool: { min: 0, max: 7 }
  }
};

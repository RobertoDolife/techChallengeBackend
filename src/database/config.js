const {env} = require('../common/env')

module.exports = {
  development: {
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: "SchoolOnDb",
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    dialect: "mysql",
    migrationStorageTableName: "migrations",
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: "SchoolOnDb",
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    dialect: "mysql",
    migrationStorageTableName: "migrations",
  },
};
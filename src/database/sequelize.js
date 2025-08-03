const { Sequelize } = require('sequelize')

const { env } = require('../common/env')

exports.sequelize = new Sequelize(`mysql://${env.DATABASE_USERNAME}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/SchoolOnDb`, { logging: false })
/** @type {import('jest').Config} */
const config = {
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  moduleNameMapper: {
    '#/(.+)$': ['<rootDir>/src/$1']
  }
}

module.exports = config
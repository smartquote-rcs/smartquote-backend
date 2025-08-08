import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@infra/(.*)$': '<rootDir>/src/infra/$1'
  }
};

export default config;

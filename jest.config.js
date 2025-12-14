/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],

    // Module path aliases matching tsconfig
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/__mocks__/chrome.ts'],

    // Coverage configuration
    collectCoverageFrom: [
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/**/__mocks__/**',
    ],
    coverageThreshold: {
        global: {
            branches: 10,
            functions: 25,
            lines: 15,
            statements: 15,
        },
    },
    coverageReporters: ['text', 'text-summary', 'html'],
    coverageDirectory: 'coverage',

    // Transform configuration
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },

    // Ignore patterns
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
};

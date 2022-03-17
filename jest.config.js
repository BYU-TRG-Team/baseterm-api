module.exports = {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/__tests__/**/*.test.ts"],
  "globals": {
    "ts-jest": {
      "diagnostics": {
        "ignoreCodes": ["TS7006", "TS7005", "TS7034"]
      }
    }
  },
  "collectCoverage": true,
  "coveragePathIgnorePatterns": ["/app/", "/RestTools/"],
  "collectCoverageFrom": ["src/**/*.ts"],
  "coverageThreshold": {
    "global": {
      "branches": 0,
      "functions": 0,
      "lines": 0,
      "statements": 0
    }
  },

  "coverageReporters": ["json", "html"],
  "reporters": ["default"]
};
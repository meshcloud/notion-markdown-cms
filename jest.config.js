module.exports = {
  transform: {
    "^.+\\.ts?$": "ts-jest",
    "^.+\\markdown-table.js?$": "ts-jest",
  },
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  testEnvironment: "node",
  testRegex: "./src/.*\\.(test|spec)?\\.(ts|ts)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  roots: ["<rootDir>/src"],
};

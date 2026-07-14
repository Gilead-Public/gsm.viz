module.exports = {
  //moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: "jsdom",
  //extensionsToTreatAsEsm: ['.ts'],
  setupFiles: ["jest-canvas-mock"],
  testPathIgnorePatterns: ["/app/", "/examples/", "/node_modules/"],
  //testPathPattern: '/tests/',
  //testEnvironment: 'jest-environment-node',
  //transform: {},
  transformIgnorePatterns: ["node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)"],
};

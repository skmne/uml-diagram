module.exports = {
  roots: ['<rootDir>/test'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    '/node_modules/(?!(d3|d3-.*|internmap|delaunator|robust-predicates)/)',
  ],
};

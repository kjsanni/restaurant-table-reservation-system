module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:8080/"],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        "first-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        interactive: ["error", { maxNumericValue: 3500 }],
      },
    },
  },
};

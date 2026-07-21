const benchmarkDAO = require("../DAOs/benchmark.dao");

const getBenchmarksHandler = async (req, res) => {
  try {
    const planFilter = req.query.plan || null;
    const data = await benchmarkDAO.getPlatformBenchmarks(planFilter);
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("Benchmark query error:", err);
    res.status(500).json({ success: false, message: "Failed to load benchmarks" });
  }
};

module.exports = {
  getBenchmarksHandler,
};

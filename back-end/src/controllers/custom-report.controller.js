const customReportService = require("../services/customReport.service");

const getReportSourcesHandler = async (req, res) => {
  try {
    const sources = customReportService.getAvailableSources();
    return res.status(200).json({ success: true, sources });
  } catch (err) {
    console.error("getReportSourcesHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load report sources" });
  }
};

const runCustomReportHandler = async (req, res) => {
  try {
    const config = req.body;
    if (!config || !config.source) {
      return res.status(400).json({ success: false, message: "Report source is required" });
    }

    const result = await customReportService.buildCustomReport(config, req.tenant?.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("runCustomReportHandler error:", err.message);
    const status = err.status || 500;
    if (status === 500) {
      return res.status(500).json({ success: false, message: "Failed to generate report" });
    }
    return res.status(status).json({ success: false, message: err.message || "Failed to generate report" });
  }
};

const exportCustomReportCSVHandler = async (req, res) => {
  try {
    const config = req.body;
    if (!config || !config.source) {
      return res.status(400).json({ success: false, message: "Report source is required" });
    }

    const result = await customReportService.buildCustomReport(config, req.tenant?.id);
    const rows = result.data || [];

    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No data to export" });
    }

    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(",")];

    for (const row of rows) {
      const values = headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(values.join(","));
    }

    const csv = csvRows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=custom-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("exportCustomReportCSVHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to export report" });
  }
};

module.exports = {
  getReportSourcesHandler,
  runCustomReportHandler,
  exportCustomReportCSVHandler,
};

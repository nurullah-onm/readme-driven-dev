function formatText(report) {
  let output = "";
  output += `STATUS: ${report.status}\n`;
  output += `ROOT: ${report.root}\n`;
  output += `README: ${report.readme}\n`;
  output += `ERRORS: ${report.errors.length}\n`;
  if (report.errors.length > 0) {
    for (const error of report.errors) {
      output += `- ${error.code} ${error.detail}\n`;
    }
  }
  return output;
}

module.exports = { formatText };

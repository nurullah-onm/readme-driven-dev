function formatJson(report) {
  const lines = [];
  lines.push("{");
  lines.push(`  \"status\": ${JSON.stringify(report.status)},`);
  lines.push(`  \"root\": ${JSON.stringify(report.root)},`);
  lines.push(`  \"readme\": ${JSON.stringify(report.readme)},`);
  if (report.errors.length === 0) {
    lines.push("  \"errors\": []");
  } else {
    lines.push("  \"errors\": [");
    for (let i = 0; i < report.errors.length; i += 1) {
      const error = report.errors[i];
      const line = `    { \"code\": ${JSON.stringify(error.code)}, \"detail\": ${JSON.stringify(error.detail)} }`;
      const suffix = i === report.errors.length - 1 ? "" : ",";
      lines.push(`${line}${suffix}`);
    }
    lines.push("  ]");
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

module.exports = { formatJson };

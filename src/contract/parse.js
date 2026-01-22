const { CODES, createError } = require("../errors");
const { validateContract } = require("./validate");

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n");
}

function extractContract(readmeContent) {
  const normalized = normalizeNewlines(readmeContent);
  const match = normalized.match(/```rdd-contract\n([\s\S]*?)\n```/);
  if (!match) {
    throw createError(CODES.README_CONTRACT_MISSING, "rdd-contract");
  }
  const raw = match[1];
  let contract;
  try {
    contract = JSON.parse(raw);
  } catch (err) {
    throw createError(CODES.README_CONTRACT_INVALID_JSON, "rdd-contract");
  }
  if (!validateContract(contract)) {
    throw createError(CODES.README_CONTRACT_INVALID_JSON, "rdd-contract");
  }
  return { contract, raw };
}

function parseTreeLine(line) {
  const match = line.match(/^((?:\|   |    )*)(\|-- |\\-- )(.*)$/);
  if (!match) {
    return null;
  }
  const prefix = match[1];
  const name = match[3].trim();
  if (!name) {
    return null;
  }
  if (prefix.length % 4 !== 0) {
    return null;
  }
  return { depth: prefix.length / 4, name };
}

function extractTree(readmeContent) {
  const normalized = normalizeNewlines(readmeContent);
  const match = normalized.match(/```rdd-tree\n([\s\S]*?)\n```/);
  if (!match) {
    throw createError(CODES.README_TREE_MISSING, "rdd-tree");
  }
  const lines = match[1]
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw createError(CODES.README_TREE_MISSING, "rdd-tree");
  }
  const rootLine = lines[0].trim();
  const rootLabel = rootLine.endsWith("/") ? rootLine.slice(0, -1) : rootLine;
  const paths = [];
  const stack = [];
  for (let i = 1; i < lines.length; i += 1) {
    const entry = parseTreeLine(lines[i]);
    if (!entry) {
      throw createError(CODES.README_TREE_MISSING, "rdd-tree");
    }
    const trimmedName = entry.name.endsWith("/")
      ? entry.name.slice(0, -1)
      : entry.name;
    stack.length = entry.depth;
    stack[entry.depth] = trimmedName;
    paths.push(stack.join("/"));
  }
  return { rootLabel, paths };
}

function extractOutputs(readmeContent) {
  const normalized = normalizeNewlines(readmeContent);
  const lines = normalized.split("\n");
  const outputs = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^Output ID:\s*(\S+)\s*$/);
    if (!match) {
      continue;
    }
    const id = match[1];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") {
      j += 1;
    }
    if (j >= lines.length || lines[j].trim() !== "```rdd-output") {
      outputs.push({ id, missing: true });
      continue;
    }
    j += 1;
    const contentLines = [];
    while (j < lines.length && lines[j].trim() !== "```") {
      contentLines.push(lines[j]);
      j += 1;
    }
    if (j >= lines.length) {
      outputs.push({ id, missing: true });
      break;
    }
    const content = contentLines.join("\n") + "\n";
    outputs.push({ id, content });
    i = j;
  }
  return outputs;
}

module.exports = { normalizeNewlines, extractContract, extractTree, extractOutputs };

const fs = require("fs");
const path = require("path");
const { CODES, createError } = require("./errors");
const { extractContract, extractTree, extractOutputs, normalizeNewlines } = require("./contract/parse");
const { loadCodeInventory } = require("./code/load");
const { compareContractAndInventory } = require("./code/compare");
const { formatText } = require("./report/format-text");
const { formatJson } = require("./report/format-json");

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    command: null,
    help: false,
    version: false,
    error: null,
    formatProvided: false,
    options: {
      root: ".",
      readme: "README.md",
      format: "text"
    }
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      result.help = true;
      return result;
    }
    if (arg === "--version") {
      result.version = true;
      return result;
    }
    if (!result.command && !arg.startsWith("-")) {
      result.command = arg;
      continue;
    }
    if (arg === "--root") {
      if (i + 1 >= args.length) {
        result.error = "missing_root";
        return result;
      }
      result.options.root = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--readme") {
      if (i + 1 >= args.length) {
        result.error = "missing_readme";
        return result;
      }
      result.options.readme = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--format") {
      if (i + 1 >= args.length) {
        result.error = "missing_format";
        return result;
      }
      result.options.format = args[i + 1];
      result.formatProvided = true;
      i += 1;
      continue;
    }
    if (!arg.startsWith("-")) {
      result.error = "unknown_arg";
      return result;
    }
    result.error = "unknown_flag";
    return result;
  }

  return result;
}

function loadPackageVersion() {
  const packagePath = path.resolve(__dirname, "..", "package.json");
  const raw = fs.readFileSync(packagePath, "utf8");
  const data = JSON.parse(raw);
  return data.version;
}

function helpText() {
  return [
    "Usage: rdd <komut> [flag]",
    "",
    "Commands:",
    "  verify",
    "  parse",
    "",
    "Global flags:",
    "  -h, --help",
    "  --version",
    "",
    "verify flags:",
    "  --root <path>",
    "  --readme <path>",
    "  --format <text|json>",
    "",
    "parse flags:",
    "  --root <path>",
    "  --readme <path>"
  ].join("\n");
}

function readFileOrThrow(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function pushError(errors, seen, code, detail) {
  const key = `${code}|${detail}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  errors.push(createError(code, detail));
}

function verifyCommand(options, stdout) {
  const errors = [];
  const seen = new Set();
  const rootArg = options.root;
  const readmeArg = options.readme;
  const rootPath = path.resolve(process.cwd(), rootArg);
  const readmePath = path.resolve(rootPath, readmeArg);

  let readmeContent;
  try {
    readmeContent = readFileOrThrow(readmePath);
  } catch (err) {
    return 3;
  }

  let contract;
  try {
    contract = extractContract(readmeContent).contract;
  } catch (err) {
    if (err && err.code) {
      pushError(errors, seen, err.code, err.detail);
      const report = {
        status: "fail",
        root: rootArg,
        readme: readmeArg,
        errors
      };
      if (options.format === "json") {
        stdout.write(formatJson(report));
      } else {
        stdout.write(formatText(report));
      }
      return 2;
    }
    return 3;
  }

  let tree;
  try {
    tree = extractTree(readmeContent);
  } catch (err) {
    if (err && err.code === CODES.README_TREE_MISSING) {
      pushError(errors, seen, err.code, err.detail);
    } else if (err && err.code) {
      pushError(errors, seen, err.code, err.detail);
    } else if (err) {
      return 3;
    }
  }

  const outputs = extractOutputs(readmeContent);
  for (const output of outputs) {
    if (output.missing) {
      pushError(errors, seen, CODES.OUTPUT_MISSING, output.id);
    }
  }

  let inventory;
  let inventoryValid = true;
  try {
    inventory = loadCodeInventory(rootPath);
  } catch (err) {
    inventoryValid = false;
    if (err && err.code) {
      pushError(errors, seen, err.code, err.detail);
    } else {
      return 3;
    }
  }

  if (inventoryValid) {
    const mismatches = compareContractAndInventory(contract, inventory);
    for (const mismatch of mismatches) {
      pushError(errors, seen, CODES.CONTRACT_MISMATCH, mismatch);
    }
  }

  for (const configPath of contract.configFiles) {
    const fullPath = path.resolve(rootPath, configPath);
    if (!fs.existsSync(fullPath)) {
      pushError(errors, seen, CODES.MISSING_PATH, configPath);
    }
  }

  if (tree) {
    if (tree.rootLabel) {
      const rootLabel = tree.rootLabel;
      if (path.basename(rootPath) !== rootLabel) {
        pushError(errors, seen, CODES.MISSING_PATH, rootLabel);
      }
    }
    for (const treePath of tree.paths) {
      const fullPath = path.resolve(rootPath, treePath);
      if (!fs.existsSync(fullPath)) {
        pushError(errors, seen, CODES.MISSING_PATH, treePath);
      }
    }
  }

  const exampleIds = Object.keys(contract.examples);
  for (const id of exampleIds) {
    const examplePath = contract.examples[id];
    const fullPath = path.resolve(rootPath, examplePath);
    if (!fs.existsSync(fullPath)) {
      pushError(errors, seen, CODES.MISSING_PATH, examplePath);
    }
  }

  for (const output of outputs) {
    if (output.missing) {
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(contract.examples, output.id)) {
      pushError(errors, seen, CODES.CONTRACT_MISMATCH, `examples.${output.id}`);
      continue;
    }
    const examplePath = contract.examples[output.id];
    const fullPath = path.resolve(rootPath, examplePath);
    if (!fs.existsSync(fullPath)) {
      pushError(errors, seen, CODES.MISSING_PATH, examplePath);
      continue;
    }
    const fileContent = normalizeNewlines(readFileOrThrow(fullPath));
    const outputContent = normalizeNewlines(output.content);
    if (fileContent !== outputContent) {
      pushError(errors, seen, CODES.OUTPUT_MISMATCH, examplePath);
    }
  }

  const status = errors.length === 0 ? "ok" : "fail";
  const report = {
    status,
    root: rootArg,
    readme: readmeArg,
    errors
  };

  if (options.format === "json") {
    stdout.write(formatJson(report));
  } else {
    stdout.write(formatText(report));
  }

  if (!inventoryValid) {
    return 2;
  }

  return errors.length === 0 ? 0 : 1;
}

function parseCommand(options, stdout) {
  const rootArg = options.root;
  const readmeArg = options.readme;
  const rootPath = path.resolve(process.cwd(), rootArg);
  const readmePath = path.resolve(rootPath, readmeArg);

  let readmeContent;
  try {
    readmeContent = readFileOrThrow(readmePath);
  } catch (err) {
    return 3;
  }

  let contractResult;
  try {
    contractResult = extractContract(readmeContent);
  } catch (err) {
    if (err && err.code === CODES.README_CONTRACT_MISSING) {
      return 2;
    }
    if (err && err.code === CODES.README_CONTRACT_INVALID_JSON) {
      return 2;
    }
    return 3;
  }

  stdout.write(`${contractResult.raw}\n`);
  return 0;
}

function run(argv, stdout) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    stdout.write(`${helpText()}\n`);
    return 0;
  }
  if (parsed.version) {
    stdout.write(`${loadPackageVersion()}\n`);
    return 0;
  }
  if (parsed.error) {
    return 3;
  }
  if (parsed.formatProvided && parsed.command !== "verify") {
    return 3;
  }
  if (parsed.command === "verify") {
    if (parsed.options.format !== "text" && parsed.options.format !== "json") {
      return 3;
    }
    return verifyCommand(parsed.options, stdout);
  }
  if (parsed.command === "parse") {
    return parseCommand(parsed.options, stdout);
  }
  return 3;
}

module.exports = { run };

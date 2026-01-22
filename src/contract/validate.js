function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateContract(contract) {
  if (!isObject(contract)) {
    return false;
  }
  if (!isStringArray(contract.globalFlags)) {
    return false;
  }
  if (!isObject(contract.commands)) {
    return false;
  }
  const commandKeys = Object.keys(contract.commands);
  for (const key of commandKeys) {
    const command = contract.commands[key];
    if (!isObject(command)) {
      return false;
    }
    if (!isStringArray(command.flags)) {
      return false;
    }
  }
  if (!isStringArray(contract.env)) {
    return false;
  }
  if (!isStringArray(contract.configFiles)) {
    return false;
  }
  if (!isObject(contract.examples)) {
    return false;
  }
  const exampleKeys = Object.keys(contract.examples);
  for (const key of exampleKeys) {
    if (typeof contract.examples[key] !== "string") {
      return false;
    }
  }
  return true;
}

module.exports = { validateContract, isObject, isStringArray };

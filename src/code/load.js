const fs = require("fs");
const path = require("path");
const { CODES, createError } = require("../errors");
const { isObject, isStringArray } = require("../contract/validate");

function validateCodeInventory(data) {
  if (!isObject(data)) {
    return false;
  }
  if (!isStringArray(data.globalFlags)) {
    return false;
  }
  if (!isObject(data.commands)) {
    return false;
  }
  const commandKeys = Object.keys(data.commands);
  for (const key of commandKeys) {
    const command = data.commands[key];
    if (!isObject(command)) {
      return false;
    }
    if (!isStringArray(command.flags)) {
      return false;
    }
  }
  if (!isStringArray(data.env)) {
    return false;
  }
  if (!isStringArray(data.configFiles)) {
    return false;
  }
  return true;
}

function loadCodeInventory(rootPath) {
  const filePath = path.join(rootPath, ".rdd", "code.json");
  if (!fs.existsSync(filePath)) {
    throw createError(CODES.CODE_INVENTORY_MISSING, ".rdd/code.json");
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    throw createError(CODES.CODE_INVENTORY_INVALID_JSON, ".rdd/code.json");
  }
  if (!validateCodeInventory(data)) {
    throw createError(CODES.CODE_INVENTORY_INVALID_JSON, ".rdd/code.json");
  }
  return data;
}

module.exports = { loadCodeInventory };

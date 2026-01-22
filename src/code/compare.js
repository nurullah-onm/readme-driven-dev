function arraysEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

function compareContractAndInventory(contract, inventory) {
  const mismatches = [];
  if (!arraysEqual(contract.globalFlags, inventory.globalFlags)) {
    mismatches.push("globalFlags");
  }
  if (!arraysEqual(contract.env, inventory.env)) {
    mismatches.push("env");
  }
  if (!arraysEqual(contract.configFiles, inventory.configFiles)) {
    mismatches.push("configFiles");
  }

  const contractCommands = Object.keys(contract.commands);
  const inventoryCommands = Object.keys(inventory.commands);
  for (const command of contractCommands) {
    if (!Object.prototype.hasOwnProperty.call(inventory.commands, command)) {
      mismatches.push(`commands.${command}`);
      continue;
    }
    const contractFlags = contract.commands[command].flags;
    const inventoryFlags = inventory.commands[command].flags;
    if (!arraysEqual(contractFlags, inventoryFlags)) {
      mismatches.push(`commands.${command}.flags`);
    }
  }
  for (const command of inventoryCommands) {
    if (!Object.prototype.hasOwnProperty.call(contract.commands, command)) {
      mismatches.push(`commands.${command}`);
    }
  }

  return mismatches;
}

module.exports = { compareContractAndInventory };

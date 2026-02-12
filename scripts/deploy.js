const hre = require("hardhat");

async function main() {

  // Deploy Vehicle Registry
  const VehicleRegistry = await hre.ethers.getContractFactory("VehicleRegistry");
  const registry = await VehicleRegistry.deploy();
  await registry.waitForDeployment();

  console.log("VehicleRegistry deployed to:", await registry.getAddress());

  // Deploy Alert System
  const AlertSystem = await hre.ethers.getContractFactory("AlertSystem");
  const alertSystem = await AlertSystem.deploy(await registry.getAddress());
  await alertSystem.waitForDeployment();

  console.log("AlertSystem deployed to:", await alertSystem.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
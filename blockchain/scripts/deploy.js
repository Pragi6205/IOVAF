const hre = require("hardhat");

async function main() {

  // Deploy Vehicle Registry
  const VehicleRegistry = await hre.ethers.getContractFactory("VehicleRegistry");
  const registry = await VehicleRegistry.deploy();
  await registry.waitForDeployment();

  console.log("VehicleRegistry deployed to:", await registry.getAddress());

  // Deploy Edge Server Registry (RSUs and Edge Infrastructure)
  const EdgeServerRegistry = await hre.ethers.getContractFactory("EdgeServerRegistry");
  const edgeServerRegistry = await EdgeServerRegistry.deploy();
  await edgeServerRegistry.waitForDeployment();

  console.log("EdgeServerRegistry deployed to:", await edgeServerRegistry.getAddress());

  // Deploy Alert System (requires both VehicleRegistry and EdgeServerRegistry addresses)
  const AlertSystem = await hre.ethers.getContractFactory("AlertSystem");
  const alertSystem = await AlertSystem.deploy(
    await registry.getAddress(),
    await edgeServerRegistry.getAddress()
  );
  await alertSystem.waitForDeployment();

  console.log("AlertSystem deployed to:", await alertSystem.getAddress());

  console.log("\n=== Deployment Complete ===");
  console.log("VehicleRegistry:", await registry.getAddress());
  console.log("EdgeServerRegistry:", await edgeServerRegistry.getAddress());
  console.log("AlertSystem:", await alertSystem.getAddress());
  console.log("============================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const HealthcareSystem = await hre.ethers.getContractFactory("HealthcareSystem");
  const healthcareSystem = await HealthcareSystem.deploy();

  await healthcareSystem.deployed();

  console.log("HealthcareSystem deployed to:", healthcareSystem.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

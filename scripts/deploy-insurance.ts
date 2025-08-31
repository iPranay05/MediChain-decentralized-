import { ethers } from "hardhat";

async function main() {
  const InsuranceManager = await ethers.getContractFactory("InsuranceManager");
  const insuranceManager = await InsuranceManager.deploy();

  await insuranceManager.deployed();

  console.log(`InsuranceManager deployed to ${insuranceManager.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

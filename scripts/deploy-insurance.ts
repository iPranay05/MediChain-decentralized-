const { ethers } = require("hardhat");

async function deployInsurance() {
  const InsuranceManager = await ethers.getContractFactory("InsuranceManager");
  const insuranceManager = await InsuranceManager.deploy();

  await insuranceManager.deployed();

  console.log(`InsuranceManager deployed to ${insuranceManager.address}`);
}

deployInsurance().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

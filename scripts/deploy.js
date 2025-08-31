async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const HealthcareSystem = await ethers.getContractFactory("HealthcareSystem");
  const healthcareSystem = await HealthcareSystem.deploy();

  await healthcareSystem.deployed();

  console.log("HealthcareSystem deployed to:", healthcareSystem.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

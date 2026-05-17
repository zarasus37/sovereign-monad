const hre = require("hardhat");

const LIVE_REVENUE_ROUTER_ADDRESS = "0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982";

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer configured.");
  }

  const revenueRouter = process.env.EMERGENCE_RECORDER_REVENUE_ROUTER || LIVE_REVENUE_ROUTER_ADDRESS;
  const EmergenceRecorder = await ethers.getContractFactory("EmergenceRecorder", deployer);
  const deploymentTx = await EmergenceRecorder.getDeployTransaction(revenueRouter);
  const [gas, feeData, balance, network] = await Promise.all([
    deployer.estimateGas(deploymentTx),
    ethers.provider.getFeeData(),
    ethers.provider.getBalance(deployer.address),
    ethers.provider.getNetwork(),
  ]);
  const gasPrice = feeData.gasPrice || 0n;
  const estimatedCost = gas * gasPrice;

  console.log(JSON.stringify({
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    revenueRouter,
    estimatedGas: gas.toString(),
    gasPriceWei: gasPrice.toString(),
    estimatedCostMON: ethers.formatEther(estimatedCost),
    deployerBalanceMON: ethers.formatEther(balance),
    deployerCanAfford: balance >= estimatedCost,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

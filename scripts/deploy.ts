import { ethers } from 'hardhat';
import { MYC, STAKING, WETH } from '../constants';

async function main() {
  const Compounder = await ethers.getContractFactory('RewardCompounder');
  const compounder = await Compounder.deploy(WETH, MYC, STAKING);
  await compounder.deployed();
  console.log(`RewardCompounder deployed to ${compounder.address}`);

  const BalancerStrategy = await ethers.getContractFactory(`BalancerSellingStrategy`);
  const balancerStrat = await BalancerStrategy.deploy();

  await compounder.setStrategy(balancerStrat.address);

  // TODO: Add RewardCompounder address as handler in RewardTracker
  // await rewardTracker.setHandler(compounder.address, true);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

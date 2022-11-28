import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import { ethers, network } from 'hardhat';
import { GOV, MYC, STAKING, WETH } from '../constants';
import { impersonateAndRun } from './utils';

describe('@e2e RewardCompounder', () => {
  async function fixture() {
    network.config.gasPrice = 100000000; // 0.1 gwei arbi std
    await network.provider.request({
      method: `hardhat_reset`,
      params: [
        {
          forking: {
            jsonRpcUrl: 'https://arb1.arbitrum.io/rpc'
          }
        }
      ]
    });

    const addressWithMycStaked = `0x887ee05cd6457e2980ff54f14d8d65df53dac543`;

    const RewardCompounder = await ethers.getContractFactory('RewardCompounder');
    const rewardCompounder = await RewardCompounder.deploy(WETH, MYC, STAKING);

    const rewardTracker = await ethers.getContractAt('IRewardTracker', STAKING);
    const myc = await ethers.getContractAt('IERC20', MYC);
    const weth = await ethers.getContractAt('IERC20', WETH);

    // whitelist RewardCompounder in RewardTracker
    await impersonateAndRun(GOV, async (signer) => {
      await rewardTracker.connect(signer).setHandler(rewardCompounder.address, true);
    });

    // may fail; since we are using latest chain state, and `addressWithMycStaked` may not be staked anymore.
    // choose another if it's the case or pin a blockNumber, but need archive node
    const amountStaked: BigNumber = await rewardTracker.stakedAmounts(addressWithMycStaked);
    expect(amountStaked).gt(0);

    return {
      myc,
      weth,
      rewardTracker,
      rewardCompounder,
      actualUser: {
        address: addressWithMycStaked,
        mycAmount: amountStaked
      }
    };
  }

  it('claimForAccount & stakeForAccount works', async () => {
    const { rewardCompounder, weth, myc, rewardTracker, actualUser } = await loadFixture(fixture);

    // Use test selling strat that just echos back the MYC balance in compounder
    const TestStrategy = await ethers.getContractFactory('TestSellingStrategy');
    const testStrat = await TestStrategy.deploy();
    await rewardCompounder.setStrategy(testStrat.address);

    // transfer some myc from rich eoa to compounder
    const richMycGuy = `0x0c00924dff0c5ebaae46140815d8bdba6cb3763b`;
    const mycTransferred = utils.parseEther('100');

    await impersonateAndRun(richMycGuy, async (signer) => {
      await myc.connect(signer).transfer(rewardCompounder.address, mycTransferred);
      expect(await myc.balanceOf(rewardCompounder.address)).eq(mycTransferred);
    });

    const claimableWeth = await rewardTracker.claimable(actualUser.address);

    // 4 ticks
    await impersonateAndRun(actualUser.address, async (signer) => {
      await rewardCompounder.connect(signer).compound();
    });

    expect(await weth.balanceOf(rewardCompounder.address)).gte(claimableWeth);

    expect(await rewardTracker.stakedAmounts(actualUser.address)).eq(
      actualUser.mycAmount.add(mycTransferred)
    );
  });

  it('balancer strat works', async () => {
    const { rewardCompounder, rewardTracker, actualUser } = await loadFixture(fixture);

    const BalancerStrategy = await ethers.getContractFactory(`BalancerSellingStrategy`);
    const balancerStrat = await BalancerStrategy.deploy();
    await rewardCompounder.setStrategy(balancerStrat.address);

    const claimableWeth = await rewardTracker.claimable(actualUser.address);

    await impersonateAndRun(actualUser.address, async (signer) => {
      const compoundTx = await rewardCompounder.connect(signer).compound();
      const result = await compoundTx.wait(1);

      let compoundEvent: { account: string; wethOut: BigNumber; mycIn: BigNumber } = result.events![
        result.events!.length - 1
      ].args as any;

      expect(compoundEvent.wethOut).gte(claimableWeth);
      expect(await rewardTracker.stakedAmounts(actualUser.address)).eq(
        actualUser.mycAmount.add(compoundEvent.mycIn)
      );

      console.log(
        `\tSold ${utils.formatEther(compoundEvent.wethOut)} WETH for ${utils.formatEther(
          compoundEvent.mycIn
        )} MYC`
      );
    });
  });
});

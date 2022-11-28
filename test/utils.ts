import { network, ethers } from 'hardhat';

export const impersonateAndRun = async (
  address: string,
  fn: (signer: Awaited<ReturnType<typeof ethers.getSigner>>) => Promise<void>
) => {
  await network.provider.request({
    method: `hardhat_impersonateAccount`,
    params: [address]
  });

  await fn(await ethers.getSigner(address));

  await network.provider.request({
    method: `hardhat_stopImpersonatingAccount`,
    params: [address]
  });
};

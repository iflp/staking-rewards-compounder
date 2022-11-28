// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable2Step.sol';
import {IRewardCompounder, IRewardTracker, ISellingStrategy} from './interfaces.sol';

contract RewardCompounder is IRewardCompounder, Ownable2Step {
    IRewardTracker immutable REWARD_TRACKER;
    address immutable WETH;
    address immutable MYC;

    address public strategy;

    constructor(address weth, address myc, address rewardTracker) {
        WETH = weth;
        MYC = myc;
        REWARD_TRACKER = IRewardTracker(rewardTracker);
        IERC20(MYC).approve(address(REWARD_TRACKER), type(uint256).max);
    }

    /**
    * Compounds rewards for msg.sender
    */
    function compound() external {
        uint256 wethAmount = REWARD_TRACKER.claimForAccount(msg.sender, address(this));

        if (wethAmount != 0) {
            (bool success, bytes memory data) = strategy.delegatecall(
                abi.encodeWithSignature("sell(uint256,address,address)", wethAmount, WETH, MYC)
            );

            if (!success) revert CompoundFailed();
            uint256 mycAmount = abi.decode(data, (uint256));
            REWARD_TRACKER.stakeForAccount(address(this), msg.sender, MYC, mycAmount);

            emit Compounded(msg.sender, wethAmount, mycAmount);
        }
    }

    function _isContract(address addr) private view returns (bool) {
    uint size;
    assembly { size := extcodesize(addr) }
    return size > 0;
    }

    function setStrategy(address _newStrategy) external onlyOwner {
        if (_isContract(_newStrategy) == false) revert NotContract();
        emit StrategyUpdated(_newStrategy, strategy); 
        strategy = _newStrategy;
    }
}
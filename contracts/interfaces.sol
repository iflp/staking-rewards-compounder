// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IRewardTracker {
        function stakeForAccount(
        address _fundingAccount,
        address _account,
        address _depositToken,
        uint256 _amount
    ) external;

       function claimForAccount(address _account, address _receiver)
        external
        returns (uint256);

        function claimable(address _account) external view returns (uint256);

        function stakedAmounts(address _account) external view returns (uint256);

        function setHandler(address _address, bool _isActive) external;
}

interface IRewardCompounder {
    function compound() external;

    error Unauthorized();

    error CompoundFailed();

    error NotContract();

    event Compounded(address indexed account, uint256 wethOut, uint256 mycIn);
    event StrategyUpdated(address indexed newStrategy, address indexed oldStrategy);
}

interface ISellingStrategy {
    function sell(uint256 amountIn, address tokenIn, address tokenOut) external returns (uint256 amountOut);
}
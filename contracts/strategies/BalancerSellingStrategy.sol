// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISellingStrategy} from "../interfaces.sol";

interface IBalancerV2Swaps {
    enum SwapKind {
        GIVEN_IN,
        GIVEN_OUT
    }

    struct SingleSwap {
        bytes32 poolId;
        SwapKind kind;
        address assetIn;
        address assetOut;
        uint256 amount;
        bytes userData;
    }

    struct FundManagement {
        address sender;
        bool fromInternalBalance;
        address payable recipient;
        bool toInternalBalance;
    }

    function swap(
        SingleSwap memory singleSwap,
        FundManagement memory funds,
        uint256 limit,
        uint256 deadline
    ) external payable returns (uint256 amountCalculated);
}

/**
 * @title Performs trade on 80WETH/20ETH Balancer V2 pool.
 * @author iflp
 * @author CalabashSquash
 */
contract BalancerSellingStrategy is ISellingStrategy {
    address constant VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    bytes32 constant POOL_ID =
        0x432502a764abec914f940916652ce55885323cda0002000000000000000000c6;

    /**
     * @notice Sell WETH for MYC on the Balancer V2 vault's 80% WETH 20% MYC pool.
     * @param amountIn Amount of input token to sell.
     * @param weth WETH contract address.
     * @param myc MYC contract address.
     * @dev Accepts 100% slippage.
     */
    function sell(
        uint256 amountIn,
        address weth,
        address myc
    ) external returns (uint256 amountOut) {
        IBalancerV2Swaps.SingleSwap memory singleswap;
        IBalancerV2Swaps.FundManagement memory funds;

        singleswap.poolId = POOL_ID;
        singleswap.kind = IBalancerV2Swaps.SwapKind.GIVEN_IN;
        singleswap.assetIn = weth;
        singleswap.assetOut = myc;
        singleswap.amount = amountIn;

        funds.sender = address(this);
        funds.fromInternalBalance = false;
        funds.recipient = payable(address(this));
        funds.toInternalBalance = false;

        uint256 limit = 0;
        uint256 deadline = ~uint256(0);

        IERC20(weth).approve(VAULT, amountIn);
        amountOut = IBalancerV2Swaps(VAULT).swap(
            singleswap,
            funds,
            limit,
            deadline
        );
    }
}

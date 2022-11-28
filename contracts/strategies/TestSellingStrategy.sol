// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ISellingStrategy} from '../interfaces.sol';

contract TestSellingStrategy is ISellingStrategy {
    function sell(uint256 amountIn, address tokenIn, address tokenOut) external returns (uint256 amountOut) {
        amountOut = IERC20(tokenOut).balanceOf(address(this));
    }
}
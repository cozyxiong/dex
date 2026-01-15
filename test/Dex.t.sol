pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/DexFactory.sol";
import "../contracts/DexRouter.sol";
import "../contracts/DexPair.sol";
import "../contracts/tokens/WETH9.sol";
import "../contracts/tokens/TestToken.sol";

contract DexTest is Test {
    DexFactory factory;
    DexRouter router;
    WETH9 weth;
    TestToken tokenA;
    TestToken tokenB;

    address user = address(0x1234);

    function setUp() public {
        weth = new WETH9();
        factory = new DexFactory(address(this));
        router = new DexRouter(address(factory), address(weth));

        tokenA = new TestToken("Token A", "TKA", 1_000_000 ether);
        tokenB = new TestToken("Token B", "TKB", 1_000_000 ether);

        tokenA.transfer(user, 1_000 ether);
        tokenB.transfer(user, 1_000 ether);
    }

    function testAddLiquidityAndSwap() public {
        vm.startPrank(user);

        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);

        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            100 ether,
            100 ether,
            0,
            0,
            user,
            block.timestamp + 600
        );

        address pair = factory.getPair(address(tokenA), address(tokenB));
        assertTrue(pair != address(0));

        tokenA.approve(address(router), type(uint256).max);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        router.swapExactTokensForTokens(
            10 ether,
            1 ether,
            path,
            user,
            block.timestamp + 600
        );

        vm.stopPrank();
    }
}


pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/DexFactory.sol";
import "../contracts/DexRouter.sol";
import "../contracts/tokens/WETH9.sol";
import "../contracts/tokens/TestToken.sol";

contract DeployDex is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);

        WETH9 weth = new WETH9();
        DexFactory factory = new DexFactory(deployer);
        DexRouter router = new DexRouter(address(factory), address(weth));

        TestToken tokenA = new TestToken("Token A", "TKA", 1_000_000 ether);
        TestToken tokenB = new TestToken("Token B", "TKB", 1_000_000 ether);

        factory.createPair(address(tokenA), address(tokenB));

        vm.stopBroadcast();

        console2.log("Deployer", deployer);
        console2.log("WETH", address(weth));
        console2.log("Factory", address(factory));
        console2.log("Router", address(router));
        console2.log("TokenA", address(tokenA));
        console2.log("TokenB", address(tokenB));
    }
}

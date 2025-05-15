// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.29;

import { Script, console } from "@ssv/forge-std/Script.sol";
import { EthPriceOracle } from "../src/middleware/examples/ethPriceOracle.sol";

contract DeployEthPriceOracle is Script {
    function run() external {
        // Get the private key and addresses from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address ssvBasedApps = vm.envAddress("SSV_BASED_APPS");
        address initOwner = vm.envAddress("INIT_OWNER");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the EthPriceOracle contract
        EthPriceOracle oracle = new EthPriceOracle(
            ssvBasedApps,
            initOwner
        );

        // Log the deployment address
        console.log("EthPriceOracle deployed at:", address(oracle));

        vm.stopBroadcast();
    }
} 
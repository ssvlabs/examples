// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.29;

import { OwnableBasedApp } from "@ssv/src/middleware/modules/core+roles/OwnableBasedApp.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { ISSVBasedApps } from "@ssv/src/core/interfaces/ISSVBasedApps.sol";
import { ICore } from "@ssv/src/core/interfaces/ICore.sol";

interface IAccountBAppStrategy {
    function accountBAppStrategy(address account, address bApp) external view returns (uint32);
}

contract EthPriceOracle is OwnableBasedApp {
    using ECDSA for bytes32;

    // Errors
    error TaskMismatch();
    error AlreadyResponded();
    error InvalidPrice();
    error InvalidSignature();
    error InvalidSigner();
    error NotOptedIn();

    // Events
    event NewTaskCreated(uint32 indexed taskIndex, bytes32 taskHash);
    event TaskResponded(uint32 indexed taskIndex, bytes32 taskHash, address responder, uint256 ethPrice);
    event BAppOptedInByStrategy(uint32 indexed strategyId, address indexed bApp, bytes data, address[] tokens, uint32[] obligationPercentages);
    event DebugOptIn(uint32 indexed strategyId, address signer, address testOneAddress, address testTwoAddress);

    // Storage
    mapping(uint32 => bytes32) public allTaskHashes;
    mapping(address => mapping(uint32 => bytes)) public allTaskResponses;
    uint32 public latestTaskNum;
    uint256 public mostRecentPrice;
    mapping(uint32 => address) public strategySigner;
    mapping(uint32 => address) public testOne;
    mapping(uint32 => address) public testTwo;
    ISSVBasedApps public immutable ssvBasedApps;

    constructor(
        address _ssvBasedApps
    ) OwnableBasedApp(_ssvBasedApps, msg.sender) {
        ssvBasedApps = ISSVBasedApps(_ssvBasedApps);
    }

    function createNewTask() external returns (bytes32) {
        // Create task hash from block number and caller address
        bytes32 taskHash = keccak256(abi.encodePacked(block.number, msg.sender));

        // store hash of task on-chain, emit event, and increase taskNum
        allTaskHashes[latestTaskNum] = taskHash;
        emit NewTaskCreated(latestTaskNum, taskHash);
        latestTaskNum = latestTaskNum + 1;

        return taskHash;
    }

    function respondToTask(
        bytes32 taskHash,
        uint32 taskNumber,
        uint256 ethPrice,
        bytes[] calldata signatures,
        address[] calldata signers,
        uint32 strategyId
    ) external {
        // check that the task is valid and hasn't been responded to yet
        if (taskHash != allTaskHashes[taskNumber]) { revert TaskMismatch(); }
        if (allTaskResponses[msg.sender][taskNumber].length != 0) { revert AlreadyResponded(); }
        if (ethPrice <= 0) { revert InvalidPrice(); }
        if (signatures.length != signers.length) { revert InvalidSignature(); }

        // Create the message that was signed (task num + price)
        bytes32 messageHash = keccak256(abi.encodePacked(taskNumber, ethPrice));

        // Get the strategy signer 
        address strategySignerAddress = strategySigner[strategyId];
        
        // Verify each signature
        for (uint i = 0; i < signatures.length; i++) {

            // Recover the signer address from the signature
            address recoveredSigner = messageHash.recover(signatures[i]);

            if (strategySignerAddress != address(0)) {
                // if strategy has a signer set, verify this signer is the correct one
                if (strategySignerAddress != signers[i]) {
                    revert InvalidSigner();
                }
            } else {
                // if strategy has no signer set, check the signer is the owner of the strategy
                uint32 derivedStrategyId = IAccountBAppStrategy(address(ssvBasedApps)).accountBAppStrategy(recoveredSigner, address(this));
                if (derivedStrategyId != strategyId) {
                    revert NotOptedIn();
                }
            }
        }

        // Store the response
        allTaskResponses[msg.sender][taskNumber] = abi.encode(ethPrice);
        mostRecentPrice = ethPrice;

        // Emit event with the ETH price
        emit TaskResponded(taskNumber, taskHash, msg.sender, ethPrice);
    }

    function optInToBApp(
        uint32 strategyId,
        address[] calldata,
        uint32[] calldata,
        bytes calldata data
    ) external override onlySSVBasedAppManager returns (bool success) {
        // Decode the padded address correctly from bytes32
        address signer = address(uint160(uint256(abi.decode(data, (bytes32)))));
        // Store the address in the mapping
        strategySigner[strategyId] = signer;

        emit DebugOptIn(strategyId, signer, testOne[1], testTwo[2]);

        return true;
    }
}

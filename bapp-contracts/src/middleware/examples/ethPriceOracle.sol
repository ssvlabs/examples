// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.29;

import { OwnableBasedApp } from "@ssv/src/middleware/modules/core+roles/OwnableBasedApp.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { ISSVBasedApps } from "@ssv/src/core/interfaces/ISSVBasedApps.sol";

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

    // Storage
    mapping(uint32 => bytes32) public allTaskHashes;
    mapping(address => mapping(uint32 => bytes)) public allTaskResponses;
    uint32 public latestTaskNum;
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
        address[] calldata signers
    ) external {
        // check that the task is valid and hasn't been responded to yet
        if (taskHash != allTaskHashes[taskNumber]) { revert TaskMismatch(); }
        if (allTaskResponses[msg.sender][taskNumber].length != 0) { revert AlreadyResponded(); }
        if (ethPrice <= 0) { revert InvalidPrice(); }
        if (signatures.length != signers.length) { revert InvalidSignature(); }

        // Create the message that was signed (task num + price)
        bytes32 messageHash = keccak256(abi.encodePacked(taskNumber, ethPrice));
        
        // Verify each signature
        for (uint i = 0; i < signatures.length; i++) {
            // Recover the signer address from the signature
            address recoveredSigner = messageHash.recover(signatures[i]);
            
            // Verify the recovered signer matches the expected signer
            if (recoveredSigner != signers[i]) {
                revert InvalidSigner();
            }

            // Check if the signer has opted into this bApp
            uint32 strategyId = IAccountBAppStrategy(address(ssvBasedApps)).accountBAppStrategy(recoveredSigner, address(this));
            if (strategyId == 0) {
                revert NotOptedIn();
            }
        }

        // Store the response
        allTaskResponses[msg.sender][taskNumber] = abi.encode(ethPrice);

        // Emit event with the ETH price
        emit TaskResponded(taskNumber, taskHash, msg.sender, ethPrice);
    }
}

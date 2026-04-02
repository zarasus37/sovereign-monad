// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: GovernanceController.sol
Canonical Layer: Layer 4 - Sovereign Governance
Canonical Role: governance authority, pause surface, and execution control
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into authority boundaries, invariants, and sequencing context before acting.
*/

import "../base/DoveAware.sol";
import "../interfaces/IPausableControl.sol";

contract GovernanceController is DoveAware {
    error NotOwner();
    error ZeroAddress();
    error ExecutionFailed();

    event ExecutorSet(address indexed executor, bool allowed);
    event EmergencyPauseSet(address indexed target, bool paused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event GovernanceExecuted(address indexed caller, address indexed target, uint256 value, bytes data);

    address public owner;
    mapping(address => bool) public executors;

    constructor(address doveAddress, address initialOwner) DoveAware(doveAddress) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAuthorizedGovernor() {
        if (msg.sender != owner && !executors[msg.sender]) revert NotOwner();
        _;
    }

    function setExecutor(address executor, bool allowed) external onlyOwner {
        if (executor == address(0)) revert ZeroAddress();
        executors[executor] = allowed;
        emit ExecutorSet(executor, allowed);
        _observe(keccak256("EXECUTOR_SET"), abi.encode(executor, allowed));
    }

    function setEmergencyPause(address target, bool paused) external onlyOwner {
        IPausableControl(target).setPaused(paused);
        emit EmergencyPauseSet(target, paused);
        _observe(keccak256("EMERGENCY_PAUSE_SET"), abi.encode(target, paused));
    }

    function execute(address target, uint256 value, bytes calldata data)
        external
        onlyAuthorizedGovernor
        returns (bytes memory result)
    {
        if (target == address(0)) revert ZeroAddress();
        (bool ok, bytes memory response) = target.call{value: value}(data);
        if (!ok) revert ExecutionFailed();
        emit GovernanceExecuted(msg.sender, target, value, data);
        _observe(keccak256("GOVERNANCE_EXECUTED"), abi.encode(msg.sender, target, value, data));
        return response;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
        _observe(keccak256("GOVERNANCE_OWNERSHIP_TRANSFERRED"), abi.encode(previousOwner, newOwner));
    }
}

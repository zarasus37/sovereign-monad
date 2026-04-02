// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Workspace Metadata
Canonical Identity: RevenueSinkBase.sol
Canonical Role: shared sink authorization, ingress, and pause boundary
Provenance Status: reconstruction support contract
Interpretation Rule: this block is compressed identity metadata; readers must decompress it into the common sink invariants inherited by every Phase 1a sink.
*/

import "./DoveAware.sol";
import "../interfaces/IRevenueSink.sol";

abstract contract RevenueSinkBase is DoveAware, IRevenueSink {
    error NotGovernance();
    error UnauthorizedCaller(address caller);
    error InvalidAmount();
    error RouterAlreadySet();
    error ZeroAddress();
    error DirectEtherDisabled();
    error SinkPaused();

    event AllocationReceived(
        bytes32 indexed inflowId,
        uint256 amount,
        string indexed source,
        uint256 timestamp
    );

    event RouterSet(address indexed router);
    event PauseStatusChanged(bool paused);

    address public immutable governance;
    address public router;
    uint256 internal _totalReceived;
    bool public paused;

    constructor(address governanceAddress, address doveAddress) DoveAware(doveAddress) {
        if (governanceAddress == address(0)) revert ZeroAddress();
        governance = governanceAddress;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert NotGovernance();
        _;
    }

    modifier onlyAuthorizedCaller() {
        if (!_isAuthorizedCaller(msg.sender)) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    function setRouter(address routerAddress) external onlyGovernance {
        if (routerAddress == address(0)) revert ZeroAddress();
        if (router != address(0)) revert RouterAlreadySet();
        router = routerAddress;
        emit RouterSet(routerAddress);
        _observe(keccak256("SINK_ROUTER_SET"), abi.encode(routerAddress));
    }

    function setPaused(bool isPaused) external onlyGovernance {
        paused = isPaused;
        emit PauseStatusChanged(isPaused);
        _observe(keccak256("SINK_PAUSE_STATUS_CHANGED"), abi.encode(isPaused));
    }

    function receiveAllocation(
        uint256 amount,
        bytes32 inflowId,
        string calldata source
    ) external payable virtual onlyAuthorizedCaller returns (bool success) {
        if (paused) revert SinkPaused();
        if (amount == 0 || msg.value != amount) revert InvalidAmount();

        _totalReceived += amount;

        emit AllocationReceived(inflowId, amount, source, block.timestamp);
        _observe(
            keccak256("SINK_ALLOCATION_RECEIVED"),
            abi.encode(inflowId, amount, source, msg.sender)
        );

        _afterAllocation(amount, inflowId, source);
        return true;
    }

    function getTotalReceived() external view returns (uint256) {
        return _totalReceived;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function _isAuthorizedCaller(address caller) internal view virtual returns (bool) {
        return caller == router && router != address(0);
    }

    function _afterAllocation(
        uint256 amount,
        bytes32 inflowId,
        string calldata source
    ) internal virtual {
        amount;
        inflowId;
        source;
    }

    receive() external payable virtual {
        revert DirectEtherDisabled();
    }

    fallback() external payable virtual {
        revert DirectEtherDisabled();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: RevenueRouter.sol
Canonical Layer: Layer 13 - Unified Revenue Router
Canonical Role: allocation engine and atomic sink routing surface
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into allocation policy, treasury floor, founder cap, and atomic-routing invariants before acting.
*/

import "../base/DoveAware.sol";
import "../interfaces/IRevenueSink.sol";

contract RevenueRouter is DoveAware {
    error NotGovernance();
    error NotReceiver();
    error ZeroAddress();
    error RouterPaused();
    error InvalidAmount();
    error ReceiverAlreadySet();
    error UnknownSink(string sinkName);
    error InactiveSink(string sinkName);
    error InvalidPolicy();
    error TreasuryFloorBreach();
    error FounderAllocationExceeded();
    error DirectEtherDisabled();
    error ReentrantCall();

    struct AllocationPolicy {
        uint16 treasuryBps;
        uint16 mevBps;
        uint16 opsBps;
        uint16 dataYieldBps;
        uint16 delegateBps;
        uint16 founderBps;
    }

    struct AllocationRecord {
        uint256 timestamp;
        uint256 totalInflow;
        uint256 treasuryAmount;
        uint256 mevAmount;
        uint256 opsAmount;
        uint256 dataYieldAmount;
        uint256 delegateAmount;
        uint256 founderAmount;
        string source;
    }

    struct SinkConfig {
        address sinkAddress;
        bool isActive;
    }

    event ReceiverSet(address indexed receiver);
    event SinkRegistered(string indexed sinkName, address indexed sinkAddress, bool isActive, uint256 timestamp);
    event AllocationCalculated(
        bytes32 indexed inflowId,
        uint256 totalInflow,
        uint256 treasuryAmount,
        uint256 mevAmount,
        uint256 opsAmount,
        uint256 dataYieldAmount,
        uint256 delegateAmount,
        uint256 founderAmount
    );
    event AllocationRouted(
        bytes32 indexed inflowId,
        string indexed sinkName,
        uint256 amount,
        bool success,
        uint256 timestamp
    );
    event AllocationPolicyUpdated(
        uint16 treasuryBps,
        uint16 mevBps,
        uint16 opsBps,
        uint16 dataYieldBps,
        uint16 delegateBps,
        uint16 founderBps,
        uint256 timestamp,
        address indexed governance
    );
    event PauseStatusChanged(bool paused);

    address public immutable governance;
    address public receiver;
    bool public paused;
    bool private _entered;
    AllocationPolicy private _policy;
    AllocationRecord[] private _history;
    mapping(bytes32 => SinkConfig) private _sinks;

    uint16 private constant BPS_DENOMINATOR = 10_000;
    uint16 private constant TREASURY_FLOOR_BPS = 4_000;
    uint16 private constant FOUNDER_MAX_BPS = 500;

    constructor(address governanceAddress, address doveAddress) DoveAware(doveAddress) {
        if (governanceAddress == address(0)) revert ZeroAddress();
        governance = governanceAddress;
        _policy = AllocationPolicy({
            treasuryBps: 4000,
            mevBps: 2500,
            opsBps: 1500,
            dataYieldBps: 1000,
            delegateBps: 500,
            founderBps: 500
        });
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert NotGovernance();
        _;
    }

    modifier onlyReceiver() {
        if (msg.sender != receiver) revert NotReceiver();
        _;
    }

    modifier nonReentrant() {
        if (_entered) revert ReentrantCall();
        _entered = true;
        _;
        _entered = false;
    }

    function setReceiver(address receiverAddress) external onlyGovernance {
        if (receiverAddress == address(0)) revert ZeroAddress();
        if (receiver != address(0)) revert ReceiverAlreadySet();
        receiver = receiverAddress;
        emit ReceiverSet(receiverAddress);
        _observe(keccak256("ROUTER_RECEIVER_SET"), abi.encode(receiverAddress));
    }

    function setPaused(bool isPaused) external onlyGovernance {
        paused = isPaused;
        emit PauseStatusChanged(isPaused);
        _observe(keccak256("ROUTER_PAUSE_STATUS_CHANGED"), abi.encode(isPaused));
    }

    function registerSink(string calldata sinkName, address sinkAddress, bool isActive) external onlyGovernance {
        if (sinkAddress == address(0)) revert ZeroAddress();
        _sinks[keccak256(bytes(sinkName))] = SinkConfig({sinkAddress: sinkAddress, isActive: isActive});
        emit SinkRegistered(sinkName, sinkAddress, isActive, block.timestamp);
        _observe(keccak256("ROUTER_SINK_REGISTERED"), abi.encode(sinkName, sinkAddress, isActive));
    }

    function getSinkAddress(string calldata sinkName) external view returns (address) {
        return _sinks[keccak256(bytes(sinkName))].sinkAddress;
    }

    function getAllocationPolicy() external view returns (uint16, uint16, uint16, uint16, uint16, uint16) {
        return (
            _policy.treasuryBps,
            _policy.mevBps,
            _policy.opsBps,
            _policy.dataYieldBps,
            _policy.delegateBps,
            _policy.founderBps
        );
    }

    function updateAllocationPolicy(
        uint16 treasuryBps,
        uint16 mevBps,
        uint16 opsBps,
        uint16 dataYieldBps,
        uint16 delegateBps,
        uint16 founderBps
    ) external onlyGovernance {
        uint256 total = uint256(treasuryBps) + mevBps + opsBps + dataYieldBps + delegateBps + founderBps;
        if (total != BPS_DENOMINATOR) revert InvalidPolicy();
        if (treasuryBps < TREASURY_FLOOR_BPS) revert TreasuryFloorBreach();
        if (founderBps > FOUNDER_MAX_BPS) revert FounderAllocationExceeded();

        _policy = AllocationPolicy({
            treasuryBps: treasuryBps,
            mevBps: mevBps,
            opsBps: opsBps,
            dataYieldBps: dataYieldBps,
            delegateBps: delegateBps,
            founderBps: founderBps
        });

        emit AllocationPolicyUpdated(
            treasuryBps,
            mevBps,
            opsBps,
            dataYieldBps,
            delegateBps,
            founderBps,
            block.timestamp,
            msg.sender
        );
        _observe(keccak256("ALLOCATION_POLICY_UPDATED"), abi.encode(_policy));
    }

    function processInflow(
        bytes32 inflowId,
        string calldata source,
        address payer,
        uint256 amount,
        bytes calldata metadata
    ) external payable onlyReceiver nonReentrant returns (bool success) {
        if (paused) revert RouterPaused();
        if (msg.value != amount || amount == 0) revert InvalidAmount();

        (
            uint256 treasuryAmount,
            uint256 mevAmount,
            uint256 opsAmount,
            uint256 dataYieldAmount,
            uint256 delegateAmount,
            uint256 founderAmount
        ) = _calculateAmounts(amount);

        emit AllocationCalculated(
            inflowId,
            amount,
            treasuryAmount,
            mevAmount,
            opsAmount,
            dataYieldAmount,
            delegateAmount,
            founderAmount
        );

        _history.push(
            AllocationRecord({
                timestamp: block.timestamp,
                totalInflow: amount,
                treasuryAmount: treasuryAmount,
                mevAmount: mevAmount,
                opsAmount: opsAmount,
                dataYieldAmount: dataYieldAmount,
                delegateAmount: delegateAmount,
                founderAmount: founderAmount,
                source: source
            })
        );

        _route(inflowId, source, "TREASURY", treasuryAmount);
        _route(inflowId, source, "MEV", mevAmount);
        _route(inflowId, source, "OPS_DEV", opsAmount);
        _route(inflowId, source, "DATA_YIELD", dataYieldAmount);
        _route(inflowId, source, "DELEGATE_POOLS", delegateAmount);
        _route(inflowId, source, "FOUNDER", founderAmount);

        _observe(keccak256("ROUTE_EXECUTED"), abi.encode(inflowId, source, payer, amount, metadata));
        return true;
    }

    function getAllocationHistory(
        uint256 startTimestamp,
        uint256 endTimestamp
    ) external view returns (AllocationRecord[] memory result) {
        uint256 count;
        for (uint256 i = 0; i < _history.length; i++) {
            if (_history[i].timestamp >= startTimestamp && _history[i].timestamp <= endTimestamp) {
                count++;
            }
        }

        result = new AllocationRecord[](count);
        uint256 idx;
        for (uint256 i = 0; i < _history.length; i++) {
            if (_history[i].timestamp >= startTimestamp && _history[i].timestamp <= endTimestamp) {
                result[idx++] = _history[i];
            }
        }
    }

    function allocationHistoryLength() external view returns (uint256) {
        return _history.length;
    }

    function _route(bytes32 inflowId, string calldata source, string memory sinkName, uint256 amount) internal {
        SinkConfig memory sink = _sinkConfig(sinkName);
        bool routed = IRevenueSink(sink.sinkAddress).receiveAllocation{value: amount}(amount, inflowId, source);
        require(routed, "sink rejected");
        emit AllocationRouted(inflowId, sinkName, amount, true, block.timestamp);
        _observe(keccak256("ALLOCATION_ROUTED"), abi.encode(inflowId, sinkName, amount, true));
    }

    function _sinkConfig(string memory sinkName) internal view returns (SinkConfig memory sink) {
        sink = _sinks[keccak256(bytes(sinkName))];
        if (sink.sinkAddress == address(0)) revert UnknownSink(sinkName);
        if (!sink.isActive) revert InactiveSink(sinkName);
    }

    function _calculateAmounts(uint256 amount) internal view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        uint256 treasuryAmount = (amount * _policy.treasuryBps) / BPS_DENOMINATOR;
        uint256 mevAmount = (amount * _policy.mevBps) / BPS_DENOMINATOR;
        uint256 opsAmount = (amount * _policy.opsBps) / BPS_DENOMINATOR;
        uint256 dataYieldAmount = (amount * _policy.dataYieldBps) / BPS_DENOMINATOR;
        uint256 delegateAmount = (amount * _policy.delegateBps) / BPS_DENOMINATOR;
        uint256 founderAmount = amount - treasuryAmount - mevAmount - opsAmount - dataYieldAmount - delegateAmount;
        return (treasuryAmount, mevAmount, opsAmount, dataYieldAmount, delegateAmount, founderAmount);
    }

    receive() external payable {
        revert DirectEtherDisabled();
    }

    fallback() external payable {
        revert DirectEtherDisabled();
    }
}

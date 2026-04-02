// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: InboundReceiver.sol
Canonical Layer: Layer 13 - Unified Revenue Router
Canonical Role: approved-source inflow acceptance and routing entrypoint
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into source validation, routing boundaries, and no-silent-ingress invariants before acting.
*/

import "../base/DoveAware.sol";
import "../interfaces/IRevenueRouter.sol";

contract InboundReceiver is DoveAware {
    error NotGovernance();
    error NotApprovedSource(address caller);
    error ZeroAddress();
    error RouterAlreadySet();
    error InvalidAmount();
    error ReceiverPaused();
    error DirectEtherDisabled();

    struct InflowRecord {
        bytes32 inflowId;
        string source;
        uint256 amount;
        uint256 timestamp;
        address sender;
    }

    event RouterSet(address indexed router);
    event ApprovedSourceSet(address indexed source, bool approved, string label);
    event InflowReceived(
        bytes32 indexed inflowId,
        string indexed source,
        uint256 amount,
        uint256 timestamp,
        address indexed receiver
    );
    event InflowValidated(bytes32 indexed inflowId, bool isValid, string validationNote);
    event PauseStatusChanged(bool paused);

    address public immutable governance;
    address public router;
    bool public paused;
    mapping(address => bool) public approvedSources;
    InflowRecord[] private _inflows;

    constructor(address governanceAddress, address doveAddress) DoveAware(doveAddress) {
        if (governanceAddress == address(0)) revert ZeroAddress();
        governance = governanceAddress;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert NotGovernance();
        _;
    }

    modifier onlyApprovedSource() {
        if (!approvedSources[msg.sender]) revert NotApprovedSource(msg.sender);
        _;
    }

    function setRouter(address routerAddress) external onlyGovernance {
        if (routerAddress == address(0)) revert ZeroAddress();
        if (router != address(0)) revert RouterAlreadySet();
        router = routerAddress;
        emit RouterSet(routerAddress);
        _observe(keccak256("RECEIVER_ROUTER_SET"), abi.encode(routerAddress));
    }

    function setPaused(bool isPaused) external onlyGovernance {
        paused = isPaused;
        emit PauseStatusChanged(isPaused);
        _observe(keccak256("RECEIVER_PAUSE_STATUS_CHANGED"), abi.encode(isPaused));
    }

    function setApprovedSource(address source, bool approved, string calldata label) external onlyGovernance {
        if (source == address(0)) revert ZeroAddress();
        approvedSources[source] = approved;
        emit ApprovedSourceSet(source, approved, label);
        _observe(keccak256("RECEIVER_APPROVED_SOURCE_SET"), abi.encode(source, approved, label));
    }

    function receiveMonadSpinRevenue(
        string calldata period,
        bytes calldata signature
    ) external payable onlyApprovedSource returns (bytes32 inflowId) {
        return _receiveInflow("MonadSpin", abi.encode(period, signature));
    }

    function receiveApprovedInflow(
        string calldata sourceName,
        bytes calldata metadata
    ) external payable onlyApprovedSource returns (bytes32 inflowId) {
        return _receiveInflow(sourceName, metadata);
    }

    function getTotalInflowsInPeriod(
        uint256 startTimestamp,
        uint256 endTimestamp
    ) external view returns (uint256 total, uint256 count) {
        for (uint256 i = 0; i < _inflows.length; i++) {
            InflowRecord memory record = _inflows[i];
            if (record.timestamp >= startTimestamp && record.timestamp <= endTimestamp) {
                total += record.amount;
                count++;
            }
        }
    }

    function inflowCount() external view returns (uint256) {
        return _inflows.length;
    }

    function _receiveInflow(
        string memory sourceName,
        bytes memory metadata
    ) internal returns (bytes32 inflowId) {
        if (paused) revert ReceiverPaused();
        if (router == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert InvalidAmount();

        inflowId = keccak256(
            abi.encode(
                sourceName,
                msg.sender,
                msg.value,
                block.chainid,
                block.timestamp,
                _inflows.length
            )
        );

        _inflows.push(
            InflowRecord({
                inflowId: inflowId,
                source: sourceName,
                amount: msg.value,
                timestamp: block.timestamp,
                sender: msg.sender
            })
        );

        emit InflowValidated(inflowId, true, "source-approved");
        emit InflowReceived(inflowId, sourceName, msg.value, block.timestamp, address(this));

        _observe(keccak256("INFLOW_VALIDATED"), abi.encode(inflowId, sourceName, msg.value, msg.sender));

        bool success = IRevenueRouter(router).processInflow{value: msg.value}(
            inflowId,
            sourceName,
            msg.sender,
            msg.value,
            metadata
        );
        require(success, "router process failed");

        _observe(keccak256("INFLOW_RECEIVED"), abi.encode(inflowId, sourceName, msg.value, msg.sender));
    }

    receive() external payable {
        revert DirectEtherDisabled();
    }

    fallback() external payable {
        revert DirectEtherDisabled();
    }
}

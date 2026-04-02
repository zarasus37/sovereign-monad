// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: DoveRouterObserver.sol
Canonical Layer: Layer 11 - Dove Protocol observation surface
Canonical Role: router and sink health observer
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into observation-only scope, health-snapshot semantics, and non-blocking accountability behavior before acting.
*/

import "../base/DoveAware.sol";

interface IObserverReceiver {
    function inflowCount() external view returns (uint256);
}

interface IObserverSink {
    function getBalance() external view returns (uint256);
}

interface IObserverRouter {
    function allocationHistoryLength() external view returns (uint256);
}

contract DoveRouterObserver is DoveAware {
    error NotGovernance();
    error AlreadyInitialized();
    error ZeroAddress();

    event ObserverInitialized(address indexed receiver, address indexed router);
    event RouterHealthSnapshot(
        uint256 inflowCount,
        uint256 allocationHistoryLength,
        uint256 treasuryBalance,
        uint256 mevBalance,
        uint256 opsBalance,
        uint256 dataYieldBalance,
        uint256 delegateBalance,
        uint256 founderBalance
    );

    address public immutable governance;
    bool public initialized;
    address public receiver;
    address public router;
    address public treasurySink;
    address public mevSink;
    address public opsSink;
    address public dataYieldSink;
    address public delegateSink;
    address public founderSink;

    constructor(address governanceAddress, address doveAddress) DoveAware(doveAddress) {
        if (governanceAddress == address(0)) revert ZeroAddress();
        governance = governanceAddress;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert NotGovernance();
        _;
    }

    function initialize(
        address receiverAddress,
        address routerAddress,
        address treasuryAddress,
        address mevAddress,
        address opsAddress,
        address dataYieldAddress,
        address delegateAddress,
        address founderAddress
    ) external onlyGovernance {
        if (initialized) revert AlreadyInitialized();
        if (
            receiverAddress == address(0) ||
            routerAddress == address(0) ||
            treasuryAddress == address(0) ||
            mevAddress == address(0) ||
            opsAddress == address(0) ||
            dataYieldAddress == address(0) ||
            delegateAddress == address(0) ||
            founderAddress == address(0)
        ) revert ZeroAddress();

        initialized = true;
        receiver = receiverAddress;
        router = routerAddress;
        treasurySink = treasuryAddress;
        mevSink = mevAddress;
        opsSink = opsAddress;
        dataYieldSink = dataYieldAddress;
        delegateSink = delegateAddress;
        founderSink = founderAddress;

        emit ObserverInitialized(receiverAddress, routerAddress);
        _observe(
            keccak256("OBSERVER_INITIALIZED"),
            abi.encode(receiverAddress, routerAddress, treasuryAddress, mevAddress, opsAddress, dataYieldAddress, delegateAddress, founderAddress)
        );
    }

    function snapshotRouterHealth() external returns (bytes32 snapshotId) {
        snapshotId = keccak256(abi.encode(block.chainid, block.timestamp, address(this)));

        uint256 inflows = IObserverReceiver(receiver).inflowCount();
        uint256 history = IObserverRouter(router).allocationHistoryLength();
        uint256 treasuryBalance = IObserverSink(treasurySink).getBalance();
        uint256 mevBalance = IObserverSink(mevSink).getBalance();
        uint256 opsBalance = IObserverSink(opsSink).getBalance();
        uint256 dataYieldBalance = IObserverSink(dataYieldSink).getBalance();
        uint256 delegateBalance = IObserverSink(delegateSink).getBalance();
        uint256 founderBalance = IObserverSink(founderSink).getBalance();

        emit RouterHealthSnapshot(
            inflows,
            history,
            treasuryBalance,
            mevBalance,
            opsBalance,
            dataYieldBalance,
            delegateBalance,
            founderBalance
        );

        _observe(
            keccak256("ROUTER_HEALTH_SNAPSHOT"),
            abi.encode(snapshotId, inflows, history, treasuryBalance, mevBalance, opsBalance, dataYieldBalance, delegateBalance, founderBalance)
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: RevenueSinkDataYield.sol
Canonical Layer: Layer 14 - Data Rail pre-funding surface
Canonical Role: pre-Phase 3 data-yield holding sink with MEV redirection
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into phase-gated redirection behavior and Data Rail dependency before acting.
*/

import "../base/RevenueSinkBase.sol";
import "../interfaces/IRevenueSink.sol";

contract RevenueSinkDataYield is RevenueSinkBase {
    event MevSinkSet(address indexed mevSink);
    event Phase3StatusSet(bool active);
    event DataYieldRedirected(bytes32 indexed inflowId, uint256 amount, string source, address indexed mevSink);

    address public mevSink;
    bool public phase3Active;

    constructor(address governanceAddress, address doveAddress)
        RevenueSinkBase(governanceAddress, doveAddress)
    {}

    function setMevSink(address mevSinkAddress) external onlyGovernance {
        if (mevSinkAddress == address(0)) revert ZeroAddress();
        mevSink = mevSinkAddress;
        emit MevSinkSet(mevSinkAddress);
        _observe(keccak256("DATA_YIELD_MEV_SINK_SET"), abi.encode(mevSinkAddress));
    }

    function setPhase3Active(bool active) external onlyGovernance {
        phase3Active = active;
        emit Phase3StatusSet(active);
        _observe(keccak256("PHASE3_ACTIVATED"), abi.encode(active));
    }

    function _afterAllocation(
        uint256 amount,
        bytes32 inflowId,
        string calldata source
    ) internal override {
        if (phase3Active || mevSink == address(0)) {
            return;
        }

        bool forwarded = IRevenueSink(mevSink).receiveAllocation{value: amount}(
            amount,
            inflowId,
            string.concat(source, ":data-yield-redirect")
        );
        require(forwarded, "data yield redirect failed");

        emit DataYieldRedirected(inflowId, amount, source, mevSink);
        _observe(keccak256("DATA_YIELD_REDIRECTED"), abi.encode(inflowId, amount, source, mevSink));
    }
}

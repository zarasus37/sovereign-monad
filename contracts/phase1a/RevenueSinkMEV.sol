// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: RevenueSinkMEV.sol
Canonical Layer: Layer 2 - Sovereign MEV Arb Engine
Canonical Role: MEV bankroll sink and engine capital feed
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into bankroll flow, Data Yield redirection linkage, and engine-funding boundaries before acting.
*/

import "../base/RevenueSinkBase.sol";

contract RevenueSinkMEV is RevenueSinkBase {
    event DataYieldSourceSet(address indexed dataYieldSource);
    event MevWithdrawal(address indexed to, uint256 amount);

    address public dataYieldSource;

    constructor(address governanceAddress, address doveAddress)
        RevenueSinkBase(governanceAddress, doveAddress)
    {}

    function setDataYieldSource(address source) external onlyGovernance {
        if (source == address(0)) revert ZeroAddress();
        dataYieldSource = source;
        emit DataYieldSourceSet(source);
        _observe(keccak256("MEV_DATA_YIELD_SOURCE_SET"), abi.encode(source));
    }

    function withdrawToEngine(address payable engine, uint256 amount) external onlyGovernance {
        if (engine == address(0)) revert ZeroAddress();
        require(amount <= address(this).balance, "insufficient mev balance");
        (bool ok,) = engine.call{value: amount}("");
        require(ok, "mev transfer failed");
        emit MevWithdrawal(engine, amount);
        _observe(keccak256("MEV_DISBURSEMENT"), abi.encode(engine, amount));
    }

    function _isAuthorizedCaller(address caller) internal view override returns (bool) {
        return (caller == router && router != address(0)) || caller == dataYieldSource;
    }
}

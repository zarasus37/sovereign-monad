// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: RevenueSinkDelegatePools.sol
Canonical Layer: Layer 13 support allocation surface
Canonical Role: delegate incentive and distribution sink
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into delegate-tier distribution intent and governance-controlled outflow boundaries before acting.
*/

import "../base/RevenueSinkBase.sol";

contract RevenueSinkDelegatePools is RevenueSinkBase {
    event DelegateDistribution(address indexed recipient, uint256 amount, string tier);

    constructor(address governanceAddress, address doveAddress)
        RevenueSinkBase(governanceAddress, doveAddress)
    {}

    function distribute(address payable recipient, uint256 amount, string calldata tier) external onlyGovernance {
        if (recipient == address(0)) revert ZeroAddress();
        require(amount <= address(this).balance, "insufficient delegate balance");
        (bool ok,) = recipient.call{value: amount}("");
        require(ok, "delegate transfer failed");
        emit DelegateDistribution(recipient, amount, tier);
        _observe(keccak256("DELEGATE_DISTRIBUTION"), abi.encode(recipient, amount, tier));
    }
}

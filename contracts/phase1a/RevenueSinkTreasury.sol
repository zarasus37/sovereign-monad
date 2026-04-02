// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: RevenueSinkTreasury.sol
Canonical Layer: Layer 3 - Sovereign Treasury
Canonical Role: treasury reserve sink
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into reserve function, custody boundary, and treasury-floor dependency before acting.
*/

import "../base/RevenueSinkBase.sol";

contract RevenueSinkTreasury is RevenueSinkBase {
    constructor(address governanceAddress, address doveAddress)
        RevenueSinkBase(governanceAddress, doveAddress)
    {}
}

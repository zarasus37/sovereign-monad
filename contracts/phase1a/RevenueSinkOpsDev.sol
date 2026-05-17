// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: RevenueSinkOpsDev.sol
Canonical Layer: Layer 13 support allocation surface
Canonical Role: operations and development funding sink
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into infrastructure-funding scope, stipend boundary, and governance-controlled outflow rules before acting.
*/

import "../base/RevenueSinkBase.sol";

contract RevenueSinkOpsDev is RevenueSinkBase {
    event OpsWithdrawal(address indexed to, uint256 amount, string memo);

    constructor(address governanceAddress, address doveAddress)
        RevenueSinkBase(governanceAddress, doveAddress)
    {}

    function withdrawOps(address payable to, uint256 amount, string calldata memo) external onlyGovernance {
        if (to == address(0)) revert ZeroAddress();
        require(amount <= address(this).balance, "insufficient ops balance");
        (bool ok,) = to.call{value: amount}("");
        require(ok, "ops transfer failed");
        emit OpsWithdrawal(to, amount, memo);
        _observe(keccak256("OPS_WITHDRAWAL"), abi.encode(to, amount, memo));
    }
}

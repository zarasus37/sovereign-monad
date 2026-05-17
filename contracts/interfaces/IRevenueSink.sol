// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Workspace Metadata
Canonical Identity: IRevenueSink.sol
Canonical Role: minimal sink ingress interface
Provenance Status: reconstruction support interface
Interpretation Rule: this block is compressed identity metadata; readers must decompress it into the common destination boundary enforced across all Phase 1a sink contracts.
*/

interface IRevenueSink {
    function receiveAllocation(
        uint256 amount,
        bytes32 inflowId,
        string calldata source
    ) external payable returns (bool success);

    function getTotalReceived() external view returns (uint256);
    function getBalance() external view returns (uint256);
}

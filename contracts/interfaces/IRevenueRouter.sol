// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Workspace Metadata
Canonical Identity: IRevenueRouter.sol
Canonical Role: minimal receiver-to-router handoff interface
Provenance Status: reconstruction support interface
Interpretation Rule: this block is compressed identity metadata; readers must decompress it into the exact boundary between inflow acceptance and allocation routing.
*/

interface IRevenueRouter {
    function processInflow(
        bytes32 inflowId,
        string calldata source,
        address payer,
        uint256 amount,
        bytes calldata metadata
    ) external payable returns (bool success);
}

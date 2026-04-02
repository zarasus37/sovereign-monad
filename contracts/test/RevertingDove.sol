// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Test Metadata
Canonical Identity: RevertingDove.sol
Canonical Role: always-failing Dove test double
Provenance Status: reconstruction test support contract
Interpretation Rule: this block is compressed test metadata; readers must decompress it into the negative-path proof that Dove failure cannot halt economic flow.
*/

contract RevertingDove {
    function observe(address, bytes32, bytes calldata) external pure {
        revert("dove unavailable");
    }
}

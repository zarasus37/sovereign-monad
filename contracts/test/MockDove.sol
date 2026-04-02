// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Test Metadata
Canonical Identity: MockDove.sol
Canonical Role: non-reverting Dove test double
Provenance Status: reconstruction test support contract
Interpretation Rule: this block is compressed test metadata; readers must decompress it into the baseline accountability-available path used by the reconstruction suite.
*/

contract MockDove {
    event Observed(address indexed source, bytes32 indexed eventType, bytes data);

    function observe(address source, bytes32 eventType, bytes calldata data) external {
        emit Observed(source, eventType, data);
    }
}

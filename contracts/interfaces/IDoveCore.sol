// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Workspace Metadata
Canonical Identity: IDoveCore.sol
Canonical Role: minimal Dove observation interface
Provenance Status: reconstruction support interface
Interpretation Rule: this block is compressed identity metadata; readers must decompress it into the smallest contract boundary needed for non-blocking accountability calls.
*/

interface IDoveCore {
    function observe(address source, bytes32 eventType, bytes calldata data) external;
}

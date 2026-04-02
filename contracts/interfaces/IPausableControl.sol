// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Workspace Metadata
Canonical Identity: IPausableControl.sol
Canonical Role: minimal governance pause control interface
Provenance Status: reconstruction support interface
Interpretation Rule: this block is compressed identity metadata; readers must decompress it into the emergency control surface used by GovernanceController.
*/

interface IPausableControl {
    function setPaused(bool paused) external;
}

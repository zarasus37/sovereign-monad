// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Workspace Metadata
Canonical Identity: DoveAware.sol
Canonical Role: shared non-blocking Dove observation primitive
Provenance Status: reconstruction support contract
Interpretation Rule: this block is compressed identity metadata; readers must decompress it into observation semantics and the rule that Dove visibility must not halt economic flow.
*/

import "../interfaces/IDoveCore.sol";

abstract contract DoveAware {
    IDoveCore public immutable dove;

    constructor(address doveAddress) {
        dove = IDoveCore(doveAddress);
    }

    function _observe(bytes32 eventType, bytes memory data) internal {
        if (address(dove) == address(0)) {
            return;
        }

        try dove.observe(address(this), eventType, data) {} catch {}
    }
}

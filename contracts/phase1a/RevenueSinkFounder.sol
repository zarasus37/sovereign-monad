// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Phase 1a Reconstruction Metadata
Canonical Identity: RevenueSinkFounder.sol
Canonical Layer: Layer 13 - Unified Revenue Router founder allocation surface
Canonical Role: founder attribution sink under conscience constraints
Provenance Status: reconstructed, not recovered original source
Reconstruction Basis: MOF v2.3.0 + surviving DoveCore.sol + surviving Revenue Router Phase 1a specification
Deployment Status: not deployed
Interpretation Rule: this block is compressed identity metadata; operators and agents must decompress it into draw-cap logic, pause semantics, and founder-accountability boundaries before acting.
*/

import "../base/RevenueSinkBase.sol";

contract RevenueSinkFounder is RevenueSinkBase {
    error NotFounder();
    error DrawsPaused();

    event FounderSet(address indexed founder);
    event FounderDrawPauseSet(bool paused);
    event FounderWithdrawal(address indexed founder, uint256 amount);

    address public founder;
    bool public drawsPaused;

    constructor(address governanceAddress, address doveAddress, address founderAddress)
        RevenueSinkBase(governanceAddress, doveAddress)
    {
        if (founderAddress == address(0)) revert ZeroAddress();
        founder = founderAddress;
    }

    modifier onlyFounder() {
        if (msg.sender != founder) revert NotFounder();
        _;
    }

    function setFounder(address founderAddress) external onlyGovernance {
        if (founderAddress == address(0)) revert ZeroAddress();
        founder = founderAddress;
        emit FounderSet(founderAddress);
        _observe(keccak256("FOUNDER_SET"), abi.encode(founderAddress));
    }

    function setDrawsPaused(bool pausedStatus) external onlyGovernance {
        drawsPaused = pausedStatus;
        emit FounderDrawPauseSet(pausedStatus);
        _observe(keccak256("FOUNDER_DRAWS_PAUSED"), abi.encode(pausedStatus));
    }

    function withdraw(uint256 amount) external onlyFounder {
        if (drawsPaused) revert DrawsPaused();
        require(amount <= address(this).balance, "insufficient founder balance");
        (bool ok,) = payable(founder).call{value: amount}("");
        require(ok, "founder transfer failed");
        emit FounderWithdrawal(founder, amount);
        _observe(keccak256("FOUNDER_WITHDRAWAL"), abi.encode(founder, amount));
    }
}

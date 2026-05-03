// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EmergenceRecorder
 * @notice Storage-backed live behavioral data point recorder for the first
 * psychometric agent loop. This contract records evidence. It does not ratify
 * consciousness, grant authority, or move funds.
 */
contract EmergenceRecorder {
    struct AgentProfile {
        bytes32 agentId;
        string primaryDomain;
        string secondaryDomain;
        string tertiaryDomain;
        uint8 openness;
        uint8 conscientiousness;
        uint8 extraversion;
        uint8 agreeableness;
        uint8 neuroticism;
        uint8 machiavellianism;
        uint8 narcissism;
        uint8 psychopathy;
        bool doveFlag;
        uint256 timestamp;
    }

    struct EmergenceClaimRecord {
        bytes32 claimId;
        bytes32 agentId;
        string domain;
        string decisionHash;
        uint256 timestamp;
        address recorder;
        uint256 blockNumber;
    }

    address public immutable revenueRouter;

    mapping(bytes32 => AgentProfile) public profiles;
    mapping(bytes32 => bool) public profileRegistered;
    bytes32[] public agentIndex;

    EmergenceClaimRecord[] private records;
    mapping(bytes32 => EmergenceClaimRecord) private recordsById;
    mapping(bytes32 => bool) public claimExists;
    mapping(bytes32 => bytes32[]) private claimIdsByAgent;

    event AgentRegistered(
        bytes32 indexed agentId,
        string primaryDomain,
        string secondaryDomain,
        string tertiaryDomain,
        bool doveFlag,
        uint256 timestamp
    );

    event EmergenceClaimRecorded(
        bytes32 indexed claimId,
        bytes32 indexed agentId,
        string domain,
        string decisionHash,
        uint256 timestamp,
        address indexed recorder
    );

    error InvalidRevenueRouter();
    error InvalidAgentId();
    error InvalidDomain();
    error InvalidScore();
    error InvalidDecisionHash();
    error InvalidTimestamp();
    error DuplicateAgent();
    error DuplicateClaim();
    error ClaimNotFound();
    error IndexOutOfBounds();

    constructor(address revenueRouter_) {
        if (revenueRouter_ == address(0)) {
            revert InvalidRevenueRouter();
        }

        revenueRouter = revenueRouter_;
    }

    function registerAgent(
        bytes32 agentId,
        string calldata primaryDomain,
        string calldata secondaryDomain,
        string calldata tertiaryDomain,
        uint8[8] calldata scores,
        bool doveFlag
    ) external {
        if (agentId == bytes32(0)) {
            revert InvalidAgentId();
        }
        if (
            !_validDomain(primaryDomain)
                || !_validDomain(secondaryDomain)
                || !_validDomain(tertiaryDomain)
        ) {
            revert InvalidDomain();
        }
        for (uint256 i = 0; i < scores.length; i++) {
            if (scores[i] > 100) {
                revert InvalidScore();
            }
        }
        if (profileRegistered[agentId]) {
            revert DuplicateAgent();
        }

        profiles[agentId] = AgentProfile({
            agentId: agentId,
            primaryDomain: primaryDomain,
            secondaryDomain: secondaryDomain,
            tertiaryDomain: tertiaryDomain,
            openness: scores[0],
            conscientiousness: scores[1],
            extraversion: scores[2],
            agreeableness: scores[3],
            neuroticism: scores[4],
            machiavellianism: scores[5],
            narcissism: scores[6],
            psychopathy: scores[7],
            doveFlag: doveFlag,
            timestamp: block.timestamp
        });

        profileRegistered[agentId] = true;
        agentIndex.push(agentId);

        emit AgentRegistered(agentId, primaryDomain, secondaryDomain, tertiaryDomain, doveFlag, block.timestamp);
    }

    function recordClaim(
        bytes32 agentId,
        string calldata domain,
        string calldata decisionHash,
        uint256 timestamp
    ) external returns (bytes32 claimId) {
        if (agentId == bytes32(0)) {
            revert InvalidAgentId();
        }
        if (!_validDomain(domain)) {
            revert InvalidDomain();
        }
        if (bytes(decisionHash).length == 0 || bytes(decisionHash).length > 96) {
            revert InvalidDecisionHash();
        }
        if (timestamp == 0 || timestamp > block.timestamp + 5 minutes) {
            revert InvalidTimestamp();
        }

        claimId = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                agentId,
                domain,
                decisionHash,
                timestamp,
                msg.sender
            )
        );

        if (claimExists[claimId]) {
            revert DuplicateClaim();
        }

        EmergenceClaimRecord memory record = EmergenceClaimRecord({
            claimId: claimId,
            agentId: agentId,
            domain: domain,
            decisionHash: decisionHash,
            timestamp: timestamp,
            recorder: msg.sender,
            blockNumber: block.number
        });

        records.push(record);
        recordsById[claimId] = record;
        claimExists[claimId] = true;
        claimIdsByAgent[agentId].push(claimId);

        emit EmergenceClaimRecorded(claimId, agentId, domain, decisionHash, timestamp, msg.sender);
    }

    function claimCount() external view returns (uint256) {
        return records.length;
    }

    function agentCount() external view returns (uint256) {
        return agentIndex.length;
    }

    function getClaim(uint256 index) external view returns (EmergenceClaimRecord memory) {
        if (index >= records.length) {
            revert IndexOutOfBounds();
        }

        return records[index];
    }

    function getClaimById(bytes32 claimId) external view returns (EmergenceClaimRecord memory) {
        if (!claimExists[claimId]) {
            revert ClaimNotFound();
        }

        return recordsById[claimId];
    }

    function getAgentClaimIds(bytes32 agentId) external view returns (bytes32[] memory) {
        return claimIdsByAgent[agentId];
    }

    function _validDomain(string calldata domain) private pure returns (bool) {
        return bytes(domain).length > 0 && bytes(domain).length <= 32;
    }
}

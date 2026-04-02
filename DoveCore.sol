// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 * @title DoveCore
 * @notice Sovereign Monad Ecosystem — Phase 1a
 * @dev The immutable accountability anchor of the Sovereign Monad Ecosystem.
 *      Receives observation calls from all registered ecosystem contracts and
 *      stores them permanently on-chain. Cannot be paused, upgraded, or have
 *      any stored observation deleted.
 *
 *      Dove does not gate — it witnesses. Accountability is created through
 *      permanent, queryable, on-chain record. No action in the ecosystem
 *      is invisible to Dove.
 *
 * Architecture position:
 *   GovernanceController  ─┐
 *   RevenueRouter         ─┤
 *   InboundReceiver       ─┼──► DoveCore.sol (this contract)
 *   All Sink Contracts    ─┤
 *   DoveRouterObserver    ─┘
 *
 * Author: Cristobal Colon (xkryptic)
 * Version: 1.0.1
 * Date: March 25, 2026
 * Network: Monad Mainnet (Phase 1a)
 */

// ─────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────

error NotAuthorized();
error NotRegisteredObserver(address caller);
error ZeroAddress();
error ObserverAlreadyRegistered(address observer);
error ObserverNotRegistered(address observer);
error InvalidLabel();
error ObservationIndexOutOfBounds(uint256 requested, uint256 total);

// ─────────────────────────────────────────────
// STRUCTS
// ─────────────────────────────────────────────

struct Observation {
    uint256 id;           // Global monotonic observation ID
    address source;       // Contract that submitted the observation
    bytes32 eventType;    // Categorized event type (keccak256 label)
    bytes   data;         // ABI-encoded payload
    uint256 blockNumber;  // Block at time of observation
    uint256 timestamp;    // Block timestamp
}

struct ObserverRecord {
    address observer;
    string  label;        // Human-readable name (e.g. "GovernanceController")
    uint256 registeredAt;
    bool    active;
    uint256 observationCount;
}

struct DoveStatus {
    uint256 totalObservations;
    uint256 activeObservers;
    uint256 totalRegisteredObservers;
    uint256 lastObservationTimestamp;
    address lastObservationSource;
    bytes32 lastObservationType;
}

// ─────────────────────────────────────────────
// CONTRACT
// ─────────────────────────────────────────────

contract DoveCore {

    // ── Constants ───────────────────────────

    /// @dev Maximum data payload per observation (prevents gas attacks)
    uint256 public constant MAX_DATA_LENGTH = 2048;

    /// @dev Maximum label length for observer registration
    uint256 public constant MAX_LABEL_LENGTH = 64;

    // ── State ────────────────────────────────

    /// @notice Owner — initial setup authority, transfers to DAO Phase 3
    address public owner;

    /// @notice Global observation counter (monotonically increasing, never resets)
    uint256 public observationCount;

    /// @notice All observations stored permanently — append only, never deleted
    Observation[] private _observations;

    /// @notice Observer registry
    mapping(address => ObserverRecord) public observers;
    address[] private _observerList;

    /// @notice Per-source observation index (source => array of global observation IDs)
    mapping(address => uint256[]) private _sourceObservationIds;

    /// @notice Per-eventType observation index (eventType => array of global observation IDs)
    mapping(bytes32 => uint256[]) private _typeObservationIds;

    /// @notice Dove status cache (updated on every observation)
    DoveStatus private _doveStatus;

    // ── Well-Known Event Type Registry ──────

    /// @dev Governance
    bytes32 public constant EVT_ALLOCATION_QUEUED     = keccak256("ALLOCATION_QUEUED");
    bytes32 public constant EVT_ALLOCATION_EXECUTED   = keccak256("ALLOCATION_EXECUTED");
    bytes32 public constant EVT_ALLOCATION_CANCELLED  = keccak256("ALLOCATION_CANCELLED");
    bytes32 public constant EVT_EXECUTOR_ADDED        = keccak256("EXECUTOR_ADDED");
    bytes32 public constant EVT_EXECUTOR_REMOVED      = keccak256("EXECUTOR_REMOVED");
    bytes32 public constant EVT_SIGNER_ADDED          = keccak256("SIGNER_ADDED");
    bytes32 public constant EVT_SIGNER_REMOVED        = keccak256("SIGNER_REMOVED");
    bytes32 public constant EVT_THRESHOLD_UPDATED     = keccak256("THRESHOLD_UPDATED");
    bytes32 public constant EVT_EMERGENCY_PAUSED      = keccak256("EMERGENCY_PAUSED");
    bytes32 public constant EVT_EMERGENCY_UNPAUSED    = keccak256("EMERGENCY_UNPAUSED");
    bytes32 public constant EVT_OWNERSHIP_TRANSFERRED = keccak256("OWNERSHIP_TRANSFERRED");

    /// @dev Router layer
    bytes32 public constant EVT_ROUTE_EXECUTED        = keccak256("ROUTE_EXECUTED");
    bytes32 public constant EVT_SOURCE_REGISTERED     = keccak256("SOURCE_REGISTERED");
    bytes32 public constant EVT_SOURCE_REMOVED        = keccak256("SOURCE_REMOVED");
    bytes32 public constant EVT_INFLOW_RECEIVED       = keccak256("INFLOW_RECEIVED");

    /// @dev Sink layer
    bytes32 public constant EVT_MEV_DISBURSEMENT      = keccak256("MEV_DISBURSEMENT");
    bytes32 public constant EVT_PHASE3_ACTIVATED      = keccak256("PHASE3_ACTIVATED");
    bytes32 public constant EVT_STIPEND_SUNSET        = keccak256("STIPEND_SUNSET");
    bytes32 public constant EVT_RESERVE_RELEASED      = keccak256("RESERVE_RELEASED");
    bytes32 public constant EVT_TREASURY_YIELD        = keccak256("TREASURY_YIELD");

    /// @dev Dove-layer internal
    bytes32 public constant EVT_OBSERVER_REGISTERED   = keccak256("OBSERVER_REGISTERED");
    bytes32 public constant EVT_OBSERVER_DEACTIVATED  = keccak256("OBSERVER_DEACTIVATED");
    bytes32 public constant EVT_OBSERVER_REACTIVATED  = keccak256("OBSERVER_REACTIVATED");

    // ── Events ───────────────────────────────

    /// @notice Emitted for every observation — primary off-chain indexing hook
    event DoveObservation(
        uint256 indexed observationId,
        address indexed source,
        bytes32 indexed eventType,
        bytes   data,
        uint256 blockNumber,
        uint256 timestamp
    );

    event ObserverRegistered(
        address indexed observer,
        string  label,
        uint256 timestamp
    );

    event ObserverDeactivated(
        address indexed observer,
        uint256 timestamp
    );

    event ObserverReactivated(
        address indexed observer,
        uint256 timestamp
    );

    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
    );

    // ── Modifiers ────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyRegisteredObserver() {
        if (!observers[msg.sender].active)
            revert NotRegisteredObserver(msg.sender);
        _;
    }

    // ─────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────

    /**
     * @param _owner  Deployer — initial governance authority
     * @dev DoveCore registers itself as its own first observer
     *      so internal Dove events (observer registration) are
     *      visible in the unified observation log.
     */
    constructor(address _owner) {
        if (_owner == address(0)) revert ZeroAddress();
        owner = _owner;

        // Self-register: Dove observes itself
        _registerObserverInternal(address(this), "DoveCore");

        // Seed status
        _doveStatus = DoveStatus({
            totalObservations:        0,
            activeObservers:          1, // self
            totalRegisteredObservers: 1,
            lastObservationTimestamp: block.timestamp,
            lastObservationSource:    address(this),
            lastObservationType:      EVT_OBSERVER_REGISTERED
        });
    }

    // ─────────────────────────────────────────
    // CORE OBSERVATION — CALLED BY ECOSYSTEM
    // ─────────────────────────────────────────

    /**
     * @notice Submit an observation — the primary ecosystem interface
     * @param source     The originating contract (may differ from msg.sender
     *                   when DoveRouterObserver proxies for inner contracts)
     * @param eventType  keccak256-encoded event category
     * @param data       ABI-encoded event payload
     * @dev  Only callable by registered, active observers.
     *       Observations are stored permanently and cannot be removed.
     *       Failure here must NEVER block the calling contract — callers
     *       should wrap this in try/catch (as GovernanceController does).
     */
    function observe(
        address source,
        bytes32 eventType,
        bytes calldata data
    ) external onlyRegisteredObserver {
        // Enforce payload size limit
        require(data.length <= MAX_DATA_LENGTH, "DoveCore: payload too large");

        uint256 id = observationCount;

        // Store permanently
        _observations.push(Observation({
            id:          id,
            source:      source,
            eventType:   eventType,
            data:        data,
            blockNumber: block.number,
            timestamp:   block.timestamp
        }));

        // Update indexes
        _sourceObservationIds[source].push(id);
        _typeObservationIds[eventType].push(id);

        // Update observer record
        observers[msg.sender].observationCount++;

        // Update status cache
        _doveStatus.totalObservations        = id + 1;
        _doveStatus.lastObservationTimestamp = block.timestamp;
        _doveStatus.lastObservationSource    = source;
        _doveStatus.lastObservationType      = eventType;

        // Increment global counter
        observationCount++;

        emit DoveObservation(id, source, eventType, data, block.number, block.timestamp);
    }

    // ─────────────────────────────────────────
    // OBSERVER MANAGEMENT
    // ─────────────────────────────────────────

    /**
     * @notice Register a new ecosystem contract as an authorized observer
     * @param _observer  Contract address
     * @param _label     Human-readable label (e.g. "GovernanceController")
     */
    function registerObserver(address _observer, string calldata _label)
        external
        onlyOwner
    {
        if (bytes(_label).length == 0 || bytes(_label).length > MAX_LABEL_LENGTH)
            revert InvalidLabel();
        if (observers[_observer].registeredAt != 0)
            revert ObserverAlreadyRegistered(_observer);

        _registerObserverInternal(_observer, _label);

        _doveStatus.activeObservers++;
        _doveStatus.totalRegisteredObservers++;

        emit ObserverRegistered(_observer, _label, block.timestamp);

        // Dove self-observation: log the registration event
        _selfObserve(
            EVT_OBSERVER_REGISTERED,
            abi.encode(_observer, _label, block.timestamp)
        );
    }

    /**
     * @notice Deactivate an observer (does NOT delete historical observations)
     * @dev Used when a contract is deprecated or replaced.
     *      Historical record is permanently preserved.
     */
    function deactivateObserver(address _observer) external onlyOwner {
        if (observers[_observer].registeredAt == 0)
            revert ObserverNotRegistered(_observer);

        observers[_observer].active = false;
        _doveStatus.activeObservers--;

        emit ObserverDeactivated(_observer, block.timestamp);

        _selfObserve(
            EVT_OBSERVER_DEACTIVATED,
            abi.encode(_observer, block.timestamp)
        );
    }

    /**
     * @notice Reactivate a previously deactivated observer
     * @dev Used when a contract resumes operation (e.g. after upgrade).
     */
    function reactivateObserver(address _observer) external onlyOwner {
        if (observers[_observer].registeredAt == 0)
            revert ObserverNotRegistered(_observer);
        if (observers[_observer].active)
            revert ObserverAlreadyRegistered(_observer);

        observers[_observer].active = true;
        _doveStatus.activeObservers++;

        emit ObserverReactivated(_observer, block.timestamp);

        _selfObserve(
            EVT_OBSERVER_REACTIVATED,
            abi.encode(_observer, block.timestamp)
        );
    }

    // ─────────────────────────────────────────
    // OWNERSHIP
    // ─────────────────────────────────────────

    /**
     * @notice Transfer ownership — Phase 3 DAO handoff
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        address old = owner;
        owner = _newOwner;
        emit OwnershipTransferred(old, _newOwner);
        _selfObserve(
            EVT_OWNERSHIP_TRANSFERRED,
            abi.encode(old, _newOwner, block.timestamp)
        );
    }

    // ─────────────────────────────────────────
    // VIEW — OBSERVATION QUERIES
    // ─────────────────────────────────────────

    /**
     * @notice Retrieve a single observation by global ID
     */
    function getObservation(uint256 id)
        external view
        returns (Observation memory)
    {
        if (id >= _observations.length)
            revert ObservationIndexOutOfBounds(id, _observations.length);
        return _observations[id];
    }

    /**
     * @notice Retrieve a paginated slice of all observations
     * @param offset  Starting index
     * @param limit   Maximum records to return
     */
    function getObservations(uint256 offset, uint256 limit)
        external view
        returns (Observation[] memory result)
    {
        uint256 total = _observations.length;
        if (offset >= total) return new Observation[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 count = end - offset;

        result = new Observation[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = _observations[offset + i];
        }
    }

    /**
     * @notice Get all observation IDs emitted by a specific source address
     */
    function getObservationIdsBySource(address source)
        external view
        returns (uint256[] memory)
    {
        return _sourceObservationIds[source];
    }

    /**
     * @notice Get all observation IDs of a specific event type
     */
    function getObservationIdsByType(bytes32 eventType)
        external view
        returns (uint256[] memory)
    {
        return _typeObservationIds[eventType];
    }

    /**
     * @notice Get observations by source within a timestamp range
     * @dev Iterates source IDs — use off-chain indexing for large datasets
     */
    function getObservationsBySourceInRange(
        address source,
        uint256 fromTimestamp,
        uint256 toTimestamp
    ) external view returns (Observation[] memory) {
        uint256[] memory ids = _sourceObservationIds[source];
        uint256 count;

        for (uint256 i = 0; i < ids.length; i++) {
            Observation memory obs = _observations[ids[i]];
            if (obs.timestamp >= fromTimestamp && obs.timestamp <= toTimestamp) {
                count++;
            }
        }

        Observation[] memory result = new Observation[](count);
        uint256 idx;
        for (uint256 i = 0; i < ids.length; i++) {
            Observation memory obs = _observations[ids[i]];
            if (obs.timestamp >= fromTimestamp && obs.timestamp <= toTimestamp) {
                result[idx++] = obs;
            }
        }
        return result;
    }

    // ─────────────────────────────────────────
    // VIEW — STATUS & REGISTRY
    // ─────────────────────────────────────────

    /**
     * @notice Unified Dove status — consumed by DoveRouterObserver and dashboards
     */
    function getDoveStatus() external view returns (DoveStatus memory) {
        return _doveStatus;
    }

    /**
     * @notice Get observer record for a given address
     */
    function getObserver(address _observer)
        external view
        returns (ObserverRecord memory)
    {
        return observers[_observer];
    }

    /**
     * @notice Get all registered observer addresses
     */
    function getObserverList() external view returns (address[] memory) {
        return _observerList;
    }

    /**
     * @notice Check if an address is an active observer
     */
    function isActiveObserver(address _observer) external view returns (bool) {
        return observers[_observer].active;
    }

    /**
     * @notice Total observations per source
     */
    function getSourceObservationCount(address source)
        external view
        returns (uint256)
    {
        return _sourceObservationIds[source].length;
    }

    /**
     * @notice Total observations per event type
     */
    function getTypeObservationCount(bytes32 eventType)
        external view
        returns (uint256)
    {
        return _typeObservationIds[eventType].length;
    }

    // ─────────────────────────────────────────
    // INTERNAL
    // ─────────────────────────────────────────

    function _registerObserverInternal(
        address _observer,
        string memory _label
    ) internal {
        observers[_observer] = ObserverRecord({
            observer:         _observer,
            label:            _label,
            registeredAt:     block.timestamp,
            active:           true,
            observationCount: 0
        });
        _observerList.push(_observer);
    }

    /**
     * @notice DoveCore observes itself — only used internally for
     *         observer registration/deactivation/ownership events.
     *         Bypasses the onlyRegisteredObserver modifier since DoveCore
     *         is self-registered in the constructor.
     */
    function _selfObserve(bytes32 eventType, bytes memory data) internal {
        if (data.length > MAX_DATA_LENGTH) return; // silent cap, never revert internally

        uint256 id = observationCount;

        _observations.push(Observation({
            id:          id,
            source:      address(this),
            eventType:   eventType,
            data:        data,
            blockNumber: block.number,
            timestamp:   block.timestamp
        }));

        _sourceObservationIds[address(this)].push(id);
        _typeObservationIds[eventType].push(id);
        observers[address(this)].observationCount++;

        _doveStatus.totalObservations        = id + 1;
        _doveStatus.lastObservationTimestamp = block.timestamp;
        _doveStatus.lastObservationSource    = address(this);
        _doveStatus.lastObservationType      = eventType;

        observationCount++;

        emit DoveObservation(id, address(this), eventType, data, block.number, block.timestamp);
    }
}

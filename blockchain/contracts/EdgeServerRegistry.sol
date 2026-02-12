// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * EdgeServerRegistry - Separate hierarchy for RSU/Edge Server infrastructure
 * 
 * Purpose: Manage Road Side Units (RSUs) and Edge Servers as distinct infrastructure
 * entities, separate from vehicle management. This allows different operational
 * parameters and permissions compared to vehicle registration.
 */

contract EdgeServerRegistry {

    address public admin;

    struct EdgeServer {
        string serverId;
        address serverAddress;
        bool active;
        uint registeredTime;
        string location;          // GPS or area identifier
        uint8 performanceScore;   // 0-100, Quality of Service metric
    }

    mapping(address => EdgeServer) public edgeServers;
    address[] public edgeServerAddresses;

    event EdgeServerRegistered(
        address indexed serverAddress,
        string serverId,
        string location
    );
    
    event EdgeServerDeactivated(address indexed serverAddress);
    
    event EdgeServerActivated(address indexed serverAddress);
    
    event PerformanceScoreUpdated(
        address indexed serverAddress,
        uint8 newScore
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyRegisteredServer(address _serverAddress) {
        require(edgeServers[_serverAddress].active, "Edge server not active");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * Register a new Edge Server/RSU
     */
    function registerEdgeServer(
        string memory _serverId,
        address _serverAddress,
        string memory _location
    ) public onlyAdmin {
        require(_serverAddress != address(0), "Invalid server address");
        require(!edgeServers[_serverAddress].active, "Server already registered");
        require(bytes(_serverId).length > 0, "Server ID cannot be empty");

        edgeServers[_serverAddress] = EdgeServer(
            _serverId,
            _serverAddress,
            true,
            block.timestamp,
            _location,
            100  // Start with perfect performance score
        );

        edgeServerAddresses.push(_serverAddress);

        emit EdgeServerRegistered(_serverAddress, _serverId, _location);
    }

    /**
     * Check if address is an active edge server
     */
    function isActiveEdgeServer(address _address) public view returns (bool) {
        return edgeServers[_address].active;
    }

    /**
     * Get edge server details
     */
    function getEdgeServerInfo(address _serverAddress) public view returns (
        string memory serverId,
        bool active,
        uint registeredTime,
        string memory location,
        uint8 performanceScore
    ) {
        EdgeServer memory server = edgeServers[_serverAddress];
        return (
            server.serverId,
            server.active,
            server.registeredTime,
            server.location,
            server.performanceScore
        );
    }

    /**
     * Get performance score of edge server
     */
    function getPerformanceScore(address _serverAddress) public view returns (uint8) {
        return edgeServers[_serverAddress].performanceScore;
    }

    /**
     * Update performance score based on operational metrics
     * Score based on: uptime, alert processing speed, network quality
     */
    function updatePerformanceScore(address _serverAddress, uint8 _newScore) 
        public 
        onlyAdmin 
    {
        require(edgeServers[_serverAddress].active, "Server not active");
        require(_newScore <= 100, "Score must be 0-100");

        edgeServers[_serverAddress].performanceScore = _newScore;
        emit PerformanceScoreUpdated(_serverAddress, _newScore);
    }

    /**
     * Deactivate an edge server (remove from service)
     */
    function deactivateEdgeServer(address _serverAddress) 
        public 
        onlyAdmin 
    {
        require(edgeServers[_serverAddress].active, "Server not active");
        
        edgeServers[_serverAddress].active = false;
        emit EdgeServerDeactivated(_serverAddress);
    }

    /**
     * Reactivate a deactivated edge server
     */
    function reactivateEdgeServer(address _serverAddress) 
        public 
        onlyAdmin 
    {
        require(!edgeServers[_serverAddress].active, "Server already active");
        require(edgeServers[_serverAddress].serverAddress != address(0), "Server not registered");

        edgeServers[_serverAddress].active = true;
        emit EdgeServerActivated(_serverAddress);
    }

    /**
     * Get count of registered edge servers
     */
    function getEdgeServerCount() public view returns (uint) {
        return edgeServerAddresses.length;
    }

    /**
     * Get edge server address by index
     */
    function getEdgeServerByIndex(uint _index) public view returns (address) {
        require(_index < edgeServerAddresses.length, "Invalid index");
        return edgeServerAddresses[_index];
    }
}

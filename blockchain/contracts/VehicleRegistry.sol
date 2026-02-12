// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VehicleRegistry {

    enum VehicleCategory {
        NORMAL_VEHICLE,      // Regular passenger vehicle
        EMERGENCY_VEHICLE    // Ambulance, Fire truck, Police
    }

    address public admin;

    struct Vehicle {
        string vehicleId;
        VehicleCategory category;
        bool registered;
        uint registeredTime;
        uint trustScore;     // 0-100, higher = more trustworthy
    }

    mapping(address => Vehicle) public vehicles;

    event VehicleRegistered(
        address indexed vehicleAddress, 
        string vehicleId, 
        VehicleCategory category
    );
    event VehicleUpdated(address indexed vehicleAddress, VehicleCategory newCategory);
    event TrustScoreUpdated(address indexed vehicleAddress, uint newScore);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerVehicle(string memory _vehicleId, VehicleCategory _category) public {
        require(!vehicles[msg.sender].registered, "Vehicle already registered");
        require(bytes(_vehicleId).length > 0, "Vehicle ID cannot be empty");

        vehicles[msg.sender] = Vehicle(
            _vehicleId,
            _category,
            true,
            block.timestamp,
            100  // Start with full trust
        );

        emit VehicleRegistered(msg.sender, _vehicleId, _category);
    }

    function isRegistered(address _vehicle) public view returns (bool) {
        return vehicles[_vehicle].registered;
    }

    function getVehicleCategory(address _vehicle) public view returns (VehicleCategory) {
        require(vehicles[_vehicle].registered, "Vehicle not registered");
        return vehicles[_vehicle].category;
    }

    function isEmergencyVehicle(address _vehicle) public view returns (bool) {
        return vehicles[_vehicle].registered && 
               vehicles[_vehicle].category == VehicleCategory.EMERGENCY_VEHICLE;
    }

    function getTrustScore(address _vehicle) public view returns (uint) {
        if (!vehicles[_vehicle].registered) return 0;
        return vehicles[_vehicle].trustScore;
    }

    function updateTrustScore(address _vehicle, uint _newScore) public onlyAdmin {
        require(vehicles[_vehicle].registered, "Vehicle not registered");
        require(_newScore <= 100, "Trust score must be 0-100");
        
        vehicles[_vehicle].trustScore = _newScore;
        emit TrustScoreUpdated(_vehicle, _newScore);
    }

    function updateVehicleCategory(address _vehicle, VehicleCategory _newCategory) public onlyAdmin {
        require(vehicles[_vehicle].registered, "Vehicle not registered");
        
        vehicles[_vehicle].category = _newCategory;
        emit VehicleUpdated(_vehicle, _newCategory);
    }
}
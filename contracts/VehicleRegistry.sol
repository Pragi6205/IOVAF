// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VehicleRegistry {

    address public admin;

    struct Vehicle {
        string vehicleId;
        bool registered;
    }

    mapping(address => Vehicle) public vehicles;

    event VehicleRegistered(address indexed vehicleAddress, string vehicleId);

    constructor() {
        admin = msg.sender;
    }

    function registerVehicle(string memory _vehicleId) public {
        require(!vehicles[msg.sender].registered, "Vehicle already registered");

        vehicles[msg.sender] = Vehicle(_vehicleId, true);

        emit VehicleRegistered(msg.sender, _vehicleId);
    }

    function isRegistered(address _vehicle) public view returns (bool) {
        return vehicles[_vehicle].registered;
    }
}
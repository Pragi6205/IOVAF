// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./VehicleRegistry.sol";

contract AlertSystem {

    VehicleRegistry registry;

    struct Alert {
        string message;
        address sender;
        uint timestamp;
    }

    Alert[] public alerts;

    event AlertSent(string message, address indexed sender);

    constructor(address registryAddress) {
        registry = VehicleRegistry(registryAddress);
    }

    function sendAlert(string memory _message) public {

        require(
            registry.isRegistered(msg.sender),
            "Only registered vehicles/nodes can send alerts"
        );

        alerts.push(Alert(_message, msg.sender, block.timestamp));

        emit AlertSent(_message, msg.sender);
    }

    function getAlerts() public view returns (Alert[] memory) {
        return alerts;
    }
}
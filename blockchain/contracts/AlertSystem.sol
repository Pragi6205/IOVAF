// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";
import "./VehicleRegistry.sol";
import "./EdgeServerRegistry.sol";

contract AlertSystem {

    VehicleRegistry registry;
    EdgeServerRegistry edgeServerRegistry;

    enum AlertType {
        ACCIDENT,       // Collision/crash
        HAZARD,        // Road hazard (pothole, debris, etc.)
        CONGESTION,    // Traffic congestion
        EMERGENCY      // Emergency vehicle alert
    }

    enum AlertPriority {
        LOW,           // Normal conditions
        MEDIUM,        // Caution needed
        HIGH,          // Urgent
        CRITICAL       // Emergency/Life-threatening
    }

    struct Alert {
        string message;
        address sender;
        uint timestamp;
        AlertType alertType;
        AlertPriority priority;
        bool isEmergencyBroadcast;  // True if emergency vehicle broadcast
    }

    Alert[] public alerts;
    uint public alertCount;

    // Recent alerts (last 100) for better performance
    Alert[100] public recentAlerts;
    uint public recentAlertIndex;

    event AlertSent(
        string message,
        address indexed sender,
        AlertType indexed alertType,
        AlertPriority priority,
        bool isEmergencyBroadcast
    );

    event EmergencyAlertBroadcast(
        string message,
        address indexed emergencyVehicle,
        uint timestamp
    );

    constructor(address registryAddress, address edgeServerRegistryAddress) {
        registry = VehicleRegistry(registryAddress);
        edgeServerRegistry = EdgeServerRegistry(edgeServerRegistryAddress);
        alertCount = 0;
        recentAlertIndex = 0;
    }

    modifier onlyRegistered() {
        require(
            registry.isRegistered(msg.sender),
            "Only registered vehicles can send alerts"
        );
        _;
    }

    function sendAlert(
        string memory _message,
        AlertType _alertType,
        AlertPriority _priority
    ) public onlyRegistered {
        require(bytes(_message).length > 0, "Message cannot be empty");
        require(bytes(_message).length <= 500, "Message too long");
        
        // Trust check: vehicles with low trust score need high-severity events
        uint trustScore = registry.getTrustScore(msg.sender);
        if (trustScore < 50) {
            require(
                _priority == AlertPriority.CRITICAL,
                "Low trust vehicles can only send critical alerts"
            );
        }

        Alert memory newAlert = Alert(
            _message,
            msg.sender,
            block.timestamp,
            _alertType,
            _priority,
            false
        );

        alerts.push(newAlert);
        alertCount++;
        
        // Store in recent alerts circular buffer
        recentAlerts[recentAlertIndex] = newAlert;
        recentAlertIndex = (recentAlertIndex + 1) % 100;

        console.log("Alert Added: Type=%s, Priority=%s", uint(_alertType), uint(_priority));

        emit AlertSent(_message, msg.sender, _alertType, _priority, false);
    }

    // Emergency vehicles can broadcast directly to all vehicles
    function emergencyBroadcast(
        string memory _message,
        AlertType _alertType
    ) public onlyRegistered {
        require(
            registry.isEmergencyVehicle(msg.sender),
            "Only emergency vehicles can use emergency broadcast"
        );
        require(bytes(_message).length > 0, "Message cannot be empty");
        require(bytes(_message).length <= 500, "Message too long");

        Alert memory emergencyAlert = Alert(
            _message,
            msg.sender,
            block.timestamp,
            _alertType,
            AlertPriority.CRITICAL,
            true  // Mark as emergency broadcast
        );

        alerts.push(emergencyAlert);
        alertCount++;
        
        recentAlerts[recentAlertIndex] = emergencyAlert;
        recentAlertIndex = (recentAlertIndex + 1) % 100;

        console.log("EMERGENCY BROADCAST from vehicle");

        emit EmergencyAlertBroadcast(_message, msg.sender, block.timestamp);
        emit AlertSent(_message, msg.sender, _alertType, AlertPriority.CRITICAL, true);
    }

    // Edge server can relay and validate alerts
    function relayAlert(
        string memory _message,
        AlertType _alertType,
        AlertPriority _priority,
        address _originVehicle
    ) public {
        require(
            edgeServerRegistry.isActiveEdgeServer(msg.sender),
            "Only active edge servers can relay alerts"
        );
        require(
            registry.isRegistered(_originVehicle),
            "Origin vehicle must be registered"
        );

        Alert memory relayedAlert = Alert(
            _message,
            _originVehicle,
            block.timestamp,
            _alertType,
            _priority,
            false
        );

        alerts.push(relayedAlert);
        alertCount++;
        
        recentAlerts[recentAlertIndex] = relayedAlert;
        recentAlertIndex = (recentAlertIndex + 1) % 100;

        emit AlertSent(_message, _originVehicle, _alertType, _priority, false);
    }

    function getAlerts() public view returns (Alert[] memory) {
        return alerts;
    }

    function getRecentAlerts() public view returns (Alert[100] memory) {
        return recentAlerts;
    }

    function getAlertsByType(AlertType _type) public view returns (Alert[] memory) {
        uint count = 0;
        for (uint i = 0; i < alerts.length; i++) {
            if (alerts[i].alertType == _type) {
                count++;
            }
        }

        Alert[] memory result = new Alert[](count);
        uint index = 0;
        for (uint i = 0; i < alerts.length; i++) {
            if (alerts[i].alertType == _type) {
                result[index] = alerts[i];
                index++;
            }
        }
        return result;
    }

    function getEmergencyAlerts() public view returns (Alert[] memory) {
        uint count = 0;
        for (uint i = 0; i < alerts.length; i++) {
            if (alerts[i].isEmergencyBroadcast) {
                count++;
            }
        }

        Alert[] memory result = new Alert[](count);
        uint index = 0;
        for (uint i = 0; i < alerts.length; i++) {
            if (alerts[i].isEmergencyBroadcast) {
                result[index] = alerts[i];
                index++;
            }
        }
        return result;
    }

    function getTotalAlertCount() public view returns (uint) {
        return alertCount;
    }
}
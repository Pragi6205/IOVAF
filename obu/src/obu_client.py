from typing import List, Optional, Dict, Any
import config
from utils import pick_edge_server, http_post, http_get
import logging

log = logging.getLogger('obu.client')


class VehicleOBU:
    def __init__(self, vehicle_private_key: str, vehicle_id: str, vehicle_category: int = 0,
                 edge_servers: Optional[List[str]] = None):
        self.private_key = vehicle_private_key
        self.vehicle_id = vehicle_id
        self.vehicle_category = int(vehicle_category)
        self.edge_servers = edge_servers or config.EDGE_SERVERS

    def _choose_server(self) -> str:
        return pick_edge_server(self.edge_servers)

    def register(self) -> Dict[str, Any]:
        server = self._choose_server()
        payload = {
            'vehiclePrivateKey': self.private_key,
            'vehicleId': self.vehicle_id,
            'vehicleCategory': self.vehicle_category
        }
        log.info('Registering vehicle %s -> %s', self.vehicle_id, server)
        return http_post(server, '/api/vehicle/register', payload,
                         retries=config.HTTP_RETRIES, backoff=config.HTTP_BACKOFF)

    def check_registration(self, address: str) -> Dict[str, Any]:
        server = self._choose_server()
        return http_get(server, f'/api/vehicle/check/{address}', retries=config.HTTP_RETRIES,
                        backoff=config.HTTP_BACKOFF)

    def send_alert(self, message: str, alert_type: int = 0, priority: int = 1) -> Dict[str, Any]:
        server = self._choose_server()
        payload = {
            'vehiclePrivateKey': self.private_key,
            'alertMessage': message,
            'alertType': int(alert_type),
            'priority': int(priority)
        }
        return http_post(server, '/api/alert/send', payload,
                         retries=config.HTTP_RETRIES, backoff=config.HTTP_BACKOFF)

    def emergency_broadcast(self, message: str, alert_type: int = 3) -> Dict[str, Any]:
        server = self._choose_server()
        payload = {
            'vehiclePrivateKey': self.private_key,
            'alertMessage': message,
            'alertType': int(alert_type)
        }
        return http_post(server, '/api/alert/emergency-broadcast', payload,
                         retries=config.HTTP_RETRIES, backoff=config.HTTP_BACKOFF)

    def process_sensor_data(self, sensor_data: Dict[str, Any], is_emergency_vehicle: bool = False) -> Dict[str, Any]:
        server = self._choose_server()
        payload = {
            'vehiclePrivateKey': self.private_key,
            'sensorData': sensor_data,
            'isEmergencyVehicle': bool(is_emergency_vehicle)
        }
        return http_post(server, '/api/alert/process-sensor-data', payload,
                         retries=config.HTTP_RETRIES, backoff=config.HTTP_BACKOFF)

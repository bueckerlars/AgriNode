# AgriNode API Documentation

## Overview

The AgriNode API is a platform for managing plant sensors. It provides endpoints for user authentication, sensor management, and sensor data collection.

- **Base URL**: `http://localhost:5066`
- **Version**: 1.0.0

---

## Authentication

### Register a New User

**POST** `/api/auth/register`

Registers a new user.

- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "username": "string"
  }
  ```
- **Responses**:
  - `201`: User successfully created
  - `400`: Invalid input data
  - `409`: Email already exists

### Log In a User

**POST** `/api/auth/login`

Logs in a user.

- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Responses**:
  - `200`: Login successful
  - `401`: Invalid login credentials

### Refresh Authentication Token

**POST** `/api/auth/refresh`

Generates a new authentication token.

- **Security**: `cookieAuth`
- **Responses**:
  - `200`: New token generated
  - `401`: Invalid or expired refresh token

### Log Out a User

**POST** `/api/auth/logout`

Logs out the current user.

- **Responses**:
  - `200`: Logout successful
  - `401`: Not authenticated

### Get Current User Profile

**GET** `/api/auth/me`

Retrieves the profile of the authenticated user.

- **Security**: `bearerAuth`
- **Responses**:
  - `200`: User profile data
  - `401`: Not authenticated

### Change User Password

**POST** `/api/auth/change-password`

Changes the password of the authenticated user.

- **Security**: `bearerAuth`
- **Request Body**:
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```
- **Responses**:
  - `200`: Password successfully changed
  - `400`: Invalid input data
  - `401`: Not authenticated

---

## Sensors

### Get All Sensors

**GET** `/api/sensors`

Retrieves all sensors for the authenticated user.

- **Security**: `bearerAuth`
- **Responses**:
  - `200`: List of sensors
  - `401`: Not authenticated
  - `500`: Internal server error

### Register a New Sensor

**POST** `/api/sensors/register`

Registers a new sensor.

- **Security**: `bearerAuth`
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "unique_device_id": "string"
  }
  ```
- **Responses**:
  - `201`: Sensor successfully registered
  - `400`: Bad request
  - `401`: Not authenticated
  - `409`: Sensor with this device ID already exists
  - `500`: Internal server error

### Get Sensor by ID

**GET** `/api/sensors/{sensorId}`

Retrieves information about a specific sensor.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `sensorId`: ID of the sensor
- **Responses**:
  - `200`: Sensor information
  - `400`: Missing sensor ID
  - `401`: Not authenticated
  - `403`: No permission to access this sensor
  - `404`: Sensor not found
  - `500`: Internal server error

### Update Sensor Information

**PUT** `/api/sensors/{sensorId}`

Updates information about a specific sensor.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `sensorId`: ID of the sensor
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **Responses**:
  - `200`: Sensor information updated
  - `400`: Missing sensor ID or update data
  - `401`: Not authenticated
  - `403`: No permission to update this sensor
  - `404`: Sensor not found
  - `500`: Internal server error

### Delete a Sensor

**DELETE** `/api/sensors/{sensorId}`

Unregisters (deletes) a sensor.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `sensorId`: ID of the sensor
- **Responses**:
  - `200`: Sensor successfully unregistered
  - `400`: Missing sensor ID
  - `401`: Not authenticated
  - `403`: No permission to delete this sensor
  - `404`: Sensor not found
  - `500`: Internal server error

---

## Sensor Data

### Create New Sensor Data

**POST** `/api/sensor-data`

Creates a new sensor data record.

- **Request Body**:
  ```json
  {
    "sensor_id": "string",
    "timestamp": "string",
    "air_humidity": "number",
    "air_temperature": "number",
    "soil_moisture": "number",
    "soil_temperature": "number",
    "brightness": "number",
    "battery_level": "number"
  }
  ```
- **Responses**:
  - `201`: Sensor data successfully created
  - `400`: Bad request
  - `500`: Server error

### Get All Sensor Data

**GET** `/api/sensor-data`

Retrieves all sensor data records.

- **Security**: `bearerAuth`
- **Responses**:
  - `200`: List of sensor data records
  - `401`: Not authenticated
  - `500`: Server error

### Get Sensor Data by ID

**GET** `/api/sensor-data/{id}`

Retrieves a specific sensor data record by ID.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `id`: Sensor data ID
- **Responses**:
  - `200`: Sensor data record
  - `401`: Not authenticated
  - `404`: Sensor data not found
  - `500`: Server error

### Update Sensor Data

**PUT** `/api/sensor-data/{id}`

Updates a specific sensor data record.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `id`: Sensor data ID
- **Request Body**:
  ```json
  {
    "timestamp": "string",
    "air_humidity": "number",
    "air_temperature": "number",
    "soil_moisture": "number",
    "soil_temperature": "number",
    "brightness": "number",
    "battery_level": "number"
  }
  ```
- **Responses**:
  - `200`: Updated sensor data record
  - `401`: Not authenticated
  - `404`: Sensor data not found
  - `500`: Server error

### Delete Sensor Data

**DELETE** `/api/sensor-data/{id}`

Deletes a specific sensor data record.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `id`: Sensor data ID
- **Responses**:
  - `200`: Sensor data successfully deleted
  - `401`: Not authenticated
  - `404`: Sensor data not found
  - `500`: Server error

### Get Sensor Data by Sensor ID

**GET** `/api/sensor-data/sensor/{sensorId}`

Retrieves all data for a specific sensor.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `sensorId`: Sensor ID
- **Responses**:
  - `200`: List of sensor data records
  - `401`: Not authenticated
  - `500`: Server error

### Delete All Data for a Sensor

**DELETE** `/api/sensor-data/sensor/{sensorId}`

Deletes all data for a specific sensor.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `sensorId`: Sensor ID
- **Responses**:
  - `200`: Sensor data successfully deleted
  - `401`: Not authenticated
  - `500`: Server error

### Get Sensor Data Within a Time Range

**GET** `/api/sensor-data/sensor/{sensorId}/timerange`

Retrieves sensor data within a specified time range.

- **Security**: `bearerAuth`
- **Path Parameters**:
  - `sensorId`: Sensor ID
- **Query Parameters**:
  - `startTime`: Start time (ISO format)
  - `endTime`: End time (ISO format)
- **Responses**:
  - `200`: List of sensor data records
  - `400`: Invalid parameters
  - `401`: Not authenticated
  - `500`: Server error

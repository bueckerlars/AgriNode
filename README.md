# AgriNode: Multifunctional Plant Pot Sensor with WEMOS D1 Mini

[![Status](https://img.shields.io/badge/Status-Development-yellow)](https://github.com/YOUR_GITHUB_USERNAME/AgriNode)
[![GitHub Issues](https://img.shields.io/github/issues/bueckerlars/AgriNode)](https://github.com/bueckerlars/AgriNode/issues)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Description

AgriNode is an open-source project that realizes a cost-effective and energy-efficient multifunctional sensor for plant pots. Based on the WEMOS D1 Mini, this sensor enables the monitoring of important environmental factors such as soil moisture, brightness, temperature, and humidity, which are crucial for optimal plant growth. The project aims to provide both hobby gardeners and technology enthusiasts with a simple way to intelligently monitor and care for their plants.

## Table of Contents

1. [Features](#features)
2. [Hardware Components](#hardware-components)
3. [Software Requirements](#software-requirements)
4. [Setup and Installation](#setup-and-installation)
5. [Usage](#usage)
6. [Power Supply](#power-supply)
7. [Housing](#housing)
8. [Note on Nutrient Measurement](#note-on-nutrient-measurement)
9. [Learning from Existing Projects](#learning-from-existing-projects)
10. [Contributing](#contributing)
11. [License](#license)

## Features

* **Soil Moisture Sensor:** Measures the moisture content of the soil (recommended sensor: capacitive sensor such as the "Gravity: Analog Capacitive Corrosion Resistant Soil Moisture Sensor" from DFRobot or the Lora Soil Moisture Sensor V3 from Makerfabs).
* **Brightness Sensor:** Detects the ambient brightness in lux (recommended sensor: BH1750).
* **Temperature and Humidity Sensor:** Monitors temperature and humidity (recommended sensor: BME280 from Bosch or the DHT22 as a more cost-effective alternative).
* **Energy-Efficient Operation:** Designed for low power consumption and optimized for the deep sleep mode of the WEMOS D1 Mini to extend battery life.
* **Wi-Fi Connectivity:** Utilizes the integrated Wi-Fi functionality of the WEMOS D1 Mini for data transmission (the exact method of data transmission and integration into a platform still needs to be defined).
* **3D-Printable Housing:** Suggestions and considerations for the design of a functional and robust housing.

## Hardware Components

* **Microcontroller:** WEMOS D1 Mini (ESP8266 based)
* **Soil Moisture Sensor:** (see recommendations under Features)
* **Brightness Sensor:** BH1750 Digital Light Sensor
* **Temperature and Humidity Sensor:** BME280 or DHT22
* **Power Supply:**
    * LiPo battery (3.7V) or 18650 Li-Ion battery
    * Battery Management System (BMS) or charging and protection module (e.g., TP4056)
    * Optional: Small solar module (5V-6V, 1W-3W)
    * Optional: Solar LiPo charger (e.g., DFRobot Solar Lipo Charger (3.7V))
* **Connecting cables and breadboard (for prototyping)**
* **3D printing material (for the housing)**

## Software Requirements

* **Arduino IDE:** For programming the WEMOS D1 Mini.
* **Required Arduino Libraries:**
    * For the capacitive soil moisture sensor (depending on the chosen sensor)
    * `Adafruit BME280 Library` and `Adafruit Unified Sensor Library` (for BME280)
    * `DHT sensor library` by Adafruit (for DHT22)
    * `BH1750` library by Christopher Laws
    * `ESP8266WiFi` (included in the Arduino Core for ESP8266)
    * Potentially other libraries for specific sensors or functions.

## Setup and Installation

Detailed instructions for setting up and installing the AgriNode sensor will follow here. This will include the wiring of the sensors to the WEMOS D1 Mini and the installation of the required software.

### Sensor Connection (Preliminary)

* **Capacitive Soil Moisture Sensor:** Analog output to A0 of the WEMOS D1 Mini (pay attention to potential voltage dividers!).
* **BME280:** SDA to D2 (GPIO4), SCL to D1 (GPIO5), VCC to 3.3V, GND to GND.
* **DHT22:** Data pin to a digital pin (e.g., D4/GPIO2), VCC to 3.3V or 5V, GND to GND, pull-up resistor (4.7kΩ - 10kΩ) between data pin and VCC.
* **BH1750:** SDA to D2 (GPIO4), SCL to D1 (GPIO5), VCC to 3.3V, GND to GND.

### Software Installation

1. Install the Arduino IDE.
2. Add the ESP8266 board support to the Arduino IDE (if not already done).
3. Install the libraries mentioned above via the Arduino IDE library manager.
4. Upload the code to the WEMOS D1 Mini (the code will be published here shortly).

## Power Supply

The AgriNode project is designed for energy-efficient operation to ensure a long battery life. By utilizing the deep sleep mode of the WEMOS D1 Mini, power consumption can be significantly reduced.

* **Battery Selection:** Choosing a suitable LiPo or 18650 battery with sufficient capacity is crucial.
* **Battery Management:** Using a BMS module protects the battery from damage and enables safe charging.
* **Solar Integration (Optional):** A small solar module can be used in conjunction with a solar charge controller to charge the battery and extend operating time.

## Contributing

Contributions to this project are warmly welcome. If you have ideas for improvements, bug fixes, or new features, please create an issue or a pull request.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

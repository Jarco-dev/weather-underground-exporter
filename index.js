const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

class MetricsManager {
    constructor() {
        this.port = process.env.PORT;
        this.stationId = process.env.STATION_ID;
        this.apiKey = process.env.API_KEY;
        this.apiUrl = "https://api.weather.com/v2/pws/observations/current";
        this.count = 0;
        this.lastRequestTime = undefined;
        this.data = {};

        this.promClient = require("prom-client");
        this.metrics = {};
        this.createMetrics();

        this.app = express();

        this.start();
    }

    start() {
        this.app.get("/metrics", async (req, res) => {
            try {
                if (!this.lastRequestTime || Date.now() - this.lastRequestTime > 58000) {
                    this.lastRequestTime = Date.now();
                    const res2 = await fetch(`${this.apiUrl}?numericPrecision=decimal&format=json&units=m&stationId=${this.stationId}&apiKey=${this.apiKey}`);
                    if (!res2.ok) console.warn("Unable to retrieve data from weather underground api", res);
                    this.data = (await res2.json()).observations[0];
                }

                await res.set("Content-Type", this.promClient.register.contentType);
                await res.send(await this.promClient.register.metrics());
            } catch(err) {
                console.log("Error while handling metrics request", err);
                res.status(500).send("A internal server error occurred");
            }
        });

        this.app.listen(this.port, () => console.log(`Metrics exposed on port: ${this.port}`));
    }

    createMetrics() {
        this.metrics.solarRadiation = new this.promClient.Gauge({
            name: "wu_solar_radiation",
            help: "Watt per square meter W/m2",
            collect: () => {
                if (this.data.solarRadiation) {
                    this.metrics.solarRadiation.set(this.data.solarRadiation);
                }
            }
        });

        this.metrics.uvIndex = new this.promClient.Gauge({
            name: "wu_uv_index",
            help: "UV index",
            collect: () => {
                if (this.data.uv) {
                    this.metrics.uvIndex.set(this.data.uv);
                }
            }
        });

        this.metrics.windDirection = new this.promClient.Gauge({
            name: "wu_wind_direction",
            help: "Wind direction in degrees",
            collect: () => {
                if (this.data.winddir) {
                    this.metrics.windDirection.set(this.data.winddir);
                }
            }
        });

        this.metrics.humidity = new this.promClient.Gauge({
            name: "wu_humidity",
            help: "Humidity as percentage",
            collect: () => {
                if (this.data.humidity) {
                    this.metrics.humidity.set(this.data.humidity);
                }
            }
        });

        this.metrics.temperature = new this.promClient.Gauge({
            name: "wu_temperature",
            help: "temperature in degrees celsius",
            collect: () => {
                if (this.data.metric.temp) {
                    this.metrics.temperature.set(this.data.metric.temp);
                }
            }
        });

        this.metrics.heatIndex = new this.promClient.Gauge({
            name: "wu_heat_index",
            help: "temperature as it feels in degrees celsius",
            collect: () => {
                if (this.data.metric.heatIndex) {
                    this.metrics.heatIndex.set(this.data.metric.heatIndex);
                }
            }
        });

        this.metrics.dewpoint = new this.promClient.Gauge({
            name: "wu_dewpoint",
            help: "dewpoint in degrees celsius",
            collect: () => {
                if (this.data.metric.dewpt) {
                    this.metrics.dewpoint.set(this.data.metric.dewpt);
                }
            }
        });

        this.metrics.windChill = new this.promClient.Gauge({
            name: "wu_windChill",
            help: "wind chill in degrees celsius",
            collect: () => {
                if (this.data.metric.windChill) {
                    this.metrics.windChill.set(this.data.metric.windChill);
                }
            }
        });

        this.metrics.windSpeed = new this.promClient.Gauge({
            name: "wu_wind_speed",
            help: "wind speed in km/h",
            collect: () => {
                if (this.data.metric.windSpeed) {
                    this.metrics.windSpeed.set(this.data.metric.windSpeed);
                }
            }
        });

        this.metrics.windGust = new this.promClient.Gauge({
            name: "wu_wind_gust",
            help: "peak wind speed in km/h",
            collect: () => {
                if (this.data.metric.windGust) {
                    this.metrics.windGust.set(this.data.metric.windGust);
                }
            }
        });

        this.metrics.pressure = new this.promClient.Gauge({
            name: "wu_pressure",
            help: "Pressure in hPa",
            collect: () => {
                if (this.data.metric.pressure) {
                    this.metrics.pressure.set(this.data.metric.pressure);
                }
            }
        });

        this.metrics.precipitationRate = new this.promClient.Gauge({
            name: "wu_precipitation_rate",
            help: "how much rain would fall if the precipitation intensity did not change for one hour in mm",
            collect: () => {
                if (this.data.metric.precipRate) {
                    this.metrics.precipitationRate.set(this.data.metric.precipRate);
                }
            }
        });

        this.metrics.precipitationTotal = new this.promClient.Gauge({
            name: "wu_precipitation_total",
            help: "accumulated precipitation for today from midnight to present in mm",
            collect: () => {
                if (this.data.metric.precipTotal) {
                    this.metrics.precipitationTotal.set(this.data.metric.precipTotal);
                }
            }
        });
    }
}

new MetricsManager();

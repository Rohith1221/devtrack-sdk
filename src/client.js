const axios = require("axios");

class DevTrackClient {
  constructor(apiKey, service) {
    this.apiKey = apiKey;
    this.service = service;
    this.endpoint = "http://69.62.85.73:3000/v1/logs/"; // your backend endpoint
  }

  async sendLog(level, message, metadata = {}) {
    try {
      await axios.post(this.endpoint, {
        level,
        message,
        metadata,
        service: this.service,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
    } catch (err) {
      console.error("[DevTrack SDK] Failed to send log:", err.message);
    }
  }
}

module.exports = DevTrackClient;

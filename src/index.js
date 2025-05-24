const DevTrackClient = require("./client");
let client;

function init({ apiKey, service }) {
  if (!apiKey || !service) {
    throw new Error("[DevTrack SDK] apiKey and service are required.");
  }
  client = new DevTrackClient(apiKey, service);
}


function log(messageOrMeta, maybeMeta) {
  let message = "Log message"; // Default fallback
  let metadata = {};

  if (typeof messageOrMeta === "string") {
    message = messageOrMeta;
    metadata = maybeMeta || {};
  } else if (typeof messageOrMeta === "object" && messageOrMeta !== null) {
    metadata = messageOrMeta;
  }

  const req = metadata.req;
  const context = req ? extractContext(req) : {};

  const safeLog = {
    timestamp: new Date().toISOString(),
    level: "info",
    message,
    ...context,
    ...metadata,
  };

  delete safeLog.req; // prevent leaking raw req

  send("info", message, metadata, context);

  // client?.sendLog("info", message, metadata,context);
}


function warn(message="", metadata = {}) {
  const context = extractContext(metadata.req);
  send("warn", message, metadata, context);
}

function error(messageOrMeta, maybeMeta) {

  let message = "error message"; // Default fallback
  let metadata = {};

  if (typeof messageOrMeta === "string") {
    message = messageOrMeta;
    metadata = maybeMeta || {};
  } else if (typeof messageOrMeta === "object" && messageOrMeta !== null) {
    metadata = messageOrMeta;
  }

  const req = metadata.req;
  const context = req ? extractContext(req) : {};

  const safeLog = {
    timestamp: new Date().toISOString(),
    level: "error",
    message,
    ...context,
    ...metadata,
  };

  delete safeLog.req; // prevent leaking raw req

  send("error", message, metadata, context);

}

function send(level, message, metadata, context) {
  const { req, ...restMeta } = metadata;

  client?.sendLog(level, message, {
    ...restMeta,
    ...context,
  });
}








// Helper to extract context from req
function extractContext(req) {
  if (!req) return {};

  try {
    const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || null;
    const userAgent = req.headers?.['user-agent'] || 'unknown';
    const method = req.method || null;
    const path = req.originalUrl || req.url || null;
    const protocol = req.protocol || (req.secure ? 'https' : 'http');
    const fullUrl = `${protocol}://${req.get?.('host')}${req.originalUrl}`;

    return {
      client: { ip, userAgent},
      request: { 
        method, 
        path ,
        fullUrl, 
        protocol ,
        query: req.query,
        params: req.params,
        body: req.body,
  }
    };
  } catch (err) {
    console.error("[DevTrack SDK] Error extracting context:", err.message);
    return {};
  }
}

module.exports = {
  init,
  log,
  warn,
  error
};


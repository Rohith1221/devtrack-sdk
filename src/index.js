// const DevTrackClient = require("./client");
// // const devTrackMiddleware = require("./middleware");

// let client;

// function init({ apiKey, service }) {
//   if (!apiKey || !service) {
//     throw new Error("[DevTrack SDK] apiKey and service are required.");
//   }
//   console.log("[DevTrack SDK] Initialized successfully.");
//   client = new DevTrackClient(apiKey, service);
// }

// function log(message="", metadata={} ) {
//   client?.sendLog("info", message, metadata)

// }

// function warn(message="", metadata={}) {
//   client?.sendLog("warn", message, metadata);

// }

// function error(message="", metadata={}) {
//   client?.sendLog("error", message, metadata);


// }

// // // Helper function to extract Express context
// // function extractContext(req) {
// //     if (!req || !req.devTrackContext) return {};

// //     console.log("req.devTrackContext", req.devTrackContext);
// //     return {
// //       client: req.devTrackContext.client,
// //       request: req.devTrackContext.request,
// //     };
// //   }


// module.exports = {
//   init,
//   log,
//   warn,
//   error};


// second code


const DevTrackClient = require("./client");
const net = require("net");
const geoip = require('geoip-lite');


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

// function log(message="", metadata = {}) {
//   const context = extractContext(metadata.req);
//   send("info", message, metadata, context);
// }

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

  // const context = extractContext(metadata.req);
  // send("error", message, metadata, context);
}

function send(level, message, metadata, context) {
  const { req, ...restMeta } = metadata;

  client?.sendLog(level, message, {
    ...restMeta,
    ...context,
  });
}


function normalizeAndMaskIP(ip) {
  console.log("normalizeAndMaskIP", ip);
  if (!ip || typeof ip !== "string") return null;

  // Handle multiple IPs in x-forwarded-for (take first public one)
  const ipParts = ip.split(',').map(p => p.trim());
  ip = ipParts.find(isPublicIP) || ipParts[0];

  // Convert IPv6 loopback (::1) to IPv4 (127.0.0.1)
  if (ip === "::1") return 'internal';

  // Convert IPv6-mapped IPv4 (::ffff:192.168.1.10)
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // Mask internal/private IPs
  if (!isPublicIP(ip)) {
    return "internal"; // You can also return "masked" or "internal" if needed
  }

  return ip;
}

// Check for private/internal IPs
function isPublicIP(ip) {
  if (!net.isIP(ip)) return false;

  return !(
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") || // 172.20–172.31 range
    ip.startsWith("127.") ||
    ip === "::1"
  );
}

function getGeoInfo(ip) {
  const geo = geoip.lookup(ip);
  return geo || null;
}


// Helper to extract context from req
function extractContext(req) {
  if (!req) return {};

  try {
    // const ip = normalizeAndMaskIP(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null);
    const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || null;
    // const geo = getGeoInfo(ip);
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


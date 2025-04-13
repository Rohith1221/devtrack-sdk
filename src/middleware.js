// // devtrack-sdk/src/middleware.js

// function devTrackMiddleware(req, res, next) {
//   try {
//     const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
//     const userAgent = req.headers['user-agent'] || 'unknown';
//     const method = req.method;
//     const path = req.originalUrl || req.url;
//     const protocol = req.protocol || (req.secure ? 'https' : 'http');
//     const fullUrl = `${protocol}://${req.get('host')}${req.originalUrl}`;

//     req.devtrackContext = {
//       client: { ip, userAgent },
//       request: { method, path, fullUrl, protocol }
//     };

//     next();
//   } catch (err) {
//     console.error('DevTrack middleware error:', err.message);
//     next(); // continue even if middleware fails
//   }
// }

// module.exports = devTrackMiddleware;

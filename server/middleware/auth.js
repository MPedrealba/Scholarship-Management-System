import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'earist_sfao_jwt_secret_key_2026';

/**
 * Middleware: Verify Bearer JWT Token in Authorization header
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No authorization token provided.',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid, malformed, or expired session token. Please sign in again.',
      });
    }

    req.user = decoded;
    next();
  });
}

/**
 * Middleware: Optional token extraction (does not fail if absent)
 */
export function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded;
    } else {
      req.user = null;
    }
    next();
  });
}

/**
 * Middleware: Enforce Role-Based Access Control (RBAC)
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'evaluator', 'student')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required prior to permission verification.',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const matched = roles.some((r) => r.toLowerCase() === userRole);

    if (!matched) {
      return res.status(403).json({
        success: false,
        error: `Institutional access denied. Requires authorization role: [${roles.join(', ')}]. Current role: [${userRole || 'unspecified'}].`,
      });
    }

    next();
  };
}

export default {
  authenticateToken,
  optionalToken,
  requireRole,
};

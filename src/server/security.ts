import dns from 'dns/promises';
import net from 'net';
import { Request, Response, NextFunction } from 'express';

// Check if an IPv4 or IPv6 string is within private/internal/reserved ranges
export function isPrivateIp(ip: string): boolean {
  // Normalize IPv6 mapped IPv4 like ::ffff:127.0.0.1
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // IPv6 checks
  if (ip === '::1' || ip === '::') return true;
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (/^f[cd]/.test(l)) return true; // unique local fc00::/7
    if (/^fe[89ab]/.test(l)) return true; // link local fe80::/10
    return false;
  }

  // IPv4 checks
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP or unknown -> treat as unsafe
  }

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private Network)
  if (a === 10) return true;

  // 172.16.0.0/12 (172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private Network)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link Local / Cloud Metadata Service 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 100.64.0.0/10 (Carrier-Grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

// Disallowed hostnames that could target internal infrastructure
const DISALLOWED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'broadcasthost',
  'metadata.google.internal',
  'metadata.internal',
  'metadata',
  'instance-data',
]);

/**
 * Validate that a URL is well-formed, uses http/https, and does NOT resolve
 * to any internal, private, loopback, or cloud-metadata IP addresses (SSRF mitigation).
 */
export async function isSafeUrl(urlString: string): Promise<{ safe: boolean; reason?: string; parsed?: URL }> {
  try {
    const parsed = new URL(urlString);

    // 1. Only allow standard HTTP and HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'البروتوكول غير مدعوم، يُسمح فقط بـ http و https' };
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // 2. Reject disallowed domain names directly
    if (DISALLOWED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { safe: false, reason: 'الوصول إلى هذا النطاق محظور لأسباب أمنية' };
    }

    // 3. Reject direct raw private IP addresses (only when the host really is an IP literal)
    const bareHost = hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(bareHost) && isPrivateIp(bareHost)) {
      return { safe: false, reason: 'الوصول إلى عناوين الشبكة المحلية أو الخاصة محظور (SSRF Protection)' };
    }

    // Numeric-only hosts such as http://2130706433/ are normalized by URL(); any other
    // non-IP host is resolved below.
    // 4. Resolve DNS to ensure the domain does not resolve to an internal/private IP
    try {
      const records = await dns.lookup(hostname, { all: true });
      for (const record of records) {
        if (isPrivateIp(record.address)) {
          return {
            safe: false,
            reason: `اسم النطاق يشير إلى عنوان خاص محظور (${record.address})`,
          };
        }
      }
    } catch {
      return { safe: false, reason: 'تعذر التحقق من عنوان النطاق عبر نظام DNS' };
    }

    return { safe: true, parsed };
  } catch {
    return { safe: false, reason: 'صيغة الرابط غير صالحة' };
  }
}

/**
 * Lightweight in-memory sliding window rate limiter
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: { windowMs: number; maxRequests: number; message?: string }) {
  const store = new Map<string, RateLimitEntry>();

  // Cleanup old entries periodically (every 2 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (value.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 120000);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || entry.resetAt <= now) {
      store.set(ip, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    entry.count += 1;

    if (entry.count > options.maxRequests) {
      return res.status(429).json({
        success: false,
        error: options.message || 'تم تجاوز الحد المسموح به من الطلبات مؤقتاً، يرجى الانتظار دقيقة قبل المحاولة.',
      });
    }

    return next();
  };
}

const LOCAL_DEV_PORTS = new Set(["", "5173"]);

export function parseClientOrigins(value = process.env.CLIENT_ORIGIN) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin, configuredOrigins = parseClientOrigins()) {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.includes("*") || configuredOrigins.includes(origin)) {
    return true;
  }

  if (configuredOrigins.length > 0) {
    return false;
  }

  try {
    const url = new URL(origin);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      LOCAL_DEV_PORTS.has(url.port) &&
      isLocalDevelopmentHost(url.hostname)
    );
  } catch {
    return false;
  }
}

export function createCorsOriginValidator(configuredOrigins) {
  return (origin, callback) => {
    callback(null, isOriginAllowed(origin, configuredOrigins));
  };
}

function isLocalDevelopmentHost(hostname) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  const octets = normalized.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  return (
    octets[0] === 10 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  );
}

export const config = Object.freeze({
  port: Number(process.env.PORT ?? 3001),
  clientOrigins: parseClientOrigins()
});

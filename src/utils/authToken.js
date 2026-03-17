import { tokenStore } from "../api/tokenStore";

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function getAccessTokenUserId() {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) return null;

  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    const payloadText = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadText);
    const subject = Number(payload?.sub);
    return Number.isInteger(subject) && subject > 0 ? subject : null;
  } catch {
    return null;
  }
}

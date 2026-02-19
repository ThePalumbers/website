import { randomBytes } from "crypto";

export function id22() {
  return randomBytes(16).toString("base64url").slice(0, 22);
}

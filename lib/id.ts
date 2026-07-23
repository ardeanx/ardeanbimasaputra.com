import { randomBytes } from "node:crypto";

export const genId = () => randomBytes(8).toString("base64url");

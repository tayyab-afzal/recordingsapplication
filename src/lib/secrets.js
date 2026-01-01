import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const REGION = process.env.AWS_REGION || "ap-southeast-2";

const client = new SecretsManagerClient({
  region: REGION,
});

const cache = {};
const DEFAULT_TTL_MS = 1000 * 60 * 5;

async function getSecret(secretName, { ttl = DEFAULT_TTL_MS } = {}) {
  const now = Date.now();
  const cached = cache[secretName];
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const cmd = new GetSecretValueCommand({ SecretId: secretName });
  const res = await client.send(cmd);

  let secret;
  if (res.SecretString) {
    try {
      secret = JSON.parse(res.SecretString);
    } catch {
      secret = res.SecretString;
    }
  } else if (res.SecretBinary) {
    secret = Buffer.from(res.SecretBinary).toString("utf8");
  } else {
    throw new Error("Secret had no SecretString or SecretBinary");
  }

  cache[secretName] = {
    value: secret,
    expiresAt: Date.now() + ttl,
  };

  return secret;
}

export { getSecret };

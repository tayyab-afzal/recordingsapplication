import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSecret } from "./secrets";

let s3Client = null;
let bucketName = null;
let secretsCache = null;
let secretsExpiry = null;

const DEFAULT_TTL_MS = 1000 * 60 * 5;

async function getCachedSecrets() {
  const now = Date.now();
  if (!secretsCache || !secretsExpiry || now > secretsExpiry) {
    secretsCache = await getSecret(process.env.SECRETS_ARN);
    secretsExpiry = now + DEFAULT_TTL_MS;
  }
  return secretsCache;
}

async function getS3Client() {
  if (!s3Client) {
    const secrets = await getCachedSecrets();
    s3Client = new S3Client({
      region: process.env.AWS_REGION || secrets.AWS_REGION || "ap-southeast-2",
    });
  }
  return s3Client;
}

async function getBucketName() {
  if (!bucketName) {
    const secrets = await getCachedSecrets();
    bucketName = secrets.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("S3_BUCKET_NAME not found in secrets");
    }
  }
  return bucketName;
}

/**
 * Generate a presigned URL for an S3 object
 * @param {string} key - The S3 object key (filepath)
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Presigned URL
 */
export async function getPresignedUrl(key, expiresIn = 3600) {
  if (!key) {
    return null;
  }

  try {
    if (key.startsWith("https://") || key.startsWith("http://")) {
      return key;
    }

    let objectKey = key;

    if (key.startsWith("s3://")) {
      const s3Path = key.replace("s3://", "");
      const firstSlashIndex = s3Path.indexOf("/");
      if (firstSlashIndex > 0) {
        objectKey = s3Path.substring(firstSlashIndex + 1);
      } else {
        objectKey = "";
      }
    }

    if (objectKey.startsWith("/")) {
      objectKey = objectKey.substring(1);
    }

    if (!objectKey) {
      console.warn("Empty object key after parsing:", key);
      return null;
    }

    const client = await getS3Client();
    const bucket = await getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating presigned URL for key:", key, error);
    return null;
  }
}

/**
 * Generate presigned URLs for multiple S3 objects
 * @param {Array<string>} keys - Array of S3 object keys
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<Object>} Object mapping keys to presigned URLs
 */
export async function getPresignedUrls(keys, expiresIn = 3600) {
  const urlMap = {};
  const promises = keys.map(async (key) => {
    if (key) {
      urlMap[key] = await getPresignedUrl(key, expiresIn);
    }
  });
  await Promise.all(promises);
  return urlMap;
}

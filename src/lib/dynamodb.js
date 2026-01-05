import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { getSecret } from "@/lib/secrets";
import { v4 as uuidv4 } from "uuid";

let client = null;
let docClient = null;
let secrets = null;

let secretsCache = null;
let secretsExpiry = null;

async function getCachedSecrets() {
  const now = Date.now();
  if (!secretsCache || !secretsExpiry || now > secretsExpiry) {
    secretsCache = await getSecret(process.env.SECRETS_ARN);
    secretsExpiry = now + 5 * 60 * 1000;
  }
  return secretsCache;
}

async function getDynamoClient() {
  if (!client || !docClient) {
    client = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });

    docClient = DynamoDBDocumentClient.from(client);
  }

  return { client: docClient, rawClient: client };
}

export async function getTableName(tableKey) {
  const secret = await getCachedSecrets();
  return secret[tableKey];
}

export async function getUsersTable() {
  return await getTableName("USERS_TABLE_NAME");
}

export async function getResetTokensTable() {
  return await getTableName("RESET_TOKENS_TABLE_NAME");
}

export async function getLoginCodesTable() {
  return await getTableName("LOGIN_CODE_TABLE_NAME");
}

export async function getSessionsTable() {
  return await getTableName("SESSIONS_TABLE_NAME");
}

export async function getDataTable() {
  return await getTableName("SAMPLE_DATA_TABLE_NAME");
}

export async function createItem(tableName, item) {
  const { client } = await getDynamoClient();
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  return await client.send(command);
}

export async function getItem(tableName, key) {
  const { client } = await getDynamoClient();
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  const result = await client.send(command);
  return result.Item;
}

export async function updateItem(
  tableName,
  key,
  updateExpression,
  expressionAttributeValues,
  expressionAttributeNames = {}
) {
  const { client } = await getDynamoClient();
  const command = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "UPDATED_NEW",
  };

  if (Object.keys(expressionAttributeNames).length > 0) {
    command.ExpressionAttributeNames = expressionAttributeNames;
  }

  return await client.send(new UpdateCommand(command));
}

export async function deleteItem(tableName, key) {
  const { client } = await getDynamoClient();
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });
  return await client.send(command);
}

export async function queryTable(
  tableName,
  keyConditionExpression,
  expressionAttributeValues,
  expressionAttributeNames = {},
  indexName = null
) {
  const { client } = await getDynamoClient();
  const command = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  if (Object.keys(expressionAttributeNames).length > 0) {
    command.ExpressionAttributeNames = expressionAttributeNames;
  }

  if (indexName) {
    command.IndexName = indexName;
  }

  const result = await client.send(new QueryCommand(command));
  return result.Items;
}

export async function scanTable(
  tableName,
  filterExpression = null,
  expressionAttributeValues = {},
  expressionAttributeNames = {}
) {
  const { client } = await getDynamoClient();
  const command = {
    TableName: tableName,
  };

  if (filterExpression) {
    command.FilterExpression = filterExpression;
    command.ExpressionAttributeValues = expressionAttributeValues;

    if (Object.keys(expressionAttributeNames).length > 0) {
      command.ExpressionAttributeNames = expressionAttributeNames;
    }
  }

  const result = await client.send(new ScanCommand(command));
  return result.Items;
}

export async function scanTablePaginated(
  tableName,
  limit = 50,
  exclusiveStartKey = null,
  filterExpression = null,
  expressionAttributeValues = {},
  expressionAttributeNames = {}
) {
  const { client } = await getDynamoClient();
  const command = {
    TableName: tableName,
    Limit: limit,
  };

  if (exclusiveStartKey) {
    command.ExclusiveStartKey = exclusiveStartKey;
  }

  if (filterExpression) {
    command.FilterExpression = filterExpression;
    command.ExpressionAttributeValues = expressionAttributeValues;

    if (Object.keys(expressionAttributeNames).length > 0) {
      command.ExpressionAttributeNames = expressionAttributeNames;
    }
  }

  const result = await client.send(new ScanCommand(command));
  return {
    items: result.Items || [],
    lastEvaluatedKey: result.LastEvaluatedKey || null,
    count: result.Count || 0,
    scannedCount: result.ScannedCount || 0,
  };
}

export async function countTableItems(
  tableName,
  filterExpression = null,
  expressionAttributeValues = {},
  expressionAttributeNames = {}
) {
  const { client } = await getDynamoClient();
  let totalCount = 0;
  let exclusiveStartKey = null;

  do {
    const command = {
      TableName: tableName,
      Select: "COUNT",
    };

    if (exclusiveStartKey) {
      command.ExclusiveStartKey = exclusiveStartKey;
    }

    if (filterExpression) {
      command.FilterExpression = filterExpression;
      command.ExpressionAttributeValues = expressionAttributeValues;

      if (Object.keys(expressionAttributeNames).length > 0) {
        command.ExpressionAttributeNames = expressionAttributeNames;
      }
    }

    const result = await client.send(new ScanCommand(command));
    totalCount += result.Count || 0;
    exclusiveStartKey = result.LastEvaluatedKey || null;
  } while (exclusiveStartKey);

  return totalCount;
}

export async function createUser(userData) {
  const tableName = await getUsersTable();
  const userId = uuidv4();

  const user = {
    id: userId,
    email: userData.email.toLowerCase(),
    name: userData.name,
    passwordHash: userData.passwordHash || null,
    role: userData.role || "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLoggedIn: false,
    lastLoginAt: null,
    status: userData.status || "active",
    inviteTokenHash: userData.inviteTokenHash || null,
    inviteExpiresAt: userData.inviteExpiresAt || null,
  };

  await createItem(tableName, user);
  return user;
}

export async function getUserByEmail(email) {
  const tableName = await getUsersTable();
  const users = await queryTable(
    tableName,
    "email = :email",
    { ":email": email.toLowerCase() },
    {},
    "EmailIndex"
  );
  return users[0] || null;
}

export async function getUserById(userId) {
  const tableName = await getUsersTable();
  return await getItem(tableName, { id: userId });
}

export async function getAllUsers() {
  const tableName = await getUsersTable();
  const users = await scanTable(tableName);
  return users.map((user) => {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

export async function getUserStats() {
  const tableName = await getUsersTable();
  const users = await scanTable(tableName);

  const totalUsers = users.length;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const newSignups = users.filter(
    (user) => user.createdAt && new Date(user.createdAt) >= new Date(oneDayAgo)
  ).length;

  return { totalUsers, newSignups };
}

export async function deleteUser(userId) {
  const tableName = await getUsersTable();
  return await deleteItem(tableName, { id: userId });
}

export async function getUserByInvite(email, expiresAfter = new Date()) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  if (!user.inviteTokenHash || !user.inviteExpiresAt) return null;
  if (new Date(user.inviteExpiresAt) <= expiresAfter) return null;

  return user;
}

export async function updateUser(userId, updates, removeFields = []) {
  const tableName = await getUsersTable();
  const updateKeys = Object.keys(updates);

  let updateExpression = "";
  const expressionAttributeNames = { "#updatedAt": "updatedAt" };
  const expressionAttributeValues = { ":updatedAt": new Date().toISOString() };

  if (updateKeys.length > 0) {
    updateExpression =
      "SET " +
      updateKeys.map((key) => `#${key} = :${key}`).join(", ") +
      ", #updatedAt = :updatedAt";
    updateKeys.forEach((key) => {
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updates[key];
    });
  }

  if (removeFields.length > 0) {
    const removeExpression = removeFields
      .map((field) => `#${field}`)
      .join(", ");
    if (updateExpression) {
      updateExpression += " REMOVE " + removeExpression;
    } else {
      updateExpression =
        "SET #updatedAt = :updatedAt REMOVE " + removeExpression;
    }
    removeFields.forEach((field) => {
      expressionAttributeNames[`#${field}`] = field;
    });
  }

  if (updateExpression === "") return;

  return await updateItem(
    tableName,
    { id: userId },
    updateExpression,
    expressionAttributeValues,
    expressionAttributeNames
  );
}

export async function createResetToken(email, tokenHash, expiresAt) {
  const tableName = await getResetTokensTable();
  const { client } = await getDynamoClient();

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        email: email.toLowerCase(),
        tokenHash,
        expiresAt: expiresAt.toISOString(),
      },
    })
  );
}

export async function getResetToken(email) {
  const tableName = await getResetTokensTable();
  return await getItem(tableName, { email: email.toLowerCase() });
}

export async function deleteResetToken(email) {
  const tableName = await getResetTokensTable();
  return await deleteItem(tableName, { email: email.toLowerCase() });
}

export async function createSession(userId, expiresAt) {
  const tableName = await getSessionsTable();
  const sessionId = uuidv4();

  const ttlTimestamp = Math.floor(expiresAt.getTime() / 1000);

  await createItem(tableName, {
    id: sessionId,
    userId,
    expiresAt: expiresAt.toISOString(),
    ttl: ttlTimestamp,
  });
  return sessionId;
}

export async function deleteSessionByUserId(userId) {
  const tableName = await getSessionsTable();
  const sessions = await queryTable(
    tableName,
    "userId = :userId",
    { ":userId": userId },
    {},
    "UserIdIndex"
  );

  const promises = sessions.map((session) =>
    deleteItem(tableName, { id: session.id })
  );

  await Promise.all(promises);
}

export async function createLoginCode(email, codeHash, expiresAt) {
  const tableName = await getLoginCodesTable();
  const { client } = await getDynamoClient();

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        email: email.toLowerCase(),
        tokenHash: codeHash,
        expiresAt: expiresAt.toISOString(),
      },
    })
  );
}

export async function getLoginCode(email) {
  const tableName = await getLoginCodesTable();
  return await getItem(tableName, { email: email.toLowerCase() });
}

export async function deleteLoginCode(email) {
  const tableName = await getLoginCodesTable();
  return await deleteItem(tableName, { email: email.toLowerCase() });
}

export { getDynamoClient };

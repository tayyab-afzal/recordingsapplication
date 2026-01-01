import { getSecret } from "../src/lib/secrets.js";
import {
  UpdateTimeToLiveCommand,
  DescribeTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const secret = await getSecret(
  "arn:aws:secretsmanager:ap-southeast-2:374318843823:secret:RecordingsApplication-Secrets-Ywhmzy"
);

async function enableTTL(tableName, ttlAttribute) {
  try {
    const describeCmd = new DescribeTimeToLiveCommand({
      TableName: tableName,
    });
    const currentTTL = await client.send(describeCmd);

    if (
      currentTTL.TimeToLiveDescription?.AttributeName === ttlAttribute &&
      currentTTL.TimeToLiveDescription?.TimeToLiveStatus === "ENABLED"
    ) {
      console.log(
        `TTL already enabled on '${tableName}' for attribute '${ttlAttribute}'`
      );
      return;
    }

    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: tableName,
        TimeToLiveSpecification: {
          AttributeName: ttlAttribute,
          Enabled: true,
        },
      })
    );
    console.log(
      `TTL enabled on table '${tableName}' for attribute '${ttlAttribute}'`
    );
  } catch (err) {
    console.error(`Failed to enable TTL on '${tableName}':`, err);
  }
}

const client = new DynamoDBClient({
  region: secret.AWS_REGION,
});

async function createTableIfNotExists(params) {
  const existing = await client.send(new ListTablesCommand({}));
  if (existing.TableNames.includes(params.TableName)) {
    console.log(`Table '${params.TableName}' already exists`);
    return;
  }

  console.log(`Creating table '${params.TableName}'...`);
  await client.send(new CreateTableCommand(params));
  await waitUntilTableExists(
    { client, maxWaitTime: 60 },
    { TableName: params.TableName }
  );
  console.log(`Table '${params.TableName}' created successfully`);
}

async function setupTables() {
  await createTableIfNotExists({
    TableName: secret.USERS_TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  });

  await createTableIfNotExists({
    TableName: secret.RESET_TOKENS_TABLE_NAME,
    AttributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  });

  await createTableIfNotExists({
    TableName: secret.LOGIN_CODE_TABLE_NAME,
    AttributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  });

  await createTableIfNotExists({
    TableName: secret.SESSIONS_TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "UserIdIndex",
        KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  });
}

setupTables().catch((err) => {
  console.error("Error setting up DynamoDB tables:", err);
  process.exit(1);
});

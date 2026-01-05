import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDataTable, scanTablePaginated, countTableItems } from "@/lib/dynamodb";
import { getPresignedUrl } from "@/lib/s3";
import { normalizeDateTime, getDateTimeSearchPattern } from "@/lib/dateParser";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const ani = searchParams.get("ani") || "";
    const dnisCode = searchParams.get("dnis_code") || "";
    const localStartTime = searchParams.get("local_start_time") || "";
    const localEndTime = searchParams.get("local_end_time") || "";
    const lastKeyParam = searchParams.get("lastKey");
    let lastEvaluatedKey = null;
    if (lastKeyParam) {
      try {
        lastEvaluatedKey = JSON.parse(decodeURIComponent(lastKeyParam));
      } catch (e) {}
    }

    const tableName = await getDataTable();
    if (!tableName) {
      return NextResponse.json(
        { error: "Table name not found in secrets" },
        { status: 500 }
      );
    }

    const filterParts = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (ani) {
      filterParts.push("contains(#ani, :ani)");
      expressionAttributeNames["#ani"] = "ani";
      expressionAttributeValues[":ani"] = ani;
    }

    if (dnisCode) {
      filterParts.push("contains(#dnis_code, :dnis_code)");
      expressionAttributeNames["#dnis_code"] = "dnis_code";
      expressionAttributeValues[":dnis_code"] = dnisCode;
    }

    // Handle datetime searches - normalize various date/time formats
    if (localStartTime) {
      const normalizedStartTime = normalizeDateTime(localStartTime);
      if (normalizedStartTime) {
        // Check if it was successfully normalized to database format
        const isNormalized = /^\d{4}-\d{2}-\d{2}/.test(normalizedStartTime);
        
        if (isNormalized && /^\d{4}-\d{2}-\d{2}$/.test(normalizedStartTime)) {
          // Date only format (YYYY-MM-DD) - use begins_with for efficient matching
          filterParts.push("begins_with(#local_start_time, :local_start_time)");
          expressionAttributeNames["#local_start_time"] = "local_start_time";
          expressionAttributeValues[":local_start_time"] = normalizedStartTime;
        } else if (isNormalized) {
          // Full datetime format - use contains with normalized format
          filterParts.push("contains(#local_start_time, :local_start_time)");
          expressionAttributeNames["#local_start_time"] = "local_start_time";
          expressionAttributeValues[":local_start_time"] = normalizedStartTime;
        } else {
          // Couldn't normalize, use original input with contains
          filterParts.push("contains(#local_start_time, :local_start_time)");
          expressionAttributeNames["#local_start_time"] = "local_start_time";
          expressionAttributeValues[":local_start_time"] = normalizedStartTime;
        }
      } else {
        // If normalization returned null, use original input with contains
        filterParts.push("contains(#local_start_time, :local_start_time)");
        expressionAttributeNames["#local_start_time"] = "local_start_time";
        expressionAttributeValues[":local_start_time"] = localStartTime;
      }
    }

    if (localEndTime) {
      const normalizedEndTime = normalizeDateTime(localEndTime);
      if (normalizedEndTime) {
        // Check if it was successfully normalized to database format
        const isNormalized = /^\d{4}-\d{2}-\d{2}/.test(normalizedEndTime);
        
        if (isNormalized && /^\d{4}-\d{2}-\d{2}$/.test(normalizedEndTime)) {
          // Date only format (YYYY-MM-DD) - use begins_with for efficient matching
          filterParts.push("begins_with(#local_end_time, :local_end_time)");
          expressionAttributeNames["#local_end_time"] = "local_end_time";
          expressionAttributeValues[":local_end_time"] = normalizedEndTime;
        } else if (isNormalized) {
          // Full datetime format - use contains with normalized format
          filterParts.push("contains(#local_end_time, :local_end_time)");
          expressionAttributeNames["#local_end_time"] = "local_end_time";
          expressionAttributeValues[":local_end_time"] = normalizedEndTime;
        } else {
          // Couldn't normalize, use original input with contains
          filterParts.push("contains(#local_end_time, :local_end_time)");
          expressionAttributeNames["#local_end_time"] = "local_end_time";
          expressionAttributeValues[":local_end_time"] = normalizedEndTime;
        }
      } else {
        // If normalization returned null, use original input with contains
        filterParts.push("contains(#local_end_time, :local_end_time)");
        expressionAttributeNames["#local_end_time"] = "local_end_time";
        expressionAttributeValues[":local_end_time"] = localEndTime;
      }
    }

    const filterExpression =
      filterParts.length > 0 ? filterParts.join(" AND ") : null;

    let exclusiveStartKey = lastEvaluatedKey;

    if (page > 1 && !exclusiveStartKey) {
      let currentPage = 1;
      while (currentPage < page) {
        const result = await scanTablePaginated(
          tableName,
          limit,
          exclusiveStartKey,
          filterExpression,
          expressionAttributeValues,
          expressionAttributeNames
        );
        exclusiveStartKey = result.lastEvaluatedKey;
        if (!exclusiveStartKey) break;
        currentPage++;
      }
    }

    const result = await scanTablePaginated(
      tableName,
      limit,
      exclusiveStartKey,
      filterExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );

    const hasMore = result.lastEvaluatedKey !== null;
    const totalPages = hasMore ? page + 1 : page;

    const recordingsWithUrls = await Promise.all(
      result.items.map(async (recording) => {
        if (recording.filepath) {
          try {
            const presignedUrl = await getPresignedUrl(
              recording.filepath,
              3600
            );
            return {
              ...recording,
              downloadUrl: presignedUrl,
            };
          } catch (error) {
            console.error(
              `Error generating presigned URL for ${recording.filepath}:`,
              error
            );
            return recording;
          }
        }
        return recording;
      })
    );

    let encodedLastKey = null;
    if (result.lastEvaluatedKey) {
      encodedLastKey = encodeURIComponent(
        JSON.stringify(result.lastEvaluatedKey)
      );
    }

    return NextResponse.json({
      recordings: recordingsWithUrls,
      pagination: {
        currentPage: page,
        limit: limit,
        hasMore: hasMore,
        lastEvaluatedKey: encodedLastKey,
        totalPages: totalPages,
        count: result.count,
        scannedCount: result.scannedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch recordings" },
      { status: 500 }
    );
  }
}

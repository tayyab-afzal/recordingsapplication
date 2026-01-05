import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getDataTable, countTableItems } from "@/lib/dynamodb";
import { normalizeDateTime } from "@/lib/dateParser";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ani = searchParams.get("ani") || "";
    const dnisCode = searchParams.get("dnis_code") || "";
    const localStartTime = searchParams.get("local_start_time") || "";
    const localEndTime = searchParams.get("local_end_time") || "";

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
        const isNormalized = /^\d{4}-\d{2}-\d{2}/.test(normalizedStartTime);
        
        if (isNormalized && /^\d{4}-\d{2}-\d{2}$/.test(normalizedStartTime)) {
          filterParts.push("begins_with(#local_start_time, :local_start_time)");
          expressionAttributeNames["#local_start_time"] = "local_start_time";
          expressionAttributeValues[":local_start_time"] = normalizedStartTime;
        } else if (isNormalized) {
          filterParts.push("contains(#local_start_time, :local_start_time)");
          expressionAttributeNames["#local_start_time"] = "local_start_time";
          expressionAttributeValues[":local_start_time"] = normalizedStartTime;
        } else {
          filterParts.push("contains(#local_start_time, :local_start_time)");
          expressionAttributeNames["#local_start_time"] = "local_start_time";
          expressionAttributeValues[":local_start_time"] = normalizedStartTime;
        }
      } else {
        filterParts.push("contains(#local_start_time, :local_start_time)");
        expressionAttributeNames["#local_start_time"] = "local_start_time";
        expressionAttributeValues[":local_start_time"] = localStartTime;
      }
    }

    if (localEndTime) {
      const normalizedEndTime = normalizeDateTime(localEndTime);
      if (normalizedEndTime) {
        const isNormalized = /^\d{4}-\d{2}-\d{2}/.test(normalizedEndTime);
        
        if (isNormalized && /^\d{4}-\d{2}-\d{2}$/.test(normalizedEndTime)) {
          filterParts.push("begins_with(#local_end_time, :local_end_time)");
          expressionAttributeNames["#local_end_time"] = "local_end_time";
          expressionAttributeValues[":local_end_time"] = normalizedEndTime;
        } else if (isNormalized) {
          filterParts.push("contains(#local_end_time, :local_end_time)");
          expressionAttributeNames["#local_end_time"] = "local_end_time";
          expressionAttributeValues[":local_end_time"] = normalizedEndTime;
        } else {
          filterParts.push("contains(#local_end_time, :local_end_time)");
          expressionAttributeNames["#local_end_time"] = "local_end_time";
          expressionAttributeValues[":local_end_time"] = normalizedEndTime;
        }
      } else {
        filterParts.push("contains(#local_end_time, :local_end_time)");
        expressionAttributeNames["#local_end_time"] = "local_end_time";
        expressionAttributeValues[":local_end_time"] = localEndTime;
      }
    }

    const filterExpression =
      filterParts.length > 0 ? filterParts.join(" AND ") : null;

    const totalCount = await countTableItems(
      tableName,
      filterExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );

    return NextResponse.json({
      totalCount,
    });
  } catch (error) {
    console.error("Error counting recordings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to count recordings" },
      { status: 500 }
    );
  }
}


import { backendApiClient } from "../http/backendApiClient";
import { ToolDefinition } from "../types";

export interface GetReviewCountArgs {
  propertyId?: string;
}

interface GetReviewCountResult {
  propertyId: string;
  avgRating?: number | null;
  totalReviews: number;
}

const asNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const extractReviewStats = (response: any): { avgRating: number | null; totalReviews: number } => {
  const property = response?.property ?? response ?? {};

  const avgRatingRaw =
    property?.avgRating ??
    property?.averageRating ??
    property?.rating ??
    response?.avgRating ??
    response?.averageRating;

  const totalReviewsRaw =
    property?.totalReviews ??
    property?.reviewCount ??
    property?.review_count ??
    response?.totalReviews ??
    response?.reviewCount ??
    response?.review_count ??
    response?.total;

  const avgRating = asNumber(avgRatingRaw);
  const totalReviews = asNumber(totalReviewsRaw);

  return {
    avgRating: avgRating ?? null,
    totalReviews: Number.isFinite(totalReviews) ? Math.max(0, Math.floor(totalReviews as number)) : 0,
  };
};

export const getReviewCountTool: ToolDefinition<GetReviewCountArgs, GetReviewCountResult> = {
  name: "get_review_count",
  description: "Get average rating and total review count for a property",
  inputSchema: "{ propertyId: string }",
  run: async (args) => {
    const source = (args || {}) as GetReviewCountArgs;
    const propertyId = String(source.propertyId || "").trim();

    if (!propertyId) {
      throw new Error("propertyId is required");
    }

    const encodedPropertyId = encodeURIComponent(propertyId);

    let response: any;
    try {
      response = await backendApiClient.request<any>(`/api/property/${encodedPropertyId}`, {
        method: "GET",
      });
    } catch {
      response = await backendApiClient.request<any>(`/api/properties/${encodedPropertyId}`, {
        method: "GET",
      });
    }

    const { avgRating, totalReviews } = extractReviewStats(response);

    return {
      propertyId,
      avgRating,
      totalReviews,
    };
  },
};


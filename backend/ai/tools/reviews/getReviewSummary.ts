import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolDefinition } from "../../types";

export interface GetReviewSummaryArgs {
  propertyId: string;
}

interface Review {
  id: string;
  author: string;
  pet_name: string;
  service_type: string;
  rating: number;
  comment: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
}

interface GetReviewSummaryResult {
  propertyId: string;
  totalReviews: number;
  avgRating: number;
  reviews: Review[];
  instruction: string;
}

export const getReviewSummaryTool: ToolDefinition<GetReviewSummaryArgs, GetReviewSummaryResult> = {
  name: "get_review_summary",
  description:
    "Fetch reviews for a property to generate an AI-powered summary highlighting strengths, concerns, and actionable insights",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_review_summary,
  run: async (args) => {
    const source = (args || {}) as GetReviewSummaryArgs;
    const propertyId = String(source.propertyId || "").trim();

    if (!propertyId) {
      throw new Error("propertyId is required");
    }

    try {
      // Fetch reviews for the property
      const response = await backendApiClient.request<any>(
        `/api/reviews/property/${encodeURIComponent(propertyId)}`,
        {
          method: "GET",
        },
      );

      const reviews: Review[] = response?.reviews || [];
      const avgRating = response?.avgRating || 0;
      const totalReviews = response?.total || 0;

      // Return reviews for the LLM to summarize in the agentic loop
      return {
        propertyId,
        totalReviews,
        avgRating,
        reviews: reviews.slice(0, 50), // Limit to 50 most recent reviews
        instruction:
          "Analyze these reviews and provide a concise professional summary that identifies: 1) main strengths based on positive feedback, 2) common concerns or areas for improvement, 3) notable patterns (service types, pet types mentioned), 4) actionable insights for improvement. Keep it to 2-3 paragraphs.",
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch property reviews: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};

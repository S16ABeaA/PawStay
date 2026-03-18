import { backendApiClient } from "../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolDefinition } from "../types";

export interface GetCancellationPolicyArgs {
  property_id: string;
}

interface GetCancellationPolicyResult {
  property_id: string;
  cancellation_policy: Record<string, unknown>;
}

export const getCancellationPolicyTool: ToolDefinition<
  GetCancellationPolicyArgs,
  GetCancellationPolicyResult
> = {
  name: "get_cancellation_policy",
  description: "Retrieve cancellation rules configured by a provider/property",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_cancellation_policy,
  run: async (args) => {
    const response = await backendApiClient.request<any>(
      `/api/bookings/cancellation-policy/${args.property_id}`,
      {
        method: "GET",
      },
    );

    return {
      property_id: String(response?.property_id ?? args.property_id),
      cancellation_policy:
        response?.cancellation_policy && typeof response.cancellation_policy === "object"
          ? response.cancellation_policy
          : {},
    };
  },
};

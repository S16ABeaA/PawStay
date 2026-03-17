import { backendApiClient } from "../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface GetCancellationPolicyArgs {
  property_id?: string;
  property_name?: string;
}

interface CancellationPolicy {
  freeCancellation?: string;
  lateFee?: string;
  noShow?: string;
  [key: string]: any;
}

interface GetCancellationPolicyResult {
  property_id?: string;
  property_name?: string;
  cancellation_policy: CancellationPolicy;
  message: string;
}

export const getCancellationPolicyTool: ToolDefinition<GetCancellationPolicyArgs, GetCancellationPolicyResult> = {
  name: "get_cancellation_policy",
  description: "Retrieve the cancellation policy and refund rules for a property/service provider",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_cancellation_policy,
  run: async (args, context?: ToolContext) => {
    try {
      // Use property_id if available, otherwise use a placeholder and pass property_name as query param
      const propertyId = args.property_id || "lookup";
      let endpoint = `/api/properties/${propertyId}/cancellation-policy`;

      if (args.property_name) {
        endpoint += `?property_name=${encodeURIComponent(args.property_name)}`;
      }

      const response = await backendApiClient.request<any>(endpoint, {
        method: "GET",
        authToken: context?.authToken,
      });

      return {
        property_id: response?.property_id ?? args.property_id ?? undefined,
        property_name: response?.property_name ?? args.property_name ?? undefined,
        cancellation_policy: response?.cancellation_policy ?? {},
        message: response?.message ?? "Cancellation policy retrieved successfully",
      };
    } catch (error: any) {
      return {
        property_id: args.property_id,
        cancellation_policy: {},
        message: error?.message ?? "Unable to retrieve cancellation policy",
      };
    }
  },
};

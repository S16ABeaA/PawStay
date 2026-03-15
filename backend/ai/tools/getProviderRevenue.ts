import { backendApiClient } from "../http/backendApiClient";
import { ToolContext, ToolDefinition } from "../types";

export interface GetProviderRevenueArgs {
  provider_id: string;
  month?: string;
}

interface RevenueBreakdownItem {
  label: string;
  revenue: number | null;
  count: number | null;
}

interface GetProviderRevenueResult {
  totalRevenue: number | null;
  breakdown: RevenueBreakdownItem[];
}

export const getProviderRevenueTool: ToolDefinition<GetProviderRevenueArgs, GetProviderRevenueResult> = {
  name: "get_provider_revenue",
  description: "Get provider revenue for a given month",
  inputSchema: "{ provider_id: string, month?: string }",
  run: async (args, context?: ToolContext) => {
    const response = await backendApiClient.request<any>("/api/revenue/provider", {
      method: "GET",
      query: {
        provider_id: args.provider_id,
        month: args.month,
      },
      authToken: context?.authToken,
    });

    const totalRevenueRaw = response?.totalRevenue ?? response?.total ?? response?.revenue;
    const breakdownRaw = Array.isArray(response?.breakdown) ? response.breakdown : [];

    return {
      totalRevenue: typeof totalRevenueRaw === "number" ? totalRevenueRaw : (Number(totalRevenueRaw) || null),
      breakdown: breakdownRaw.slice(0, 5).map((row: any) => ({
        label: String(row?.propertyName ?? row?.propertyId ?? row?.city ?? "Unknown"),
        revenue: typeof row?.revenue === "number" ? row.revenue : (Number(row?.revenue ?? row?.total) || null),
        count: typeof row?.count === "number" ? row.count : (Number(row?.count) || null),
      })),
    };
  },
};

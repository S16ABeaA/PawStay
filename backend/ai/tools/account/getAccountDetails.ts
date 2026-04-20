import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolContext, ToolDefinition } from "../../types";

console.log("[getAccountDetails.ts] Module loaded");

export interface GetAccountDetailsArgs {}

interface AccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string;
  role: "customer" | "proprietor" | "admin";
  emailVerified: boolean;
}

interface NotificationPreferences {
  newBookings: boolean;
  bookingReminders: boolean;
  newReviews: boolean;
  marketingUpdates: boolean;
}

interface AccountSettings {
  propertyId: string | null;
  business: {
    name: string;
    phone: string;
    website: string;
    description: string;
    address: string;
    capacity: number;
  };
  availability: {
    maxCapacity: number;
    minStay: number;
    checkInTime: string;
    checkOutTime: string;
    sameDayBookings: boolean;
  };
  payment: {
    acceptedMethods: string[];
    gcashQrUrl: string | null;
    paymayaQrUrl: string | null;
  };
}

interface GetAccountDetailsResult {
  profile: AccountProfile;
  notificationPreferences: NotificationPreferences;
  businessSettings: AccountSettings | null;
  accountStatus: {
    isActive: boolean;
    accountType: string;
    joinedDate: string | null;
  };
  instruction: string;
}

export const getAccountDetailsTool: ToolDefinition<GetAccountDetailsArgs, GetAccountDetailsResult> = {
  name: "get_account_details",
  description:
    "Retrieve the current user's account details, notification preferences, and account settings",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_account_details,
  run: async (_args, context?: ToolContext) => {
    try {
      // Fetch profile information
      const profileResponse = await backendApiClient.request<any>("/api/auth/profile", {
        method: "GET",
        authToken: context?.authToken,
      });

      const profileData = profileResponse?.user || {};

      const profile: AccountProfile = {
        id: String(profileData.id || ""),
        firstName: String(profileData.first_name || ""),
        lastName: String(profileData.last_name || ""),
        email: String(profileData.email || ""),
        phone: String(profileData.phone || ""),
        address: String(profileData.address || ""),
        avatarUrl: String(profileData.avatar_url || ""),
        role: profileData.role || "customer",
        emailVerified: Boolean(profileData.is_verified),
      };

      // Fetch settings and notification preferences
      let notificationPreferences: NotificationPreferences = {
        newBookings: true,
        bookingReminders: true,
        newReviews: true,
        marketingUpdates: false,
      };

      let businessSettings: AccountSettings | null = null;

      try {
        const settingsResponse = await backendApiClient.request<any>("/api/settings", {
          method: "GET",
          authToken: context?.authToken,
        });

        if (settingsResponse) {
          // Extract notification preferences
          if (settingsResponse.notifications) {
            notificationPreferences = {
              newBookings: Boolean(settingsResponse.notifications.newBookings ?? true),
              bookingReminders: Boolean(settingsResponse.notifications.bookingReminders ?? true),
              newReviews: Boolean(settingsResponse.notifications.newReviews ?? true),
              marketingUpdates: Boolean(settingsResponse.notifications.marketingUpdates ?? false),
            };
          }

          // Extract business settings if user is a proprietor/admin
          if (settingsResponse.propertyId && settingsResponse.business) {
            businessSettings = {
              propertyId: settingsResponse.propertyId,
              business: {
                name: String(settingsResponse.business.name || ""),
                phone: String(settingsResponse.business.phone || ""),
                website: String(settingsResponse.business.website || ""),
                description: String(settingsResponse.business.description || ""),
                address: String(settingsResponse.business.address || ""),
                capacity: Number(settingsResponse.business.capacity) || 0,
              },
              availability: {
                maxCapacity: Number(settingsResponse.availability?.maxCapacity) || 0,
                minStay: Number(settingsResponse.availability?.minStay) || 1,
                checkInTime: String(settingsResponse.availability?.checkInTime || "09:00"),
                checkOutTime: String(settingsResponse.availability?.checkOutTime || "17:00"),
                sameDayBookings: Boolean(settingsResponse.availability?.sameDayBookings ?? true),
              },
              payment: {
                acceptedMethods: Array.isArray(settingsResponse.payment?.acceptedMethods)
                  ? settingsResponse.payment.acceptedMethods
                  : [],
                gcashQrUrl: settingsResponse.payment?.gcashQrUrl || null,
                paymayaQrUrl: settingsResponse.payment?.paymayaQrUrl || null,
              },
            };
          }
        }
      } catch (settingsError) {
        // Settings endpoint may not be available for all users (e.g., customers)
        // Continue with default preferences
      }

      return {
        profile,
        notificationPreferences,
        businessSettings,
        accountStatus: {
          isActive: true,
          accountType: profile.role,
          joinedDate: null,
        },
        instruction:
          "This is the user's account information including their profile details, notification preferences, and business settings (if applicable). Use this to provide personalized assistance and respect their notification preferences.",
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve account details: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};

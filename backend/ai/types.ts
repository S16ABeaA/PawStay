export type ToolName =
  | "search_property"
  | "get_service_details"
  | "get_nearby_services"
  | "search_services"
  | "get_property_services"
  | "get_review_count"
  | "read_image_text"
  | "get_pets"
  | "get_pet_profile"
  | "get_pet_service_history"
  | "predict_next_booking"
  | "create_booking"
  | "get_user_bookings"
  | "cancel_booking"
  | "check_availability"
  | "modify_reservation"
  | "get_cancellation_policy"
  | "get_booking_summary"
  | "get_provider_revenue"
  | "get_user_profile"
  | "update_user_preferences"
  | "get_booking_history"
  | "get_reviews"
  | "summarize_reviews"
  | "get_service_recommendations"
  | "generate_personalized_recommendations"
  | "suggest_alternative_services"
  | "auto_match_specialist"
  | "get_area_booking_trends"
  | "analyze_booking_frequency"
  | "predict_service_occupancy"
  | "analyze_pet_photo"
  | "get_vaccination_records"
  | "analyze_pet_health_data"
  | "extract_medical_data"
  | "validate_record_authenticity"
  | "generate_pet_care_predictions"
  | "predict_grooming_cycle"
  | "predict_wellness_milestones"
  | "compile_pet_health_timeline"
  | "record_diagnostic_history"
  | "confirm_match"
  | "create_reservation"
  | "cancel_reservation"
  | "auto_rebook_cancellation"
  | "submit_review"
  | "set_appointment_reminder"
  | "notify_availability_change"
  | "notify_service_availability"
  | "notify_pet_needing_service"
  | "notify_payment_dues"
  | "get_faq_answer"
  | "report_issue"
  | "escalate_to_human"
  | "geocode_address"
  | "estimate_peak_travel_time"
  | "give_business_recommendations"
  | "recommend_strategies"
  | "prescribe_recommendations_businesses";

export interface ToolContext {
  authToken?: string;
  requestId?: string;
  userMessage?: string;
  userId?: string;
}

export interface ToolDefinition<TArgs = Record<string, unknown>, TResult = unknown> {
  name: ToolName;
  description: string;
  inputSchema: string;
  run: (args: TArgs, context?: ToolContext) => Promise<TResult>;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolName?: ToolName;
}

export interface AgentRunInput {
  sessionId: string;
  userMessage: string;
  userId?: string;
  authToken?: string;
}

export interface AgentRunOutput {
  reply: string;
  usedTools: Array<{
    tool: ToolName;
    args: Record<string, unknown>;
  }>;
  /** Ordered log of tool calls made during the agentic loop */
  toolActivity?: Array<{
    tool: string;
    status: "completed" | "error";
  }>;
}

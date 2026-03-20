import assert from "node:assert/strict";
import { sanitizeToolArgs, validateToolArgs } from "./toolSchemas";

const reviewArgs = sanitizeToolArgs("get_review_count", {
  property_id: "abc-123",
});
assert.deepEqual(reviewArgs, { propertyId: "abc-123" });
assert.equal(validateToolArgs("get_review_count", reviewArgs).ok, true);

const ocrArgs = sanitizeToolArgs("read_image_text", {
  imageBase64: "data:image/png;base64,abc123",
  language: "eng",
});
assert.deepEqual(ocrArgs, {
  image_base64: "data:image/png;base64,abc123",
  language: "eng",
});
assert.equal(validateToolArgs("read_image_text", ocrArgs).ok, true);

const bookingInvalid = sanitizeToolArgs("create_booking", {
  user_id: "user-1",
  service_id: "svc-1",
  date: "03/16/2026",
  time: "9am",
});
const bookingValidation = validateToolArgs("create_booking", bookingInvalid);
assert.equal(bookingValidation.ok, false);
if (!bookingValidation.ok) {
  assert.ok(bookingValidation.errors.includes("date must be YYYY-MM-DD"));
  assert.ok(bookingValidation.errors.includes("time must be HH:mm"));
}

const revenueArgs = sanitizeToolArgs("get_provider_revenue", {
  provider_id: "provider-1",
  month: "2026-03",
});
assert.equal(validateToolArgs("get_provider_revenue", revenueArgs).ok, true);

const petProfileArgs = sanitizeToolArgs("get_pet_profile", {
  id: "pet-123",
});
assert.deepEqual(petProfileArgs, { pet_id: "pet-123" });
assert.equal(validateToolArgs("get_pet_profile", petProfileArgs).ok, true);

const petHistoryArgs = sanitizeToolArgs("get_pet_service_history", {
  name: "yo",
});
assert.deepEqual(petHistoryArgs, { pet_id: undefined, pet_name: "yo" });
assert.equal(validateToolArgs("get_pet_service_history", petHistoryArgs).ok, true);

assert.equal(validateToolArgs("get_pet_service_history", {}).ok, false);

assert.equal(validateToolArgs("get_pets", {}).ok, true);

console.log("schemaValidation.smoke: OK");

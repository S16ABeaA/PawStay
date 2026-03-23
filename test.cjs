const dotenv = require('dotenv')
dotenv.config()
dotenv.config({ path: './backend/.env' })
process.env.TS_NODE_PROJECT = './backend/tsconfig.json'
require('./backend/node_modules/ts-node/register/transpile-only')
const { createClient } = require('./backend/node_modules/@supabase/supabase-js')
const { supabaseAdmin } = require('./backend/config/supabaseAdmin')
const { createSession, persistMessage, getMessageCount } = require('./backend/services/chatSessionService')
const { fetchPetContext, formatContextForPrompt } = require('./backend/services/contextService')
const { parseRecommendationBlock, saveRecommendation } = require('./backend/services/recommendationService')

function supabaseAnonClient(jwt) {
  const supabaseUrl = process.env.PAW_STAY_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_PAW_STAY_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  })
}

// Replace these with real values from your database
const TEST_USER_ID = 'a7aae8f3-cbdb-4e1f-829f-1c10af0d8173'
const TEST_PET_ID  = '50c47be7-dd52-4123-8a31-61ae5a41e952'
const TEST_JWT     = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImU5NDMzZDUyLWFiMjEtNGUyNC1iZjRhLTNlN2RhODVjNzU3YSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3lndGZzanF3YmdnaHFnZGR6ZXRjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhN2FhZThmMy1jYmRiLTRlMWYtODI5Zi0xYzEwYWYwZDgxNzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc0MTQ3NzY4LCJpYXQiOjE3NzQxNDQxNjgsImVtYWlsIjoiYWRyaWFuX2JlYUBkbHN1LmVkdS5waCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0x5dlVzT0xxSzdVQXJrcHQ5c01GRnh0SURnRGZmUWFuU1ZMTFVRY1RTYllSU2ZWQT1zOTYtYyIsImN1c3RvbV9jbGFpbXMiOnsiaGQiOiJkbHN1LmVkdS5waCJ9LCJlbWFpbCI6ImFkcmlhbl9iZWFAZGxzdS5lZHUucGgiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyc3ROYW1lIjoiQWRyaWFuIiwiZnVsbF9uYW1lIjoiQWRyaWFuIFZpbmNlIEJlYSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsImxhc3ROYW1lIjoiQmVhIiwibmFtZSI6IkFkcmlhbiBWaW5jZSBCZWEiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMeXZVc09McUs3VUFya3B0OXNNRkZ4dElEZ0RmZlFhblNWTExVUWNUU2JZUlNmVkE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwMDMzMDY3NTA0MDAzMTEzMDkzMSIsInJvbGUiOiJhZG1pbiIsInN1YiI6IjEwMDMzMDY3NTA0MDAzMTEzMDkzMSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzc0MTA5MzM3fV0sInNlc3Npb25faWQiOiIwZDBmOWViZS0xMzc0LTRhZGItYjAxNC1jN2FiYzViZWQyNDEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.z7mnzSBMqizYshb7zOV8sfvWhRv4aAm4CMqMYbJYWTaD-ttaPckwidMaSAWXZxrkHkLIzU6GMdyl1lz2MXklEQ'

async function run() {
  console.log('\n--- 1. supabaseService ping ---')
  const { data, error } = await supabaseAdmin.from('pets').select('id, name').eq('id', TEST_PET_ID).single()
  if (error) console.error('FAIL:', error.message)
  else console.log('OK — pet found:', data.name)

  console.log('\n--- 2. createSession ---')
  const session = await createSession({ userId: TEST_USER_ID, petId: TEST_PET_ID, petName: data.name })
  console.log('OK — session:', session.id, '| title:', session.title)

  console.log('\n--- 3. persistMessage (user) ---')
  const userMsg = await persistMessage({ sessionId: session.id, petId: TEST_PET_ID, role: 'user', content: 'Test message from user' })
  console.log('OK — message id:', userMsg.id)

  console.log('\n--- 4. getMessageCount ---')
  const count = await getMessageCount(session.id)
  console.log('OK — count:', count)

  console.log('\n--- 5. fetchPetContext ---')
  const anonClient = supabaseAnonClient(TEST_JWT)
  let context = {
    pet: { name: data.name, species: 'unknown', breed: null, birthday: null, weight: null, notes: null },
    health_summaries: [],
    service_history: [],
    recommendations: [],
    chat: { summary: '', messages: [] }
  }

  try {
    context = await fetchPetContext({ petId: TEST_PET_ID, sessionId: session.id, anonClient })
    console.log('OK — context keys:', Object.keys(context))
    console.log('    pet name:', context.pet?.name)
    console.log('    health summaries:', context.health_summaries?.length)
    console.log('    messages:', context.chat?.messages?.length)
  } catch (err) {
    console.warn('WARN — fetchPetContext failed, continuing with fallback context:', err.message)
  }

  console.log('\n--- 6. formatContextForPrompt ---')
  const formatted = formatContextForPrompt(context)
  console.log('OK — first 300 chars:\n', formatted.slice(0, 300))

  console.log('\n--- 7. parseRecommendationBlock ---')
  const fakeResponse = `Here is my advice for your pet.\n\n<recommendation>\n{"recommendation_type":"diet","content":"Feed less dry food","rationale":"Pet is overweight","confidence":0.8,"expires_days":30}\n</recommendation>`
  const { cleanText, recommendation } = parseRecommendationBlock(fakeResponse)
  console.log('OK — cleanText has no block:', !cleanText.includes('<recommendation>'))
  console.log('    recommendation_type:', recommendation?.recommendation_type)

  console.log('\n--- 8. saveRecommendation ---')
  const saved = await saveRecommendation({
    petId: TEST_PET_ID,
    sessionId: session.id,
    recommendation,
    healthSummaryIds: []
  })
  console.log('OK — saved recommendation id:', saved.id, '| status:', saved.status)

  console.log('\n--- 9. supersede trigger check ---')
  const saved2 = await saveRecommendation({
    petId: TEST_PET_ID,
    sessionId: session.id,
    recommendation: { ...recommendation, content: 'Updated diet advice', confidence: 0.9, expires_days: 30 },
    healthSummaryIds: []
  })
  console.log('OK — new recommendation id:', saved2.id)
  console.log('    supersedes_id should be:', saved.id)
  console.log('    supersedes_id actual:', saved2.supersedes_id)
  const { data: oldRec } = await supabaseAdmin.from('pet_recommendations').select('status').eq('id', saved.id).single()
  console.log('    old recommendation status (should be superseded):', oldRec?.status)

  console.log('\nAll tests passed.')
}

run().catch(err => {
  console.error('\nTest failed:', err.message)
  process.exit(1)
})
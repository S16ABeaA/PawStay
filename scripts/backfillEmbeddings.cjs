// Run with: node scripts/backfillEmbeddings.js
require('dotenv').config();
require('dotenv').config({ path: './backend/.env' });

process.env.TS_NODE_PROJECT = './backend/tsconfig.json';
require('../backend/node_modules/ts-node/register/transpile-only');

const { supabaseAdmin } = require('../backend/config/supabaseAdmin');
const { embedHealthSummary } = require('../backend/services/embeddingService');

async function backfillEmbeddings() {
  const { data: existingEmbeddings, error: embeddingsError } = await supabaseAdmin
    .from('pet_embeddings')
    .select('source_id')
    .eq('source_table', 'pet_health_summaries')
    .not('source_id', 'is', null);

  if (embeddingsError) {
    console.error('[backfill] failed to load existing embeddings:', embeddingsError.message);
    process.exit(1);
  }

  const embeddedIds = new Set(
    (Array.isArray(existingEmbeddings) ? existingEmbeddings : [])
      .map((row) => String(row.source_id || '').trim())
      .filter(Boolean),
  );

  const { data: summaries, error } = await supabaseAdmin
    .from('pet_health_summaries')
    .select('id, pet_id, extracted_data')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[backfill] failed to load summaries:', error.message);
    process.exit(1);
  }

  const rows = (Array.isArray(summaries) ? summaries : []).filter(
    (row) => !embeddedIds.has(String(row.id || '')),
  );
  let embeddedCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    try {
      const saved = await embedHealthSummary({
        petId: String(row.pet_id),
        healthSummaryId: String(row.id),
        extractedData: row.extracted_data || {},
      });

      if (saved) {
        embeddedCount += 1;
      }

      console.log(`[backfill] processed ${i + 1}/${rows.length} — id: ${row.id}`);
    } catch (err) {
      console.error(`[backfill] row failed id=${row.id}:`, err.message);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`[backfill] done. embedded ${embeddedCount} summaries.`);
}

backfillEmbeddings().catch((err) => {
  console.error('[backfill] fatal:', err.message);
  process.exit(1);
});

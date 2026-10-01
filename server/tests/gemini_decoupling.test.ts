import assert from 'node:assert';
import test from 'node:test';
import { initSchema } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { getDb, closeDb } from '../src/db/connection';
import { novaClient, NovaClient } from '../src/ai/nova/nova.client';
import { geminiService, GeminiService } from '../src/ai/gemini/gemini.service';
import { getSanitizedConfig } from '../src/config/env';

test('Decoupled AI & Data Integration Architecture Tests', async (t) => {
  // Fresh in-memory SQLite DB
  closeDb();
  const db = getDb(':memory:');
  initSchema(db);
  seedDatabase(db);

  // 1. Architectural Decoupling: Pure Data Extraction vs Conversational Intelligence
  await t.test('Decoupling: NovaClient is dedicated exclusively to data ingestion without pseudo-completions', () => {
    // NovaClient must provide data extraction methods
    assert.strictEqual(typeof novaClient.getBudgets, 'function');
    assert.strictEqual(typeof novaClient.getExpenses, 'function');
    assert.strictEqual(typeof novaClient.getDepartments, 'function');
    assert.strictEqual(typeof novaClient.getLiveAnalysis, 'function');
    assert.strictEqual(typeof novaClient.fetchAndAnalyzeBooks, 'function');
    assert.strictEqual(typeof novaClient.getLiveDepartmentAnalysis, 'function');
    assert.strictEqual(typeof novaClient.getLiveVendorAnalysis, 'function');

    // NovaClient must NOT have any completion method
    assert.strictEqual((novaClient as any).complete, undefined);
  });

  await t.test('Decoupling: GeminiService powers conversational copilot with Gemini 2.0 Flash', () => {
    assert.strictEqual(typeof geminiService.chat, 'function');
    assert.strictEqual(typeof geminiService.streamChat, 'function');
    assert.strictEqual(typeof geminiService.getCapabilities, 'function');
    assert.strictEqual(typeof geminiService.fetchDynamicGroundingContext, 'function');
    assert.strictEqual(geminiService.getModelName(), 'gemini-2.0-flash');
  });

  // 2. Dynamic Grounding / RAG Context Injection
  await t.test('Grounding: fetches live SQLite budgets, exception incidents, and Aczen Nova ledger context', async () => {
    const context = await geminiService.fetchDynamicGroundingContext();

    assert.ok(context.includes('APEX FISCAL AUTHORITATIVE FINANCIAL GROUNDING'));
    assert.ok(context.includes('Engineering - Platform Core'));
    assert.ok(context.includes('INTERNAL CORPORATE BUDGETS (SQLite)'));
    assert.ok(context.includes('ACTIVE EXCEPTION INCIDENTS'));
    assert.ok(context.includes('STATUTORY POLICY RULES'));
    assert.ok(context.includes('ACZEN NOVA LIVE ERP LEDGER SYNC'));
  });

  // 3. Multi-Turn Conversational Memory and Intent Classification
  await t.test('Conversational Memory: maintains multi-turn dialog history and classifies intents', async () => {
    const history = [
      { role: 'user' as const, content: 'Who is our top spending department?' },
      { role: 'assistant' as const, content: 'Finance and Accounts is currently #1 with ₹1.18 Cr committed spend.' },
    ];

    const response = await geminiService.chat({
      message: 'Can I spend $50,000 on cloud servers for them?',
      conversationHistory: history,
    });

    assert.ok(response.reply.length > 50);
    assert.strictEqual(response.intent, 'PRE_CLEARANCE_SIMULATION');
    assert.ok(response.structuredData);
    assert.ok(Array.isArray(response.suggestedActions));
    assert.strictEqual(typeof response.latencyMs, 'number');
  });

  // 4. Policy Compliance Verdicts & Spend Simulation DAG
  await t.test('Policy Engine Simulation: evaluates nominal clearing vs multi-sig threshold vs hard stop', async () => {
    // Nominal (< $50k)
    const nominal = await geminiService.chat({ message: 'Can I spend $25,000 on office equipment?' });
    assert.ok(nominal.reply.includes('CLEARED') || nominal.reply.includes('PRE-CLEARED'));
    assert.strictEqual(nominal.structuredData?.verdict, 'CLEARED');

    // Multi-sig gate ($50k - $249k)
    const flagged = await geminiService.chat({ message: 'Can I spend $75,000 on database servers?' });
    assert.ok(flagged.reply.includes('FLAGGED') || flagged.reply.includes('MULTI-SIG'));
    assert.strictEqual(flagged.structuredData?.verdict, 'FLAGGED');

    // Hard ceiling breach (>= $250k)
    const blocked = await geminiService.chat({ message: 'Can I spend $500,000 on AI GPU cluster expansion?' });
    assert.ok(blocked.reply.includes('BLOCKED') || blocked.reply.includes('HARD STOP'));
    assert.strictEqual(blocked.structuredData?.verdict, 'BLOCKED');
  });

  // 5. SSE Streaming Generation
  await t.test('Streaming SSE: generates progressive text tokens and returns complete response', async () => {
    const chunks: string[] = [];
    const response = await geminiService.streamChat(
      { message: 'Which department is spending most?' },
      (chunk) => {
        chunks.push(chunk);
      }
    );

    assert.ok(chunks.length > 0, 'Must produce progressive streaming chunks');
    assert.ok(response.reply.length > 0);
    assert.strictEqual(response.intent, 'DEPARTMENT_SPEND_ANALYSIS');
    assert.ok(response.suggestedActions?.length);
  });

  // 6. Graceful Degradation: Missing Key or Rate Limit Fallback
  await t.test('Graceful Degradation: operates reliably without Gemini key using deterministic advisory fallback', async () => {
    const unconfiguredService = new GeminiService('', 'gemini-2.0-flash');
    assert.strictEqual(unconfiguredService.isConfigured(), false);

    const res = await unconfiguredService.chat({ message: 'Show Aczen Nova live book overruns' });
    assert.ok(res.reply.includes('Aczen Nova'));
    assert.strictEqual(res.model, 'deterministic-fallback');
    assert.strictEqual(res.structuredData?.fallback, true);
    assert.strictEqual(res.structuredData?.reason, 'GEMINI_API_KEY_UNCONFIGURED');
  });

  // 7. Security & Runtime Hygiene: Zero Client Leakage
  await t.test('Security Hygiene: ensures API keys are never exposed in sanitized configs or HTTP endpoints', () => {
    const sanitized = getSanitizedConfig();
    assert.strictEqual((sanitized as any).NOVA_API_KEY, undefined);
    assert.strictEqual((sanitized as any).GEMINI_API_KEY, undefined);
    assert.strictEqual(typeof sanitized.NOVA_CONFIGURED, 'boolean');
    assert.strictEqual(typeof sanitized.GEMINI_CONFIGURED, 'boolean');
    assert.strictEqual(sanitized.GEMINI_MODEL, 'gemini-2.0-flash');
  });

  // 8. REST API Verification: Decoupled Controller Endpoints
  await t.test('REST Endpoints: /api/ai/status, /api/ai/agent/chat, and /api/ai/agent/stream operate with decoupled dual-engine', async () => {
    const { createApp } = await import('../src/app');
    const app = createApp();

    const server = await new Promise<any>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 1. GET /api/ai/status
      const statusRes = await fetch(`${baseUrl}/api/ai/status`);
      assert.strictEqual(statusRes.status, 200);
      const statusJson: any = await statusRes.json();
      assert.strictEqual(statusJson.success, true);
      assert.ok(statusJson.data.data_ingestion);
      assert.strictEqual(statusJson.data.data_ingestion.layer, 'Aczen Nova Data Ingestion Layer');
      assert.ok(statusJson.data.conversational_intelligence);
      assert.strictEqual(statusJson.data.conversational_intelligence.model, 'gemini-2.0-flash');

      // 2. GET /api/ai/agent/capabilities
      const capsRes = await fetch(`${baseUrl}/api/ai/agent/capabilities`);
      assert.strictEqual(capsRes.status, 200);
      const capsJson: any = await capsRes.json();
      assert.strictEqual(capsJson.success, true);
      assert.ok(capsJson.data.supportedIntents.includes('PRE_CLEARANCE_SIMULATION'));

      // 3. POST /api/ai/agent/chat
      const chatRes = await fetch(`${baseUrl}/api/ai/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Which department is spending most?' }),
      });
      assert.strictEqual(chatRes.status, 200);
      const chatJson: any = await chatRes.json();
      assert.strictEqual(chatJson.success, true);
      assert.ok(chatJson.data.reply.length > 20);
      assert.strictEqual(chatJson.data.intent, 'DEPARTMENT_SPEND_ANALYSIS');

      // 4. POST /api/ai/agent/stream
      const streamRes = await fetch(`${baseUrl}/api/ai/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Can I spend $50,000 on GCP?' }),
      });
      assert.strictEqual(streamRes.status, 200);
      const sseText = await streamRes.text();
      assert.ok(sseText.includes('data: {"type":"token"'));
      assert.ok(sseText.includes('data: {"type":"complete"'));
      assert.ok(sseText.includes('data: [DONE]'));
    } finally {
      if (server) {
        server.close();
      }
    }
  });

  closeDb();
});

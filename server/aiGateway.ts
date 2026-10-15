import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { headlinePrompt, parseHeadlineCompletion, HeadlineOutputError, headlineTokenBudget, headlineTimeoutMs, localEndpoint } from '../src/aiProviders.ts';

// Local prototype gateway. Secrets live only in this server process, for at most 8 hours.
export function aiGateway(): Plugin {
  type HostedProvider = 'openai' | 'gemini' | 'claude' | 'grok' | 'openrouter';
  const hosted: Record<HostedProvider, { base: string; name: string; protocol: 'openai' | 'anthropic' }> = {
    openai: { base: 'https://api.openai.com/v1', name: 'OpenAI', protocol: 'openai' },
    gemini: { base: 'https://generativelanguage.googleapis.com/v1beta/openai', name: 'Gemini', protocol: 'openai' },
    claude: { base: 'https://api.anthropic.com/v1', name: 'Claude', protocol: 'anthropic' },
    grok: { base: 'https://api.x.ai/v1', name: 'Grok', protocol: 'openai' },
    openrouter: { base: 'https://openrouter.ai/api/v1', name: 'OpenRouter', protocol: 'openai' },
  };
  const sessions = new Map<string, { provider: HostedProvider; apiKey: string; model: string; expires: number }>();
  const send = (res: ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  async function handle(req: IncomingMessage, res: ServerResponse, next: () => void) {
    if (!req.url?.startsWith('/api/ai/')) return next();
    try {
      const host = new URL(`http://${req.headers.host}`).hostname;
      const origin = req.headers.origin ? new URL(req.headers.origin) : null;
      if (!['localhost', '127.0.0.1', '[::1]'].includes(host) || (origin && origin.host !== req.headers.host)) return send(res, 403, { error: 'AI settings are available only from this local app.' });
      if (req.url === '/api/ai/status' && req.method === 'GET') return send(res, 200, { available: true });
      if (req.method !== 'POST' || !req.headers['content-type']?.startsWith('application/json')) return send(res, 405, { error: 'Use a JSON POST request.' });
      for (const [token, session] of sessions) if (session.expires < Date.now()) sessions.delete(token);
      let raw = '';
      for await (const part of req) { raw += part.toString(); if (raw.length > 16000) return send(res, 413, { error: 'Request is too large.' }); }
      const body = JSON.parse(raw);
      if (req.url === '/api/ai/local') {
        const paths = body.provider === 'lm-studio' ? ['/models', '/chat/completions'] : body.provider === 'ollama' ? ['/api/tags', '/api/chat'] : [];
        if (!paths.includes(body.path) || typeof body.endpoint !== 'string') return send(res, 400, { error: 'Invalid local provider operation.' });
        let target: URL;
        try { target = new URL(localEndpoint({ ...body, id: '', name: '', model: '' }, body.path)); }
        catch { return send(res, 400, { error: 'Use a loopback URL for your local AI server.' }); }
        // Resolve localhost deterministically: LM Studio commonly listens only on IPv4.
        if (target.hostname === 'localhost') target.hostname = '127.0.0.1';
        const generation = body.path === paths[1];
        const disconnected = new AbortController();
        res.once?.('close', () => { if (!res.writableEnded) disconnected.abort(); });
        try {
          const response = await fetch(target, {
            method: generation ? 'POST' : 'GET',
            headers: generation ? { 'Content-Type': 'application/json' } : undefined,
            body: generation ? JSON.stringify(body.payload) : undefined,
            signal: AbortSignal.any([disconnected.signal, AbortSignal.timeout(generation ? headlineTimeoutMs : 10000)]), redirect: 'error',
          });
          if (!response.ok) return send(res, 502, { error: `Local provider returned ${response.status}. Check the selected model and server authentication settings.` });
          return send(res, 200, await response.json());
        } catch (error) {
          return send(res, 502, { error: error instanceof DOMException && error.name === 'TimeoutError' ? 'The local model timed out. Try a smaller model or try again.' : `Cannot reach the local AI server at ${target.origin}. Check its address and that the server is running.` });
        }
      }
      if (req.url === '/api/ai/connect') {
        const provider = body.provider as HostedProvider;
        const config = hosted[provider];
        if (typeof body.apiKey !== 'string' || !body.apiKey.trim() || body.apiKey.length > 2048 || typeof body.model !== 'string' || !body.model.trim() || body.model.length > 200) return send(res, 400, { error: 'Enter a valid API key and model identifier.' });
        if (!config) return send(res, 400, { error: 'Choose a supported hosted provider.' });
        const headers: Record<string, string> = config.protocol === 'anthropic'
          ? { 'x-api-key': body.apiKey, 'anthropic-version': '2023-06-01' }
          : { Authorization: `Bearer ${body.apiKey}` };
        const checkUrl = provider === 'openrouter' ? `${config.base}/key` : `${config.base}/models`;
        const response = await fetch(checkUrl, { headers, signal: AbortSignal.timeout(15000), redirect: 'error' });
        if (!response.ok) return send(res, 400, { error: `${config.name} rejected the connection (${response.status}). Check your API key and access.` });
        if (sessions.size >= 100) return send(res, 429, { error: 'Too many active connections. Disconnect one or restart the local server.' });
        const token = randomUUID();
        sessions.set(token, { provider, apiKey: body.apiKey, model: body.model.trim(), expires: Date.now() + 8 * 60 * 60 * 1000 });
        setTimeout(() => sessions.delete(token), 8 * 60 * 60 * 1000).unref();
        return send(res, 200, { token });
      }
      if (req.url === '/api/ai/disconnect') { sessions.delete(body.token); return send(res, 200, { disconnected: true }); }
      if (req.url !== '/api/ai/headlines') return send(res, 404, { error: 'Unknown AI operation.' });
      const session = sessions.get(body.token);
      if (!session) return send(res, 401, { error: 'This connection expired. Reconnect your API key in Settings.' });
      const facts = body.facts;
      if (!facts || typeof facts.description !== 'string' || !facts.description.trim() || facts.description.length > 2000 || typeof facts.projectName !== 'string' || facts.projectName.length > 42 || typeof facts.role !== 'string' || facts.role.length > 100) return send(res, 400, { error: 'Provide a description for this slide.' });
      const disconnected = new AbortController();
      res.once?.('close', () => { if (!res.writableEnded) disconnected.abort(); });
      const config = hosted[session.provider];
      const headers: Record<string, string> = config.protocol === 'anthropic'
        ? { 'x-api-key': session.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
        : { Authorization: `Bearer ${session.apiKey}`, 'Content-Type': 'application/json' };
      const requestBody = config.protocol === 'anthropic'
        ? { model: session.model, max_tokens: headlineTokenBudget, system: headlinePrompt, messages: [{ role: 'user', content: JSON.stringify({ projectName: facts.projectName, role: facts.role, description: facts.description }) }] }
        : { model: session.model, stream: false, max_tokens: headlineTokenBudget, messages: [{ role: 'system', content: headlinePrompt }, { role: 'user', content: JSON.stringify({ projectName: facts.projectName, role: facts.role, description: facts.description }) }] };
      const response = await fetch(`${config.base}/${config.protocol === 'anthropic' ? 'messages' : 'chat/completions'}`, {
        method: 'POST', headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.any([disconnected.signal, AbortSignal.timeout(headlineTimeoutMs)]), redirect: 'error',
      });
      if (!response.ok) return send(res, 502, { error: `${config.name} returned ${response.status}. Check your model, credit balance, and provider availability.` });
      const result = await response.json();
      const content = config.protocol === 'anthropic'
        ? result.content?.filter((item: { type?: string }) => item.type === 'text').map((item: { text?: string }) => item.text ?? '').join('')
        : result.choices?.[0]?.message?.content;
      const reason = config.protocol === 'anthropic'
        ? result.stop_reason === 'max_tokens' ? 'length' : 'stop'
        : result.choices?.[0]?.finish_reason;
      return send(res, 200, { captions: parseHeadlineCompletion(content, reason) });
    } catch (error) {
      if (error instanceof HeadlineOutputError) return send(res, 422, { error: error.message });
      // Never forward provider bodies, request payloads or credentials to logs or the client.
      return send(res, 502, { error: error instanceof DOMException && error.name === 'TimeoutError' ? 'The provider timed out. Try again.' : 'The AI request could not be completed. Check your connection and try again.' });
    }
  }
  return { name: 'local-ai-gateway', configureServer(server) { server.middlewares.use(handle); }, configurePreviewServer(server) { server.middlewares.use(handle); } };
}

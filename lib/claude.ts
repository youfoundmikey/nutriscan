// Server-side helper for calling the Anthropic API.
// Requires ANTHROPIC_API_KEY to be set (Vercel env var or .env.local).

type ContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

type AskOptions = {
  // When true, give the model the web_search tool so it can look up nutrition
  // for branded / restaurant items that aren't in the USDA database. Search is
  // executed server-side by Anthropic, so we still get a single final response.
  web?: boolean;
};

export async function askClaudeJSON(
  system: string,
  content: ContentBlock[],
  maxTokens = 1500,
  opts: AskOptions = {}
): Promise<unknown> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Add it in Vercel → Project → Settings → Environment Variables."
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content }],
      ...(opts.web
        ? {
            tools: [
              { type: "web_search_20250305", name: "web_search", max_uses: 3 },
            ],
          }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");

  // Strip markdown fences if the model added them, then parse.
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const startArr = clean.indexOf("[");
  const first =
    startArr !== -1 && (startArr < start || start === -1) ? startArr : start;
  return JSON.parse(clean.slice(first));
}

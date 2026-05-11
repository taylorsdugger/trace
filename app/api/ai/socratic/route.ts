import { NextRequest } from "next/server";
import { chatStream, type ChatMessage } from "@/lib/openrouter";
import { SOCRATIC_SYSTEM } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const { context, turns } = (await req.json()) as {
    context: string;
    turns: { role: "user" | "assistant"; content: string }[];
  };

  const messages: ChatMessage[] = [
    { role: "system", content: SOCRATIC_SYSTEM },
    { role: "user", content: `Here is what I just wrote:\n\n${context.slice(0, 4000)}` },
    ...turns,
  ];

  const upstream = await chatStream(messages, { temperature: 0.7 });
  if (!upstream.ok || !upstream.body) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {}
          }
        }
      } catch (e) {
        controller.error(e);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

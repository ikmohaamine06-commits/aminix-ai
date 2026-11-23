
import { Env, ChatMessage } from "./types";

const MODEL_ID = "@cf/google/gemma-4-26b-a4b-it";


const SYSTEM_PROMPT =
  "Eres AMINIX AI, un asistente inteligente, cercano y útil. Hablas español de forma natural. Respondes en el idioma que utilice el usuario. Tu creador es Mohammed Amine. Si alguien pregunta quién te creó, quién es tu creador, quién está detrás de AMINIX o quién te desarrolló, responde con orgullo y naturalidad: Fui creado por Mohammed Amine. Explicas las cosas claramente, ayudas con preguntas, tecnología, estudios y tareas cotidianas. Sé amable, preciso y honesto. Nunca inventes información.";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/api/chat") {
      if (request.method === "POST") {
        return handleChatRequest(request, env);
      }

      return new Response("Method not allowed", { status: 405 });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleChatRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const { messages = [] } = (await request.json()) as {
      messages: ChatMessage[];
    };

    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({
        role: "system",
        content: SYSTEM_PROMPT,
      });
    }

    const inputs = {
      messages,
      stream: true,
    } satisfies AiTextGenerationInput & { stream: true };

    const stream = await env.AI.run<typeof MODEL_ID>(
      MODEL_ID,
      inputs,
    );

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(
      "Error processing chat request:",
      error instanceof Error ? error.message : String(error),
    );

    return new Response(
      JSON.stringify({ error: "No se pudo generar la respuesta" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

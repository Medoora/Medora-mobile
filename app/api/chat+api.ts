// app/api/chat+api.ts
import {
  createSystemPrompt,
  formatUserDataForPrompt,
} from "@/components/prompt/prompt";
import {
  availableModels,
  DEFAULT_MODEL,
} from "@/lib/meditalk/model-config";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const TEMPERATURE = 0.7;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const getOpenAIModel = (modelId: string) => {
  const modelExists = availableModels.some((m) => m.id === modelId);
  const selectedModel = modelExists ? modelId : DEFAULT_MODEL;
  return openai(selectedModel);
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, userId, model } = body;

    // Validation
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const selectedModel = model || DEFAULT_MODEL;

    // Mock user data
    const userData = { name: "User", role: "Patient" };
    const patientData = {
      name: "User",
      medicalConditions: [],
      medications: [],
      allergies: [],
    };

    const formattedData = formatUserDataForPrompt(patientData, userData);
    const systemPrompt = createSystemPrompt(formattedData);

    // ✅ Filter out empty or error messages
    const validMessages = messages.filter(
      (msg: ChatMessage) => 
        msg.content && 
        msg.content !== "No response" &&
        msg.content !== "Something went wrong. Please try again."
    );

    // ✅ Remove duplicate consecutive user messages
    const dedupedMessages: ChatMessage[] = [];
    for (let i = 0; i < validMessages.length; i++) {
      const current = validMessages[i];
      const prev = validMessages[i - 1];
      
      if (!prev || !(prev.role === 'user' && current.role === 'user')) {
        dedupedMessages.push(current);
      }
    }

    // Prepare API messages
    const apiMessages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...dedupedMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    console.log("📨 Messages count:", apiMessages.length);
    console.log("📨 Last message:", apiMessages[apiMessages.length - 1]?.content?.slice(0, 50));

    // Call AI
    const result = streamText({
      model: getOpenAIModel(selectedModel),
      messages: apiMessages,
      temperature: TEMPERATURE,
    });

    const text = await result.text;

    return new Response(
      JSON.stringify({ text }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
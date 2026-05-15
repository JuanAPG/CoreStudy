"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Groq from "groq-sdk";

export type GeneratedCard = { frente: string; verso: string };

export async function generateCardsFromFile(
  formData: FormData
): Promise<{ ok: boolean; cards?: GeneratedCard[]; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "No autenticado" };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { ok: false, error: "GROQ_API_KEY no configurada en el servidor." };

  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, error: "No se recibió ningún archivo." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  try {
    if (ext === "txt") {
      text = buffer.toString("utf-8");
    } else if (ext === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { PDFParse } = await import("pdf-parse") as any;
      const parser = new PDFParse({ data: buffer });
      const data: { text: string } = await parser.getText();
      text = data.text;
    } else if (ext === "docx" || ext === "doc") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return { ok: false, error: "Formato no soportado. Usa PDF, DOCX o TXT." };
    }
  } catch (err) {
    console.error("File parse error:", err);
    return { ok: false, error: "No se pudo leer el archivo. Verifica que no esté dañado." };
  }

  text = text.replace(/\s+/g, " ").trim();
  if (text.length < 50) {
    return { ok: false, error: "El archivo parece estar vacío o no contiene texto legible." };
  }

  // Groq free tier: ~6 000 tokens de contexto seguros para llama-3.3-70b
  const content = text.length > 10000 ? text.slice(0, 10000) + "\n[...texto truncado]" : text;

  const prompt = `Eres un asistente de estudio experto. Analiza el siguiente material y genera entre 8 y 15 flashcards de alta calidad para memorización y repaso.

Reglas:
- frente: pregunta directa, término clave o concepto importante
- verso: respuesta concisa, definición o explicación breve (máximo 2 oraciones)
- Evita repetir ideas
- Prioriza los conceptos más importantes del material

Responde ÚNICAMENTE con un JSON array válido, sin texto previo ni posterior, sin bloques de código markdown:
[{"frente":"...","verso":"..."},{"frente":"...","verso":"..."}]

Material de estudio:
${content}`;

  try {
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    });

    let raw = completion.choices[0]?.message?.content?.trim() ?? "";

    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return { ok: false, error: "La IA no devolvió un formato de tarjetas válido. Intenta de nuevo." };

    const parsed = JSON.parse(match[0]) as unknown[];
    const cards: GeneratedCard[] = (parsed as GeneratedCard[]).filter(
      (c) => c && typeof (c as GeneratedCard).frente === "string" && typeof (c as GeneratedCard).verso === "string"
        && (c as GeneratedCard).frente && (c as GeneratedCard).verso
    );

    if (cards.length === 0) return { ok: false, error: "No se generaron tarjetas. Intenta con otro documento." };
    return { ok: true, cards };
  } catch (err) {
    console.error("Groq error:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("401") || msg.includes("auth")) return { ok: false, error: "API key de Groq inválida." };
    if (msg.includes("429") || msg.includes("rate")) return { ok: false, error: "Límite de Groq alcanzado. Espera un momento e intenta de nuevo." };
    return { ok: false, error: "Error al conectar con la IA. Verifica tu GROQ_API_KEY y conexión." };
  }
}

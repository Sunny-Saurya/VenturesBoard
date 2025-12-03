import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables")
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export interface EnhancePitchOptions {
  title: string
  description: string
  pitch: string
  action: "rewrite" | "improve" | "expand"
}

export interface EnhancePitchResult {
  enhancedPitch: string
  suggestions?: string[]
}

/**
 * Enhance a startup pitch using Gemini AI
 * @param options - The pitch content and enhancement action
 * @returns Enhanced pitch content with suggestions
 */
export async function enhancePitch(
  options: EnhancePitchOptions,
): Promise<EnhancePitchResult> {
  const { title, description, pitch, action } = options

  // Use gemini-2.0-flash-lite (available in v1 API)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    },
  })

  let prompt = ""

  switch (action) {
    case "rewrite":
      prompt = `You are a professional startup pitch writer. Rewrite the following startup pitch in a more professional, compelling tone while maintaining the core message and technical accuracy.

Startup Title: ${title}
Description: ${description}

Original Pitch:
${pitch}

Instructions:
- Rewrite in a professional, engaging tone
- Fix any grammar and spelling errors
- Maintain the original meaning and key points
- Make it more compelling to investors
- Keep the same general length
- Format using Markdown

Return ONLY the rewritten pitch content in Markdown format, without any preamble or explanation.`
      break

    case "improve":
      prompt = `You are a professional startup pitch consultant. Improve the following startup pitch by fixing grammar, enhancing clarity, and making it more professional.

Startup Title: ${title}
Description: ${description}

Original Pitch:
${pitch}

Instructions:
- Fix all grammar and spelling errors
- Improve sentence structure and flow
- Enhance clarity and readability
- Make it more concise where possible
- Add professional polish
- Keep the core content intact
- Format using Markdown

Return ONLY the improved pitch content in Markdown format, without any preamble or explanation.`
      break

    case "expand":
      prompt = `You are a professional startup pitch writer. Expand the following startup pitch by adding more details, clarity, and structure while keeping it focused and investor-friendly.

Startup Title: ${title}
Description: ${description}

Original Pitch:
${pitch}

Instructions:
- Expand unclear or brief ideas with more detail
- Add structure (problem, solution, market, traction if mentioned)
- Clarify any ambiguous points
- Make value propositions more explicit
- Add context where needed
- Keep it concise but comprehensive (aim for 30-50% longer)
- Format using Markdown with clear sections

Return ONLY the expanded pitch content in Markdown format, without any preamble or explanation.`
      break

    default:
      throw new Error(`Invalid action: ${action}`)
  }

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const enhancedPitch = response.text().trim()

    // Generate improvement suggestions
    const suggestionsPrompt = `Based on this startup pitch, provide 3-5 brief, actionable suggestions for further improvement. Focus on content, structure, and messaging.

Pitch:
${enhancedPitch}

Return only a numbered list of suggestions, each on a new line. Be concise (10-15 words per suggestion).`

    const suggestionsResult = await model.generateContent(suggestionsPrompt)
    const suggestionsText = suggestionsResult.response.text().trim()

    // Parse suggestions (split by newlines, remove numbering)
    const suggestions = suggestionsText
      .split("\n")
      .map(line => line.replace(/^\d+\.\s*/, "").trim())
      .filter(line => line.length > 0)
      .slice(0, 5) // Limit to 5 suggestions

    return {
      enhancedPitch,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    }
  } catch (error) {
    console.error("Error enhancing pitch with Gemini:", error)
    throw new Error(
      `Failed to enhance pitch: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

/**
 * Quick validation and grammar check
 */
export async function quickGrammarCheck(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  })

  const prompt = `Fix grammar and spelling errors in the following text. Keep the same tone and meaning. Return ONLY the corrected text without any explanations.

Text:
${text}`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error("Error with grammar check:", error)
    throw new Error(
      `Failed to check grammar: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

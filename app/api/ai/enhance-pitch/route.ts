import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { enhancePitch } from "@/lib/gemini"

const enhanceRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  pitch: z.string().min(10, "Pitch must be at least 10 characters"),
  action: z.enum(["rewrite", "improve", "expand"]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = enhanceRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const { title, description, pitch, action } = validationResult.data

    // Call Gemini AI to enhance the pitch
    const result = await enhancePitch({
      title,
      description,
      pitch,
      action,
    })

    return NextResponse.json({
      success: true,
      enhancedPitch: result.enhancedPitch,
      suggestions: result.suggestions,
    })
  } catch (error) {
    console.error("Error in enhance-pitch API:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Failed to enhance pitch"

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 },
    )
  }
}

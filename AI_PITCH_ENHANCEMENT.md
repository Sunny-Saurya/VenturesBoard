# AI Pitch Enhancement Feature

## Overview
This feature integrates Google's Gemini AI to help users improve their startup pitches with professional writing assistance.

## Features

### Three Enhancement Modes:

1. **✨ Rewrite** - Rewrites the pitch in a more professional, compelling tone
2. **⚡ Improve** - Fixes grammar, enhances clarity, and adds professional polish
3. **➕ Expand** - Adds more details, structure, and clarity to brief ideas

### AI Suggestions
After each enhancement, the AI provides 3-5 actionable suggestions for further improvements.

## Technical Implementation

### Files Created/Modified:

1. **`lib/gemini.ts`** - Core AI service with Gemini integration
   - `enhancePitch()` - Main enhancement function
   - `quickGrammarCheck()` - Grammar validation utility

2. **`app/api/ai/enhance-pitch/route.ts`** - API endpoint for AI requests
   - Validates input with Zod
   - Handles errors gracefully
   - Returns enhanced pitch + suggestions

3. **`components/startup-form.tsx`** - Updated form with AI buttons
   - Three action buttons (Rewrite, Improve, Expand)
   - Loading states with spinning icons
   - Real-time pitch updates
   - AI suggestions display

## Environment Setup

Required environment variable:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

1. User fills in Title, Description, and Pitch
2. Clicks one of the AI enhancement buttons:
   - **Rewrite** - Complete professional rewrite
   - **Improve** - Grammar & clarity fixes
   - **Expand** - Add detail & structure
3. AI processes the pitch (shows loading state)
4. Enhanced pitch replaces original content
5. AI suggestions appear below the editor

## API Endpoint

**POST** `/api/ai/enhance-pitch`

Request body:
```json
{
  "title": "Startup Title",
  "description": "Brief description",
  "pitch": "Full pitch content in markdown",
  "action": "rewrite" | "improve" | "expand"
}
```

Response:
```json
{
  "success": true,
  "enhancedPitch": "Enhanced markdown content...",
  "suggestions": [
    "Add metrics to support claims",
    "Include competitive advantages",
    "Clarify target market size"
  ]
}
```

## Dependencies

- `@google/generative-ai` - Gemini AI SDK
- `zod` - Schema validation
- `lucide-react` - Icons

## User Experience

- **Disabled state**: Buttons disabled when pitch is empty or processing
- **Loading indicators**: Spinning icons during AI processing
- **Toast notifications**: Success/error feedback
- **Suggestions panel**: Blue-themed panel with bullet points
- **Smooth updates**: Real-time pitch replacement

## Error Handling

- Missing fields validation
- API error handling with user-friendly messages
- Network failure fallbacks
- Toast notifications for all states

## Future Enhancements

- [ ] Undo/redo functionality
- [ ] Side-by-side comparison view
- [ ] Save multiple versions
- [ ] Tone customization (formal, casual, technical)
- [ ] Industry-specific templates
- [ ] A/B testing suggestions

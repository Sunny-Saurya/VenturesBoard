"use client"

import React, { useActionState, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Send, Sparkles, RefreshCw, Zap, Plus, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createPitch } from "@/lib/actions"
import { formSchema } from "@/lib/validation"
import { samplePitches } from "@/lib/sample-pitches"

// ⛔ Load MDEditor dynamically to avoid hydration issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
})

interface StartupFormProps {
  initialData?: {
    _id: string
    title: string
    description: string
    category: string
    image: string
    pitch: string
  }
  isEditing?: boolean
}

const StartupForm = ({ initialData, isEditing = false }: StartupFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pitch, setPitch] = useState(initialData?.pitch || "")
  const [editorMounted, setEditorMounted] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementAction, setEnhancementAction] = useState<
    "rewrite" | "improve" | "expand" | null
  >(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")

  const router = useRouter()
  const { toast } = useToast()

  // Image upload state
  const [imageUrl, setImageUrl] = useState(initialData?.image || "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Ensures MDEditor only loads on client
  useEffect(() => {
    setEditorMounted(true)
  }, [])

  // Load a random sample pitch for demo
  const loadSamplePitch = () => {
    const randomPitch = samplePitches[Math.floor(Math.random() * samplePitches.length)]
    setTitle(randomPitch.title)
    setDescription(randomPitch.description)
    setPitch(randomPitch.pitch)
    setImageUrl(randomPitch.image)
    
    // Set category in the form
    const categoryInput = document.getElementById("category") as HTMLInputElement
    if (categoryInput) {
      categoryInput.value = randomPitch.category
    }

    // Set image in the form
    const imageInput = document.getElementById("link") as HTMLInputElement
    if (imageInput) {
      imageInput.value = randomPitch.image
    }

    toast({
      title: "Sample Pitch Loaded",
      description: `Loaded "${randomPitch.title}" - Feel free to edit any field!`,
    })
  }

  // Handle image file selection
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setImageFile(file)

    try {
      // Create a data URL for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setImageUrl(dataUrl)

        // Also update the form input
        const imageInput = document.getElementById("link") as HTMLInputElement
        if (imageInput) {
          imageInput.value = dataUrl
        }

        toast({
          title: "Image Uploaded",
          description: "Image ready to use",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleImageFile(files[0])
    }
  }

  // Handle file input
  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleImageFile(files[0])
    }
  }

  const handleEnhancePitch = async (
    action: "rewrite" | "improve" | "expand",
  ) => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title before enhancing your pitch.",
        variant: "destructive",
      })
      return
    }

    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description before enhancing your pitch.",
        variant: "destructive",
      })
      return
    }

    if (!pitch.trim()) {
      toast({
        title: "Pitch Required",
        description: "Please enter a pitch before enhancing it.",
        variant: "destructive",
      })
      return
    }

    setIsEnhancing(true)
    setEnhancementAction(action)
    setSuggestions([])

    try {
      const response = await fetch("/api/ai/enhance-pitch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          pitch,
          action,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to enhance pitch")
      }

      if (data.success && data.enhancedPitch) {
        setPitch(data.enhancedPitch)
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions)
        }

        const actionText =
          action === "rewrite"
            ? "rewritten"
            : action === "improve"
              ? "improved"
              : "expanded"

        toast({
          title: "✨ Pitch Enhanced!",
          description: `Your pitch has been ${actionText} using AI.`,
        })
      }
    } catch (error) {
      console.error("Error enhancing pitch:", error)
      toast({
        title: "Enhancement Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to enhance pitch. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnhancing(false)
      setEnhancementAction(null)
    }
  }

  const handleFormSubmit = async (previousState: any, formData: FormData) => {
    try {
      const formValues = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        link: formData.get("link") as string,
        pitch,
      }

      await formSchema.parseAsync(formValues)

      let result

      if (isEditing && initialData) {
        const { updatePitch } = await import("@/lib/actions")
        result = await updatePitch(initialData._id, previousState, formData, pitch)
        console.log("updatePitch result:", result)
      } else {
        result = await createPitch(previousState, formData, pitch)
        console.log("createPitch result:", result)
      }

      if (result?.status === "SUCCESS") {
        if (!result._id) {
          toast({
            title: isEditing ? "Updated but no ID" : "Created but no ID",
            description: "Server responded with success but did not return an ID.",
            variant: "destructive",
          })
          return result
        }

        toast({
          title: "Success",
          description: isEditing
            ? "Your startup pitch has been updated successfully!"
            : "Your startup pitch has been created successfully!",
        })

        router.push(`/startup/${result._id}`)
      } else {
        toast({
          title: "Error",
          description: result?.error || `Failed to ${isEditing ? "update" : "create"} pitch`,
          variant: "destructive",
        })
      }

      return result
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors
        // setErrors(fieldErrors as Record<string, string>)

        toast({
          title: "Validation Error",
          description: "Please check your inputs and try again.",
          variant: "destructive",
        })

        return { ...previousState, error: "Validation failed", status: "ERROR" }
      }

      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })

      return { ...previousState, error: "Unexpected error", status: "ERROR" }
    }
  }

  const [state, formAction, isPending] = useActionState(handleFormSubmit, {
    error: "",
    status: "INITIAL",
  })

  return (
    <Card className="mx-auto mb-20 w-full max-w-2xl rounded-3xl">
      <CardHeader>
        <CardTitle className="sr-only">Startup Pitch</CardTitle>
      </CardHeader>

      <CardContent suppressHydrationWarning>
        <form action={formAction} className="space-y-6">
          {/* Load Sample Button */}
          <div className="mb-6 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadSamplePitch}
              className="gap-2"
            >
              <Sparkles className="size-4" />
              Load Sample Pitch
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click to load a professional example pitch. You can edit all fields!
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Startup Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              placeholder="Describe your idea..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              required
              placeholder="Tech, Health, Education..."
              defaultValue={initialData?.category}
            />
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          {/* Image Link */}
          <div className="space-y-2">
            <Label htmlFor="link">Image URL</Label>
            
            {/* Image Preview */}
            {imageUrl && (
              <div className="relative mb-4 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => {
                    setImageUrl("")
                    setImageFile(null)
                    const imageInput = document.getElementById("link") as HTMLInputElement
                    if (imageInput) imageInput.value = ""
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
                >
                  <X className="size-4 text-white" />
                </button>
              </div>
            )}

            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed transition-colors p-6 text-center cursor-pointer ${
                dragActive
                  ? "border-pink-400 bg-pink-500/10"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
            >
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageInput}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-6 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {isUploading ? "Uploading..." : "Drag & drop your image here"}
                  </p>
                  <p className="text-xs text-white/60">or click to select (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="link" className="text-xs text-white/60">Or paste image URL</Label>
              <Input
                id="link"
                name="link"
                placeholder="https://example.com/image.jpg"
                defaultValue={initialData?.image}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  if (e.target.value && !e.target.value.startsWith("data:")) {
                    // Validate it's a valid URL
                    try {
                      new URL(e.target.value)
                    } catch {
                      // Invalid URL, but allow user to type
                    }
                  }
                }}
              />
              <p className="text-xs text-white/60">
                Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>

            {errors.link && <p className="text-sm text-red-500">{errors.link}</p>}
          </div>

          {/* Pitch (Markdown Editor) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pitch">Pitch</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleEnhancePitch("rewrite")}
                  disabled={isEnhancing || !pitch.trim()}
                  className="group h-8 gap-1.5 text-xs"
                >
                  {isEnhancing && enhancementAction === "rewrite" ? (
                    <RefreshCw className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3 transition-transform group-hover:scale-110" />
                  )}
                  Rewrite
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleEnhancePitch("improve")}
                  disabled={isEnhancing || !pitch.trim()}
                  className="group h-8 gap-1.5 text-xs"
                >
                  {isEnhancing && enhancementAction === "improve" ? (
                    <RefreshCw className="size-3 animate-spin" />
                  ) : (
                    <Zap className="size-3 transition-transform group-hover:scale-110" />
                  )}
                  Improve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleEnhancePitch("expand")}
                  disabled={isEnhancing || !pitch.trim()}
                  className="group h-8 gap-1.5 text-xs"
                >
                  {isEnhancing && enhancementAction === "expand" ? (
                    <RefreshCw className="size-3 animate-spin" />
                  ) : (
                    <Plus className="size-3 transition-transform group-hover:scale-110" />
                  )}
                  Expand
                </Button>
              </div>
            </div>

            {!editorMounted ? (
              <div className="h-[300px] w-full rounded-lg bg-neutral-900/30 p-4 text-sm text-neutral-500">
                Loading editor…
              </div>
            ) : (
              <MDEditor
                value={pitch}
                onChange={(value: string | undefined) => setPitch(value || "")}
                preview="edit"
                height={300}
                style={{ borderRadius: 8, overflow: "hidden" }}
                textareaProps={{
                  placeholder: "Briefly describe your idea and problem it solves",
                }}
                previewOptions={{
                  disallowedElements: ["style"],
                }}
              />
            )}

            {errors.pitch && <p className="text-sm text-red-500">{errors.pitch}</p>}

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="size-4 text-blue-500" />
                  <p className="text-sm font-medium text-blue-500">
                    AI Suggestions for Further Improvement:
                  </p>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? isEditing
                ? "Updating..."
                : "Submitting..."
              : isEditing
                ? "Update Your Pitch"
                : "Submit Your Pitch"}
            <Send className="ml-2 size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default StartupForm

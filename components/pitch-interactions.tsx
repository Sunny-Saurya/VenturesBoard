"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, MessageCircle, Send } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { addComment, toggleReaction } from "@/lib/actions"
import { formatDate } from "@/lib/utils"

interface Comment {
  _id: string
  content: string
  createdAt: string
  author: {
    _id: string
    name: string
    username: string
    image: string
  }
}

interface InteractionsProps {
  startupId: string
  comments: Comment[]
  likes: number
  dislikes: number
  userReaction: "like" | "dislike" | null
  currentUserId?: string
}

export function PitchInteractions({
  startupId,
  comments: initialComments,
  likes: initialLikes,
  dislikes: initialDislikes,
  userReaction: initialUserReaction,
  currentUserId,
}: InteractionsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(
    initialUserReaction
  )
  const router = useRouter()
  const { toast } = useToast()

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await addComment(startupId, newComment)

      if (result.status === "SUCCESS") {
        setNewComment("")
        toast({
          title: "Comment added",
          description: "Your comment has been posted",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReaction = async (type: "like" | "dislike") => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to react",
        variant: "destructive",
      })
      return
    }

    // Optimistic update
    const previousReaction = userReaction
    const previousLikes = likes
    const previousDislikes = dislikes

    if (userReaction === type) {
      // Remove reaction
      setUserReaction(null)
      if (type === "like") setLikes(likes - 1)
      else setDislikes(dislikes - 1)
    } else if (userReaction) {
      // Switch reaction
      setUserReaction(type)
      if (type === "like") {
        setLikes(likes + 1)
        setDislikes(dislikes - 1)
      } else {
        setDislikes(dislikes + 1)
        setLikes(likes - 1)
      }
    } else {
      // Add new reaction
      setUserReaction(type)
      if (type === "like") setLikes(likes + 1)
      else setDislikes(dislikes + 1)
    }

    try {
      const result = await toggleReaction(startupId, type)

      if (result.status !== "SUCCESS") {
        // Revert on error
        setUserReaction(previousReaction)
        setLikes(previousLikes)
        setDislikes(previousDislikes)

        toast({
          title: "Error",
          description: result.error || "Failed to update reaction",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revert on error
      setUserReaction(previousReaction)
      setLikes(previousLikes)
      setDislikes(previousDislikes)

      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mt-12 space-y-8">
      {/* Reactions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => handleReaction("like")}
          variant={userReaction === "like" ? "default" : "outline"}
          size="lg"
          className={`gap-2 ${
            userReaction === "like"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "border-white/20 bg-white/5 hover:bg-white/10"
          }`}
        >
          <ThumbsUp className="size-5" />
          <span className="font-semibold">{likes}</span>
        </Button>

        <Button
          onClick={() => handleReaction("dislike")}
          variant={userReaction === "dislike" ? "default" : "outline"}
          size="lg"
          className={`gap-2 ${
            userReaction === "dislike"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "border-white/20 bg-white/5 hover:bg-white/10"
          }`}
        >
          <ThumbsDown className="size-5" />
          <span className="font-semibold">{dislikes}</span>
        </Button>

        <div className="flex items-center gap-2 text-white/60 ml-4">
          <MessageCircle className="size-5" />
          <span className="font-medium">{comments.length} Comments</span>
        </div>
      </div>

      {/* Comment Form */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-xl font-semibold">Leave a Comment</h3>
        <form onSubmit={handleAddComment} className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              currentUserId
                ? "Share your thoughts..."
                : "Sign in to leave a comment"
            }
            disabled={!currentUserId || isSubmitting}
            className="min-h-[100px] resize-none bg-white/5 border-white/10"
          />
          <Button
            type="submit"
            disabled={!currentUserId || isSubmitting || !newComment.trim()}
            className="bg-pink-400 text-black hover:bg-pink-500"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
            <Send className="ml-2 size-4" />
          </Button>
        </form>
      </div>

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">
            Comments ({comments.length})
          </h3>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="size-10">
                    <AvatarImage src={comment.author.image} />
                    <AvatarFallback>
                      {comment.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold">
                        {comment.author.name}
                      </span>
                      <span className="text-sm text-white/40">
                        @{comment.author.username}
                      </span>
                      <span className="text-sm text-white/40">·</span>
                      <span className="text-sm text-white/40">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-white/80">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

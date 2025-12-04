"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deletePitch } from "@/lib/actions"

interface PitchActionsProps {
  pitchId: string
  authorId?: string | null
  currentUserId?: string
}

export function PitchActions({
  pitchId,
  authorId,
  currentUserId,
}: PitchActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  // Show actions if the current user is the author OR if there's no author and user is logged in
  const canDelete = currentUserId && (currentUserId === authorId || !authorId)

  const handleEdit = () => {
    router.push(`/startup/${pitchId}/edit`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deletePitch(pitchId)

      if (result.status === "SUCCESS") {
        toast({
          title: "Pitch Deleted",
          description: "Your pitch has been deleted successfully.",
        })
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete pitch",
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
      setIsDeleting(false)
    }
  }

  if (!canDelete) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleEdit}
        variant="outline"
        size="sm"
        className="gap-2 border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
      >
        <Edit className="size-4" />
        Edit
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-white/10 bg-black/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. This will permanently delete your
              pitch and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

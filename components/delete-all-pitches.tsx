"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { deleteAllUserPitches } from "@/lib/actions"

interface DeleteAllPitchesProps {
  isCurrentUser: boolean
}

export default function DeleteAllPitches({ isCurrentUser }: DeleteAllPitchesProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  if (!isCurrentUser) {
    return null
  }

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteAllUserPitches()

      if (result.status === "SUCCESS") {
        toast({
          title: "Success",
          description: `Deleted ${result.deletedCount} pitch(es) successfully!`,
        })
        setShowConfirm(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete pitches",
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

  if (!showConfirm) {
    return (
      <Button
        onClick={() => setShowConfirm(true)}
        variant="outline"
        size="sm"
        className="mt-4 w-full gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-600"
      >
        <Trash2 className="size-4" />
        Delete All My Pitches
      </Button>
    )
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <p className="text-sm font-medium text-red-600">
        ⚠️ Are you sure? This action cannot be undone.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleDeleteAll}
          disabled={isDeleting}
          variant="destructive"
          size="sm"
          className="flex-1"
        >
          {isDeleting ? "Deleting..." : "Yes, Delete All"}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

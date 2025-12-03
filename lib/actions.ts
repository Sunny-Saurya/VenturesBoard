"use server"

import { revalidatePath } from "next/cache"
import slugify from "slugify"

import { auth } from "@/auth"
import { parseServerActionResponse } from "@/lib/utils"
import { writeClient } from "@/sanity/lib/write-client"

export const createPitch = async (
  state: any,
  form: FormData,
  pitch: string,
) => {
  const session = await auth()

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    })

  // Try to ensure we have an author id to reference in Sanity. If we cannot
  // recover or create an author, proceed to create the startup without an
  // author reference so the frontend still shows the created pitch.
  if (!session.id) {
    const email = session?.user?.email
    const name = session?.user?.name || ""
    const image = session?.user?.image || ""

    if (!email) {
      console.warn("createPitch: no session.id and no email available to recover author; proceeding without author")
    } else {
      try {
        // try to find an existing author by email
        const existing = await writeClient
          .withConfig({ useCdn: false })
          .fetch(`*[_type == "author" && email == $email][0]{ _id }`, { email })

        if (existing?._id) {
          session.id = existing._id
        } else {
          // create a stable _id based on the email
          const safeId = `author-${String(email).replace(/[^a-zA-Z0-9-_:.]/g, "-")}`

          const created = await writeClient.createIfNotExists({
            _id: safeId,
            _type: "author",
            id: safeId,
            name,
            username: (name || "").replace(/\s+/g, "-").toLowerCase(),
            email,
            image,
            bio: "",
          })

          session.id = created?._id || safeId
        }
      } catch (err) {
        // Log and continue; we'll create the startup without an author.
        console.error("createPitch: failed to recover/create author:", err)
      }
    }
  }

  // Quick check that the write client has a token available to avoid a confusing
  // crash later on. writeClient will also throw, but this allows a prettier
  // error to be returned to the client.
  try {
    if (!writeClient.config().token) {
      return parseServerActionResponse({
        error: "Sanity write token not configured on the server.",
        status: "ERROR",
      })
    }
  } catch (err) {
    // access to config() might throw in some envs; handle defensively
    console.error("Error checking writeClient token:", err)
    return parseServerActionResponse({
      error: "Unable to verify Sanity write token.",
      status: "ERROR",
    })
  }

  const { title, description, category, link } = Object.fromEntries(
    [...form].filter(([key]) => key !== "pitch"),
  )

  const slug = slugify(title as string, { lower: true, strict: true })

  try {
    // Build the startup document; include author only if we have a resolved id.
    const startup: any = {
      title,
      description,
      category,
      image: link,
      slug: {
        _type: "slug",
        current: slug,
      },
      pitch,
    }

    if (session.id) {
      startup.author = {
        _type: "reference",
        _ref: session.id,
      }
    }

    const result = await writeClient.create({ _type: "startup", ...startup })

    // If the author was missing, include a warning so the UI can surface it.
    const response: any = {
      ...result,
      error: "",
      status: "SUCCESS",
    }

    if (!session.id) response.warning = "Created without author reference"

    return parseServerActionResponse(response)
  } catch (error) {
    // Normalize common error shapes so the client gets a readable message.
    console.error("createPitch error:", error)

    const message =
      (error as any)?.message ||
      (typeof error === "string" ? error : JSON.stringify(error)) ||
      "Unknown error"

    return parseServerActionResponse({
      error: message,
      status: "ERROR",
    })
  }
}

export const deletePitch = async (id: string) => {
  const session = await auth()

  if (!session) {
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    })
  }

  try {
    // Fetch the pitch to verify ownership
    const pitch = await writeClient
      .withConfig({ useCdn: false })
      .fetch(`*[_type == "startup" && _id == $id][0]{ _id, author }`, { id })

    if (!pitch) {
      return parseServerActionResponse({
        error: "Pitch not found",
        status: "ERROR",
      })
    }

    // Check if user is the author OR pitch has no author
    const hasAuthor = pitch.author && pitch.author._ref
    if (hasAuthor && pitch.author._ref !== session.id) {
      return parseServerActionResponse({
        error: "You don't have permission to delete this pitch",
        status: "ERROR",
      })
    }

    // Delete the pitch
    await writeClient.delete(id)

    revalidatePath("/")
    revalidatePath("/pitches")

    return parseServerActionResponse({
      error: "",
      status: "SUCCESS",
    })
  } catch (error) {
    console.error("deletePitch error:", error)

    const message =
      (error as any)?.message ||
      (typeof error === "string" ? error : JSON.stringify(error)) ||
      "Unknown error"

    return parseServerActionResponse({
      error: message,
      status: "ERROR",
    })
  }
}

export const updatePitch = async (
  id: string,
  state: any,
  form: FormData,
  pitch: string,
) => {
  const session = await auth()

  if (!session) {
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    })
  }

  try {
    // Fetch the pitch to verify ownership
    const existingPitch = await writeClient
      .withConfig({ useCdn: false })
      .fetch(`*[_type == "startup" && _id == $id][0]{ _id, author }`, { id })

    if (!existingPitch) {
      return parseServerActionResponse({
        error: "Pitch not found",
        status: "ERROR",
      })
    }

    // Check if user is the author
    if (existingPitch.author._ref !== session.id) {
      return parseServerActionResponse({
        error: "You don't have permission to edit this pitch",
        status: "ERROR",
      })
    }

    const { title, description, category, link } = Object.fromEntries(
      [...form].filter(([key]) => key !== "pitch"),
    )

    const slug = slugify(title as string, { lower: true, strict: true })

    // Update the pitch
    const result = await writeClient
      .patch(id)
      .set({
        title,
        description,
        category,
        image: link,
        slug: {
          _type: "slug",
          current: slug,
        },
        pitch,
      })
      .commit()

    revalidatePath(`/startup/${id}`)
    revalidatePath("/")
    revalidatePath("/pitches")

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    })
  } catch (error) {
    console.error("updatePitch error:", error)

    const message =
      (error as any)?.message ||
      (typeof error === "string" ? error : JSON.stringify(error)) ||
      "Unknown error"

    return parseServerActionResponse({
      error: message,
      status: "ERROR",
    })
  }
}

export const deleteAllUserPitches = async () => {
  const session = await auth()

  if (!session) {
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    })
  }

  try {
    // Fetch all pitches by the current user
    const userPitches = await writeClient
      .withConfig({ useCdn: false })
      .fetch(
        `*[_type == "startup" && author._ref == $authorId]{ _id }`,
        { authorId: session.id }
      )

    if (!userPitches || userPitches.length === 0) {
      return parseServerActionResponse({
        error: "No pitches found to delete",
        status: "ERROR",
      })
    }

    // Delete all pitches
    const deletePromises = userPitches.map((pitch: any) =>
      writeClient.delete(pitch._id)
    )

    await Promise.all(deletePromises)

    revalidatePath("/")
    revalidatePath("/pitches")

    return parseServerActionResponse({
      status: "SUCCESS",
      deletedCount: userPitches.length,
      error: "",
    })
  } catch (error) {
    console.error("deleteAllUserPitches error:", error)

    const message =
      (error as any)?.message ||
      (typeof error === "string" ? error : JSON.stringify(error)) ||
      "Unknown error"

    return parseServerActionResponse({
      error: message,
      status: "ERROR",
    })
  }
}

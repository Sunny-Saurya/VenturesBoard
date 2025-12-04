import { auth } from "@/auth"
import StartupForm from "@/components/startup-form"
import { client } from "@/sanity/lib/client"
import { STARTUP_BY_ID_QUERY } from "@/sanity/lib/queries"
import { notFound, redirect } from "next/navigation"

const EditPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const session = await auth()

  if (!session) redirect("/")

  // Fetch the pitch data
  const post = await client.withConfig({ useCdn: false }).fetch(STARTUP_BY_ID_QUERY, { id })

  if (!post) return notFound()

  // Check if the current user is the author
  if (post.author?._id !== session?.id) {
    redirect(`/startup/${id}`)
  }

  return (
    <>
      <section className="mt-24 flex min-h-[230px] w-full flex-col items-center justify-center px-6 py-10">
        <h1 className="my-5 max-w-5xl rounded-xl px-6 py-3 text-center text-3xl font-extrabold uppercase leading-tight sm:text-5xl sm:leading-tight">
          Edit Your Pitch
        </h1>
      </section>

      <StartupForm initialData={post} isEditing={true} />
    </>
  )
}

export default EditPage

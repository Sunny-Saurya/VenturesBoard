"use client"

import React, { useEffect, useState } from "react"
import markdownit from "markdown-it"

const md = markdownit()

type Author = {
  _id?: string
  name?: string
  username?: string
  image?: string
}

type Startup = {
  _id?: string
  title?: string
  description?: string
  category?: string
  image?: string
  pitch?: string
  author?: Author
  _createdAt?: string
}

export default function StartupClient({
  id,
  initialData,
}: {
  id: string
  initialData?: Startup | null
}) {
  const [data, setData] = useState<Startup | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

      async function load() {
      try {
        if (!initialData) setLoading(true)
        const res = await fetch(`/api/startup/${id}`)
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json?.error || `Fetch failed: ${res.status}`)
        }
        const json = await res.json()
        if (!mounted) return
        setData(json)
      } catch (err: any) {
        console.error("StartupClient fetch error:", err)
        setError(err?.message || "Failed to load")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [id])

  if (loading) return null
  if (error) return <p className="italic text-sm text-red-400">{error}</p>
  if (!data) return null

  const parsed = md.render(data.pitch || "")

  return (
    <section className="mx-auto px-4 py-12 md:container">
      <img
        src={data.image}
        alt={data.title || "thumbnail"}
        width={1200}
        height={675}
        className="h-auto max-h-[650px] w-full rounded-3xl object-cover"
      />

      <div className="mx-auto mt-16 max-w-4xl overflow-hidden">
        <div className="p-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full overflow-hidden border-2 border-purple-500">
                {data.author?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.author.image} alt={data.author.name || ""} />
                ) : (
                  <div className="bg-purple-700 p-4 text-white">{data.author?.name?.charAt(0) || 'U'}</div>
                )}
              </div>

              <div>
                <p className="text-lg font-semibold">{data.author?.name}</p>
                <p className="text-sm text-gray-400">@{data.author?.username}</p>
              </div>
            </div>

            <span className="border-purple-500 text-purple-300 border rounded px-3 py-1">{data.category}</span>
          </div>

          <h1 className="my-5 max-w-5xl rounded-xl px-6 py-3 text-center text-3xl font-extrabold uppercase leading-tight sm:text-5xl sm:leading-tight">{data.title}</h1>
          <p className="max-w-4xl text-center text-lg text-primary/80 sm:text-xl">{data.description}</p>

          <div className="mt-6 prose prose-invert max-w-4xl" dangerouslySetInnerHTML={{ __html: parsed }} />
        </div>
      </div>
    </section>
  )
}

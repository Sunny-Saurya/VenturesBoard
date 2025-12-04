import { Suspense } from "react"
import { Grid3x3 } from "lucide-react"

import StartupCard, { StartupTypeCard } from "@/components/startup-card"
import { Skeleton } from "@/components/ui/skeleton"
import { client } from "@/sanity/lib/client"
import { STARTUPS_QUERY } from "@/sanity/lib/queries"
import { samplePitches } from "@/lib/sample-pitches"

export const metadata = {
  title: "All Pitches | VenturesBoard",
  description: "Browse all startup pitches on VenturesBoard",
}

export default async function AllPitchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const pageSize = 12

  return (
    <section className="pink_container min-h-screen !pt-28">
      <div className="container">
        <h1 className="heading mb-8">All Startup Pitches</h1>
        <p className="sub-heading !max-w-3xl mb-12">
          Explore innovative ideas, vote for your favorites, and discover the next big thing
        </p>

        <Suspense fallback={<PitchesGridSkeleton />}>
          <PitchesGrid page={page} pageSize={pageSize} />
        </Suspense>
      </div>
    </section>
  )
}

async function PitchesGrid({ page, pageSize }: { page: number; pageSize: number }) {
  const startups = await client.fetch(STARTUPS_QUERY, { search: null })

  // Sort user pitches by most recent FIRST
  const sortedStartups = startups.sort((a, b) => 
    new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
  )

  // Convert sample pitches to match StartupTypeCard format
  const sampleCards: StartupTypeCard[] = samplePitches.map((pitch, index) => ({
    _id: `sample-${index}`,
    title: pitch.title,
    description: pitch.description,
    category: pitch.category,
    image: pitch.image,
    _createdAt: new Date(0).toISOString(), // Set to old date so real pitches appear first
    views: Math.floor(Math.random() * 500) + 100, // Random views for demo
    author: {
      _id: `demo-author`,
      name: "VenturesBoard Demo",
      email: "demo@venturesboard.com",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
    },
  }))

  // Combine all pitches and sort by creation date (newest first)
  const allPitches = [...sortedStartups, ...sampleCards].sort((a, b) => 
    new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
  )

  // Simple pagination
  const totalPitches = allPitches.length
  const totalPages = Math.ceil(totalPitches / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedStartups = allPitches.slice(startIndex, endIndex)

  return (
    <div className="space-y-8">
      {paginatedStartups.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedStartups.map((post: StartupTypeCard) => (
              <StartupCard key={post?._id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              {page > 1 && (
                <a
                  href={`/pitches?page=${page - 1}`}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Previous
                </a>
              )}

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <a
                    key={pageNum}
                    href={`/pitches?page=${pageNum}`}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      pageNum === page
                        ? "bg-pink-400 text-black"
                        : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {pageNum}
                  </a>
                ))}
              </div>

              {page < totalPages && (
                <a
                  href={`/pitches?page=${page + 1}`}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Next
                </a>
              )}
            </div>
          )}

          <div className="text-center text-sm text-white/60">
            Showing {startIndex + 1}-{Math.min(endIndex, totalPitches)} of {totalPitches} pitches
          </div>
        </>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12">
          <Grid3x3 className="mb-4 size-16 text-white/40" />
          <h3 className="mb-2 text-2xl font-semibold">No Pitches Found</h3>
          <p className="text-white/60">
            Be the first to share your startup idea!
          </p>
        </div>
      )}
    </div>
  )
}

function PitchesGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <Skeleton className="h-40 w-full rounded-xl bg-white/10" />
          <Skeleton className="h-6 w-3/4 bg-white/10" />
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-4 w-2/3 bg-white/10" />
        </div>
      ))}
    </div>
  )
}

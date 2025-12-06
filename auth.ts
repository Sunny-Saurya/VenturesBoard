import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

import { client } from "@/sanity/lib/client"
import { AUTHOR_BY_GITHUB_ID_QUERY } from "@/sanity/lib/queries"
import { writeClient } from "@/sanity/lib/write-client"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

// Minimal, safe NextAuth setup using environment variables.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID || process.env.AUTH_GITHUB_ID || "",
      clientSecret:
        process.env.GITHUB_SECRET || process.env.AUTH_GITHUB_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  callbacks: {
    // Runs after a successful OAuth sign in. Ensure the author exists in Sanity and MongoDB.
    async signIn({ user, profile }) {
      try {
        // cast to any to avoid tight TypeScript coupling with callback types
        const u = user as any
        const p = profile as any
        const githubId = p?.id

        if (!githubId) {
          console.warn("NextAuth signIn: missing github id on profile, allowing sign-in")
          return true
        }

        // Save to Sanity (existing logic)
        const existingUser = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: githubId })

        if (!existingUser) {
          // createIfNotExists with a stable _id to avoid duplicates/races
          await writeClient.createIfNotExists({
            _id: `github-${String(githubId)}`,
            _type: "author",
            id: String(githubId),
            name: u?.name || "",
            username: p?.login || "",
            email: u?.email || "",
            image: u?.image || "",
            bio: p?.bio || "",
          })
        }

        // Save to MongoDB
        try {
          await connectDB()

          const existingMongoUser = await User.findOne({ githubId: String(githubId) })

          if (existingMongoUser) {
            // Update last login time
            existingMongoUser.lastLogin = new Date()
            existingMongoUser.name = u?.name || existingMongoUser.name
            existingMongoUser.image = u?.image || existingMongoUser.image
            await existingMongoUser.save()
            console.log("Updated existing MongoDB user:", existingMongoUser.email)
          } else {
            // Create new user in MongoDB
            const newUser = await User.create({
              githubId: String(githubId),
              name: u?.name || "",
              email: u?.email || "",
              username: p?.login || "",
              image: u?.image || "",
              bio: p?.bio || "",
              lastLogin: new Date(),
            })
            console.log("Created new MongoDB user:", newUser.email)
          }
        } catch (mongoError) {
          console.error("MongoDB user save error:", mongoError)
          // Don't fail sign-in if MongoDB fails
        }

        return true
      } catch (err) {
        // Log the error but allow sign-in to proceed. This prevents accidental
        // denials when Sanity temporarily fails or an unexpected value appears.
        console.error("NextAuth signIn callback error:", err)
        return true
      }
    },

    // Attach the Sanity author _id (if any) to the JWT token for later use.
    async jwt({ token, account, profile }) {
      try {
        if (account && profile) {
          const p = profile as any
          const githubId = p?.id
          if (githubId) {
            const user = await client
              .withConfig({ useCdn: false })
              .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: githubId })

            ;(token as any).id = user?._id
          }
        }
      } catch (err) {
        console.error("NextAuth jwt callback error:", err)
      }

      return token
    },

    // Expose the author id on the session object
    async session({ session, token }) {
      try {
        const tid = (token as any).id

        if (tid) {
          return {
            ...session,
            id: tid,
          }
        }

        // Fallback: try to resolve the author by email in case the jwt
        // callback didn't set the id (some NextAuth flows may not include
        // account/profile after the initial sign-in). This prevents
        // missing `session.id` during server actions.
        const email = session?.user?.email

        if (email) {
          try {
            const author = await client
              .withConfig({ useCdn: false })
              .fetch(`*[_type == "author" && email == $email][0]{ _id }`, {
                email,
              })

            if (author?._id) {
              return {
                ...session,
                id: author._id,
              }
            }
          } catch (err) {
            console.error("NextAuth session fallback fetch error:", err)
          }
        }

        return { ...session }
      } catch (err) {
        console.error("NextAuth session callback error:", err)
        return { ...session }
      }
    },
  },
})

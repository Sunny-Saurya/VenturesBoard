import { defineField, defineType } from "sanity"

export const comment = defineType({
  name: "comment",
  title: "Comment",
  type: "document",
  fields: [
    defineField({
      name: "content",
      title: "Content",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: { type: "author" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startup",
      title: "Startup",
      type: "reference",
      to: { type: "startup" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "content",
      author: "author.name",
      startup: "startup.title",
    },
    prepare({ title, author, startup }) {
      return {
        title: title?.substring(0, 50) + (title?.length > 50 ? "..." : ""),
        subtitle: `by ${author} on ${startup}`,
      }
    },
  },
})

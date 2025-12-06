import { defineField, defineType } from "sanity"

export const reaction = defineType({
  name: "reaction",
  title: "Reaction",
  type: "document",
  fields: [
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Like", value: "like" },
          { title: "Dislike", value: "dislike" },
        ],
      },
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
  ],
  preview: {
    select: {
      type: "type",
      author: "author.name",
      startup: "startup.title",
    },
    prepare({ type, author, startup }) {
      return {
        title: `${type} by ${author}`,
        subtitle: startup,
      }
    },
  },
})

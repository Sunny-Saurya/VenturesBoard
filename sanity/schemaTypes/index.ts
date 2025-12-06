import { type SchemaTypeDefinition } from "sanity"

import { author } from "@/sanity/schemaTypes/author"
import { startup } from "@/sanity/schemaTypes/startup"
import { playlist } from "@/sanity/schemaTypes/playlist"
import { comment } from "@/sanity/schemaTypes/comment"
import { reaction } from "@/sanity/schemaTypes/reaction"

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [author, startup, playlist, comment, reaction],
}

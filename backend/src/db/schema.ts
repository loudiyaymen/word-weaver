import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const novels = pgTable("novels", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author"),
  description: text("description"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chapters = pgTable(
  "chapters",
  {
    id: serial("id").primaryKey(),
    novelId: integer("novel_id")
      .references(() => novels.id)
      .notNull(),
    chapterNumber: integer("chapter_number").notNull(),
    title: text("title"),
    contentRaw: text("content_raw").notNull(),
    contentTranslated: text("content_translated"),
    status: text("status").default("pending").notNull(),
    progress: integer("progress").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [unique("novel_chapter_unique_idx").on(t.novelId, t.chapterNumber)],
);

export const glossary = pgTable("glossary", {
  id: serial("id").primaryKey(),
  novelId: integer("novel_id")
    .references(() => novels.id)
    .notNull(),
  chineseTerm: text("chinese_term").notNull(),
  englishTerm: text("english_term").notNull(),
  category: text("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const novelsRelations = relations(novels, ({ many }) => ({
  chapters: many(chapters),
  glossaryTerms: many(glossary),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
  novel: one(novels, {
    fields: [chapters.novelId],
    references: [novels.id],
  }),
}));

export const glossaryRelations = relations(glossary, ({ one }) => ({
  novel: one(novels, {
    fields: [glossary.novelId],
    references: [novels.id],
  }),
}));

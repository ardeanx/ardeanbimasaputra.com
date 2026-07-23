import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  username: text("username").unique(),
  displayUsername: text("displayUsername"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  bio: text("bio"),
  banner: text("banner"),
  verified: boolean("verified").notNull().default(false),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const postType = pgEnum("post_type", ["VIDEO", "AUDIO", "POST", "RESOURCE"]);
export const postStatus = pgEnum("post_status", [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);
export const postVisibility = pgEnum("post_visibility", ["PUBLIC", "UNLISTED", "PRIVATE"]);
export const productKind = pgEnum("product_kind", [
  "DIGITAL",
  "SOURCE_CODE",
  "PHYSICAL",
  "SERVICE",
]);
export const productStatus = pgEnum("product_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const notificationType = pgEnum("notification_type", [
  "COMMENT",
  "REPLY",
  "FOLLOW",
  "APPROVED",
  "REJECTED",
  "NEW_CONTENT",
  "LIKE",
  "NEW_USER",
  "PURCHASE",
  "SYSTEM",
  "ANNOUNCEMENT",
]);

export const verificationStatus = pgEnum("verification_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const reportStatus = pgEnum("report_status", ["OPEN", "RESOLVED", "DISMISSED"]);
export const orderStatus = pgEnum("order_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
]);
export const playlistVisibility = pgEnum("playlist_visibility", ["PUBLIC", "PRIVATE"]);
export const couponType = pgEnum("coupon_type", ["PERCENT", "FIXED"]);

export const coupon = pgTable("coupon", {
  code: text("code").primaryKey(),
  type: couponType("type").notNull(),
  value: integer("value").notNull(),
  minAmount: integer("minAmount"),
  maxUses: integer("maxUses"),
  uses: integer("uses").notNull().default(0),
  expiresAt: timestamp("expiresAt"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const post = pgTable("post", {
  id: text("id").primaryKey(),
  type: postType("type").notNull().default("POST"),
  status: postStatus("status").notNull().default("DRAFT"),
  visibility: postVisibility("visibility").notNull().default("PUBLIC"),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  body: jsonb("body"),
  thumbnail: text("thumbnail"),
  mediaUrl: text("mediaUrl"),
  durationSec: integer("durationSec"),
  repoUrl: text("repoUrl"),
  readTime: integer("readTime"),
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
  ogImage: text("ogImage"),
  canonicalUrl: text("canonicalUrl"),
  noindex: boolean("noindex").notNull().default(false),
  viewCount: integer("viewCount").notNull().default(0),
  likeCount: integer("likeCount").notNull().default(0),
  authorId: text("authorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: integer("categoryId").references(() => category.id, {
    onDelete: "set null",
  }),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  ownerId: text("ownerId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  body: jsonb("body"),
  kind: productKind("kind").notNull().default("DIGITAL"),
  status: productStatus("status").notNull().default("DRAFT"),
  price: integer("price").notNull().default(0),
  thumbnail: text("thumbnail"),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  attributes: jsonb("attributes").$type<{ label: string; value: string }[]>().notNull().default([]),
  variants: jsonb("variants").$type<{ name: string; options: string[] }[]>().notNull().default([]),
  version: text("version"),
  license: text("license"),
  demoUrl: text("demoUrl"),
  repoUrl: text("repoUrl"),
  categoryId: integer("categoryId").references(() => category.id, {
    onDelete: "set null",
  }),
  stock: integer("stock"),
  postId: text("postId").references(() => post.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const mediaFile = pgTable("media_file", {
  id: text("id").primaryKey(),
  uploaderId: text("uploaderId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  key: text("key").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  postId: text("postId")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  authorId: text("authorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  parentId: text("parentId").references((): AnyPgColumn => comment.id, {
    onDelete: "cascade",
  }),
  body: text("body").notNull(),
  likeCount: integer("likeCount").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const commentLike = pgTable(
  "comment_like",
  {
    commentId: text("commentId")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.commentId, t.userId] })],
);

export const like = pgTable(
  "like",
  {
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: integer("value").notNull().default(1),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const follow = pgTable(
  "follow",
  {
    followerId: text("followerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("followingId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);

export const notification = pgTable("notification", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: notificationType("type").notNull(),
  actorId: text("actorId").references(() => user.id, { onDelete: "cascade" }),
  postId: text("postId").references(() => post.id, { onDelete: "cascade" }),
  commentId: text("commentId").references(() => comment.id, {
    onDelete: "cascade",
  }),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const verificationRequest = pgTable("verification_request", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: verificationStatus("status").notNull().default("PENDING"),
  message: text("message"),
  links: jsonb("links").$type<string[]>().notNull().default([]),
  reviewedBy: text("reviewedBy").references(() => user.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const report = pgTable("report", {
  id: text("id").primaryKey(),
  postId: text("postId")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  reporterId: text("reporterId").references(() => user.id, {
    onDelete: "set null",
  }),
  reason: text("reason").notNull(),
  detail: text("detail"),
  status: reportStatus("status").notNull().default("OPEN"),
  reviewedBy: text("reviewedBy").references(() => user.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const bookmark = pgTable(
  "bookmark",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })],
);

export const postView = pgTable(
  "post_view",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewedAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })],
);

export const resourceFile = pgTable(
  "resource_file",
  {
    id: text("id").primaryKey(),
    postId: text("postId").references(() => post.id, { onDelete: "cascade" }),
    productId: text("productId").references(() => product.id, {
      onDelete: "cascade",
    }),
    version: integer("version").notNull().default(1),
    filename: text("filename").notNull(),
    size: integer("size").notNull(),
    sha256: text("sha256").notNull(),
    storageKey: text("storageKey").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("resource_file_post_version_idx").on(t.postId, t.version),
    uniqueIndex("resource_file_product_version_idx").on(t.productId, t.version),
  ],
);

export const entitlement = pgTable(
  "entitlement",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("productId")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    source: text("source"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const order = pgTable("order", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: text("productId").references(() => product.id, {
    onDelete: "set null",
  }),
  postId: text("postId").references(() => post.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  discount: integer("discount").notNull().default(0),
  couponCode: text("couponCode").references(() => coupon.code, {
    onDelete: "set null",
  }),
  status: orderStatus("status").notNull().default("PENDING"),
  snapToken: text("snapToken"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  orderId: text("orderId")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  transactionStatus: text("transactionStatus"),
  paymentType: text("paymentType"),
  fraudStatus: text("fraudStatus"),
  grossAmount: text("grossAmount"),
  raw: jsonb("raw"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const viewEvent = pgTable("view_event", {
  id: serial("id").primaryKey(),
  postId: text("postId")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const playlist = pgTable("playlist", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  visibility: playlistVisibility("visibility").notNull().default("PUBLIC"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const playlistItem = pgTable(
  "playlist_item",
  {
    playlistId: text("playlistId")
      .notNull()
      .references(() => playlist.id, { onDelete: "cascade" }),
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    addedAt: timestamp("addedAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.playlistId, t.postId] })],
);

export const rating = pgTable(
  "rating",
  {
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const postTranslation = pgTable(
  "post_translation",
  {
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    body: jsonb("body"),
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
    auto: boolean("auto").notNull().default(true),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.locale] })],
);

export const pageStatus = pgEnum("page_status", ["DRAFT", "PUBLISHED"]);

export const page = pgTable("page", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: jsonb("body"),
  status: pageStatus("status").notNull().default("DRAFT"),
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
  ogImage: text("ogImage"),
  showInFooter: boolean("showInFooter").notNull().default(true),
  sortOrder: integer("sortOrder").notNull().default(0),
  authorId: text("authorId").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const notificationPref = pgTable("notification_pref", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  comments: boolean("comments").notNull().default(true),
  replies: boolean("replies").notNull().default(true),
  follows: boolean("follows").notNull().default(true),
  newContent: boolean("newContent").notNull().default(true),
});

export const pushSubscription = pgTable("push_subscription", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const searchHistory = pgTable(
  "search_history",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.query] })],
);

export const appSetting = pgTable("app_setting", {
  id: integer("id").primaryKey().default(1),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const threadTopic = pgTable("thread_topic", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  postCount: integer("postCount").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const threadPost = pgTable("thread_post", {
  id: text("id").primaryKey(),
  topicId: text("topicId").references(() => threadTopic.id, {
    onDelete: "set null",
  }),
  authorId: text("authorId").references(() => user.id, {
    onDelete: "set null",
  }),
  authorName: text("authorName").notNull(),
  anonId: text("anonId"),
  title: text("title").notNull(),
  body: text("body"),
  mediaUrls: jsonb("mediaUrls").$type<string[]>().notNull().default([]),
  audioUrl: text("audioUrl"),
  color: text("color"),
  location: text("location"),
  ghost: boolean("ghost").notNull().default(false),
  poll: jsonb("poll").$type<{ options: string[]; endsAt: string | null }>(),
  ogCard: jsonb("ogCard").$type<{
    url: string;
    title: string;
    description: string;
    image: string | null;
    siteName: string | null;
  }>(),
  score: integer("score").notNull().default(0),
  commentCount: integer("commentCount").notNull().default(0),
  removed: boolean("removed").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const threadPollVote = pgTable(
  "thread_poll_vote",
  {
    postId: text("postId")
      .notNull()
      .references(() => threadPost.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    optionIndex: integer("optionIndex").notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const threadComment = pgTable("thread_comment", {
  id: text("id").primaryKey(),
  postId: text("postId")
    .notNull()
    .references(() => threadPost.id, { onDelete: "cascade" }),
  parentId: text("parentId"),
  authorId: text("authorId").references(() => user.id, {
    onDelete: "set null",
  }),
  authorName: text("authorName").notNull(),
  anonId: text("anonId"),
  body: text("body").notNull(),
  score: integer("score").notNull().default(0),
  removed: boolean("removed").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const threadVote = pgTable(
  "thread_vote",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("targetType").notNull(),
    targetId: text("targetId").notNull(),
    value: integer("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetType, t.targetId] })],
);

export const qnaQuestion = pgTable("qna_question", {
  id: text("id").primaryKey(),
  authorId: text("authorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  ogCard: jsonb("ogCard").$type<{
    url: string;
    title: string;
    description: string;
    image: string | null;
    siteName: string | null;
  }>(),
  score: integer("score").notNull().default(0),
  answerCount: integer("answerCount").notNull().default(0),
  viewCount: integer("viewCount").notNull().default(0),
  acceptedAnswerId: text("acceptedAnswerId"),
  closed: boolean("closed").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const qnaAnswer = pgTable("qna_answer", {
  id: text("id").primaryKey(),
  questionId: text("questionId")
    .notNull()
    .references(() => qnaQuestion.id, { onDelete: "cascade" }),
  authorId: text("authorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  ogCard: jsonb("ogCard").$type<{
    url: string;
    title: string;
    description: string;
    image: string | null;
    siteName: string | null;
  }>(),
  score: integer("score").notNull().default(0),
  accepted: boolean("accepted").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const qnaComment = pgTable("qna_comment", {
  id: text("id").primaryKey(),
  targetType: text("targetType").notNull(),
  targetId: text("targetId").notNull(),
  authorId: text("authorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const qnaVote = pgTable(
  "qna_vote",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("targetType").notNull(),
    targetId: text("targetId").notNull(),
    value: integer("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetType, t.targetId] })],
);

export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, { fields: [post.authorId], references: [user.id] }),
  category: one(category, {
    fields: [post.categoryId],
    references: [category.id],
  }),
  comments: many(comment),
  likes: many(like),
  ratings: many(rating),
  translations: many(postTranslation),
}));

export const postTranslationRelations = relations(postTranslation, ({ one }) => ({
  post: one(post, { fields: [postTranslation.postId], references: [post.id] }),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  owner: one(user, { fields: [product.ownerId], references: [user.id] }),
  post: one(post, { fields: [product.postId], references: [post.id] }),
  category: one(category, {
    fields: [product.categoryId],
    references: [category.id],
  }),
  files: many(resourceFile),
}));

export const ratingRelations = relations(rating, ({ one }) => ({
  post: one(post, { fields: [rating.postId], references: [post.id] }),
  user: one(user, { fields: [rating.userId], references: [user.id] }),
}));

export const userRelations = relations(user, ({ many }) => ({
  posts: many(post),
  comments: many(comment),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  posts: many(post),
}));

export const commentRelations = relations(comment, ({ one, many }) => ({
  post: one(post, { fields: [comment.postId], references: [post.id] }),
  author: one(user, { fields: [comment.authorId], references: [user.id] }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "replies",
  }),
  replies: many(comment, { relationName: "replies" }),
  likes: many(commentLike),
}));

export const likeRelations = relations(like, ({ one }) => ({
  post: one(post, { fields: [like.postId], references: [post.id] }),
  user: one(user, { fields: [like.userId], references: [user.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  recipient: one(user, {
    fields: [notification.userId],
    references: [user.id],
    relationName: "recipient",
  }),
  actor: one(user, {
    fields: [notification.actorId],
    references: [user.id],
    relationName: "actor",
  }),
  post: one(post, { fields: [notification.postId], references: [post.id] }),
}));

export const resourceFileRelations = relations(resourceFile, ({ one }) => ({
  post: one(post, { fields: [resourceFile.postId], references: [post.id] }),
  product: one(product, {
    fields: [resourceFile.productId],
    references: [product.id],
  }),
}));

export const orderRelations = relations(order, ({ one }) => ({
  user: one(user, { fields: [order.userId], references: [user.id] }),
  post: one(post, { fields: [order.postId], references: [post.id] }),
  product: one(product, {
    fields: [order.productId],
    references: [product.id],
  }),
}));

export const playlistRelations = relations(playlist, ({ one, many }) => ({
  user: one(user, { fields: [playlist.userId], references: [user.id] }),
  items: many(playlistItem),
}));

export const playlistItemRelations = relations(playlistItem, ({ one }) => ({
  playlist: one(playlist, {
    fields: [playlistItem.playlistId],
    references: [playlist.id],
  }),
  post: one(post, { fields: [playlistItem.postId], references: [post.id] }),
}));

# Graph Report - ardean-cms  (2026-07-23)

## Corpus Check
- 341 files · ~142,170 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1618 nodes · 4864 edges · 88 communities (80 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f1968ff3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WatchView.tsx
- genId
- qna.ts
- dialog.tsx
- store.ts
- useT
- schema.ts
- Ardean CMS
- getFmt
- nodeviews.tsx
- actions.ts
- page.tsx
- push.ts
- i18n.ts
- translation-actions.ts
- resources.ts
- getT
- compilerOptions
- getSession
- session.ts
- route.ts
- layout.tsx
- icons.tsx
- SettingsSidebar.tsx
- post
- check-phase7.ts
- actions.ts
- Canvas.tsx
- skeletons.tsx
- AppearanceSection.tsx
- settings.ts
- Header.tsx
- threads.ts
- openAuthModal
- SeoSection.tsx
- EditorRoot.tsx
- community.ts
- Guide.tsx
- page.tsx
- IntegrationsSection.tsx
- StudioNav.tsx
- ThreadComposer.tsx
- actions.ts
- authModalStore.ts
- db.ts
- Ardean CMS — Blueprint
- page.tsx
- store-actions.ts
- actions.ts
- NotificationBell.tsx
- ThreadPostCard.tsx
- ThreadModeration.tsx
- DropzoneField.tsx
- VideoPlayer.tsx
- QuestionActions.tsx
- MenuSection.tsx
- seed-locales.ts
- seed.ts
- .prettierrc.json
- route.ts
- RichText.tsx
- CommentComposer.tsx
- gif-actions.ts
- ZoomImg.tsx
- Ardean CMS — Studio v2 (transformasi besar)
- page.tsx
- VastPlayer.tsx
- BookmarkButton.tsx
- migrate-v2.ts
- migrate-v3.ts
- migrate-v4.ts
- migrate-v5.ts
- migrate-v6.ts
- phantom-ui.d.ts
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `useT()` - 204 edges
2. `getT` - 170 edges
3. `getSession()` - 157 edges
4. `db` - 85 edges
5. `getSettings` - 69 edges
6. `genId()` - 46 edges
7. `getFmt()` - 42 edges
8. `useFmt()` - 33 edges
9. `post` - 33 edges
10. `user` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --calls--> `getT`  [EXTRACTED]
  app/(shell)/page.tsx → lib/i18n.ts
- `generateMetadata()` --calls--> `getT`  [EXTRACTED]
  app/(shell)/qna/page.tsx → lib/i18n.ts
- `generateMetadata()` --calls--> `getT`  [EXTRACTED]
  app/(shell)/results/page.tsx → lib/i18n.ts
- `generateMetadata()` --calls--> `getT`  [EXTRACTED]
  app/(shell)/store/page.tsx → lib/i18n.ts
- `generateMetadata()` --calls--> `getT`  [EXTRACTED]
  app/(shell)/threads/page.tsx → lib/i18n.ts

## Import Cycles
- None detected.

## Communities (88 total, 8 thin omitted)

### Community 0 - "WatchView.tsx"
Cohesion: 0.05
Nodes (60): GET(), Channel(), findPublishedPost(), generateMetadata(), TabKey, TABS, generateMetadata(), Results() (+52 more)

### Community 1 - "genId"
Cohesion: 0.06
Nodes (59): saveNotifPrefsAction(), NotificationsSettingsPage(), deletePostAction(), parseBody(), savePostAction(), SaveState, deleteProductAction(), revalidateProduk() (+51 more)

### Community 2 - "qna.ts"
Cohesion: 0.06
Nodes (45): acceptAnswerAction(), createAnswerAction(), createQnaCommentAction(), createQuestionAction(), Err, firstUrl(), ogCardFor(), Ok (+37 more)

### Community 3 - "dialog.tsx"
Cohesion: 0.06
Nodes (49): deletePlaylistAction(), moderateAction(), ActionResult, addCategoryAction(), deleteCategoryAction(), refresh(), renameCategoryAction(), requireAdminSession() (+41 more)

### Community 4 - "store.ts"
Cohesion: 0.08
Nodes (50): POST(), createPlaylistAction(), playlistsForPostAction(), togglePlaylistItemAction(), PlaylistPage(), createCouponAction(), deleteCouponAction(), toggleCouponAction() (+42 more)

### Community 5 - "useT"
Cohesion: 0.06
Nodes (32): toggleFollowAction(), CopyButton(), CodeBlock(), DocHeading, Dict, I18nContext, useFmt(), useT() (+24 more)

### Community 6 - "schema.ts"
Cohesion: 0.05
Nodes (42): sitemap(), StudioThreads(), body, main(), account, bookmark, categoryRelations, commentLike (+34 more)

### Community 7 - "Ardean CMS"
Cohesion: 0.05
Nodes (39): `app/`, Ardean CMS, Build for production, Commerce, Commerce and integrations, Community features, `components/`, Content and editing (+31 more)

### Community 8 - "getFmt"
Cohesion: 0.10
Nodes (25): Receipt(), STATUS_KEY, LABEL, Orders(), generateMetadata(), QnaList(), Sort, SORTS (+17 more)

### Community 9 - "nodeviews.tsx"
Cohesion: 0.10
Nodes (34): AccordionItemView(), AccordionView(), addChild(), btnOptions(), ButtonView(), CALLOUT_ICON, calloutOptions(), CalloutView() (+26 more)

### Community 10 - "actions.ts"
Cohesion: 0.10
Nodes (28): addCommentAction(), deleteCommentAction(), fetchNotificationsAction(), markNotificationsReadAction(), toggleCommentLikeAction(), toggleReactionAction(), CommentForm(), CommentItem() (+20 more)

### Community 11 - "page.tsx"
Cohesion: 0.09
Nodes (23): AccountSettingsPage(), joinDate, ROLE_KEY, RequestVerification(), StudioUsers(), VerificationPanel(), adminSession(), approveVerificationAction() (+15 more)

### Community 12 - "push.ts"
Cohesion: 0.11
Nodes (25): DELETE(), POST(), POST(), createReportAction(), resolveReportAction(), setViewCountAction(), ReportModal(), pushSubscription (+17 more)

### Community 13 - "i18n.ts"
Cohesion: 0.13
Nodes (23): manifest(), ShellLayout(), SOCIAL_LABELS, StudioLayout(), EditPost(), StudioLanguages(), CREATE_TYPES, NewPost() (+15 more)

### Community 14 - "translation-actions.ts"
Cohesion: 0.14
Nodes (26): autoTranslateAction(), deleteTranslationAction(), editTranslationAction(), guard(), listTranslationsAction(), PostRow, TranslationInfo, validLocale() (+18 more)

### Community 15 - "resources.ts"
Cohesion: 0.16
Nodes (22): POST(), listProductFilesAction(), deleteResourceFileAction(), importGithubAction(), listResourceFilesAction(), FileRow, ProductFiles(), F (+14 more)

### Community 16 - "getT"
Cohesion: 0.12
Nodes (23): AskPage(), generateMetadata(), generateMetadata(), Resources(), CategoriesPanel(), ContentPanel(), QnaPanel(), ReportsPanel() (+15 more)

### Community 17 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 18 - "getSession"
Cohesion: 0.13
Nodes (17): changePasswordAction(), Result, setLangAction(), signOutOtherSessionsAction(), updateProfileAction(), UserSettingsLayout(), PreferencesSettingsPage(), ProfileSettingsPage() (+9 more)

### Community 19 - "session.ts"
Cohesion: 0.14
Nodes (16): StudioMedia(), deletePageAction(), savePageAction(), EditPage(), NewPage(), StudioPages(), ProdukEdit(), PageData (+8 more)

### Community 20 - "route.ts"
Cohesion: 0.13
Nodes (20): ALLOWED, ALLOWED_VIDEO, POST(), sniffImageMime(), sniffMediaMime(), ActionResult, deleteMediaAction(), GIF (+12 more)

### Community 21 - "layout.tsx"
Cohesion: 0.14
Nodes (16): FONT_LINKS, FONT_STACKS, generateMetadata(), RootLayout(), viewport, GET(), robots(), esc() (+8 more)

### Community 22 - "icons.tsx"
Cohesion: 0.11
Nodes (14): CardMenu(), Row, BottomNav(), ITEMS, DownloadIcon(), HomeIcon(), MoreVertIcon(), P (+6 more)

### Community 23 - "SettingsSidebar.tsx"
Cohesion: 0.13
Nodes (14): useEditorCtx(), ContextMenu(), Section(), clip(), noopSubscribe(), SeoTab(), AlignRow(), BLOCK_KNOWN (+6 more)

### Community 24 - "post"
Cohesion: 0.14
Nodes (13): pingView(), Overview(), StudioDashboard(), AnalyticsPanel(), main(), follow, like, post (+5 more)

### Community 25 - "check-phase7.ts"
Cohesion: 0.21
Nodes (17): rateAction(), listSearchHistoryAction(), recordSearchAction(), removeSearchAction(), main(), rating, searchHistory, fmtViews() (+9 more)

### Community 26 - "actions.ts"
Cohesion: 0.19
Nodes (20): anonRateOk(), cleanColor(), cleanOg(), cleanPoll(), cleanUrl(), clientIp(), createThreadCommentAction(), createThreadPostAction() (+12 more)

### Community 27 - "Canvas.tsx"
Cohesion: 0.14
Nodes (14): Editor, BlockToolbar(), Canvas(), CLOSED, readSlash(), Slash, ImageDialogHost(), openImageDialog() (+6 more)

### Community 28 - "skeletons.tsx"
Cohesion: 0.12
Nodes (3): GridSkeleton(), TableSkeleton(), WatchSkeleton()

### Community 29 - "AppearanceSection.tsx"
Cohesion: 0.14
Nodes (15): Appearance, AppearanceSection, FONTS, ThemeCard(), GroupTitle(), Row(), SaveHandle, Security (+7 more)

### Community 30 - "settings.ts"
Cohesion: 0.22
Nodes (18): main(), signIn(), signUp(), appSetting, cacheSet(), deepMerge(), DEFAULT_SETTINGS, getPath() (+10 more)

### Community 31 - "Header.tsx"
Cohesion: 0.15
Nodes (12): setLangAction(), HistoryIcon(), Logo(), MenuIcon(), MicIcon(), PersonCircleIcon(), SearchIcon(), SearchCommand() (+4 more)

### Community 32 - "threads.ts"
Cohesion: 0.22
Nodes (16): generateMetadata(), TopicFeed(), generateMetadata(), ThreadPostDetail(), myPollVote(), attachPoll(), author(), getThreadPost() (+8 more)

### Community 33 - "openAuthModal"
Cohesion: 0.14
Nodes (14): openAuthModal(), ChipRow(), GuideContent(), GuideData, GuideDrawer(), MiniGuide(), Header(), AuthFlags (+6 more)

### Community 34 - "SeoSection.tsx"
Cohesion: 0.14
Nodes (12): Field(), TextField(), LOCAL_FIELDS, Seo, SeoSection, SOCIALS, SystemSection, SystemSettings (+4 more)

### Community 35 - "EditorRoot.tsx"
Cohesion: 0.15
Nodes (13): EditorContext, EditorCtx, EditorMeta, EditorUi, PostType, Visibility, EditorDefaults, EMPTY (+5 more)

### Community 36 - "community.ts"
Cohesion: 0.26
Nodes (15): GET(), base, main(), postView, bookmarkFeed(), CommentNode, historyFeed(), isBookmarked() (+7 more)

### Community 37 - "Guide.tsx"
Cohesion: 0.12
Nodes (6): ExploreSection(), MenuItem, CompassIcon(), ThumbUpIcon(), P, SOCIAL_ICONS

### Community 38 - "page.tsx"
Cohesion: 0.24
Nodes (12): generateMetadata(), Store(), generateMetadata(), ProductDetail(), ProductCard(), ProductCardData, KIND_LABEL_KEYS, entitlement (+4 more)

### Community 39 - "IntegrationsSection.tsx"
Cohesion: 0.17
Nodes (13): DialogButton(), MiniDialog(), NumberField(), SecretField(), TextArea(), Card, CARDS, Draft (+5 more)

### Community 40 - "StudioNav.tsx"
Cohesion: 0.14
Nodes (13): CommunityIcon(), ContentIcon(), DashboardIcon(), EarnIcon(), FeedbackIcon(), SettingsIcon(), BOTTOM, isActive() (+5 more)

### Community 41 - "ThreadComposer.tsx"
Cohesion: 0.25
Nodes (10): decode(), fetchOgCardAction(), isPrivateHost(), pickMeta(), OgCardData, extractFirstUrl(), appendEmoji(), Panel (+2 more)

### Community 42 - "actions.ts"
Cohesion: 0.21
Nodes (12): adminSession(), Result, revokeAllSessionsAction(), saveSettingsAction(), session, Auth, buildAuth(), globalForAuth (+4 more)

### Community 43 - "authModalStore.ts"
Cohesion: 0.27
Nodes (10): AuthModal(), AuthMode, closeAuthModal(), emit(), getAuthModalServerState(), getAuthModalState(), listeners, setAuthMode() (+2 more)

### Community 44 - "db.ts"
Cohesion: 0.26
Nodes (7): Home(), metadata, voteThreadPollAction(), threadPollVote, db, globalForDb, pollCounts()

### Community 45 - "Ardean CMS — Blueprint"
Cohesion: 0.15
Nodes (12): 10. Backlog — Ronde Diskusi 2, 11. Catatan Environment, 1. Visi & Prinsip, 2. Keputusan Terkunci (ronde 1 + revisi — 2026-07-20), 3. Pemetaan UX YouTube → Ardean CMS, 4. Tech Stack, 5. DNA Desain (angka awal — final diukur live dari youtube.com), 6. Struktur Route (+4 more)

### Community 46 - "page.tsx"
Cohesion: 0.23
Nodes (9): Feed(), FeedCfg, FEEDS, metadata, CardData, ComingSoon(), EmptyState(), isLinkAction() (+1 more)

### Community 47 - "store-actions.ts"
Cohesion: 0.27
Nodes (8): checkOrderStatusAction(), createBankTransferOrderAction(), createOrderAction(), validateCouponAction(), Snap, Window, OrderStatusRefresh(), checkOrderStatus()

### Community 48 - "actions.ts"
Cohesion: 0.41
Nodes (9): ActionResult, addLocaleAction(), autoTranslateAction(), cleanEntries(), normalizeCode(), requireAdminSession(), saveLocaleAction(), upsertTranslationRows() (+1 more)

### Community 49 - "NotificationBell.tsx"
Cohesion: 0.26
Nodes (11): BellIcon(), CATEGORY, hrefOf(), Item, LABEL_KEY, metaStr(), NotificationBell(), subjectOf() (+3 more)

### Community 50 - "ThreadPostCard.tsx"
Cohesion: 0.26
Nodes (9): childrenOf(), CommentNode(), ThreadCommentTree(), T, ThreadPostCard(), topicColor(), VoteButtons(), ThreadCommentRow (+1 more)

### Community 51 - "ThreadModeration.tsx"
Cohesion: 0.31
Nodes (9): createTopicAction(), moderateThreadAction(), requireAdmin(), Result, Post, slugify(), ThreadModeration(), createThreadTopic() (+1 more)

### Community 52 - "DropzoneField.tsx"
Cohesion: 0.20
Nodes (6): DropzoneField(), Box, getBox(), ImageCropModal(), Props, ImageOverlayPicker()

### Community 53 - "VideoPlayer.tsx"
Cohesion: 0.20
Nodes (6): move(), fmtTime(), Props, SLEEP, SPEEDS, VideoPlayer()

### Community 54 - "QuestionActions.tsx"
Cohesion: 0.31
Nodes (8): listeners, readSaved(), SaveButton(), ShareButton(), subscribe(), writeSaved(), BookmarkIcon(), ShareIcon()

### Community 55 - "MenuSection.tsx"
Cohesion: 0.22
Nodes (7): Toggle(), Item, ItemEditor(), Menu, MenuSection, Section, SECTIONS

### Community 56 - "seed-locales.ts"
Cohesion: 0.31
Nodes (8): language, translation, Dict, LOCALE_NAMES, main(), readDict(), seedLanguage(), seedTranslations()

### Community 57 - "seed.ts"
Cohesion: 0.31
Nodes (8): body(), CATEGORIES, main(), seedSlug(), TITLES, TYPES, USERS, videoId()

### Community 58 - ".prettierrc.json"
Cohesion: 0.22
Nodes (8): arrowParens, bracketSpacing, printWidth, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 59 - "route.ts"
Cohesion: 0.39
Nodes (6): clientIp(), handler, POST(), verifyTurnstile(), cacheGet(), globalForRedis

### Community 60 - "RichText.tsx"
Cohesion: 0.43
Nodes (7): Mark, Node, renderMarks(), renderNode(), renderNodes(), RichText(), safeHref()

### Community 61 - "CommentComposer.tsx"
Cohesion: 0.38
Nodes (5): Turnstile(), TurnstileApi, turnstileToken(), Window, CommentComposer()

### Community 62 - "gif-actions.ts"
Cohesion: 0.43
Nodes (5): Gif, GiphyImage, GiphyItem, searchGifsAction(), GifPicker()

### Community 63 - "ZoomImg.tsx"
Cohesion: 0.38
Nodes (5): ImageZoomHost(), openZoom(), Zoom, ZoomImg(), ProductGallery()

### Community 64 - "Ardean CMS — Studio v2 (transformasi besar)"
Cohesion: 0.29
Nodes (6): Ardean CMS — Studio v2 (transformasi besar), Aturan tetap: NOL komentar di kode. Token bg-yt-_/text-yt-_ (aksen biru). Server Actions "use server"., Catatan, Fase eksekusi, Keputusan terkunci, Schema delta

### Community 65 - "page.tsx"
Cohesion: 0.40
Nodes (5): generateMetadata(), Sort, SORTS, ThreadsFeed(), listTopics()

### Community 66 - "VastPlayer.tsx"
Cohesion: 0.50
Nodes (4): parseVast(), Props, VastAd, VastPlayer()

### Community 67 - "BookmarkButton.tsx"
Cohesion: 0.67
Nodes (3): toggleBookmarkAction(), ClockIcon(), BookmarkButton()

### Community 70 - "migrate-v4.ts"
Cohesion: 0.67
Nodes (3): main(), Old, sql

### Community 73 - "phantom-ui.d.ts"
Cohesion: 0.50
Nodes (3): IntrinsicElements, JSX, react/jsx-runtime

## Knowledge Gaps
- **347 isolated node(s):** `semi`, `singleQuote`, `trailingComma`, `printWidth`, `tabWidth` (+342 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useT()` connect `useT` to `WatchView.tsx`, `genId`, `qna.ts`, `dialog.tsx`, `store.ts`, `nodeviews.tsx`, `actions.ts`, `page.tsx`, `push.ts`, `translation-actions.ts`, `resources.ts`, `getSession`, `icons.tsx`, `SettingsSidebar.tsx`, `Canvas.tsx`, `AppearanceSection.tsx`, `Header.tsx`, `openAuthModal`, `SeoSection.tsx`, `EditorRoot.tsx`, `Guide.tsx`, `IntegrationsSection.tsx`, `StudioNav.tsx`, `ThreadComposer.tsx`, `authModalStore.ts`, `store-actions.ts`, `NotificationBell.tsx`, `ThreadPostCard.tsx`, `ThreadModeration.tsx`, `DropzoneField.tsx`, `VideoPlayer.tsx`, `QuestionActions.tsx`, `MenuSection.tsx`, `CommentComposer.tsx`, `gif-actions.ts`, `ZoomImg.tsx`, `VastPlayer.tsx`, `BookmarkButton.tsx`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `getT` connect `getT` to `WatchView.tsx`, `genId`, `qna.ts`, `dialog.tsx`, `store.ts`, `useT`, `schema.ts`, `getFmt`, `actions.ts`, `page.tsx`, `push.ts`, `i18n.ts`, `translation-actions.ts`, `resources.ts`, `getSession`, `session.ts`, `route.ts`, `post`, `check-phase7.ts`, `threads.ts`, `page.tsx`, `db.ts`, `page.tsx`, `store-actions.ts`, `route.ts`, `page.tsx`, `BookmarkButton.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `getSession()` connect `getSession` to `WatchView.tsx`, `genId`, `qna.ts`, `dialog.tsx`, `store.ts`, `useT`, `schema.ts`, `getFmt`, `actions.ts`, `page.tsx`, `push.ts`, `i18n.ts`, `translation-actions.ts`, `resources.ts`, `getT`, `session.ts`, `route.ts`, `post`, `check-phase7.ts`, `actions.ts`, `threads.ts`, `community.ts`, `page.tsx`, `actions.ts`, `db.ts`, `page.tsx`, `store-actions.ts`, `actions.ts`, `ThreadModeration.tsx`, `page.tsx`, `BookmarkButton.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `semi`, `singleQuote`, `trailingComma` to the rest of the system?**
  _347 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WatchView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05418227215980025 - nodes in this community are weakly interconnected._
- **Should `genId` be split into smaller, more focused modules?**
  _Cohesion score 0.06219918548685672 - nodes in this community are weakly interconnected._
- **Should `qna.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06151062867480778 - nodes in this community are weakly interconnected._
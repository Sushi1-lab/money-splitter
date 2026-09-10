import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Filter,
  LayoutGrid,
  LoaderCircle,
  MessageSquareText,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import {
  db,
} from "../firebase.js";

const normalizeSource = (
  item
) => {
  const raw =
    String(
      item?.appSource ||
        item?.source ||
        item?.appName ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    raw.includes(
      "personal"
    ) ||
    raw.includes(
      "budget"
    )
  ) {
    return "Personal Finance";
  }

  return "Splitter";
};

const feedbackDate = (
  value
) => {
  if (!value) {
    return null;
  }

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value.toDate();
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;
};

const formatDate = (
  value
) => {
  const date =
    feedbackDate(value);

  if (!date) {
    return "Date unavailable";
  }

  return date.toLocaleString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
};

const averageOf = (
  rows
) => {
  if (!rows.length) {
    return 0;
  }

  return (
    rows.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.rating ||
            0
        ),
      0
    ) /
    rows.length
  );
};

function FeedbackCenter({
  user,
  profile,
  isSuperAdmin,
  onBack,
}) {
  const [
    feedback,
    setFeedback,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sourceFilter,
    setSourceFilter,
  ] = useState("all");

  const [
    ratingFilter,
    setRatingFilter,
  ] = useState("all");

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const loadFeedback =
    async () => {
      if (
        !isSuperAdmin
      ) {
        setFeedback([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let snapshot;

        try {
          snapshot =
            await getDocs(
              query(
                collection(
                  db,
                  "feedback"
                ),
                orderBy(
                  "createdAt",
                  "desc"
                )
              )
            );
        } catch (
          orderError
        ) {
          console.warn(
            "Feedback ordering fallback:",
            orderError
          );

          snapshot =
            await getDocs(
              collection(
                db,
                "feedback"
              )
            );
        }

        const rows =
          snapshot.docs
            .map(
              (item) => ({
                id:
                  item.id,
                ...item.data(),
              })
            )
            .sort(
              (
                a,
                b
              ) => {
                const aDate =
                  feedbackDate(
                    a.createdAt
                  );

                const bDate =
                  feedbackDate(
                    b.createdAt
                  );

                return (
                  (bDate?.getTime() ||
                    0) -
                  (aDate?.getTime() ||
                    0)
                );
              }
            );

        setFeedback(
          rows
        );
      } catch (err) {
        console.error(
          "Feedback Center loading error:",
          err
        );

        setFeedback([]);
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    loadFeedback();
  }, [
    isSuperAdmin,
  ]);

  const enrichedFeedback =
    useMemo(
      () =>
        feedback.map(
          (item) => ({
            ...item,
            normalizedSource:
              normalizeSource(
                item
              ),
          })
        ),
      [
        feedback,
      ]
    );

  const splitterRows =
    useMemo(
      () =>
        enrichedFeedback.filter(
          (item) =>
            item.normalizedSource ===
            "Splitter"
        ),
      [
        enrichedFeedback,
      ]
    );

  const personalRows =
    useMemo(
      () =>
        enrichedFeedback.filter(
          (item) =>
            item.normalizedSource ===
            "Personal Finance"
        ),
      [
        enrichedFeedback,
      ]
    );

  const overallAverage =
    useMemo(
      () =>
        averageOf(
          enrichedFeedback
        ),
      [
        enrichedFeedback,
      ]
    );

  const splitterAverage =
    useMemo(
      () =>
        averageOf(
          splitterRows
        ),
      [
        splitterRows,
      ]
    );

  const personalAverage =
    useMemo(
      () =>
        averageOf(
          personalRows
        ),
      [
        personalRows,
      ]
    );

  const fiveStarCount =
    useMemo(
      () =>
        enrichedFeedback.filter(
          (item) =>
            Number(
              item.rating ||
                0
            ) === 5
        ).length,
      [
        enrichedFeedback,
      ]
    );

  const fiveStarPercent =
    enrichedFeedback.length
      ? Math.round(
          (
            fiveStarCount /
            enrichedFeedback.length
          ) *
            100
        )
      : 0;

  const thisMonthCount =
    useMemo(
      () => {
        const now =
          new Date();

        return enrichedFeedback.filter(
          (item) => {
            const date =
              feedbackDate(
                item.createdAt
              );

            return (
              date &&
              date.getFullYear() ===
                now.getFullYear() &&
              date.getMonth() ===
                now.getMonth()
            );
          }
        ).length;
      },
      [
        enrichedFeedback,
      ]
    );

  const filteredFeedback =
    useMemo(
      () => {
        const keyword =
          searchText
            .trim()
            .toLowerCase();

        return enrichedFeedback.filter(
          (item) => {
            if (
              sourceFilter !==
                "all" &&
              item.normalizedSource !==
                sourceFilter
            ) {
              return false;
            }

            if (
              ratingFilter !==
                "all" &&
              Number(
                item.rating ||
                  0
              ) !==
                Number(
                  ratingFilter
                )
            ) {
              return false;
            }

            if (!keyword) {
              return true;
            }

            const haystack =
              [
                item.message,
                item.userEmail,
                item.username,
                item.serverName,
                item.normalizedSource,
              ]
                .filter(
                  Boolean
                )
                .join(" ")
                .toLowerCase();

            return haystack.includes(
              keyword
            );
          }
        );
      },
      [
        enrichedFeedback,
        sourceFilter,
        ratingFilter,
        searchText,
      ]
    );

  const insightCards =
    [
      {
        label:
          "Total Feedback",
        value:
          enrichedFeedback.length,
        detail:
          `${thisMonthCount} submitted this month`,
        icon:
          MessageSquareText,
      },
      {
        label:
          "Average Rating",
        value:
          enrichedFeedback.length
            ? `${overallAverage.toFixed(
                1
              )} / 5`
            : "—",
        detail:
          `${fiveStarPercent}% are 5-star ratings`,
        icon:
          Star,
      },
      {
        label:
          "Splitter",
        value:
          splitterRows.length
            ? `${splitterAverage.toFixed(
                1
              )} / 5`
            : "—",
        detail:
          `${splitterRows.length} feedback submission${
            splitterRows.length ===
            1
              ? ""
              : "s"
          }`,
        icon:
          UsersRound,
      },
      {
        label:
          "Personal Finance",
        value:
          personalRows.length
            ? `${personalAverage.toFixed(
                1
              )} / 5`
            : "—",
        detail:
          `${personalRows.length} feedback submission${
            personalRows.length ===
            1
              ? ""
              : "s"
          }`,
        icon:
          TrendingUp,
      },
    ];

  if (
    !isSuperAdmin
  ) {
    return (
      <main className="min-h-[100dvh] bg-[#eaf0fa] px-4 py-8">
        <div className="mx-auto max-w-xl rounded-[26px] bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-black text-[#182442]">
            Feedback Center
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#71809a]">
            This area is available only to the super admin.
          </p>

          <button
            type="button"
            onClick={
              onBack
            }
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-5 text-sm font-extrabold text-white"
          >
            <ArrowLeft
              size={17}
            />
            Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#eaf0fa] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={
                onBack
              }
              className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-extrabold text-[#52617d] shadow-sm transition hover:bg-[#f7f9fd]"
            >
              <ArrowLeft
                size={16}
              />
              Back
            </button>

            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#71809a]">
              Super Admin
            </p>

            <h1 className="mt-1 text-3xl font-black text-[#182442] sm:text-4xl">
              Feedback Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71809a]">
              Review ratings from Splitter and Personal Finance, compare satisfaction, and identify where users need improvements.
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadFeedback
            }
            disabled={
              loading
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-5 text-sm font-extrabold text-white transition hover:bg-[#10245f] disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Sparkles
                size={17}
              />
            )}

            Refresh
          </button>
        </header>

        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#10245f] via-[#1b378e] to-[#3d63d2] p-6 text-white shadow-[0_22px_60px_rgba(20,42,118,0.18)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full border-[32px] border-white/5" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-extrabold">
                <BarChart3
                  size={14}
                />
                Product Experience
              </div>

              <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight sm:text-4xl">
                Understand what users think about your apps.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80">
                Ratings are grouped by source so you can immediately see whether feedback came from Splitter or Personal Finance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/65">
                  Overall
                </p>
                <p className="mt-2 text-3xl font-black">
                  {enrichedFeedback.length
                    ? overallAverage.toFixed(
                        1
                      )
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-blue-100/65">
                  average rating
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/65">
                  5-Star Share
                </p>
                <p className="mt-2 text-3xl font-black">
                  {fiveStarPercent}%
                </p>
                <p className="mt-1 text-xs text-blue-100/65">
                  top ratings
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {insightCards.map(
            (card) => {
              const Icon =
                card.icon;

              return (
                <article
                  key={
                    card.label
                  }
                  className="rounded-[22px] border border-white bg-white p-5 shadow-[0_12px_35px_rgba(31,53,108,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
                      <Icon
                        size={21}
                      />
                    </div>

                    <span className="rounded-full bg-[#f4f7fc] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#8995aa]">
                      Insight
                    </span>
                  </div>

                  <p className="mt-5 text-xs font-bold text-[#8995aa]">
                    {card.label}
                  </p>

                  <p className="mt-1 text-2xl font-black text-[#182442]">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                    {card.detail}
                  </p>
                </article>
              );
            }
          )}
        </section>

        <section className="mt-5 rounded-[26px] border border-white bg-white shadow-[0_14px_40px_rgba(31,53,108,0.08)]">
          <div className="border-b border-[#e5eaf2] p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <LayoutGrid
                    size={18}
                    className="text-[#294aad]"
                  />

                  <h2 className="text-lg font-black text-[#182442]">
                    Feedback Submissions
                  </h2>
                </div>

                <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                  Showing {filteredFeedback.length} of {enrichedFeedback.length} submissions.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[680px]">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8995aa]"
                  />

                  <input
                    type="search"
                    value={
                      searchText
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchText(
                        event.target.value
                      )
                    }
                    placeholder="Search feedback..."
                    className="min-h-11 w-full rounded-xl border border-[#dce3ef] bg-[#f8faff] pl-10 pr-3 text-sm text-[#182442] outline-none transition focus:border-[#294aad] focus:ring-4 focus:ring-[#294aad]/10"
                  />
                </div>

                <div className="relative">
                  <Filter
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8995aa]"
                  />

                  <select
                    value={
                      sourceFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setSourceFilter(
                        event.target.value
                      )
                    }
                    className="min-h-11 w-full appearance-none rounded-xl border border-[#dce3ef] bg-[#f8faff] pl-10 pr-10 text-sm font-bold text-[#52617d] outline-none transition focus:border-[#294aad] focus:ring-4 focus:ring-[#294aad]/10"
                  >
                    <option value="all">
                      All Sources
                    </option>
                    <option value="Splitter">
                      Splitter
                    </option>
                    <option value="Personal Finance">
                      Personal Finance
                    </option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8995aa]"
                  />
                </div>

                <div className="relative">
                  <Star
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8995aa]"
                  />

                  <select
                    value={
                      ratingFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setRatingFilter(
                        event.target.value
                      )
                    }
                    className="min-h-11 w-full appearance-none rounded-xl border border-[#dce3ef] bg-[#f8faff] pl-10 pr-10 text-sm font-bold text-[#52617d] outline-none transition focus:border-[#294aad] focus:ring-4 focus:ring-[#294aad]/10"
                  >
                    <option value="all">
                      All Ratings
                    </option>
                    {[5, 4, 3, 2, 1].map(
                      (star) => (
                        <option
                          key={
                            star
                          }
                          value={
                            star
                          }
                        >
                          {star} Star{star === 1 ? "" : "s"}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8995aa]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <LoaderCircle
                    size={28}
                    className="mx-auto animate-spin text-[#294aad]"
                  />

                  <p className="mt-3 text-sm font-bold text-[#71809a]">
                    Loading feedback...
                  </p>
                </div>
              </div>
            ) : filteredFeedback.length ===
              0 ? (
              <div className="flex min-h-64 items-center justify-center rounded-2xl bg-[#f8faff] p-6 text-center">
                <div>
                  <MessageSquareText
                    size={30}
                    className="mx-auto text-[#9aa6ba]"
                  />

                  <h3 className="mt-3 font-black text-[#182442]">
                    No feedback found
                  </h3>

                  <p className="mt-1 text-sm text-[#8995aa]">
                    Try changing your filters or wait for new submissions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {filteredFeedback.map(
                  (item) => {
                    const source =
                      item.normalizedSource;

                    const rating =
                      Math.max(
                        0,
                        Math.min(
                          5,
                          Number(
                            item.rating ||
                              0
                          )
                        )
                      );

                    return (
                      <article
                        key={
                          item.id
                        }
                        className="rounded-[20px] border border-[#e2e7f0] bg-[#fbfcff] p-4 transition hover:border-[#ccd7ec] hover:bg-white sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                                  source ===
                                  "Personal Finance"
                                    ? "bg-[#e8f7ef] text-[#18845c]"
                                    : "bg-[#eef3ff] text-[#294aad]"
                                }`}
                              >
                                {source}
                              </span>

                              {item.serverName && (
                                <span className="rounded-full bg-[#f1f4f9] px-2.5 py-1 text-[10px] font-extrabold text-[#71809a]">
                                  {item.serverName}
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex gap-1">
                              {[1, 2, 3, 4, 5].map(
                                (
                                  star
                                ) => (
                                  <Star
                                    key={
                                      star
                                    }
                                    size={17}
                                    className={
                                      star <=
                                      rating
                                        ? "text-[#e2a51e]"
                                        : "text-[#d7dde8]"
                                    }
                                    fill={
                                      star <=
                                      rating
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                )
                              )}
                            </div>
                          </div>

                          <p className="shrink-0 text-xs text-[#9aa6ba]">
                            {formatDate(
                              item.createdAt
                            )}
                          </p>
                        </div>

                        <p className="mt-4 min-h-10 whitespace-pre-line text-sm leading-6 text-[#52617d]">
                          {item.message?.trim()
                            ? item.message
                            : "No written feedback was provided."}
                        </p>

                        <div className="mt-4 border-t border-[#e6eaf1] pt-4">
                          <p className="truncate text-xs font-extrabold text-[#182442]">
                            {item.username
                              ? `@${item.username}`
                              : item.userEmail ||
                                "Anonymous user"}
                          </p>

                          {item.username &&
                            item.userEmail && (
                              <p className="mt-0.5 truncate text-[11px] text-[#8995aa]">
                                {item.userEmail}
                              </p>
                            )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-[11px] text-[#9aa6ba]">
          Signed in as {profile?.displayName || user?.displayName || user?.email || "Super Admin"}
        </p>
      </div>
    </main>
  );
}

export default FeedbackCenter;

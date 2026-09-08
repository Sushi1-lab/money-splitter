import {
  ReceiptText,
  Tags,
  UsersRound,
} from "lucide-react";

function Dashboard({
  profile,
  activeServer,
  savedSplits = [],
}) {
  const totalExpenses =
    savedSplits.reduce(
      (
        total,
        split
      ) =>
        total +
        (Number(
          split.totalAmount
        ) || 0),
      0
    );

  const categories = {};

  savedSplits.forEach(
    (split) => {
      const category =
        split.category ||
        "Other";

      categories[
        category
      ] =
        (categories[
          category
        ] || 0) +
        Number(
          split.totalAmount ||
            0
        );
    }
  );

  const topCategory =
    Object.entries(
      categories
    ).sort(
      (a, b) =>
        b[1] - a[1]
    )[0];

  const recent =
    savedSplits.slice(
      0,
      5
    );

  return (
    <div className="w-full min-w-0">

      <section className="app-card-blue p-5 sm:p-7">

        <p className="text-sm font-medium text-blue-100/75">
          Good to see you,
        </p>

        <h1 className="mt-1 break-words text-2xl font-extrabold sm:text-3xl">
          {profile?.displayName ||
            "User"}!
        </h1>

        <p className="mt-2 text-sm text-blue-100/70">
          Overview of{" "}
          <span className="font-bold text-white">
            {activeServer.name}
          </span>
        </p>

        <div className="mt-6">

          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/60">
            Total Expenses
          </p>

          <p className="mt-1 text-4xl font-extrabold tracking-tight">
            ₱
            {totalExpenses.toLocaleString(
              "en-PH",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </p>

        </div>

      </section>

      <div className="mt-4 grid grid-cols-3 gap-3">

        <div className="app-card p-4">

          <ReceiptText
            size={21}
            className="text-[#294aad]"
          />

          <p className="mt-3 text-xl font-extrabold">
            {
              savedSplits.length
            }
          </p>

          <p className="text-xs text-[#8995aa]">
            Expenses
          </p>

        </div>

        <div className="app-card p-4">

          <UsersRound
            size={21}
            className="text-[#294aad]"
          />

          <p className="mt-3 text-xl font-extrabold">
            {activeServer
              .members
              ?.length || 0}
          </p>

          <p className="text-xs text-[#8995aa]">
            Members
          </p>

        </div>

        <div className="app-card min-w-0 p-4">

          <Tags
            size={21}
            className="text-[#294aad]"
          />

          <p className="mt-3 truncate font-extrabold">
            {topCategory
              ? topCategory[0]
              : "—"}
          </p>

          <p className="text-xs text-[#8995aa]">
            Top Category
          </p>

        </div>

      </div>

      <section className="app-card mt-5 p-4 sm:p-6">

        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#3d63d2]">
          Activity
        </p>

        <h2 className="mt-1 text-xl font-extrabold">
          Recent Expenses
        </h2>

        {recent.length ===
        0 ? (
          <div className="mt-5 rounded-2xl bg-[#eaf0fa] p-8 text-center">

            <ReceiptText
              size={30}
              className="mx-auto text-[#9da9bb]"
            />

            <p className="mt-3 text-sm text-[#8995aa]">
              No expenses yet.
            </p>

          </div>
        ) : (
          <div className="mt-5 divide-y divide-[#e2e7ef]">

            {recent.map(
              (split) => (
                <div
                  key={
                    split.id
                  }
                  className="flex min-w-0 items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="app-icon-box">
                      <ReceiptText
                        size={19}
                      />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate font-extrabold">
                        {split.description ||
                          "Expense"}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#8995aa]">
                        {split.payer?.name ||
  split.payer?.displayName ||
  split.addedBy ||
  "Unknown"}{" "}
                        •{" "}
                        {split.category ||
                          "Other"}
                      </p>

                    </div>

                  </div>

                  <p className="shrink-0 font-extrabold text-[#142a76]">
                    ₱
                    {Number(
                      split.totalAmount ||
                        0
                    ).toLocaleString(
                      "en-PH",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </p>

                </div>
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
}

export default Dashboard;
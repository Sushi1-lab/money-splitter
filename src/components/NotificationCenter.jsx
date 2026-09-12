import {
  Bell,
  CheckCheck,
  Eye,
  ReceiptText,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase.js";

const money = (value) =>
  Number(value || 0).toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

const isReversionNotification =
  (item) =>
    [
      "payment_reverted",
      "balance_reduction_reverted",
    ].includes(
      item?.type
    );

const isBalanceReductionRevert =
  (item) =>
    item?.type ===
    "balance_reduction_reverted";

const isSplitAddedNotification =
  (item) =>
    item?.type ===
    "split_added";

const formatTime = (value) => {
  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value
        ? new Date(value)
        : null;

  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Just now";
  }

  return date.toLocaleString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
};

function NotificationCenter({
  user,
  activeServer,
}) {
  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    selected,
    setSelected,
  ] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return undefined;
    }

    const notificationsRef =
      collection(
        db,
        "users",
        user.uid,
        "notifications"
      );

    const unsubscribe =
      onSnapshot(
        notificationsRef,
        (snapshot) => {
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
                  const toMillis =
                    (value) => {
                      if (
                        typeof value?.toMillis ===
                        "function"
                      ) {
                        return value.toMillis();
                      }

                      if (
                        value?.seconds
                      ) {
                        return (
                          value.seconds *
                          1000
                        );
                      }

                      const parsed =
                        new Date(
                          value || 0
                        );

                      return Number.isNaN(
                        parsed.getTime()
                      )
                        ? 0
                        : parsed.getTime();
                    };

                  return (
                    toMillis(
                      b.createdAt
                    ) -
                    toMillis(
                      a.createdAt
                    )
                  );
                }
              );

          setNotifications(
            rows
          );
        },
        (err) => {
          console.error(
            "Notification listener error:",
            err
          );

          setNotifications(
            []
          );
        }
      );

    return unsubscribe;
  }, [
    user?.uid,
  ]);

  const visibleNotifications =
    useMemo(
      () =>
        notifications.filter(
          (item) =>
            !activeServer?.id ||
            !item.serverId ||
            item.serverId ===
              activeServer.id
        ),
      [
        notifications,
        activeServer?.id,
      ]
    );

  const unreadCount =
    visibleNotifications.filter(
      (item) =>
        !item.read
    ).length;

  const markRead =
    async (item) => {
      if (
        !item?.id ||
        item.read ||
        !user?.uid
      ) {
        return;
      }

      try {
        await updateDoc(
          doc(
            db,
            "users",
            user.uid,
            "notifications",
            item.id
          ),
          {
            read:
              true,
          }
        );
      } catch (err) {
        console.error(
          "Mark notification read error:",
          err
        );
      }
    };

  const openTransaction =
    async (item) => {
      await markRead(
        item
      );

      setSelected(
        item
      );

      setOpen(
        false
      );
    };

  const markAllRead =
    async () => {
      const unread =
        visibleNotifications.filter(
          (item) =>
            !item.read
        );

      await Promise.all(
        unread.map(
          (item) =>
            updateDoc(
              doc(
                db,
                "users",
                user.uid,
                "notifications",
                item.id
              ),
              {
                read:
                  true,
              }
            )
        )
      );
    };

  return (
    <>
      <button
        type="button"
        title="Notifications"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="fixed right-4 top-4 z-[70] flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-[#142a76] text-white shadow-[0_10px_30px_rgba(20,42,118,0.22)] lg:right-6 lg:top-6"
      >
        <Bell
          size={19}
        />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e64a4a] px-1 text-[10px] font-black text-white">
            {unreadCount >
            9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() =>
              setOpen(
                false
              )
            }
            className="fixed inset-0 z-[71] bg-transparent"
          />

          <div className="fixed right-3 top-16 z-[72] w-[calc(100%-24px)] max-w-sm overflow-hidden rounded-[24px] border border-[#e0e6f0] bg-white shadow-[0_24px_70px_rgba(15,35,89,0.22)] sm:right-4 lg:right-6 lg:top-20">
            <div className="flex items-center justify-between gap-3 border-b border-[#e7ebf2] p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Notifications
                </p>
                <h3 className="mt-1 font-black text-[#182442]">
                  Payment activity
                </h3>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={
                    markAllRead
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef3ff] px-2.5 py-2 text-[11px] font-extrabold text-[#294aad]"
                >
                  <CheckCheck
                    size={14}
                  />
                  Read all
                </button>
              )}
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3">
              {visibleNotifications.length ===
              0 ? (
                <div className="rounded-2xl bg-[#f7f9fd] p-7 text-center">
                  <Bell
                    size={25}
                    className="mx-auto text-[#a8b2c2]"
                  />
                  <p className="mt-3 text-sm font-extrabold text-[#71809a]">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleNotifications.map(
                    (item) => (
                      <button
                        type="button"
                        key={
                          item.id
                        }
                        onClick={() =>
                          openTransaction(
                            item
                          )
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          item.read
                            ? "border-[#e5e9f0] bg-white"
                            : "border-[#cfdcf7] bg-[#f2f6ff]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isReversionNotification(
                                item
                              )
                                ? "bg-[#fff4d9] text-[#b78114]"
                                : isSplitAddedNotification(
                                    item
                                  )
                                  ? "bg-[#eef3ff] text-[#294aad]"
                                  : "bg-[#e7f7ef] text-[#18845c]"
                            }`}
                          >
                            <ReceiptText
                              size={18}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-black text-[#182442]">
                                {item.title ||
                                  "Payment received"}
                              </p>

                              {!item.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#294aad]" />
                              )}
                            </div>

                            <p className="mt-1 text-xs leading-5 text-[#71809a]">
                              {item.message}
                            </p>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-[#9aa5b6]">
                                {formatTime(
                                  item.createdAt
                                )}
                              </span>

                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#294aad]">
                                <Eye
                                  size={12}
                                />
                                View
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-[#071333]/60 p-3 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="w-full max-w-lg overflow-hidden rounded-[26px] bg-white shadow-[0_30px_90px_rgba(8,24,70,0.30)]">
            <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/65">
                  {isReversionNotification(
                    selected
                  )
                    ? "Balance Update"
                    : isSplitAddedNotification(
                        selected
                      )
                      ? "Split Activity"
                      : "Payment Transaction"}
                </p>

                <h3 className="mt-1 text-xl font-black">
                  {selected.title ||
                    (isReversionNotification(
                      selected
                    )
                      ? "Balance updated"
                      : "Payment received")}
                </h3>

                <p className="mt-1 text-sm text-blue-100/75">
                  {selected.serverName ||
                    "Splitter workspace"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(
                    null
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="rounded-2xl bg-[#eef3ff] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#71809a]">
                  {isReversionNotification(
                    selected
                  )
                    ? isBalanceReductionRevert(
                        selected
                      )
                      ? "Reduction restored"
                      : "Payment reverted"
                    : isSplitAddedNotification(
                        selected
                      )
                      ? "Your share"
                      : "Amount received"}
                </p>
                <p className="mt-1 text-3xl font-black text-[#142a76]">
                  ₱
                  {money(
                    selected.amount
                  )}
                </p>

                <p className="mt-2 text-sm font-bold text-[#52617d]">
                  {isReversionNotification(
                    selected
                  )
                    ? "Changed by"
                    : isSplitAddedNotification(
                        selected
                      )
                      ? "Added by"
                      : "From"}{" "}
                  <span className="text-[#182442]">
                    {selected.senderName ||
                      selected.senderEmail ||
                      "Workspace member"}
                  </span>
                </p>

                {isReversionNotification(
                  selected
                ) &&
                  selected.revertNote && (
                  <div className="mt-3 rounded-xl border border-[#eadfbf] bg-[#fffdf7] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#a37b22]">
                      Reason
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-[#52617d]">
                      {
                        selected.revertNote
                      }
                    </p>
                  </div>
                )}
              </div>

              {isSplitAddedNotification(
                selected
              ) && (
                <div className="mt-4 rounded-2xl border border-[#e2e7ef] bg-[#fafbfe] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8995aa]">
                    Expense
                  </p>

                  <p className="mt-1 text-sm font-black text-[#182442]">
                    {selected.description ||
                      "Shared expense"}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[#8995aa]">
                        Category
                      </p>
                      <p className="mt-0.5 font-extrabold text-[#52617d]">
                        {selected.category ||
                          "Other"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#8995aa]">
                        Covered by
                      </p>
                      <p className="mt-0.5 font-extrabold text-[#52617d]">
                        {selected.payerName ||
                          "Workspace member"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {Array.isArray(
                selected.splitDetails
              ) &&
                selected.splitDetails.length >
                  0 && (
                  <div className="mt-4">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#8995aa]">
                      Transactions
                    </p>

                    <div className="mt-2 space-y-2">
                      {selected.splitDetails.map(
                        (
                          split,
                          index
                        ) => (
                          <div
                            key={
                              `${split.id || "split"}-${index}`
                            }
                            className="flex items-center justify-between gap-3 rounded-xl border border-[#e2e7ef] bg-[#fafbfe] p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-[#182442]">
                                {split.description ||
                                  "Expense"}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#8995aa]">
                                {split.category ||
                                  "Other"}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-black text-[#294aad]">
                              ₱
                              {money(
                                split.amount
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selected.paymentProofDataUrl && (
                <div className="mt-4">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-[#8995aa]">
                    Payment proof
                  </p>

                  <img
                    src={
                      selected.paymentProofDataUrl
                    }
                    alt="Payment proof"
                    className="mt-2 max-h-72 w-full rounded-2xl border border-[#e2e7ef] object-contain"
                  />
                </div>
              )}

              <p className="mt-4 text-center text-[11px] text-[#9aa5b6]">
                {formatTime(
                  selected.createdAt
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NotificationCenter;

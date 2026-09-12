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
        className="fixed right-4 top-4 z-[70] flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#dbe2ee] bg-white text-[#243b7a] shadow-[0_8px_24px_rgba(20,42,118,0.12)] transition hover:bg-[#f7f9fc] lg:right-6 lg:top-6"
      >
        <Bell
          size={19}
        />

        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#d74646] px-1 text-[9px] font-black text-white shadow-sm">
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

          <div className="fixed right-3 top-16 z-[72] w-[calc(100%-24px)] max-w-[390px] overflow-hidden rounded-[20px] border border-[#dfe5ee] bg-white shadow-[0_22px_60px_rgba(15,35,89,0.18)] sm:right-4 lg:right-6 lg:top-20">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0f5] px-4 py-3.5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9aa5b5]">
                  Notifications
                </p>
                <h3 className="mt-0.5 text-[15px] font-black text-[#17213b]">
                  Recent activity
                </h3>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={
                    markAllRead
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e1e7f0] bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-[#53617b] transition hover:bg-[#f7f9fc]"
                >
                  <CheckCheck
                    size={14}
                  />
                  Read all
                </button>
              )}
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-2">
              {visibleNotifications.length ===
              0 ? (
                <div className="rounded-[16px] border border-dashed border-[#dfe5ee] bg-[#fbfcfe] p-7 text-center">
                  <Bell
                    size={25}
                    className="mx-auto text-[#a8b2c2]"
                  />
                  <p className="mt-3 text-sm font-extrabold text-[#71809a]">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
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
                        className={`group w-full rounded-[14px] border px-3 py-3 text-left transition ${
                          item.read
                            ? "border-transparent bg-white hover:bg-[#f8fafc]"
                            : "border-[#e2e8f4] bg-[#f7f9fe] hover:bg-[#f1f5fc]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border ${
                              isReversionNotification(
                                item
                              )
                                ? "border-[#eadfca] bg-[#fffdf8] text-[#9b7430]"
                                : isSplitAddedNotification(
                                    item
                                  )
                                  ? "border-[#dce4f5] bg-[#f8faff] text-[#3d5b9f]"
                                  : "border-[#dce7e3] bg-[#f8fbfa] text-[#3e7563]"
                            }`}
                          >
                            <ReceiptText
                              size={16}
                              strokeWidth={1.9}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-[13px] font-extrabold text-[#1d2842]">
                                {item.title ||
                                  "Payment received"}
                              </p>

                              {!item.read && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3157b7]" />
                              )}
                            </div>

                            <p className="mt-1 line-clamp-2 text-[11px] leading-[1.45] text-[#738099]">
                              {item.message}
                            </p>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-[#9aa5b6]">
                                {formatTime(
                                  item.createdAt
                                )}
                              </span>

                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7d899c] opacity-0 transition group-hover:opacity-100">
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
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-[#111a2d]/42 p-3 backdrop-blur-[5px] sm:items-center sm:p-5">
          <div className="w-full max-w-lg overflow-hidden rounded-[22px] border border-[#dfe5ee] bg-white shadow-[0_28px_80px_rgba(8,24,70,0.24)]">
            <div className="flex items-start justify-between gap-3 border-b border-[#edf0f5] bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9aa5b5]">
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

                <h3 className="mt-1 text-xl font-black text-[#17213b]">
                  {selected.title ||
                    (isReversionNotification(
                      selected
                    )
                      ? "Balance updated"
                      : "Payment received")}
                </h3>

                <p className="mt-1 text-xs font-semibold text-[#7d899c]">
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
                className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-[#e1e6ef] bg-[#f8fafc] text-[#66758e] transition hover:bg-[#f1f4f8]"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="rounded-[16px] border border-[#e3e8f1] bg-[#fafbfe] p-4">
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
                <p className="mt-1 text-2xl font-black text-[#1d356f]">
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

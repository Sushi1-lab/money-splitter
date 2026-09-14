import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Droplets,
  Eye,
  FileImage,
  Home,
  Landmark,
  LoaderCircle,
  Plus,
  ReceiptText,
  Trash2,
  UserRound,
  UsersRound,
  WalletCards,
  QrCode,
  Wifi,
  X,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase.js";

const money = (value) =>
  Number(
    value ||
      0
  ).toLocaleString(
    "en-PH",
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  );

const getBillIcon =
  (type) => {
    if (
      type ===
      "rent"
    ) {
      return Home;
    }

    if (
      type ===
      "water"
    ) {
      return Droplets;
    }

    if (
      type ===
      "electricity"
    ) {
      return Zap;
    }

    if (
      type ===
      "internet"
    ) {
      return Wifi;
    }

    return ReceiptText;
  };

const getTimestampDate =
  (value) => {
    if (
      value?.toDate
    ) {
      return value.toDate();
    }

    if (
      value?.seconds
    ) {
      return new Date(
        value.seconds *
          1000
      );
    }

    if (value) {
      return new Date(
        value
      );
    }

    return null;
  };

function BillsToPay({
  bills = [],
  activeServer,
  savedPeople = [],
  currentUser = null,
  onAddBill,
  onMarkPaid,
  onDeleteBill,
  saving = false,
}) {
  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    billType,
    setBillType,
  ] = useState(
    "rent"
  );

  const [
    billingSchedule,
    setBillingSchedule,
  ] = useState(
    "one-time"
  );

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    dueDate,
    setDueDate,
  ] = useState("");

  const [
    note,
    setNote,
  ] = useState("");

  const [
    selectedPersonIds,
    setSelectedPersonIds,
  ] = useState(
    []
  );

  const [
    paymentTarget,
    setPaymentTarget,
  ] = useState(null);

  const [
    paymentProof,
    setPaymentProof,
  ] = useState(null);

  const [
    proofProcessing,
    setProofProcessing,
  ] = useState(false);

  const [
    proofToView,
    setProofToView,
  ] = useState(null);

  const [
    walletOwnerUid,
    setWalletOwnerUid,
  ] = useState("");

  const [
    walletOptions,
    setWalletOptions,
  ] = useState([]);

  const [
    selectedWalletId,
    setSelectedWalletId,
  ] = useState("");

  const [
    walletLoading,
    setWalletLoading,
  ] = useState(false);

  const [
    walletToView,
    setWalletToView,
  ] = useState(null);

  const unpaidBills =
    useMemo(
      () =>
        bills
          .filter(
            (bill) =>
              bill.status !==
              "paid"
          )
          .sort(
            (a, b) =>
              String(
                a.dueDate ||
                  "9999-12-31"
              ).localeCompare(
                String(
                  b.dueDate ||
                    "9999-12-31"
                )
              )
          ),
      [
        bills,
      ]
    );

  const paidBills =
    useMemo(
      () =>
        bills.filter(
          (bill) =>
            bill.status ===
            "paid"
        ),
      [
        bills,
      ]
    );

  const unpaidTotal =
    unpaidBills.reduce(
      (
        sum,
        bill
      ) =>
        sum +
        Number(
          bill.amount ||
            0
        ),
      0
    );

  const availablePeople =
    useMemo(
      () =>
        [...savedPeople]
          .filter(
            (person) =>
              person?.id &&
              person?.name
          )
          .sort(
            (a, b) =>
              String(
                a.name ||
                  ""
              ).localeCompare(
                String(
                  b.name ||
                    ""
                )
              )
          ),
      [
        savedPeople,
      ]
    );

  const selectedPeople =
    availablePeople.filter(
      (person) =>
        selectedPersonIds.includes(
          person.id
        )
    );


  const walletPeople =
    useMemo(() => {
      const map =
        new Map();

      if (
        currentUser?.uid
      ) {
        map.set(
          currentUser.uid,
          {
            uid:
              currentUser.uid,
            name:
              currentUser.displayName ||
              currentUser.username ||
              currentUser.email ||
              "Me",
            username:
              currentUser.username ||
              "",
            email:
              currentUser.email ||
              "",
            photoURL:
              currentUser.photoURL ||
              null,
            isCurrentUser:
              true,
          }
        );
      }

      availablePeople.forEach(
        (person) => {
          if (
            !person?.linkedUid ||
            map.has(
              person.linkedUid
            )
          ) {
            return;
          }

          map.set(
            person.linkedUid,
            {
              uid:
                person.linkedUid,
              name:
                person.name ||
                person.username ||
                person.linkedEmail ||
                "Workspace member",
              username:
                person.username ||
                "",
              email:
                person.linkedEmail ||
                "",
              photoURL:
                person.photoURL ||
                null,
              isCurrentUser:
                false,
            }
          );
        }
      );

      return Array.from(
        map.values()
      );
    }, [
      availablePeople,
      currentUser?.uid,
      currentUser?.displayName,
      currentUser?.username,
      currentUser?.email,
      currentUser?.photoURL,
    ]);

  const selectedWalletOwner =
    walletPeople.find(
      (person) =>
        person.uid ===
        walletOwnerUid
    ) || null;

  const selectedWallet =
    walletOptions.find(
      (wallet) =>
        wallet.id ===
        selectedWalletId
    ) || null;

  useEffect(() => {
    let cancelled =
      false;

    const loadWallets =
      async () => {
        setSelectedWalletId(
          ""
        );
        setWalletOptions(
          []
        );

        if (
          !walletOwnerUid
        ) {
          return;
        }

        try {
          setWalletLoading(
            true
          );

          const snapshot =
            await getDocs(
              collection(
                db,
                "users",
                walletOwnerUid,
                "wallets"
              )
            );

          if (cancelled) {
            return;
          }

          const loaded =
            snapshot.docs
              .map(
                (item) => ({
                  id:
                    item.id,
                  ...item.data(),
                })
              )
              .sort(
                (a, b) =>
                  Number(
                    b.createdAt?.seconds ||
                      0
                  ) -
                  Number(
                    a.createdAt?.seconds ||
                      0
                  )
              );

          setWalletOptions(
            loaded
          );

          if (
            loaded.length ===
            1
          ) {
            setSelectedWalletId(
              loaded[0].id
            );
          }
        } catch (err) {
          console.error(
            "Bill wallet loading error:",
            err
          );

          if (!cancelled) {
            setWalletOptions(
              []
            );
          }
        } finally {
          if (!cancelled) {
            setWalletLoading(
              false
            );
          }
        }
      };

    loadWallets();

    return () => {
      cancelled =
        true;
    };
  }, [
    walletOwnerUid,
  ]);

  const togglePerson =
    (personId) => {
      setSelectedPersonIds(
        (current) =>
          current.includes(
            personId
          )
            ? current.filter(
                (id) =>
                  id !==
                  personId
              )
            : [
                ...current,
                personId,
              ]
      );
    };

  const selectEveryone =
    () => {
      setSelectedPersonIds(
        availablePeople.map(
          (person) =>
            person.id
        )
      );
    };

  const clearPeople =
    () => {
      setSelectedPersonIds(
        []
      );
      setWalletOwnerUid(
        ""
      );
      setSelectedWalletId(
        ""
      );
      setWalletOptions(
        []
      );
    };

  const billSetterLabel =
    (bill) =>
      bill?.createdByUsername
        ? `@${bill.createdByUsername}`
        : bill?.createdByDisplayName ||
          bill?.createdByEmail ||
          "Workspace member";

  const billSettlerLabel =
    (bill) =>
      bill?.paidByDisplayName ||
      (bill?.paidByUsername
        ? `@${bill.paidByUsername}`
        : bill?.paidByEmail ||
          "Workspace member");

  const getBillShareInfo =
    (bill) => {
      const people =
        Array.isArray(
          bill?.assignedPeople
        )
          ? bill.assignedPeople
          : [];

      const count =
        people.length;

      const total =
        Number(
          bill?.amount ||
            0
        );

      return {
        count,
        amountPerPerson:
          count > 0
            ? total / count
            : 0,
      };
    };

  const isWalletOwnerPerson =
    (bill, person) => {
      const ownerUid =
        bill?.paymentWallet?.ownerUid ||
        "";

      const ownerEmail =
        String(
          bill?.paymentWallet?.ownerEmail ||
            ""
        )
          .trim()
          .toLowerCase();

      return Boolean(
        (
          ownerUid &&
          person?.linkedUid ===
            ownerUid
        ) ||
        (
          ownerEmail &&
          String(
            person?.linkedEmail ||
              ""
          )
            .trim()
            .toLowerCase() ===
            ownerEmail
        )
      );
    };

  const currentUserIsWalletOwner =
    (bill) => {
      const ownerUid =
        bill?.paymentWallet?.ownerUid ||
        "";

      const ownerEmail =
        String(
          bill?.paymentWallet?.ownerEmail ||
            ""
        )
          .trim()
          .toLowerCase();

      const currentEmail =
        String(
          currentUser?.email ||
            ""
        )
          .trim()
          .toLowerCase();

      return Boolean(
        (
          ownerUid &&
          currentUser?.uid &&
          ownerUid ===
            currentUser.uid
        ) ||
        (
          ownerEmail &&
          currentEmail &&
          ownerEmail ===
            currentEmail
        )
      );
    };

  const getBillPaymentProgress =
    (bill) => {
      const people =
        Array.isArray(
          bill?.assignedPeople
        )
          ? bill.assignedPeople
          : [];

      const walletOwnerIncluded =
        people.some(
          (person) =>
            isWalletOwnerPerson(
              bill,
              person
            )
        );

      return {
        totalPeople:
          people.length,
        walletOwnerIncluded,
        peopleToPay:
          Math.max(
            people.length -
              (walletOwnerIncluded
                ? 1
                : 0),
            0
          ),
      };
    };

  const isOverdue =
    (bill) => {
      if (
        !bill?.dueDate ||
        bill.status ===
          "paid"
      ) {
        return false;
      }

      const end =
        new Date(
          `${bill.dueDate}T23:59:59`
        );

      return (
        end.getTime() <
        Date.now()
      );
    };

  const getDueCountdown =
    (bill) => {
      if (
        !bill?.dueDate
      ) {
        return null;
      }

      const [
        year,
        month,
        day,
      ] =
        String(
          bill.dueDate
        )
          .split("-")
          .map(Number);

      if (
        !year ||
        !month ||
        !day
      ) {
        return null;
      }

      const now =
        new Date();

      const todayUtc =
        Date.UTC(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

      const dueUtc =
        Date.UTC(
          year,
          month - 1,
          day
        );

      const days =
        Math.round(
          (
            dueUtc -
            todayUtc
          ) /
            86400000
        );

      if (
        bill.status ===
        "paid"
      ) {
        return {
          days,
          label:
            "Settled",
          state:
            "paid",
        };
      }

      if (
        days === 0
      ) {
        return {
          days,
          label:
            "Due today",
          state:
            "today",
        };
      }

      if (
        days === 1
      ) {
        return {
          days,
          label:
            "1 day left",
          state:
            "soon",
        };
      }

      if (
        days > 1
      ) {
        return {
          days,
          label:
            `${days} days left`,
          state:
            days <= 3
              ? "soon"
              : "normal",
        };
      }

      const overdueDays =
        Math.abs(
          days
        );

      return {
        days,
        label:
          overdueDays === 1
            ? "1 day overdue"
            : `${overdueDays} days overdue`,
        state:
          "overdue",
      };
    };

  const resetForm =
    () => {
      setTitle("");
      setBillType(
        "rent"
      );
      setBillingSchedule(
        "one-time"
      );
      setAmount("");
      setDueDate("");
      setNote("");
      setSelectedPersonIds(
        []
      );
      setWalletOwnerUid(
        ""
      );
      setSelectedWalletId(
        ""
      );
      setWalletOptions(
        []
      );
    };

  const submitBill =
    async (
      event
    ) => {
      event.preventDefault();

      const cleanTitle =
        title
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const numericAmount =
        Number(
          amount
        );

      if (
        !cleanTitle ||
        !numericAmount ||
        numericAmount <=
          0 ||
        !dueDate ||
        !walletOwnerUid ||
        !selectedWallet ||
        !selectedWallet.qrBase64
      ) {
        return;
      }

      const saved =
        await onAddBill?.({
          title:
            cleanTitle,

          billType,

          billingSchedule,

          isRecurring:
            billingSchedule ===
            "monthly",

          dueDay:
            Number(
              String(
                dueDate
              ).slice(
                8,
                10
              )
            ) || 1,

          amount:
            numericAmount,

          dueDate,

          note:
            note
              .trim()
              .replace(
                /\s+/g,
                " "
              ),

          assignedPeople:
            selectedPeople.map(
              (person) => ({
                id:
                  person.id,

                name:
                  person.name ||
                  "",

                username:
                  person.username ||
                  "",

                linkedUid:
                  person.linkedUid ||
                  "",

                linkedEmail:
                  person.linkedEmail ||
                  "",

                photoURL:
                  person.photoURL ||
                  null,

                personType:
                  person.personType ||
                  "",
              })
            ),

          assignedPersonIds:
            selectedPeople.map(
              (person) =>
                person.id
            ),

          peopleCount:
            selectedPeople.length,

          amountPerPerson:
            selectedPeople.length >
            0
              ? Number(
                  (
                    numericAmount /
                    selectedPeople.length
                  ).toFixed(
                    2
                  )
                )
              : null,

          walletOwnerAutoSettled:
            Boolean(
              selectedWalletOwner &&
              selectedPeople.some(
                (person) =>
                  (
                    selectedWalletOwner.uid &&
                    person.linkedUid ===
                      selectedWalletOwner.uid
                  ) ||
                  (
                    selectedWalletOwner.email &&
                    String(
                      person.linkedEmail ||
                        ""
                    )
                      .trim()
                      .toLowerCase() ===
                      String(
                        selectedWalletOwner.email
                      )
                        .trim()
                        .toLowerCase()
                  )
              )
            ),

          paymentWallet:
            selectedWallet &&
            selectedWalletOwner
              ? {
                  walletId:
                    selectedWallet.id,
                  ownerUid:
                    selectedWalletOwner.uid,
                  ownerName:
                    selectedWalletOwner.name ||
                    "Workspace member",
                  ownerUsername:
                    selectedWalletOwner.username ||
                    "",
                  ownerEmail:
                    selectedWalletOwner.email ||
                    "",
                  providerName:
                    selectedWallet.providerName ||
                    "Wallet",
                  walletType:
                    selectedWallet.walletType ||
                    "",
                  accountName:
                    selectedWallet.accountName ||
                    "",
                  accountNumber:
                    selectedWallet.accountNumber ||
                    "",
                  qrBase64:
                    selectedWallet.qrBase64 ||
                    null,
                }
              : null,

          assignmentMode:
            selectedPeople.length >
            0
              ? "selected-people"
              : "workspace",
        });

      if (saved) {
        resetForm();
        setShowForm(
          false
        );
      }
    };

  const readAsDataUrl =
    (file) =>
      new Promise(
        (
          resolve,
          reject
        ) => {
          const reader =
            new FileReader();

          reader.onload =
            () =>
              resolve(
                reader.result
              );

          reader.onerror =
            () =>
              reject(
                new Error(
                  "Unable to read the image."
                )
              );

          reader.readAsDataURL(
            file
          );
        }
      );

  const loadImage =
    (
      dataUrl
    ) =>
      new Promise(
        (
          resolve,
          reject
        ) => {
          const image =
            new Image();

          image.onload =
            () =>
              resolve(
                image
              );

          image.onerror =
            () =>
              reject(
                new Error(
                  "Unable to open this image."
                )
              );

          image.src =
            dataUrl;
        }
      );

  const prepareProof =
    async (
      file
    ) => {
      if (!file) {
        return;
      }

      if (
        !String(
          file.type ||
            ""
        ).startsWith(
          "image/"
        )
      ) {
        window.alert(
          "Please select an image screenshot."
        );
        return;
      }

      if (
        file.size >
        15 *
          1024 *
          1024
      ) {
        window.alert(
          "The image is too large. Please use a screenshot smaller than 15 MB."
        );
        return;
      }

      try {
        setProofProcessing(
          true
        );

        const sourceUrl =
          await readAsDataUrl(
            file
          );

        const image =
          await loadImage(
            sourceUrl
          );

        const maxDimension =
          1280;

        const ratio =
          Math.min(
            1,
            maxDimension /
              Math.max(
                image.naturalWidth,
                image.naturalHeight
              )
          );

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          Math.max(
            1,
            Math.round(
              image.naturalWidth *
                ratio
            )
          );

        canvas.height =
          Math.max(
            1,
            Math.round(
              image.naturalHeight *
                ratio
            )
          );

        const context =
          canvas.getContext(
            "2d"
          );

        context.fillStyle =
          "#ffffff";

        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        let quality =
          0.80;

        let output =
          canvas.toDataURL(
            "image/jpeg",
            quality
          );

        while (
          output.length >
            520000 &&
          quality >
            0.38
        ) {
          quality -=
            0.07;

          output =
            canvas.toDataURL(
              "image/jpeg",
              quality
            );
        }

        if (
          output.length >
          700000
        ) {
          window.alert(
            "The screenshot is still too large. Please crop it and try again."
          );
          return;
        }

        setPaymentProof({
          dataUrl:
            output,

          name:
            `${String(
              file.name ||
                "bill-payment"
            ).replace(
              /\.[^.]+$/,
              ""
            )}.jpg`,

          type:
            "image/jpeg",
        });
      } catch (err) {
        console.error(
          "Bill proof error:",
          err
        );

        window.alert(
          err?.message ||
            "Unable to prepare this screenshot."
        );
      } finally {
        setProofProcessing(
          false
        );
      }
    };

  const closePayment =
    () => {
      if (
        saving
      ) {
        return;
      }

      setPaymentTarget(
        null
      );

      setPaymentProof(
        null
      );
    };

  const confirmPaid =
    async () => {
      if (
        !paymentTarget ||
        !paymentProof
      ) {
        return;
      }

      const done =
        await onMarkPaid?.(
          paymentTarget,
          paymentProof
        );

      if (done) {
        closePayment();
      }
    };

  return (
    <>
      <section className="space-y-5">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#10245f] via-[#1b378e] to-[#3d63d2] p-6 text-white shadow-[0_20px_50px_rgba(20,42,118,0.18)] sm:p-8">
          <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-extrabold">
                <ReceiptText
                  size={14}
                />
                Long-term workspace
              </div>

              <h1 className="mt-4 text-3xl font-black">
                Bills to Pay
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
                Track upcoming bills without adding them to split expenses or balances.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowForm(
                  (current) =>
                    !current
                )
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-[#142a76] shadow-sm"
            >
              {showForm ? (
                <X size={17} />
              ) : (
                <Plus
                  size={17}
                />
              )}

              {showForm
                ? "Close"
                : "Add Bill"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="app-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8995aa]">
              Unpaid Bills
            </p>

            <p className="mt-2 text-3xl font-black text-[#182442]">
              {
                unpaidBills.length
              }
            </p>
          </div>

          <div className="app-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8995aa]">
              Amount Due
            </p>

            <p className="mt-2 text-3xl font-black text-[#142a76]">
              ₱
              {money(
                unpaidTotal
              )}
            </p>

            <p className="mt-1 text-[11px] text-[#8995aa]">
              Not included in total expenses
            </p>
          </div>

          <div className="app-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8995aa]">
              Paid Bills
            </p>

            <p className="mt-2 text-3xl font-black text-[#18845c]">
              {
                paidBills.length
              }
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={
              submitBill
            }
            className="app-card p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="app-icon-box">
                <Plus
                  size={19}
                />
              </div>

              <div>
                <h2 className="font-extrabold text-[#182442]">
                  Add a Bill
                </h2>

                <p className="mt-1 text-xs text-[#8995aa]">
                  Choose who this bill applies to, or leave everyone unselected for a general workspace bill.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="app-label">
                  Bill Name
                </label>

                <input
                  value={
                    title
                  }
                  onChange={(
                    event
                  ) =>
                    setTitle(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. September Meralco"
                  maxLength={80}
                  className="app-input"
                />
              </div>

              <div>
                <label className="app-label">
                  Bill Type
                </label>

                <select
                  value={
                    billType
                  }
                  onChange={(
                    event
                  ) =>
                    setBillType(
                      event.target
                        .value
                    )
                  }
                  className="app-input"
                >
                  <option value="rent">
                    Rent
                  </option>

                  <option value="water">
                    Water
                  </option>

                  <option value="electricity">
                    Electricity
                  </option>

                  <option value="internet">
                    Internet
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="app-label">
                  Billing Schedule
                </label>

                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#dce3ef] bg-[#f8faff] p-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBillingSchedule(
                        "one-time"
                      )
                    }
                    className={`min-h-12 rounded-xl border px-3 text-sm font-extrabold transition ${
                      billingSchedule ===
                      "one-time"
                        ? "border-[#294aad] bg-[#e4ebff] text-[#142a76]"
                        : "border-transparent bg-white text-[#71809a]"
                    }`}
                  >
                    This Month Only
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setBillingSchedule(
                        "monthly"
                      )
                    }
                    className={`min-h-12 rounded-xl border px-3 text-sm font-extrabold transition ${
                      billingSchedule ===
                      "monthly"
                        ? "border-[#18845c] bg-[#e7f7ef] text-[#146c4c]"
                        : "border-transparent bg-white text-[#71809a]"
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#8995aa]">
                  {billingSchedule ===
                  "monthly"
                    ? "Monthly bills automatically reset to Unpaid on the 1st day of each new month. The due day stays the same."
                    : "This bill is only for the selected month and will not reset next month."}
                </p>
              </div>

              <div>
                <label className="app-label">
                  Amount
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#71809a]">
                    ₱
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={
                      amount
                    }
                    onChange={(
                      event
                    ) =>
                      setAmount(
                        event.target
                          .value
                      )
                    }
                    placeholder="0.00"
                    className="app-input !pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="app-label">
                  Due Date
                </label>

                <input
                  type="date"
                  value={
                    dueDate
                  }
                  onChange={(
                    event
                  ) =>
                    setDueDate(
                      event.target
                        .value
                    )
                  }
                  className="app-input"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="app-label !mb-0">
                    People Included
                    <span className="ml-1 font-medium text-[#9aa5b6]">
                      optional
                    </span>
                  </label>

                  {availablePeople.length >
                    0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={
                          selectEveryone
                        }
                        className="text-[11px] font-extrabold text-[#294aad]"
                      >
                        Select all
                      </button>

                      {selectedPersonIds.length >
                        0 && (
                        <button
                          type="button"
                          onClick={
                            clearPeople
                          }
                          className="text-[11px] font-extrabold text-[#8995aa]"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {availablePeople.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-[#ccd7ea] bg-[#f8faff] p-4 text-center">
                    <UsersRound
                      size={24}
                      className="mx-auto text-[#8fa0bd]"
                    />

                    <p className="mt-2 text-xs font-bold text-[#71809a]">
                      No saved people yet.
                    </p>

                    <p className="mt-1 text-[11px] text-[#9aa5b6]">
                      People you add in Splitter will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-[#dce3ef] bg-[#f8faff] p-3 sm:grid-cols-2">
                    {availablePeople.map(
                      (
                        person
                      ) => {
                        const selected =
                          selectedPersonIds.includes(
                            person.id
                          );

                        return (
                          <button
                            key={
                              person.id
                            }
                            type="button"
                            onClick={() =>
                              togglePerson(
                                person.id
                              )
                            }
                            className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition ${
                              selected
                                ? "border-[#7f99dc] bg-[#eaf0ff]"
                                : "border-[#e0e6ef] bg-white hover:border-[#c6d2e8]"
                            }`}
                          >
                            {person.photoURL ? (
                              <img
                                src={
                                  person.photoURL
                                }
                                alt=""
                                referrerPolicy="no-referrer"
                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                              />
                            ) : (
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black uppercase ${
                                  selected
                                    ? "bg-[#294aad] text-white"
                                    : "bg-[#e4ebff] text-[#294aad]"
                                }`}
                              >
                                {String(
                                  person.name ||
                                    "?"
                                )
                                  .trim()
                                  .charAt(
                                    0
                                  )}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-extrabold text-[#182442]">
                                {
                                  person.name
                                }
                              </p>

                              <p className="truncate text-[11px] text-[#8995aa]">
                                {person.username
                                  ? `@${person.username}`
                                  : person.linkedEmail ||
                                    "Saved person"}
                              </p>
                            </div>

                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${
                                selected
                                  ? "border-[#294aad] bg-[#294aad] text-white"
                                  : "border-[#cfd8e8] bg-white text-transparent"
                              }`}
                            >
                              ✓
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                <p className="mt-2 text-[11px] text-[#8995aa]">
                  {selectedPersonIds.length >
                  0
                    ? `${selectedPersonIds.length} ${
                        selectedPersonIds.length ===
                        1
                          ? "person"
                          : "people"
                      } included for this bill.`
                    : "No one selected — this will be treated as a general workspace bill."}
                </p>
              </div>

              <div className="sm:col-span-2">
                <div className="rounded-2xl border border-[#dce3ef] bg-[#f8faff] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4ebff] text-[#294aad]">
                      <WalletCards size={19} />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-[#182442]">
                        Whose wallet will be used?
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8995aa]">
                        Required. Choose a saved bank or e-wallet with an attached QR image before this bill can be saved.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="app-label">
                        Wallet Owner
                        <span className="ml-1 text-[#c85353]">
                          *
                        </span>
                      </label>

                      <select
                        value={walletOwnerUid}
                        onChange={(event) =>
                          setWalletOwnerUid(
                            event.target.value
                          )
                        }
                        className="app-input"
                      >
                        <option value="">
                          Choose wallet owner
                        </option>

                        {walletPeople.map(
                          (person) => (
                            <option
                              key={person.uid}
                              value={person.uid}
                            >
                              {person.isCurrentUser
                                ? `Me — ${person.name}`
                                : person.username
                                  ? `${person.name} (@${person.username})`
                                  : person.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="app-label">
                        Payment Method
                        <span className="ml-1 text-[#c85353]">
                          *
                        </span>
                      </label>

                      <select
                        value={selectedWalletId}
                        onChange={(event) =>
                          setSelectedWalletId(
                            event.target.value
                          )
                        }
                        disabled={
                          !walletOwnerUid ||
                          walletLoading
                        }
                        className="app-input disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {walletLoading
                            ? "Loading wallets..."
                            : !walletOwnerUid
                              ? "Choose wallet owner first"
                              : walletOptions.length === 0
                                ? "No saved wallets found"
                                : "Choose payment method"}
                        </option>

                        {walletOptions.map(
                          (wallet) => (
                            <option
                              key={wallet.id}
                              value={wallet.id}
                            >
                              {wallet.providerName || "Wallet"}
                              {wallet.accountName
                                ? ` — ${wallet.accountName}`
                                : ""}
                              {wallet.accountNumber
                                ? ` (${wallet.accountNumber})`
                                : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  {selectedWallet && (
                    <div className="mt-3 rounded-xl border border-[#dbe3f0] bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold text-[#182442]">
                            {selectedWallet.providerName || "Wallet"}
                          </p>
                          <p className="mt-1 text-[11px] text-[#71809a]">
                            {selectedWallet.accountName || "No account name"}
                            {selectedWallet.accountNumber
                              ? ` · ${selectedWallet.accountNumber}`
                              : ""}
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2.5 py-1 text-[10px] font-extrabold text-[#294aad]">
                          <QrCode size={12} />
                          {selectedWallet.qrBase64
                            ? "QR attached"
                            : "QR required"}
                        </span>
                      </div>
                    </div>
                  )}

                  {!walletOwnerUid && (
                    <p className="mt-3 rounded-xl bg-[#fff3df] px-3 py-2 text-xs font-bold text-[#a36b16]">
                      Select whose wallet will be used for this bill.
                    </p>
                  )}

                  {walletOwnerUid &&
                    walletOptions.length === 0 &&
                    !walletLoading && (
                    <p className="mt-3 rounded-xl bg-[#ffeded] px-3 py-2 text-xs font-bold text-[#c85353]">
                      This person has no saved payment method. Add a wallet with a QR image first.
                    </p>
                  )}

                  {selectedWallet &&
                    !selectedWallet.qrBase64 && (
                    <p className="mt-3 rounded-xl bg-[#ffeded] px-3 py-2 text-xs font-bold text-[#c85353]">
                      This payment method has no QR image. Add or update the wallet with a QR before using it for a bill.
                    </p>
                  )}

                  {selectedWallet?.qrBase64 && (
                    <div className="mt-3 rounded-xl border border-[#cfe9dc] bg-[#eefaf4] px-3 py-2">
                      <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#18845c]">
                        <CheckCircle2 size={14} />
                        QR ready — this bill can be saved.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="app-label">
                  Note
                  <span className="ml-1 font-medium text-[#9aa5b6]">
                    optional
                  </span>
                </label>

                <input
                  value={
                    note
                  }
                  onChange={(
                    event
                  ) =>
                    setNote(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Unit 2A, September billing"
                  maxLength={120}
                  className="app-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                !title.trim() ||
                !dueDate ||
                Number(
                  amount
                ) <=
                  0 ||
                !walletOwnerUid ||
                !selectedWallet ||
                !selectedWallet.qrBase64
              }
              className="app-button-primary mt-5 inline-flex w-full items-center justify-center gap-2 px-5 sm:w-auto"
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Plus
                  size={17}
                />
              )}

              Save Bill
            </button>

            {(!walletOwnerUid ||
              !selectedWallet ||
              !selectedWallet?.qrBase64) && (
              <p className="mt-2 text-xs font-bold text-[#c85353]">
                A payment wallet with an attached QR image is required to save this bill.
              </p>
            )}
          </form>
        )}

        <div className="app-card overflow-hidden">
          <div className="border-b border-[#e3e8f0] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="app-icon-box">
                <Clock3
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-extrabold text-[#182442]">
                  Unpaid
                </h2>

                <p className="mt-1 text-xs text-[#8995aa]">
                  Payment proof is required before a bill can be marked paid.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {unpaidBills.length ===
            0 ? (
              <div className="rounded-2xl bg-[#f7f9fd] p-8 text-center">
                <CheckCircle2
                  size={34}
                  className="mx-auto text-[#18845c]"
                />

                <p className="mt-3 font-extrabold text-[#182442]">
                  No unpaid bills
                </p>

                <p className="mt-1 text-xs text-[#8995aa]">
                  {
                    activeServer?.name ||
                    "This workspace"
                  }{" "}
                  is currently clear.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidBills.map(
                  (bill) => {
                    const Icon =
                      getBillIcon(
                        bill.billType
                      );

                    const overdue =
                      isOverdue(
                        bill
                      );

                    return (
                      <div
                        key={
                          bill.id
                        }
                        className={`rounded-2xl border p-4 ${
                          overdue
                            ? "border-[#efc7c7] bg-[#fff7f7]"
                            : "border-[#e0e6ef] bg-[#f8faff]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              overdue
                                ? "bg-[#ffeded] text-[#cf4646]"
                                : "bg-[#e4ebff] text-[#294aad]"
                            }`}
                          >
                            <Icon
                              size={20}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-extrabold text-[#182442]">
                                {
                                  bill.title
                                }
                              </p>

                              {overdue && (
                                <span className="rounded-full bg-[#ffeded] px-2 py-0.5 text-[10px] font-black uppercase text-[#cf4646]">
                                  Overdue
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8995aa]">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays
                                  size={13}
                                />
                                Due{" "}
                                {
                                  bill.dueDate
                                }
                              </span>

                              {(() => {
                                const countdown =
                                  getDueCountdown(
                                    bill
                                  );

                                if (
                                  !countdown
                                ) {
                                  return null;
                                }

                                const countdownClass =
                                  countdown.state ===
                                  "overdue"
                                    ? "bg-[#ffeded] text-[#cf4646]"
                                    : countdown.state ===
                                      "today"
                                    ? "bg-[#fff0df] text-[#b86b0a]"
                                    : countdown.state ===
                                      "soon"
                                    ? "bg-[#fff7df] text-[#a36b16]"
                                    : "bg-[#eef3ff] text-[#294aad]";

                                return (
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${countdownClass}`}
                                  >
                                    {countdown.label}
                                  </span>
                                );
                              })()}

                              {bill.note && (
                                <span>
                                  {
                                    bill.note
                                  }
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-1 font-bold text-[#52617d]">
                                <UserRound
                                  size={12}
                                />
                                Set by{" "}
                                {
                                  billSetterLabel(
                                    bill
                                  )
                                }
                              </span>

                              {Array.isArray(
                                bill.assignedPeople
                              ) &&
                              bill.assignedPeople.length >
                                0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-1 font-bold text-[#294aad]">
                                  <UsersRound
                                    size={12}
                                  />
                                  {
                                    bill.assignedPeople.length
                                  }{" "}
                                  {
                                    bill.assignedPeople.length ===
                                    1
                                      ? "person"
                                      : "people"
                                  }
                                </span>
                              ) : (
                                <span className="rounded-full bg-[#f1f3f7] px-2 py-1 font-bold text-[#7f8b9e]">
                                  General workspace bill
                                </span>
                              )}
                            </div>

                            {Array.isArray(
                              bill.assignedPeople
                            ) &&
                              bill.assignedPeople.length >
                                0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {bill.assignedPeople.map(
                                  (
                                    person,
                                    index
                                  ) => (
                                    <span
                                      key={
                                        person.id ||
                                        `${person.name}-${index}`
                                      }
                                      className="rounded-lg border border-[#dbe3f0] bg-white px-2 py-1 text-[10px] font-bold text-[#52617d]"
                                    >
                                      {
                                        person.username
                                          ? `@${person.username}`
                                          : person.name
                                      }
                                      {" · "}
                                      {isWalletOwnerPerson(
                                        bill,
                                        person
                                      )
                                        ? "Settled · Wallet owner"
                                        : `₱${money(
                                            getBillShareInfo(
                                              bill
                                            ).amountPerPerson
                                          )}`}
                                    </span>
                                  )
                                )}
                              </div>
                            )}

                            {(() => {
                              const share =
                                getBillShareInfo(
                                  bill
                                );

                              return share.count >
                                0 ? (
                                <div className="mt-3 rounded-xl border border-[#dbe4f4] bg-[#f8faff] px-3 py-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8995aa]">
                                        Equal share
                                      </p>
                                      <p className="mt-0.5 text-xs font-bold text-[#52617d]">
                                        ₱{money(
                                          bill.amount
                                        )} ÷ {share.count}{" "}
                                        {share.count === 1
                                          ? "person"
                                          : "people"}
                                      </p>
                                    </div>

                                    <p className="text-base font-black text-[#294aad]">
                                      ₱{money(
                                        share.amountPerPerson
                                      )} each
                                    </p>
                                  </div>
                                </div>
                              ) : null;
                            })()}

                            {(() => {
                              const progress =
                                getBillPaymentProgress(
                                  bill
                                );

                              return progress.totalPeople >
                                0 ? (
                                <div className="mt-2 rounded-xl bg-[#f7f9fd] px-3 py-2.5">
                                  <p className="text-xs font-extrabold text-[#52617d]">
                                    {progress.walletOwnerIncluded
                                      ? `Wallet owner is already settled. ${progress.peopleToPay} ${
                                          progress.peopleToPay === 1
                                            ? "person still needs"
                                            : "people still need"
                                        } to pay their share.`
                                      : `${progress.peopleToPay} ${
                                          progress.peopleToPay === 1
                                            ? "person needs"
                                            : "people need"
                                        } to pay their share.`}
                                  </p>
                                </div>
                              ) : null;
                            })()}

                            {bill.paymentWallet && (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f6ef] px-2.5 py-1 text-[11px] font-extrabold text-[#18845c]">
                                  <WalletCards size={13} />
                                  Pay to {bill.paymentWallet.ownerName || "wallet owner"}
                                  {bill.paymentWallet.providerName
                                    ? ` · ${bill.paymentWallet.providerName}`
                                    : ""}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setWalletToView(
                                      bill.paymentWallet
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3ff] px-2.5 py-1 text-[11px] font-extrabold text-[#294aad]"
                                >
                                  <QrCode size={13} />
                                  View Wallet / QR
                                </button>
                              </div>
                            )}
                          </div>

                          <p className="shrink-0 text-right text-lg font-black text-[#142a76]">
                            ₱
                            {money(
                              bill.amount
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e4e9f1] pt-3">
                          <button
                            type="button"
                            disabled={
                              saving
                            }
                            onClick={() => {
                              setPaymentTarget(
                                bill
                              );
                              setPaymentProof(
                                null
                              );
                            }}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-4 text-xs font-extrabold text-white disabled:opacity-50"
                          >
                            <CheckCircle2
                              size={15}
                            />
                            {currentUserIsWalletOwner(
                              bill
                            )
                              ? "Attach Overall Payment"
                              : "Mark Paid"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              onDeleteBill?.(
                                bill
                              )
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#ffeded] px-4 text-xs font-extrabold text-[#c85353] disabled:opacity-50"
                          >
                            <Trash2
                              size={15}
                            />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        {paidBills.length >
          0 && (
          <div className="app-card overflow-hidden">
            <div className="border-b border-[#e3e8f0] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f6ef] text-[#18845c]">
                  <CheckCircle2
                    size={20}
                  />
                </div>

                <div>
                  <h2 className="font-extrabold text-[#182442]">
                    Paid Bills
                  </h2>

                  <p className="mt-1 text-xs text-[#8995aa]">
                    Completed bills with payment proof.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4 sm:p-6">
              {paidBills.map(
                (bill) => {
                  const Icon =
                    getBillIcon(
                      bill.billType
                    );

                  const paidDate =
                    getTimestampDate(
                      bill.paidAt
                    );

                  return (
                    <div
                      key={
                        bill.id
                      }
                      className="rounded-2xl border border-[#e0e6ef] bg-[#f8faff] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f6ef] text-[#18845c]">
                          <Icon
                            size={20}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-[#182442]">
                            {
                              bill.title
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#8995aa]">
                            Paid
                            {paidDate
                              ? ` · ${paidDate.toLocaleDateString(
                                  "en-PH",
                                  {
                                    month:
                                      "short",
                                    day:
                                      "numeric",
                                    year:
                                      "numeric",
                                  }
                                )}`
                              : ""}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f6ef] px-2.5 py-1 text-[11px] font-extrabold text-[#18845c]">
                              <CheckCircle2
                                size={12}
                              />
                              Settled by{" "}
                              {
                                billSettlerLabel(
                                  bill
                                )
                              }
                            </span>

                            {bill.paidByEmail && (
                              <span className="max-w-full truncate rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#71809a]">
                                {bill.paidByEmail}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-1 font-bold text-[#52617d]">
                              <UserRound
                                size={12}
                              />
                              Set by{" "}
                              {
                                billSetterLabel(
                                  bill
                                )
                              }
                            </span>

                            {Array.isArray(
                              bill.assignedPeople
                            ) &&
                            bill.assignedPeople.length >
                              0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-1 font-bold text-[#294aad]">
                                <UsersRound
                                  size={12}
                                />
                                {
                                  bill.assignedPeople.length
                                }{" "}
                                included
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#f1f3f7] px-2 py-1 font-bold text-[#7f8b9e]">
                                General workspace bill
                              </span>
                            )}
                          </div>

                          {Array.isArray(
                            bill.assignedPeople
                          ) &&
                            bill.assignedPeople.length >
                              0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {bill.assignedPeople.map(
                                (
                                  person,
                                  index
                                ) => (
                                  <span
                                    key={
                                      person.id ||
                                      `${person.name}-${index}`
                                    }
                                    className="rounded-lg border border-[#dbe3f0] bg-white px-2 py-1 text-[10px] font-bold text-[#52617d]"
                                  >
                                    {
                                      person.username
                                        ? `@${person.username}`
                                        : person.name
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          )}

                          {(() => {
                            const share =
                              getBillShareInfo(
                                bill
                              );

                            return share.count >
                              0 ? (
                              <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-xl bg-[#eef3ff] px-3 py-2 text-xs font-extrabold text-[#294aad]">
                                ₱{money(
                                  bill.amount
                                )} ÷ {share.count} = ₱{money(
                                  share.amountPerPerson
                                )} each
                              </div>
                            ) : null;
                          })()}
                        </div>

                        <p className="shrink-0 font-black text-[#18845c]">
                          ₱
                          {money(
                            bill.amount
                          )}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 border-t border-[#e4e9f1] pt-3">
                        {bill.paymentProofDataUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setProofToView(
                                bill
                              )
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#eef3ff] px-4 text-xs font-extrabold text-[#294aad]"
                          >
                            <Eye
                              size={15}
                            />
                            View Payment Proof
                          </button>
                        )}

                        {bill.paymentWallet && (
                          <button
                            type="button"
                            onClick={() =>
                              setWalletToView(
                                bill.paymentWallet
                              )
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#eef3ff] px-4 text-xs font-extrabold text-[#294aad]"
                          >
                            <QrCode size={15} />
                            View Wallet / QR
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={
                            saving
                          }
                          onClick={() =>
                            onDeleteBill?.(
                              bill
                            )
                          }
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#ffeded] px-4 text-xs font-extrabold text-[#c85353] disabled:opacity-50"
                        >
                          <Trash2
                            size={15}
                          />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </section>

      {paymentTarget && (
        <div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-[#071333]/55 p-3 backdrop-blur-sm sm:items-center"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
                event.currentTarget
            ) {
              closePayment();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-[0_28px_80px_rgba(8,24,70,0.28)]">
            <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/70">
                    Bill Payment
                  </p>

                  <h3 className="mt-1 text-xl font-black">
                    {currentUserIsWalletOwner(
                      paymentTarget
                    )
                      ? "Attach overall payment"
                      : "Attach paid bill screenshot"}
                  </h3>

                  <p className="mt-1 text-xs text-blue-100/75">
                    {
                      paymentTarget.title
                    }{" "}
                    · ₱
                    {money(
                      paymentTarget.amount
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closePayment
                  }
                  disabled={
                    saving
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 disabled:opacity-50"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 rounded-2xl border border-[#cfe9dc] bg-[#eefaf4] p-3">
                <p className="text-xs font-extrabold text-[#18845c]">
                  You will be recorded as the person who settled this bill.
                </p>
                <p className="mt-1 text-[11px] text-[#71809a]">
                  Your workspace account will appear in the paid-bill details and dashboard.
                </p>
              </div>

              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#cbd6ec] bg-[#f8faff] p-5 text-center transition hover:border-[#8da9ef]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={
                    saving ||
                    proofProcessing
                  }
                  onChange={(
                    event
                  ) =>
                    prepareProof(
                      event.target
                        .files?.[0]
                    )
                  }
                />

                {proofProcessing ? (
                  <div className="py-6">
                    <LoaderCircle
                      size={28}
                      className="mx-auto animate-spin text-[#294aad]"
                    />

                    <p className="mt-3 text-sm font-extrabold text-[#52617d]">
                      Preparing screenshot...
                    </p>
                  </div>
                ) : paymentProof ? (
                  <>
                    <img
                      src={
                        paymentProof.dataUrl
                      }
                      alt="Bill payment proof preview"
                      className="mx-auto max-h-64 rounded-xl object-contain shadow-sm"
                    />

                    <p className="mt-3 text-sm font-extrabold text-[#294aad]">
                      Tap to replace screenshot
                    </p>
                  </>
                ) : (
                  <div className="py-6">
                    <FileImage
                      size={32}
                      className="mx-auto text-[#294aad]"
                    />

                    <p className="mt-3 font-extrabold text-[#182442]">
                      Upload payment screenshot
                    </p>

                    <p className="mt-1 text-xs text-[#8995aa]">
                      {currentUserIsWalletOwner(
                        paymentTarget
                      )
                        ? "Attach the final proof showing the entire bill was paid."
                        : "Screenshot of the paid rent, water, electricity, internet, or other bill."}
                    </p>
                  </div>
                )}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-[#e5eaf2] bg-[#fbfcfe] p-4">
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  closePayment
                }
                className="min-h-11 rounded-xl border border-[#dce3ef] bg-white text-sm font-extrabold text-[#52617d] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  proofProcessing ||
                  !paymentProof
                }
                onClick={
                  confirmPaid
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={16}
                  />
                )}

                {currentUserIsWalletOwner(
                  paymentTarget
                )
                  ? "Confirm Overall Payment"
                  : "Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {walletToView && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#071333]/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setWalletToView(
                null
              );
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-[0_28px_80px_rgba(8,24,70,0.30)]">
            <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/70">
                    Payment Wallet
                  </p>
                  <h3 className="mt-1 text-xl font-black">
                    {walletToView.providerName || "Wallet"}
                  </h3>
                  <p className="mt-1 text-xs text-blue-100/80">
                    {walletToView.ownerName || "Workspace member"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setWalletToView(
                      null
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl bg-[#f8faff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Account Name
                </p>
                <p className="mt-1 font-extrabold text-[#182442]">
                  {walletToView.accountName || "Not provided"}
                </p>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Account Number
                </p>
                <p className="mt-1 font-extrabold text-[#182442]">
                  {walletToView.accountNumber || "Not provided"}
                </p>
              </div>

              {walletToView.qrBase64 ? (
                <div className="rounded-2xl border border-[#dce3ef] bg-white p-3">
                  <img
                    src={walletToView.qrBase64}
                    alt={`${walletToView.providerName || "Wallet"} QR`}
                    className="mx-auto max-h-[52dvh] w-full rounded-xl object-contain"
                  />
                  <p className="mt-3 text-center text-[11px] font-bold text-[#71809a]">
                    Scan this QR to pay the attached wallet.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#ccd7ea] bg-[#f8faff] p-6 text-center">
                  <QrCode
                    size={30}
                    className="mx-auto text-[#8fa0bd]"
                  />
                  <p className="mt-2 text-xs font-bold text-[#71809a]">
                    No QR image was attached to this wallet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {proofToView && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#071333]/65 p-4 backdrop-blur-sm"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
                event.currentTarget
            ) {
              setProofToView(
                null
              );
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-[0_28px_80px_rgba(8,24,70,0.30)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#e5eaf2] p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Payment Proof
                </p>

                <h3 className="font-extrabold text-[#182442]">
                  {
                    proofToView.title
                  }
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setProofToView(
                    null
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf1f7] text-[#71809a]"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div className="max-h-[75dvh] overflow-auto bg-[#f5f7fb] p-4">
              <img
                src={
                  proofToView.paymentProofDataUrl
                }
                alt="Payment proof"
                className="mx-auto max-h-[68dvh] rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BillsToPay;

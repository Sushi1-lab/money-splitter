import {
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Plus,
  QrCode,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase.js";

import useAppDialog from "../hooks/useAppDialog.jsx";

function Wallets({
  user,
  profile,
}) {
  const [wallets, setWallets] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    showPaymentMethods,
    setShowPaymentMethods,
  ] = useState(false);

  const [
    showAddWallet,
    setShowAddWallet,
  ] = useState(false);

  const [provider, setProvider] =
    useState("GCash");

  const [
    customProvider,
    setCustomProvider,
  ] = useState("");

  const [
    walletType,
    setWalletType,
  ] = useState("E-Wallet");

  const [
    accountName,
    setAccountName,
  ] = useState("");

  const [
    accountNumber,
    setAccountNumber,
  ] = useState("");

  const [
    qrBase64,
    setQrBase64,
  ] = useState(null);

  const [
    qrPreview,
    setQrPreview,
  ] = useState(null);

  const {
    Dialog,
    success,
    warning,
    error,
    confirm,
  } = useAppDialog();

  const eWalletProviders = [
    "GCash",
    "Maya",
    "GoTyme",
    "SeaBank",
    "Other",
  ];

  const bankProviders = [
    "BPI",
    "BDO",
    "Metrobank",
    "UnionBank",
    "Security Bank",
    "Other",
  ];

  const providers =
    walletType === "Bank"
      ? bankProviders
      : eWalletProviders;

  const handleWalletTypeChange = (
    type
  ) => {
    setWalletType(type);

    setProvider(
      type === "Bank"
        ? "BPI"
        : "GCash"
    );

    setCustomProvider("");
  };

  // =========================================
  // LOAD MY WALLETS
  // =========================================

  const fetchWallets =
    async () => {
      if (!user?.uid) {
        setWallets([]);
        return;
      }

      try {
        setLoading(true);

        const snapshot =
          await getDocs(
            collection(
              db,
              "users",
              user.uid,
              "wallets"
            )
          );

        const data =
          snapshot.docs.map(
            (item) => ({
              id: item.id,
              ...item.data(),
            })
          );

        data.sort((a, b) => {
          const aTime =
            a.createdAt
              ?.seconds ||
            0;

          const bTime =
            b.createdAt
              ?.seconds ||
            0;

          return (
            bTime - aTime
          );
        });

        setWallets(data);
      } catch (err) {
        console.error(
          "Wallet loading error:",
          err
        );

        setWallets([]);

        await error(
          "Unable to Load Wallets",
          "We couldn't load your payment methods."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchWallets();
  }, [user?.uid]);

  // =========================================
  // IMAGE COMPRESSION
  // =========================================

  const compressImage = (
    file
  ) =>
    new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = (
          event
        ) => {
          const image =
            new Image();

          image.onload = () => {
            let width =
              image.width;

            let height =
              image.height;

            const ratio =
              Math.min(
                1200 / width,
                1200 / height,
                1
              );

            width =
              Math.round(
                width * ratio
              );

            height =
              Math.round(
                height * ratio
              );

            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width =
              width;

            canvas.height =
              height;

            const context =
              canvas.getContext(
                "2d"
              );

            if (!context) {
              reject(
                new Error(
                  "Canvas unavailable."
                )
              );

              return;
            }

            context.drawImage(
              image,
              0,
              0,
              width,
              height
            );

            resolve(
              canvas.toDataURL(
                "image/jpeg",
                0.82
              )
            );
          };

          image.onerror =
            reject;

          image.src =
            event.target.result;
        };

        reader.onerror =
          reject;

        reader.readAsDataURL(
          file
        );
      }
    );

  // =========================================
  // QR
  // =========================================

  const handleQr =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        await warning(
          "Invalid QR Image",
          "Please choose an image file."
        );

        event.target.value =
          "";

        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        await warning(
          "QR Image Too Large",
          "The original image must be smaller than 10MB."
        );

        event.target.value =
          "";

        return;
      }

      try {
        const compressed =
          await compressImage(
            file
          );

        if (
          compressed.length >
          700000
        ) {
          await warning(
            "QR Image Too Large",
            "Try a smaller QR screenshot."
          );

          event.target.value =
            "";

          return;
        }

        setQrBase64(
          compressed
        );

        setQrPreview(
          compressed
        );
      } catch (err) {
        console.error(
          "QR error:",
          err
        );

        await error(
          "QR Error",
          "We couldn't process the QR image."
        );
      }
    };

  // =========================================
  // ADD
  // =========================================

  const addWallet =
    async (event) => {
      event.preventDefault();

      if (!user?.uid) {
        return;
      }

      const providerName =
        provider === "Other"
          ? customProvider.trim()
          : provider;

      if (!providerName) {
        await warning(
          "Provider Required",
          "Enter your wallet or bank provider."
        );

        return;
      }

      if (
        !accountName.trim()
      ) {
        await warning(
          "Account Name Required",
          "Enter the account holder's name."
        );

        return;
      }

      try {
        setSaving(true);

        await addDoc(
          collection(
            db,
            "users",
            user.uid,
            "wallets"
          ),
          {
            providerName,

            walletType,

            accountName:
              accountName.trim(),

            accountNumber:
              accountNumber.trim(),

            qrBase64:
              qrBase64 ||
              null,

            ownerUid:
              user.uid,

            ownerEmail:
              user.email
                ?.trim()
                .toLowerCase() ||
              "",

            createdAt:
              serverTimestamp(),
          }
        );

        setProvider(
          "GCash"
        );

        setCustomProvider(
          ""
        );

        setWalletType(
          "E-Wallet"
        );

        setAccountName(
          ""
        );

        setAccountNumber(
          ""
        );

        setQrBase64(
          null
        );

        setQrPreview(
          null
        );

        await fetchWallets();

        setShowAddWallet(false);
        setShowPaymentMethods(true);

        await success(
          "Wallet Added",
          `${providerName} was added to your wallet.`
        );
      } catch (err) {
        console.error(
          "Add wallet error:",
          err
        );

        await error(
          "Unable to Add Wallet",
          "We couldn't save your wallet."
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================
  // DELETE
  // =========================================

  const removeWallet =
    async (wallet) => {
      const approved =
        await confirm({
          type: "danger",

          title:
            "Remove Wallet?",

          message:
            `${wallet.providerName} will be removed from your payment methods.`,

          confirmText:
            "Remove Wallet",
        });

      if (!approved) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "users",
            user.uid,
            "wallets",
            wallet.id
          )
        );

        setWallets(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                wallet.id
            )
        );
      } catch (err) {
        console.error(
          "Delete wallet error:",
          err
        );

        await error(
          "Unable to Remove Wallet",
          "We couldn't remove this wallet."
        );
      }
    };

  // =========================================
  // UI
  // =========================================

  return (
    <section className="space-y-4">
      {/* HEADER */}

      <div className="app-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <WalletCards
                size={22}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
                Payment Details
              </p>

              <h2 className="text-xl font-extrabold">
                My Wallet
              </h2>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-4 rounded-[20px] bg-[#eef3ff] p-4">
            {profile?.photoURL ||
            user?.photoURL ? (
              <img
                src={
                  profile?.photoURL ||
                  user.photoURL
                }
                alt=""
                referrerPolicy="no-referrer"
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#dbe4ff] text-[#142a76]">
                <UserRound
                  size={24}
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-extrabold text-[#182442]">
                {profile?.displayName ||
                  user?.displayName ||
                  "My Wallet"}
              </p>

              {profile?.username && (
                <p className="mt-0.5 truncate text-xs font-bold text-[#294aad]">
                  @{profile.username}
                </p>
              )}

              <p className="mt-1 truncate text-xs text-[#71809a]">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-[#e7f6ef] px-4 py-3 text-xs font-bold leading-5 text-[#16845b]">
            Only you can add or remove payment details from your account.
          </div>
        </div>
      </div>

      {/* COMPACT PAYMENT METHODS */}

      <div className="app-card overflow-hidden">
        <button
          type="button"
          onClick={() =>
            setShowPaymentMethods(
              (current) =>
                !current
            )
          }
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-[#f8faff] sm:p-6"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#142a76]">
              <WalletCards
                size={21}
              />
            </div>

            <div className="min-w-0">
              <h3 className="font-extrabold text-[#182442]">
                My Payment Methods
              </h3>

              <p className="mt-1 text-xs text-[#8995aa]">
                {wallets.length}{" "}
                {wallets.length === 1
                  ? "wallet"
                  : "wallets"}{" "}
                saved
              </p>
            </div>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#294aad]">
            {showPaymentMethods ? (
              <ChevronDown
                size={19}
              />
            ) : (
              <ChevronRight
                size={19}
              />
            )}
          </div>
        </button>

        {showPaymentMethods && (
          <div className="border-t border-[#e3e8f0] p-4 sm:p-6">
            {loading ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#d7deeb] border-t-[#142a76]" />

                <p className="mt-3 text-sm font-bold text-[#8995aa]">
                  Loading wallets...
                </p>
              </div>
            ) : wallets.length ===
              0 ? (
              <div className="rounded-[20px] bg-[#eef2f8] p-7 text-center">
                <QrCode
                  size={30}
                  className="mx-auto text-[#9ba6b9]"
                />

                <p className="mt-3 font-extrabold text-[#52617d]">
                  No Wallet Yet
                </p>

                <p className="mt-1 text-xs text-[#8995aa]">
                  Add a payment method below.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {wallets.map(
                  (wallet) => (
                    <div
                      key={wallet.id}
                      className="overflow-hidden rounded-[22px] bg-gradient-to-br from-[#10245f] to-[#294aad] p-5 text-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100/60">
                            {wallet.walletType ||
                              "Wallet"}
                          </p>

                          <p className="mt-1 text-xl font-extrabold">
                            {wallet.providerName ||
                              "Payment Method"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeWallet(
                              wallet
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>

                      <div className="mt-5">
                        <p className="text-xs text-blue-100/60">
                          Account Name
                        </p>

                        <p className="mt-1 font-bold">
                          {
                            wallet.accountName
                          }
                        </p>

                        {wallet.accountNumber && (
                          <>
                            <p className="mt-3 text-xs text-blue-100/60">
                              Account / Mobile Number
                            </p>

                            <p className="mt-1 break-all font-bold">
                              {
                                wallet.accountNumber
                              }
                            </p>
                          </>
                        )}
                      </div>

                      {wallet.qrBase64 && (
                        <div className="mt-5 rounded-[18px] bg-white p-3">
                          <img
                            src={
                              wallet.qrBase64
                            }
                            alt={`${wallet.providerName} QR`}
                            className="mx-auto max-h-72 w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD PAYMENT METHOD COLLAPSE */}

      <div className="app-card overflow-hidden">
        <button
          type="button"
          onClick={() =>
            setShowAddWallet(
              (current) =>
                !current
            )
          }
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-[#f8faff] sm:p-6"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#142a76]">
              {showAddWallet ? (
                <X
                  size={20}
                />
              ) : (
                <Plus
                  size={20}
                />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-extrabold text-[#182442]">
                Add Payment Method
              </h3>

              <p className="mt-1 text-xs text-[#8995aa]">
                {showAddWallet
                  ? "Hide payment fields"
                  : "Tap to add an e-wallet or bank"}
              </p>
            </div>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#294aad]">
            {showAddWallet ? (
              <ChevronDown
                size={19}
              />
            ) : (
              <ChevronRight
                size={19}
              />
            )}
          </div>
        </button>

        {showAddWallet && (
          <form
            onSubmit={addWallet}
            className="space-y-5 border-t border-[#e3e8f0] p-4 sm:p-6"
          >
            {/* ENHANCED TYPE RADIO */}

            <div>
              <label className="app-label">
                Payment Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    type:
                      "E-Wallet",
                    icon:
                      CreditCard,
                    subtitle:
                      "GCash, Maya, etc.",
                  },
                  {
                    type:
                      "Bank",
                    icon:
                      Building2,
                    subtitle:
                      "BPI, BDO, etc.",
                  },
                ].map(
                  ({
                    type,
                    icon:
                      Icon,
                    subtitle,
                  }) => {
                    const selected =
                      walletType ===
                      type;

                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() =>
                          handleWalletTypeChange(
                            type
                          )
                        }
                        className={`relative flex min-h-[82px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-[#294aad] bg-[#e4ebff] shadow-[0_0_0_1px_#294aad]"
                            : "border-[#dce3ef] bg-[#f7f9fd] text-[#71809a] hover:bg-[#eef3ff]"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-[#294aad] text-white"
                              : "bg-white text-[#71809a]"
                          }`}
                        >
                          <Icon
                            size={18}
                          />
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`font-extrabold ${
                              selected
                                ? "text-[#142a76]"
                                : "text-[#52617d]"
                            }`}
                          >
                            {type}
                          </p>

                          <p className="mt-0.5 text-[11px] text-[#8995aa]">
                            {subtitle}
                          </p>
                        </div>

                        <span
                          className={`absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#294aad] bg-[#294aad]"
                              : "border-[#b9c6d8] bg-white"
                          }`}
                        >
                          {selected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* PROVIDER */}

            <div>
              <label className="app-label">
                {walletType ===
                "Bank"
                  ? "Bank Provider"
                  : "E-Wallet Provider"}
              </label>

              <div className="relative">
                <select
                  value={provider}
                  onChange={(event) => {
                    setProvider(
                      event.target.value
                    );

                    if (
                      event.target
                        .value !==
                      "Other"
                    ) {
                      setCustomProvider(
                        ""
                      );
                    }
                  }}
                  className="app-input appearance-none pr-11"
                >
                  {providers.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
                />
              </div>
            </div>

            {provider ===
              "Other" && (
              <div>
                <label className="app-label">
                  Provider Name
                </label>

                <input
                  value={
                    customProvider
                  }
                  onChange={(event) =>
                    setCustomProvider(
                      event.target.value
                    )
                  }
                  placeholder={
                    walletType ===
                    "Bank"
                      ? "Example: Landbank"
                      : "Example: Coins.ph"
                  }
                  className="app-input"
                />
              </div>
            )}

            {/* ACCOUNT NAME */}

            <div>
              <label className="app-label">
                Account Name
              </label>

              <input
                value={
                  accountName
                }
                onChange={(event) =>
                  setAccountName(
                    event.target.value
                  )
                }
                className="app-input"
                placeholder={
                  profile?.displayName ||
                  user?.displayName ||
                  "Account holder"
                }
              />
            </div>

            {/* ACCOUNT NUMBER */}

            <div>
              <label className="app-label">
                {walletType ===
                "Bank"
                  ? "Account Number"
                  : "Mobile / Account Number"}
              </label>

              <input
                value={
                  accountNumber
                }
                onChange={(event) =>
                  setAccountNumber(
                    event.target.value
                  )
                }
                className="app-input"
                placeholder="Optional"
              />
            </div>

            {/* QR */}

            <div>
              <label className="app-label">
                Payment QR
              </label>

              <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[15px] border border-dashed border-[#b9c6e5] bg-[#eef3ff] font-bold text-[#294aad] transition hover:bg-[#e4ebff]">
                <QrCode
                  size={19}
                />

                Add My QR Screenshot

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQr}
                  className="hidden"
                />
              </label>

              {qrPreview && (
                <div className="mt-3 rounded-[18px] border border-[#dce3ef] bg-white p-3">
                  <img
                    src={qrPreview}
                    alt="QR preview"
                    className="mx-auto max-h-72 w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setQrBase64(
                        null
                      );

                      setQrPreview(
                        null
                      );
                    }}
                    className="mt-3 min-h-10 w-full rounded-xl bg-[#ffeded] text-sm font-bold text-[#cf4646]"
                  >
                    Remove QR
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="app-button-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Plus
                  size={18}
                />
              )}

              {saving
                ? "Saving..."
                : "Add My Wallet"}
            </button>
          </form>
        )}
      </div>

      <Dialog />
    </section>
  );
}

export default Wallets;
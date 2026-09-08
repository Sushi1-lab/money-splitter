import {
  ArrowLeft,
  Building2,
  ChevronRight,
  CreditCard,
  QrCode,
  WalletCards,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase.js";

function WalletViewer({
  person,
  onClose,
}) {
  const [
    wallets,
    setWallets,
  ] = useState([]);

  const [
    selectedWallet,
    setSelectedWallet,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  // =========================================
  // LOAD PERSON'S WALLETS
  // =========================================

  useEffect(() => {
    const loadWallets =
      async () => {
        setSelectedWallet(
          null
        );

        setLoadError(
          ""
        );

        if (!person) {
          setWallets([]);
          setLoading(false);

          return;
        }

        if (
          !person.linkedUid
        ) {
          setWallets([]);
          setLoading(false);

          return;
        }

        try {
          setLoading(true);

          const snapshot =
            await getDocs(
              collection(
                db,
                "users",
                person.linkedUid,
                "wallets"
              )
            );

          const data =
            snapshot.docs.map(
              (item) => ({
                id:
                  item.id,

                ...item.data(),
              })
            );

          data.sort(
            (a, b) => {
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
            }
          );

          setWallets(
            data
          );
        } catch (err) {
          console.error(
            "Wallet viewer error:",
            err
          );

          setWallets(
            []
          );

          setLoadError(
            "We couldn't load this person's payment methods."
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    loadWallets();
  }, [
    person?.linkedUid,
    person?.name,
  ]);

  // =========================================
  // CLOSE ON BACKDROP
  // =========================================

  const handleBackdrop = (
    event
  ) => {
    if (
      event.target ===
      event.currentTarget
    ) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-[#081331]/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      onMouseDown={
        handleBackdrop
      }
    >
      <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#f7f9fd] shadow-[0_25px_80px_rgba(8,19,49,0.3)] sm:max-w-lg sm:rounded-[28px]">
        {/* =====================================
            HEADER
        ====================================== */}

        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <WalletCards
                  size={22}
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100/60">
                  Payment Details
                </p>

                <h2 className="truncate text-xl font-extrabold">
                  {person?.name ||
                    "Person"}
                  's Wallet
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/20"
            >
              <X
                size={20}
              />
            </button>
          </div>
        </div>

        {/* =====================================
            CONTENT
        ====================================== */}

        <div className="p-4 sm:p-6">
          {/* NOT LINKED */}

          {!person
            ?.linkedUid ? (
            <div className="rounded-[22px] bg-[#eef2f8] p-8 text-center">
              <QrCode
                size={32}
                className="mx-auto text-[#9ba6b9]"
              />

              <p className="mt-3 font-extrabold text-[#52617d]">
                Account Not
                Linked
              </p>

              <p className="mt-2 text-sm leading-6 text-[#8995aa]">
                {person?.name ||
                  "This person"}{" "}
                has not linked
                their account yet.
              </p>
            </div>
          ) : loading ? (
            /* LOADING */

            <div className="py-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#d7deeb] border-t-[#142a76]" />

              <p className="mt-3 text-sm font-bold text-[#8995aa]">
                Loading wallets...
              </p>
            </div>
          ) : loadError ? (
            /* ERROR */

            <div className="rounded-[22px] bg-[#ffecec] p-8 text-center">
              <QrCode
                size={32}
                className="mx-auto text-[#d74b4b]"
              />

              <p className="mt-3 font-extrabold text-[#b93d3d]">
                Unable to Load
              </p>

              <p className="mt-2 text-sm text-[#9a6666]">
                {loadError}
              </p>
            </div>
          ) : wallets.length ===
            0 ? (
            /* NO WALLETS */

            <div className="rounded-[22px] bg-[#eef2f8] p-8 text-center">
              <QrCode
                size={32}
                className="mx-auto text-[#9ba6b9]"
              />

              <p className="mt-3 font-extrabold text-[#52617d]">
                No Wallet Yet
              </p>

              <p className="mt-2 text-sm text-[#8995aa]">
                {person?.name ||
                  "This person"}{" "}
                hasn't added a
                payment method yet.
              </p>
            </div>
          ) : !selectedWallet ? (
            /* =================================
               CHOOSE WALLET FIRST
            ================================== */

            <div>
              <div className="mb-5">
                <h3 className="text-lg font-extrabold text-[#182442]">
                  Choose Payment
                  Method
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#8995aa]">
                  Select where you
                  want to send your
                  payment to{" "}
                  {person?.name}.
                </p>
              </div>

              <div className="space-y-3">
                {wallets.map(
                  (wallet) => {
                    const isBank =
                      wallet.walletType ===
                      "Bank";

                    return (
                      <button
                        key={
                          wallet.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedWallet(
                            wallet
                          )
                        }
                        className="flex min-h-[76px] w-full items-center gap-4 rounded-[18px] border border-[#dce3ef] bg-white p-4 text-left shadow-sm transition hover:border-[#aebde5] hover:bg-[#f5f7ff]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#142a76]">
                          {isBank ? (
                            <Building2
                              size={22}
                            />
                          ) : (
                            <CreditCard
                              size={22}
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-[#182442]">
                            {wallet.providerName ||
                              "Payment Method"}
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#8995aa]">
                            {wallet.walletType ||
                              "Wallet"}
                          </p>

                          {wallet.accountNumber && (
                            <p className="mt-1 truncate text-xs text-[#a0aabc]">
                              {
                                wallet.accountNumber
                              }
                            </p>
                          )}
                        </div>

                        <ChevronRight
                          size={20}
                          className="shrink-0 text-[#9ba6b9]"
                        />
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          ) : (
            /* =================================
               SELECTED WALLET
            ================================== */

            <div>
              {/* BACK */}

              <button
                type="button"
                onClick={() =>
                  setSelectedWallet(
                    null
                  )
                }
                className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#e9edf5] px-3 text-sm font-bold text-[#52617d]"
              >
                <ArrowLeft
                  size={16}
                />

                Choose another
                wallet
              </button>

              {/* WALLET */}

              <div className="overflow-hidden rounded-[24px] bg-gradient-to-br from-[#10245f] to-[#294aad] p-5 text-white shadow-[0_16px_40px_rgba(20,42,118,0.2)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100/60">
                      {selectedWallet.walletType ||
                        "Wallet"}
                    </p>

                    <p className="mt-1 text-2xl font-extrabold">
                      {selectedWallet.providerName ||
                        "Payment Method"}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    {selectedWallet.walletType ===
                    "Bank" ? (
                      <Building2
                        size={21}
                      />
                    ) : (
                      <CreditCard
                        size={21}
                      />
                    )}
                  </div>
                </div>

                {/* ACCOUNT */}

                <div className="mt-6">
                  <p className="text-xs text-blue-100/60">
                    Account Name
                  </p>

                  <p className="mt-1 text-lg font-extrabold">
                    {selectedWallet.accountName ||
                      "Not provided"}
                  </p>

                  {selectedWallet.accountNumber && (
                    <>
                      <p className="mt-4 text-xs text-blue-100/60">
                        Account /
                        Mobile Number
                      </p>

                      <p className="mt-1 break-all text-lg font-extrabold">
                        {
                          selectedWallet.accountNumber
                        }
                      </p>
                    </>
                  )}
                </div>

                {/* QR */}

                {selectedWallet.qrBase64 ? (
                  <div className="mt-6">
                    <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-blue-100/70">
                      Scan to Pay
                    </p>

                    <div className="rounded-[20px] bg-white p-4">
                      <img
                        src={
                          selectedWallet.qrBase64
                        }
                        alt={`${selectedWallet.providerName || "Payment"} QR`}
                        className="mx-auto max-h-[360px] w-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl bg-white/10 p-4 text-center text-sm font-bold text-blue-100/70">
                    No QR code
                    available for
                    this payment
                    method.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletViewer;
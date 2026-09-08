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
  query,
  where,
} from "firebase/firestore";

import {
  db,
} from "../firebase.js";

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

  const [
    resolvedUid,
    setResolvedUid,
  ] = useState(
    person?.linkedUid ||
      null
  );

  // =========================================
  // HELPERS
  // =========================================

  const cleanEmail = (
    value
  ) =>
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  const cleanUsername = (
    value
  ) =>
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  const getCreatedAt =
    (wallet) => {
      if (
        wallet
          ?.createdAt
          ?.seconds
      ) {
        return wallet
          .createdAt
          .seconds;
      }

      if (
        wallet
          ?.createdAt
          ?.toMillis
      ) {
        return wallet
          .createdAt
          .toMillis();
      }

      return 0;
    };

  // =========================================
  // LOAD WALLETS FROM ONE UID
  // =========================================

  const loadWalletsFromUid =
    async (uid) => {
      if (!uid) {
        return [];
      }

      console.log(
        "Checking wallets for UID:",
        uid
      );

      const walletSnapshot =
        await getDocs(
          collection(
            db,
            "users",
            uid,
            "wallets"
          )
        );

      const results =
        walletSnapshot.docs.map(
          (walletDoc) => ({
            id:
              walletDoc.id,

            ...walletDoc.data(),

            ownerUid:
              walletDoc.data()
                ?.ownerUid ||
              uid,
          })
        );

      results.sort(
        (a, b) =>
          getCreatedAt(b) -
          getCreatedAt(a)
      );

      console.log(
        `Wallets found for ${uid}:`,
        results
      );

      return results;
    };

  // =========================================
  // FIND ALL USER PROFILES WITH SAME EMAIL
  // =========================================

  const findProfilesByEmail =
    async (
      emailAddress
    ) => {
      const email =
        cleanEmail(
          emailAddress
        );

      if (!email) {
        return [];
      }

      console.log(
        "Searching users with email:",
        email
      );

      const usersQuery =
        query(
          collection(
            db,
            "users"
          ),
          where(
            "email",
            "==",
            email
          )
        );

      const snapshot =
        await getDocs(
          usersQuery
        );

      const profiles =
        snapshot.docs.map(
          (userDoc) => ({
            uid:
              userDoc.id,

            ...userDoc.data(),
          })
        );

      console.log(
        "Profiles using same email:",
        profiles
      );

      return profiles;
    };

  // =========================================
  // FIND THE BEST UID FOR THIS PERSON
  // =========================================

  const resolveWalletOwner =
    async () => {
      const originalUid =
        person?.linkedUid ||
        null;

      const linkedEmail =
        cleanEmail(
          person?.linkedEmail
        );

      const username =
        cleanUsername(
          person?.username
        );

      console.log(
        "WalletViewer person:",
        person
      );

      console.log(
        "Original linkedUid:",
        originalUid
      );

      console.log(
        "Linked email:",
        linkedEmail
      );

      console.log(
        "Username:",
        username
      );

      // =====================================
      // STEP 1:
      // TRY ORIGINAL linkedUid FIRST
      // =====================================

      if (originalUid) {
        try {
          const originalWallets =
            await loadWalletsFromUid(
              originalUid
            );

          if (
            originalWallets.length >
            0
          ) {
            return {
              uid:
                originalUid,

              wallets:
                originalWallets,
            };
          }
        } catch (err) {
          console.error(
            "Unable to load original linked UID wallets:",
            err
          );
        }
      }

      // =====================================
      // STEP 2:
      // IF NO WALLET THERE,
      // SEARCH SAME EMAIL
      // =====================================

      if (!linkedEmail) {
        return {
          uid:
            originalUid,

          wallets:
            [],
        };
      }

      const profiles =
        await findProfilesByEmail(
          linkedEmail
        );

      if (
        profiles.length ===
        0
      ) {
        return {
          uid:
            originalUid,

          wallets:
            [],
        };
      }

      // =====================================
      // SORT CANDIDATES
      //
      // Username match first.
      // Current linkedUid next.
      // Others afterward.
      // =====================================

      const sortedProfiles =
        [...profiles].sort(
          (a, b) => {
            const aUsernameMatch =
              username &&
              cleanUsername(
                a.username
              ) ===
                username;

            const bUsernameMatch =
              username &&
              cleanUsername(
                b.username
              ) ===
                username;

            if (
              aUsernameMatch &&
              !bUsernameMatch
            ) {
              return -1;
            }

            if (
              !aUsernameMatch &&
              bUsernameMatch
            ) {
              return 1;
            }

            if (
              a.uid ===
                originalUid &&
              b.uid !==
                originalUid
            ) {
              return -1;
            }

            if (
              a.uid !==
                originalUid &&
              b.uid ===
                originalUid
            ) {
              return 1;
            }

            return 0;
          }
        );

      console.log(
        "Wallet owner candidates:",
        sortedProfiles
      );

      // =====================================
      // STEP 3:
      // CHECK EVERY SAME-EMAIL PROFILE
      // UNTIL WE FIND WALLETS
      // =====================================

      for (
        const profile of
        sortedProfiles
      ) {
        // We already checked this one.
        if (
          profile.uid ===
          originalUid
        ) {
          continue;
        }

        try {
          const profileWallets =
            await loadWalletsFromUid(
              profile.uid
            );

          if (
            profileWallets.length >
            0
          ) {
            console.log(
              "Wallet owner resolved:",
              profile
            );

            return {
              uid:
                profile.uid,

              wallets:
                profileWallets,
            };
          }
        } catch (err) {
          console.error(
            `Unable to check wallets for ${profile.uid}:`,
            err
          );
        }
      }

      // =====================================
      // NO WALLETS FOUND
      // =====================================

      return {
        uid:
          originalUid ||
          sortedProfiles[0]
            ?.uid ||
          null,

        wallets:
          [],
      };
    };

  // =========================================
  // LOAD
  // =========================================

  useEffect(() => {
    let cancelled =
      false;

    const load =
      async () => {
        setLoading(true);

        setLoadError("");

        setWallets([]);

        setSelectedWallet(
          null
        );

        setResolvedUid(
          person?.linkedUid ||
            null
        );

        if (
          !person
        ) {
          if (!cancelled) {
            setLoading(false);
          }

          return;
        }

        try {
          const result =
            await resolveWalletOwner();

          if (cancelled) {
            return;
          }

          setResolvedUid(
            result.uid
          );

          setWallets(
            result.wallets
          );

          console.log(
            "FINAL WALLET UID:",
            result.uid
          );

          console.log(
            "FINAL WALLETS:",
            result.wallets
          );
        } catch (err) {
          console.error(
            "Wallet loading error:",
            err
          );

          if (!cancelled) {
            setLoadError(
              err?.message ||
                "We couldn't load this person's wallet."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    load();

    return () => {
      cancelled =
        true;
    };
  }, [
    person?.id,
    person?.linkedUid,
    person?.linkedEmail,
    person?.username,
  ]);

  // =========================================
  // PROVIDER ICON
  // =========================================

  const getWalletIcon =
    (wallet) => {
      if (
        wallet?.walletType ===
        "Bank"
      ) {
        return (
          <Building2
            size={21}
          />
        );
      }

      return (
        <WalletCards
          size={21}
        />
      );
    };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#09143d]/45 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-[0_25px_80px_rgba(10,24,70,0.3)]">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#dce5f6] border-t-[#294aad]" />

          <h2 className="mt-5 text-xl font-extrabold text-[#182442]">
            Loading Wallet
          </h2>

          <p className="mt-2 text-sm text-[#71809a]">
            Looking for{" "}
            {person?.name ||
              "this person's"}{" "}
            payment methods.
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (loadError) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#09143d]/45 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(10,24,70,0.3)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4fa] text-[#71809a] transition hover:bg-[#e5eaf3]"
          >
            <X
              size={18}
            />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f0] text-[#c24141]">
            <WalletCards
              size={23}
            />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-[#182442]">
            Unable to Load Wallet
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#71809a]">
            {loadError}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="app-button-primary mt-6 w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // NO LINK / NO EMAIL
  // =========================================

  if (
    !resolvedUid &&
    !person?.linkedEmail
  ) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#09143d]/45 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(10,24,70,0.3)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4fa] text-[#71809a]"
          >
            <X
              size={18}
            />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
            <WalletCards
              size={23}
            />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-[#182442]">
            Account Not Linked
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#71809a]">
            {person?.name ||
              "This person"}{" "}
            does not have a linked Money Splitter account yet.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="app-button-primary mt-6 w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // NO WALLET
  // =========================================

  if (
    wallets.length ===
    0
  ) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#09143d]/45 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(10,24,70,0.3)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4fa] text-[#71809a] transition hover:bg-[#e5eaf3]"
          >
            <X
              size={18}
            />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
            <WalletCards
              size={23}
            />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-[#182442]">
            No Wallet Yet
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#71809a]">
            {person?.name ||
              "This person"}{" "}
            hasn't added a bank or
            e-wallet payment method yet.
          </p>

          <div className="mt-5 rounded-[16px] bg-[#f7f9fd] p-4">
            <p className="text-xs leading-5 text-[#8995aa]">
              We checked the linked
              account and other Money
              Splitter profiles using
              the same email.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="app-button-primary mt-6 w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // CHOOSE PAYMENT METHOD
  // =========================================

  if (!selectedWallet) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#09143d]/45 p-4 backdrop-blur-sm">
        <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white shadow-[0_25px_80px_rgba(10,24,70,0.3)]">
          <div className="sticky top-0 z-10 border-b border-[#e4e9f2] bg-white/95 p-5 backdrop-blur">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4fa] text-[#71809a] transition hover:bg-[#e5eaf3]"
            >
              <X
                size={18}
              />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
              <WalletCards
                size={23}
              />
            </div>

            <h2 className="mt-4 pr-12 text-xl font-extrabold text-[#182442]">
              Choose Payment Method
            </h2>

            <p className="mt-1 text-sm text-[#71809a]">
              Select how you want to
              pay{" "}
              <span className="font-bold text-[#182442]">
                {person?.name}
              </span>
              .
            </p>
          </div>

          <div className="space-y-3 p-5">
            {wallets.map(
              (wallet) => (
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
                  className="flex w-full items-center gap-4 rounded-[20px] border border-[#e0e7f2] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#becdf1] hover:bg-[#f8faff] hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9efff] text-[#294aad]">
                    {getWalletIcon(
                      wallet
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-[#182442]">
                      {wallet.providerName ||
                        "Payment Method"}
                    </p>

                    <p className="mt-1 text-xs text-[#8995aa]">
                      {wallet.walletType ||
                        "Wallet"}

                      {wallet.accountNumber
                        ? ` • ${wallet.accountNumber}`
                        : ""}
                    </p>
                  </div>

                  <ChevronRight
                    size={20}
                    className="shrink-0 text-[#9ca8bc]"
                  />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // SELECTED WALLET
  // =========================================

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#09143d]/45 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white shadow-[0_25px_80px_rgba(10,24,70,0.3)]">
        {/* HEADER */}

        <div className="sticky top-0 z-10 border-b border-[#e4e9f2] bg-white/95 p-5 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4fa] text-[#71809a] transition hover:bg-[#e5eaf3]"
          >
            <X
              size={18}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedWallet(
                null
              )
            }
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#294aad] transition hover:text-[#142a76]"
          >
            <ArrowLeft
              size={17}
            />

            Choose another wallet
          </button>

          <h2 className="mt-4 pr-12 text-xl font-extrabold text-[#182442]">
            {selectedWallet.providerName ||
              "Payment Details"}
          </h2>

          <p className="mt-1 text-sm text-[#71809a]">
            {person?.name}'s payment
            information
          </p>
        </div>

        <div className="p-5">
          {/* PROVIDER */}

          <div className="flex items-center gap-4 rounded-[20px] bg-gradient-to-br from-[#10245f] to-[#294aad] p-5 text-white">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              {selectedWallet.walletType ===
              "Bank" ? (
                <Building2
                  size={23}
                />
              ) : (
                <WalletCards
                  size={23}
                />
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100/60">
                {selectedWallet.walletType ||
                  "Payment Method"}
              </p>

              <p className="mt-1 text-xl font-extrabold">
                {selectedWallet.providerName ||
                  "Wallet"}
              </p>
            </div>
          </div>

          {/* DETAILS */}

          <div className="mt-4 space-y-3">
            {selectedWallet.accountName && (
              <div className="rounded-[18px] border border-[#e2e8f2] bg-[#f8faff] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9aa6ba]">
                  Account Name
                </p>

                <p className="mt-1 font-extrabold text-[#182442]">
                  {
                    selectedWallet.accountName
                  }
                </p>
              </div>
            )}

            {selectedWallet.accountNumber && (
              <div className="rounded-[18px] border border-[#e2e8f2] bg-[#f8faff] p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#294aad]">
                    <CreditCard
                      size={18}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9aa6ba]">
                      Account / Mobile
                      Number
                    </p>

                    <p className="mt-1 break-all font-extrabold text-[#182442]">
                      {
                        selectedWallet.accountNumber
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR */}

          {selectedWallet.qrBase64 ? (
            <div className="mt-5 rounded-[24px] border border-[#dce4f0] bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-extrabold text-[#294aad]">
                <QrCode
                  size={15}
                />

                Scan QR Code
              </div>

              <div className="mx-auto mt-4 max-w-[280px] overflow-hidden rounded-[20px] border border-[#e1e6ef] bg-white p-3">
                <img
                  src={
                    selectedWallet.qrBase64
                  }
                  alt={`${selectedWallet.providerName || "Wallet"} QR code`}
                  className="mx-auto h-auto w-full object-contain"
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-[#8995aa]">
                Confirm the recipient
                name and amount before
                sending your payment.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-[20px] bg-[#f7f9fd] p-5 text-center">
              <QrCode
                size={26}
                className="mx-auto text-[#9aa6ba]"
              />

              <p className="mt-2 font-extrabold text-[#52617d]">
                No QR Code Added
              </p>

              <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                You can still use the
                account information
                above.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="app-button-primary mt-5 w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default WalletViewer;
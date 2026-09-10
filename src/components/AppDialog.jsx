import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LoaderCircle,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import {
  useEffect,
} from "react";

function AppDialog({
  open,
  type = "info",
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const isConfirmation =
    showCancel ||
    type === "danger";

  const types = {
    success: {
      icon:
        CheckCircle2,
      accent:
        "text-[#18845c]",
      iconBg:
        "bg-[#e7f6ef]",
      button:
        "bg-[#142a76] hover:bg-[#10245f]",
    },

    warning: {
      icon:
        AlertTriangle,
      accent:
        "text-[#b7791f]",
      iconBg:
        "bg-[#fff4df]",
      button:
        "bg-[#142a76] hover:bg-[#10245f]",
    },

    danger: {
      icon:
        Trash2,
      accent:
        "text-[#cf4646]",
      iconBg:
        "bg-[#ffeded]",
      button:
        "bg-[#cf4646] hover:bg-[#b93d3d]",
    },

    error: {
      icon:
        XCircle,
      accent:
        "text-[#cf4646]",
      iconBg:
        "bg-[#ffeded]",
      button:
        "bg-[#142a76] hover:bg-[#10245f]",
    },

    info: {
      icon:
        Info,
      accent:
        "text-[#294aad]",
      iconBg:
        "bg-[#eef3ff]",
      button:
        "bg-[#142a76] hover:bg-[#10245f]",
    },
  };

  const style =
    types[type] ||
    types.info;

  const Icon =
    style.icon;

  // Simple messages behave like modern toast notifications.
  // Confirmations stay open until the user chooses an action.
  useEffect(() => {
    if (
      !open ||
      isConfirmation ||
      loading
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          onConfirm?.();
        },
        3200
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    open,
    isConfirmation,
    loading,
    onConfirm,
  ]);

  if (!open) {
    return null;
  }

  const closeToast =
    () => {
      if (loading) {
        return;
      }

      // Use onConfirm so promise-based success/warning/error
      // helpers resolve exactly as they did before.
      onConfirm?.();
    };

  const handleBackdrop =
    (event) => {
      if (
        event.target ===
          event.currentTarget &&
        !loading
      ) {
        onCancel?.();
      }
    };

  // =========================================================
  // MINIMAL TOAST
  // success / info / warning / error
  // =========================================================

  if (!isConfirmation) {
    return (
      <div
        aria-live="polite"
        className="
          pointer-events-none
          fixed inset-x-0 top-0
          z-[9999]
          flex justify-center
          px-3 pt-[max(env(safe-area-inset-top),12px)]
          sm:inset-x-auto sm:right-5 sm:top-5
          sm:block sm:w-[360px] sm:p-0
        "
      >
        <div
          role="status"
          className="
            pointer-events-auto
            w-full max-w-[390px]
            animate-[appToastIn_.22s_ease-out]
            overflow-hidden
            rounded-[18px]
            border border-[#e2e7f0]/90
            bg-white/95
            shadow-[0_16px_45px_rgba(20,42,118,0.14)]
            backdrop-blur-xl
          "
        >
          <div className="flex items-start gap-3 px-4 py-3.5">
            <div
              className={`
                mt-0.5 flex h-8 w-8
                shrink-0 items-center justify-center
                rounded-[10px]
                ${style.iconBg}
                ${style.accent}
              `}
            >
              <Icon
                size={17}
                strokeWidth={2.4}
              />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              {title && (
                <p className="text-[13px] font-extrabold leading-5 text-[#182442]">
                  {title}
                </p>
              )}

              {message && (
                <p
                  className={`
                    whitespace-pre-line
                    text-[12px]
                    leading-[1.55]
                    text-[#71809a]
                    ${title
                      ? "mt-0.5"
                      : ""}
                  `}
                >
                  {message}
                </p>
              )}
            </div>

            {!loading && (
              <button
                type="button"
                aria-label="Close notification"
                onClick={
                  closeToast
                }
                className="
                  -mr-1 -mt-0.5
                  flex h-8 w-8
                  shrink-0 items-center justify-center
                  rounded-[10px]
                  text-[#a0aabd]
                  transition
                  hover:bg-[#f1f4f9]
                  hover:text-[#52617d]
                "
              >
                <X
                  size={16}
                />
              </button>
            )}
          </div>

          {!loading && (
            <div className="h-[2px] overflow-hidden bg-[#edf1f7]">
              <div className="h-full w-full origin-left animate-[appToastTimer_3.2s_linear_forwards] bg-[#294aad]/55" />
            </div>
          )}
        </div>

        <style>
          {`
            @keyframes appToastIn {
              from {
                opacity: 0;
                transform: translateY(-8px) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes appToastTimer {
              from {
                transform: scaleX(1);
              }
              to {
                transform: scaleX(0);
              }
            }
          `}
        </style>
      </div>
    );
  }

  // =========================================================
  // COMPACT CONFIRMATION MODAL
  // delete / leave / destructive actions
  // =========================================================

  return (
    <div
      onMouseDown={
        handleBackdrop
      }
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-[#071334]/35
        p-4
        backdrop-blur-[3px]
      "
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className="
          w-full max-w-[380px]
          animate-[appDialogIn_.18s_ease-out]
          overflow-hidden
          rounded-[22px]
          border border-white/80
          bg-white
          shadow-[0_24px_70px_rgba(8,19,49,0.22)]
        "
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`
                flex h-10 w-10
                shrink-0 items-center justify-center
                rounded-[13px]
                ${style.iconBg}
                ${style.accent}
              `}
            >
              <Icon
                size={20}
                strokeWidth={2.3}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="app-dialog-title"
                className="
                  pr-6
                  text-[16px]
                  font-extrabold
                  leading-6
                  tracking-[-0.01em]
                  text-[#182442]
                "
              >
                {title}
              </h2>

              {message && (
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-[#71809a]">
                  {message}
                </p>
              )}
            </div>

            {!loading && (
              <button
                type="button"
                aria-label="Close"
                onClick={
                  onCancel
                }
                className="
                  -mr-1 -mt-1
                  flex h-8 w-8
                  shrink-0 items-center justify-center
                  rounded-[10px]
                  text-[#a0aabd]
                  transition
                  hover:bg-[#f1f4f9]
                  hover:text-[#52617d]
                "
              >
                <X
                  size={16}
                />
              </button>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            {showCancel && (
              <button
                type="button"
                disabled={
                  loading
                }
                onClick={
                  onCancel
                }
                className="
                  min-h-10
                  rounded-xl
                  bg-[#f0f3f8]
                  px-4
                  text-[13px]
                  font-extrabold
                  text-[#52617d]
                  transition
                  hover:bg-[#e8edf5]
                  disabled:opacity-50
                "
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              disabled={
                loading
              }
              onClick={
                onConfirm
              }
              className={`
                flex min-h-10
                min-w-[92px]
                items-center justify-center
                gap-2
                rounded-xl
                px-4
                text-[13px]
                font-extrabold
                text-white
                transition
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${style.button}
              `}
            >
              {loading && (
                <LoaderCircle
                  size={15}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Working..."
                : confirmText}
            </button>
          </div>
        </div>

        <style>
          {`
            @keyframes appDialogIn {
              from {
                opacity: 0;
                transform: translateY(5px) scale(0.985);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default AppDialog;

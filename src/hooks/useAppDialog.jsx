import {
  useCallback,
  useRef,
  useState,
} from "react";

import AppDialog from "../components/AppDialog.jsx";

function useAppDialog() {
  const [
    dialog,
    setDialog,
  ] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
    showCancel: false,
  });

  const resolveRef =
    useRef(null);

  const closeDialog =
    useCallback(
      (result) => {
        const resolver =
          resolveRef.current;

        resolveRef.current =
          null;

        setDialog(
          (current) => ({
            ...current,
            open: false,
          })
        );

        resolver?.(
          result
        );
      },
      []
    );

  const showDialog =
    useCallback(
      ({
        type = "info",
        title = "Money Manager",
        message = "",
        confirmText = "OK",
        cancelText = "Cancel",
        showCancel = false,
      }) =>
        new Promise(
          (resolve) => {
            // If another lightweight notification is currently
            // open, finish it before showing the next one.
            if (
              resolveRef.current
            ) {
              resolveRef.current(
                false
              );
            }

            resolveRef.current =
              resolve;

            setDialog({
              open: true,
              type,
              title,
              message,
              confirmText,
              cancelText,
              showCancel,
            });
          }
        ),
      []
    );

  const success =
    useCallback(
      (
        title,
        message
      ) =>
        showDialog({
          type:
            "success",
          title,
          message,
          confirmText:
            "Done",
        }),
      [
        showDialog,
      ]
    );

  const error =
    useCallback(
      (
        title,
        message
      ) =>
        showDialog({
          type:
            "error",
          title,
          message,
          confirmText:
            "OK",
        }),
      [
        showDialog,
      ]
    );

  const info =
    useCallback(
      (
        title,
        message
      ) =>
        showDialog({
          type:
            "info",
          title,
          message,
          confirmText:
            "OK",
        }),
      [
        showDialog,
      ]
    );

  const warning =
    useCallback(
      (
        title,
        message
      ) =>
        showDialog({
          type:
            "warning",
          title,
          message,
          confirmText:
            "OK",
        }),
      [
        showDialog,
      ]
    );

  const confirm =
    useCallback(
      ({
        type = "warning",
        title,
        message,
        confirmText = "Confirm",
        cancelText = "Cancel",
      }) =>
        showDialog({
          type,
          title,
          message,
          confirmText,
          cancelText,
          showCancel:
            true,
        }),
      [
        showDialog,
      ]
    );

  const Dialog =
    useCallback(
      () => (
        <AppDialog
          {...dialog}
          onConfirm={() =>
            closeDialog(
              true
            )
          }
          onCancel={() =>
            closeDialog(
              false
            )
          }
        />
      ),
      [
        dialog,
        closeDialog,
      ]
    );

  return {
    Dialog,
    success,
    error,
    info,
    warning,
    confirm,
  };
}

export default useAppDialog;

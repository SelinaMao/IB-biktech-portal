"use client";

import React from "react";

import ApproveTransfer from "./ApproveTransfer";
import BaseOTP from "./BaseOTP";
import ChooseVerifyDialog from "./ChooseVerifyDialog";
import QrConfirmationDialog from "./QrConfirmationDialog";
import { showToast } from "./AppToast";

type Step = "choose" | "mobile" | "sms" | "qr";

export type VerifyActionFlowProps = {
  open: boolean;
  /** Closes the whole flow (back arrow on the method picker, or the caller cancelling it). */
  onClose: () => void;
  /** Fired once any method confirms the action. */
  onVerified: () => void;
  /** Masked phone shown on the method picker and the OTP step. */
  targetPhone?: string;
  /** What's being authorized, in the user's words — e.g. "transfer", "payment". Feeds the mobile-app approval copy. */
  subject?: string;
  /**
   * Overrides the built-in mocked "Send on mobile app" step (e.g. to kick off a real
   * backend push-authorization flow instead). When given, the picker closes immediately
   * and this is called instead of showing ApproveTransfer — the caller then owns what's
   * shown next.
   */
  onSelectMobileApp?: () => void | Promise<void>;
};

/**
 * Reusable 2-step verification flow: method picker (mobile app / SMS / QR) followed by
 * whichever confirmation screen matches the chosen method. Every screen is mocked —
 * each one resolves as soon as the user acts on it — so this is meant for flows without
 * a real backend challenge; pass `onSelectMobileApp` to delegate to one when there is.
 */
export default function VerifyActionFlow({
  open,
  onClose,
  onVerified,
  targetPhone,
  subject,
  onSelectMobileApp,
}: VerifyActionFlowProps) {
  const [step, setStep] = React.useState<Step>("choose");

  // Every re-open starts back at the method picker.
  React.useEffect(() => {
    if (open) setStep("choose");
  }, [open]);

  const backToChoose = () => setStep("choose");

  const handleSelectMobileApp = async () => {
    if (onSelectMobileApp) {
      onClose();
      await onSelectMobileApp();
      return;
    }
    setStep("mobile");
  };

  const handleSelectSms = () => {
    showToast("info", {
      title: "SMS Verification",
      message: "A verification code has been sent to your phone.",
    });
    setStep("sms");
  };

  const handleSelectQr = () => setStep("qr");

  const handleVerified = () => {
    setStep("choose");
    onVerified();
  };

  return (
    <>
      <ChooseVerifyDialog
        open={open && step === "choose"}
        onClose={onClose}
        onBack={onClose}
        targetPhone={targetPhone}
        onSelectMobileApp={() => void handleSelectMobileApp()}
        onSelectSms={handleSelectSms}
        onSelectQr={handleSelectQr}
      />

      <ApproveTransfer
        open={open && step === "mobile"}
        onClose={backToChoose}
        // No push received — QR is the fallback channel.
        onNotReceived={() => setStep("qr")}
        onApprove={handleVerified}
        title={subject ? `Approve ${subject} using the mobile app` : undefined}
      />

      <BaseOTP
        open={open && step === "sms"}
        onClose={backToChoose}
        onVerify={() => handleVerified()}
        onResend={handleSelectSms}
        phone={targetPhone}
      />

      <QrConfirmationDialog
        open={open && step === "qr"}
        onClose={backToChoose}
        onApprove={handleVerified}
      />
    </>
  );
}

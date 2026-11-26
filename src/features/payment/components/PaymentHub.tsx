"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { showToast } from "@core/components/AppToast";
import { useTopBarBreadcrumb } from "@core/layout";
import { toToastError } from "@/utils/api-error";
import {
  useDeleteTransferTemplateMutation,
  useListTransferTemplatesQuery,
  useRenameTransferTemplateMutation,
} from "@/features/transfer/transfer.api";
import { PAYMENT_ACTION_CARDS } from "../payment.data";
import type { BillProvider, PaymentActionSlug, PaymentTemplate } from "../payment.types";
import BillPaymentView from "./BillPaymentView";
import DeleteTemplateDialog from "./DeleteTemplateDialog";
import EditTemplateDialog from "./EditTemplateDialog";
import MobileTopUpView from "./MobileTopUpView";
import PayBillDialog from "./PayBillDialog";
import PaymentActionCards from "./PaymentActionCards";
import PaymentTemplatesTable from "./PaymentTemplatesTable";

export interface PaymentHubProps {
  initialView?: "main" | "bill-payment" | "mobile-topup";
}

export default function PaymentHub({ initialView = "main" }: PaymentHubProps) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<"main" | "bill-payment" | "mobile-topup">(initialView);
  const [editingTemplate, setEditingTemplate] = useState<PaymentTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<PaymentTemplate | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payTargetProvider, setPayTargetProvider] = useState<BillProvider | null>(null);
  const { data: serverTemplates = [], isLoading, isError } = useListTransferTemplatesQuery(undefined, {
    pollingInterval: 30_000,
  });
  const [renameTemplate, { isLoading: isRenaming }] = useRenameTransferTemplateMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteTransferTemplateMutation();

  const templates = useMemo<PaymentTemplate[]>(() => serverTemplates.map((template) => {
    const providerName = template.toAccountName || (template.bankCode ? `Bank ${template.bankCode}` : "Saved receiver");
    const initials = providerName.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
    const type = template.transferType.replaceAll("_", " ").toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) as PaymentTemplate["type"];
    return {
      id: template.id,
      name: template.templateName,
      type,
      providerName,
      providerInitials: initials || "SR",
      correspondentId: template.toAccountNumber,
      createdAt: template.createdAt,
    };
  }), [serverTemplates]);

  const handleBackToMain = () => {
    setCurrentView("main");
    if (typeof window !== "undefined" && window.location.pathname.includes("/payment/")) {
      router.push("/payment");
    }
  };

  useTopBarBreadcrumb(
    currentView === "bill-payment"
      ? { prefix: "Payment", subPrefix: "Bill Payment", onBack: handleBackToMain }
      : currentView === "mobile-topup"
        ? { prefix: "Payment", subPrefix: "Mobile Top-up", onBack: handleBackToMain }
        : null,
  );

  const handleSelectAction = (slug: PaymentActionSlug) => {
    if (slug === "bill-payment") setCurrentView("bill-payment");
    else if (slug === "mobile-topup") setCurrentView("mobile-topup");
    else showToast("info", {
      title: "Charity & Donation",
      message: "Charity payments are not available yet.",
    });
  };

  const handleSelectProviderForPayment = (provider: BillProvider) => {
    setPayTargetProvider(provider);
    setPayDialogOpen(true);
  };

  const handleUpdateTemplate = async (template: PaymentTemplate) => {
    try {
      await renameTemplate({ id: template.id, templateName: template.name }).unwrap();
      showToast("success", { title: "Template renamed", message: `Saved receiver renamed to “${template.name}”.` });
      setEditingTemplate(null);
    } catch (error) {
      showToast("error", toToastError(error, "Could not rename saved receiver"));
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteTemplate(deletingTemplate.id).unwrap();
      showToast("success", { title: "Template deleted", message: `“${deletingTemplate.name}” was removed.` });
      setDeletingTemplate(null);
    } catch (error) {
      showToast("error", toToastError(error, "Could not delete saved receiver"));
    }
  };

  if (currentView === "bill-payment") {
    return (
      <Box sx={{ width: "100%" }}>
        <BillPaymentView onSelectProvider={handleSelectProviderForPayment} />
        <PayBillDialog
          key={payTargetProvider?.providerId ?? "bill-payment"}
          open={payDialogOpen}
          onClose={() => setPayDialogOpen(false)}
          provider={payTargetProvider}
        />
      </Box>
    );
  }

  if (currentView === "mobile-topup") {
    return (
      <Box sx={{ width: "100%" }}>
        <MobileTopUpView
          key="new-mobile-topup"
          initialTemplate={null}
          onBackToPayments={handleBackToMain}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={4}>
        <PaymentActionCards cards={PAYMENT_ACTION_CARDS} onSelectAction={handleSelectAction} />
        {isError && <Alert severity="error">Could not load saved receivers from the payment service.</Alert>}
        <PaymentTemplatesTable
          templates={templates}
          loading={isLoading || isRenaming || isDeleting}
          onEditTemplate={setEditingTemplate}
          onDeleteTemplate={setDeletingTemplate}
        />
      </Stack>

      <EditTemplateDialog
        open={Boolean(editingTemplate)}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onUpdate={handleUpdateTemplate}
      />
      <DeleteTemplateDialog
        open={Boolean(deletingTemplate)}
        template={deletingTemplate}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={handleDeleteTemplate}
      />
    </Box>
  );
}

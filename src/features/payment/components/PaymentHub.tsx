"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { showToast } from "@core/components/AppToast";
import { useTopBarBreadcrumb } from "@core/layout";
import {
  useDeleteTransferTemplateMutation,
  useListTransferTemplatesQuery,
  useRenameTransferTemplateMutation,
} from "@/features/transfer/transfer.api";
import { BILL_PROVIDERS, PAYMENT_ACTION_CARDS } from "../payment.data";
import {
  deleteSavedPaymentTemplate,
  loadSavedPaymentTemplates,
  PAYMENT_TEMPLATES_UPDATED_EVENT,
  updateSavedPaymentTemplate,
} from "../payment.templates";
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
  const [selectedTemplate, setSelectedTemplate] = useState<PaymentTemplate | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payTargetProvider, setPayTargetProvider] = useState<BillProvider | null>(null);
  const { data: serverTemplates = [], isLoading, isError } = useListTransferTemplatesQuery(undefined, {
    pollingInterval: 30_000,
  });
  const [renameTemplate, { isLoading: isRenaming }] = useRenameTransferTemplateMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteTransferTemplateMutation();

  const [localTemplates, setLocalTemplates] = useState<PaymentTemplate[]>(() => {
    return loadSavedPaymentTemplates();
  });

  useEffect(() => {
    const handleUpdate = () => {
      setLocalTemplates(loadSavedPaymentTemplates());
    };
    window.addEventListener(PAYMENT_TEMPLATES_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(PAYMENT_TEMPLATES_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const templates = useMemo<PaymentTemplate[]>(() => {
    const serverMapped: PaymentTemplate[] = serverTemplates.map((template) => {
      const providerName = template.toAccountName || (template.bankCode ? `Bank ${template.bankCode}` : "Saved receiver");
      const initials = providerName.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
      let type = template.transferType.replaceAll("_", " ").toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) as PaymentTemplate["type"];

      const rawType = template.transferType.toUpperCase();
      if (rawType.includes("PHONE") || rawType.includes("TOPUP") || rawType.includes("MOBILE")) {
        type = "Mobile top-up";
      } else if (rawType.includes("BILL") || rawType.includes("UTILITY")) {
        type = "Bill payment";
      }

      return {
        id: template.id,
        name: template.templateName,
        type,
        providerName,
        providerInitials: initials || "SR",
        correspondentId: template.toAccountNumber,
        createdAt: template.createdAt,
      };
    });

    const seen = new Set<string>();
    const merged: PaymentTemplate[] = [];

    // Local templates first (persists both billing and mobile templates side-by-side)
    for (const item of localTemplates) {
      seen.add(item.id);
      merged.push(item);
    }

    // Server templates without overriding
    for (const item of serverMapped) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }

    return merged;
  }, [serverTemplates, localTemplates]);

  const handleBackToMain = () => {
    setSelectedTemplate(null);
    setPayTargetProvider(null);
    setLocalTemplates(loadSavedPaymentTemplates());
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
    setSelectedTemplate(null);
    setPayTargetProvider(null);
    if (slug === "bill-payment") setCurrentView("bill-payment");
    else if (slug === "mobile-topup") setCurrentView("mobile-topup");
    else showToast("info", {
      title: "Charity & Donation",
      message: "Charity payments are not available yet.",
    });
  };

  const handleSelectProviderForPayment = (provider: BillProvider) => {
    setSelectedTemplate(null);
    setPayTargetProvider(provider);
    setPayDialogOpen(true);
  };

  const handleSelectTemplate = (template: PaymentTemplate) => {
    setSelectedTemplate(template);
    const typeLower = template.type.toLowerCase();
    if (typeLower.includes("mobile") || typeLower.includes("phone") || typeLower.includes("topup")) {
      setCurrentView("mobile-topup");
    } else {
      const matchedProvider = BILL_PROVIDERS.find(
        (p) =>
          p.providerId === template.providerId ||
          p.name.toLowerCase() === template.providerName.trim().toLowerCase(),
      );
      setPayTargetProvider(matchedProvider ?? null);
      setPayDialogOpen(true);
    }
  };

  const handleUpdateTemplate = async (template: PaymentTemplate) => {
    updateSavedPaymentTemplate(template);
    setLocalTemplates(loadSavedPaymentTemplates());
    if (!template.id.startsWith("local-") && !template.id.startsWith("tpl-default-")) {
      try {
        await renameTemplate({ id: template.id, templateName: template.name }).unwrap();
      } catch {
        // Fallback gracefully since local update succeeded
      }
    }
    showToast("success", { title: "Template renamed", message: `Saved receiver renamed to “${template.name}”.` });
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    deleteSavedPaymentTemplate(deletingTemplate.id);
    setLocalTemplates(loadSavedPaymentTemplates());
    if (!deletingTemplate.id.startsWith("local-") && !deletingTemplate.id.startsWith("tpl-default-")) {
      try {
        await deleteTemplate(deletingTemplate.id).unwrap();
      } catch {
        // Fallback gracefully since local delete succeeded
      }
    }
    showToast("success", { title: "Template deleted", message: `“${deletingTemplate.name}” was removed.` });
    setDeletingTemplate(null);
  };

  if (currentView === "bill-payment") {
    return (
      <Box sx={{ width: "100%" }}>
        <BillPaymentView onSelectProvider={handleSelectProviderForPayment} />
        <PayBillDialog
          key={selectedTemplate?.id ?? payTargetProvider?.providerId ?? "bill-payment"}
          open={payDialogOpen}
          onClose={() => {
            setPayDialogOpen(false);
            setSelectedTemplate(null);
            setPayTargetProvider(null);
          }}
          template={selectedTemplate}
          provider={payTargetProvider}
        />
      </Box>
    );
  }

  if (currentView === "mobile-topup") {
    return (
      <Box sx={{ width: "100%" }}>
        <MobileTopUpView
          key={selectedTemplate?.id ?? "new-mobile-topup"}
          initialTemplate={selectedTemplate}
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
          onSelectTemplate={handleSelectTemplate}
          onEditTemplate={setEditingTemplate}
          onDeleteTemplate={setDeletingTemplate}
        />
      </Stack>

      <PayBillDialog
        key={selectedTemplate?.id ?? payTargetProvider?.providerId ?? "main-pay-bill"}
        open={payDialogOpen}
        onClose={() => {
          setPayDialogOpen(false);
          setSelectedTemplate(null);
          setPayTargetProvider(null);
        }}
        template={selectedTemplate}
        provider={payTargetProvider}
      />

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

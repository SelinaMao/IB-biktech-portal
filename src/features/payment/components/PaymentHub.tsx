"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { showToast } from "@core/components/AppToast";
import { useTopBarBreadcrumb } from "@core/layout";
import { INITIAL_PAYMENT_TEMPLATES, PAYMENT_ACTION_CARDS } from "../payment.data";
import type {
  BillProvider,
  PaymentActionSlug,
  PaymentTemplate,
} from "../payment.types";
import BillPaymentView from "./BillPaymentView";
import CreateTemplateDialog from "./CreateTemplateDialog";
import DeleteTemplateDialog from "./DeleteTemplateDialog";
import EditTemplateDialog from "./EditTemplateDialog";
import PayBillDialog from "./PayBillDialog";
import PaymentActionCards from "./PaymentActionCards";
import PaymentTemplatesTable from "./PaymentTemplatesTable";

export interface PaymentHubProps {
  initialView?: "main" | "bill-payment";
}

export default function PaymentHub({ initialView = "main" }: PaymentHubProps) {
  const [currentView, setCurrentView] = useState<"main" | "bill-payment">(initialView);
  const [templates, setTemplates] = useState<PaymentTemplate[]>(INITIAL_PAYMENT_TEMPLATES);

  // When on main view: null -> TopBar displays just "Payment"
  // When on a card subview (e.g. Bill Payment): displays "< Payment / Bill Payements"
  useTopBarBreadcrumb(
    currentView === "bill-payment"
      ? {
          prefix: "Payments",
          subPrefix: "Bill Payements",
          onBack: () => setCurrentView("main"),
        }
      : null,
  );

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PaymentTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<PaymentTemplate | null>(null);

  // Pay Dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payTargetTemplate, setPayTargetTemplate] = useState<PaymentTemplate | null>(null);
  const [payTargetProvider, setPayTargetProvider] = useState<BillProvider | null>(null);

  // Handlers
  const handleSelectAction = (slug: PaymentActionSlug) => {
    if (slug === "bill-payment") {
      setCurrentView("bill-payment");
    } else {
      showToast("info", {
        title: slug === "mobile-topup" ? "Mobile Top-up" : "Charity & Donation",
        message: "This service flow will open with connected telecom/charity rails.",
      });
    }
  };

  const handleCreateTemplate = (newTemplateData: Omit<PaymentTemplate, "id" | "createdAt">) => {
    const today = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const created: PaymentTemplate = {
      ...newTemplateData,
      id: `tpl-${Date.now()}`,
      createdAt: today,
    };

    setTemplates((prev) => [created, ...prev]);
    showToast("success", {
      title: "Template created",
      message: `Template "${created.name}" has been added.`,
    });
  };

  const handleUpdateTemplate = (updated: PaymentTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    showToast("success", {
      title: "Template updated",
      message: `Template "${updated.name}" has been updated.`,
    });
  };

  const handleDeleteTemplate = () => {
    if (!deletingTemplate) return;
    setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplate.id));
    showToast("success", {
      title: "Template deleted",
      message: `Template "${deletingTemplate.name}" was removed.`,
    });
    setDeletingTemplate(null);
  };

  const handleSelectTemplateForPayment = (template: PaymentTemplate) => {
    setPayTargetTemplate(template);
    setPayTargetProvider(null);
    setPayDialogOpen(true);
  };

  const handleSelectProviderForPayment = (provider: BillProvider) => {
    setPayTargetProvider(provider);
    setPayTargetTemplate(null);
    setPayDialogOpen(true);
  };

  if (currentView === "bill-payment") {
    return (
      <Box sx={{ width: "100%" }}>
        <BillPaymentView
          onSelectProvider={handleSelectProviderForPayment}
        />

        <PayBillDialog
          open={payDialogOpen}
          onClose={() => setPayDialogOpen(false)}
          template={payTargetTemplate}
          provider={payTargetProvider}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={4}>
        {/* Top 3 Action Cards (Image 1) */}
        <PaymentActionCards
          cards={PAYMENT_ACTION_CARDS}
          onSelectAction={handleSelectAction}
        />

        {/* Payment Templates Table Card (Image 1) */}
        <PaymentTemplatesTable
          templates={templates}
          onAddTemplate={() => setCreateDialogOpen(true)}
          onEditTemplate={(tpl) => setEditingTemplate(tpl)}
          onDeleteTemplate={(tpl) => setDeletingTemplate(tpl)}
          onSelectTemplate={handleSelectTemplateForPayment}
        />
      </Stack>

      {/* Dialogs */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateTemplate}
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

      <PayBillDialog
        open={payDialogOpen}
        onClose={() => setPayDialogOpen(false)}
        template={payTargetTemplate}
        provider={payTargetProvider}
      />
    </Box>
  );
}

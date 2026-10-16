"use client";

import React from "react";
import Stack from "@mui/material/Stack";
import { Globe } from "lucide-react";

import BaseFileUpload from "@core/form/BaseFileUpload";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { accountOptionLabel, accountSelectOptions, findAccount } from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";

export type BulkTransferProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: "",
  files: [] as File[],
  remark: "",
};

export default function BulkTransfer({ open, onClose }: BulkTransferProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts } = useTransferAccounts(open);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const fromAccountId = values.fromAccountId || accounts[0]?.id || "";
  const fromAccount = findAccount(accounts, fromAccountId);

  React.useEffect(() => {
    if (!values.fromAccountId && accounts[0]?.id) {
      set("fromAccountId", accounts[0].id);
    }
  }, [accounts, values.fromAccountId]);

  const fileName = values.files[0]?.name;

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Recipients File", value: fileName ?? "-" },
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  return (
    <PreviewTransfer
      open={open}
      onClose={onClose}
      title="Bulk Transfer"
      icon={<Globe size={18} />}
      canSubmit={Boolean(fromAccountId && values.files.length > 0)}
      previewFields={previewFields}
      successMessage={`${fileName ?? "Recipients file"} processed from ${fromAccount?.name ?? "the selected account"}.`}
      onReset={() => setValues(INITIAL_VALUES)}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="From Account"
          value={fromAccountId}
          onChange={(e) => set("fromAccountId", e.target.value as string)}
          options={accountSelectOptions(accounts)}
        />
        <BaseFileUpload
          label="Recipients File"
          value={values.files}
          onChange={(files) => set("files", files)}
          accept=".csv,.xlsx"
          helperText="CSV or Excel — one recipient per row"
        />
        <BaseTextArea
          label="Remark"
          value={values.remark}
          onChange={(e) => set("remark", e.target.value)}
          placeholder="Optional note"
        />
      </Stack>
    </PreviewTransfer>
  );
}

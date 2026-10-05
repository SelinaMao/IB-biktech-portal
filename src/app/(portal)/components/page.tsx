"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseDialog from "@core/components/BaseDialog";
import { showToast } from "@core/components/AppToast";
import { SwitchLanguageMenu } from "@core/components/SwitchLanguageMenu";
import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import {
  BaseSwitch,
  ControlledBaseCheckbox,
  ControlledBaseFileUpload,
  ControlledBaseInput,
  ControlledBaseRadioGroup,
  ControlledBaseSelect,
  ControlledBaseTextArea,
  ControlledBaseSwitch,
} from "@core/form";
import { font, palette } from "@/theme/palette";
import { PHONE_DIAL_CODE } from "@/utils/phone";

/* ---------------------------------------------------------------- */
/* Helpers                                                          */
/* ---------------------------------------------------------------- */

function Section({
  title,
  usage,
  children,
}: {
  title: string;
  /** Import / usage snippet shown under the title. */
  usage: string;
  children: React.ReactNode;
}) {
  return (
    <BaseCard sx={{ p: 0, mb: 3 }}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        <Typography
          component="code"
          sx={{
            display: "block",
            fontFamily: "monospace",
            fontSize: font.size.sm,
            color: "text.secondary",
            bgcolor: palette.slate[50],
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: 1,
            px: 1.5,
            py: 0.75,
            mb: 2.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {usage}
        </Typography>
        {children}
      </CardContent>
    </BaseCard>
  );
}

function SwatchRow({
  label,
  scale,
}: {
  label: string;
  scale: Record<string | number, string>;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
        {Object.entries(scale)
          .filter(([, v]) => typeof v === "string")
          .map(([step, color]) => (
            <Tooltip key={step} title={`${label}.${step} — ${color}`}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: color,
                  borderRadius: 1,
                  border: `1px solid ${palette.slate[200]}`,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{ fontSize: 9, color: "rgba(0,0,0,0.55)", mb: 0.25 }}
                >
                  {step}
                </Typography>
              </Box>
            </Tooltip>
          ))}
      </Stack>
    </Box>
  );
}

/* ---------------------------------------------------------------- */
/* Demo form (react-hook-form wiring for Controlled* components)    */
/* ---------------------------------------------------------------- */

type DemoFormValues = {
  input: string;
  requiredInput: string;
  select: string;
  textarea: string;
  checkbox: boolean;
  radio: string;
  files: File[];
  switch: boolean;
  customSwitch: string;
};

const SELECT_OPTIONS = [
  { value: "khr", label: "KHR — Riel" },
  { value: "usd", label: "USD — Dollar" },
  { value: "disabled", label: "Disabled option", disabled: true },
];

const RADIO_OPTIONS = [
  { value: "maker", label: "Maker" },
  { value: "checker", label: "Checker" },
];

export default function ComponentsPage() {
  const { control, handleSubmit } = useForm<DemoFormValues>({
    defaultValues: {
      input: "",
      requiredInput: "",
      select: "khr",
      textarea: "",
      checkbox: true,
      radio: "maker",
      files: [],
      switch: false,
      customSwitch: "USD",
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dividerOpen, setDividerOpen] = useState(false);

  const onSubmit = (values: DemoFormValues) =>
    showToast("info", {
      title: "Form values",
      message: JSON.stringify(values),
    });

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Core Components
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Living usage doc for src/@core. All styling comes from the theme
        (src/theme) — if a component looks wrong here, fix the theme, not the
        call site.
      </Typography>

      {/* ------------------------ Tokens ------------------------ */}
      <Section
        title="Design tokens"
        usage={`import { palette, font, radius } from "@/theme/palette";`}
      >
        <SwatchRow label="primary" scale={palette.primary} />
        <SwatchRow label="info" scale={palette.info} />
        <SwatchRow label="success" scale={palette.success} />
        <SwatchRow label="warning" scale={palette.warning} />
        <SwatchRow label="danger" scale={palette.danger} />
        <SwatchRow label="slate" scale={palette.slate} />
        <SwatchRow label="navy (sidebar only)" scale={palette.navy} />
      </Section>

      {/* ---------------------- Typography ---------------------- */}
      <Section
        title="Typography"
        usage={`<Typography variant="h1|h2|h3|h4|h5|h6|subtitle1|subtitle2|body1|body2|caption" />
Sizes come from font.size — never hardcode rem/px at call sites.`}
      >
        <Typography variant="h1">h1 — 2.25rem bold</Typography>
        <Typography variant="h2">h2 — 1.875rem bold</Typography>
        <Typography variant="h3">h3 — 1.5rem bold</Typography>
        <Typography variant="h4">h4 — 1.25rem semibold</Typography>
        <Typography variant="h5">h5 — 1.125rem semibold</Typography>
        <Typography variant="h6">h6 — 1rem semibold</Typography>
        <Typography variant="subtitle1">subtitle1 — 1rem medium</Typography>
        <Typography variant="subtitle2">
          subtitle2 — 0.875rem semibold
        </Typography>
        <Typography variant="body1">body1 — 1rem regular</Typography>
        <Typography variant="body2">body2 — 0.875rem regular</Typography>
        <Typography variant="caption">caption — 0.75rem</Typography>
      </Section>

      {/* ----------------------- BaseButton ---------------------- */}
      <Section
        title="BaseButton"
        usage={`import BaseButton from "@core/components/BaseButton";
<BaseButton title="Save" variant="contained" isLoading={saving} startIcon={<SaveOutlinedIcon />} />`}
      >
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <BaseButton title="Contained" variant="contained" />
          <BaseButton title="Outlined" variant="outlined" />
          <BaseButton title="Text" variant="text" />
          <BaseButton title="Secondary" variant="contained" color="secondary" />
          <BaseButton title="Error" variant="contained" color="error" />
        </Stack>
        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", gap: 1.5, alignItems: "center" }}
        >
          <BaseButton title="Small" variant="contained" size="small" />
          <BaseButton title="Medium" variant="contained" size="medium" />
          <BaseButton title="Large" variant="contained" size="large" />
          <BaseButton title="Loading" variant="contained" isLoading />
          <BaseButton title="Disabled" variant="contained" disabled />
          <BaseButton
            title="With icon"
            variant="outlined"
            startIcon={<SaveOutlinedIcon />}
          />
        </Stack>
      </Section>

      {/* ------------------- Form components --------------------- */}
      <Section
        title="Form components (react-hook-form)"
        usage={`import { ControlledBaseInput, ControlledBaseSelect, ControlledBaseTextArea,
         ControlledBaseCheckbox, ControlledBaseRadioGroup } from "@core/form";
<ControlledBaseInput name="field" control={control} label="Label" isRequired />
NOTE: never pass \`disabled\` into useController — visual prop only (see ControlledBaseInput).`}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
            <ControlledBaseInput
              name="input"
              control={control}
              label="Text input"
              helperText="Helper text"
            />
            <ControlledBaseInput
              name="requiredInput"
              control={control}
              label="Required input"
              isRequired
              rules={{ required: "This field is required" }}
            />
            <ControlledBaseSelect
              name="select"
              control={control}
              label="Select"
              options={SELECT_OPTIONS}
            />
            <ControlledBaseTextArea
              name="textarea"
              control={control}
              label="Text area"
              minRows={3}
            />
            <ControlledBaseRadioGroup
              name="radio"
              control={control}
              label="Radio group"
              options={RADIO_OPTIONS}
            />
            <ControlledBaseCheckbox
              name="checkbox"
              control={control}
              label="Checkbox with label"
            />
            <ControlledBaseSwitch
              name="switch"
              control={control}
              label="Standard Switch"
            />
            <ControlledBaseSwitch
              name="customSwitch"
              control={control}
              label="Custom Switch (USD / KHR)"
              options={[
                { value: "USD", label: "USD" },
                { value: "KHR", label: "KHR" },
              ]}
            />
            <ControlledBaseFileUpload
              name="files"
              control={control}
              label="Attachments"
              multiple
              maxSizeMb={5}
              accept="image/*,.pdf"
              helperText="Images or PDF, max 5 MB each"
            />
            <Box>
              <BaseButton
                title="Submit (shows values)"
                type="submit"
                variant="contained"
              />
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Dumb variants (no form logic) & states
        </Typography>
        <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
          <BaseInput label="Label on top (default)" placeholder="labelPosition='top'" />
          <BaseInput
            label="Label on left"
            labelPosition="left"
            labelWidth={160}
            placeholder="labelPosition='left', labelWidth={160}"
          />
          <BaseInput label="Required" isRequired placeholder="isRequired shows *" />
          <BaseInput
            label="Error state"
            error
            helperText="Something is wrong"
          />
          <BaseInput label="Disabled" disabled value="Read only value" />
          <BaseInput label="Prefix" prefix={PHONE_DIAL_CODE} placeholder="prefix={PHONE_DIAL_CODE} — not part of value" />
          <BaseInput label="Prefix, disabled" prefix={PHONE_DIAL_CODE} disabled value="12 345 678" />
          <BaseSelect
            label="BaseSelect — plain"
            options={SELECT_OPTIONS}
            value="usd"
          />
          <BaseSwitch label="BaseSwitch — default" value={false} />
          <BaseSwitch
            label="BaseSwitch — currencies"
            value="USD"
            options={[
              { value: "USD", label: "USD" },
              { value: "KHR", label: "KHR" },
            ]}
          />
          <ControlledBaseInput
            name="input"
            control={control}
            label="readOnly render (detail screens)"
            readOnly
          />
        </Stack>
      </Section>

      {/* ---------------------- BaseDialog ----------------------- */}
      <Section
        title="BaseDialog"
        usage={`import BaseDialog from "@core/components/BaseDialog";
<BaseDialog open={open} title="Title" onClose={...} confirmTitle="Save" onConfirm={...} />
Destructive: confirmColor="error". Custom footer: hideActions. Sectioned: dividers.`}
      >
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
          <BaseButton
            title="Open dialog"
            variant="contained"
            onClick={() => setDialogOpen(true)}
          />
          <BaseButton
            title="With dividers"
            variant="outlined"
            onClick={() => setDividerOpen(true)}
          />
          <BaseButton
            title="Destructive confirm"
            variant="outlined"
            color="error"
            onClick={() => setConfirmOpen(true)}
          />
        </Stack>

        <BaseDialog
          open={dialogOpen}
          title="Edit configuration"
          subtitle="Standard dialog with form content"
          onClose={() => setDialogOpen(false)}
          confirmTitle="Save"
          onConfirm={() => {
            setDialogOpen(false);
            showToast("success", { title: "Saved" });
          }}
        >
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <BaseInput label="Name" isRequired />
            <BaseSelect label="Currency" options={SELECT_OPTIONS} value="khr" />
          </Stack>
        </BaseDialog>

        <BaseDialog
          open={dividerOpen}
          title="Edit role permissions"
          subtitle="Header, content, and footer separated by dividers"
          dividers
          maxWidth="md"
          onClose={() => setDividerOpen(false)}
          confirmTitle="Save changes"
          onConfirm={() => {
            setDividerOpen(false);
            showToast("success", { title: "Saved" });
          }}
        >
          <Stack spacing={2.5} sx={{ py: 1 }}>
            <BaseInput label="Role name" isRequired value="Composite teller" />
            <BaseSelect
              label="Channel"
              options={SELECT_OPTIONS}
              value="khr"
            />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              With <code>dividers</code>, the scrollable content is fenced by a
              line under the header and above the footer — useful for longer,
              form-heavy dialogs.
            </Typography>
          </Stack>
        </BaseDialog>

        <BaseDialog
          open={confirmOpen}
          title="Delete role?"
          onClose={() => setConfirmOpen(false)}
          confirmTitle="Delete"
          confirmColor="error"
          onConfirm={() => {
            setConfirmOpen(false);
            showToast("error", { title: "Deleted", message: "Role removed." });
          }}
        >
          <Typography variant="body2">
            This action cannot be undone. The role will be removed from all
            assigned users.
          </Typography>
        </BaseDialog>
      </Section>

      {/* ------------------------ Toasts ------------------------- */}
      <Section
        title="AppToast"
        usage={`import { showToast } from "@core/components/AppToast";
showToast("error", { title, message, referenceCode }); // errors open the error dialog`}
      >
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
          <BaseButton
            title="Success"
            variant="contained"
            color="success"
            onClick={() =>
              showToast("success", {
                title: "Saved",
                message: "Changes have been saved.",
              })
            }
          />
          <BaseButton
            title="Error dialog"
            variant="contained"
            color="error"
            onClick={() =>
              showToast("error", {
                title: "Insufficient Balance",
                message: "Transaction failed due to insufficient account balance.",
                referenceCode: "S00102005-60C462AA",
              })
            }
          />
          <BaseButton
            title="Warning"
            variant="contained"
            color="warning"
            onClick={() =>
              showToast("warning", {
                title: "Session expiring",
                message: "You will be logged out in 5 minutes.",
              })
            }
          />
          <BaseButton
            title="Info"
            variant="contained"
            color="info"
            onClick={() =>
              showToast("info", {
                title: "Heads up",
                message: "New release notes available.",
              })
            }
          />
        </Stack>
      </Section>

      {/* ----------------- Themed MUI components ----------------- */}
      <Section
        title="Themed MUI (no wrapper needed)"
        usage={`Chip, Alert, Tooltip, Card, Divider, Menu… are styled globally in src/theme/theme.ts —
use them directly from @mui/material.`}
      >
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Chip label="Default" />
          <Chip label="Active" color="success" />
          <Chip label="Pending" color="warning" />
          <Chip label="Rejected" color="error" />
          <Chip label="Processing" color="info" />
        </Stack>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Alert severity="success">Success alert — theme bg token</Alert>
          <Alert severity="warning">Warning alert</Alert>
          <Alert severity="error">Error alert</Alert>
          <Alert severity="info">Info alert</Alert>
        </Stack>
        <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
          <Tooltip title="Tooltip — slate.900, radius.sm">
            <Chip label="Hover me" variant="outlined" />
          </Tooltip>
          <SwitchLanguageMenu />
        </Stack>
      </Section>
    </Box>
  );
}

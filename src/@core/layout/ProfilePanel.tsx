"use client";

import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { font, palette } from "@/theme/palette";
import BaseSideDialog from "@core/components/BaseSideDialog";

export type ProfilePanelProps = {
  open: boolean;
  onClose: () => void;
};

type ProfileRow = { label: string; value: string };

// TODO: replace with a real "current user profile" API once the backend
// exposes business/personal profile fields beyond the auth session.
const BUSINESS_INFO: ProfileRow[] = [
  { label: "Business Name (English) *", value: "TEST CO, LTD" },
  { label: "Business Name (Khmer) *", value: "ក្រុមហ៊ុន តេស្ត លីមីតធីត" },
  { label: "Business Type *", value: "Private Limited Company" },
  { label: "Business Phone Number *", value: "023 888 999" },
  { label: "Business Email Address *", value: "contact@test-company.com.kh" },
  {
    label: "Registered Business Address *",
    value: "No. 42, Street 242, Sangkat Chaktomuk, Khan Daun Penh, Phnom Penh, Cambodia",
  },
];

const PERSONAL_INFO: ProfileRow[] = [
  { label: "Full Name *", value: "Danny Kuoy" },
  { label: "Position / Role *", value: "Administrator" },
  { label: "Personal Phone Number *", value: "+855 12 345 678" },
  { label: "Personal Email Address *", value: "danny.kuoy@test-company.com" },
  { label: "National ID / Passport Number *", value: "170992019" },
  { label: "Last Login", value: "Active · 2 hours ago" },
];

const AUTHORIZATION_INFO: ProfileRow[] = [{ label: "User Role", value: "Authorizer, Maker, Approver, Viewer" }];

function Section({ title, rows }: { title: string; rows: ProfileRow[] }) {
  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: "text.primary" }}>
        {title}
      </Typography>
      <Stack spacing={2.5}>
        {rows.map((row) => (
          <Stack key={row.label} direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
            <Typography sx={{ fontSize: font.size.sm, color: "text.secondary", flexShrink: 0 }}>{row.label}</Typography>
            <Typography sx={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: "text.primary", textAlign: "right" }}>
              {row.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

/** Read-only business/personal/authorization profile, opened from the top bar's user menu. */
export default function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  return (
    <BaseSideDialog open={open} onClose={onClose} title="Profile" width={480}>
      <Stack spacing={6}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 34,
              height: 34,
              fontSize: font.size.md,
              color: palette.white,
              bgcolor: palette.navy[800],
            }}
          >
            TS
          </Avatar>
          <Typography sx={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: "text.primary" }}>
            TEST CO, LTD
          </Typography>
        </Stack>

        <Section title="Business Information" rows={BUSINESS_INFO} />
        <Section title="Personal Information" rows={PERSONAL_INFO} />
        <Section title="Authorization Role Info" rows={AUTHORIZATION_INFO} />
      </Stack>
    </BaseSideDialog>
  );
}

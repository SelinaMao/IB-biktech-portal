"use client";

import { useState } from "react";
import { Avatar, Box, Button, CircularProgress, IconButton, Stack, Typography,Divider } from "@mui/material";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import { Download, Icon } from "lucide-react";
import { EllipsisVertical } from "lucide-react";
import { font, palette, radius } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseChip from "@core/components/BaseChip";
import BaseSideDialog from "@core/components/BaseSideDialog";
import type { CoreAccountEntry, IAccountDetailResponses } from "../account.types";
import { formatCCY } from "@/utils";
import { text } from "stream/consumers";

export interface AccountDetailsProps {
  open: boolean;
  accounts: CoreAccountEntry[];
  onClose: () => void;
  info: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  onDownloadCertificate?: () => void | Promise<void>;
}

function StatusBadge({ value }: { value: string }) {
  return (
    <BaseChip bgColor={palette.success.main} minWidth={60} height={22} color={palette.white}>
      {value}
    </BaseChip>
  );
}

const BOLD_ROW_KEYS = [
  "ACCOUNT_CURRENT_BALANCE",
  "ACCOUNT_AVAILABLE_BALANCE",
  "ACCOUNT_LEDGER_BALANCE",
  "ACCOUNT_FLOATING_BALANCE",
];


function Row({ label, value, rowKey }: { label: string; value: React.ReactNode; rowKey: string }) {
  const isBold = BOLD_ROW_KEYS.includes(rowKey);
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, py: 1.5 }}
    >
      <Typography sx={{ fontSize: font.size.sm, color: "text.secondary" }}>{label}</Typography>
      <Typography
        component="div"
        sx={{
          fontSize: font.size.sm,
          fontWeight: isBold ? font.weight.semibold : font.weight.regular,
          color: "text.primary",
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/** Slide-over triggered by "View Details" on an account overview card —
 *  the account's full profile as a plain label/value list. */
export default function AccountDetailsCard({
  open,
  onClose,
  accounts,
  info,
  fixedDeposit,
  onDownloadCertificate,
}: AccountDetailsProps) {
  const nameParts = (info.accountName || "?").trim().split(/\s+/).filter(Boolean);
  const initials = (
    nameParts.length > 1 ? nameParts.slice(0, 2).map((part) => part[0]).join("") : nameParts[0]?.slice(0, 2) ?? "?"
  ).toUpperCase();

 
  const rows = (info.fields ?? []).filter((field) => field.value);
  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadClick = async () => {
    if (!onDownloadCertificate || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownloadCertificate();
    } finally {
      setIsDownloading(false);
    }
  };
 
  return (

    <Stack direction="column" sx={{ alignItems: "space-between", display: "flex", padding: "20px" }}>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Box sx={{
          display: "flex"
        }}
        >
          <Typography sx={{ fontSize: font.size.lg, fontWeight: font.weight.medium  }}>
            {info.accountName}
          </Typography>
          <Box
          sx={{
            padding:"4px 8px",
            borderRadius:"25px",
            bgcolor:"#E0F4E7",
            marginLeft:8,
            marginTop:0.5,
            fontSize:"14px",
            color:"#166D35",
            fontWeight:"500"
          }}
          >
            {info.status}
          </Box>
        </Box>
         <Button
          sx={{
            minWidth: 0,
            width: 32,
            height: 32,
            p: 0,
            bgcolor: palette.hover[10],
            border: "0px solid",
            borderColor: "primary.main",
            borderRadius: "50%",
            transition: "all 0.2s ease",
            color: "black",
            "&:hover": {
              bgcolor: palette.hover[10],     // background on hover
              borderColor: "primary.main", // border on hover
              color: "black", // icon color on hover
            },
          }}
        >
          <EllipsisVertical size={18} />
        </Button>
      </Box>
      <Box >
         <Typography>
          {info.accountNumber}
        </Typography>
       
      </Box>

      <Box
      sx={{
        marginTop:6
      }}
      >
          <Typography
          sx={{
            fontFamily:"sans-serif",
            fontWeight:"bold",
            fontSize:"18px"
          }}
          >
           {formatCCY(info.availableBalance)}
          </Typography>
      </Box>

      <Box
      sx={{
        bgcolor: "#F5F6FA",       // light gray-blue background
        borderRadius: 3,          // 12px
        px: 2.5,
        py: 2,
      }}
    >
      <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 1.5 }}>
        Account Detail
      </Typography>
      

<Stack divider={<Divider flexItem />} spacing={0}>
  {rows.map((row) => (
    <Stack
      key={row.key}
      direction="row"
      sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
    >
      <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{row.label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{row.value}</Typography>
    </Stack>
  ))}
</Stack>
      {/* <Stack divider={<Divider flexItem />} spacing={0}>
        {accounts.map((item) => (
          <Stack
            key={item.accountNumber}
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              py: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              {item.accountName}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {(item.availableBalance)}
            </Typography>
          </Stack>
        ))}
      </Stack> */}
      {/* <Stack divider={<Divider flexItem />} spacing={0}>
  {accounts.map((row) => (
    <Stack
      key={row.accountClass}
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.5,
      }}
    >
      <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
        {row.accountNumber}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
        {row.availableBalance}
      </Typography>
    </Stack>
  ))}
</Stack> */}
    </Box>


    </Stack>
  );
}

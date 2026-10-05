import * as yup from "yup";

import { nationalPhone } from "@/utils/phone";

import { LIMIT_CATEGORIES, type LimitCategoryKey } from "../user.types";

/** One transaction category's limit fields — all UI-only for now (see LIMIT_CATEGORIES). */
export type LimitParamsValues = {
  minAmountKHR: string;
  maxAmountKHR: string;
  minAmountUSD: string;
  maxAmountUSD: string;
  dailyLimitUSD: string;
  perTransactionLimitUSD: string;
};

export type LimitParametersValues = Record<LimitCategoryKey, LimitParamsValues>;

export type UserInfoValues = {
  firstName: string;
  lastName: string;
  /** The login ID. Entered by the administrator, and permanent once created. */
  username: string;
  email: string;
  phone: string;
  roleId: string;
  accessLevel: string;
  /** Active/Inactive toggle shown next to Role. */
  status: boolean;
  /** Ids of accounts this user is allowed to manage. */
  accountIds: string[];
  limitParameters: LimitParametersValues;
};

function getDefaultLimitParams(): LimitParamsValues {
  return {
    minAmountKHR: "0",
    maxAmountKHR: "0",
    minAmountUSD: "0",
    maxAmountUSD: "0",
    dailyLimitUSD: "0",
    perTransactionLimitUSD: "0",
  };
}

function getDefaultLimitParameters(): LimitParametersValues {
  return LIMIT_CATEGORIES.reduce((acc, { key }) => {
    acc[key] = getDefaultLimitParams();
    return acc;
  }, {} as LimitParametersValues);
}

export function getUserInfoDefaultValues(): UserInfoValues {
  return {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    roleId: "",
    accessLevel: "",
    status: true,
    accountIds: [],
    limitParameters: getDefaultLimitParameters(),
  };
}

/**
 * Prefills the edit form from a row's AdminUser. Access Level isn't persisted
 * on AdminUser (see UserDetailForm), so it starts blank. The phone loses its
 * country code, which the field shows as a fixed prefix.
 */
export function getUserInfoValuesFromUser(user: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  roles: { name: string; id: string }[];
}): UserInfoValues {
  const [derivedFirst = "", ...rest] = (user.fullName ?? "").trim().split(/\s+/);
  return {
    // Older records predate the split, so a full name still stands in for the two.
    firstName: user.firstName || derivedFirst,
    lastName: user.lastName || rest.join(" "),
    username: user.username ?? "",
    email: user.email ?? "",
    phone: nationalPhone(user.phone),
    // role: user.roles?.[0]?.name ?? "",
    roleId: user.roles?.[0]?.id ?? "",
    accessLevel: "",
    status: true,
    accountIds: [],
    limitParameters: getDefaultLimitParameters(),
  };
}

const AMOUNT_REGEX = /^\d+(\.\d+)?$/;

const limitParamsSchema = yup.object({
  minAmountKHR: yup.string().trim().matches(AMOUNT_REGEX, "Enter a valid amount").defined(),
  maxAmountKHR: yup.string().trim().matches(AMOUNT_REGEX, "Enter a valid amount").defined(),
  minAmountUSD: yup.string().trim().matches(AMOUNT_REGEX, "Enter a valid amount").defined(),
  maxAmountUSD: yup.string().trim().matches(AMOUNT_REGEX, "Enter a valid amount").defined(),
  dailyLimitUSD: yup.string().trim().matches(AMOUNT_REGEX, "Enter a valid amount").defined(),
  perTransactionLimitUSD: yup.string().trim().matches(AMOUNT_REGEX, "Enter a valid amount").defined(),
});

const limitParametersSchema = yup.object(
  LIMIT_CATEGORIES.reduce(
    (acc, { key }) => {
      acc[key] = limitParamsSchema;
      return acc;
    },
    {} as Record<LimitCategoryKey, typeof limitParamsSchema>,
  ),
);

/** The server's own rule (LoginIds): letters, digits, full stops and underscores. */
const LOGIN_ID_REGEX = /^[A-Za-z0-9._]+$/;

export const userInfoSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required("First name is required")
    .max(80, "First name must be 80 characters or fewer"),
  lastName: yup
    .string()
    .trim()
    .required("Last name is required")
    .max(80, "Last name must be 80 characters or fewer"),
  username: yup
    .string()
    .trim()
    .required("Login ID is required")
    .min(6, "A login ID must be at least 6 characters")
    .max(50, "A login ID must be 50 characters or fewer")
    .matches(LOGIN_ID_REGEX, "Letters, digits, full stops and underscores only"),
  // Optional: a person may only ever be reached by phone.
  email: yup
    .string()
    .trim()
    .email("Enter a valid email")
    .default(""),
  phone: yup.string().trim().required("Phone number is required"),
  roleId: yup.string().trim().required("Role is required"),
  accessLevel: yup.string().trim().default(""),
  status: yup.boolean().default(true),
  accountIds: yup
    .array()
    .of(yup.string().required())
    .min(1, "Select at least one account")
    .default([]),
  limitParameters: limitParametersSchema,
});

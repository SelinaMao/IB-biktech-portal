import * as yup from "yup";
import type { useTranslations } from "next-intl";

import type { TSignUpForm } from "@core/types/auth";

// Forces the yup shape below to have exactly one schema entry per
// SignUpFormFields key, so a typo'd or missing field is a type error.
type YupSchema<T> = {
  [K in keyof T]: yup.Schema<T[K]>;
};

// Rejects strings that are empty or whitespace-only once required() has
// already let an empty string through (e.g. before .trim() normalizes it).
const spaceRegex = /\S/;

export const signUpDefaultValues: TSignUpForm = {
  accountNumber: "",
  nId: "",
  phone: "",
  agreedTerms: false,
};

export const getSignUpSchema = (t: ReturnType<typeof useTranslations>) =>
  yup.object({
    accountNumber: yup
      .string()
      .required(t("signUpFlow.error.accountNumberRequired"))
      .matches(spaceRegex, t("signUpFlow.error.accountNumberRequired"))
      .trim(),
    nId: yup
      .string()
      .required(t("signUpFlow.error.idNumberRequired"))
      .matches(spaceRegex, t("signUpFlow.error.idNumberRequired"))
      .trim(),
    phone: yup
      .string()
      .required(t("signUpFlow.error.phoneRequired"))
      .matches(spaceRegex, t("signUpFlow.error.phoneRequired"))
      .trim(),
    agreedTerms: yup
      .boolean()
      .oneOf([true], t("signUpFlow.error.termsRequired"))
      .required(),
  } satisfies YupSchema<TSignUpForm>);

import * as yup from "yup";

export const roleFormSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Role name is required")
    .max(64, "Role name must be 64 characters or fewer"),
  description: yup
    .string()
    .trim()
    .max(255, "Description must be 255 characters or fewer")
    .default(""),
  allowSelfApproval: yup.boolean().default(false),
});

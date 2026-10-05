"use client";

import { useMemo, useState, type ReactNode } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";

import { font, palette } from "@/theme/palette";
import { ControlledBaseCheckbox, ControlledBaseInput } from "@core/form";
import BaseDialog from "@/@core/components/BaseDialog";
import { TermsLinkText } from "@/@core/components/BaseTermsLabel";

export type SetupPasswordProps = {
    open: boolean;
    onClose: () => void;
    /** Called with the confirmed form values once all requirements are met. */
    onConfirm: (formData: SetupPasswordFormValues) => void | Promise<void>;
    title?: string;
    description?: string;
    isSubmitting?: boolean;
    errorText?: string;
    minLength?: number;
    newPasswordLabel?: string;
    newPasswordPlaceholder?: string;
    confirmPasswordLabel?: string;
    confirmPasswordPlaceholder?: string;
    mismatchText?: string;
    requirementLabels?: {
        minLength?: (min: number) => string;
        specialChar?: string;
        number?: string;
        capitalLetter?: string;
        lowercaseLetter?: string;
    };
    /** Values (e.g. username, email) the password must not contain, checked case-insensitively. */
    excludedValues?: Array<string | undefined | null>;
    termsLabel?: ReactNode;
    confirmLabel?: string;
    submittingLabel?: string;
};

export type SetupPasswordFormValues = {
    password: string;
    confirmPassword: string;
    agreedTerms: boolean;
};

const DEFAULT_MIN_LENGTH = 8;

// Special characters are anything but letters/digits/whitespace, minus the
// set banned outright below (they're excluded from "counts as special" too,
// so the checklist and the banned-char rule never disagree).
const BANNED_CHARS_REGEX = /['"<>&;`\\|]/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9\s'"<>&;`\\|]/;
// C0 control range covers NUL/TAB/LF plus the rest of that class.
const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;

type Requirement = {
    key: string;
    label: string;
    met: boolean;
};

/**
 * First-login "Setup Password" dialog. Live-checks the new password against
 * the requirement list and confirms it matches, mirroring BaseOTP's
 * stateless-about-delivery pattern — the caller owns what happens on confirm.
 */
export default function SetupPassword({
    open,
    onClose,
    onConfirm,
    title = "Setup Password",
    description = "Enter and confirm your new password. Your password must comply with the security requirements below.",
    isSubmitting = false,
    errorText,
    minLength = DEFAULT_MIN_LENGTH,
    newPasswordLabel = "New Password",
    newPasswordPlaceholder = "Enter Password",
    confirmPasswordLabel = "Confirm Password",
    confirmPasswordPlaceholder = "Enter Confirm Password",
    mismatchText = "Password does not match",
    requirementLabels,
    excludedValues = [],
    termsLabel = <TermsLinkText text="I have read and agreed to the" />,
    confirmLabel = "Confirm",
    submittingLabel = "Confirming...",
}: SetupPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const schema = useMemo(
        () =>
            yup.object({
                password: yup
                    .string()
                    .required("Password is required")
                    .min(
                        minLength,
                        requirementLabels?.minLength
                            ? requirementLabels.minLength(minLength)
                            : `Minimum ${minLength} characters`,
                    )
                    .matches(/[A-Z]/, requirementLabels?.capitalLetter ?? "At least 1 capital letter")
                    .matches(/[a-z]/, requirementLabels?.lowercaseLetter ?? "At least 1 lowercase letter")
                    .matches(/[0-9]/, requirementLabels?.number ?? "At least 1 number")
                    .matches(SPECIAL_CHAR_REGEX, requirementLabels?.specialChar ?? "At least 1 special character")
                    .test(
                        "no-banned-chars",
                        `Password cannot contain the characters ' " < > & ; \` \\ |`,
                        (value) => !BANNED_CHARS_REGEX.test(value ?? ""),
                    )
                    .test(
                        "no-space-or-control-chars",
                        "Password cannot contain spaces or control characters",
                        (value) => !/\s/.test(value ?? "") && !CONTROL_CHAR_REGEX.test(value ?? ""),
                    )
                    .test(
                        "no-identifier",
                        "Password cannot contain your username or email",
                        (value) => {
                            if (!value) return true;
                            const lower = value.toLowerCase();
                            return !excludedValues.some((identifier) => {
                                const trimmed = identifier?.trim().toLowerCase();
                                return Boolean(trimmed) && trimmed!.length >= 3 && lower.includes(trimmed!);
                            });
                        },
                    ),
                confirmPassword: yup
                    .string()
                    .required("Confirm Password is required")
                    .oneOf([yup.ref("password")], mismatchText),
                agreedTerms: yup
                    .boolean()
                    .oneOf([true], "Please agree to the Terms & Conditions")
                    .required(),
            }),
        [minLength, mismatchText, requirementLabels, excludedValues],
    );

    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { isSubmitting: isFormSubmitting },
    } = useForm<SetupPasswordFormValues>({
        resolver: yupResolver(schema),
        mode: "onSubmit",
        defaultValues: { password: "", confirmPassword: "", agreedTerms: false },
    });

    // Reset the form whenever the dialog transitions to open — a render-phase
    // update rather than an effect (see BaseOTP for the same pattern).
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            reset({ password: "", confirmPassword: "", agreedTerms: false });
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }

    const submitting = isSubmitting || isFormSubmitting;

    const [password, confirmPassword, agreedTerms] = watch([
        "password",
        "confirmPassword",
        "agreedTerms",
    ]);

    const requirements: Requirement[] = [
        {
            key: "minLength",
            label: requirementLabels?.minLength
                ? requirementLabels.minLength(minLength)
                : `Minimum ${minLength} characters`,
            met: password.length >= minLength,
        },
        {
            key: "specialChar",
            label: requirementLabels?.specialChar ?? "At least 1 special character",
            met: SPECIAL_CHAR_REGEX.test(password),
        },
        {
            key: "number",
            label: requirementLabels?.number ?? "At least 1 number",
            met: /[0-9]/.test(password),
        },
        {
            key: "capitalLetter",
            label: requirementLabels?.capitalLetter ?? "At least 1 capital letter",
            met: /[A-Z]/.test(password),
        },
        {
            key: "lowercaseLetter",
            label: requirementLabels?.lowercaseLetter ?? "At least 1 lowercase letter",
            met: /[a-z]/.test(password),
        },
    ];

    const allRequirementsMet = requirements.every((r) => r.met);
    const hasBannedChars = BANNED_CHARS_REGEX.test(password) || /\s/.test(password) || CONTROL_CHAR_REGEX.test(password);
    const hasExcludedValue = excludedValues.some((identifier) => {
        const trimmed = identifier?.trim().toLowerCase();
        return Boolean(trimmed) && trimmed!.length >= 3 && password.toLowerCase().includes(trimmed!);
    });
    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const canConfirm =
        allRequirementsMet && !hasBannedChars && !hasExcludedValue && passwordsMatch && agreedTerms && !submitting;

    const onSubmit = async (values: SetupPasswordFormValues) => {
        await onConfirm(values);
    };

    return (
        <BaseDialog
            open={open}
            onClose={onClose}
            title={title}
            maxWidth="xs"
            variant="action"
            isLoading={submitting}
            confirmTitle={submitting ? submittingLabel : confirmLabel}
            confirmDisabled={!canConfirm}
            onConfirm={handleSubmit(onSubmit)}
        >
            <Typography
                variant="body2"
                sx={{ color: palette.slate[950], mb: 3, lineHeight: 1.5, fontSize: font.size.md, fontWeight: font.weight.regular }}
            >
                {description}
            </Typography>

            <Typography sx={{ color: palette.slate[950], fontSize: font.size.sm, mb: 0.75, fontWeight: font.weight.medium }}>
                {newPasswordLabel}
            </Typography>
            <ControlledBaseInput
                name="password"
                control={control}
                type={showPassword ? "text" : "password"}
                placeholder={newPasswordPlaceholder}
                disabled={submitting}
                fullWidth
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword((s) => !s)}
                                    edge="end"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    disabled={submitting}
                                >
                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
                sx={{ mb: 2 }}
            />

            <Typography sx={{ color: palette.slate[950], fontSize: font.size.sm, mb: 0.75, fontWeight: font.weight.medium }}>
                {confirmPasswordLabel}
            </Typography>
            <ControlledBaseInput
                name="confirmPassword"
                control={control}
                type={showConfirmPassword ? "text" : "password"}
                placeholder={confirmPasswordPlaceholder}
                disabled={submitting}
                fullWidth
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowConfirmPassword((s) => !s)}
                                    edge="end"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    disabled={submitting}
                                >
                                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            <Stack sx={{ mt: 2.5, gap: 0.75 }}>
                {requirements.map((req) => (
                    <Stack key={req.key} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        {req.met ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: 18, color: palette.success.main }} />
                        ) : (
                            <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18, color: palette.slate[300] }} />
                        )}
                        <Typography
                            variant="body2"
                            sx={{ color: req.met ? palette.slate[950] : palette.slate[500], fontSize: font.size.sm }}
                        >
                            {req.label}
                        </Typography>
                    </Stack>
                ))}
            </Stack>

            {errorText && (
                <Typography variant="body2" sx={{ color: palette.danger.main, mt: 2 }}>
                    {errorText}
                </Typography>
            )}

            <Box sx={{ mt: 2.5 }}>
                <ControlledBaseCheckbox
                    name="agreedTerms"
                    control={control}
                    disabled={submitting}
                    sx={{ "&.Mui-checked": { color: palette.navy[800] } }}
                    label={
                        <Typography variant="body2" sx={{ color: palette.slate[950], fontSize: font.size.sm }}>
                            {termsLabel}
                        </Typography>
                    }
                />
            </Box>
        </BaseDialog>
    );
}

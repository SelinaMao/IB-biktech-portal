"use client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
    Box,
    Checkbox,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Link,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useState } from "react";
import { SwitchLanguageMenu } from "@core/components/SwitchLanguageMenu";
import { useRouter } from "next/navigation";
import BaseAuthLayout from "@/@core/components/BaseAuthLayout";

const FOOTER_LINKS = [
    "FAQs",
    "User Guide",
    "Contact Us",
    "Security",
    "Privacy Policy",
];

export default function ClientLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [agreedTerms, setAgreedTerms] = useState(false);

    const canSubmit = Boolean(username.trim()) && Boolean(password) && agreedTerms;

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.push("/otp");
    };

    return (
         <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#FFFFFF",
            }}
        >
            {/* Top Header / Language Switcher */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    px: { xs: 3, md: 6 },
                    py: 2,
                    borderBottom: "1px solid #F1F5F9",
                }}
            >
                <SwitchLanguageMenu />
            </Box>

            {/* Main Centered Content */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    px: 3,
                    py: 6,
                }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{
                        width: "100%",
                        maxWidth: 420,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Title */}
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: "1.35rem", sm: "1.5rem" },
                            color: "#1E293B",
                            mb: 3.5,
                            textAlign: "left",
                        }}
                    >
                        Login to your BMP account
                    </Typography>

                    {/* User ID Field */}
                    <Typography
                        sx={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#475569",
                            mb: 1,
                        }}
                    >
                        User ID
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Enter User ID"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        sx={{
                            mb: 2.5,
                            "& .MuiOutlinedInput-root": {
                                height: 48,
                                borderRadius: "10px",
                                bgcolor: "#F8FAFC",
                                color: "#1E293B",
                                "& fieldset": {
                                    borderColor: "#E2E8F0",
                                },
                                "&:hover fieldset": {
                                    borderColor: "#CBD5E1",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#3B82F6",
                                },
                            },
                            "& input:-webkit-autofill": {
                                WebkitBoxShadow: "0 0 0 1000px #F8FAFC inset !important",
                                boxShadow: "0 0 0 1000px #F8FAFC inset !important",
                                WebkitTextFillColor: "#1E293B !important",
                                caretColor: "#1E293B !important",
                            },
                            "& .MuiInputBase-input::placeholder": {
                                color: "#94A3B8",
                                opacity: 1,
                                fontSize: "14px",
                            },
                        }}
                    />

                    {/* Password Field */}
                    <Typography
                        sx={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#475569",
                            mb: 1,
                        }}
                    >
                        Password
                    </Typography>
                    <TextField
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            edge="end"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            sx={{ color: "#64748B" }}
                                        >
                                            {showPassword ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye preview-icon"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                                            ) : (
                                               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off preview-icon"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
                                            )}
                                        </IconButton>

                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{
                            mb: 2.5,
                            "& .MuiOutlinedInput-root": {
                                height: 48,
                                borderRadius: "10px",
                                bgcolor: "#F8FAFC",
                                color: "#1E293B",
                                "& fieldset": {
                                    borderColor: "#E2E8F0",
                                },
                                "&:hover fieldset": {
                                    borderColor: "#CBD5E1",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#3B82F6",
                                },
                            },
                            "& input:-webkit-autofill": {
                                WebkitBoxShadow: "0 0 0 1000px #F8FAFC inset !important",
                                boxShadow: "0 0 0 1000px #F8FAFC inset !important",
                                WebkitTextFillColor: "#1E293B !important",
                                caretColor: "#1E293B !important",
                            },
                            "& .MuiInputBase-input::-ms-reveal, & .MuiInputBase-input::-ms-clear": {
                                display: "none",
                            },
                            "& .MuiInputBase-input": {
                                ...(!showPassword && {
                                    WebkitTextSecurity: "asterisk",
                                    letterSpacing: "2px",
                                }),
                            },
                            "& .MuiInputBase-input::placeholder": {
                                color: "#94A3B8",
                                opacity: 1,
                                fontSize: "14px",
                                letterSpacing: "normal",
                                WebkitTextSecurity: "none",
                            },
                        }}
                    />

                    {/* Terms & Conditions Checkbox */}
                    <FormControlLabel
                        sx={{
                            mb: 3,
                            alignItems: "center",
                            mx: 0,
                        }}
                        control={
                            <Checkbox
                                checked={agreedTerms}
                                onChange={(e) => setAgreedTerms(e.target.checked)}
                                sx={{
                                    color: "#CBD5E1",
                                    p: 0.5,
                                    mr: 1,
                                    "&.Mui-checked": {
                                        color: "#0D9488",
                                    },
                                }}
                            />
                        }
                        label={
                            <Typography
                                sx={{
                                    fontSize: "14px",
                                    color: "#475569",
                                }}
                            >
                                I have read and agreed to the{" "}
                                <Link
                                    href="#"
                                    underline="always"
                                    sx={{
                                        color: "#2563EB",
                                        fontWeight: 500,
                                    }}
                                >
                                    Term & Conditions
                                </Link>
                            </Typography>
                        }
                    />

                    {/* Login Submit Button */}
                    <Box
                        component="button"
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        
                        sx={{
                            width: "100%",
                            height: 46,
                            borderRadius: "24px",
                            border: "none",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: canSubmit ? "pointer" : "not-allowed",
                            bgcolor: canSubmit ? "#2563EB" : "#DDE4EE",
                            color: canSubmit ? "#FFFFFF" : "#94A3B8",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                                bgcolor: canSubmit ? "#1D4ED8" : "#DDE4EE",
                            },
                        }}
                    >
                        Login
                    </Box>

                    {/* Forgot Password Link */}
                    <Box sx={{ mt: 3, textAlign: "center" }}>
                        <Link
                            component="button"
                            type="button"
                            underline="none"
                            sx={{
                                color: "#2563EB",
                                fontSize: "14px",
                                fontWeight: 500,
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            Forgot Password?
                        </Link>
                    </Box>

                    {/* No account yet? Sign Up */}
                    <Box sx={{ mt: 3.5, textAlign: "center" }}>
                        <Typography
                            component="span"
                            sx={{
                                fontSize: "14px",
                                color: "#64748B",
                            }}
                        >
                            No account yet?{" "}
                        </Typography>
                        <Link
                            component={NextLink}
                            href="/signup"
                            underline="none"
                            sx={{
                                color: "#2563EB",
                                fontWeight: 600,
                                fontSize: "14px",
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            Sign Up
                        </Link>
                    </Box>
                </Box>
            </Box>

            {/* Footer Links */}
            <Stack
                direction="row"
                spacing={{ xs: 2, sm: 3 }}
                sx={{
                    justifyContent: "center",
                    alignItems: "center",
                    flexWrap: "wrap",
                    py: 4,
                    px: 2,
                }}
            >
                {FOOTER_LINKS.map((link) => (
                    <Link
                        key={link}
                        href="#"
                        underline="none"
                        sx={{
                            fontSize: "13px",
                            color: "#64748B",
                            "&:hover": {
                                color: "#1E293B",
                            },
                        }}
                    >
                        {link}
                    </Link>
                ))}
            </Stack>
        </Box>
    );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import ThemeRegistry from "@/theme/ThemeRegistry";
import StoreProvider from "@/store/StoreProvider";
// import { AppToaster } from "@core/components/AppToast";
import type { Locale } from "@/i18n/config";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import { AppErrorDialogHost } from "@core/components/AppErrorDialog";
import { Poppins } from "next/font/google";
// The app's single typeface — Noto Sans Khmer covers both Khmer and Latin,
// so every locale renders in the same font.
const notoSansKhmer = localFont({
  variable: "--font-noto-khmer",
  src: [
    {
      path: "../styles/fonts/Noto_Sans_Khmer/NotoSansKhmer-Regular.ttf",
      weight: "400",
    },
    {
      path: "../styles/fonts/Noto_Sans_Khmer/NotoSansKhmer-Medium.ttf",
      weight: "500",
    },
    {
      path: "../styles/fonts/Noto_Sans_Khmer/NotoSansKhmer-SemiBold.ttf",
      weight: "600",
    },
    {
      path: "../styles/fonts/Noto_Sans_Khmer/NotoSansKhmer-Bold.ttf",
      weight: "700",
    },
  ],
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});
export const metadata: Metadata = {
  title: "IB-biktech-portal",
  description: "Bank admin console for corporate banking channel configuration",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreProvider>
            <ThemeRegistry>
              {children}
              {/* Errors from anywhere — showToast("error", …) — surface here as a dialog. */}
              <AppErrorDialogHost />
              <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="colored"
              />
            </ThemeRegistry>
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

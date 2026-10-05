import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "../../../_lib/core-client";
import type { SignupRequestCodeDataDto } from "../../../_lib/core-contracts";
import { badRequestResponse, upstreamFailure } from "../../../_lib/error-response";

export async function POST(request: Request) {
    const body: unknown = await request.json().catch(() => null);
    if (!body) {
        return badRequestResponse();
    }

    const upstream = await coreFetch(adminApi.AUTH.SIGNUP_VERIFY_OTP, {
        method: "POST",
        body,
    });
    const { envelope, raw } = await readEnvelope<SignupRequestCodeDataDto>(upstream);

    if (!upstream.ok || !envelope?.success) {
        return Response.json(raw ?? upstreamFailure("Signup Verify Code Request Failed"), {
            status: upstream.ok ? 502 : upstream.status,
        });
    }

    if (process.env.NODE_ENV !== "production") {
        console.log("[signup-verify-code] success response:", envelope);
    }

    return Response.json({
        success: envelope.success,
        message: envelope.message,
        data: envelope.data,
        timestamp: envelope.timestamp,
    });
}

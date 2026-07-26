"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
const params = useSearchParams();
const error = params.get("error");
const callbackUrl = params.get("callbackUrl") || "/";

return (
<div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
<h1>Effervescent CRM</h1>
<p>Sign in with your effervescent.agency work account to continue.</p>
{error && (
<p style={{ color: "red" }}>
Sign-in failed. Please use your effervescent.agency work email.
</p>
)}
<button onClick={() => signIn("google", { callbackUrl })}>
Sign in with Google
</button>
</div>
);
}

export default function SignInPage() {
return (
<Suspense fallback={null}>
<SignInContent />
</Suspense>
);
}

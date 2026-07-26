import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import sql from "./db";
import { ensureSchema } from "./ensure-schema";

const ALLOWED_DOMAIN = "effervescent.agency";

export const authOptions: AuthOptions = {
providers: [
GoogleProvider({
clientId: process.env.GOOGLE_CLIENT_ID!,
clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
authorization: {
params: {
hd: ALLOWED_DOMAIN,
prompt: "consent select_account",
access_type: "offline",
response_type: "code",
scope: "openid email profile https://www.googleapis.com/auth/gmail.metadata",
},
},
}),
],
callbacks: {
async signIn({ profile }) {
const email = profile?.email ?? "";
const domain = email.split("@")[1]?.toLowerCase();
return domain === ALLOWED_DOMAIN;
},
async jwt({ token, account, profile }) {
if (account && profile?.email) {
try {
await ensureSchema();
const expiry = account.expires_at ? Number(account.expires_at) : null;
await sql`
INSERT INTO staff_gmail_tokens (email, access_token, refresh_token, expiry_date)
VALUES (${profile.email}, ${account.access_token ?? null}, ${account.refresh_token ?? null}, ${expiry})
ON CONFLICT (email) DO UPDATE SET
access_token = EXCLUDED.access_token,
refresh_token = COALESCE(EXCLUDED.refresh_token, staff_gmail_tokens.refresh_token),
expiry_date = EXCLUDED.expiry_date,
updated_at = now()
`;
} catch (err) {
console.error("Failed to store Gmail tokens", err);
}
}
return token;
},
},
pages: {
signIn: "/signin",
},
session: {
strategy: "jwt",
},
};
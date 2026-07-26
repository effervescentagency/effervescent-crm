import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_DOMAIN = "effervescent.agency";

export const authOptions: AuthOptions = {
providers: [
GoogleProvider({
clientId: process.env.GOOGLE_CLIENT_ID as string,
clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
authorization: {
params: {
hd: ALLOWED_DOMAIN,
prompt: "select_account",
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
},
pages: {
signIn: "/signin",
},
session: {
strategy: "jwt",
},
};

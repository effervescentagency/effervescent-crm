import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { LOGO_SRC } from "@/lib/logo";

const SYSTEMS = [
{
name: "CRM",
description: "Manage clients, partners and venue contacts.",
href: "/crm",
external: false,
available: true,
},
{
name: "Recruitment",
description: "Manage candidates and hiring pipelines.",
href: "https://effervescent-agency.vercel.app/candidates",
external: true,
available: true,
},
{
name: "Payment & Data",
description: "Payments processing and data reporting system.",
href: "#",
external: false,
available: false,
},
];

export default async function Home() {
const session = await getServerSession(authOptions);
return (
<div className="min-h-screen bg-[#FDB8D7]/10">
<div className="bg-[#FDB8D7] px-6 py-6 shadow-sm">
<div className="max-w-5xl mx-auto flex items-center justify-between">
<div className="flex items-center gap-3">
  <img src={LOGO_SRC} alt="Effervescent logo" className="w-10 h-10 rounded-xl object-contain bg-white/20 p-1" />
  <div>
  <div className="text-white font-bold text-xl">Effervescent</div>
<div className="text-white/80 text-sm">Staff Dashboard</div>
</div>
</div>
{session?.user?.email && (
<div className="flex items-center gap-4">
<div className="text-white text-sm hidden sm:block">{session.user.email}</div>
<a href="/api/auth/signout" className="text-white text-sm font-semibold underline underline-offset-2">
Sign out
</a>
</div>
)}
</div>
</div>
<div className="max-w-5xl mx-auto px-6 py-10">
<h1 className="text-2xl font-bold text-gray-900 mb-1">
Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
</h1>
<p className="text-gray-500 mb-8">Choose a system to get started.</p>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
{SYSTEMS.map((system) =>
system.available ? (
<a
key={system.name}
href={system.href}
target={system.external ? "_blank" : undefined}
rel={system.external ? "noopener noreferrer" : undefined}
className="block bg-white border border-[#FDB8D7]/30 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#FDB8D7] transition"
>
<div className="w-12 h-12 rounded-xl bg-[#FDB8D7] flex items-center justify-center mb-4 overflow-hidden">
<img src={LOGO_SRC} alt="Effervescent logo" className="w-8 h-8 object-contain" />
</div>
<div className="font-bold text-gray-900 mb-1">{system.name}</div>
<div className="text-sm text-gray-500">{system.description}</div>
</a>
) : (
<div
key={system.name}
className="block bg-white border border-gray-100 rounded-2xl p-6 opacity-60 cursor-not-allowed"
>
<div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-4 overflow-hidden">
<img src={LOGO_SRC} alt="Effervescent logo" className="w-8 h-8 object-contain opacity-60" />
</div>
<div className="font-bold text-gray-900 mb-1">{system.name}</div>
<div className="text-sm text-gray-500 mb-3">{system.description}</div>
<span className="inline-block text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
Coming soon
</span>
</div>
)
)}
</div>
</div>
</div>
);
}
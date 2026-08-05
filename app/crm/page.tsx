'use client';
import { useState, useEffect, useMemo } from 'react';
import { signOut } from 'next-auth/react';
type Status = 'New Lead' | 'Contacted' | 'Negotiation' | 'Won' | 'Lost';
type RoleType =
    | 'Owner'
    | 'General Manager'
    | 'Bar Manager'
    | 'Assistant Manager'
    | 'Marketing'
    | 'Operations Manager';

const STAFF: { email: string; name: string }[] = [
    { email: 'maddison@effervescent.agency', name: 'Maddison' },
    { email: 'hello@effervescent.agency', name: 'Sasha' },
    { email: 'bella@effervescent.agency', name: 'Bella' },
    { email: 'meg@effervescent.agency', name: 'Meg' },
];
function assignedToLabel(value: string) {
    if (!value || value === 'Unassigned') return 'Unassigned';
    const match = STAFF.find((s) => s.email === value);
    return match ? match.name : value;
}
type AssignedTo = string;
interface Interaction {
    id: number;
    date: string;
    method: string;
    contactedBy: string;
    notes: string;
}
interface FollowUp {
    id: number;
    note: string;
    dueDate: string;
    assignedTo: string;
    done: boolean;
}
interface Contact {
    id: number;
    name: string;
    company: string;
    city: string;
    role: RoleType;
    assignedTo: AssignedTo;
    email: string;
    phone: string;
    status: Status;
    lastContact: string;
    created: string;
    notes: string;
    shiftVenueDetails: string;
    bottlePrice: string;
    shotPrice: string;
    address: string;
    website: string;
    instagram: string;
    lostReason: string;
    lostNotes: string;
    interactions: Interaction[];
    followUps: FollowUp[];
}
const statusColors: Record<Status, string> = {
    'New Lead': 'bg-purple-100 text-purple-700',
    Contacted: 'bg-blue-100 text-blue-700',
    Negotiation: 'bg-yellow-100 text-yellow-700',
    Won: 'bg-green-100 text-green-700',
    Lost: 'bg-gray-100 text-gray-600',
};
const roleOptions: RoleType[] = [
    'Owner',
    'General Manager',
    'Bar Manager',
    'Assistant Manager',
    'Marketing',
    'Operations Manager',
];
const assignedToOptions: AssignedTo[] = ['Unassigned', ...STAFF.map((s) => s.email)];
const statusOptions: Status[] = ['New Lead', 'Contacted', 'Negotiation', 'Won', 'Lost'];
const lostReasonOptions: string[] = ['Uncontactable/ghosted', 'Not interested', 'Happy with current supplier', 'In-house', 'Venue closure', 'Management Change', 'Unhappy with service received', 'Low sales volume', 'Unsuitable for service', 'Effervescent Cancelled Contract', 'Other'];
const methodOptions = ['Email', 'Phone Call', 'WhatsApp', 'LinkedIn', 'In-Person', 'Other'];
function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function lastContactInfo(c: Contact) {
    const dates = (c.interactions || [])
        .map((it: Interaction) => new Date(it.date).getTime())
        .filter((t: number) => !isNaN(t));
    if (dates.length === 0) return { text: "No contact yet", date: "", overdue: false };
    const days = Math.floor((Date.now() - Math.max(...dates)) / 86400000);
    let text = "";
    if (days <= 0) text = "Today";
    else if (days === 1) text = "1 day ago";
    else if (days < 7) text = days + " days ago";
    else if (days < 30) {
        const weeks = Math.floor(days / 7);
        text = weeks + (weeks === 1 ? " week ago" : " weeks ago");
    } else {
        const months = Math.floor(days / 30);
        text = months + (months === 1 ? " month ago" : " months ago");
    }
    const last = new Date(Math.max(...dates));
    const dateStr = last.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return { text, date: dateStr, overdue: days > 7 };
}
function LastContactCell({ c }: { c: Contact }) {
    const info = lastContactInfo(c);
    return (
        <div className="flex flex-col leading-tight">
            <span className={info.overdue ? "text-red-600 font-bold" : "text-gray-700"}>
                {info.text}
            </span>
            {info.date && <span className="text-gray-400 text-[11px]">{info.date}</span>}
        </div>
    );
}
function EyeIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
function PencilIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    );
}
function TrashIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        </svg>
    );
}
function MailIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
        </svg>
    );
}
function PhoneIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
        </svg>
    );
}
function BuildingIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="4" y="2" width="16" height="20" rx="1" />
            <path d="M9 22v-4h6v4" />
        </svg>
    );
}
function CalendarIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}
function XIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    );
}
function PlusIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}
function SearchIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
        </svg>
    );
} function BellIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
    );
}
function daysAgo(dateStr?: string | null): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
}
function isAtRiskContact(c: Contact): boolean {
    if (c.status !== 'New Lead' && c.status !== 'Contacted' && c.status !== 'Negotiation') return false;
    const interactionDates = (c.interactions || [])
        .map((it: Interaction) => new Date(it.date).getTime())
        .filter((t: number) => !isNaN(t));
    if (interactionDates.length === 0) {
        const created = daysAgo(c.created);
        return created !== null && created > 7;
    }
    const lastDays = Math.floor((Date.now() - Math.max(...interactionDates)) / 86400000);
    return lastDays > 7;
}
const EMAIL_TEMPLATES: { id: string; name: string; subject: string; body: string }[] = [
    {
        id: 'checkin',
        name: 'Friendly Check-in',
        subject: 'Quick check-in from Effervescent',
        body: 'Hi there,\n\nJust checking in to see how things are going and if there is anything we can help with at the moment.\n\nLooking forward to hearing from you.\n\nBest,\nEffervescent Team',
    },
    {
        id: 'followup',
        name: 'Follow-up After Meeting',
        subject: 'Great speaking with you',
        body: 'Hi there,\n\nThank you for taking the time to speak with us. It was great to learn more about your venue and how we might work together.\n\nPlease let us know if you have any questions in the meantime.\n\nBest,\nEffervescent Team',
    },
    {
        id: 'promo',
        name: 'Special Offer',
        subject: 'A special offer for you from Effervescent',
        body: 'Hi there,\n\nWe wanted to let you know about a limited-time offer available for your venue. Get in touch and we would be happy to share the details.\n\nBest,\nEffervescent Team',
    },
    {
        id: 'reengage',
        name: 'Re-engagement (Lost Leads)',
        subject: 'Checking back in',
        body: 'Hi there,\n\nIt has been a little while since we last spoke, and we wanted to reach out in case anything has changed on your end. We would love the opportunity to work together again.\n\nBest,\nEffervescent Team',
    },
    {
        id: 'welcome',
        name: 'Welcome / New Lead',
        subject: 'Welcome - excited to connect',
        body: 'Hi there,\n\nThanks for your interest in Effervescent. We are excited to connect and learn more about your venue.\n\nBest,\nEffervescent Team',
    },
];

export default function Home() {
    const [contacts, setContacts] = useState<Contact[]>([]);

    useEffect(() => {
        fetch('/api/contacts')
            .then((res) => res.json())
            .then((data) => setContacts(data))
            .catch((err) => console.error('Failed to load contacts', err));
    }, []);
    useEffect(() => {
        fetch('/api/sync-emails').catch(() => { });
    }, []);

    const [filter, setFilter] = useState<'All' | Status>('All');
    const [assignedFilter, setAssignedFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewingId, setViewingId] = useState<number | null>(null);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [dragContactId, setDragContactId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        city: '',
        website: '',
        instagram: '',
        role: 'Owner' as RoleType,
        assignedTo: 'Unassigned' as AssignedTo,
        status: 'New Lead' as Status,
        notes: '',
    });
    const [notesDraft, setNotesDraft] = useState('');
    const [wonDraft, setWonDraft] = useState({ shiftVenueDetails: "", bottlePrice: "", shotPrice: "", address: "" });
    const [lostModalId, setLostModalId] = useState<number | null>(null);
    const [lostReasonDraft, setLostReasonDraft] = useState("");
    const [lostNotesDraft, setLostNotesDraft] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
    const [bulkSubject, setBulkSubject] = useState("");
    const [bulkBody, setBulkBody] = useState("");
    const [bulkTemplateId, setBulkTemplateId] = useState("");
    const [newInteraction, setNewInteraction] = useState({
        date: new Date().toISOString().slice(0, 10),
        method: 'Email',
        contactedBy: '',
        notes: '',
    });
    const [showLogModal, setShowLogModal] = useState(false);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingForm, setMeetingForm] = useState({
        title: '',
        date: new Date().toISOString().slice(0, 10),
        time: '10:00',
        duration: 30,
        description: '',
        guests: '',
        inviteClient: true,
        addMeet: true,
    });
    const [meetingStatus, setMeetingStatus] = useState<'idle' | 'saving' | 'error' | 'success'>('idle');
    const [meetingError, setMeetingError] = useState('');
    const [meetingResult, setMeetingResult] = useState<{ htmlLink?: string; meetLink?: string | null } | null>(null);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpForm, setFollowUpForm] = useState({ note: '', dueDate: new Date().toISOString().slice(0, 10) });
    const [followUpStatus, setFollowUpStatus] = useState<'idle' | 'saving' | 'error'>('idle');
    const [followUpError, setFollowUpError] = useState('');
    function openMeetingModal(c: Contact) {
        setMeetingForm({
            title: `${c.company} x Effervescent`,
            date: new Date().toISOString().slice(0, 10),
            time: '10:00',
            duration: 30,
            description: '',
            guests: '',
            inviteClient: !!c.email,
            addMeet: true,
        });
        setMeetingStatus('idle');
        setMeetingError('');
        setMeetingResult(null);
        setShowMeetingModal(true);
    }
    async function scheduleMeeting() {
        if (!viewing) return;
        setMeetingStatus('saving');
        setMeetingError('');
        try {
            const res = await fetch(`/api/contacts/${viewing.id}/schedule-meeting`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: meetingForm.title,
                    date: meetingForm.date,
                    time: meetingForm.time,
                    duration: meetingForm.duration,
                    description: meetingForm.description,
                    guests: meetingForm.guests
                        .split(',')
                        .map((g) => g.trim())
                        .filter(Boolean),
                    inviteClient: meetingForm.inviteClient,
                    clientEmail: viewing.email,
                    addMeet: meetingForm.addMeet,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMeetingStatus('error');
                setMeetingError(data.error || 'Failed to schedule meeting.');
                return;
            }
            setMeetingResult(data);
            setMeetingStatus('success');
            const meetingNotesParts = [`${meetingForm.title} on ${meetingForm.date} at ${meetingForm.time} (${meetingForm.duration} min).`];
            if (data.meetLink) meetingNotesParts.push(`Join link: ${data.meetLink}`);
            if (data.htmlLink) meetingNotesParts.push(`Calendar event: ${data.htmlLink}`);
            if (meetingForm.description) meetingNotesParts.push(meetingForm.description);
            const meetingInteraction = {
                date: meetingForm.date,
                method: 'Meeting Booked',
                contactedBy: '',
                notes: meetingNotesParts.join(' '),
            };
            setContacts((cs) =>
                cs.map((c) =>
                    c.id === viewing.id
                        ? { ...c, interactions: [{ id: Date.now(), ...meetingInteraction }, ...c.interactions] }
                        : c
                )
            );
            fetch(`/api/contacts/${viewing.id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(meetingInteraction),
            }).catch((err) => console.error('Failed to log meeting interaction', err));
        } catch (err) {
            setMeetingStatus('error');
            setMeetingError('Failed to schedule meeting.');
        }
    }
    function openFollowUpModal() {
        setFollowUpForm({ note: '', dueDate: new Date().toISOString().slice(0, 10) });
        setFollowUpStatus('idle');
        setFollowUpError('');
        setShowFollowUpModal(true);
    }
    async function submitFollowUp() {
        if (!viewing || !followUpForm.note) return;
        setFollowUpStatus('saving');
        setFollowUpError('');
        try {
            const res = await fetch(`/api/contacts/${viewing.id}/follow-ups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    note: followUpForm.note,
                    dueDate: followUpForm.dueDate,
                    assignedTo: viewing.assignedTo,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setFollowUpStatus('error');
                setFollowUpError(data.error || 'Failed to create follow-up.');
                return;
            }
            setContacts((cs) =>
                cs.map((c) =>
                    c.id === viewing.id ? { ...c, followUps: [...c.followUps, data] } : c
                )
            );
            setShowFollowUpModal(false);
            setFollowUpStatus('idle');
        } catch (err) {
            setFollowUpStatus('error');
            setFollowUpError('Failed to create follow-up.');
        }
    }
    function markFollowUpDone(followUpId: number) {
        if (viewingId === null) return;
        fetch(`/api/contacts/${viewingId}/follow-ups/${followUpId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done: true }),
        })
            .then((res) => res.json())
            .then((data) => {
                setContacts((cs) =>
                    cs.map((c) => {
                        if (c.id !== viewingId) return c;
                        const remainingFollowUps = c.followUps.filter((f) => f.id !== followUpId);
                        const newInteractions = data.interaction ? [data.interaction, ...c.interactions] : c.interactions;
                        return { ...c, followUps: remainingFollowUps, interactions: newInteractions };
                    })
                );
            })
            .catch((err) => console.error('Failed to mark follow-up done', err));
    }
    function counts(s: 'All' | Status) {
        return s === 'All'
            ? contacts.length
            : contacts.filter((c) => c.status === s).length;
    }
    function toggleSort(key: string) {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }
    function updateStatus(id: number, status: Status, extra?: { lostReason?: string; lostNotes?: string }) {
        setContacts(contacts.map((c) => (c.id === id ? { ...c, status, ...extra } : c)));
        fetch(`/api/contacts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, ...extra }),
        }).catch((err) => console.error("Failed to update status", err));
    }
    function updateAssignedTo(id: number, assignedTo: string) {
        setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, assignedTo } : c)));
        fetch(`/api/contacts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedTo }),
        }).catch((err) => console.error("Failed to update assignedTo", err));
    }
    function requestStatusChange(id: number, status: Status) {
        if (status === "Lost") {
            setLostModalId(id);
            setLostReasonDraft("");
            setLostNotesDraft("");
        } else {
            updateStatus(id, status);
        }
    }
    function confirmLostReason() {
        if (lostModalId === null || !lostReasonDraft) return;
        updateStatus(lostModalId, "Lost", { lostReason: lostReasonDraft, lostNotes: lostNotesDraft });
        setLostModalId(null);
    }
    function cancelLostModal() {
        setLostModalId(null);
    }
    function compareValues(key: string, a: Contact, b: Contact) {
        if (key === 'created')
            return new Date(a.created).getTime() - new Date(b.created).getTime();
        if (key === 'role') return a.company.localeCompare(b.company);
        const av = String((a as any)[key]);
        const bv = String((b as any)[key]);
        return av.localeCompare(bv);
    }
    const filtered = contacts.filter((c) => {
        const matchesStatus = filter === 'All' || c.status === filter;
        const matchesAssigned = assignedFilter === 'all' || c.assignedTo === assignedFilter;
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q);
        return matchesStatus && matchesAssigned && matchesSearch;
    });
    const sorted = sortKey
        ? [...filtered].sort((a, b) =>
            sortDir === 'asc'
                ? compareValues(sortKey, a, b)
                : compareValues(sortKey, b, a)
        )
        : filtered;
    function toggleSelect(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }
    function toggleSelectAll() {
        if (sorted.length > 0 && sorted.every((c) => selectedIds.has(c.id))) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sorted.map((c) => c.id)));
        }
    }
    function openBulkEmail() {
        setBulkSubject("");
        setBulkBody("");
        setBulkEmailOpen(true);
        setBulkTemplateId("");
    }
    function applyBulkTemplate(id: string) {
        setBulkTemplateId(id);
        const t = EMAIL_TEMPLATES.find((tpl) => tpl.id === id);
        if (t) {
            setBulkSubject(t.subject);
            setBulkBody(t.body);
        }
    }
    function sendBulkEmail() {
        const emails = contacts
            .filter((c) => selectedIds.has(c.id) && c.email)
            .map((c) => c.email);
        const unique = Array.from(new Set(emails));
        if (unique.length === 0) return;
        const url =
            "https://mail.google.com/mail/?view=cm&fs=1&bcc=" +
            encodeURIComponent(unique.join(",")) +
            "&su=" + encodeURIComponent(bulkSubject) +
            "&body=" + encodeURIComponent(bulkBody);
        window.open(url, "_blank");
        setBulkEmailOpen(false);
    }
    const boardBase = contacts.filter((c) => {
        const matchesAssigned = assignedFilter === 'all' || c.assignedTo === assignedFilter;
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q);
        return matchesAssigned && matchesSearch;
    });
    const viewing = contacts.find((c) => c.id === viewingId) || null;
    const [notifOpen, setNotifOpen] = useState(false);
    const [remindersExpanded, setRemindersExpanded] = useState(false); const [remindersExpanded, setRemindersExpanded] = useState(false);
    const allReminders = useMemo(() => {
        const list = contacts.flatMap((c) =>
            (c.followUps || []).map((f) => ({ ...f, contactId: c.id, company: c.company, name: c.name }))
        );
        return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [contacts]);
    const atRiskContacts = useMemo(() => contacts.filter(isAtRiskContact), [contacts]);
    const newLeads = useMemo(() => {
        return contacts
            .filter((c) => c.status === 'New Lead' && !isAtRiskContact(c))
            .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }, [contacts]);
    const totalNotifCount = allReminders.length + atRiskContacts.length + newLeads.length;
    function goToContact(c: Contact) {
        openView(c);
        setNotifOpen(false);
    }
    function openAdd() {
        setForm({
            name: '',
            email: '',
            phone: '',
            company: '',
            city: '',
            website: '',
            instagram: '',
            role: 'Owner',
            assignedTo: 'Unassigned',
            status: 'New Lead',
            notes: '',
        });
        setModalMode('add');
    }
    function openEdit(c: Contact) {
        setForm({
            name: c.name,
            email: c.email,
            phone: c.phone,
            company: c.company,
            city: c.city,
            website: c.website,
            instagram: c.instagram,
            role: c.role,
            assignedTo: c.assignedTo,
            status: c.status,
            notes: c.notes,
        });
        setEditingId(c.id);
        setModalMode('edit');
    }
    function closeModal() {
        setModalMode(null);
        setEditingId(null);
    }
    function submitForm() {
        if (!form.name || !form.company || !form.city) return;
        if (modalMode === 'add') {
            const createdDate = new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
            fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    company: form.company,
                    city: form.city,
                    website: form.website,
                    instagram: form.instagram,
                    role: form.role,
                    assignedTo: form.assignedTo,
                    email: form.email,
                    phone: form.phone,
                    status: form.status,
                    lastContact: '-',
                    created: createdDate,
                    notes: form.notes,
                }),
            })
                .then((res) => res.json())
                .then((newContact) => setContacts([newContact, ...contacts]))
                .catch((err) => console.error('Failed to add contact', err));
        } else if (modalMode === 'edit' && editingId !== null) {
            setContacts(
                contacts.map((c) =>
                    c.id === editingId
                        ? {
                            ...c,
                            name: form.name,
                            company: form.company,
                            city: form.city,
                            website: form.website,
                            instagram: form.instagram,
                            role: form.role,
                            assignedTo: form.assignedTo,
                            email: form.email,
                            phone: form.phone,
                            status: form.status,
                            notes: form.notes,
                        }
                        : c
                )
            );
            fetch(`/api/contacts/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    company: form.company,
                    city: form.city,
                    website: form.website,
                    instagram: form.instagram,
                    role: form.role,
                    assignedTo: form.assignedTo,
                    email: form.email,
                    phone: form.phone,
                    status: form.status,
                    notes: form.notes,
                }),
            }).catch((err) => console.error('Failed to update contact', err));
        }
        closeModal();
    }
    function deleteContact(id: number) {
        setContacts(contacts.filter((c) => c.id !== id));
        if (viewingId === id) setViewingId(null);
        fetch(`/api/contacts/${id}`, { method: 'DELETE' }).catch((err) =>
            console.error('Failed to delete contact', err)
        );
    }
    function openView(c: Contact) {
        setViewingId(c.id);
        setNotesDraft(c.notes);
        setWonDraft({ shiftVenueDetails: c.shiftVenueDetails || "", bottlePrice: c.bottlePrice || "", shotPrice: c.shotPrice || "", address: c.address || "" });
        setNewInteraction({
            date: new Date().toISOString().slice(0, 10),
            method: 'Email',
            contactedBy: '',
            notes: '',
        });
    }
    function saveProfile() {
        if (viewingId === null) return;
        const updates = { notes: notesDraft, ...wonDraft };
        setContacts(contacts.map((c) =>
            c.id === viewingId ? { ...c, ...updates } : c
        ));
        fetch(`/api/contacts/${viewingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }).catch((err) => console.error('Failed to save profile', err));
    }
    function logInteraction() {
        if (viewingId === null || !newInteraction.notes) return;
        const interaction: Interaction = {
            id: Date.now(),
            date: newInteraction.date,
            method: newInteraction.method,
            contactedBy: newInteraction.contactedBy,
            notes: newInteraction.notes,
        };
        setContacts(
            contacts.map((c) => {
                if (c.id !== viewingId) return c;
                return {
                    ...c,
                    interactions: [interaction, ...c.interactions],
                };
            })
        );
        fetch(`/api/contacts/${viewingId}/interactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newInteraction),
        }).catch((err) => console.error('Failed to log interaction', err));
        const current = contacts.find((c) => c.id === viewingId);
        if (current && current.status === 'New Lead') {
            updateStatus(viewingId, 'Contacted');
        }
        setNewInteraction({
            date: new Date().toISOString().slice(0, 10),
            method: 'Email',
            contactedBy: '',
            notes: '',
        });
        setShowLogModal(false);
    }
    function sortArrow(key: string) {
        if (sortKey !== key) return '\u25BE';
        return sortDir === 'asc' ? '\u25B4' : '\u25BE';
    }
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                <a href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-pink-500 hover:text-pink-600">Back to Dashboard</a>
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-pink-200 border border-pink-300 shadow-sm" />
                    <div>
                        <div className="text-sm font-bold text-pink-400">Your Agency</div>
                        <div className="text-xs text-gray-900">
                            Clients and Partners CRM
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="relative">
                            <button onClick={() => setNotifOpen((o) => !o)} className="relative p-2 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-gray-50">
                                <BellIcon />
                                {totalNotifCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                        {totalNotifCount}
                                    </span>
                                )}
                            </button>
                            {notifOpen && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-[26rem] max-h-[36rem] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 z-30 p-4 space-y-5">
                                        {totalNotifCount === 0 ? (
                                            <div className="text-center text-sm text-gray-400 py-6">You're all caught up!</div>
                                        ) : (
                                            <>
                                                <div>
                                                    <div className="text-xs font-bold text-pink-400 uppercase mb-2">Reminders Due ({allReminders.length})</div>
                                                    {allReminders.length === 0 ? (
                                                        <div className="text-xs text-gray-400">No reminders outstanding.</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {(remindersExpanded ? allReminders : allReminders.slice(0, 5)).map((r) => {
                                                                const dDiff = daysAgo(r.dueDate);
                                                                const overdue = dDiff !== null && dDiff > 0;
                                                                const dueToday = dDiff === 0;
                                                                return (
                                                                    <div key={r.id} onClick={() => { const c = contacts.find((cc) => cc.id === r.contactId); if (c) goToContact(c); }} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2.5 cursor-pointer">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <div className="text-sm font-semibold text-gray-900">{r.company}</div>
                                                                            <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ' + (overdue ? 'bg-red-100 text-red-600' : dueToday ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600')}>
                                                                                {overdue ? 'Overdue' : dueToday ? 'Due Today' : formatDate(r.dueDate)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 mt-0.5">{r.note}</div>
                                                                        <div className="text-[10px] text-gray-400 mt-1">Due {formatDate(r.dueDate)} &bull; {assignedToLabel(r.assignedTo)}</div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {allReminders.length > 5 && (
                                                                <button onClick={() => setRemindersExpanded((e) => !e)} className="text-xs font-semibold text-pink-500 hover:text-pink-600">
                                                                    {remindersExpanded ? 'Show less' : 'Show ' + (allReminders.length - 5) + ' more'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-pink-400 uppercase mb-2">At Risk ({atRiskContacts.length})</div>
                                                    {atRiskContacts.length === 0 ? (
                                                        <div className="text-xs text-gray-400">No at-risk contacts.</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {atRiskContacts.map((c) => (
                                                                <div key={c.id} onClick={() => goToContact(c)} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2.5 cursor-pointer">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="text-sm font-semibold text-gray-900">{c.company}</div>
                                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 whitespace-nowrap">At Risk</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mt-0.5">{c.name} &bull; {c.city}</div>
                                                                    <div className="text-[10px] text-gray-400 mt-1">{lastContactInfo(c).text === 'No contact yet' ? 'Never contacted' : 'Last contact ' + lastContactInfo(c).text}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-pink-400 uppercase mb-2">New Leads ({newLeads.length})</div>
                                                    {newLeads.length === 0 ? (
                                                        <div className="text-xs text-gray-400">No new leads.</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {newLeads.map((c) => (
                                                                <div key={c.id} onClick={() => goToContact(c)} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2.5 cursor-pointer">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="text-sm font-semibold text-gray-900">{c.company}</div>
                                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">New Lead</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mt-0.5">{c.name} &bull; {c.city}</div>
                                                                    <div className="text-[10px] text-gray-400 mt-1">Added {formatDate(c.created)}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-pink-600"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon />
                        </div>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search CRM by name, company, email, phone, city..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                        />
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-pink-300 hover:bg-pink-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm"
                    >
                        <PlusIcon /> Add CRM Contact
                    </button>

                    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={
                                'px-3 py-2 rounded-lg text-sm font-medium ' +
                                (viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')
                            }
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={
                                'px-3 py-2 rounded-lg text-sm font-medium ' +
                                (viewMode === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')
                            }
                        >
                            Board
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setFilter('All')}
                            className={
                                'px-4 py-2 rounded-full text-sm font-medium border ' +
                                (filter === 'All'
                                    ? 'bg-pink-300 text-white border-pink-300'
                                    : 'bg-white text-gray-700 border-gray-200')
                            }
                        >
                            All <span className="ml-1">{counts('All')}</span>
                        </button>
                        <button
                            onClick={() => setFilter('New Lead')}
                            className={
                                'px-4 py-2 rounded-full text-sm font-medium border ' +
                                (filter === 'New Lead'
                                    ? 'bg-pink-300 text-white border-pink-300'
                                    : 'bg-white text-gray-700 border-gray-200')
                            }
                        >
                            New Lead <span className="ml-1">{counts('New Lead')}</span>
                        </button>
                        <button
                            onClick={() => setFilter('Contacted')}
                            className={
                                'px-4 py-2 rounded-full text-sm font-medium border ' +
                                (filter === 'Contacted'
                                    ? 'bg-pink-300 text-white border-pink-300'
                                    : 'bg-white text-gray-700 border-gray-200')
                            }
                        >
                            Contacted <span className="ml-1">{counts('Contacted')}</span>
                        </button>
                        <button
                            onClick={() => setFilter('Negotiation')}
                            className={
                                'px-4 py-2 rounded-full text-sm font-medium border ' +
                                (filter === 'Negotiation'
                                    ? 'bg-pink-300 text-white border-pink-300'
                                    : 'bg-white text-gray-700 border-gray-200')
                            }
                        >
                            Negotiation <span className="ml-1">{counts('Negotiation')}</span>
                        </button>
                        <button
                            onClick={() => setFilter('Won')}
                            className={
                                'px-4 py-2 rounded-full text-sm font-medium border ' +
                                (filter === 'Won'
                                    ? 'bg-pink-300 text-white border-pink-300'
                                    : 'bg-white text-gray-700 border-gray-200')
                            }
                        >
                            Won <span className="ml-1">{counts('Won')}</span>
                        </button>
                        <button
                            onClick={() => setFilter('Lost')}
                            className={
                                'px-4 py-2 rounded-full text-sm font-medium border ' +
                                (filter === 'Lost'
                                    ? 'bg-pink-300 text-white border-pink-300'
                                    : 'bg-white text-gray-700 border-gray-200')
                            }
                        >
                            Lost <span className="ml-1">{counts('Lost')}</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">ASSIGNED TO:</span>
                        <select
                            value={assignedFilter}
                            onChange={(e) => setAssignedFilter(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        >
                            <option value="all">All</option>
                            {assignedToOptions.map((r) => (
                                <option key={r} value={r}>
                                    {assignedToLabel(r)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {viewMode === 'list' && (
                    <>
                        {selectedIds.size > 0 && (
                            <div className="flex items-center justify-between bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 mb-3">
                                <div className="text-sm font-semibold text-pink-700">{selectedIds.size} selected</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={openBulkEmail}
                                        className="bg-pink-300 hover:bg-pink-400 text-white text-sm font-bold px-4 py-2 rounded-xl"
                                    >
                                        Email Selected
                                    </button>
                                    <button
                                        onClick={() => setSelectedIds(new Set())}
                                        className="text-sm font-medium text-gray-500 px-3 py-2"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={sorted.length > 0 && sorted.every((c) => selectedIds.has(c.id))}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300"
                                            />
                                        </th>
                                        <th
                                            onClick={() => toggleSort('role')}
                                            className="px-4 py-3 text-left text-xs font-bold text-pink-400 uppercase cursor-pointer select-none"
                                        >
                                            COMPANY {sortArrow('role')}
                                        </th>
                                        <th
                                            onClick={() => toggleSort('name')}
                                            className="px-4 py-3 text-left text-xs font-bold text-pink-400 uppercase cursor-pointer select-none"
                                        >
                                            NAME &amp; ROLE {sortArrow('name')}
                                        </th>
                                        <th
                                            onClick={() => toggleSort('city')}
                                            className="px-4 py-3 text-left text-xs font-bold text-pink-400 uppercase cursor-pointer select-none"
                                        >
                                            CITY {sortArrow('city')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-pink-500 uppercase bg-pink-50">
                                            ASSIGNED TO
                                        </th>

                                        <th
                                            onClick={() => toggleSort('status')}
                                            className="px-4 py-3 text-left text-xs font-bold text-pink-400 uppercase cursor-pointer select-none"
                                        >
                                            STATUS {sortArrow('status')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-pink-400 uppercase">
                                            LAST CONTACT
                                        </th>
                                        <th
                                            onClick={() => toggleSort('created')}
                                            className="px-4 py-3 text-left text-xs font-bold text-pink-400 uppercase cursor-pointer select-none"
                                        >
                                            CREATED {sortArrow('created')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-pink-400 uppercase">
                                            ACTIONS
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="border-b border-gray-50 hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(c.id)}
                                                    onChange={() => toggleSelect(c.id)}
                                                    className="rounded border-gray-300"
                                                />
                                            </td>
                                            <td
                                                className="px-4 py-3 font-semibold text-gray-900 cursor-pointer hover:underline"
                                                onClick={() => openView(c)}
                                            >
                                                {c.company}
                                            </td>
                                            <td
                                                className="px-4 py-3 cursor-pointer"
                                                onClick={() => openView(c)}
                                            >
                                                <div className="text-gray-900">{c.name}</div>
                                                <div className="text-xs text-gray-500">{c.role}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-xs">{c.city}</td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={c.assignedTo || 'Unassigned'}
                                                    onChange={(e) => updateAssignedTo(c.id, e.target.value)}
                                                    className={
                                                        'px-3 py-1.5 rounded-full text-xs font-bold border-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400 ' +
                                                        (c.assignedTo && c.assignedTo !== 'Unassigned' ? 'bg-pink-100 border-pink-400 text-pink-700' : 'bg-gray-100 border-gray-300 text-gray-500 border-dashed')
                                                    }
                                                >
                                                    {assignedToOptions.map((a) => (<option key={a} value={a}>{assignedToLabel(a)}</option>))}</select></td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={c.status}
                                                    onChange={(e) => requestStatusChange(c.id, e.target.value as Status)}
                                                    className={
                                                        'px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300 ' +
                                                        statusColors[c.status]
                                                    }
                                                >
                                                    {statusOptions.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <LastContactCell c={c} />
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-xs">
                                                {formatDate(c.created)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openView(c)}
                                                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                    >
                                                        <EyeIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(c)}
                                                        className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                                                    >
                                                        <PencilIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteContact(c.id)}
                                                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="text-center text-xs text-gray-400">
                            Showing {sorted.length} of {contacts.length} CRM contacts
                        </div>
                    </>
                )}
                {viewMode === 'board' && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {statusOptions.map((status) => (
                            <div
                                key={status}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                    if (dragContactId != null) requestStatusChange(dragContactId, status);
                                    setDragContactId(null);
                                }}
                                className="bg-gray-50 rounded-xl p-3 min-h-[220px] border border-gray-100"
                            >
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="font-bold text-xs uppercase tracking-wide text-gray-500">{status}</h3>
                                    <span className="text-xs font-semibold text-gray-400">
                                        {boardBase.filter((c) => c.status === status).length}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {boardBase
                                        .filter((c) => c.status === status)
                                        .map((c) => (
                                            <div
                                                key={c.id}
                                                draggable
                                                onDragStart={(e) => { setDragContactId(c.id); try { e.dataTransfer.setData("text/plain", String(c.id)); e.dataTransfer.effectAllowed = "move"; } catch (err) { } }}
                                                onClick={() => openView(c)}
                                                className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-move hover:shadow-md transition-shadow"
                                            >
                                                <div className="font-semibold text-sm text-gray-900">{c.name}</div>
                                                <div className="text-xs text-gray-500">{c.company}</div>
                                                <div className="text-xs text-gray-400 mt-1">{c.city}</div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {modalMode && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[55]">
                    <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
                        <div className="bg-pink-300 px-6 py-4 flex items-center justify-between">
                            <div className="text-white font-bold">
                                {modalMode === 'add'
                                    ? 'Add New CRM Contact'
                                    : 'Edit CRM Contact'}
                            </div>
                            <button onClick={closeModal} className="text-white">
                                <XIcon />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-1">
                                    COMPANY NAME *
                                </div>
                                <input
                                    value={form.company}
                                    onChange={(e) =>
                                        setForm({ ...form, company: e.target.value })
                                    }
                                    placeholder="e.g. Acme Corp"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold text-gray-500 mb-1">
                                        EMAIL *
                                    </div>
                                    <input
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm({ ...form, email: e.target.value })
                                        }
                                        placeholder="john@company.com"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500 mb-1">
                                        PHONE NUMBER *
                                    </div>
                                    <input
                                        value={form.phone}
                                        onChange={(e) =>
                                            setForm({ ...form, phone: e.target.value })
                                        }
                                        placeholder="+44 7700 900000"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-1">
                                    FULL NAME *
                                </div>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-1">
                                    CITY *
                                </div>
                                <input
                                    value={form.city}
                                    onChange={(e) =>
                                        setForm({ ...form, city: e.target.value })
                                    }
                                    placeholder="e.g. London"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold text-gray-500 mb-1">
                                        WEBSITE
                                    </div>
                                    <input
                                        value={form.website}
                                        onChange={(e) =>
                                            setForm({ ...form, website: e.target.value })
                                        }
                                        placeholder="https://example.com"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500 mb-1">
                                        INSTAGRAM
                                    </div>
                                    <input
                                        value={form.instagram}
                                        onChange={(e) =>
                                            setForm({ ...form, instagram: e.target.value })
                                        }
                                        placeholder="https://instagram.com/yourhandle"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold text-gray-500 mb-1">
                                        ROLE / FUNCTION
                                    </div>
                                    <select
                                        value={form.role}
                                        onChange={(e) =>
                                            setForm({ ...form, role: e.target.value as RoleType })
                                        }
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                    >
                                        {roleOptions.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500 mb-1">
                                        CRM STATUS
                                    </div>
                                    <select
                                        value={form.status}
                                        onChange={(e) =>
                                            setForm({ ...form, status: e.target.value as Status })
                                        }
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                    >
                                        {statusOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-gray-500 mb-1">
                                            ASSIGNED TO
                                        </div>
                                        <select
                                            value={form.assignedTo}
                                            onChange={(e) =>
                                                setForm({ ...form, assignedTo: e.target.value as AssignedTo })
                                            }
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                        >
                                            {assignedToOptions.map((a) => (
                                                <option key={a} value={a}>
                                                    {assignedToLabel(a)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-gray-500 mb-1">
                                    GENERAL NOTES
                                </div>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Additional context about this account..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 h-20"
                                />
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex items-center gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-semibold text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitForm}
                                className="flex-1 bg-pink-300 hover:bg-pink-400 rounded-xl py-2 text-sm font-bold text-white"
                            >
                                {modalMode === 'add' ? 'Add Contact' : 'Update Contact'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {viewing && (
                <div className="fixed inset-0 bg-black/40 flex justify-end z-40">
                    <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-xl">
                        <div className="bg-pink-300 px-6 py-5 flex items-start justify-between">
                            <div>
                                <div className="text-white font-bold text-lg">
                                    {viewing.company}
                                </div>
                                <div className="text-white/80 text-sm">
                                    {viewing.name} &bull; {viewing.role}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className={
                                        'px-3 py-1 rounded-full text-xs font-semibold ' + statusColors[viewing.status]
                                    }
                                >
                                    {viewing.status}
                                </span>
                                <button
                                    onClick={() => setViewingId(null)}
                                    className="text-white"
                                >
                                    <XIcon />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                        <MailIcon /> EMAIL ADDRESS
                                    </div>
                                    <div className="text-sm text-gray-900 mt-1">
                                        {viewing.email ? (
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${viewing.email}`}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-blue-600 hover:underline'
                                            >
                                                {viewing.email}
                                            </a>
                                        ) : (
                                            '-'
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                        <PhoneIcon /> PHONE NUMBER
                                    </div>
                                    <div className='text-sm text-gray-900 mt-1'>
                                        {viewing.phone ? (
                                            <a
                                                href={`https://wa.me/${viewing.phone.replace(/[^0-9]/g, '')}`}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-blue-600 hover:underline'
                                            >
                                                {viewing.phone}
                                            </a>
                                        ) : (
                                            '-'
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                        <BuildingIcon /> COMPANY
                                    </div>
                                    <div className="text-sm text-gray-900 mt-1">
                                        {viewing.company}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                        <CalendarIcon /> ADDED DATE
                                    </div>
                                    <div className="text-sm text-gray-900 mt-1">
                                        {formatDate(viewing.created)}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                        WEBSITE
                                    </div>
                                    <div className="text-sm text-gray-900 mt-1 break-all">
                                        {viewing.website ? (
                                            <a href={viewing.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                                {viewing.website}
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                        INSTAGRAM
                                    </div>
                                    <div className="text-sm text-gray-900 mt-1 break-all">
                                        {viewing.instagram ? (
                                            <a href={viewing.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                                {viewing.instagram}
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setShowLogModal(true)}
                                    className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700"
                                >
                                    <MailIcon /> Log Communication
                                </button>
                                <button
                                    onClick={() => openEdit(viewing)}
                                    className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700"
                                >
                                    <PencilIcon /> Edit Profile
                                </button>
                                <button
                                    onClick={() => openMeetingModal(viewing)}
                                    className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700"
                                >
                                    <CalendarIcon /> Schedule Meeting
                                </button>
                                <button
                                    onClick={openFollowUpModal}
                                    className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700"
                                >
                                    <CalendarIcon /> Follow-Up Reminder
                                </button>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-pink-400 mb-2">
                                    GENERAL ACCOUNT NOTES
                                </div>
                                <textarea
                                    value={notesDraft}
                                    onChange={(e) => setNotesDraft(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 h-20"
                                />
                            </div>
                            {(viewing.status === "Negotiation" || viewing.status === "Won" || viewing.status === "Lost") && (
                                <div>
                                    <div className="text-xs font-bold text-pink-400 mb-2">
                                        SHIFT & VENUE DETAILS
                                    </div>
                                    <textarea
                                        value={wonDraft.shiftVenueDetails}
                                        onChange={(e) => setWonDraft({ ...wonDraft, shiftVenueDetails: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 h-20"
                                    />
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 mb-1">BOTTLE PRICE</div>
                                            <input
                                                type="text"
                                                value={wonDraft.bottlePrice}
                                                onChange={(e) => setWonDraft({ ...wonDraft, bottlePrice: e.target.value })}
                                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 mb-1">SHOT PRICE</div>
                                            <input
                                                type="text"
                                                value={wonDraft.shotPrice}
                                                onChange={(e) => setWonDraft({ ...wonDraft, shotPrice: e.target.value })}
                                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-xs font-bold text-gray-500 mb-1 flex items-center justify-between">
                                            <span>ADDRESS</span>
                                            {wonDraft.address && (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wonDraft.address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-pink-500 font-normal normal-case underline"
                                                >
                                                    Open in Maps
                                                </a>
                                            )}
                                        </div>

                                        <textarea
                                            value={wonDraft.address}
                                            onChange={(e) => setWonDraft({ ...wonDraft, address: e.target.value })}
                                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 h-20"
                                        />
                                    </div>
                                </div>
                            )}
                            {viewing.status === "Lost" && (
                                <div className="mb-4">
                                    <div className="text-xs font-bold text-pink-400 mb-2">LOST REASON</div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-900">
                                        <div className="font-semibold">{viewing.lostReason || "Not specified"}</div>
                                        {viewing.lostNotes && <div className="text-xs text-gray-600 mt-1">{viewing.lostNotes}</div>}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={saveProfile}
                                className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold"
                            >
                                Save Changes
                            </button>
                            <div>
                                <div className="text-xs font-bold text-pink-400 mb-3">
                                    CONVERSATION HISTORY
                                </div>
                                {viewing.followUps.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        <div className="text-xs font-bold text-pink-400 mb-1">OPEN FOLLOW-UPS</div>
                                        {viewing.followUps.map((f) => (
                                            <div key={f.id} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={false}
                                                    onChange={() => markFollowUpDone(f.id)}
                                                    className="mt-1 rounded border-gray-300"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-900">{f.note}</div>
                                                    <div className="text-xs text-gray-400 mt-1">Due {formatDate(f.dueDate)} &bull; {assignedToLabel(f.assignedTo)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showFollowUpModal && (
                                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
                                        <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                                            <div className="bg-pink-300 px-6 py-4 flex items-center justify-between rounded-t-xl">
                                                <div className="text-white font-bold">Follow-Up Reminder</div>
                                                <button onClick={() => setShowFollowUpModal(false)} className="text-white">
                                                    <XIcon />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 mb-1">DUE DATE</div>
                                                    <input
                                                        type="date"
                                                        value={followUpForm.dueDate}
                                                        onChange={(e) => setFollowUpForm({ ...followUpForm, dueDate: e.target.value })}
                                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 mb-1">NOTE *</div>
                                                    <textarea
                                                        value={followUpForm.note}
                                                        onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })}
                                                        placeholder="What do you need to follow up on?"
                                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm h-20"
                                                    />
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Assigned to: {assignedToLabel(viewing.assignedTo)}. A calendar task will be created and a reminder email sent to them on the due date.
                                                </div>
                                                {followUpStatus === 'error' && (
                                                    <div className="text-xs text-red-500">{followUpError}</div>
                                                )}
                                                <button
                                                    onClick={submitFollowUp}
                                                    disabled={followUpStatus === 'saving'}
                                                    className="w-full bg-pink-300 hover:bg-pink-400 text-white rounded-xl py-2 text-sm font-bold disabled:opacity-40"
                                                >
                                                    {followUpStatus === 'saving' ? 'Saving...' : 'Save Follow-Up'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {showLogModal && (
                                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
                                        <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                                            <div className="bg-pink-300 px-6 py-4 flex items-center justify-between rounded-t-xl">
                                                <div className="text-white font-bold">Log New Communication</div>
                                                <button onClick={() => setShowLogModal(false)} className="text-white">
                                                    <XIcon />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-3">

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-500 mb-1">
                                                            DATE
                                                        </div>
                                                        <input
                                                            type="date"
                                                            value={newInteraction.date}
                                                            onChange={(e) =>
                                                                setNewInteraction({
                                                                    ...newInteraction,
                                                                    date: e.target.value,
                                                                })
                                                            }
                                                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-500 mb-1">
                                                            METHOD
                                                        </div>
                                                        <select
                                                            value={newInteraction.method}
                                                            onChange={(e) =>
                                                                setNewInteraction({
                                                                    ...newInteraction,
                                                                    method: e.target.value,
                                                                })
                                                            }
                                                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                                                        >
                                                            {methodOptions.map((m) => (
                                                                <option key={m} value={m}>
                                                                    {m}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-500 mb-1">
                                                            CONTACTED BY
                                                        </div>
                                                        <select
                                                            value={newInteraction.contactedBy}
                                                            onChange={(e) => {
                                                                setNewInteraction({
                                                                    ...newInteraction,
                                                                    contactedBy: e.target.value,
                                                                });
                                                            }}
                                                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                                                        ><option value="">Select staff...</option>{STAFF.map((s) => (<option key={s.email} value={s.name}>{s.name}</option>))}</select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 mb-1">
                                                        INTERACTION NOTES *
                                                    </div>
                                                    <textarea
                                                        value={newInteraction.notes}
                                                        onChange={(e) =>
                                                            setNewInteraction({
                                                                ...newInteraction,
                                                                notes: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Detail what was discussed, next action steps..."
                                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs h-16"
                                                    />
                                                </div>
                                                <button
                                                    onClick={logInteraction}
                                                    className="w-full bg-pink-300 hover:bg-pink-400 text-white rounded-xl py-2 text-sm font-bold"
                                                >
                                                    Log Interaction
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {showMeetingModal && (
                                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
                                        <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                                            <div className="bg-pink-300 px-6 py-4 flex items-center justify-between rounded-t-xl">
                                                <div className="text-white font-bold">Schedule Meeting</div>
                                                <button onClick={() => setShowMeetingModal(false)} className="text-white">
                                                    <XIcon />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {meetingStatus === 'success' ? (
                                                    <div className="space-y-3">
                                                        <div className="text-sm text-gray-700">Meeting scheduled successfully.</div>
                                                        {meetingResult?.htmlLink && (
                                                            <a href={meetingResult.htmlLink} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-pink-500 hover:text-pink-600">
                                                                View in Google Calendar
                                                            </a>
                                                        )}
                                                        {meetingResult?.meetLink && (
                                                            <a href={meetingResult.meetLink} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-pink-500 hover:text-pink-600">
                                                                Join Google Meet
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => setShowMeetingModal(false)}
                                                            className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-500 mb-1">MEETING TITLE</div>
                                                            <input
                                                                value={meetingForm.title}
                                                                onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                                                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <div className="text-xs font-bold text-gray-500 mb-1">DATE</div>
                                                                <input
                                                                    type="date"
                                                                    value={meetingForm.date}
                                                                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                                                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-gray-500 mb-1">TIME</div>
                                                                <input
                                                                    type="time"
                                                                    value={meetingForm.time}
                                                                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                                                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-500 mb-1">DURATION</div>
                                                            <select
                                                                value={meetingForm.duration}
                                                                onChange={(e) => setMeetingForm({ ...meetingForm, duration: Number(e.target.value) })}
                                                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                                                            >
                                                                <option value={15}>15 minutes</option>
                                                                <option value={30}>30 minutes</option>
                                                                <option value={45}>45 minutes</option>
                                                                <option value={60}>1 hour</option>
                                                                <option value={90}>1.5 hours</option>
                                                                <option value={120}>2 hours</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-500 mb-1">DESCRIPTION</div>
                                                            <textarea
                                                                value={meetingForm.description}
                                                                onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                                                                placeholder="Agenda, notes..."
                                                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm h-16"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-500 mb-1">ADDITIONAL GUESTS</div>
                                                            <input
                                                                value={meetingForm.guests}
                                                                onChange={(e) => setMeetingForm({ ...meetingForm, guests: e.target.value })}
                                                                placeholder="comma separated emails"
                                                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                                                            />
                                                        </div>
                                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={meetingForm.inviteClient}
                                                                onChange={(e) => setMeetingForm({ ...meetingForm, inviteClient: e.target.checked })}
                                                            />
                                                            Invite client {viewing.email ? `(${viewing.email})` : '(no email on file)'}
                                                        </label>
                                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={meetingForm.addMeet}
                                                                onChange={(e) => setMeetingForm({ ...meetingForm, addMeet: e.target.checked })}
                                                            />
                                                            Add Google Meet video call
                                                        </label>
                                                        {meetingStatus === 'error' && (
                                                            <div className="text-xs text-red-500">{meetingError}</div>
                                                        )}
                                                        <button
                                                            onClick={scheduleMeeting}
                                                            disabled={meetingStatus === 'saving'}
                                                            className="w-full bg-pink-300 hover:bg-pink-400 text-white rounded-xl py-2 text-sm font-bold disabled:opacity-40"
                                                        >
                                                            {meetingStatus === 'saving' ? 'Scheduling...' : 'Schedule Meeting'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 mt-4">
                                    {viewing.interactions.map((i) => (
                                        <div key={i.id} className="border-t border-gray-100 pt-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                    <MailIcon /> {i.method} Interaction
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <CalendarIcon /> {i.date}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {i.notes}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                LOGGED BY: {i.contactedBy}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {lostModalId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="text-sm font-bold text-gray-900 mb-3">Reason for Losing Deal</div>
                        <div className="text-xs text-gray-500 mb-3">Please select a reason before marking this contact as Lost.</div>
                        <select
                            value={lostReasonDraft}
                            onChange={(e) => setLostReasonDraft(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 mb-3"
                        >
                            <option value="">Select a reason...</option>
                            {lostReasonOptions.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <textarea
                            value={lostNotesDraft}
                            onChange={(e) => setLostNotesDraft(e.target.value)}
                            placeholder="Additional details (optional)"
                            className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 h-24 mb-4"
                        />
                        <div className="flex gap-2">
                            <button onClick={cancelLostModal} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-bold">Cancel</button>
                            <button onClick={confirmLostReason} disabled={!lostReasonDraft} className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-40">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            {bulkEmailOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[65]">
                    <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
                        <div className="bg-pink-300 px-6 py-4 flex items-center justify-between">
                            <div className="text-white font-bold">
                                Email {selectedIds.size} Contact{selectedIds.size === 1 ? "" : "s"}
                            </div>
                            <button onClick={() => setBulkEmailOpen(false)} className="text-white">
                                <XIcon />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-1">TEMPLATE</div>
                                <select
                                    value={bulkTemplateId}
                                    onChange={(e) => applyBulkTemplate(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                >
                                    <option value="">Custom / Blank</option>
                                    {EMAIL_TEMPLATES.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-1">SUBJECT</div>
                                <input
                                    value={bulkSubject}
                                    onChange={(e) => setBulkSubject(e.target.value)}
                                    placeholder="e.g. Quick check-in"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                                />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-1">MESSAGE</div>
                                <textarea
                                    value={bulkBody}
                                    onChange={(e) => setBulkBody(e.target.value)}
                                    placeholder="Write your message..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 h-32"
                                />
                            </div>
                            <div className="text-xs text-gray-400">
                                This opens Gmail with everyone added as BCC, so contacts will not see the other recipients.
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex items-center gap-3">
                            <button
                                onClick={() => setBulkEmailOpen(false)}
                                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-semibold text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendBulkEmail}
                                className="flex-1 bg-pink-300 hover:bg-pink-400 rounded-xl py-2 text-sm font-bold text-white"
                            >
                                Open in Gmail
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

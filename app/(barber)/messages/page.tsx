"use client";

import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  sentAt: string;
};

type Conversation = {
  id: string;
  clientName: string;
  clientPhone: string;
  unread: boolean;
  messages: Message[];
};

type Template = {
  id: string;
  name: string;
  body: string;
  trigger: string;
};

type Automation = {
  id: string;
  trigger: string;
  templateId: string;
  enabled: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    clientName: "Marcus Thompson",
    clientPhone: "+1 (801) 555-0192",
    unread: true,
    messages: [
      { id: "m1", direction: "outbound", body: "Leone's Barbershop: Your haircut appointment is confirmed for 2:00 PM today. Reply HELP for assistance or STOP to unsubscribe. Msg & data rates may apply.", sentAt: "2026-03-13T18:00:00Z" },
      { id: "m2", direction: "inbound", body: "Thanks! I'll be there. Can I get a fade instead of a trim?", sentAt: "2026-03-13T18:14:00Z" },
      { id: "m3", direction: "outbound", body: "Absolutely, we can take care of that. See you at 2!", sentAt: "2026-03-13T18:20:00Z" },
      { id: "m4", direction: "inbound", body: "Perfect, see you then", sentAt: "2026-03-13T18:22:00Z" },
    ],
  },
  {
    id: "conv-2",
    clientName: "Jordan Ellis",
    clientPhone: "+1 (801) 555-0348",
    unread: true,
    messages: [
      { id: "m5", direction: "outbound", body: "Leone's Barbershop: Thanks for joining the queue. Your estimated wait time is 30 minutes. We'll notify you when your barber is ready. Reply STOP to unsubscribe. Msg & data rates may apply.", sentAt: "2026-03-12T14:00:00Z" },
      { id: "m6", direction: "inbound", body: "How much longer? I've been waiting 40 mins", sentAt: "2026-03-13T09:30:00Z" },
    ],
  },
  {
    id: "conv-3",
    clientName: "Tyler Washington",
    clientPhone: "+1 (801) 555-0571",
    unread: false,
    messages: [
      { id: "m7", direction: "outbound", body: "Leone's Barbershop: Your haircut appointment is confirmed for 10:00 AM today. Reply HELP for assistance or STOP to unsubscribe. Msg & data rates may apply.", sentAt: "2026-03-10T12:00:00Z" },
      { id: "m8", direction: "inbound", body: "Got it, thanks", sentAt: "2026-03-10T12:45:00Z" },
      { id: "m9", direction: "outbound", body: "Leone's Barbershop: You're next in line! Please head to the shop now. Reply STOP to unsubscribe. Msg & data rates may apply.", sentAt: "2026-03-12T09:00:00Z" },
    ],
  },
  {
    id: "conv-4",
    clientName: "Antoine Davis",
    clientPhone: "+1 (801) 555-0804",
    unread: false,
    messages: [
      { id: "m10", direction: "outbound", body: "Leone's Barbershop: Reminder — your appointment is tomorrow. Reply HELP for assistance or STOP to unsubscribe. Msg & data rates may apply.", sentAt: "2026-03-11T16:30:00Z" },
      { id: "m11", direction: "inbound", body: "Thanks for the reminder", sentAt: "2026-03-11T17:10:00Z" },
    ],
  },
  {
    id: "conv-5",
    clientName: "DeShawn Parker",
    clientPhone: "+1 (801) 555-0229",
    unread: false,
    messages: [
      { id: "m13", direction: "outbound", body: "Leone's Barbershop: Your barber is ready for you. Please check in at the front desk. Reply STOP to unsubscribe. Msg & data rates may apply.", sentAt: "2026-03-09T10:00:00Z" },
    ],
  },
];

const DEFAULT_TEMPLATES: Template[] = [
  { id: "tpl-queue-join", name: "Queue Join Confirmation", trigger: "Customer joins walk-in queue", body: "Leone's Barbershop: Thanks for joining the queue. Your estimated wait time is [X] minutes. We'll notify you when your barber is ready. Reply STOP to unsubscribe. Msg & data rates may apply." },
  { id: "tpl-appt-confirm", name: "Appointment Confirmation", trigger: "Customer books an appointment", body: "Leone's Barbershop: Your haircut appointment is confirmed for [TIME] today. Reply HELP for assistance or STOP to unsubscribe. Msg & data rates may apply." },
  { id: "tpl-next-in-line", name: "Next In Line Alert", trigger: "Customer reaches front of queue", body: "Leone's Barbershop: You're next in line! Please head to the shop now. Reply STOP to unsubscribe. Msg & data rates may apply." },
  { id: "tpl-barber-ready", name: "Barber Ready", trigger: "Barber marks customer as ready", body: "Leone's Barbershop: Your barber is ready for you. Please check in at the front desk. Reply STOP to unsubscribe. Msg & data rates may apply." },
  { id: "tpl-reminder", name: "Appointment Reminder", trigger: "Day before appointment", body: "Leone's Barbershop: Reminder — your appointment is tomorrow. Reply HELP for assistance or STOP to unsubscribe. Msg & data rates may apply." },
];

const DEFAULT_AUTOMATIONS: Automation[] = [
  { id: "auto-1", trigger: "Customer joins walk-in queue", templateId: "tpl-queue-join", enabled: true },
  { id: "auto-2", trigger: "Appointment booked", templateId: "tpl-appt-confirm", enabled: true },
  { id: "auto-3", trigger: "Next in line", templateId: "tpl-next-in-line", enabled: true },
  { id: "auto-4", trigger: "Barber ready", templateId: "tpl-barber-ready", enabled: true },
  { id: "auto-5", trigger: "Day-before reminder", templateId: "tpl-reminder", enabled: true },
];

const AUTOMATIONS_KEY = "barberpro.messaging.automations";
const TEMPLATES_KEY = "barberpro.messaging.templates";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getLastMessage(conv: Conversation): Message | undefined {
  return conv.messages[conv.messages.length - 1];
}

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

type Tab = "inbox" | "templates" | "automations";

// ─────────────────────────────────────────────────────────────────────────────
// Broadcast modal
// ─────────────────────────────────────────────────────────────────────────────

function BroadcastModal({ onClose, clientCount }: { onClose: () => void; clientCount: number }) {
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!body.trim()) return;
    // Twilio not configured — simulate
    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Send to all clients</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {sent ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-gray-700">Message queued for {clientCount} clients.</p>
            <p className="text-xs text-gray-400 mt-1">Will send once Twilio is connected.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              This will send to all <span className="font-medium text-gray-700">{clientCount} clients</span> in your database. Make sure your message includes opt-out language per campaign requirements.
            </p>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Leone's Barbershop: [your message here]. Reply STOP to unsubscribe. Msg & data rates may apply."}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none mb-1"
            />
            <p className="text-xs text-gray-400 mb-4">{body.length} / 160 chars{body.length > 160 ? " — will split into multiple messages" : ""}</p>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleSend}
                disabled={!body.trim()}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Send to all
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>("inbox");
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [sendNotice, setSendNotice] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const [templates, setTemplates] = useState<Template[]>(() => {
    if (typeof window === "undefined") return DEFAULT_TEMPLATES;
    try { const s = localStorage.getItem(TEMPLATES_KEY); return s ? JSON.parse(s) : DEFAULT_TEMPLATES; } catch { return DEFAULT_TEMPLATES; }
  });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [newTemplate, setNewTemplate] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplTrigger, setNewTplTrigger] = useState("");
  const [newTplBody, setNewTplBody] = useState("");

  const [automations, setAutomations] = useState<Automation[]>(() => {
    if (typeof window === "undefined") return DEFAULT_AUTOMATIONS;
    try { const s = localStorage.getItem(AUTOMATIONS_KEY); return s ? JSON.parse(s) : DEFAULT_AUTOMATIONS; } catch { return DEFAULT_AUTOMATIONS; }
  });

  useEffect(() => { localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(automations)); }, [automations]);
  useEffect(() => { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)); }, [templates]);
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedId, conversations]);

  const unreadCount = conversations.filter((c) => c.unread).length;
  const filtered = conversations.filter(
    (c) => c.clientName.toLowerCase().includes(search.toLowerCase()) || c.clientPhone.includes(search)
  );
  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  const sendMessage = () => {
    if (!draft.trim() || !selectedConv) return;
    const msg: Message = { id: genId(), direction: "outbound", body: draft.trim(), sentAt: new Date().toISOString() };
    setConversations((prev) =>
      prev.map((c) => c.id === selectedConv.id ? { ...c, messages: [...c.messages, msg] } : c)
    );
    setDraft("");
    setSendNotice(true);
    setTimeout(() => setSendNotice(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const toggleAutomation = (id: string) =>
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));

  const startEditTemplate = (tpl: Template) => { setEditingTemplateId(tpl.id); setEditDraft(tpl.body); };
  const saveEditTemplate = (id: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, body: editDraft } : t)));
    setEditingTemplateId(null);
  };
  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setAutomations((prev) => prev.filter((a) => a.templateId !== id));
  };
  const saveNewTemplate = () => {
    if (!newTplName.trim() || !newTplBody.trim()) return;
    const tpl: Template = { id: genId(), name: newTplName.trim(), trigger: newTplTrigger.trim() || "Manual", body: newTplBody.trim() };
    setTemplates((prev) => [...prev, tpl]);
    setNewTemplate(false);
    setNewTplName(""); setNewTplTrigger(""); setNewTplBody("");
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "inbox", label: `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "templates", label: "Templates" },
    { key: "automations", label: "Automations" },
  ];

  return (
    <div className="flex flex-col h-full">
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} clientCount={conversations.length} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowBroadcast(true)}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Send to all
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── INBOX ── */}
      {tab === "inbox" && (
        <div className="flex flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm min-h-[540px]">
          {/* Sidebar */}
          <div className="w-80 shrink-0 flex flex-col border-r border-gray-100">
            <div className="p-3 border-b border-gray-100">
              <input
                type="search"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
              />
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-400">No conversations found.</li>
              )}
              {filtered.map((conv) => {
                const last = getLastMessage(conv);
                const isSelected = conv.id === selectedId;
                return (
                  <li key={conv.id}>
                    <button
                      onClick={() => {
                        setSelectedId(conv.id);
                        if (conv.unread) setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread: false } : c));
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${isSelected ? "bg-gray-100" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-sm truncate ${conv.unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                          {conv.clientName}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">{last ? formatTimestamp(last.sentAt) : ""}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {conv.unread && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                        <p className={`text-xs truncate ${conv.unread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                          {last ? last.body : "No messages yet"}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Thread */}
          {selectedConv ? (
            <div className="flex flex-col flex-1 min-w-0">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {selectedConv.clientName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedConv.clientName}</p>
                  <p className="text-xs text-gray-400">{selectedConv.clientPhone}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {selectedConv.messages.map((msg) => {
                  const isOut = msg.direction === "outbound";
                  return (
                    <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isOut ? "bg-gray-900 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        <p>{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isOut ? "text-gray-400 text-right" : "text-gray-400"}`}>
                          {formatTimestamp(msg.sentAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>
              {sendNotice && (
                <div className="mx-5 mb-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  Message saved — will send once Twilio is connected in Settings.
                </div>
              )}
              <div className="px-5 py-3 border-t border-gray-100">
                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!draft.trim()}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab === "templates" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">All messages must include brand name and STOP/HELP opt-out language per Twilio A2P requirements.</p>
            <button
              onClick={() => setNewTemplate(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              + New template
            </button>
          </div>

          {/* New template form */}
          {newTemplate && (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-900">New template</p>
              <input
                type="text"
                placeholder="Template name (e.g. No-Show Follow-up)"
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <input
                type="text"
                placeholder="Trigger description (e.g. Customer no-shows) — optional"
                value={newTplTrigger}
                onChange={(e) => setNewTplTrigger(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <textarea
                rows={4}
                placeholder={"Leone's Barbershop: [message]. Reply STOP to unsubscribe. Msg & data rates may apply."}
                value={newTplBody}
                onChange={(e) => setNewTplBody(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setNewTemplate(false); setNewTplName(""); setNewTplTrigger(""); setNewTplBody(""); }} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={saveNewTemplate} disabled={!newTplName.trim() || !newTplBody.trim()} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Save template</button>
              </div>
            </div>
          )}

          {templates.map((tpl) => (
            <div key={tpl.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{tpl.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tpl.trigger}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {editingTemplateId === tpl.id ? (
                    <>
                      <button onClick={() => setEditingTemplateId(null)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                      <button onClick={() => saveEditTemplate(tpl.id)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors">Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditTemplate(tpl)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                      <button onClick={() => deleteTemplate(tpl.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                      <div className="relative group">
                        <button disabled className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">Send to customer</button>
                        <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Connect Twilio in Settings to send
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {editingTemplateId === tpl.id ? (
                <textarea
                  rows={4}
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                />
              ) : (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">{tpl.body}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── AUTOMATIONS ── */}
      {tab === "automations" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Automations will activate once Twilio is connected in Settings. Toggle states are saved.
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
            {automations.map((auto) => {
              const tpl = templates.find((t) => t.id === auto.templateId);
              return (
                <div key={auto.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{auto.trigger}</p>
                    {tpl && <p className="text-xs text-gray-400 mt-0.5">Sends: {tpl.name}</p>}
                  </div>
                  <button
                    onClick={() => toggleAutomation(auto.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${auto.enabled ? "bg-gray-900" : "bg-gray-200"}`}
                    role="switch"
                    aria-checked={auto.enabled}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${auto.enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

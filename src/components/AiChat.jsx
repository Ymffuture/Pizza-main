// src/components/AiChat.jsx — with reasoning stream + typewriter + collapsible thinking
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,Sparkles,Send, BotMessageSquare, Forward, CornerRightUp,
  Loader, Minimize2, Maximize2, XCircle, CheckCircle, Clock,
  CircleUser, Copy, Check, Link as LinkIcon, ChevronDown, ChevronRight,
  Brain, Paperclip, FileText, Mic, Square
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useBilling } from "../context/BillingContext";
import { useParams, Link } from "react-router-dom";
import { getBusinessHoursStatus } from "../utils/businessHours";
import Avatar from "./Avatar";
import { Loader3 } from "./Loader";
import { IoSend } from "react-icons/io5";
import { TbCircleDotted } from "react-icons/tb";
import { GiCursedStar } from "react-icons/gi";
import { FaCircleNotch } from "react-icons/fa6";
import { FaBots } from "react-icons/fa6";
import { CiCircleCheck } from "react-icons/ci";
import { TbTruckDelivery } from "react-icons/tb";
import {LuChevronsLeftRight, LuChevronsLeftRightEllipsis } from "react-icons/lu"; 
import { TbSearch, TbX, TbMessage2 } from "react-icons/tb";
import { GiHamburger } from "react-icons/gi";
import { RiVerifiedBadgeFill } from "react-icons/ri";


const AVATAR_URL = "https://api.dicebear.com/9.x/avataaars/svg?seed=ai";

/* Mirrors services/file_reader_service.py on the backend — keep in sync */
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/heic", "image/heif", "image/gif",
  "application/pdf", "text/plain", "text/csv",
];
const MAX_RECORD_SECONDS = 60; // auto-stop a voice note at 60s

/* ─────────────────────────────────────────────────────────────────────────── */
/*  REASONING — AI-GENERATED (OpenRouter) + keyword fallback                  */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Last-resort fallback — only used if /ai/reasoning AND network both fail */
const FALLBACK_STEPS = {
  track:    ["Identifying order reference…", "Querying order records…", "Fetching delivery status…", "Formatting result for you…"],
  cancel:   ["Parsing cancellation intent…", "Verifying order ID…", "Checking eligibility window…", "Preparing confirmation prompt…"],
  menu:     ["Scanning available items…", "Checking today's specials…", "Matching your preferences…", "Curating recommendations…"],
  feedback: ["Logging your feedback context…", "Identifying the relevant item…", "Preparing response…"],
  default:  ["Reading your message carefully…", "Analysing intent and context…", "Checking relevant info…", "Composing reply…"],
};

function getFallbackSteps(text) {
  const t = text.toLowerCase();
  if (t.includes("track") || t.includes("where") || t.includes("status") ||
      (t.includes("order") && !t.includes("cancel"))) return FALLBACK_STEPS.track;
  if (t.includes("cancel"))                          return FALLBACK_STEPS.cancel;
  if (t.includes("menu") || t.includes("suggest") ||
      t.includes("kota") || t.includes("eat") ||
      t.includes("food"))                            return FALLBACK_STEPS.menu;
  if (t.includes("feedback") || t.includes("complain") ||
      t.includes("review"))                          return FALLBACK_STEPS.feedback;
  return FALLBACK_STEPS.default;
}

/* Calls backend /ai/reasoning — OpenRouter, key never exposed */
async function generateReasoningSteps(userText) {
  try {
    const { data } = await axiosClient.post("/ai/reasoning", { message: userText });

    if (Array.isArray(data?.steps) && data.steps.length >= 2) {
      return data.steps;
    }

    console.warn("[KotaBot] /ai/reasoning bad shape — using fallback", data);
    return getFallbackSteps(userText);

  } catch (err) {
    const status = err?.response?.status;

    if (status === 404) {
      // Route not deployed yet — silent fallback, no noisy warning
      console.info("[KotaBot] /ai/reasoning not deployed yet — using keyword fallback");
    } else if (status === 401 || status === 403) {
      console.info("[KotaBot] /ai/reasoning auth error — using keyword fallback");
    } else {
      console.warn(`[KotaBot] /ai/reasoning ${status ?? "network"} error — using fallback`);
    }

    return getFallbackSteps(userText);
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function extractOrderId(text) {
  const full = text.match(/(?<![a-zA-Z0-9_])([0-9a-fA-F]{24})(?![a-zA-Z0-9_])/);
  return full ? full[1] : null;
}

function formatRecordTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function useTypewriter(target, enabled, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone]           = useState(false);
  const frameRef = useRef(null);
  const idxRef   = useRef(0);

  useEffect(() => {
    if (!enabled || !target) return;
    setDisplayed("");
    setDone(false);
    idxRef.current = 0;

    const tick = () => {
      idxRef.current += 3; // chars per frame — tweak for speed
      const slice = target.slice(0, idxRef.current);
      setDisplayed(slice);
      if (idxRef.current < target.length) {
        frameRef.current = setTimeout(tick, speed);
      } else {
        setDisplayed(target);
        setDone(true);
      }
    };
    frameRef.current = setTimeout(tick, speed);
    return () => clearTimeout(frameRef.current);
  }, [target, enabled, speed]);

  return { displayed, done };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  COPY ORDER ID                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function CopyOrderId({ orderId }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = orderId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="kb-copy-order-btn" onClick={handleCopy} title="Copy Order ID">
      {copied
        ? <Check className="w-3 h-3" style={{ color: "#4ade80" }} />
        : <Copy className="w-3 h-3" />}
      <span className="kb-copy-text">{copied ? "Copied!" : "Copy ID"}</span>
    </button>
  );
}

const WELCOME_ACTIONS = [
  { Icon: TbSearch,   label: "Track an order" },
  { Icon: TbX,        label: "Cancel an order" },
  { Icon: GiHamburger,label: "Suggest something lekker" },
  { Icon: TbMessage2, label: "Pass on feedback" },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MARKDOWN                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

const markdownComponents = {
  p:          ({ children }) => <p className="kb-md-p">{children}</p>,
  strong:     ({ children }) => <strong className="kb-md-strong">{children}</strong>,
  em:         ({ children }) => <em className="kb-md-em">{children}</em>,
  ul:         ({ children }) => <ul className="kb-md-ul">{children}</ul>,
  ol:         ({ children }) => <ol className="kb-md-ol">{children}</ol>,
  li:         ({ children }) => <li className="kb-md-li">{children}</li>,
  a:          ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="kb-md-a">{children}</a>
  ),
  code:       ({ inline, children }) =>
    inline
      ? <code className="kb-md-code-inline">{children}</code>
      : <pre className="kb-md-pre"><code>{children}</code></pre>,
  blockquote: ({ children }) => <blockquote className="kb-md-blockquote">{children}</blockquote>,
  h1:  ({ children }) => <p className="kb-md-h">{children}</p>,
  h2:  ({ children }) => <p className="kb-md-h">{children}</p>,
  h3:  ({ children }) => <p className="kb-md-h3">{children}</p>,
  hr:  () => <hr className="kb-md-hr" />,
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  THINKING BLOCK                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function ThinkingBlock({ steps, elapsed, isThinking }) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!isThinking) {
      const t = setTimeout(() => setExpanded(false), 900);
      return () => clearTimeout(t);
    }
    setExpanded(true);
  }, [isThinking]);

  const label = isThinking
  ? steps.length === 0
    ? ""
    : steps.length === 1
      ? "Thinking..."
      : `Executing reasoning... ${steps.length} step${steps.length !== 1 ? "s" : ""}`
  : `Thought for · ${elapsed}s`;
  
  return (
    <div className="claude-thinking-wrap">
      <button
        className={`claude-thinking-header${isThinking ? " claude-thinking-active" : ""}`}
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="claude-thinking-header-left">
          <TbCircleDotted size={16} className={isThinking ? "claude-think-spin" : ""} />
          <span className="claude-thinking-label">{label}</span>
          
          {/*{isThinking && (
            <span className="claude-thinking-dots">
              <span /><span /><span />
            </span>
          )}
          */} 
          
        </span>
        {steps.length !== 0 ? (
        <span >
          {expanded ? <LuChevronsLeftRight size={14} strokeWidth={2} /> : <LuChevronsLeftRightEllipsis size={14} strokeWidth={2} />} 
         
        </span>
      ) :""} 
        
      </button>

      {expanded && steps.length > 0 && (
        <div className="claude-thinking-body">
          {steps.map((step, i) => {
            const done = !isThinking || i < steps.length - 1;
            return (
              <div
                key={i}
                className={`claude-thinking-line${!done ? " claude-thinking-line-active" : ""}`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <span
                  className="claude-thinking-bullet"
                  style={{ color: done ? "#2d7d46" : "#d97757" }}
                >
                  {done ? <CiCircleCheck />: <FaCircleNotch className="animate-spin" />}
                </span>
                <span className="claude-thinking-text">{step}</span>
                {!done && <span className="claude-thinking-cursor"><GiCursedStar /></span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MESSAGE BUBBLE                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
function RotatingActions({ actions, interval = 2000 }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!actions || actions.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % actions.length);
    }, interval);
    return () => clearInterval(id);
  }, [actions, interval]);

  if (!actions || actions.length === 0) return null;
  const { Icon, label } = actions[idx];

  return (
    <div className="kb-welcome-rotator">
      <div key={idx} className="kb-welcome-rotator-item">
        <Icon className="kb-welcome-action-icon" />
        <span>{label}</span>
      </div>
    </div>
  );
  }

function Bubble({ msg, onCancelConfirm, cancellingId, user }) {
  const isUser  = msg.role === "user";
  const orderId = !isUser ? extractOrderId(msg.content) : null;

  /* typewriter runs when msg.streaming === true */
  const { displayed, done: twDone } = useTypewriter(
    msg.content,
    !isUser && !!msg.streaming,
    14,
  );

  const renderContent = !isUser && msg.streaming ? displayed : msg.content;
  const stillStreaming = !isUser && msg.streaming && !twDone;

  return (
    <div className={`kb-ai-bubble-row ${isUser ? "kb-ai-bubble-user" : "kb-ai-bubble-bot"}`}>
      {!isUser && (
        <div className="kb-ai-avatar kb-ai-avatar-bot">
          <img src={AVATAR_URL} alt="AI" className="w-5 h-5" />
        </div>
      )}

      <div className="kb-ai-bubble-col">
        {/* Thinking block — only on bot messages that have reasoning */}
        {!isUser && msg.reasoning && (
          <ThinkingBlock
            steps={msg.reasoning.steps}
            elapsed={msg.reasoning.elapsed}
            isThinking={!!msg.reasoning.thinking}
          />
        )}

        {/* Typing dots while pre-typing phase */}
        {!isUser && msg.preTyping && !msg.content && (
          <div className="kb-ai-bubble kb-ai-bubble-b kb-ai-typing-bubble">
            <span /><span /><span />
          </div>
        )}

        {/* Main bubble */}
        {msg.content && (
          <div className={`kb-ai-bubble ${isUser ? "kb-ai-bubble-u" : "kb-ai-bubble-b"}`}>
            {isUser ? (
              <>
                {msg.attachment && (
                  <div className="kb-attach-sent-chip">
                    <Paperclip className="w-3 h-3" />
                    <span>{msg.attachment.filename}</span>
                  </div>
                )}
                {msg.content}
              </>
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {renderContent}
                </ReactMarkdown>
                
{/* Welcome quick-actions — rotating, one at a time */}
               {msg.actions && <RotatingActions actions={msg.actions} />}

              
                { msg.footer && <p className="kb-md-p kb-welcome-footer">{msg.footer}</p>}

                {/* Streaming cursor */}
                {stillStreaming && <span className="kb-stream-cursor"><GiCursedStar/></span>}

                {/* Order ID copy */}
                {!stillStreaming && orderId && (
                  <div className="kb-order-id-row">
                    <span className="kb-order-id-label">Order ID detected:</span>
                    <CopyOrderId orderId={orderId} />
                  </div>
                )}

                {/* Cancel confirm */}
                {!stillStreaming && msg.pendingCancelId && (
                  <div className="kb-confirm-row">
                    <p className="kb-confirm-text">Confirm cancellation?</p>
                    <div className="kb-confirm-btns">
                      <button
                        className="kb-confirm-yes"
                        disabled={cancellingId === msg.pendingCancelId}
                        onClick={() => onCancelConfirm(msg.pendingCancelId)}
                      >
                        {cancellingId === msg.pendingCancelId
                          ? <Loader className="w-3 h-3 kb-ai-spin" />
                          : "Yes, cancel it"}
                      </button>
                      <button className="kb-confirm-no" onClick={() => onCancelConfirm(null)}>
                        No, keep it
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="kb-ai-avatar kb-ai-avatar-user">
          {user?.picture || user?.avatar
            ? <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={24} />
            : <CircleUser className="w-4 h-4" />}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HOURS BANNER                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function HoursBanner({ status }) {
  if (!status) return null;
  const cls = status.isOpen
    ? status.closingSoon ? "kb-hours-warn" : "kb-hours-open"
    : "kb-hours-closed";
  return (
    <div className={`kb-hours-banner ${cls}`}>
      <Clock style={{ width: 11, height: 11, flexShrink: 0 }} />
      <span>{status.message}</span>
    </div>
  );
}

function ClosedNotice({ status }) {
  if (!status || status.isOpen) return null;
  return (
    <div className="kb-closed-wrap">
      <div className="kb-closed-icon">
        <Clock style={{ width: 22, height: 22, color: "#00E5FF" }} />
      </div>
      <p className="kb-closed-title">We are closed</p>
      <p className="kb-closed-msg">{status.message}</p>
      <div className="kb-closed-sched">
        {Object.entries(status.schedule).map(([day, hrs]) => (
          <div key={day} className={`kb-closed-row${day === status.day ? " kb-closed-today" : ""}`}>
            <span className="kb-closed-day">{day}</span>
            <span className="kb-closed-hrs">{hrs}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CancelCard({ cancelResult, onDismiss }) {
  if (!cancelResult) return null;
  if (cancelResult.success) {
    return (
      <div className="kb-cancel-card kb-cancel-success">
        <CheckCircle className="w-4 h-4" style={{ color: "#4ade80", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p className="kb-cancel-title">Order Cancelled</p>
          <p className="kb-cancel-sub">Order #{cancelResult.short_id} cancelled successfully.</p>
        </div>
        <button className="kb-cancel-dismiss" onClick={onDismiss}>×</button>
      </div>
    );
  }
  return (
    <div className="kb-cancel-card kb-cancel-fail">
      <XCircle className="w-4 h-4" style={{ color: "#f87171", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p className="kb-cancel-title">Couldn&apos;t Cancel</p>
        <p className="kb-cancel-sub">{cancelResult.reason ?? "Something went wrong."}</p>
      </div>
      <button className="kb-cancel-dismiss" onClick={onDismiss}>×</button>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="kb-signin-prompt">
      <div className="kb-signin-icon">
        <LinkIcon style={{ width: 18, height: 18, color: "#00E5FF" }} />
      </div>
      <div className="kb-signin-content">
        <p className="kb-signin-title">Sign in required</p>
        <p className="kb-signin-text">
          Please <Link to="/login" className="kb-signin-link">sign in</Link> to chat with KotaBot
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function AiChat() {
  const { isAuth, user } = useAuth();
  const { isProBite, credits, applyCreditsUpdate } = useBilling();
  const outOfCredits = isAuth && !isProBite && !credits.unlimited && (credits.credits ?? 1) <= 0;
  const params      = useParams();
  const pageOrderId = params?.id || null;

  const [hoursStatus, setHoursStatus] = useState(() => getBusinessHoursStatus());
  const [open,        setOpen]        = useState(false);
  const [minimised,   setMin]         = useState(false);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [unread,      setUnread]      = useState(0);
  const [contextId,   setCtxId]       = useState(pageOrderId);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelResult, setCancelResult] = useState(null);

  const [attachedFile, setAttachedFile] = useState(null);
  const [attachError,  setAttachError]  = useState("");
  const [previewUrl,   setPreviewUrl]   = useState(null);

  const [isRecording,   setIsRecording]   = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [transcribing,  setTranscribing]  = useState(false);

  const [messages, setMessages] = useState([
  {
    role: "assistant",
    content: "Hello! 👋 I'm **KotaBot**. I can help you:",
    actions: WELCOME_ACTIONS,
    footer: "What can I do for you?",
  },
]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileInputRef  = useRef(null);
  const abortRef  = useRef(null);
  const thinkTimerRef = useRef(null);
  const startTimeRef  = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const mediaStreamRef   = useRef(null);
  const recordTimerRef   = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setHoursStatus(getBusinessHoursStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open && !minimised) inputRef.current?.focus(); }, [open, minimised]);
  useEffect(() => { if (pageOrderId) setCtxId(pageOrderId); }, [pageOrderId]);

  /* Image thumbnail preview — created/revoked as the attachment changes */
  useEffect(() => {
    if (!attachedFile || !attachedFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(attachedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachedFile]);

  /* Auto-stop a voice note once it hits the cap */
  useEffect(() => {
    if (isRecording && recordSeconds >= MAX_RECORD_SECONDS) stopRecording();
  }, [recordSeconds, isRecording]);

  /* Release the mic / clear timers if the widget unmounts mid-recording */
  useEffect(() => {
    return () => {
      clearInterval(recordTimerRef.current);
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const isOpen = hoursStatus.isOpen;

  /* ── Attach a file — validated client-side, read by Gemini at send time ── */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires onChange
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachError(`File too large — max ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB`);
      return;
    }
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      setAttachError("Unsupported file — try an image (jpg/png/webp) or PDF");
      return;
    }
    setAttachError("");
    setAttachedFile(file);
  };

  /* ── Voice notes — record with MediaRecorder, transcribe via Gemini,
       drop the transcript straight into the input box for review ── */
  const releaseMic = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  };

  const startRecording = async () => {
    if (isRecording || loading || transcribing) return;
    setAttachError("");

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setAttachError("Voice recording isn't supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeCandidates = [
        "audio/webm;codecs=opus", "audio/webm",
        "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg",
      ];
      const supportedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported?.(m));

      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => handleRecordingStop(recorder.mimeType || supportedMime || "audio/webm");

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err) {
      setAttachError("Microphone access denied — check your browser permissions.");
      releaseMic();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop(); // → onstop → handleRecordingStop
    }
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null; // discard — skip transcription
      if (mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    }
    clearInterval(recordTimerRef.current);
    releaseMic();
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const handleRecordingStop = async (mimeType) => {
    releaseMic();
    setRecordSeconds(0);

    const blob = audioChunksRef.current.length
      ? new Blob(audioChunksRef.current, { type: mimeType })
      : null;
    audioChunksRef.current = [];
    if (!blob || blob.size === 0) return; // cancelled, or nothing was captured

    setTranscribing(true);
    try {
      const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
      const audioFile = new File([blob], `voice-note.${ext}`, { type: mimeType });

      const fd = new FormData();
      fd.append("file", audioFile);

      const { data } = await axiosClient.post("/ai/chat/read-file", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInput((prev) => (prev.trim() ? `${prev.trim()} ${data.description}` : data.description));
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      setAttachError(err?.response?.data?.detail || "Couldn't transcribe that — try again or type it instead.");
    } finally {
      setTranscribing(false);
    }
  };

  /* ── helpers to mutate the last bot message in place ── */
  const patchLast = useCallback((patch) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = { ...next[next.length - 1], ...patch };
      next[next.length - 1] = last;
      return next;
    });
  }, []);

  /* ── Cancel confirm ── */
  const handleCancelConfirm = async (orderId) => {
    if (!orderId) {
      setMessages((prev) => prev.map((m) => ({ ...m, pendingCancelId: undefined })));
      return;
    }
    setCancellingId(orderId);
    try {
      const { data } = await axiosClient.post("/ai/cancel-order", { order_id: orderId });
      setCancelResult(data);
      setMessages((prev) => [
        ...prev.map((m) => ({ ...m, pendingCancelId: undefined })),
        {
          role: "assistant",
          content: `✅ Done! Order **#${data.short_id}** has been cancelled. Sorry to see it go — hope to serve you again soon! 🙏`,
          streaming: true,
        },
      ]);
    } catch (err) {
      const reason = err?.response?.data?.detail ?? err?.response?.data?.message ?? "Could not cancel order. Please try again.";
      setCancelResult({ success: false, reason });
      setMessages((prev) => prev.map((m) => ({ ...m, pendingCancelId: undefined })));
    } finally {
      setCancellingId(null);
    }
  };

  function shouldShowCancelConfirm(userText, botReply, cancelResult) {
    if (cancelResult) return false;
    const lt = userText.toLowerCase();
    const lr = (botReply || "").toLowerCase();
    return lt.includes("cancel") && lt.includes("order") &&
      (lr.includes("confirm") || lr.includes("are you sure") || lr.includes("sure you want to cancel"));
  }

  /* ─────────────────────────────────────────────────────────
     SEND — reasoning gen + chat API fire in true parallel
     Flow: [OpenRouter reasoning] ┐
                               ├─ steps resolved first → animate them in
           [/ai/chat]    ──────┘  await chat if still pending → close thinking
                               → preTyping dots → typewriter
  ───────────────────────────────────────────────────────── */
  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || loading) return;

    if (outOfCredits) {
      setInput("");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text || "Sent a file" },
        {
          role: "assistant",
          content: "You're out of free KotaBot credits for now. They refill automatically every few hours, or go **[ProBite](/pricing)** for unlimited chat — no waiting. 🍕",
          preTyping: false,
          streaming: true,
        },
      ]);
      if (!open) setUnread((u) => u + 1);
      return;
    }

    const detectedId = extractOrderId(text);
    if (detectedId) setCtxId(detectedId);

    const fileToSend = attachedFile;
    setAttachedFile(null);
    setAttachError("");

    const userMsg = {
      role: "user",
      content: text || `Sent a file: ${fileToSend.name}`,
      ...(fileToSend ? { attachment: { filename: fileToSend.name, mimeType: fileToSend.type } } : {}),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setCancelResult(null);

    /* ── 1. Insert placeholder — thinking block open, steps empty ── */
    startTimeRef.current = Date.now();
    setMessages([...updated, {
      role: "assistant", content: "", preTyping: false, streaming: false,
      reasoning: { thinking: true, steps: [], elapsed: 0 },
    }]);

    /* ── 2. Fire BOTH calls simultaneously ── */
    const firstUserIdx = updated.findIndex((m) => m.role === "user");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current  = controller;

    // Reasoning generation (Gemini 2.0 Flash — fast, free tier)
    const reasoningPromise = generateReasoningSteps(text || "Customer sent a file attachment");

    // Main chat call. If a file was attached, it's read with Gemini vision
    // FIRST (KotaBot's own OpenRouter model is text-only) and the resulting
    // description is folded into the LAST message's content — the user only
    // ever sees their own typed text + the small attachment chip; the rich
    // file description is invisible context for the model only.
    const chatPromise = (async () => {
      let attachmentContext = "";
      if (fileToSend) {
        try {
          const fd = new FormData();
          fd.append("file", fileToSend);
          if (text) fd.append("question", text);
          const { data } = await axiosClient.post("/ai/chat/read-file", fd, {
            headers: { "Content-Type": "multipart/form-data" },
            signal: controller.signal,
          });
          attachmentContext = `\n\n[Attached file: ${data.filename}]\n${data.description}`;
        } catch (err) {
          if (err.name === "AbortError" || err.name === "CanceledError") throw err;
          const reason = err?.response?.data?.detail || "Couldn't read that file.";
          attachmentContext = `\n\n[Attached file: ${fileToSend.name} — could not be read: ${reason}]`;
        }
      }

      const apiMessages = (firstUserIdx >= 0 ? updated.slice(firstUserIdx) : updated).map((m, i, arr) => ({
        role: m.role,
        content: i === arr.length - 1 ? `${m.content}${attachmentContext}` : m.content,
      }));

      const { data } = await axiosClient.post(
        "/ai/chat",
        { messages: apiMessages, order_id: detectedId || contextId || null },
        { signal: controller.signal },
      );
      return data;
    })().catch((err) => {
      if (err.name === "AbortError" || err.name === "CanceledError") throw err;
      return { __error: err };
    });

    /* ── 3. As soon as reasoning resolves, animate steps in ── */
    //  Chat call keeps running in background during this animation
    const reasoningSteps = await reasoningPromise;
    const STEP_INTERVAL  = 360;

    await new Promise((resolve) => {
      let idx = 0;
      const tick = () => {
        if (idx < reasoningSteps.length) {
          const slice = reasoningSteps.slice(0, idx + 1);
          idx++;
          setMessages((prev) => {
            const next = [...prev];
            const last = { ...next[next.length - 1] };
            last.reasoning = { ...last.reasoning, steps: slice };
            next[next.length - 1] = last;
            return next;
          });
          thinkTimerRef.current = setTimeout(tick, STEP_INTERVAL);
        } else {
          resolve();
        }
      };
      thinkTimerRef.current = setTimeout(tick, STEP_INTERVAL);
    });

    /* ── 4. Await chat (may already be resolved, or still pending) ── */
    let apiData  = null;
    let apiError = null;
    try {
      const result = await chatPromise;
      if (result?.__error) apiError = result.__error;
      else apiData = result;
    } catch (err) {
      if (err.name === "AbortError" || err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      apiError = err;
    }

    /* ── 4. Close reasoning block → show elapsed ── */
    const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
    setMessages((prev) => {
      const next = [...prev];
      const last = { ...next[next.length - 1] };
      last.reasoning = { ...last.reasoning, thinking: false, elapsed };
      next[next.length - 1] = last;
      return next;
    });

    /* ── 5. Pre-typing dots (600ms) ── */
    await new Promise((r) => setTimeout(r, 600));
    setMessages((prev) => {
      const next = [...prev];
      const last = { ...next[next.length - 1], preTyping: true };
      next[next.length - 1] = last;
      return next;
    });
    await new Promise((r) => setTimeout(r, 650));

    /* ── 6. Inject final reply for typewriter ── */
    if (apiError) {
      const status = apiError?.response?.status;
      const errMsg =
        status === 401
          ? "Please **sign in** to chat with KotaBot."
          : status === 402
          ? "You're out of free KotaBot credits for now. They refill automatically, or go **[ProBite](/pricing)** for unlimited chat — no waiting. 🍕"
          : "Eish, something went wrong. Try again in a moment.";
      if (status === 402) {
        const detail = apiError?.response?.data?.detail;
        if (detail && typeof detail === "object") {
          applyCreditsUpdate({ unlimited: false, credits: detail.credits, credits_cap: detail.credits_cap, resets_at: detail.resets_at });
        }
      }
      setMessages((prev) => {
        const next = [...prev];
        const last = { ...next[next.length - 1], content: errMsg, preTyping: false, streaming: true };
        next[next.length - 1] = last;
        return next;
      });
    } else {
      if (apiData.cancel_result) setCancelResult(apiData.cancel_result);
      if (apiData.credits) applyCreditsUpdate(apiData.credits);

      const pendingId = (() => {
        const orderId = detectedId || contextId;
        return shouldShowCancelConfirm(text, apiData.reply, apiData.cancel_result) && orderId
          ? orderId : undefined;
      })();

      setMessages((prev) => {
        const next = [...prev];
        const last = {
          ...next[next.length - 1],
          content: apiData.reply,
          preTyping: false,
          streaming: true,
          ...(pendingId ? { pendingCancelId: pendingId } : {}),
        };
        next[next.length - 1] = last;
        return next;
      });

      if (!open) setUnread((u) => u + 1);
    }

    setLoading(false);
    abortRef.current = null;
  };

  const handleOpen = () => { setOpen(true); setMin(false); setUnread(0); };

  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <>
      <style>{styles}</style>

      {/* FAB */}
      {!open && (
        <button className="kb-ai-fab" onClick={handleOpen} aria-label="Open KotaBot" title="KotaBot">
          <FaBots
  className={`w-10 h-10 ${isOpen ? "text-green-500" : "text-red-500"}`}
  aria-label={isOpen ? "Bot is online" : "Bot is offline"}
  role="img"
/>
          {/*  <span className="kb-fab-status-dot" style={{ background: isOpen ? "#00E5FF" : "#FF4081" }} />*/} 
          {(unread > 0 || loading) && (
            <span className="kb-ai-unread">
              {loading ? <FaCircleNotch className ="animate-spin" /> : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={`kb-ai-window${minimised ? " kb-ai-minimised" : ""}`}>

          {/* Header */}
          <div className="kb-ai-header">
            <div className="kb-ai-header-left">
              <div>
                <p className="kb-ai-header-name"><FaBots size={36} /></p>
                <p className="kb-ai-header-sub">
                  {loading ? (
                    <span className="kb-ai-typing flex gap-1">thinking <span className="claude-thinking-dots">
              <span /><span /><span />
            </span></span>
                  ) : isOpen ? (
                    <span className="flex gap-3" style={{ color: "#00E5FF", fontWeight: 700 }}><TbTruckDelivery size={18} /></span>
                  ) : (
                    <span className="flex gap-3" style={{ color: "#FF4081", fontWeight: 700 }}><TbTruckDelivery size={18} /></span>
                  )}
                </p>
              </div>
            </div>
            <div className="kb-ai-header-actions">
              {isAuth && (
                <Link
                  to="/pricing"
                  className={`kb-credits-badge ${isProBite ? "kb-credits-pro" : outOfCredits ? "kb-credits-empty" : ""}`}
                  title={isProBite ? "Unlimited with ProBite" : "View KotaBot credits & ProBite"}
                >
                  {isProBite ? <RiVerifiedBadgeFill className="text-white" size={16} />: `${credits.credits ?? "—"}/${credits.creditsCap ?? 100}`}
                </Link>
              )}
              <button className="kb-ai-icon-btn" onClick={() => setMin((m) => !m)} title={minimised ? "Expand" : "Minimise"}>
                {minimised ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button className="kb-ai-icon-btn kb-ai-close-btn" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              <HoursBanner status={hoursStatus} />

              {cancelResult && (
                <CancelCard cancelResult={cancelResult} onDismiss={() => setCancelResult(null)} />
              )}

              {!isAuth && <SignInPrompt />}

              {/* Messages */}
              <div className="kb-ai-messages">
                {!isOpen && messages.length === 1
                  ? <ClosedNotice status={hoursStatus} />
                  : messages.map((m, i) => (
                      <Bubble
                        key={i}
                        msg={m}
                        onCancelConfirm={handleCancelConfirm}
                        cancellingId={cancellingId}
                        user={user}
                      />
                    ))}
                <div ref={bottomRef} />
              </div>

              {/* Quick chips */}
              {isAuth && isOpen && messages.length === 1 && (
                <div className="kb-ai-quick-row">
                  {["Track my order", "Cancel an order", "What's on the menu?", "Change Language", "View all orders", "Leave feedback"].map((q) => (
                    <button
                      key={q}
                      className="kb-ai-quick-chip flex gap-2"
                      onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                    >
                      <Forward className="w-3 h-3" /> {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Pending attachment preview */}
              {(attachedFile || attachError) && (
                <div className="kb-attach-preview-row">
                  {attachedFile && (
                    <div className="kb-attach-preview-chip">
                      {previewUrl ? (
                        <img src={previewUrl} alt="" className="kb-attach-thumb" />
                      ) : (
                        <span className="kb-attach-icon-box">
                          <FileText className="w-4 h-4" />
                        </span>
                      )}
                      <span className="kb-attach-filename">{attachedFile.name}</span>
                      <span className="kb-attach-filesize">{(attachedFile.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        className="kb-attach-remove-btn"
                        onClick={() => setAttachedFile(null)}
                        aria-label="Remove attachment"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {attachError && <p className="kb-attach-error">{attachError}</p>}
                </div>
              )}

              {/* Input */}
              <div className="kb-ai-input-row">
                {isRecording || transcribing ? (
                  <div className={`kb-record-indicator${transcribing ? " kb-transcribing-indicator" : ""}`}>
                    {isRecording && (
                      <button
                        type="button"
                        className="kb-record-cancel-btn"
                        onClick={cancelRecording}
                        title="Cancel"
                        aria-label="Cancel recording"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {isRecording ? (
                      <>
                        <span className="kb-record-dot" />
                        <span className="kb-record-time">{formatRecordTime(recordSeconds)}</span>
                        <span className="kb-record-hint">Recording…</span>
                      </>
                    ) : (
                      <>
                        <FaCircleNotch className="w-3.5 h-3.5 kb-ai-spin" />
                        <span className="kb-record-hint">Transcribing…</span>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,application/pdf,text/plain,text/csv"
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="kb-attach-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || !isAuth}
                      title="Attach an image or PDF"
                      aria-label="Attach a file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <textarea
                      ref={inputRef}
                      className="kb-ai-input"
                      rows={1}
                      placeholder={
                        !isAuth ? "Sign in to chat"
                          : !isOpen ? "Ask about your order…"
                            : "Ask KotaBot anything…"
                      }
                      value={input}
                      disabled={loading || !isAuth}
                      onChange={(e) => {
                        if (e.target.value.length > 2000) return;
                        setInput(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                      style={{ resize: "none", overflow: "hidden" }}
                    />
                  </>
                )}

                {isRecording ? (
                  <button
                    type="button"
                    className="kb-record-stop-btn"
                    onClick={stopRecording}
                    title="Stop recording"
                    aria-label="Stop recording and transcribe"
                  >
                    <Square className="w-3.5 h-3.5" fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="kb-mic-btn"
                    onClick={startRecording}
                    disabled={loading || !isAuth || transcribing}
                    title="Record a voice note"
                    aria-label="Record a voice note"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                <button
                  className="kb-ai-send-btn"
                  onClick={handleSend}
                  disabled={loading || isRecording || transcribing || (!input.trim() && !attachedFile) || !isAuth}
                  aria-label="Send"
                >
                  {loading
                    ? <FaCircleNotch className="w-4 h-4 kb-ai-spin" />
                    : <IoSend className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STYLES                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --kb-cyan:    #00E5FF;
    --kb-cyan2:   #00B8D4;
    --kb-purple:  #7C4DFF;
    --kb-purple2: #651FFF;
    --kb-dark:    #0D0D1A;
    --kb-card:    #141428;
    --kb-text:    #E8E8F0;
    --kb-muted:   rgba(200,200,220,0.55);
    --kb-input:   rgba(200,200,220,0.07);
    --kb-ring:    rgba(0,229,255,0.35);
  }

  /* ── FAB ── */
  .kb-ai-fab {
    position:fixed; bottom:24px; right:24px; z-index:9998;
    display:flex; align-items:center; gap:8px;
    background:linear-gradient(135deg,skyblue 0%, white 100%);
    color:white; border:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px;
    padding:13px 20px; border-radius:50px;
    transition:all 0.25s; animation:kbAiFabIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .kb-ai-fab:hover { transform:scale(1.06); filter:brightness(1.1); }
  .kb-fab-status-dot {
    width:9px; height:9px; border-radius:50%; flex-shrink:0;
    border:2px solid rgba(13,13,26,0.5); box-shadow:0 0 8px currentColor;
  }
  .kb-ai-unread {
    position:absolute; top:-6px; right:-6px;
    min-width:20px; height:20px; border-radius:50px;
    background:transparent ; color:#0ea5a4 ;
    font-size:11px; font-weight:900;
    display:flex; align-items:center; justify-content:center; padding:0 5px;
    animation:kbPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes kbAiFabIn { from{opacity:0;transform:translateY(20px) scale(0.85)} to{opacity:1;transform:none} }
  @keyframes kbPop     { from{transform:scale(0)} to{transform:scale(1)} }

  /* ── Window ── */
  .kb-ai-window {
    position:fixed; bottom:24px; right:24px; z-index:9999;
    width:min(420px,calc(100vw - 32px));
    background:var(--kb-card);
    border:1px solid rgba(0,229,255,0.12); border-radius:22px;
    box-shadow:0 24px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(124,77,255,0.08);
    display:flex; flex-direction:column;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    overflow:hidden; animation:kbWindowIn 0.3s cubic-bezier(0.34,1.2,0.64,1);
    max-height:calc(100vh - 48px);
  }
  .kb-ai-minimised { height:auto !important; }
  @keyframes kbWindowIn { from{opacity:0;transform:translateY(16px) scale(0.96)} to{opacity:1;transform:none} }

  /* ── Header ── */
  .kb-ai-header {
    display:flex; align-items:center; justify-content:space-between; padding:14px 16px;
    background:linear-gradient(135deg,rgba(124,77,255,0.15) 0%,rgba(0,229,255,0.06) 100%);
    border-bottom:1px solid rgba(0,229,255,0.1); flex-shrink:0;
  }
  .kb-ai-header-left  { display:flex; align-items:center; gap:10px; }
  .kb-ai-header-name  { font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:2px; color:var(--kb-text); line-height:1; }
  .kb-ai-header-sub   { font-size:10px; color:rgba(200,200,220,0.5); font-weight:600; margin-top:2px; }
  .kb-ai-typing       { color:var(--kb-cyan); animation:kbBlink 1s ease infinite; }
  @keyframes kbBlink  { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .kb-ai-header-actions { display:flex; align-items:center; gap:4px; }
  .kb-ai-icon-btn {
    width:30px; height:30px; border-radius:8px;
    background:rgba(200,200,220,0.06); border:1px solid rgba(0,229,255,0.12);
    display:flex; align-items:center; justify-content:center;
    color:rgba(200,200,220,0.5); cursor:pointer; transition:all 0.18s;
  }
  .kb-ai-icon-btn:hover { color:var(--kb-text); border-color:rgba(0,229,255,0.3); }
  .kb-ai-close-btn:hover { background:rgba(255,64,129,0.2); color:#FF4081; border-color:rgba(255,64,129,0.3); }

  .kb-credits-badge {
    display:flex; align-items:center; height:30px; padding:0 10px;
    border-radius:8px; background:rgba(200,200,220,0.06); border:1px solid rgba(0,229,255,0.12);
    color:rgba(200,200,220,0.65); font-size:11px; font-weight:800; letter-spacing:0.02em;
    text-decoration:none; cursor:pointer; transition:all 0.18s; white-space:nowrap;
  }
  .kb-credits-badge:hover { color:var(--kb-text); border-color:rgba(0,229,255,0.3); }
  .kb-credits-pro   { background:transparent ; border:none; }
  .kb-credits-empty { background:rgba(248,113,113,0.12); border-color:rgba(248,113,113,0.3); color:#f87171; }

  /* ── Thinking block ── */
  .kb-thinking-wrap {
    display:flex; flex-direction:column;
    margin-bottom:5px; max-width:80%;
  }

  .kb-thinking-header {
    display:inline-flex; align-items:center; justify-content:space-between; gap:7px;
    padding:5px 10px; border-radius:20px;
    background:rgba(124,77,255,0.1); border:1px solid rgba(124,77,255,0.25);
    color:rgba(200,200,220,0.6); font-size:11px; font-weight:700;
    cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
    transition:all 0.2s; width:fit-content;
  }
  .kb-thinking-header:hover { background:rgba(124,77,255,0.18); color:var(--kb-text); }
  .kb-thinking-active { border-color:rgba(0,229,255,0.35); background:rgba(0,229,255,0.07); color:var(--kb-cyan); }

  .kb-thinking-header-left { display:flex; align-items:center; gap:6px; }
  .kb-thinking-label { white-space:nowrap; }

  /* animated brain icon while thinking */
  .kb-think-brain-spin { animation:kbBrainPulse 1.5s ease infinite; }
  @keyframes kbBrainPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.9)} }

  /* three dots inside header */
  .kb-thinking-dots { display:flex; gap:3px; align-items:center; }
  .kb-thinking-dots span {
    width:4px; height:4px; border-radius:50%;
    background:var(--kb-cyan); opacity:0.8;
    animation:kbDot 1.2s ease infinite;
  }
  .kb-thinking-dots span:nth-child(2) { animation-delay:0.2s; }
  .kb-thinking-dots span:nth-child(3) { animation-delay:0.4s; }

  /* reasoning body */
  .kb-thinking-body {
    margin-top:6px; padding:10px 13px;
    background:rgba(0,0,0,0.25); border:1px solid rgba(124,77,255,0.15);
    border-radius:12px; display:flex; flex-direction:column; gap:7px;
    animation:kbFadeIn 0.2s ease;
  }
  @keyframes kbFadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }

  .kb-thinking-line {
    display:flex; align-items:flex-start; gap:7px;
    font-size:11px; color:rgba(200,200,220,0.55); line-height:1.5;
    animation:kbLineIn 0.25s ease both;
    font-family:'Plus Jakarta Sans',monospace;
  }
  @keyframes kbLineIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
  .kb-thinking-line-active { color:var(--kb-cyan); opacity:0.8; }
  .kb-thinking-bullet { color:var(--kb-purple); font-weight:800; flex-shrink:0; margin-top:1px; }

  /* blinking cursor in thinking block */
  .kb-thinking-cursor {
    display:inline-block;
    animation:kbCursorBlink 0.7s step-end infinite;
    color:var(--kb-cyan);
  }
  @keyframes kbCursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── Bubble column (wraps thinking + bubble) ── */
  .kb-ai-bubble-col { display:flex; flex-direction:column; gap:0; max-width:82%; }

  /* ── Streaming cursor at end of reply ── */
  .kb-stream-cursor {
    display:inline-block; margin-left:2px; vertical-align:middle;
    animation:kbCursorBlink 0.55s step-end infinite;
    color:var(--kb-cyan); font-size:13px;
  }

  /* ── Sign in prompt ── */
  .kb-signin-prompt {
    display:flex; align-items:center; gap:12px;
    margin:10px 12px 0; padding:12px 14px;
    background:linear-gradient(135deg,rgba(124,77,255,0.12) 0%,rgba(0,229,255,0.08) 100%);
    border:1px solid rgba(0,229,255,0.2); border-radius:12px;
    animation:kbWindowIn 0.25s ease; flex-shrink:0;
  }
  .kb-signin-icon {
    width:36px; height:36px; border-radius:10px;
    background:rgba(0,229,255,0.12); border:1px solid rgba(0,229,255,0.25);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .kb-signin-title { font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:1.5px; color:var(--kb-text); margin-bottom:2px; }
  .kb-signin-text  { font-size:11px; color:rgba(200,200,220,0.6); line-height:1.4; }
  .kb-signin-link  { color:var(--kb-cyan); font-weight:700; text-decoration:none; border-bottom:1px solid rgba(0,229,255,0.4); transition:all 0.18s; }
  .kb-signin-link:hover { color:var(--kb-text); }

  /* ── Hours banner ── */
  .kb-hours-banner { display:flex; align-items:center; gap:6px; padding:7px 16px; font-size:11px; font-weight:700; flex-shrink:0; }
  .kb-hours-open   { background:rgba(0,229,255,0.08);  color:var(--kb-cyan); border-bottom:1px solid rgba(0,229,255,0.15); }
  .kb-hours-warn   { background:rgba(255,193,7,0.1);   color:#FFD740; border-bottom:1px solid rgba(255,193,7,0.2); }
  .kb-hours-closed { background:rgba(255,64,129,0.08); color:#FF4081; border-bottom:1px solid rgba(255,64,129,0.15); }

  /* ── Closed notice ── */
  .kb-closed-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; padding:20px 16px; text-align:center; }
  .kb-closed-icon { width:48px; height:48px; border-radius:14px; background:rgba(0,229,255,0.1); border:1px solid rgba(0,229,255,0.2); display:flex; align-items:center; justify-content:center; }
  .kb-closed-title { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:2px; color:var(--kb-text); }
  .kb-closed-msg   { font-size:12px; color:rgba(200,200,220,0.55); line-height:1.5; max-width:240px; }
  .kb-closed-sched { width:100%; background:rgba(200,200,220,0.03); border:1px solid rgba(0,229,255,0.1); border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:6px; }
  .kb-closed-row   { display:flex; justify-content:space-between; font-size:11px; }
  .kb-closed-day   { color:rgba(200,200,220,0.45); font-weight:600; }
  .kb-closed-hrs   { color:rgba(200,200,220,0.7);  font-weight:700; }
  .kb-closed-today .kb-closed-day,
  .kb-closed-today .kb-closed-hrs { color:var(--kb-cyan); }

  /* ── Cancel card ── */
  .kb-cancel-card   { display:flex; align-items:flex-start; gap:10px; margin:10px 12px 0; padding:10px 13px; border-radius:12px; border:1px solid; flex-shrink:0; animation:kbWindowIn 0.25s ease; }
  .kb-cancel-success { background:rgba(0,229,255,0.08);  border-color:rgba(0,229,255,0.25); }
  .kb-cancel-fail    { background:rgba(255,64,129,0.08); border-color:rgba(255,64,129,0.25); }
  .kb-cancel-title   { font-size:12px; font-weight:800; color:var(--kb-text); }
  .kb-cancel-sub     { font-size:11px; color:rgba(200,200,220,0.55); margin-top:2px; }
  .kb-cancel-dismiss { background:none; border:none; color:rgba(200,200,220,0.4); cursor:pointer; font-size:16px; line-height:1; padding:0 0 0 4px; flex-shrink:0; }
  .kb-cancel-dismiss:hover { color:var(--kb-text); }

  /* ── Copy order ID ── */
  .kb-order-id-row   { display:flex; align-items:center; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid rgba(0,229,255,0.12); }
  .kb-order-id-label { font-size:10px; color:rgba(200,200,220,0.4); font-weight:600; }
  .kb-copy-order-btn { display:flex; align-items:center; gap:5px; padding:5px 10px; border-radius:8px; background:rgba(0,229,255,0.1); border:1px solid rgba(0,229,255,0.25); color:rgba(200,200,220,0.7); font-size:10px; font-weight:700; cursor:pointer; transition:all 0.18s; font-family:'Plus Jakarta Sans',sans-serif; }
  .kb-copy-order-btn:hover { background:rgba(0,229,255,0.2); border-color:rgba(0,229,255,0.4); color:var(--kb-text); }
  .kb-copy-text { white-space:nowrap; }

  /* ── Cancel confirm ── */
  .kb-confirm-row  { margin-top:10px; padding-top:10px; border-top:1px solid rgba(0,229,255,0.12); }
  .kb-confirm-text { font-size:11px; font-weight:700; color:rgba(200,200,220,0.6); margin-bottom:8px; }
  .kb-confirm-btns { display:flex; gap:8px; }
  .kb-confirm-yes  { flex:1; display:flex; align-items:center; justify-content:center; gap:5px; background:linear-gradient(135deg,var(--kb-purple) 0%,var(--kb-purple2) 100%); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:11px; padding:8px 12px; border-radius:8px; transition:all 0.18s; }
  .kb-confirm-yes:hover:not(:disabled) { filter:brightness(1.15); }
  .kb-confirm-yes:disabled { opacity:0.55; cursor:not-allowed; }
  .kb-confirm-no   { flex:1; background:rgba(200,200,220,0.06); border:1px solid rgba(0,229,255,0.15); color:rgba(200,200,220,0.6); cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:11px; padding:8px 12px; border-radius:8px; transition:all 0.18s; }
  .kb-confirm-no:hover { color:var(--kb-text); border-color:rgba(0,229,255,0.3); }

  /* ── Messages ── */
  .kb-ai-messages {
    flex:1; overflow-y:auto; padding:14px 14px 6px;
    display:flex; flex-direction:column; gap:12px;
    max-height:380px; min-height:160px;
    scrollbar-width:thin; scrollbar-color:rgba(0,229,255,0.18) transparent;
  }
  .kb-ai-messages::-webkit-scrollbar { width:4px; }
  .kb-ai-messages::-webkit-scrollbar-thumb { background:rgba(0,229,255,0.18); border-radius:4px; }

  /* ── Bubble rows ── */
  .kb-ai-bubble-row  { display:flex; align-items:flex-start; gap:7px; }
  .kb-ai-bubble-user { flex-direction:row-reverse; }
  .kb-ai-bubble-bot  { flex-direction:row; }
  .kb-ai-avatar { width:26px; height:26px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:2px; }
  .kb-ai-avatar-bot  { background:rgba(0,229,255,0.15); color:var(--kb-cyan); }
  .kb-ai-avatar-user { background:rgba(124,77,255,0.2);  color:var(--kb-purple); }
  .kb-ai-bubble { max-width:106%; padding:10px 14px; border-radius:14px; font-size:13px; font-weight:500; line-height:1.6; word-break:break-word; }
  .kb-ai-bubble-b { background:transparent ; border:1px solid transparent ; color:var(--kb-text); border-bottom-left-radius:4px; }
  .kb-ai-bubble-u { background:linear-gradient(135deg,var(--kb-purple) 0%,var(--kb-purple2) 100%); color:white; border-bottom-right-radius:4px; box-shadow:0 2px 10px rgba(124,77,255,0.3); }

  /* ── Markdown ── */
  .kb-md-p { margin:0 0 6px 0; } .kb-md-p:last-child { margin-bottom:0; }
  .kb-md-strong { color:var(--kb-cyan); font-weight:800; }
  .kb-md-em     { color:rgba(200,200,220,0.75); font-style:italic; }
  .kb-md-ul,.kb-md-ol { margin:6px 0; padding-left:18px; display:flex; flex-direction:column; gap:3px; }
  .kb-md-li { font-size:13px; line-height:1.5; color:var(--kb-text); }
  .kb-md-ul .kb-md-li { list-style:disc; } .kb-md-ol .kb-md-li { list-style:decimal; }
  .kb-md-a { color:var(--kb-cyan); text-decoration:underline; text-underline-offset:2px; font-weight:600; }
  .kb-md-a:hover { color:var(--kb-text); }
  .kb-md-code-inline { background:rgba(0,229,255,0.12); border:1px solid rgba(0,229,255,0.2); color:var(--kb-cyan); font-family:monospace; font-size:12px; padding:1px 5px; border-radius:5px; }
  .kb-md-pre { background:rgba(0,0,0,0.35); border:1px solid rgba(0,229,255,0.12); border-radius:8px; padding:10px 12px; margin:6px 0; overflow-x:auto; font-size:11px; font-family:monospace; color:var(--kb-text); line-height:1.6; }
  .kb-md-blockquote { border-left:3px solid var(--kb-cyan); padding:4px 10px; margin:6px 0; background:rgba(0,229,255,0.06); border-radius:0 6px 6px 0; color:rgba(200,200,220,0.75); font-style:italic; font-size:12px; }
  .kb-md-h  { font-weight:800; color:var(--kb-cyan); font-size:14px; margin:4px 0 2px; }
  .kb-md-h3 { font-weight:700; color:var(--kb-text); font-size:13px; margin:4px 0 2px; }
  .kb-md-hr { border:none; border-top:1px solid rgba(0,229,255,0.15); margin:8px 0; }

  /* ── Typing dots ── */
  .kb-ai-typing-bubble { display:flex; align-items:center; gap:5px; padding:10px 14px; }
  .kb-ai-typing-bubble span { width:6px; height:6px; border-radius:50%; background:rgba(0,229,255,0.6); animation:kbDot 1.2s ease infinite; }
  .kb-ai-typing-bubble span:nth-child(2) { animation-delay:0.2s; }
  .kb-ai-typing-bubble span:nth-child(3) { animation-delay:0.4s; }
  @keyframes kbDot { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }

  /* ── Quick chips ── */
  .kb-ai-quick-row { display:flex; flex-wrap:wrap; gap:6px; padding:6px 14px 10px; flex-shrink:0; }
  .kb-ai-quick-chip { padding:5px 11px; border-radius:10px; background:rgba(0,229,255,0.07); border:1px solid rgba(0,229,255,0.2); color:rgba(200,200,220,0.7); font-size:11px; font-weight:700; cursor:pointer; transition:all 0.18s; font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap; }
  .kb-ai-quick-chip:hover { background:rgba(0,229,255,0.15); color:var(--kb-text); border-color:rgba(0,229,255,0.4); }

  /* ── Input row ── */
  .kb-ai-input-row { display:flex; align-items:center; gap:8px; padding:10px 12px 14px; flex-shrink:0; border-top:1px solid rgba(0,229,255,0.08); }
  .kb-ai-input { flex:1; background:rgba(200,200,220,0.05); border:1.5px solid rgba(0,229,255,0.12); border-radius:12px; padding:9px 13px; color:var(--kb-text); font-size:13px; font-weight:500; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:border-color 0.2s; }
  .kb-ai-input:focus { border-color:rgba(0,229,255,0.4); }
  .kb-ai-input::placeholder { color:rgba(200,200,220,0.3); }
  .kb-ai-input:disabled { opacity:0.5; cursor:not-allowed; }
  .kb-ai-send-btn { width:38px; height:38px; border-radius:11px; flex-shrink:0; background:linear-gradient(135deg,var(--kb-purple) 0%,var(--kb-cyan2) 100%); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:white; transition:all 0.18s; box-shadow:0 3px 12px rgba(124,77,255,0.4); }
  .kb-ai-send-btn:hover:not(:disabled) { filter:brightness(1.15); transform:scale(1.05); }
  .kb-ai-send-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }

  /* ── Attach (file upload) ── */
  .kb-attach-btn {
    width:38px; height:38px; border-radius:11px; flex-shrink:0;
    background:rgba(200,200,220,0.06); border:1.5px solid rgba(0,229,255,0.12);
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:rgba(200,200,220,0.6); transition:all 0.18s;
  }
  .kb-attach-btn:hover:not(:disabled) { color:var(--kb-cyan); border-color:rgba(0,229,255,0.35); background:rgba(0,229,255,0.08); }
  .kb-attach-btn:disabled { opacity:0.4; cursor:not-allowed; }

  .kb-attach-preview-row { padding:0 12px 8px; flex-shrink:0; }
  .kb-attach-preview-chip {
    display:flex; align-items:center; gap:8px; padding:6px 8px;
    background:rgba(0,229,255,0.06); border:1px solid rgba(0,229,255,0.18);
    border-radius:10px; animation:kbWindowIn 0.2s ease;
  }
  .kb-attach-thumb    { width:32px; height:32px; border-radius:7px; object-fit:cover; flex-shrink:0; }
  .kb-attach-icon-box {
    width:32px; height:32px; border-radius:7px; flex-shrink:0;
    background:rgba(0,229,255,0.12); color:var(--kb-cyan);
    display:flex; align-items:center; justify-content:center;
  }
  .kb-attach-filename  { font-size:11.5px; font-weight:700; color:var(--kb-text); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .kb-attach-filesize  { font-size:10px; color:rgba(200,200,220,0.45); flex-shrink:0; }
  .kb-attach-remove-btn {
    background:none; border:none; color:rgba(200,200,220,0.45); cursor:pointer;
    display:flex; align-items:center; justify-content:center; flex-shrink:0; padding:2px;
  }
  .kb-attach-remove-btn:hover { color:#FF4081; }
  .kb-attach-error { font-size:10.5px; color:#FF4081; font-weight:600; margin:4px 0 0; }

  .kb-attach-sent-chip {
    display:inline-flex; align-items:center; gap:5px;
    font-size:10.5px; font-weight:700; opacity:0.9;
    margin-bottom:5px; padding:3px 8px; border-radius:8px;
    background:rgba(255,255,255,0.15);
  }

  /* ── Voice recording ── */
  .kb-mic-btn {
    width:38px; height:38px; border-radius:11px; flex-shrink:0;
    background:rgba(200,200,220,0.06); border:1.5px solid rgba(0,229,255,0.12);
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:rgba(200,200,220,0.6); transition:all 0.18s;
  }
  .kb-mic-btn:hover:not(:disabled) { color:var(--kb-cyan); border-color:rgba(0,229,255,0.35); background:rgba(0,229,255,0.08); }
  .kb-mic-btn:disabled { opacity:0.4; cursor:not-allowed; }

  .kb-record-stop-btn {
    width:38px; height:38px; border-radius:11px; flex-shrink:0;
    background:rgba(255,64,129,0.15); border:1.5px solid rgba(255,64,129,0.4);
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:#FF4081; transition:all 0.18s;
  }
  .kb-record-stop-btn:hover { background:rgba(255,64,129,0.25); }

  .kb-record-indicator {
    flex:1; display:flex; align-items:center; gap:8px;
    background:rgba(255,64,129,0.06); border:1.5px solid rgba(255,64,129,0.2);
    border-radius:12px; padding:0 12px; height:38px;
  }
  .kb-transcribing-indicator { background:rgba(0,229,255,0.06); border-color:rgba(0,229,255,0.2); }

  .kb-record-cancel-btn {
    background:none; border:none; color:rgba(200,200,220,0.5); cursor:pointer;
    display:flex; align-items:center; justify-content:center; padding:0; flex-shrink:0;
  }
  .kb-record-cancel-btn:hover { color:var(--kb-text); }

  .kb-record-dot {
    width:8px; height:8px; border-radius:50%; background:#FF4081; flex-shrink:0;
    animation:kbRecordPulse 1.1s ease infinite;
  }
  @keyframes kbRecordPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }

  .kb-record-time { font-size:12.5px; font-weight:800; color:#FF4081; font-family:monospace; flex-shrink:0; }
  .kb-record-hint { font-size:11.5px; font-weight:600; color:rgba(200,200,220,0.6); }

  @keyframes kbSpin { to { transform:rotate(360deg); } }
  .kb-ai-spin { animation:kbSpin 0.75s linear infinite; }

  @media(max-width:480px) {
    .kb-ai-window { right:12px; bottom:12px; width:calc(100vw - 24px); }
    .kb-ai-fab    { right:12px; bottom:12px; }
  }

.kb-welcome-rotator {
  height: 20px;            /* fixed height — prevents layout jump as labels change length */
  margin: 8px 0 4px;
  overflow: hidden;
  position: relative;
}
.kb-welcome-rotator-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; font-weight: 600;
  color: rgba(200,200,220,0.85);
  animation: kbRotateIn 0.35s ease both;
}
.kb-welcome-action-icon { width: 15px; height: 15px; flex-shrink: 0; color: var(--kb-cyan); }
@keyframes kbRotateIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.kb-welcome-footer { margin-top: 8px !important; color: rgba(200,200,220,0.7); }
`;

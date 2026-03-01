import { useEffect, useMemo, useRef, useState } from "react";

type QueueItem = {
  item_id: string;
  item_type: string;
  status: string;
  progress_pct?: number;
  eta_seconds?: number;
  label?: string;
};

type Job = {
  id: string;
  status: string;
  prompt: string;
  error_message?: string;
  progress_pct?: number | null;
  eta_seconds?: number | null;
};
type LoraSlot = { id: string; weight: number };

type TrainingStatus = {
  id: string;
  status: string;
  epoch?: number | null;
  epoch_total?: number | null;
  step?: number | null;
  step_total?: number | null;
  progress_pct?: number | null;
  eta_seconds?: number | null;
  last_loss?: number | null;
  error_message?: string | null;
};

type Run = {
  id: string;
  status: string;
  name?: string;
  last_step?: string | null;
  error_message?: string | null;
  training?: TrainingStatus | null;
};

type DashboardPipelineRun = {
  id: string;
  name: string;
  status: string;
  last_step?: string | null;
  progress_pct?: number | null;
  eta_seconds?: number | null;
  error_message?: string | null;
  image_count?: number | null;
};

type DashboardTrainingRun = {
  id: string;
  pipeline_run_id?: string | null;
  name?: string | null;
  status: string;
  progress_pct?: number | null;
  eta_seconds?: number | null;
  last_loss?: number | null;
  error_message?: string | null;
  image_count?: number | null;
  steps?: Record<string, string>;
};

type DashboardQueueItem = {
  position?: number | null;
  id: string;
  name: string;
  status: string;
  item_type?: "pipeline" | "training";
};

type GalleryImage = { id: string; file_id: string; model_id: string };

type GalleryPublicImage = {
  id: string;
  file_id: string;
  user_id?: string;
  username: string;
  avatar_file_id?: string | null;
  is_public?: boolean;
  prompt?: string;
  created_at: string;
  like_count?: number;
  comment_count?: number;
};

type GalleryPublicModel = {
  id: string;
  user_id?: string;
  name: string;
  status?: string;
  created_at?: string;
  username?: string;
  avatar_file_id?: string | null;
  like_count?: number;
  comment_count?: number;
  images?: GalleryImage[];
};

type LoraEntry = {
  id: string;
  name: string;
  file_id: string;
  user_id: string;
  description?: string | null;
  is_public?: boolean;
  created_at: string;
  username: string;
  avatar_file_id?: string | null;
  source?: string;
  trigger_token?: string | null;
  activator_token?: string | null;
  like_count?: number;
  comment_count?: number;
  preview_file_ids?: string[];
  preview_count?: number;
  preview_in_flight?: number;
  dataset_file_id?: string | null;
  remove_status?: string;
  download_count?: number;
  generated_count?: number;
  favorite_count?: number;
};

type StyleOption = {
  id: string;
  name: string;
  description: string;
};

type WildcardList = {
  name: string;
  entries: string[];
};

type GalleryImageDetail = {
  id: string;
  file_id: string;
  user_id?: string;
  is_public?: boolean;
  username: string;
  prompt?: string;
  negative_prompt?: string;
  sampler?: string;
  scheduler?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  created_at: string;
};

type GalleryComment = {
  id: string;
  user_id: string;
  username: string;
  body: string;
  created_at: string;
  pinned?: boolean;
  featured?: boolean;
};
type GenerationOutput = { id: string; file_id: string; created_at: string };
type ManualImage = { path: string; name: string; caption: string; url: string; isFace: boolean };

type User = {
  id: string;
  email: string;
  username: string;
  role?: string;
  credits_balance?: number;
  credits_daily_allowance?: number;
  credits_reserved?: number;
  must_change_password?: boolean;
  permissions?: Record<string, boolean>;
};

type SettingsEntry = { key: string; value: any };

type Profile = { display_name: string; bio: string; avatar_file_id?: string | null };
type PublicProfile = {
  id: string;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_file_id?: string | null;
};
type PublicProfileStats = {
  models: number;
  images: number;
  likes_models: number;
  likes_images: number;
  followers: number;
  generations_with_my_assets?: number;
};

type PublicProfileRelationship = {
  is_self: boolean;
  is_following: boolean;
};

type NotificationPrefs = {
  "notify.like.email": boolean;
  "notify.comment.email": boolean;
  "notify.training_done.email": boolean;
  "notify.training_failed.email": boolean;
  "notify.new_follower.email": boolean;
  "notify.dm.email": boolean;
};

type NotificationEntry = {
  id: string;
  type: string;
  title: string;
  body?: string;
  actor_username?: string | null;
  read_at?: string | null;
  created_at: string;
};

type TwoFaStatus = {
  enabled: boolean;
  locked: boolean;
  failed_attempts: number;
  onboarding_pending: boolean;
  trusted_ip_count: number;
  recovery_remaining: number;
};

type DMThread = {
  id: string;
  peer_user_id: string;
  peer_username: string;
  peer_display_name?: string | null;
  peer_avatar_file_id?: string | null;
  last_message_body?: string | null;
  last_message_created_at?: string | null;
  unread_count?: number;
  blocked_by_me?: boolean;
  blocked_by_peer?: boolean;
};

type DMMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  sender_username: string;
  body: string;
  created_at: string;
};

type DMBlock = {
  user_id: string;
  username: string;
  display_name?: string | null;
  avatar_file_id?: string | null;
  created_at: string;
};

type DashboardTrainingPreview = {
  file_id: string;
  epoch?: number | null;
};

type Dataset = { id: string; status: string; pipeline_run_id?: string | null };

type ModelRegistryEntry = {
  id: string;
  kind: string;
  name: string;
  version?: string | null;
  file_id?: string | null;
  is_active: boolean;
};

type AdminUser = {
  id: string;
  email: string;
  username: string;
  status: string;
  role: string;
  must_change_password?: boolean;
  created_at?: string;
  updated_at?: string;
  credits_balance: number;
  credits_daily_allowance: number;
  credits_reserved?: number;
  twofa_enabled?: boolean;
  twofa_locked?: boolean;
  trusted_ip_count?: number;
  recovery_remaining?: number;
  permissions?: Record<string, boolean>;
};

type AdminApplication = {
  id: string;
  email: string;
  display_name?: string | null;
  handle?: string | null;
  links?: string | null;
  message?: string | null;
  status: string;
  created_at: string;
  review_note?: string | null;
};

type AdminCreditLedgerEntry = {
  id: string;
  user_id: string;
  username: string;
  email: string;
  delta: number;
  reason?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  created_at: string;
};

type AdminCreditLedgerDetail = {
  entry: AdminCreditLedgerEntry;
  intent?: Record<string, any> | null;
};

type GalleryModel = {
  id: string;
  user_id?: string;
  username?: string;
  avatar_file_id?: string | null;
  name: string;
  title?: string;
  summary?: string;
  status: string;
  images: GalleryImage[];
  like_count?: number;
  comment_count?: number;
};

type StagedUpload = {
  id: string;
  name: string;
  size: number;
  expires_at?: string;
  contains_videos?: boolean;
  video_count?: number;
  image_count?: number;
};

type AutocharPreset = { id: string; name: string; description?: string | null; patterns?: string[] };

type TrainProfile = {
  id: string;
  name: string;
  label?: string | null;
  category?: string | null;
  tier?: string | null;
  is_default?: boolean;
};

type Lang = "en" | "de";

const copy = {
  en: {
    dashboard: "Dashboard",
    commandDeck: "Command Deck",
    pipeline: "Trainer",
    generator: "Generator",
    gallery: "Gallery",
    lora: "LoRA Gallery",
    messages: "Messages",
    settings: "Settings",
    signIn: "Sign In",
    email: "Email",
    password: "Password",
    login: "Login",
    queue: "Queue",
    active: "Active",
    generation: "Generation",
    training: "Training",
    previewOutput: "Generated Images",
    styles: "Styles",
    modelRegistry: "Model Registry",
    system: "System",
    apply: "Apply",
    publicWelcomeTitle: "LoRA training, image generation, and publishing in one platform.",
    publicWelcomeLead:
      "FrameWorkX combines dataset-to-model training with image generation and gallery publishing for public model and image workflows.",
    publicWelcomeBody:
      "Browse public models and public images, compare styles, and review outputs before you sign in. The public view is designed for discovery, quality checks, and sharing.",
    publicFeatureOne: "Train LoRA models with transparent pipeline phases and live progress.",
    publicFeatureTwo: "Generate images with controllable settings and reusable prompt logic.",
    publicFeatureThree: "Publish public models and public images with shareable links.",
    publicWhatIsTitle: "What is FrameWorkX?",
    publicWhatIsBody:
      "FrameWorkX is an all-in-one platform for LoRA workflows: train, generate, organize, and publish in one continuous system.",
    publicExploreImages: "Public Images",
    publicExploreModels: "Public Models",
    publicNoImages: "No public images yet.",
    publicNoModels: "No public models yet.",
    publicAssetStats: "Live Public Overview",
    publicOverviewShow: "Show overview",
    publicOverviewHide: "Hide overview"
  },
  de: {
    dashboard: "Dashboard",
    commandDeck: "Command Deck",
    pipeline: "Trainer",
    generator: "Generator",
    gallery: "Gallery",
    lora: "LoRA Galerie",
    messages: "Nachrichten",
    settings: "Einstellungen",
    signIn: "Anmelden",
    email: "E-Mail",
    password: "Passwort",
    login: "Login",
    queue: "Warteschlange",
    active: "Aktiv",
    generation: "Generierung",
    training: "Training",
    previewOutput: "Generierte Bilder",
    styles: "Stile",
    modelRegistry: "Model Registry",
    system: "System",
    apply: "Bewerben",
    publicWelcomeTitle: "LoRA-Training, Bildgenerierung und Publishing in einer Plattform.",
    publicWelcomeLead:
      "FrameWorkX verbindet den gesamten Ablauf von Datensatz zu Modelltraining mit Bildgenerierung und Galerie-Publishing fuer oeffentliche Modelle und Bilder.",
    publicWelcomeBody:
      "Durchsuche oeffentliche Modelle und oeffentliche Bilder, vergleiche Stile und pruefe Outputs vor dem Login. Die Public-Ansicht ist fuer Discovery, Qualitaetscheck und Sharing gebaut.",
    publicFeatureOne: "LoRA-Modelle mit transparenten Pipeline-Phasen und Live-Fortschritt trainieren.",
    publicFeatureTwo: "Bilder mit kontrollierbaren Einstellungen und wiederverwendbarer Prompt-Logik generieren.",
    publicFeatureThree: "Oeffentliche Modelle und oeffentliche Bilder mit teilbaren Links veroeffentlichen.",
    publicWhatIsTitle: "Was ist FrameWorkX?",
    publicWhatIsBody:
      "FrameWorkX ist eine All-in-One Plattform fuer LoRA-Workflows: trainieren, generieren, organisieren und veroeffentlichen in einem durchgaengigen System.",
    publicExploreImages: "Oeffentliche Bilder",
    publicExploreModels: "Oeffentliche Modelle",
    publicNoImages: "Noch keine oeffentlichen Bilder vorhanden.",
    publicNoModels: "Noch keine oeffentlichen Modelle vorhanden.",
    publicAssetStats: "Live Public Uebersicht",
    publicOverviewShow: "Uebersicht anzeigen",
    publicOverviewHide: "Uebersicht ausblenden"
  }
};

const nav = ["dashboard", "pipeline", "generator", "gallery", "lora", "messages"] as const;

type NavKey = (typeof nav)[number] | "admin";
type AppView = NavKey | "profile" | "settings" | "edit_profile";
type SettingsTab = "security" | "notifications" | "automation" | "tokens";

const adminTabs = [
  "queue",
  "core",
  "tagger",
  "notifications",
  "generation",
  "credits",
  "users",
  "applications",
  "models",
  "archives"
] as const;

type AdminTabKey = (typeof adminTabs)[number];

type AdminArchive = {
  path: string;
  size_bytes: number;
  modified_at: string;
  user_id: string | null;
  label: string | null;
  display_name?: string | null;
  origin?: string | null;
  type?: string | null;
  reason?: string | null;
  source_id?: string | null;
  source_name?: string | null;
  created_at: string | null;
  entry_count: number | null;
};

type AdminArchiveEntry = {
  path: string;
  name: string;
  type: string;
  size?: number;
};

type AdminArchiveDetail = {
  archive: AdminArchive;
  entries: AdminArchiveEntry[];
  manifest: Record<string, any> | null;
};

function humanizeErrorCode(input: unknown) {
  const code = String(input ?? "").trim();
  if (!code) return "Unknown error.";
  const map: Record<string, string> = {
    login_failed: "Login failed. Please check email and password.",
    totp_required_for_new_ip: "2FA is required from this IP. Enter your TOTP code.",
    totp_verify_failed: "2FA verification failed.",
    totp_invalid: "Invalid TOTP code.",
    totp_locked: "2FA is locked after too many attempts.",
    totp_locked_use_emergency_or_admin: "2FA locked. Use an emergency code or ask an admin to unlock.",
    emergency_code_invalid: "Emergency code is invalid.",
    challenge_required: "2FA challenge is missing. Please log in again.",
    challenge_invalid: "2FA challenge expired. Please log in again.",
    totp_not_enabled: "2FA is not enabled for this account.",
    invalid_credentials: "Credentials are invalid.",
    preview_prompts_missing: "Preview prompts are missing. Ask admin to configure them.",
    blendermix_missing: "Preview model is missing. Ask admin to register the blendermix model.",
    preview_in_progress: "Preview generation is already running for this LoRA.",
    item_required: "Queue item is missing.",
    direction_required: "Reorder direction is missing.",
    item_type_not_supported: "This queue item type cannot be reordered.",
    not_reorderable: "This item cannot be reordered right now.",
    wildcard_list_missing: "Wildcard list is missing.",
    cannot_cancel_running: "This item is currently running and cannot be cancelled.",
    cannot_delete_running: "This item is currently running and cannot be deleted.",
    already_removing: "Deletion is already in progress.",
    retention_days_invalid: "Retention must be at least 1 day.",
    pipeline_still_active_delete_pipeline_first:
      "This training run is still attached to an active pipeline. Delete/stop the pipeline run first.",
    thread_not_found: "Conversation not found.",
    dm_blocked: "Messaging is blocked for this user/thread.",
    message_required: "Message text is required.",
    message_too_long: "Message is too long.",
    not_found: "Item not found.",
    forbidden: "You are not allowed to do this.",
    unauthorized: "Please sign in again.",
    insufficient_credits: "Not enough credits for this action."
  };
  if (map[code]) return map[code];
  return code.replace(/_/g, " ");
}

const USER_PERMISSION_DEFS = [
  { key: "generate.create", label: "Generator", defaultEnabled: true },
  { key: "train.run", label: "Training", defaultEnabled: true },
  { key: "lora.upload", label: "LoRA Uploads", defaultEnabled: false }
];

const DEFAULT_SAMPLERS = [
  "Euler",
  "Euler a",
  "DDIM",
  "DPM++ 2M",
  "DPM++ SDE",
  "DPM++ 2M Karras",
  "DPM++ SDE Karras",
  "DPM2",
  "DPM2 a",
  "Heun",
  "LMS",
  "PLMS",
  "UniPC"
];

const DEFAULT_SCHEDULERS = [
  "Karras",
  "Exponential",
  "SGM Uniform",
  "Simple",
  "Beta",
  "PolyExponential"
];

const CORE_DEFAULTS = {
  capping_fps: 8,
  capping_jpeg_quality: 2,
  selection_target_per_character: 40,
  selection_face_quota: 10,
  selection_hamming_threshold: 6,
  selection_hamming_relaxed: 4,
  output_max_images: 600,
  autotag_general_threshold: 0.55,
  autotag_character_threshold: 0.4,
  autotag_max_tags: 30,
  autotag_model_id: "SmilingWolf/wd-eva02-large-tagger-v3"
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  "notify.like.email": true,
  "notify.comment.email": true,
  "notify.training_done.email": true,
  "notify.training_failed.email": true,
  "notify.new_follower.email": true,
  "notify.dm.email": true
};

const DEFAULT_2FA_STATUS: TwoFaStatus = {
  enabled: false,
  locked: false,
  failed_attempts: 0,
  onboarding_pending: false,
  trusted_ip_count: 0,
  recovery_remaining: 0
};

const NOTIFICATION_LABELS: Array<{ key: keyof NotificationPrefs; label: string }> = [
  { key: "notify.like.email", label: "Likes" },
  { key: "notify.comment.email", label: "Comments" },
  { key: "notify.training_done.email", label: "Training done" },
  { key: "notify.training_failed.email", label: "Training failed" },
  { key: "notify.new_follower.email", label: "New follower" },
  { key: "notify.dm.email", label: "Direct messages" }
];

const DEFAULT_SAMPLE_PROMPTS = [
  "<trigger>, standing, full body",
  "<trigger>, lying down, full body",
  "<trigger>, portrait, close-up"
];

const RATIO_OPTIONS = [
  "1024x1024 (1:1)",
  "1216x832 (3:2)",
  "1344x768 (7:4)",
  "1536x640 (12:5)",
  "832x1216 (2:3)",
  "768x1344 (4:7)",
  "640x1536 (5:12)"
];

const DM_EMOJI_SET = ["😀", "😎", "🔥", "✨", "👍", "🙏", "💯", "😂", "🤝", "❤️", "🎯", "🚀"];
const CREDIT_LEDGER_REASON_OPTIONS = [
  "reserve_generate",
  "reserve_train",
  "reserve_pipeline",
  "release_generate",
  "release_train",
  "release_pipeline",
  "admin_adjust",
  "reward_like_image",
  "reward_like_model",
  "reward_comment_first",
  "daily_grant"
];
const CREDIT_LEDGER_REF_TYPE_OPTIONS = [
  "generation_job",
  "training_run",
  "pipeline_run",
  "image",
  "model",
  "lora",
  "comment",
  "manual",
  "system"
];

function getToken() {
  if (typeof window !== "undefined") {
    try {
      const url = new URL(window.location.href);
      const isImpersonation = url.searchParams.get("impersonate") === "1";
      const urlToken = url.searchParams.get("imp_token") ?? "";
      if (isImpersonation && urlToken) {
        sessionStorage.setItem("fx_imp_active", "1");
        sessionStorage.setItem("fx_imp_token", urlToken);
        url.searchParams.delete("imp_token");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        return urlToken;
      }
      const impActive = sessionStorage.getItem("fx_imp_active") === "1";
      const impToken = sessionStorage.getItem("fx_imp_token") ?? "";
      if (impActive && impToken) {
        return impToken;
      }
    } catch {
      // ignore URL/session storage errors
    }
  }
  try {
    return localStorage.getItem("fx_token") ?? "";
  } catch {
    return "";
  }
}

function setToken(token: string) {
  if (typeof window !== "undefined") {
    try {
      const impActive = sessionStorage.getItem("fx_imp_active") === "1";
      if (impActive) {
        if (token) {
          sessionStorage.setItem("fx_imp_token", token);
        } else {
          sessionStorage.removeItem("fx_imp_token");
          sessionStorage.removeItem("fx_imp_active");
        }
        return;
      }
    } catch {
      // ignore session storage errors
    }
  }
  try {
    localStorage.setItem("fx_token", token);
  } catch {
    // ignore storage errors (Safari private mode / locked storage)
  }
}

function getLastModelId() {
  try {
    return localStorage.getItem("fx_last_model_id") ?? "";
  } catch {
    return "";
  }
}

function setLastModelId(modelId: string) {
  try {
    localStorage.setItem("fx_last_model_id", modelId);
  } catch {
    // ignore storage errors (Safari private mode / locked storage)
  }
}

function getGeneratorSettings() {
  try {
    const raw = localStorage.getItem("fx_generator_settings");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.seed === 0 || parsed.seed === "0")) {
      parsed.seed = "-0";
    }
    return parsed;
  } catch {
    return {};
  }
}

function setGeneratorSettings(settings: Record<string, any>) {
  try {
    localStorage.setItem("fx_generator_settings", JSON.stringify(settings));
  } catch {
    // ignore storage errors (Safari private mode / locked storage)
  }
}

function publicImageHref(imageId: string, lang: Lang) {
  const params = new URLSearchParams();
  params.set("image", imageId);
  params.set("lang", lang);
  return `/?${params.toString()}`;
}

function publicLoraHref(loraId: string, lang: Lang) {
  const params = new URLSearchParams();
  params.set("lang", lang);
  return `/lora/${encodeURIComponent(loraId)}?${params.toString()}`;
}

function fileUrl(fileId: string, token: string, options?: { thumb?: boolean; size?: number }) {
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (options?.thumb) {
    params.set("variant", "thumb");
    params.set("size", String(options.size ?? 384));
  }
  const query = params.toString();
  return `/api/files/${fileId}${query ? `?${query}` : ""}`;
}

function renderAvatar(fileId?: string | null, authToken?: string | null, altLabel?: string) {
  const fallbackLabel = (altLabel ?? "?").replace(/^@+/, "").trim();
  const fallbackInitial = fallbackLabel ? fallbackLabel.charAt(0).toUpperCase() : "?";
  if (!fileId) {
    return <span className="tile-avatar-wrap placeholder">{fallbackInitial}</span>;
  }
  return (
    <span className="tile-avatar-wrap">
      <img
        className="tile-avatar-img"
        src={fileUrl(fileId, authToken ?? "", { thumb: true, size: 96 })}
        alt={altLabel ?? "User avatar"}
        title={altLabel ?? "User avatar"}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

function withToken(url: string, token: string) {
  if (!url || !token) return url;
  if (url.includes("token=") || url.includes("access_token=")) return url;
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}token=${encodeURIComponent(token)}`;
}

function parseRatio(ratio: string) {
  const match = ratio.match(/(\\d+)x(\\d+)/);
  if (!match) return { width: 1024, height: 1024 };
  return { width: Number(match[1]), height: Number(match[2]) };
}

function formatBytes(size: number) {
  if (!Number.isFinite(size)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function parseTagList(text: string) {
  return String(text || "")
    .toLowerCase()
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/\s+/g, "_"));
}

function normalizeWildcardName(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function parseWildcardSetting(raw: any): WildcardList[] {
  const source = raw?.lists ?? raw;
  if (!source || typeof source !== "object") return [];
  const out: WildcardList[] = [];
  if (Array.isArray(source)) {
    for (const row of source) {
      const name = normalizeWildcardName(row?.name ?? "");
      const entries = Array.isArray(row?.entries) ? row.entries.map((v: any) => String(v).trim()).filter(Boolean) : [];
      if (!name || !entries.length) continue;
      out.push({ name, entries });
    }
    return out;
  }
  for (const [key, value] of Object.entries(source)) {
    const name = normalizeWildcardName(key);
    const entries = Array.isArray(value) ? value.map((v: any) => String(v).trim()).filter(Boolean) : [];
    if (!name || !entries.length) continue;
    out.push({ name, entries });
  }
  return out;
}

function wildcardListsToMap(lists: WildcardList[]) {
  const out: Record<string, string[]> = {};
  for (const row of lists) {
    const name = normalizeWildcardName(row.name);
    const entries = Array.isArray(row.entries) ? row.entries.map((value) => String(value).trim()).filter(Boolean) : [];
    if (!name || !entries.length) continue;
    out[name] = entries;
  }
  return out;
}

function parseWildcardEntries(text: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const cleaned = line.trim();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
  }
  return out;
}

function expandWildcardPromptPreview(prompt: string, lists: WildcardList[], mode: "sequential" | "random") {
  const tokenRegex = /__([a-z0-9_-]+)__/gi;
  const tokenNames = new Set<string>();
  const source = String(prompt ?? "");
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(source)) !== null) {
    tokenNames.add(normalizeWildcardName(match[1]));
  }
  const tokens = Array.from(tokenNames);
  if (!tokens.length) return { tokens, missing: [] as string[], variants: [] as string[] };
  const mapped = wildcardListsToMap(lists);
  const missing = tokens.filter((token) => !Array.isArray(mapped[token]) || mapped[token].length === 0);
  if (missing.length) return { tokens, missing, variants: [] as string[] };
  const variantCount = Math.max(...tokens.map((token) => mapped[token].length), 1);
  const variants: string[] = [];
  for (let i = 0; i < variantCount; i += 1) {
    let next = prompt;
    for (const token of tokens) {
      const values = mapped[token];
      const selected =
        mode === "random" ? values[Math.floor(Math.random() * values.length)] : values[i % values.length];
      next = next.replace(new RegExp(`__${token}__`, "gi"), selected);
    }
    variants.push(next);
  }
  return { tokens, missing: [] as string[], variants };
}

const MOBILE_ROUTE_PATH = "/m";

const VIEW_SEGMENT_MAP: Record<AppView, string> = {
  dashboard: "",
  pipeline: "trainer",
  generator: "generator",
  gallery: "gallery",
  lora: "lora",
  messages: "messages",
  settings: "settings",
  edit_profile: "edit-profile",
  admin: "admin",
  profile: "profile"
};

const SEGMENT_VIEW_MAP: Record<string, AppView> = {
  "": "dashboard",
  trainer: "pipeline",
  generator: "generator",
  gallery: "gallery",
  lora: "lora",
  messages: "messages",
  settings: "settings",
  "edit-profile": "edit_profile",
  admin: "admin",
  profile: "profile"
};

function isMobileRoute(pathname: string) {
  return pathname === MOBILE_ROUTE_PATH || pathname.startsWith(`${MOBILE_ROUTE_PATH}/`);
}

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.replace(/\/+$/, "");
  return pathname;
}

function getViewFromPathname(pathname: string): AppView {
  const normalized = normalizePathname(pathname);
  const mobile = isMobileRoute(normalized);
  const withoutMobile = mobile ? normalized.replace(/^\/m(?=\/|$)/, "") || "/" : normalized;
  const segment = withoutMobile.split("/").filter(Boolean)[0] ?? "";
  return SEGMENT_VIEW_MAP[segment] ?? "dashboard";
}

function getLoraRouteIdFromPathname(pathname: string) {
  const normalized = normalizePathname(pathname);
  const mobile = isMobileRoute(normalized);
  const withoutMobile = mobile ? normalized.replace(/^\/m(?=\/|$)/, "") || "/" : normalized;
  const match = withoutMobile.match(/^\/lora\/([^/]+)$/);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function getPathForView(view: AppView, mobile: boolean) {
  const base = mobile ? MOBILE_ROUTE_PATH : "";
  const segment = VIEW_SEGMENT_MAP[view] ?? "";
  if (!segment) return base || "/";
  return `${base}/${segment}`;
}

function detectMobileClient() {
  if (typeof window === "undefined") return false;
  const ua = String(window.navigator.userAgent ?? "");
  const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua) || coarse;
}

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const url = new URL(window.location.href);
    const queryLang = url.searchParams.get("lang");
    if (queryLang === "de" || queryLang === "en") {
      localStorage.setItem("fx_lang", queryLang);
      return queryLang;
    }
  } catch {
    // ignore URL parsing issues
  }
  try {
    const stored = localStorage.getItem("fx_lang");
    if (stored === "de" || stored === "en") return stored;
  } catch {
    // ignore storage errors
  }
  if (typeof navigator !== "undefined" && String(navigator.language ?? "").toLowerCase().startsWith("de")) {
    return "de";
  }
  return "en";
}

export default function App() {
  const [isMobileRouteActive, setIsMobileRouteActive] = useState(
    typeof window !== "undefined" ? isMobileRoute(window.location.pathname) : false
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShowCompletedJobs, setMobileShowCompletedJobs] = useState(false);
  const [view, setView] = useState<AppView>(
    typeof window !== "undefined" ? getViewFromPathname(window.location.pathname) : "dashboard"
  );
  const [loraRouteId, setLoraRouteId] = useState<string>(
    typeof window !== "undefined" ? getLoraRouteIdFromPathname(window.location.pathname) : ""
  );
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("security");
  const [lang, setLang] = useState<Lang>(() => getInitialLang());
  const [token, setAuthToken] = useState<string>(getToken());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [trainingRuns, setTrainingRuns] = useState<Run[]>([]);
  const [pipelineRuns, setPipelineRuns] = useState<Run[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [selectedRunSteps, setSelectedRunSteps] = useState<any[]>([]);
  const [selectedRunEvents, setSelectedRunEvents] = useState<any[]>([]);
  const [selectedRunPreviews, setSelectedRunPreviews] = useState<any[]>([]);
  const [selectedTrainingPreviews, setSelectedTrainingPreviews] = useState<any[]>([]);
  const [dashboardPipeline, setDashboardPipeline] = useState<DashboardPipelineRun[]>([]);
  const [dashboardTraining, setDashboardTraining] = useState<DashboardTrainingRun[]>([]);
  const [dashboardQueue, setDashboardQueue] = useState<DashboardQueueItem[]>([]);
  const [dashboardQueueMsg, setDashboardQueueMsg] = useState("");
  const [dashboardQueueMovePending, setDashboardQueueMovePending] = useState<string | null>(null);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [dashboardModalKind, setDashboardModalKind] = useState<"pipeline" | "training">("pipeline");
  const [dashboardModalPhase, setDashboardModalPhase] = useState<"prep" | "train_pre" | "train" | "finishing">("prep");
  const [dashboardModalId, setDashboardModalId] = useState<string | null>(null);
  const [dashboardModalData, setDashboardModalData] = useState<any | null>(null);
  const [dashboardModalSteps, setDashboardModalSteps] = useState<any[]>([]);
  const [dashboardModalImageCount, setDashboardModalImageCount] = useState<number | null>(null);
  const [dashboardModalEvents, setDashboardModalEvents] = useState<any[]>([]);
  const [dashboardModalPreviews, setDashboardModalPreviews] = useState<string[]>([]);
  const [dashboardModalTrainingPreviews, setDashboardModalTrainingPreviews] = useState<DashboardTrainingPreview[]>([]);
  const [dashboardDatasetCoverUrl, setDashboardDatasetCoverUrl] = useState<string | null>(null);
  const [dashboardDatasetCoverFileId, setDashboardDatasetCoverFileId] = useState<string | null>(null);
  const [dashboardModalLastUpdated, setDashboardModalLastUpdated] = useState<number | null>(null);
  const [dashboardPreviewLightbox, setDashboardPreviewLightbox] = useState<string | null>(null);
  const [dashboardErrorOpen, setDashboardErrorOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualRunId, setManualRunId] = useState("");
  const [manualRunName, setManualRunName] = useState("");
  const [manualImages, setManualImages] = useState<ManualImage[]>([]);
  const [manualFiltered, setManualFiltered] = useState<ManualImage[]>([]);
  const [manualSelected, setManualSelected] = useState<string[]>([]);
  const [manualDirty, setManualDirty] = useState<Record<string, string>>({});
  const [manualTags, setManualTags] = useState<{ tag: string; count: number }[]>([]);
  const [manualFilterTags, setManualFilterTags] = useState<string[]>([]);
  const [manualTagMatch, setManualTagMatch] = useState<"any" | "all">("any");
  const [manualSearch, setManualSearch] = useState("");
  const [manualFaceOnly, setManualFaceOnly] = useState(false);
  const [manualBulkAdd, setManualBulkAdd] = useState("");
  const [manualBulkRemove, setManualBulkRemove] = useState("");
  const [manualTagFilter, setManualTagFilter] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const [manualPage, setManualPage] = useState(1);
  const [applyOpen, setApplyOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [applyStatus, setApplyStatus] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyForm, setApplyForm] = useState({
    display_name: "",
    email: "",
    handle: "",
    links: "",
    message: ""
  });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNext, setPasswordNext] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({ display_name: "", bio: "", avatar_file_id: null });
  const [avatarStatus, setAvatarStatus] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [twoFaStatus, setTwoFaStatus] = useState<TwoFaStatus>(DEFAULT_2FA_STATUS);
  const [securityWizardOpen, setSecurityWizardOpen] = useState(false);
  const [securityWizardStep, setSecurityWizardStep] = useState<1 | 2 | 3>(1);
  const [securityWizardSecret, setSecurityWizardSecret] = useState("");
  const [securityWizardUri, setSecurityWizardUri] = useState("");
  const [securityWizardCode, setSecurityWizardCode] = useState("");
  const [securityRecoveryCodes, setSecurityRecoveryCodes] = useState<string[]>([]);
  const [securityStatusMsg, setSecurityStatusMsg] = useState("");
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityDisablePassword, setSecurityDisablePassword] = useState("");
  const [securityDisableCode, setSecurityDisableCode] = useState("");
  const [securityDisableEmergency, setSecurityDisableEmergency] = useState("");
  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
  const [samplerOptions, setSamplerOptions] = useState<string[]>(DEFAULT_SAMPLERS);
  const [schedulerOptions, setSchedulerOptions] = useState<string[]>(DEFAULT_SCHEDULERS);
  const [adminSamplerSelection, setAdminSamplerSelection] = useState<string[]>(DEFAULT_SAMPLERS);
  const [adminSchedulerSelection, setAdminSchedulerSelection] = useState<string[]>(DEFAULT_SCHEDULERS);
  const [coreSettings, setCoreSettings] = useState({
    capping_fps: "",
    capping_jpeg_quality: "",
    selection_target_per_character: "",
    selection_face_quota: "",
    selection_hamming_threshold: "",
    selection_hamming_relaxed: "",
    autotag_general_threshold: "",
    autotag_character_threshold: "",
    autotag_max_tags: "",
    output_max_images: ""
  });
  const [hfToken, setHfToken] = useState("");
  const [taggerRepoId, setTaggerRepoId] = useState("");
  const [taggerPreset, setTaggerPreset] = useState("");
  const [taggerDefault, setTaggerDefault] = useState("");
  const [taggerModels, setTaggerModels] = useState<{ id: string; name: string }[]>([]);
  const [taggerStatus, setTaggerStatus] = useState("");
  const [adminCreditCostGenerate, setAdminCreditCostGenerate] = useState("1");
  const [adminCreditCostTrain, setAdminCreditCostTrain] = useState("5");
  const [adminTab, setAdminTab] = useState<AdminTabKey>("queue");
  const [instanceLabel, setInstanceLabel] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyChannelEmail, setNotifyChannelEmail] = useState(false);
  const [notifyChannelSlack, setNotifyChannelSlack] = useState(false);
  const [notifyChannelDiscord, setNotifyChannelDiscord] = useState(false);
  const [notifyChannelWebhook, setNotifyChannelWebhook] = useState(false);
  const [notifyJobFinish, setNotifyJobFinish] = useState(false);
  const [notifyJobFailed, setNotifyJobFailed] = useState(false);
  const [notifyQueueFinish, setNotifyQueueFinish] = useState(false);
  const [smtpTo, setSmtpTo] = useState("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_pass: "",
    smtp_from: "",
    smtp_base_url: "",
    smtp_ssl: false,
    smtp_tls: true
  });
  const [queueStatus, setQueueStatus] = useState({
    queue_paused: false,
    active_pipeline_id: "",
    active_generation_id: "",
    active_training_id: ""
  });
  const [adminCredits, setAdminCredits] = useState({ user_id: "", delta: "", daily_allowance: "" });
  const [adminCreditsStatus, setAdminCreditsStatus] = useState("");
  const [adminCreditsBusy, setAdminCreditsBusy] = useState(false);
  const [adminLedgerEntries, setAdminLedgerEntries] = useState<AdminCreditLedgerEntry[]>([]);
  const [adminLedgerLoading, setAdminLedgerLoading] = useState(false);
  const [adminLedgerStatus, setAdminLedgerStatus] = useState("");
  const [adminLedgerUserFilter, setAdminLedgerUserFilter] = useState("");
  const [adminLedgerReasonFilter, setAdminLedgerReasonFilter] = useState("");
  const [adminLedgerRefTypeFilter, setAdminLedgerRefTypeFilter] = useState("");
  const [adminLedgerDeltaSign, setAdminLedgerDeltaSign] = useState<"all" | "plus" | "minus">("all");
  const [adminLedgerFrom, setAdminLedgerFrom] = useState("");
  const [adminLedgerTo, setAdminLedgerTo] = useState("");
  const [adminLedgerPage, setAdminLedgerPage] = useState(1);
  const [adminLedgerPageSize, setAdminLedgerPageSize] = useState(25);
  const [adminLedgerTotal, setAdminLedgerTotal] = useState(0);
  const [adminLedgerDetailOpen, setAdminLedgerDetailOpen] = useState(false);
  const [adminLedgerDetail, setAdminLedgerDetail] = useState<AdminCreditLedgerDetail | null>(null);
  const [adminLedgerCopyStatus, setAdminLedgerCopyStatus] = useState("");
  const [loginGallery, setLoginGallery] = useState<GalleryPublicImage[]>([]);
  const [loginModels, setLoginModels] = useState<GalleryPublicModel[]>([]);
  const [loginLoras, setLoginLoras] = useState<LoraEntry[]>([]);
  const [loginSelectedImage, setLoginSelectedImage] = useState<GalleryImageDetail | null>(null);
  const [loginSelectedModelLabel, setLoginSelectedModelLabel] = useState("");
  const [loginSelectedLora, setLoginSelectedLora] = useState<LoraEntry | null>(null);
  const [loginSelectedLoraPreview, setLoginSelectedLoraPreview] = useState<string | null>(null);
  const [loginSelectedLoraPreviewOriginalReady, setLoginSelectedLoraPreviewOriginalReady] = useState(false);
  const [galleryModels, setGalleryModels] = useState<GalleryModel[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryPublicImage[]>([]);
  const [galleryBulkMode, setGalleryBulkMode] = useState(false);
  const [galleryBulkSelection, setGalleryBulkSelection] = useState<string[]>([]);
  const [galleryBulkBusy, setGalleryBulkBusy] = useState(false);
  const [galleryBulkMessage, setGalleryBulkMessage] = useState("");
  const [loraEntries, setLoraEntries] = useState<LoraEntry[]>([]);
  const [loraMode, setLoraMode] = useState<"public" | "private">("public");
  const [loraName, setLoraName] = useState("");
  const [loraFileId, setLoraFileId] = useState("");
  const [loraIsPublic, setLoraIsPublic] = useState(false);
  const [loraUploadOpen, setLoraUploadOpen] = useState(false);
  const [loraUploadFile, setLoraUploadFile] = useState<File | null>(null);
  const [loraUploadName, setLoraUploadName] = useState("");
  const [loraUploadPublic, setLoraUploadPublic] = useState(false);
  const [loraUploadStatus, setLoraUploadStatus] = useState("");
  const [loraUploadProgress, setLoraUploadProgress] = useState(0);
  const [loraBulkMode, setLoraBulkMode] = useState(false);
  const [loraBulkSelection, setLoraBulkSelection] = useState<string[]>([]);
  const [loraBulkBusy, setLoraBulkBusy] = useState(false);
  const [loraBulkMessage, setLoraBulkMessage] = useState("");
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loraPreviewStatus, setLoraPreviewStatus] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<GalleryImageDetail | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<{ likes: number; comments: number; user_liked: boolean } | null>(
    null
  );
  const [selectedModelLabel, setSelectedModelLabel] = useState("");
  const [selectedLoraLabels, setSelectedLoraLabels] = useState<string[]>([]);
  const [selectedComments, setSelectedComments] = useState<GalleryComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [selectedModelImages, setSelectedModelImages] = useState<GalleryImage[]>([]);
  const [selectedModelMeta, setSelectedModelMeta] = useState<{ likes: number; comments: number; user_liked: boolean } | null>(
    null
  );
  const [selectedModelComments, setSelectedModelComments] = useState<GalleryComment[]>([]);
  const [modelCommentDraft, setModelCommentDraft] = useState("");
  const [selectedLoraEntry, setSelectedLoraEntry] = useState<LoraEntry | null>(null);
  const [selectedLoraPreview, setSelectedLoraPreview] = useState<string | null>(null);
  const [selectedLoraPreviewOriginalReady, setSelectedLoraPreviewOriginalReady] = useState(false);
  const [selectedLoraMeta, setSelectedLoraMeta] = useState<{ likes: number; comments: number; user_liked: boolean } | null>(
    null
  );
  const [selectedLoraComments, setSelectedLoraComments] = useState<GalleryComment[]>([]);
  const [loraCommentDraft, setLoraCommentDraft] = useState("");
  const [loraDetailPreviewOffset, setLoraDetailPreviewOffset] = useState(0);
  const [loraDescriptionDraft, setLoraDescriptionDraft] = useState("");
  const [loraDescriptionEditing, setLoraDescriptionEditing] = useState(false);
  const [loraDescriptionStatus, setLoraDescriptionStatus] = useState("");
  const [loraDetailEditing, setLoraDetailEditing] = useState(false);
  const [loraNameDraft, setLoraNameDraft] = useState("");
  const [loraTriggerDraft, setLoraTriggerDraft] = useState("");
  const [profileView, setProfileView] = useState<PublicProfile | null>(null);
  const [profileStats, setProfileStats] = useState<PublicProfileStats | null>(null);
  const [profileRelationship, setProfileRelationship] = useState<PublicProfileRelationship | null>(null);
  const [profileFollowBusy, setProfileFollowBusy] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [notificationSaving, setNotificationSaving] = useState<Record<string, boolean>>({});
  const [notificationList, setNotificationList] = useState<NotificationEntry[]>([]);
  const [notificationUnread, setNotificationUnread] = useState(0);
  const [notificationWidgetOpen, setNotificationWidgetOpen] = useState(false);
  const [notificationPulse, setNotificationPulse] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [publicOverviewExpanded, setPublicOverviewExpanded] = useState(true);
  const [dmThreads, setDmThreads] = useState<DMThread[]>([]);
  const [dmActiveThreadId, setDmActiveThreadId] = useState<string>("");
  const [dmMessages, setDmMessages] = useState<DMMessage[]>([]);
  const dmMessagesRef = useRef<DMMessage[]>([]);
  const publicDeepLinkHandledRef = useRef(false);
  const [dmDraft, setDmDraft] = useState("");
  const [dmStatus, setDmStatus] = useState("");
  const [dmLoading, setDmLoading] = useState(false);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [dmBlocks, setDmBlocks] = useState<DMBlock[]>([]);
  const [dmThreadQuery, setDmThreadQuery] = useState("");
  const [dmEmojiOpen, setDmEmojiOpen] = useState(false);
  const [miniDmOpen, setMiniDmOpen] = useState(false);
  const [miniDmMode, setMiniDmMode] = useState<"threads" | "chat">("threads");
  const [miniDmThreadId, setMiniDmThreadId] = useState("");
  const [miniDmQuery, setMiniDmQuery] = useState("");
  const [miniDmEmojiOpen, setMiniDmEmojiOpen] = useState(false);
  const [profileModels, setProfileModels] = useState<GalleryModel[]>([]);
  const [profileLoras, setProfileLoras] = useState<LoraEntry[]>([]);
  const [profileImages, setProfileImages] = useState<GalleryPublicImage[]>([]);
  const [profileReturnView, setProfileReturnView] = useState<AppView>("gallery");
  const [galleryMode, setGalleryMode] = useState<"public" | "private">("public");
  const [modelRegistry, setModelRegistry] = useState<ModelRegistryEntry[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUserSearchField, setAdminUserSearchField] = useState<"email" | "username" | "id">("email");
  const [adminUserSearchValue, setAdminUserSearchValue] = useState("");
  const [adminUserSearchBusy, setAdminUserSearchBusy] = useState(false);
  const [adminUserSearchStatus, setAdminUserSearchStatus] = useState("");
  const [adminUserSelectedId, setAdminUserSelectedId] = useState("");
  const [adminUserPermBusy, setAdminUserPermBusy] = useState<Record<string, boolean>>({});
  const [adminUserStatusBusy, setAdminUserStatusBusy] = useState(false);
  const [adminUserCreditsBusy, setAdminUserCreditsBusy] = useState(false);
  const [adminUserCreditsDelta, setAdminUserCreditsDelta] = useState("");
  const [adminUserCreditsAllowance, setAdminUserCreditsAllowance] = useState("");
  const [adminUserCreditsStatus, setAdminUserCreditsStatus] = useState("");
  const [adminUserPasswordBusy, setAdminUserPasswordBusy] = useState(false);
  const [adminUserPasswordValue, setAdminUserPasswordValue] = useState("");
  const [adminUserPasswordMustChange, setAdminUserPasswordMustChange] = useState(true);
  const [adminUserPasswordResult, setAdminUserPasswordResult] = useState("");
  const [adminUserImpersonateBusy, setAdminUserImpersonateBusy] = useState(false);
  const [adminUserImpersonatePassword, setAdminUserImpersonatePassword] = useState("");
  const [adminUserImpersonateStatus, setAdminUserImpersonateStatus] = useState("");
  const [adminApplications, setAdminApplications] = useState<AdminApplication[]>([]);
  const [adminArchives, setAdminArchives] = useState<AdminArchive[]>([]);
  const [adminArchiveQuery, setAdminArchiveQuery] = useState("");
  const [adminArchiveUser, setAdminArchiveUser] = useState("");
  const [adminArchiveLoading, setAdminArchiveLoading] = useState(false);
  const [adminArchiveMessage, setAdminArchiveMessage] = useState("");
  const [adminArchiveOverwrite, setAdminArchiveOverwrite] = useState(false);
  const [adminArchiveTypeFilter, setAdminArchiveTypeFilter] = useState("all");
  const [adminArchiveReasonFilter, setAdminArchiveReasonFilter] = useState("all");
  const [adminArchiveOriginFilter, setAdminArchiveOriginFilter] = useState("all");
  const [adminArchiveRetentionDays, setAdminArchiveRetentionDays] = useState("30");
  const [adminArchiveDetail, setAdminArchiveDetail] = useState<AdminArchiveDetail | null>(null);
  const [adminArchiveDetailOpen, setAdminArchiveDetailOpen] = useState(false);
  const [adminArchiveEntryFilter, setAdminArchiveEntryFilter] = useState("");
  const [stagedUploads, setStagedUploads] = useState<StagedUpload[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [autocharPresets, setAutocharPresets] = useState<AutocharPreset[]>([]);
  const [autocharName, setAutocharName] = useState("");
  const [autocharDescription, setAutocharDescription] = useState("");
  const [autocharPatterns, setAutocharPatterns] = useState("");
  const [autocharStatus, setAutocharStatus] = useState("");
  const [autocharEditingId, setAutocharEditingId] = useState<string | null>(null);
  const [trainProfiles, setTrainProfiles] = useState<TrainProfile[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [runConfig, setRunConfig] = useState({
    autotag: true,
    autochar: false,
    manualTagging: false,
    facecap: false,
    imagesOnly: false,
    train: false,
    gpu: true,
    baseModelId: "",
    trainProfile: "",
    note: "",
    samplePrompts: ["", "", ""]
  });
  const [trainerWizardOpen, setTrainerWizardOpen] = useState(false);
  const [trainerWizardMode, setTrainerWizardMode] = useState<"single" | "batch" | null>(null);
  const [trainerWizardStep, setTrainerWizardStep] = useState(0);
  const [trainerName, setTrainerName] = useState("");
  const [trainerDescription, setTrainerDescription] = useState("");
  const [trainerNotes, setTrainerNotes] = useState("");
  const [trainerUseDefaults, setTrainerUseDefaults] = useState(true);
  const [trainerConfirmDuplicates, setTrainerConfirmDuplicates] = useState(false);
  const [trainerWizardError, setTrainerWizardError] = useState("");
  const [trainerDuplicateConfirmOpen, setTrainerDuplicateConfirmOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [modelId, setModelId] = useState<string>(getLastModelId());
  const generatorSettings = getGeneratorSettings();
  const [sampler, setSampler] = useState(String(generatorSettings.sampler ?? "Euler"));
  const [scheduler, setScheduler] = useState(String(generatorSettings.scheduler ?? "Karras"));
  const [ratio, setRatio] = useState(String(generatorSettings.ratio ?? RATIO_OPTIONS[0]));
  const [steps, setSteps] = useState(String(generatorSettings.steps ?? "30"));
  const [cfgScale, setCfgScale] = useState(String(generatorSettings.cfgScale ?? "7.5"));
  const [batchCount, setBatchCount] = useState(String(generatorSettings.batchCount ?? "1"));
  const [seed, setSeed] = useState(String(generatorSettings.seed ?? "-0"));
  const [wildcardMode, setWildcardMode] = useState<"sequential" | "random">("sequential");
  const [wildcardLists, setWildcardLists] = useState<WildcardList[]>([]);
  const [wildcardNameInput, setWildcardNameInput] = useState("");
  const [wildcardEntriesInput, setWildcardEntriesInput] = useState("");
  const [wildcardEditName, setWildcardEditName] = useState("");
  const [wildcardMessage, setWildcardMessage] = useState("");
  const [wildcardSaving, setWildcardSaving] = useState(false);
  const [selectedLoraId, setSelectedLoraId] = useState("");
  const [selectedLoraName, setSelectedLoraName] = useState("");
  const [selectedLoraWeight, setSelectedLoraWeight] = useState(0.75);
  const [isPublic, setIsPublic] = useState(Boolean(generatorSettings.isPublic ?? false));
  const [generateMessage, setGenerateMessage] = useState("");
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
  const [activeGenerationProgress, setActiveGenerationProgress] = useState<number | null>(null);
  const [activeGenerationEta, setActiveGenerationEta] = useState<number | null>(null);
  const [generatedOutputs, setGeneratedOutputs] = useState<GenerationOutput[]>([]);
  const [generatorAdvancedOpen, setGeneratorAdvancedOpen] = useState(false);
  const [generatorShowAllOutputs, setGeneratorShowAllOutputs] = useState(false);
  const [newModel, setNewModel] = useState({
    kind: "training_model",
    name: "",
    version: "",
    file_path: "",
    source: "manual"
  });
  const t = useMemo(() => copy[lang], [lang]);
  const isAdmin = user?.role === "admin";
  const activeQueueItems = useMemo(
    () =>
      queue.filter((item) => {
        const status = String(item.status ?? "");
        if (item.item_type === "generation_job") {
          return ["queued", "running", "rendering"].includes(status);
        }
        if (item.item_type === "pipeline_run") {
          return ["queued", "queued_initiated", "running", "manual_tagging", "ready_to_train"].includes(status);
        }
        if (item.item_type === "training_run") {
          return ["queued", "running"].includes(status);
        }
        return false;
      }),
    [queue]
  );
  const activeJobs = useMemo(
    () => jobs.filter((job) => ["queued", "running", "rendering"].includes(String(job.status ?? ""))),
    [jobs]
  );
  const activePipelineRuns = useMemo(
    () =>
      pipelineRuns.filter((run) =>
        ["queued", "queued_initiated", "running", "manual_tagging", "ready_to_train"].includes(String(run.status ?? ""))
      ),
    [pipelineRuns]
  );
  const activeTrainingRuns = useMemo(
    () => trainingRuns.filter((run) => ["queued", "running"].includes(String(run.status ?? ""))),
    [trainingRuns]
  );
  const selectedAdminUser = useMemo(
    () => adminUsers.find((row) => row.id === adminUserSelectedId) ?? null,
    [adminUsers, adminUserSelectedId]
  );

  useEffect(() => {
    if (!selectedAdminUser) return;
    setAdminUserCreditsDelta("");
    setAdminUserCreditsAllowance(String(selectedAdminUser.credits_daily_allowance ?? ""));
    setAdminUserCreditsStatus("");
    setAdminUserPasswordResult("");
    setAdminUserImpersonateStatus("");
  }, [selectedAdminUser?.id]);
  const wildcardPreview = useMemo(
    () => expandWildcardPromptPreview(prompt, wildcardLists, wildcardMode),
    [prompt, wildcardLists, wildcardMode]
  );
  const visibleGeneratedOutputs = useMemo(
    () => (generatorShowAllOutputs ? generatedOutputs : generatedOutputs.slice(0, 8)),
    [generatedOutputs, generatorShowAllOutputs]
  );
  const dmActiveThread = useMemo(
    () => dmThreads.find((thread) => thread.id === dmActiveThreadId) ?? null,
    [dmThreads, dmActiveThreadId]
  );
  const dmFilteredThreads = useMemo(() => {
    const query = dmThreadQuery.trim().toLowerCase();
    if (!query) return dmThreads;
    return dmThreads.filter((thread) => {
      const username = String(thread.peer_username ?? "").toLowerCase();
      const displayName = String(thread.peer_display_name ?? "").toLowerCase();
      const preview = String(thread.last_message_body ?? "").toLowerCase();
      return username.includes(query) || displayName.includes(query) || preview.includes(query);
    });
  }, [dmThreads, dmThreadQuery]);
  const miniDmActiveThread = useMemo(
    () => dmThreads.find((thread) => thread.id === miniDmThreadId) ?? null,
    [dmThreads, miniDmThreadId]
  );
  const miniDmFilteredThreads = useMemo(() => {
    const query = miniDmQuery.trim().toLowerCase();
    if (!query) return dmThreads;
    return dmThreads.filter((thread) => {
      const username = String(thread.peer_username ?? "").toLowerCase();
      const displayName = String(thread.peer_display_name ?? "").toLowerCase();
      const preview = String(thread.last_message_body ?? "").toLowerCase();
      return username.includes(query) || displayName.includes(query) || preview.includes(query);
    });
  }, [dmThreads, miniDmQuery]);
  const selectedLoraPreviewIds = useMemo(
    () => (Array.isArray(selectedLoraEntry?.preview_file_ids) ? selectedLoraEntry?.preview_file_ids : []),
    [selectedLoraEntry?.preview_file_ids]
  );
  const selectedLoraPreviewWindow = useMemo(() => {
    if (!selectedLoraPreviewIds.length) return [] as string[];
    if (selectedLoraPreviewIds.length <= 2) return selectedLoraPreviewIds;
    const start = ((loraDetailPreviewOffset % selectedLoraPreviewIds.length) + selectedLoraPreviewIds.length) % selectedLoraPreviewIds.length;
    return [selectedLoraPreviewIds[start], selectedLoraPreviewIds[(start + 1) % selectedLoraPreviewIds.length]];
  }, [selectedLoraPreviewIds, loraDetailPreviewOffset]);
  const selectedLoraPreviewIndex = useMemo(() => {
    if (!selectedLoraPreview) return -1;
    return selectedLoraPreviewIds.indexOf(selectedLoraPreview);
  }, [selectedLoraPreviewIds, selectedLoraPreview]);
  const loraDetailActive = Boolean(
    view === "lora" && selectedLoraEntry && loraRouteId && selectedLoraEntry.id === loraRouteId
  );
  const loginSelectedLoraPreviewIds = useMemo(
    () => (Array.isArray(loginSelectedLora?.preview_file_ids) ? loginSelectedLora?.preview_file_ids : []),
    [loginSelectedLora?.preview_file_ids]
  );
  const loginSelectedLoraPreviewIndex = useMemo(() => {
    if (!loginSelectedLoraPreview) return -1;
    return loginSelectedLoraPreviewIds.indexOf(loginSelectedLoraPreview);
  }, [loginSelectedLoraPreviewIds, loginSelectedLoraPreview]);
  const reorderableDashboardQueueIds = useMemo(() => {
    return new Set(
      dashboardQueue
        .filter((item) => item.item_type === "pipeline" && item.status === "queued")
        .map((item) => item.id)
    );
  }, [dashboardQueue]);
  const loginGallerySafe = useMemo(
    () =>
      (Array.isArray(loginGallery) ? loginGallery : []).filter(
        (row) => row && typeof row.id === "string" && typeof row.file_id === "string"
      ),
    [loginGallery]
  );
  const loginModelsSafe = useMemo(
    () =>
      (Array.isArray(loginModels) ? loginModels : []).filter(
        (row) => row && typeof row.id === "string" && typeof row.name === "string"
      ),
    [loginModels]
  );
  const loginLorasSafe = useMemo(
    () =>
      (Array.isArray(loginLoras) ? loginLoras : []).filter(
        (row) => row && typeof row.id === "string" && typeof row.name === "string"
      ),
    [loginLoras]
  );
  const dashboardTrainingPreviewGroups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: DashboardTrainingPreview[] }>();
    for (const row of dashboardModalTrainingPreviews) {
      const fileId = String(row?.file_id ?? "").trim();
      if (!fileId) continue;
      const epoch = Number.isFinite(Number(row?.epoch)) ? Number(row.epoch) : null;
      const key = epoch != null ? `epoch:${epoch}` : "epoch:unknown";
      const label = epoch != null ? `Epoch ${epoch}` : "Epoch ?/unknown";
      const existing = map.get(key) ?? { key, label, items: [] };
      if (!existing.items.some((item) => item.file_id === fileId)) {
        existing.items.push({ file_id: fileId, epoch });
      }
      map.set(key, existing);
    }
    const groups = Array.from(map.values());
    groups.sort((a, b) => {
      const aNum = Number((a.items[0]?.epoch ?? -1));
      const bNum = Number((b.items[0]?.epoch ?? -1));
      return bNum - aNum;
    });
    return groups;
  }, [dashboardModalTrainingPreviews]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncRoute = () => {
      setIsMobileRouteActive(isMobileRoute(window.location.pathname));
      setView(getViewFromPathname(window.location.pathname));
      setLoraRouteId(getLoraRouteIdFromPathname(window.location.pathname));
    };
    const mobileClient = detectMobileClient();
    if (mobileClient && window.location.pathname === "/") {
      window.history.replaceState({}, "", MOBILE_ROUTE_PATH);
    }
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !token) return;
    let targetPath = getPathForView(view, isMobileRouteActive);
    if (view === "lora" && loraRouteId) {
      targetPath = `${getPathForView("lora", isMobileRouteActive)}/${encodeURIComponent(loraRouteId)}`;
    }
    const currentPath = normalizePathname(window.location.pathname);
    if (currentPath === targetPath) return;
    window.history.pushState({}, "", `${targetPath}${window.location.search}${window.location.hash}`);
  }, [view, isMobileRouteActive, token, loraRouteId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("mobile-route", isMobileRouteActive);
    return () => document.body.classList.remove("mobile-route");
  }, [isMobileRouteActive]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const isPublicLanding = !token;
    const origin = window.location.origin || "https://frameworkx.lenz-service.de";
    const publicUrl = `${origin}/`;
    const publicQuery = new URLSearchParams();
    publicQuery.set("lang", lang);
    if (isPublicLanding && loginSelectedLora?.id) {
      publicQuery.set("lora", loginSelectedLora.id);
    } else if (isPublicLanding && loginSelectedImage?.id) {
      publicQuery.set("image", loginSelectedImage.id);
    }
    const langUrl = `${publicUrl}?${publicQuery.toString()}`;
    const imageSeoTitle = loginSelectedImage
      ? `FrameWorkX Public Image by @${loginSelectedImage.username} | LoRA Gallery`
      : null;
    const loraSeoTitle = loginSelectedLora ? `FrameWorkX Public Model ${loginSelectedLora.name} | LoRA` : null;
    const title = isPublicLanding
      ? loraSeoTitle ?? imageSeoTitle ?? "FrameWorkX | LoRA Training, Image Generation and Public Model Gallery"
      : "FrameWorkX | Console";
    const description = isPublicLanding
      ? "FrameWorkX is an all-in-one LoRA platform to train models, generate images, and publish public models and images with shareable links."
      : "FrameWorkX control console for LoRA training, generation, and gallery workflows.";
    const robots = isPublicLanding ? "index,follow,max-image-preview:large" : "noindex,nofollow";
    const locale = lang === "de" ? "de_DE" : "en_US";
    const socialImage = `${origin}/og-image.svg`;
    document.title = title;
    document.documentElement.setAttribute("lang", lang);

    const upsertMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
      let node = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!node) {
        node = document.createElement("meta");
        node.setAttribute(attr, key);
        node.setAttribute("data-seo-managed", "1");
        document.head.appendChild(node);
      }
      node.setAttribute("content", content);
    };

    const upsertLink = (selector: string, rel: string, href: string, hreflang?: string) => {
      let node = document.head.querySelector(selector) as HTMLLinkElement | null;
      if (!node) {
        node = document.createElement("link");
        node.setAttribute("rel", rel);
        node.setAttribute("data-seo-managed", "1");
        document.head.appendChild(node);
      }
      node.setAttribute("href", href);
      if (hreflang) node.setAttribute("hreflang", hreflang);
      if (!hreflang) node.removeAttribute("hreflang");
    };

    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[name="robots"]', "name", "robots", robots);
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", "FrameWorkX");
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", langUrl);
    upsertMeta('meta[property="og:locale"]', "property", "og:locale", locale);
    upsertMeta('meta[property="og:image"]', "property", "og:image", socialImage);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary");
    upsertMeta('meta[name="twitter:site"]', "name", "twitter:site", "@frameworkx");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", socialImage);

    upsertLink('link[rel="canonical"]', "canonical", langUrl);
    upsertLink('link[rel="alternate"][hreflang="en"]', "alternate", `${publicUrl}?lang=en`, "en");
    upsertLink('link[rel="alternate"][hreflang="de"]', "alternate", `${publicUrl}?lang=de`, "de");
    upsertLink('link[rel="alternate"][hreflang="x-default"]', "alternate", publicUrl, "x-default");

    const jsonLdId = "fx-seo-jsonld";
    let script = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = jsonLdId;
      script.type = "application/ld+json";
      script.setAttribute("data-seo-managed", "1");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "FrameWorkX",
      url: publicUrl,
      inLanguage: ["en", "de"],
      description
    });
  }, [lang, token, loginSelectedImage?.id, loginSelectedImage?.username, loginSelectedLora?.id, loginSelectedLora?.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("fx_lang", lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  useEffect(() => {
    if (token) return;
    setPublicOverviewExpanded(true);
    const timer = window.setTimeout(() => setPublicOverviewExpanded(false), 10_000);
    return () => window.clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined" || token) return;
    if (publicDeepLinkHandledRef.current) return;
    publicDeepLinkHandledRef.current = true;
    let cancelled = false;
    const url = new URL(window.location.href);
    const imageId = (url.searchParams.get("image") ?? "").trim();
    const loraIdFromPath = getLoraRouteIdFromPathname(window.location.pathname);
    const loraId = (url.searchParams.get("lora") ?? loraIdFromPath ?? "").trim();
    if (!imageId && !loraId) return;

    const clearUnknownParams = () => {
      if (cancelled) return;
      const next = new URL(window.location.href);
      if (next.searchParams.get("image")) next.searchParams.delete("image");
      if (next.searchParams.get("lora")) next.searchParams.delete("lora");
      window.history.replaceState({}, "", `${next.pathname}${next.search}${next.hash}`);
    };

    if (loraId) {
      fetch(`/api/loras/public/${encodeURIComponent(loraId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          if (!data?.lora) {
            clearUnknownParams();
            return;
          }
          setLoginSelectedLora(data.lora);
          setLoginSelectedLoraPreview(null);
          setLoginSelectedImage(null);
        })
        .catch(() => clearUnknownParams());
      return () => {
        cancelled = true;
      };
    }

    fetch(`/api/gallery/images/public/${encodeURIComponent(imageId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (!data?.image) {
          clearUnknownParams();
          return;
        }
        setLoginSelectedImage(data.image);
        setLoginSelectedModelLabel(data.model_label ?? "");
        setLoginSelectedLora(null);
        setLoginSelectedLoraPreview(null);
      })
      .catch(() => clearUnknownParams());
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined" || token) return;
    const next = new URL(window.location.href);
    if (lang) next.searchParams.set("lang", lang);
    if (loginSelectedLora?.id) {
      next.searchParams.set("lora", loginSelectedLora.id);
      next.searchParams.delete("image");
    } else if (loginSelectedImage?.id) {
      next.searchParams.set("image", loginSelectedImage.id);
      next.searchParams.delete("lora");
    } else {
      next.searchParams.delete("image");
      next.searchParams.delete("lora");
    }
    const nextHref = `${next.pathname}${next.search}${next.hash}`;
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextHref !== currentHref) {
      window.history.replaceState({}, "", nextHref);
    }
  }, [token, lang, loginSelectedImage?.id, loginSelectedLora?.id]);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch("/api/training/profiles", { headers })
      .then((res) => res.json())
      .then((data) => setTrainProfiles(data.profiles ?? []))
      .catch(() => setTrainProfiles([]));
    fetch("/api/users/me/profile", { headers })
      .then((res) => res.json())
      .then((data) =>
        setProfile({ display_name: data.display_name ?? "", bio: data.bio ?? "", avatar_file_id: data.avatar_file_id ?? null })
      )
      .catch(() => setProfile({ display_name: "", bio: "", avatar_file_id: null }));
    fetch("/api/settings", { headers })
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, any> = {};
        const userMap: Record<string, any> = {};
        (data.global ?? []).forEach((entry: SettingsEntry) => {
          map[entry.key] = entry.value;
        });
        (data.user ?? []).forEach((entry: SettingsEntry) => {
          userMap[entry.key] = entry.value;
        });
        setSettingsMap(map);
        setWildcardLists(parseWildcardSetting(userMap["generation.wildcards"]));
        setWildcardMode(userMap["generation.wildcard_mode"] === "random" ? "random" : "sequential");
        if (Array.isArray(map["generation.samplers"])) {
          setSamplerOptions(map["generation.samplers"]);
          setAdminSamplerSelection(map["generation.samplers"]);
        }
        if (Array.isArray(map["generation.schedulers"])) {
          setSchedulerOptions(map["generation.schedulers"]);
          setAdminSchedulerSelection(map["generation.schedulers"]);
        }
        setAdminCreditCostGenerate(String(map["credits.generate"] ?? "1"));
        setAdminCreditCostTrain(String(map["credits.train"] ?? "5"));
        setCoreSettings({
          capping_fps: String(map["capping_fps"] ?? CORE_DEFAULTS.capping_fps),
          capping_jpeg_quality: String(map["capping_jpeg_quality"] ?? CORE_DEFAULTS.capping_jpeg_quality),
          selection_target_per_character: String(
            map["selection_target_per_character"] ?? CORE_DEFAULTS.selection_target_per_character
          ),
          selection_face_quota: String(map["selection_face_quota"] ?? CORE_DEFAULTS.selection_face_quota),
          selection_hamming_threshold: String(
            map["selection_hamming_threshold"] ?? CORE_DEFAULTS.selection_hamming_threshold
          ),
          selection_hamming_relaxed: String(
            map["selection_hamming_relaxed"] ?? CORE_DEFAULTS.selection_hamming_relaxed
          ),
          autotag_general_threshold: String(
            map["autotag_general_threshold"] ?? CORE_DEFAULTS.autotag_general_threshold
          ),
          autotag_character_threshold: String(
            map["autotag_character_threshold"] ?? CORE_DEFAULTS.autotag_character_threshold
          ),
          autotag_max_tags: String(map["autotag_max_tags"] ?? CORE_DEFAULTS.autotag_max_tags),
          output_max_images: String(map["output_max_images"] ?? CORE_DEFAULTS.output_max_images)
        });
        setAdminArchiveRetentionDays(String(map["archive_retention_days"] ?? 30));
        setHfToken(String(map["hf_token"] ?? ""));
        setTaggerDefault(String(map["autotag_model_id"] ?? CORE_DEFAULTS.autotag_model_id));
        setInstanceLabel(String(map["instance_label"] ?? ""));
        setInstanceUrl(String(map["instance_url"] ?? ""));
        setNotifyEnabled(Boolean(map["notifications_enabled"] ?? false));
        setNotifyChannelEmail(Boolean(map["notify_channel_email"] ?? false));
        setNotifyChannelSlack(Boolean(map["notify_channel_slack"] ?? false));
        setNotifyChannelDiscord(Boolean(map["notify_channel_discord"] ?? false));
        setNotifyChannelWebhook(Boolean(map["notify_channel_webhook"] ?? false));
        setNotifyJobFinish(Boolean(map["notify_job_finish"] ?? false));
        setNotifyJobFailed(Boolean(map["notify_job_failed"] ?? false));
        setNotifyQueueFinish(Boolean(map["notify_queue_finish"] ?? false));
        const smtpPass = typeof map.smtp_pass === "string" ? map.smtp_pass : "";
        setSmtpSettings({
          smtp_host: String(map.smtp_host ?? ""),
          smtp_port: String(map.smtp_port ?? "587"),
          smtp_user: String(map.smtp_user ?? ""),
          smtp_pass: smtpPass,
          smtp_from: String(map.smtp_from ?? ""),
          smtp_base_url: String(map.smtp_base_url ?? ""),
          smtp_ssl: Boolean(map.smtp_ssl ?? false),
          smtp_tls: Boolean(map.smtp_tls ?? false)
        });
        setSmtpTo(String(map.smtp_to ?? ""));
        setSlackWebhookUrl(String(map.slack_webhook_url ?? ""));
        setDiscordWebhookUrl(String(map.discord_webhook_url ?? ""));
        setWebhookUrl(String(map.webhook_url ?? ""));
        setWebhookSecret(String(map.webhook_secret ?? ""));
      })
      .catch(() => setSettingsMap({}));
    fetch("/api/notifications/settings", { headers })
      .then((res) => res.json())
      .then((data) => {
        setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...(data.settings ?? {}) });
      })
      .catch(() => setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS));
    fetch("/api/notifications?limit=40", { headers })
      .then((res) => res.json())
      .then((data) => {
        setNotificationList(data.notifications ?? []);
        setNotificationUnread(Number(data.unread_count ?? 0));
      })
      .catch(() => {
        setNotificationList([]);
        setNotificationUnread(0);
      });
    fetch("/api/auth/2fa/status", { headers })
      .then((res) => res.json())
      .then((data) => setTwoFaStatus({ ...DEFAULT_2FA_STATUS, ...(data ?? {}) }))
      .catch(() => setTwoFaStatus(DEFAULT_2FA_STATUS));
    fetch("/api/models/registry", { headers })
      .then((res) => res.json())
      .then((data) => setModelRegistry(data.models ?? []))
      .catch(() => setModelRegistry([]));
    fetch("/api/uploads/staged", { headers })
      .then((res) => res.json())
      .then((data) => setStagedUploads(data.uploads ?? []))
      .catch(() => setStagedUploads([]));
    fetch("/api/dm/threads", { headers })
      .then((res) => res.json())
      .then((data) => {
        const list = (data.threads ?? []) as DMThread[];
        setDmThreads(list);
        setDmActiveThreadId((prev) => prev || list[0]?.id || "");
      })
      .catch(() => setDmThreads([]));
    fetch("/api/dm/unread-count", { headers })
      .then((res) => res.json())
      .then((data) => setDmUnreadCount(Number(data.unread_count ?? 0)))
      .catch(() => setDmUnreadCount(0));
    fetch("/api/dm/blocks", { headers })
      .then((res) => res.json())
      .then((data) => setDmBlocks((data.blocks ?? []) as DMBlock[]))
      .catch(() => setDmBlocks([]));
    fetch("/api/autochar/presets", { headers })
      .then((res) => res.json())
      .then((data) => setAutocharPresets(data.presets ?? []))
      .catch(() => setAutocharPresets([]));
    if (isAdmin) {
      setAdminUsers([]);
      setAdminUserSelectedId("");
      fetch("/api/admin/applications", { headers })
        .then((res) => res.json())
        .then((data) => setAdminApplications(data.applications ?? []))
        .catch(() => setAdminApplications([]));
      fetch("/api/admin/tagger/models", { headers })
        .then((res) => res.json())
        .then((data) => setTaggerModels(data.models ?? []))
        .catch(() => setTaggerModels([]));
      fetch("/api/admin/queue/status", { headers })
        .then((res) => res.json())
        .then((data) =>
          setQueueStatus({
            queue_paused: Boolean(data.queue_paused ?? false),
            active_pipeline_id: data.active_pipeline_id ?? "",
            active_generation_id: data.active_generation_id ?? "",
            active_training_id: data.active_training_id ?? ""
          })
        )
        .catch(() =>
          setQueueStatus({
            queue_paused: false,
            active_pipeline_id: "",
            active_generation_id: "",
            active_training_id: ""
          })
        );
    } else {
      setAdminUsers([]);
      setAdminApplications([]);
      setTaggerModels([]);
    }
    fetch("/api/gallery/models", { headers })
      .then((res) => res.json())
      .then((data) => setGalleryModels(data.models ?? []))
      .catch(() => setGalleryModels([]));
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    if (adminTab !== "archives") return;
    refreshAdminArchives();
    refreshArchiveRetentionDays();
  }, [adminTab, token, isAdmin, adminArchiveQuery, adminArchiveUser]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    if (adminTab !== "credits") return;
    refreshAdminCreditLedger().catch(() => null);
  }, [token, isAdmin, adminTab, adminLedgerPage, adminLedgerPageSize]);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const poll = () => {
      fetch("/api/queue", { headers })
        .then((res) => res.json())
        .then((data) => setQueue(data.queue ?? []))
        .catch(() => setQueue([]));
      fetch("/api/generation/jobs", { headers })
        .then((res) => res.json())
        .then((data) => setJobs(data.jobs ?? []))
        .catch(() => setJobs([]));
      fetch("/api/training/runs", { headers })
        .then((res) => res.json())
        .then((data) => setTrainingRuns(data.runs ?? []))
        .catch(() => setTrainingRuns([]));
      fetch("/api/runs", { headers })
        .then((res) => res.json())
        .then((data) => setPipelineRuns(data.runs ?? []))
        .catch(() => setPipelineRuns([]));
      fetch("/api/users/me", { headers })
        .then((res) => res.json())
        .then((data) => setUser(data ?? null))
        .catch(() => setUser(null));
    };
    poll();
    const interval = window.setInterval(poll, 3000);
    return () => window.clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token || view !== "lora") return;
    refreshLoraEntries();
    const interval = window.setInterval(() => {
      refreshLoraEntries();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [token, view, loraMode]);

  useEffect(() => {
    if (!token || !selectedRunId) {
      setSelectedRun(null);
      setSelectedRunSteps([]);
      setSelectedRunEvents([]);
      setSelectedRunPreviews([]);
      setSelectedTrainingPreviews([]);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    let cancelled = false;
    const poll = () => {
      fetch(`/api/runs/${selectedRunId}`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setSelectedRun(data.run ?? null);
          setSelectedRunSteps(data.steps ?? []);
          setSelectedRunEvents(data.events ?? []);
          setSelectedRunPreviews(data.previews ?? []);
          setSelectedTrainingPreviews(data.training_previews ?? []);
        })
        .catch(() => {
          if (cancelled) return;
          setSelectedRun(null);
          setSelectedRunSteps([]);
          setSelectedRunEvents([]);
          setSelectedRunPreviews([]);
          setSelectedTrainingPreviews([]);
        });
    };
    poll();
    const interval = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [selectedRunId, token]);

  useEffect(() => {
    const query = manualSearch.trim().toLowerCase();
    const normalizeTag = (tag: string) => tag.trim().toLowerCase();
    const parseCaptionTags = (caption?: string) =>
      caption
        ? caption
            .split(",")
            .map((tag) => normalizeTag(tag))
            .filter(Boolean)
        : [];
    const normalizedFilter = manualFilterTags.map((tag) => normalizeTag(tag)).filter(Boolean);
    const filtered = manualImages.filter((img) => {
      if (manualFaceOnly && !img.isFace) return false;
      const hay = `${img.name} ${img.caption || ""}`.toLowerCase();
      const matchesQuery = !query || hay.includes(query);
      if (!matchesQuery) return false;
      if (!normalizedFilter.length) return true;
      const tags = parseCaptionTags(img.caption);
      if (!tags.length) return false;
      if (manualTagMatch === "all") {
        return normalizedFilter.every((tag) => tags.includes(tag));
      }
      return normalizedFilter.some((tag) => tags.includes(tag));
    });
    setManualFiltered(filtered);
    setManualPage(1);
  }, [manualImages, manualSearch, manualFaceOnly, manualFilterTags, manualTagMatch]);

  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    let timeout: number | undefined;
    const headers = { Authorization: `Bearer ${token}` };
    const retryLoad = () => {
      fetch("/api/users/me", { headers })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data?.role) {
            setUser(data);
            return;
          }
          timeout = window.setTimeout(retryLoad, 3000);
        })
        .catch(() => {
          if (cancelled) return;
          timeout = window.setTimeout(retryLoad, 3000);
        });
    };
    retryLoad();
    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [token, user]);

  useEffect(() => {
    if (user?.must_change_password) {
      setPasswordOpen(true);
    }
  }, [user?.must_change_password]);

  useEffect(() => {
    if (!runConfig.manualTagging) return;
    setRunConfig((prev) => ({
      ...prev,
      autotag: true,
      autochar: false
    }));
  }, [runConfig.manualTagging]);

  useEffect(() => {
    const baseModels = modelRegistry.filter((model) => model.kind === "training_model" || model.kind === "base_model");
    if (!baseModels.length) return;
    const stored = getLastModelId();
    const storedValid = stored && baseModels.some((model) => model.file_id === stored);
    if (!modelId) {
      if (storedValid) {
        setModelId(stored);
      } else {
        setModelId(baseModels[0].file_id ?? "");
      }
      return;
    }
    const currentValid = baseModels.some((model) => model.file_id === modelId);
    if (!currentValid) {
      setModelId(storedValid ? stored : baseModels[0].file_id ?? "");
    }
  }, [modelRegistry, modelId]);

  useEffect(() => {
    if (!trainProfiles.length) return;
    if (runConfig.trainProfile) return;
    const fallback = trainProfiles.find((profile) => profile.is_default) ?? trainProfiles[0];
    if (fallback) {
      setRunConfig((prev) => ({ ...prev, trainProfile: fallback.name }));
    }
  }, [trainProfiles, runConfig.trainProfile]);

  useEffect(() => {
    setGeneratorSettings({
      sampler,
      scheduler,
      ratio,
      steps,
      cfgScale,
      batchCount,
      seed,
      isPublic
    });
  }, [sampler, scheduler, ratio, steps, cfgScale, batchCount, seed, isPublic]);

  const manualVisible = manualFiltered.slice(0, manualPage * 48);
  const manualTagsVisible = manualTagFilter.trim()
    ? manualTags.filter((tag) => tag.tag.toLowerCase().includes(manualTagFilter.trim().toLowerCase()))
    : manualTags;

  const prepStepSet = new Set([
    "unzip",
    "rename",
    "cap",
    "merge_inputs",
    "select",
    "cropflip",
    "autotag",
    "manual_pause",
    "manual_edit",
    "manual_done",
    "autochar",
    "package_dataset"
  ]);
  const filterPhaseSteps = (steps: any[], kind: "pipeline" | "training", phase: "prep" | "train_pre" | "train" | "finishing") => {
    if (kind === "pipeline") {
      return steps.filter((step) => prepStepSet.has(step.step));
    }
    const target =
      phase === "train_pre" ? "train_pre" : phase === "train" ? "train_phase" : "finishing";
    return steps.filter((step) => step.step === target);
  };

  const resolveDashboardModalStatus = () => {
    if (dashboardModalData?.status_live) return String(dashboardModalData.status_live);
    if (dashboardModalData?.status) return String(dashboardModalData.status);
    const running = dashboardModalSteps.find((step) => step.status === "running");
    if (running) return `running (${running.step})`;
    const failed = dashboardModalSteps.find((step) => step.status === "failed");
    if (failed) return `failed (${failed.step})`;
    const last = dashboardModalSteps[dashboardModalSteps.length - 1];
    if (last?.status) return String(last.status);
    return "-";
  };

  const formatEta = (value?: number | null) => {
    if (!Number.isFinite(Number(value))) return "-";
    const seconds = Math.max(0, Math.round(Number(value)));
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    if (minutes > 0) return `${minutes}m ${rest}s`;
    return `${rest}s`;
  };

  const normalizeTriggerName = (value: string) => value.trim().toLowerCase();
  const isValidTriggerName = (value: string) => /^[a-z0-9_-]+$/.test(value);

  const deriveZipTrigger = (name: string) => {
    const base = name.replace(/\.zip$/i, "").trim();
    return normalizeTriggerName(base);
  };

  const existingTriggerSet = useMemo(() => {
    const set = new Set<string>();
    for (const run of pipelineRuns) {
      if (run.name) set.add(String(run.name).toLowerCase());
    }
    for (const run of trainingRuns as any[]) {
      if (run?.name) set.add(String(run.name).toLowerCase());
    }
    return set;
  }, [pipelineRuns, trainingRuns]);

  const batchTriggerInfo = useMemo(() => {
    return stagedUploads.map((upload) => {
      const base = upload.name.replace(/\.zip$/i, "").trim();
      const normalized = normalizeTriggerName(base);
      const valid = base.length > 0 && isValidTriggerName(normalized);
      return {
        id: upload.id,
        name: upload.name,
        base,
        normalized,
        valid,
        duplicateExisting: existingTriggerSet.has(normalized)
      };
    });
  }, [stagedUploads, existingTriggerSet]);

  const wizardMaxBatch = 10;

  const openTrainerWizard = () => {
    setTrainerWizardOpen(true);
    setTrainerWizardMode(null);
    setTrainerWizardStep(0);
    setTrainerName("");
    setTrainerDescription("");
    setTrainerNotes("");
    setTrainerConfirmDuplicates(false);
    setTrainerWizardError("");
    setTrainerUseDefaults(true);
    setRunConfig((prev) => ({ ...prev, train: true, samplePrompts: [...DEFAULT_SAMPLE_PROMPTS] }));
  };

  const closeTrainerWizard = (options?: { clearStaged?: boolean }) => {
    setTrainerWizardOpen(false);
    setTrainerWizardMode(null);
    setTrainerWizardStep(0);
    setTrainerWizardError("");
    setTrainerConfirmDuplicates(false);
    setTrainerDuplicateConfirmOpen(false);
    if ((options?.clearStaged ?? true) && stagedUploads.length) {
      stagedUploads.forEach((upload) => removeStaged(upload.id));
    }
  };

  const selectTrainerMode = (mode: "single" | "batch") => {
    setTrainerWizardMode(mode);
    setTrainerWizardStep(1);
    setTrainerWizardError("");
    setTrainerConfirmDuplicates(false);
  };

  const goWizardBack = () => {
    setTrainerWizardStep((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        setTrainerWizardMode(null);
      }
      return next;
    });
  };

  const goWizardNext = () => {
    setTrainerWizardStep((prev) => Math.min(wizardSteps.length - 1, prev + 1));
  };

  const wizardCanContinue = () => {
    if (!trainerWizardMode) return false;
    if (trainerWizardMode === "single") {
      if (trainerWizardStep === 1) return singleNameValid;
      if (trainerWizardStep === 2) return stagedUploads.length === 1;
    }
    if (trainerWizardMode === "batch") {
      if (trainerWizardStep === 1)
        return (
          stagedUploads.length > 0 &&
          !batchLimitExceeded &&
          batchInvalid.length === 0 &&
          batchDuplicatesInternal.length === 0
        );
    }
    return true;
  };

  const submitWizardTraining = (options?: { forceDuplicateConfirm?: boolean }) => {
    if (!wizardSubmitReadyBase) return;
    if (duplicateWarning && !(trainerConfirmDuplicates || options?.forceDuplicateConfirm)) {
      setTrainerDuplicateConfirmOpen(true);
      return;
    }
    if (trainerWizardMode === "single") {
      commitUploads({
        name: normalizedSingleName,
        description: trainerDescription,
        note: trainerNotes
      });
    } else {
      commitUploads();
    }
    closeTrainerWizard({ clearStaged: false });
  };

  const wizardSteps =
    trainerWizardMode === "single"
      ? ["Mode", "Name", "Upload", "Training", "Tagging", "Prompts", "Review"]
      : trainerWizardMode === "batch"
        ? ["Mode", "Upload", "Training", "Tagging", "Prompts", "Review"]
        : ["Mode"];
  const wizardStepLabel = wizardSteps[trainerWizardStep] ?? "Mode";
  const normalizedSingleName = normalizeTriggerName(trainerName);
  const singleNameLengthValid = normalizedSingleName.length >= 3 && normalizedSingleName.length <= 64;
  const singleNameValid =
    trainerName.trim().length > 0 &&
    !/\s/.test(trainerName) &&
    isValidTriggerName(normalizedSingleName) &&
    singleNameLengthValid;
  const singleTriggerDuplicate = Boolean(normalizedSingleName) && existingTriggerSet.has(normalizedSingleName);
  const batchInvalid = batchTriggerInfo.filter((info) => !info.valid);
  const batchDuplicatesExisting = batchTriggerInfo.filter((info) => info.duplicateExisting);
  const batchTriggers = batchTriggerInfo.map((info) => info.normalized);
  const batchDuplicatesInternal = batchTriggers.filter(
    (name, idx) => name && batchTriggers.indexOf(name) !== idx
  );
  const stagedVideoCount = stagedUploads.reduce((sum, upload) => sum + Number(upload.video_count ?? 0), 0);
  const stagedContainsVideos = stagedVideoCount > 0 || stagedUploads.some((upload) => Boolean(upload.contains_videos));
  const trainCost = Number(settingsMap["credits.train"] ?? 5) || 5;
  const batchUploadCount = stagedUploads.length;
  const batchLimitExceeded = batchUploadCount > wizardMaxBatch;
  const duplicateWarning =
    trainerWizardMode === "single"
      ? singleTriggerDuplicate
      : trainerWizardMode === "batch"
        ? batchDuplicatesExisting.length > 0
        : false;
  const duplicateWarningNames =
    trainerWizardMode === "single"
      ? singleTriggerDuplicate
        ? [normalizedSingleName]
        : []
      : batchDuplicatesExisting.map((info) => info.normalized);
  const batchInvalidNames = batchInvalid.map((info) => info.name);
  const batchInternalDuplicates = Array.from(new Set(batchDuplicatesInternal));
  const creditsPerRun = runConfig.train ? trainCost : 0;
  const creditsTotal = trainerWizardMode === "batch" ? creditsPerRun * Math.max(batchUploadCount, 0) : creditsPerRun;
  const wizardSubmitReadyBase =
    trainerWizardMode === "single"
      ? singleNameValid && stagedUploads.length === 1
      : trainerWizardMode === "batch"
        ? stagedUploads.length > 0 &&
          !batchLimitExceeded &&
          batchInvalid.length === 0 &&
          batchDuplicatesInternal.length === 0
        : false;
  const wizardSubmitReady = wizardSubmitReadyBase && (!duplicateWarning || trainerConfirmDuplicates);

  const prepPhaseRuns = useMemo(
    () =>
      dashboardPipeline.filter((run) =>
        ["queued", "queued_initiated", "running", "manual_tagging", "failed"].includes(String(run.status ?? ""))
      ),
    [dashboardPipeline]
  );
  const trainPrePhaseRuns = useMemo(() => {
    const trainingPhase = dashboardTraining.filter((run) => {
      if (["removing", "remove_failed"].includes(String(run.status ?? ""))) return false;
      const steps = run.steps ?? {};
      const inTrainPhase = ["running", "failed"].includes(String(steps.train_phase ?? ""));
      const inFinishing = ["running", "pending", "failed"].includes(String(steps.finishing ?? ""));
      return !inTrainPhase && !inFinishing && run.status !== "completed";
    });
    const waitingPipeline = dashboardPipeline.filter(
      (run) =>
        run.status === "ready_to_train" && !dashboardTraining.some((training) => training.pipeline_run_id === run.id)
    );
    return [
      ...trainingPhase,
      ...waitingPipeline.map((run) => ({
        id: run.id,
        name: run.name,
        status: "ready_to_train",
        pipeline_run_id: run.id,
        image_count: run.image_count,
        steps: {}
      }))
    ];
  }, [dashboardTraining, dashboardPipeline]);
  const trainPhaseRuns = useMemo(
    () =>
      dashboardTraining.filter((run) => {
        if (["removing", "remove_failed"].includes(String(run.status ?? ""))) return false;
        const steps = run.steps ?? {};
        return (
          ["running", "failed"].includes(String(steps.train_phase ?? "")) ||
          (run.status === "running" && !steps.train_pre) ||
          (run.status === "failed" && steps.train_pre === "done" && !steps.finishing)
        );
      }),
    [dashboardTraining]
  );
  const finishingPhaseRuns = useMemo(
    () =>
      dashboardTraining.filter((run) => {
        if (["removing", "remove_failed"].includes(String(run.status ?? ""))) return false;
        const steps = run.steps ?? {};
        return ["running", "failed"].includes(String(steps.finishing ?? "")) || (run.status === "completed" && steps.finishing);
      }),
    [dashboardTraining]
  );
  const mobileDashboardJobs = useMemo(() => {
    const rows: Array<{
      id: string;
      name: string;
      kind: "pipeline" | "training";
      phase: "prep" | "train_pre" | "train" | "finishing";
      status: string;
      meta: string[];
      progressPct: number | null;
    }> = [];
    for (const run of dashboardTraining) {
      const steps = run.steps ?? {};
      const phase: "train_pre" | "train" | "finishing" =
        steps.finishing === "running" || steps.finishing === "failed" || run.status === "completed"
          ? "finishing"
          : steps.train_phase === "running" || steps.train_phase === "failed" || run.status === "running"
            ? "train"
            : "train_pre";
      const progress = typeof run.progress_pct === "number" ? Math.max(0, Math.min(100, run.progress_pct)) : null;
      rows.push({
        id: run.id,
        name: run.name ?? run.id,
        kind: "training",
        phase,
        status: String(run.status ?? ""),
        meta: [
          run.image_count != null ? `${run.image_count} imgs` : "",
          run.eta_seconds != null ? `ETA ${run.eta_seconds}s` : "",
          run.last_loss != null ? `loss ${Number(run.last_loss).toFixed(4)}` : ""
        ].filter(Boolean),
        progressPct: progress
      });
    }
    for (const run of dashboardPipeline) {
      if (rows.some((item) => item.id === run.id)) continue;
      const progress = typeof run.progress_pct === "number" ? Math.max(0, Math.min(100, run.progress_pct)) : null;
      rows.push({
        id: run.id,
        name: run.name ?? run.id,
        kind: "pipeline",
        phase: "prep",
        status: String(run.status ?? ""),
        meta: [
          run.image_count != null ? `${run.image_count} imgs` : "",
          run.eta_seconds != null ? `ETA ${run.eta_seconds}s` : "",
          run.last_step ? run.last_step : ""
        ].filter(Boolean),
        progressPct: progress
      });
    }
    const rank = (status: string) => {
      if (status === "running") return 0;
      if (status === "queued" || status === "queued_initiated" || status === "manual_tagging" || status === "ready_to_train") {
        return 1;
      }
      if (status === "failed") return 2;
      return 3;
    };
    const visibleRows = rows.filter((row) => {
      if (mobileShowCompletedJobs) return true;
      return !["completed", "cancelled", "stopped"].includes(row.status);
    });
    return visibleRows.sort((a, b) => rank(a.status) - rank(b.status));
  }, [dashboardTraining, dashboardPipeline, mobileShowCompletedJobs]);
  const mobileCompletedJobsCount = useMemo(() => {
    const allRows = [
      ...dashboardTraining.map((run) => String(run.status ?? "")),
      ...dashboardPipeline.map((run) => String(run.status ?? ""))
    ];
    return allRows.filter((status) => ["completed", "cancelled", "stopped"].includes(status)).length;
  }, [dashboardTraining, dashboardPipeline]);

  const openDashboardModal = (kind: "pipeline" | "training", id: string, phase: "prep" | "train_pre" | "train" | "finishing") => {
    if (!token) return;
    setDashboardModalOpen(true);
    setDashboardModalKind(kind);
    setDashboardModalPhase(phase);
    setDashboardModalId(id);
    setDashboardModalData(null);
    setDashboardModalSteps([]);
    setDashboardModalImageCount(null);
    setDashboardModalEvents([]);
    setDashboardModalPreviews([]);
    setDashboardModalTrainingPreviews([]);
    setDashboardDatasetCoverUrl(null);
    setDashboardDatasetCoverFileId(null);
    setDashboardModalLastUpdated(null);
    const headers = { Authorization: `Bearer ${token}` };
    if (kind === "pipeline") {
      fetch(`/api/runs/${id}`, { headers })
        .then((res) => res.json())
        .then((data) => {
          setDashboardModalData(data.run ?? null);
          const steps = filterPhaseSteps(data.steps ?? [], "pipeline", phase);
          setDashboardModalSteps(steps);
          setDashboardModalImageCount(data.run?.image_count ?? null);
          setDashboardModalEvents(data.events ?? []);
          setDashboardModalPreviews(Array.isArray(data.previews) ? data.previews.map((row: any) => String(row.file_id)).filter(Boolean) : []);
          setDashboardModalTrainingPreviews(
            Array.isArray(data.training_previews)
              ? data.training_previews
                  .map((row: any) => ({
                    file_id: String(row?.file_id ?? "").trim(),
                    epoch: row?.epoch != null ? Number(row.epoch) : null
                  }))
                  .filter((row: DashboardTrainingPreview) => Boolean(row.file_id))
              : []
          );
          setDashboardDatasetCoverUrl(data.dataset_cover_url ? String(data.dataset_cover_url) : null);
          setDashboardDatasetCoverFileId(data.dataset_cover_file_id ? String(data.dataset_cover_file_id) : null);
          setDashboardModalLastUpdated(Date.now());
        })
        .catch(() => null);
    } else {
      fetch(`/api/training/runs/${id}/details`, { headers })
        .then((res) => res.json())
        .then((data) => {
          const steps = data.steps ?? [];
          const stepMap = steps.reduce((acc: Record<string, string>, row: any) => {
            acc[String(row.step)] = String(row.status ?? "");
            return acc;
          }, {});
          const nextPhase =
            stepMap.finishing === "running" || stepMap.finishing === "done" || data.run?.status === "completed"
              ? "finishing"
              : stepMap.train_phase === "running" || stepMap.train_phase === "done" || data.run?.status === "running"
                ? "train"
                : stepMap.train_pre === "running" || stepMap.train_pre === "done"
                  ? "train_pre"
                  : "prep";
          setDashboardModalData(data.run ?? null);
          setDashboardModalSteps(filterPhaseSteps(steps, "training", nextPhase));
          setDashboardModalImageCount(data.image_count ?? null);
          setDashboardModalEvents([]);
          setDashboardModalPreviews([]);
          setDashboardModalTrainingPreviews(
            Array.isArray(data.training_previews)
              ? data.training_previews
                  .map((row: any) => ({
                    file_id: String(row?.file_id ?? "").trim(),
                    epoch: row?.epoch != null ? Number(row.epoch) : null
                  }))
                  .filter((row: DashboardTrainingPreview) => Boolean(row.file_id))
              : []
          );
          setDashboardDatasetCoverUrl(data.dataset_cover_url ? String(data.dataset_cover_url) : null);
          setDashboardDatasetCoverFileId(data.dataset_cover_file_id ? String(data.dataset_cover_file_id) : null);
          setDashboardModalLastUpdated(Date.now());
          if (nextPhase !== phase) {
            setDashboardModalPhase(nextPhase);
          }
        })
        .catch(() => null);
    }
  };
  useEffect(() => {
    if (!isMobileRouteActive || !mobileMenuOpen) return;
    setMobileMenuOpen(false);
  }, [view, isMobileRouteActive, mobileMenuOpen]);

  useEffect(() => {
    if (!dashboardModalOpen || !dashboardModalId || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const refresh = () => {
      if (dashboardModalKind === "pipeline") {
        fetch(`/api/runs/${dashboardModalId}`, { headers })
          .then((res) => res.json())
          .then((data) => {
            setDashboardModalData(data.run ?? null);
            const steps = filterPhaseSteps(data.steps ?? [], "pipeline", dashboardModalPhase);
            setDashboardModalSteps(steps);
            setDashboardModalImageCount(data.run?.image_count ?? null);
            setDashboardModalPreviews(
              Array.isArray(data.previews) ? data.previews.map((row: any) => String(row.file_id)).filter(Boolean) : []
            );
            setDashboardModalTrainingPreviews(
              Array.isArray(data.training_previews)
                ? data.training_previews
                    .map((row: any) => ({
                      file_id: String(row?.file_id ?? "").trim(),
                      epoch: row?.epoch != null ? Number(row.epoch) : null
                    }))
                    .filter((row: DashboardTrainingPreview) => Boolean(row.file_id))
                : []
            );
            setDashboardDatasetCoverUrl(data.dataset_cover_url ? String(data.dataset_cover_url) : null);
            setDashboardDatasetCoverFileId(data.dataset_cover_file_id ? String(data.dataset_cover_file_id) : null);
            setDashboardModalLastUpdated(Date.now());
          })
          .catch(() => null);
      } else {
        fetch(`/api/training/runs/${dashboardModalId}/details`, { headers })
          .then((res) => res.json())
          .then((data) => {
            const steps = data.steps ?? [];
            const stepMap = steps.reduce((acc: Record<string, string>, row: any) => {
              acc[String(row.step)] = String(row.status ?? "");
              return acc;
            }, {});
            const nextPhase =
              stepMap.finishing === "running" || stepMap.finishing === "done" || data.run?.status === "completed"
                ? "finishing"
                : stepMap.train_phase === "running" || stepMap.train_phase === "done" || data.run?.status === "running"
                  ? "train"
                  : stepMap.train_pre === "running" || stepMap.train_pre === "done"
                    ? "train_pre"
                    : "prep";
            setDashboardModalData(data.run ?? null);
            setDashboardModalSteps(filterPhaseSteps(steps, "training", nextPhase));
            setDashboardModalImageCount(data.image_count ?? null);
            setDashboardModalPreviews([]);
            setDashboardModalTrainingPreviews(
              Array.isArray(data.training_previews)
                ? data.training_previews
                    .map((row: any) => ({
                      file_id: String(row?.file_id ?? "").trim(),
                      epoch: row?.epoch != null ? Number(row.epoch) : null
                    }))
                    .filter((row: DashboardTrainingPreview) => Boolean(row.file_id))
                : []
            );
            setDashboardDatasetCoverUrl(data.dataset_cover_url ? String(data.dataset_cover_url) : null);
            setDashboardDatasetCoverFileId(data.dataset_cover_file_id ? String(data.dataset_cover_file_id) : null);
            setDashboardModalLastUpdated(Date.now());
            if (nextPhase !== dashboardModalPhase) {
              setDashboardModalPhase(nextPhase);
            }
          })
          .catch(() => null);
      }
    };
    refresh();
    const intervalMs = dashboardModalKind === "training" ? 1000 : 2000;
    const interval = window.setInterval(refresh, intervalMs);
    return () => window.clearInterval(interval);
  }, [dashboardModalOpen, dashboardModalId, dashboardModalKind, dashboardModalPhase, token]);

  useEffect(() => {
    if (!token || view !== "generator") return;
    fetch("/api/styles")
      .then((res) => res.json())
      .then((data) => setStyleOptions(data.styles ?? []))
      .catch(() => setStyleOptions([]));
    const headers = { Authorization: `Bearer ${token}` };
    const interval = window.setInterval(() => {
      fetch("/api/generation/jobs", { headers })
        .then((res) => res.json())
        .then((data) => {
          const list = data.jobs ?? [];
          setJobs(list);
          if (activeGenerationId) {
            const current = list.find((job: Job) => job.id === activeGenerationId);
            if (current) {
              setActiveGenerationProgress(
                typeof current.progress_pct === "number" ? current.progress_pct : null
              );
              setActiveGenerationEta(typeof current.eta_seconds === "number" ? current.eta_seconds : null);
              if (current.status === "completed") {
                fetch(`/api/generation/jobs/${activeGenerationId}/outputs`, { headers })
                  .then((res) => res.json())
                  .then((outputs) => setGeneratedOutputs(outputs.outputs ?? []))
                  .catch(() => null);
              }
            }
          }
        })
        .catch(() => null);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [token, view, activeGenerationId]);

  useEffect(() => {
    if (!token || manualImages.length === 0) return;
    setManualImages((prev) =>
      prev.map((img) => ({
        ...img,
        url: withToken(img.url, token)
      }))
    );
  }, [token]);

  useEffect(() => {
    if (!token || (view !== "dashboard" && view !== "pipeline")) return;
    if (view !== "dashboard") {
      refreshPipelineRuns();
      const interval = window.setInterval(() => {
        refreshPipelineRuns();
      }, 3000);
      return () => window.clearInterval(interval);
    }
    const poll = () => refreshDashboardOverview();
    poll();
    const interval = window.setInterval(poll, 3000);
    return () => window.clearInterval(interval);
  }, [token, view]);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const poll = () => {
      fetch("/api/notifications?limit=20", { headers })
        .then((res) => res.json())
        .then((data) => {
          setNotificationList(data.notifications ?? []);
          const nextUnread = Number(data.unread_count ?? 0);
          setNotificationUnread((prev) => {
            if (nextUnread > prev) {
              setNotificationPulse(true);
            }
            return nextUnread;
          });
        })
        .catch(() => null);
    };
    poll();
    const interval = window.setInterval(poll, 15000);
    return () => window.clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!notificationPulse) return;
    const timeout = window.setTimeout(() => setNotificationPulse(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [notificationPulse]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (userMenuRef.current && userMenuRef.current.contains(target)) return;
      setUserMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [userMenuOpen]);

  useEffect(() => {
    if (view === "generator") return;
    setGeneratedOutputs([]);
    setActiveGenerationId(null);
    setActiveGenerationProgress(null);
    setActiveGenerationEta(null);
    setGenerateMessage("");
    setGeneratorShowAllOutputs(false);
    setGeneratorAdvancedOpen(false);
    setSelectedLoraId("");
    setSelectedLoraWeight(0.75);
    setSelectedLoraName("");
  }, [view]);

  useEffect(() => {
    if (!token || !dmActiveThreadId) {
      setDmMessages([]);
      return;
    }
    refreshDmMessages(dmActiveThreadId);
  }, [token, dmActiveThreadId]);

  useEffect(() => {
    if (!token || !miniDmThreadId) return;
    if (miniDmThreadId !== dmActiveThreadId) {
      setDmActiveThreadId(miniDmThreadId);
      return;
    }
    if (miniDmOpen && miniDmMode === "chat") {
      refreshDmMessages(miniDmThreadId, { incremental: true });
    }
  }, [token, miniDmThreadId, miniDmOpen, miniDmMode, dmActiveThreadId]);

  useEffect(() => {
    dmMessagesRef.current = dmMessages;
  }, [dmMessages]);

  useEffect(() => {
    if (!token || view !== "settings" || settingsTab !== "security") return;
    refreshTwoFaStatus();
  }, [token, view, settingsTab]);

  useEffect(() => {
    if (!token) return;
    const interval = window.setInterval(() => {
      refreshDmUnread();
      if (view === "messages" || view === "profile" || miniDmOpen) {
        refreshDmThreads();
        refreshDmBlocks();
        const threadForIncremental = miniDmOpen && miniDmThreadId ? miniDmThreadId : dmActiveThreadId;
        if (threadForIncremental) {
          refreshDmMessages(threadForIncremental, { incremental: true });
        }
      }
    }, 6000);
    return () => window.clearInterval(interval);
  }, [token, view, dmActiveThreadId, miniDmOpen, miniDmThreadId]);

  useEffect(() => {
    if (!token || view !== "gallery") return;
    const headers = { Authorization: `Bearer ${token}` };
    const endpoint = galleryMode === "private" ? "/api/gallery/private" : "/api/gallery/public";
    fetch(endpoint, { headers })
      .then((res) => res.json())
      .then((data) => setGalleryImages(data.images ?? []))
      .catch(() => setGalleryImages([]));
  }, [token, view, galleryMode]);

  useEffect(() => {
    if (!token) return;
    try {
      const raw = sessionStorage.getItem("fx_mini_dm_state");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.open === "boolean") setMiniDmOpen(parsed.open);
      if (parsed?.mode === "threads" || parsed?.mode === "chat") setMiniDmMode(parsed.mode);
      if (typeof parsed?.threadId === "string") setMiniDmThreadId(parsed.threadId);
    } catch {
      // ignore bad session state
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    try {
      sessionStorage.setItem(
        "fx_mini_dm_state",
        JSON.stringify({ open: miniDmOpen, mode: miniDmMode, threadId: miniDmThreadId })
      );
    } catch {
      // ignore storage errors
    }
  }, [token, miniDmOpen, miniDmMode, miniDmThreadId]);

  useEffect(() => {
    if (!miniDmOpen || miniDmMode !== "chat") {
      setMiniDmEmojiOpen(false);
    }
  }, [miniDmOpen, miniDmMode]);

  useEffect(() => {
    if (!galleryBulkMode) return;
    setGalleryBulkSelection((prev) => {
      const allowed = new Set(galleryImages.filter((img) => canManageGalleryImage(img)).map((img) => img.id));
      return prev.filter((id) => allowed.has(id));
    });
  }, [galleryBulkMode, galleryImages]);

  useEffect(() => {
    setGalleryBulkMode(false);
    setGalleryBulkSelection([]);
    setGalleryBulkMessage("");
  }, [galleryMode]);

  useEffect(() => {
    setSelectedLoraPreviewOriginalReady(false);
  }, [selectedLoraPreview]);

  useEffect(() => {
    setLoginSelectedLoraPreviewOriginalReady(false);
  }, [loginSelectedLoraPreview]);

  useEffect(() => {
    const hasSelected = Boolean(selectedLoraPreview && selectedLoraPreviewIds.length > 1);
    const hasLogin = Boolean(loginSelectedLoraPreview && loginSelectedLoraPreviewIds.length > 1);
    const hasAny = Boolean(selectedLoraPreview || loginSelectedLoraPreview);
    if (!hasAny) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedLoraPreview(null);
        setLoginSelectedLoraPreview(null);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (hasSelected && selectedLoraPreview) {
          const idx = selectedLoraPreviewIds.indexOf(selectedLoraPreview);
          if (idx >= 0) {
            setSelectedLoraPreview(selectedLoraPreviewIds[(idx + 1) % selectedLoraPreviewIds.length]);
          }
          return;
        }
        if (hasLogin && loginSelectedLoraPreview) {
          const idx = loginSelectedLoraPreviewIds.indexOf(loginSelectedLoraPreview);
          if (idx >= 0) {
            setLoginSelectedLoraPreview(loginSelectedLoraPreviewIds[(idx + 1) % loginSelectedLoraPreviewIds.length]);
          }
        }
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (hasSelected && selectedLoraPreview) {
          const idx = selectedLoraPreviewIds.indexOf(selectedLoraPreview);
          if (idx >= 0) {
            setSelectedLoraPreview(
              selectedLoraPreviewIds[(idx - 1 + selectedLoraPreviewIds.length) % selectedLoraPreviewIds.length]
            );
          }
          return;
        }
        if (hasLogin && loginSelectedLoraPreview) {
          const idx = loginSelectedLoraPreviewIds.indexOf(loginSelectedLoraPreview);
          if (idx >= 0) {
            setLoginSelectedLoraPreview(
              loginSelectedLoraPreviewIds[(idx - 1 + loginSelectedLoraPreviewIds.length) % loginSelectedLoraPreviewIds.length]
            );
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedLoraPreview,
    selectedLoraPreviewIds,
    loginSelectedLoraPreview,
    loginSelectedLoraPreviewIds
  ]);

  useEffect(() => {
    if (!selectedLoraPreview || selectedLoraPreviewIndex < 0 || selectedLoraPreviewIds.length < 2) return;
    const nextId = selectedLoraPreviewIds[(selectedLoraPreviewIndex + 1) % selectedLoraPreviewIds.length];
    const prevId =
      selectedLoraPreviewIds[(selectedLoraPreviewIndex - 1 + selectedLoraPreviewIds.length) % selectedLoraPreviewIds.length];
    [nextId, prevId].forEach((fileId) => {
      const thumb = new Image();
      thumb.src = fileUrl(fileId, token, { thumb: true, size: 1024 });
      const original = new Image();
      original.src = fileUrl(fileId, token);
    });
  }, [selectedLoraPreview, selectedLoraPreviewIndex, selectedLoraPreviewIds, token]);

  useEffect(() => {
    if (!loginSelectedLoraPreview || loginSelectedLoraPreviewIndex < 0 || loginSelectedLoraPreviewIds.length < 2) return;
    const nextId = loginSelectedLoraPreviewIds[(loginSelectedLoraPreviewIndex + 1) % loginSelectedLoraPreviewIds.length];
    const prevId =
      loginSelectedLoraPreviewIds[(loginSelectedLoraPreviewIndex - 1 + loginSelectedLoraPreviewIds.length) % loginSelectedLoraPreviewIds.length];
    [nextId, prevId].forEach((fileId) => {
      const thumb = new Image();
      thumb.src = fileUrl(fileId, "", { thumb: true, size: 1024 });
      const original = new Image();
      original.src = fileUrl(fileId, "");
    });
  }, [loginSelectedLoraPreview, loginSelectedLoraPreviewIndex, loginSelectedLoraPreviewIds]);

  useEffect(() => {
    if (token) return;
    fetch("/api/gallery/public")
      .then((res) => res.json())
      .then((data) => setLoginGallery(Array.isArray(data?.images) ? data.images : []))
      .catch(() => setLoginGallery([]));
    fetch("/api/gallery/models/public")
      .then((res) => res.json())
      .then((data) => setLoginModels(Array.isArray(data?.models) ? data.models : []))
      .catch(() => setLoginModels([]));
    fetch("/api/loras/public")
      .then((res) => res.json())
      .then((data) => setLoginLoras(Array.isArray(data?.loras) ? data.loras : []))
      .catch(() => setLoginLoras([]));
  }, [token]);

  const refreshQueueStatus = () => {
    if (!token || !isAdmin) return;
    fetch("/api/admin/queue/status", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) =>
        setQueueStatus({
          queue_paused: Boolean(data.queue_paused ?? false),
          active_pipeline_id: data.active_pipeline_id ?? "",
          active_generation_id: data.active_generation_id ?? "",
          active_training_id: data.active_training_id ?? ""
        })
      )
      .catch(() =>
        setQueueStatus({
          queue_paused: false,
          active_pipeline_id: "",
          active_generation_id: "",
          active_training_id: ""
        })
      );
  };

  const refreshAdminCreditLedger = async (pageOverride?: number) => {
    if (!token || !isAdmin) return;
    const page = Math.max(1, pageOverride ?? adminLedgerPage);
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(adminLedgerPageSize)
    });
    if (adminLedgerUserFilter.trim()) params.set("user", adminLedgerUserFilter.trim());
    if (adminLedgerReasonFilter.trim()) params.set("reason", adminLedgerReasonFilter.trim());
    if (adminLedgerRefTypeFilter.trim()) params.set("ref_type", adminLedgerRefTypeFilter.trim());
    if (adminLedgerDeltaSign !== "all") params.set("delta_sign", adminLedgerDeltaSign);
    if (adminLedgerFrom) params.set("from", adminLedgerFrom);
    if (adminLedgerTo) params.set("to", adminLedgerTo);
    setAdminLedgerLoading(true);
    setAdminLedgerStatus("");
    try {
      const res = await fetch(`/api/admin/credits/ledger?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAdminLedgerEntries([]);
        setAdminLedgerTotal(0);
        setAdminLedgerStatus(humanizeErrorCode(data?.error ?? "Ledger load failed"));
        return;
      }
      setAdminLedgerEntries((data.entries ?? []) as AdminCreditLedgerEntry[]);
      setAdminLedgerTotal(Number(data.total ?? 0));
      setAdminLedgerPage(Number(data.page ?? page));
    } catch {
      setAdminLedgerEntries([]);
      setAdminLedgerTotal(0);
      setAdminLedgerStatus("Ledger load failed");
    } finally {
      setAdminLedgerLoading(false);
    }
  };

  const openAdminCreditLedgerDetail = async (entryId: string) => {
    if (!token || !isAdmin || !entryId) return;
    setAdminLedgerDetailOpen(true);
    setAdminLedgerDetail(null);
    const res = await fetch(`/api/admin/credits/ledger/${entryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    setAdminLedgerDetail((data ?? null) as AdminCreditLedgerDetail | null);
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setAdminLedgerCopyStatus("Copied.");
      window.setTimeout(() => setAdminLedgerCopyStatus(""), 1200);
    } catch {
      setAdminLedgerCopyStatus("Copy failed.");
      window.setTimeout(() => setAdminLedgerCopyStatus(""), 1800);
    }
  };

  const exportAdminLedgerCsv = () => {
    if (!adminLedgerEntries.length) return;
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["id", "created_at", "user_id", "username", "email", "delta", "reason", "ref_type", "ref_id"];
    const lines = [
      header.join(","),
      ...adminLedgerEntries.map((entry) =>
        [
          escape(entry.id),
          escape(entry.created_at),
          escape(entry.user_id),
          escape(entry.username),
          escape(entry.email),
          escape(entry.delta),
          escape(entry.reason ?? ""),
          escape(entry.ref_type ?? ""),
          escape(entry.ref_id ?? "")
        ].join(",")
      )
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit_ledger_page_${adminLedgerPage}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runAdminUserSearch = async () => {
    if (!token || !isAdmin) return;
    const value = adminUserSearchValue.trim();
    if (!value) {
      setAdminUsers([]);
      setAdminUserSelectedId("");
      setAdminUserSearchStatus("Bitte Suchwert eingeben.");
      return;
    }
    try {
      setAdminUserSearchBusy(true);
      setAdminUserSearchStatus("Suche laeuft...");
      const params = new URLSearchParams({
        field: adminUserSearchField,
        value,
        limit: "15"
      });
      const res = await fetch(`/api/admin/users/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAdminUsers([]);
        setAdminUserSelectedId("");
        setAdminUserSearchStatus(humanizeErrorCode(data?.error ?? "Suche fehlgeschlagen"));
        return;
      }
      const list = (data.users ?? []) as AdminUser[];
      setAdminUsers(list);
      setAdminUserSelectedId(list[0]?.id ?? "");
      setAdminUserSearchStatus(list.length ? `${list.length} Treffer` : "Keine Treffer");
      setAdminUserPasswordResult("");
    } catch {
      setAdminUsers([]);
      setAdminUserSelectedId("");
      setAdminUserSearchStatus("Suche fehlgeschlagen");
    } finally {
      setAdminUserSearchBusy(false);
    }
  };

  const refreshSelectedAdminUser = async () => {
    if (!token || !isAdmin || !adminUserSelectedId) return;
    const current = adminUsers.find((row) => row.id === adminUserSelectedId);
    if (!current) return;
    const field = current.email === adminUserSearchValue.trim() ? "email" : "id";
    const value = field === "email" ? current.email : current.id;
    const params = new URLSearchParams({ field, value, limit: "1" });
    const res = await fetch(`/api/admin/users/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const fresh = (data.users ?? [])[0] as AdminUser | undefined;
    if (!fresh) return;
    setAdminUsers((prev) => prev.map((row) => (row.id === fresh.id ? fresh : row)));
  };

  const refreshAdminArchives = () => {
    if (!token || !isAdmin) return;
    setAdminArchiveLoading(true);
    setAdminArchiveMessage("");
    const params = new URLSearchParams();
    if (adminArchiveQuery.trim()) params.set("query", adminArchiveQuery.trim());
    if (adminArchiveUser.trim()) params.set("user_id", adminArchiveUser.trim());
    params.set("limit", "250");
    fetch(`/api/admin/archives?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setAdminArchives(data.archives ?? []))
      .catch(() => setAdminArchives([]))
      .finally(() => setAdminArchiveLoading(false));
  };

  const refreshArchiveRetentionDays = () => {
    if (!token || !isAdmin) return;
    fetch("/api/admin/archives/retention", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!ok) return;
        const value = Number(data?.retention_days);
        if (Number.isFinite(value) && value >= 1) {
          setAdminArchiveRetentionDays(String(Math.round(value)));
        }
      })
      .catch(() => null);
  };

  const restoreAdminArchive = (archivePath: string) => {
    if (!token || !isAdmin) return;
    setAdminArchiveMessage("Restoring archive...");
    fetch("/api/admin/archives/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ archive_path: archivePath, overwrite: adminArchiveOverwrite })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setAdminArchiveMessage(humanizeErrorCode(data?.error ?? "Restore failed"));
          return;
        }
        const errors = Array.isArray(data.errors) && data.errors.length ? ` (${data.errors.length} errors)` : "";
        setAdminArchiveMessage(`Restored ${data.restored ?? 0}, skipped ${data.skipped ?? 0}${errors}`);
        refreshAdminArchives();
      })
      .catch(() => setAdminArchiveMessage("Restore failed"));
  };

  const openArchiveDetails = (archivePath: string) => {
    if (!token || !isAdmin) return;
    setAdminArchiveDetailOpen(true);
    setAdminArchiveDetail(null);
    setAdminArchiveEntryFilter("");
    fetch(`/api/admin/archives/details?path=${encodeURIComponent(archivePath)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setAdminArchiveDetail(data))
      .catch(() => setAdminArchiveDetail(null));
  };

  const deleteAdminArchive = (archivePath: string) => {
    if (!token || !isAdmin) return;
    setAdminArchiveMessage("Deleting archive...");
    fetch(`/api/admin/archives?path=${encodeURIComponent(archivePath)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setAdminArchiveMessage(humanizeErrorCode(data?.error ?? "Delete failed"));
          return;
        }
        setAdminArchiveMessage("Archive deleted");
        refreshAdminArchives();
      })
      .catch(() => setAdminArchiveMessage("Delete failed"));
  };

  const queueCommand = (action: string) => {
    if (!token || !isAdmin) return;
    fetch("/api/admin/queue/command", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action })
    })
      .then((res) => res.json())
      .then(() => refreshQueueStatus())
      .catch(() => null);
  };

  const refreshTaggerModels = () => {
    if (!token || !isAdmin) return;
    fetch("/api/admin/tagger/models", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setTaggerModels(data.models ?? []))
      .catch(() => setTaggerModels([]));
  };

  const refreshStagedUploads = () => {
    if (!token) return;
    fetch("/api/uploads/staged", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setStagedUploads(data.uploads ?? []))
      .catch(() => setStagedUploads([]));
  };

  const refreshPipelineRuns = () => {
    if (!token) return;
    fetch("/api/runs", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setPipelineRuns(data.runs ?? []))
      .catch(() => setPipelineRuns([]));
  };

  const refreshDashboardOverview = () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch("/api/dashboard/overview", { headers })
      .then((res) => res.json())
      .then((data) => {
        const trainingSteps = (data.training_steps ?? []).reduce((acc: any, row: any) => {
          acc[row.run_id] = row.steps ?? {};
          return acc;
        }, {});
        const trainingRuns = (data.training_runs ?? []).map((run: any) => ({
          ...run,
          steps: trainingSteps[run.id] ?? {}
        }));
        setDashboardPipeline(data.pipeline_runs ?? []);
        setDashboardTraining(trainingRuns);
        setDashboardQueue(data.pipeline_queue ?? []);
      })
      .catch(() => {
        setDashboardPipeline([]);
        setDashboardTraining([]);
        setDashboardQueue([]);
      });
  };

  const refreshTrainingRuns = () => {
    if (!token) return;
    fetch("/api/training/runs", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setTrainingRuns(data.runs ?? []))
      .catch(() => setTrainingRuns([]));
  };

  const refreshJobs = () => {
    if (!token) return;
    fetch("/api/generation/jobs", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs ?? []))
      .catch(() => setJobs([]));
  };

  const refreshDmUnread = () => {
    if (!token) return;
    fetch("/api/dm/unread-count", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setDmUnreadCount(Number(data.unread_count ?? 0)))
      .catch(() => setDmUnreadCount(0));
  };

  const refreshDmBlocks = () => {
    if (!token) return;
    fetch("/api/dm/blocks", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setDmBlocks((data.blocks ?? []) as DMBlock[]))
      .catch(() => setDmBlocks([]));
  };

  const refreshDmThreads = (selectId?: string) => {
    if (!token) return;
    fetch("/api/dm/threads", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        const list = (data.threads ?? []) as DMThread[];
        setDmThreads(list);
        if (selectId) {
          setDmActiveThreadId(selectId);
          setMiniDmThreadId(selectId);
          return;
        }
        if (!dmActiveThreadId && list.length > 0) {
          setDmActiveThreadId(list[0].id);
        }
        if (!miniDmThreadId && list.length > 0) {
          setMiniDmThreadId(list[0].id);
          return;
        }
        if (dmActiveThreadId && !list.some((thread) => thread.id === dmActiveThreadId)) {
          setDmActiveThreadId(list[0]?.id ?? "");
        }
        if (miniDmThreadId && !list.some((thread) => thread.id === miniDmThreadId)) {
          setMiniDmThreadId(list[0]?.id ?? "");
          setMiniDmMode("threads");
        }
      })
      .catch(() => setDmThreads([]));
  };

  const refreshDmMessages = (threadId: string, options?: { incremental?: boolean; markRead?: boolean }) => {
    if (!token || !threadId) return;
    const incremental = Boolean(options?.incremental);
    const markRead = options?.markRead ?? true;
    const currentMessages = dmActiveThreadId === threadId ? dmMessagesRef.current : [];
    const lastMessageId = incremental && currentMessages.length ? currentMessages[currentMessages.length - 1]?.id : "";
    if (!incremental) {
      setDmLoading(true);
    }
    const query = lastMessageId ? `?limit=120&after=${encodeURIComponent(lastMessageId)}` : "?limit=120";
    fetch(`/api/dm/threads/${threadId}/messages${query}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        const incoming = ((data.messages ?? []) as DMMessage[]).filter((row) => Boolean(row?.id));
        if (incremental) {
          if (incoming.length) {
            setDmMessages((prev) => {
              const map = new Map(prev.map((msg) => [msg.id, msg]));
              for (const row of incoming) map.set(row.id, row);
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }
        } else {
          setDmMessages(incoming);
        }
        if (!markRead) return null;
        return fetch(`/api/dm/threads/${threadId}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
      })
      .then(() => {
        refreshDmThreads();
        refreshDmUnread();
      })
      .catch(() => {
        if (!incremental) setDmMessages([]);
      })
      .finally(() => {
        if (!incremental) setDmLoading(false);
      });
  };

  const openDmWithUser = (targetUserId?: string | null) => {
    if (!token || !targetUserId) return;
    setDmStatus("Opening chat...");
    fetch("/api/dm/open", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ target_user_id: targetUserId })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error || !data?.thread_id) {
          setDmStatus(humanizeErrorCode(data?.error ?? "Could not open chat."));
          return;
        }
        const threadId = String(data.thread_id);
        setDmStatus("");
        setDmActiveThreadId(threadId);
        if (isMobileRouteActive) {
          setView("messages");
        } else {
          setMiniDmOpen(true);
          setMiniDmMode("chat");
          setMiniDmThreadId(threadId);
        }
        refreshDmThreads(threadId);
        refreshDmMessages(threadId);
      })
      .catch(() => setDmStatus("Could not open chat."));
  };

  const reorderDashboardQueueItem = (item: DashboardQueueItem, direction: "up" | "down") => {
    if (!token) return;
    if (item.item_type !== "pipeline" || item.status !== "queued") {
      setDashboardQueueMsg("Only queued pipeline items can be reordered.");
      return;
    }
    setDashboardQueueMovePending(item.id);
    setDashboardQueueMsg("Reordering queue...");
    fetch("/api/queue/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        item_id: item.id,
        item_type: "pipeline_run",
        direction
      })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error) {
          setDashboardQueueMsg(humanizeErrorCode(data?.error ?? "Queue reorder failed."));
          return;
        }
        setDashboardQueueMsg(data?.status === "noop" ? "Already at queue edge." : "Queue updated.");
        refreshDashboardOverview();
      })
      .catch(() => setDashboardQueueMsg("Queue reorder failed."))
      .finally(() => setDashboardQueueMovePending(null));
  };

  const sendDmMessage = (options?: { threadId?: string; body?: string; keepDraft?: boolean }) => {
    if (!token) return;
    const threadId = String(options?.threadId ?? dmActiveThreadId ?? "");
    if (!threadId) return;
    const body = String(options?.body ?? dmDraft).trim();
    if (!body) return;
    setDmStatus("Sending...");
    fetch(`/api/dm/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ body })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error) {
          setDmStatus(humanizeErrorCode(data?.error ?? "Message failed."));
          return;
        }
        if (!options?.keepDraft) {
          setDmDraft("");
        }
        setDmStatus("");
        if (data?.message?.id) {
          setDmMessages((prev) => {
            if (prev.some((msg) => msg.id === data.message.id)) return prev;
            return [...prev, data.message as DMMessage].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        } else {
          refreshDmMessages(threadId, { incremental: true });
        }
        fetch(`/api/dm/threads/${threadId}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
        refreshDmThreads();
        refreshDmUnread();
      })
      .catch(() => setDmStatus("Message failed."));
  };

  const deleteDmThread = (threadId: string) => {
    if (!token || !threadId) return;
    setDmStatus("Removing thread...");
    fetch(`/api/dm/threads/${threadId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error) {
          setDmStatus(humanizeErrorCode(data?.error ?? "Thread remove failed."));
          return;
        }
        if (dmActiveThreadId === threadId) {
          setDmActiveThreadId("");
          setDmMessages([]);
        }
        setDmStatus("Thread removed.");
        refreshDmThreads();
        refreshDmUnread();
      })
      .catch(() => setDmStatus("Thread remove failed."));
  };

  const blockDmUser = (targetUserId: string) => {
    if (!token || !targetUserId) return;
    setDmStatus("Blocking user...");
    fetch("/api/dm/blocks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ target_user_id: targetUserId })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error) {
          setDmStatus(humanizeErrorCode(data?.error ?? "Block failed."));
          return;
        }
        setDmStatus("User blocked.");
        refreshDmBlocks();
        refreshDmThreads();
      })
      .catch(() => setDmStatus("Block failed."));
  };

  const unblockDmUser = (targetUserId: string) => {
    if (!token || !targetUserId) return;
    setDmStatus("Unblocking user...");
    fetch(`/api/dm/blocks/${targetUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error) {
          setDmStatus(humanizeErrorCode(data?.error ?? "Unblock failed."));
          return;
        }
        setDmStatus("User unblocked.");
        refreshDmBlocks();
        refreshDmThreads();
      })
      .catch(() => setDmStatus("Unblock failed."));
  };

  const saveWildcardSettings = (nextLists: WildcardList[], nextMode: "sequential" | "random") => {
    if (!token) return;
    setWildcardSaving(true);
    setWildcardMessage("Saving wildcard lists...");
    const payloadLists = nextLists.map((row) => ({ name: normalizeWildcardName(row.name), entries: row.entries }));
    fetch("/api/settings/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        key: "generation.wildcards",
        value: { lists: payloadLists }
      })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(async ({ ok, data }) => {
        if (!ok || data?.error) {
          throw new Error(data?.error ?? "wildcard_settings_save_failed");
        }
        const modeRes = await fetch("/api/settings/user", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            key: "generation.wildcard_mode",
            value: nextMode
          })
        });
        if (!modeRes.ok) throw new Error("wildcard_mode_save_failed");
        setWildcardLists(nextLists);
        setWildcardMode(nextMode);
        setWildcardMessage("Wildcard settings saved.");
      })
      .catch((err) => setWildcardMessage(err instanceof Error ? err.message : "Save failed"))
      .finally(() => setWildcardSaving(false));
  };

  const addOrUpdateWildcard = () => {
    const normalized = normalizeWildcardName(wildcardNameInput);
    const entries = parseWildcardEntries(wildcardEntriesInput);
    if (!normalized) {
      setWildcardMessage("Wildcard name required. Allowed: a-z, 0-9, _ and -.");
      return;
    }
    if (normalized !== wildcardNameInput.trim().toLowerCase()) {
      setWildcardMessage("Wildcard name must already be lowercase and normalized.");
      return;
    }
    if (!entries.length) {
      setWildcardMessage("At least one list entry is required.");
      return;
    }
    const next = [...wildcardLists.filter((row) => row.name !== wildcardEditName && row.name !== normalized), {
      name: normalized,
      entries
    }].sort((a, b) => a.name.localeCompare(b.name));
    setWildcardLists(next);
    setWildcardNameInput("");
    setWildcardEntriesInput("");
    setWildcardEditName("");
    setWildcardMessage("Wildcard list updated. Save to apply.");
  };

  const editWildcard = (name: string) => {
    const found = wildcardLists.find((row) => row.name === name);
    if (!found) return;
    setWildcardEditName(name);
    setWildcardNameInput(found.name);
    setWildcardEntriesInput(found.entries.join("\n"));
    setWildcardMessage("");
  };

  const removeWildcard = (name: string) => {
    const next = wildcardLists.filter((row) => row.name !== name);
    setWildcardLists(next);
    if (wildcardEditName === name) {
      setWildcardEditName("");
      setWildcardNameInput("");
      setWildcardEntriesInput("");
    }
    setWildcardMessage("Wildcard list removed. Save to apply.");
  };

  const refreshGalleryImages = (mode = galleryMode) => {
    const endpoint = mode === "private" ? "/api/gallery/private" : "/api/gallery/public";
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    fetch(endpoint, { headers })
      .then((res) => res.json())
      .then((data) => setGalleryImages(data.images ?? []))
      .catch(() => setGalleryImages([]));
  };

  const refreshLoraEntries = (mode = loraMode) => {
    if (!token) return;
    const endpoint = mode === "private" ? "/api/loras/private" : "/api/loras/public";
    const headers = { Authorization: `Bearer ${token}` };
    fetch(endpoint, { headers })
      .then((res) => res.json())
      .then((data) => setLoraEntries(data.loras ?? []))
      .catch(() => setLoraEntries([]));
  };

  useEffect(() => {
    if (!token || view !== "lora" || !loraRouteId) return;
    if (selectedLoraEntry?.id === loraRouteId) return;
    const existing = loraEntries.find((entry) => entry.id === loraRouteId);
    if (existing) {
      openLoraEntry(existing);
      return;
    }
    fetch(`/api/loras/${encodeURIComponent(loraRouteId)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || !data?.lora) {
          setLoraRouteId("");
          setSelectedLoraEntry(null);
          return;
        }
        openLoraEntry(data.lora as LoraEntry);
      })
      .catch(() => {
        setLoraRouteId("");
        setSelectedLoraEntry(null);
      });
  }, [token, view, loraRouteId, loraEntries, selectedLoraEntry?.id]);

  const canManageLoraEntry = (entry: LoraEntry) => Boolean(entry.user_id && (entry.user_id === user?.id || isAdmin));
  const manageableVisibleLoraIds = useMemo(
    () => loraEntries.filter((entry) => canManageLoraEntry(entry)).map((entry) => entry.id),
    [loraEntries, user?.id, isAdmin]
  );

  useEffect(() => {
    setLoraBulkSelection((prev) => prev.filter((id) => manageableVisibleLoraIds.includes(id)));
  }, [manageableVisibleLoraIds]);

  const toggleLoraBulkSelection = (loraId: string) => {
    setLoraBulkSelection((prev) => (prev.includes(loraId) ? prev.filter((id) => id !== loraId) : [...prev, loraId]));
  };

  const applyLoraBulkVisibility = async (isPublic: boolean) => {
    if (!token || !loraBulkSelection.length || loraBulkBusy) return;
    setLoraBulkBusy(true);
    setLoraBulkMessage("Applying visibility...");
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const results = await Promise.all(
        loraBulkSelection.map(async (id) => {
          const res = await fetch(`/api/loras/${id}/public`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ is_public: isPublic })
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { ok: false, id, error: String(data?.error ?? "update_failed") };
          }
          return { ok: true, id };
        })
      );
      const okCount = results.filter((row) => row.ok).length;
      const failed = results.filter((row) => !row.ok) as Array<{ ok: false; id: string; error: string }>;
      if (failed.length) {
        setLoraBulkMessage(
          `Updated ${okCount}/${results.length}. Failed: ${failed
            .slice(0, 3)
            .map((row) => humanizeErrorCode(row.error))
            .join(", ")}`
        );
      } else {
        setLoraBulkMessage(`Updated ${okCount}/${results.length}.`);
      }
      setLoraBulkSelection([]);
      refreshLoraEntries();
      if (selectedLoraEntry) openLoraEntry(selectedLoraEntry);
    } catch {
      setLoraBulkMessage("Bulk visibility update failed.");
    } finally {
      setLoraBulkBusy(false);
    }
  };

  const generateLoraBulkPreviews = async () => {
    if (!token || !loraBulkSelection.length || loraBulkBusy) return;
    setLoraBulkBusy(true);
    setLoraBulkMessage("Queuing preview generation...");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const results = await Promise.all(
        loraBulkSelection.map(async (id) => {
          const res = await fetch(`/api/loras/${id}/previews`, {
            method: "POST",
            headers
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { ok: false, id, error: String(data?.error ?? "preview_queue_failed") };
          }
          return { ok: true, id };
        })
      );
      const okCount = results.filter((row) => row.ok).length;
      const failed = results.filter((row) => !row.ok) as Array<{ ok: false; id: string; error: string }>;
      if (failed.length) {
        setLoraBulkMessage(
          `Queued previews ${okCount}/${results.length}. Failed: ${failed
            .slice(0, 3)
            .map((row) => humanizeErrorCode(row.error))
            .join(", ")}`
        );
      } else {
        setLoraBulkMessage(`Queued previews ${okCount}/${results.length}.`);
      }
      setLoraBulkSelection([]);
      refreshLoraEntries();
      if (selectedLoraEntry) openLoraEntry(selectedLoraEntry);
    } catch {
      setLoraBulkMessage("Bulk preview queue failed.");
    } finally {
      setLoraBulkBusy(false);
    }
  };

  const deleteLoraBulkSelection = async () => {
    if (!token || !loraBulkSelection.length || loraBulkBusy) return;
    if (!confirm(`Delete ${loraBulkSelection.length} selected LoRA(s)? This cannot be undone.`)) return;
    setLoraBulkBusy(true);
    setLoraBulkMessage("Queuing selected LoRAs for removal...");
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const res = await fetch("/api/loras/bulk-delete", {
        method: "POST",
        headers,
        body: JSON.stringify({ lora_ids: loraBulkSelection })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoraBulkMessage(humanizeErrorCode(String(data?.error ?? "bulk_delete_failed")));
        return;
      }
      const queued = Number(data?.queued ?? 0);
      const skipped = Number(data?.skipped ?? 0);
      const errors = Array.isArray(data?.errors) ? data.errors : [];
      if (selectedLoraEntry && loraBulkSelection.includes(selectedLoraEntry.id)) {
        setSelectedLoraEntry(null);
      }
      if (skipped > 0 && errors.length) {
        setLoraBulkMessage(
          `Queued ${queued}/${loraBulkSelection.length}. Skipped: ${errors
            .slice(0, 3)
            .map((row: any) => humanizeErrorCode(String(row?.error ?? "unknown_error")))
            .join(", ")}`
        );
      } else {
        setLoraBulkMessage(`Queued ${queued}/${loraBulkSelection.length} for removal.`);
      }
      setLoraBulkSelection([]);
      refreshLoraEntries();
    } catch {
      setLoraBulkMessage("Bulk delete failed.");
    } finally {
      setLoraBulkBusy(false);
    }
  };

  const cancelPipelineRun = (runId: string) => {
    if (!token) return;
    fetch(`/api/runs/${runId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => refreshPipelineRuns())
      .catch(() => null);
  };

  const retryPipelineRun = (runId: string) => {
    if (!token) return;
    fetch(`/api/runs/${runId}/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => refreshPipelineRuns())
      .catch(() => null);
  };

  const deletePipelineRun = (runId: string) => {
    if (!token) return;
    fetch(`/api/runs/${runId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        if (selectedRunId === runId) {
          setSelectedRunId("");
          setSelectedRun(null);
        }
        refreshPipelineRuns();
      })
      .catch(() => null);
  };

  const cancelTrainingRun = (runId: string) => {
    if (!token) return;
    fetch(`/api/training/runs/${runId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => refreshTrainingRuns())
      .catch(() => null);
  };

  const retryTrainingRun = (runId: string) => {
    if (!token) return;
    fetch(`/api/training/runs/${runId}/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!ok) {
          setDashboardQueueMsg(humanizeErrorCode(data?.error ?? "retry_failed"));
        }
        refreshTrainingRuns();
        refreshDashboardOverview();
      })
      .catch(() => {
        setDashboardQueueMsg("Retry failed.");
      });
  };

  const deleteTrainingRun = (runId: string) => {
    if (!token) return;
    setTrainingRuns((prev) => prev.map((run) => (run.id === runId ? { ...run, status: "removing" } : run)));
    setDashboardTraining((prev) => prev.map((run) => (run.id === runId ? { ...run, status: "removing" } : run)));
    if (dashboardModalKind === "training" && dashboardModalData?.id === runId) {
      setDashboardModalData((prev: any) => (prev ? { ...prev, status: "removing", status_live: "removing" } : prev));
    }
    fetch(`/api/training/runs/${runId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!ok) {
          setDashboardQueueMsg(humanizeErrorCode(data?.error ?? "delete_failed"));
        }
        refreshTrainingRuns();
        refreshDashboardOverview();
      })
      .catch(() => {
        setDashboardQueueMsg("Delete failed.");
        refreshTrainingRuns();
      });
  };

  const saveArchiveRetentionDays = () => {
    if (!token || !isAdmin) return;
    const parsed = Number(adminArchiveRetentionDays);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setAdminArchiveMessage("Retention days must be >= 1.");
      return;
    }
    setAdminArchiveMessage("Saving retention setting...");
    fetch("/api/admin/archives/retention", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ retention_days: Math.round(parsed) })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!ok) {
          setAdminArchiveMessage(humanizeErrorCode(data?.error ?? "save_failed"));
          return;
        }
        const saved = Number(data?.retention_days ?? Math.round(parsed));
        setAdminArchiveRetentionDays(String(saved));
        setAdminArchiveMessage(`Retention set to ${saved} day(s).`);
      })
      .catch(() => setAdminArchiveMessage("Failed to save retention setting."));
  };

  const pruneArchivesNow = () => {
    if (!token || !isAdmin) return;
    if (!window.confirm("Run archive prune now? Old archives beyond retention will be permanently deleted.")) return;
    setAdminArchiveMessage("Running archive prune...");
    fetch("/api/admin/archives/prune", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ retention_days: Math.max(1, Math.round(Number(adminArchiveRetentionDays) || 30)) })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!ok) {
          setAdminArchiveMessage(humanizeErrorCode(data?.error ?? "prune_failed"));
          return;
        }
        const retention = Number(data?.retention_days ?? (Number(adminArchiveRetentionDays) || 30));
        setAdminArchiveRetentionDays(String(retention));
        setAdminArchiveMessage(`Archive prune done (retention: ${retention} days).`);
        refreshAdminArchives();
      })
      .catch(() => setAdminArchiveMessage("Archive prune failed."));
  };

  const cancelGenerationJob = (jobId: string) => {
    if (!token) return;
    fetch(`/api/generation/jobs/${jobId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => refreshJobs())
      .catch(() => null);
  };

  const deleteGenerationJob = (jobId: string) => {
    if (!token) return;
    fetch(`/api/generation/jobs/${jobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => refreshJobs())
      .catch(() => null);
  };

  const clearGenerationHistory = () => {
    if (!token) return;
    fetch("/api/generation/jobs?scope=history", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => refreshJobs())
      .catch(() => null);
  };

  const openManualEditor = (runId: string, runName: string) => {
    if (!token) return;
    setManualOpen(true);
    setManualRunId(runId);
    setManualRunName(runName);
    setManualImages([]);
    setManualFiltered([]);
    setManualSelected([]);
    setManualDirty({});
    setManualTags([]);
    setManualFilterTags([]);
    setManualSearch("");
    setManualFaceOnly(false);
    setManualBulkAdd("");
    setManualBulkRemove("");
    setManualTagFilter("");
    setManualMsg("Loading...");
    fetch(`/api/runs/${runId}/manual/dataset`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        const imgs = (data.images ?? []).map((img: ManualImage) => ({
          ...img,
          url: withToken(img.url, token)
        }));
        setManualImages(imgs);
        setManualMsg(`Loaded ${imgs.length} images`);
      })
      .catch(() => setManualMsg("Failed to load dataset"));
    fetch(`/api/runs/${runId}/manual/tags`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setManualTags(data.tags ?? []))
      .catch(() => setManualTags([]));
  };

  const toggleManualSelected = (path: string) => {
    setManualSelected((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const updateManualCaption = (path: string, caption: string) => {
    setManualImages((prev) =>
      prev.map((img) => (img.path === path ? { ...img, caption } : img))
    );
    setManualDirty((prev) => ({ ...prev, [path]: caption }));
  };

  const applyManualBulk = (mode: "add" | "remove") => {
    const raw = mode === "add" ? manualBulkAdd : manualBulkRemove;
    const tags = parseTagList(raw);
    if (!tags.length) return;
    const targets =
      manualSelected.length > 0
        ? manualImages.filter((img) => manualSelected.includes(img.path))
        : manualFiltered;
    const updates: Record<string, string> = {};
    for (const img of targets) {
      const current = parseTagList(img.caption);
      let next = current;
      if (mode === "add") {
        next = Array.from(new Set([...current, ...tags]));
      } else {
        const remove = new Set(tags);
        next = current.filter((tag) => !remove.has(tag));
      }
      updates[img.path] = next.join(", ");
    }
    setManualImages((prev) =>
      prev.map((img) => (updates[img.path] !== undefined ? { ...img, caption: updates[img.path] } : img))
    );
    setManualDirty((prev) => ({ ...prev, ...updates }));
  };

  const saveManualChanges = () => {
    if (!token || !manualRunId) return;
    const updates = Object.entries(manualDirty).map(([path, caption]) => ({ path, caption }));
    if (!updates.length) {
      setManualMsg("No changes to save.");
      return;
    }
    setManualMsg("Saving...");
    fetch(`/api/runs/${manualRunId}/manual/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ updates })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setManualMsg(String(data.error));
          return;
        }
        setManualDirty({});
        setManualMsg("Saved");
        fetch(`/api/runs/${manualRunId}/manual/tags`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((resData) => setManualTags(resData.tags ?? []))
          .catch(() => null);
      })
      .catch(() => setManualMsg("Save failed"));
  };

  const removeSelectedTags = () => {
    if (!token || !manualRunId) return;
    if (!manualFilterTags.length) {
      setManualMsg("Select tags to remove.");
      return;
    }
    setManualMsg("Removing tags...");
    fetch(`/api/runs/${manualRunId}/manual/tags/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tags: manualFilterTags })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setManualMsg(String(data.error));
          return;
        }
        setManualFilterTags([]);
        fetch(`/api/runs/${manualRunId}/manual/dataset`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((resData) => setManualImages(resData.images ?? []))
          .catch(() => null);
        fetch(`/api/runs/${manualRunId}/manual/tags`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((resData) => setManualTags(resData.tags ?? []))
          .catch(() => null);
        setManualMsg(`Removed from ${data.updated ?? 0} images`);
      })
      .catch(() => setManualMsg("Remove failed"));
  };

  const resumeManualRun = () => {
    if (!token || !manualRunId) return;
    setManualMsg("Validating...");
    fetch(`/api/runs/${manualRunId}/manual/commit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setManualMsg(`${data.error}${data.missing?.length ? ` (${data.missing.length} missing)` : ""}`);
          return;
        }
        setManualMsg("Pipeline resumed");
        setManualOpen(false);
        setManualRunId("");
        fetch("/api/runs", { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((resData) => setPipelineRuns(resData.runs ?? []))
          .catch(() => null);
      })
      .catch(() => setManualMsg("Commit failed"));
  };

  const submitApplication = () => {
    const email = applyForm.email.trim();
    const message = applyForm.message.trim();
    if (!email || !message) {
      setApplyStatus("Email and motivation are required.");
      return;
    }
    setApplySubmitting(true);
    setApplyStatus("Submitting...");
    fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        display_name: applyForm.display_name.trim(),
        handle: applyForm.handle.trim(),
        links: applyForm.links.trim(),
        message
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setApplyStatus(String(data.error));
          return;
        }
        setApplyStatus("Application submitted.");
        setApplyForm({ display_name: "", email: "", handle: "", links: "", message: "" });
      })
      .catch(() => setApplyStatus("Submission failed."))
      .finally(() => setApplySubmitting(false));
  };

  const submitPasswordChange = () => {
    if (!token) return;
    if (!passwordNext || passwordNext.length < 8) {
      setPasswordMsg("Password must be at least 8 characters.");
      return;
    }
    if (passwordNext !== passwordConfirm) {
      setPasswordMsg("Passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    setPasswordMsg("Updating...");
    fetch("/api/users/me/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        current_password: passwordCurrent,
        new_password: passwordNext
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setPasswordMsg(String(data.error));
          return;
        }
        setPasswordMsg("Password updated.");
        setPasswordOpen(false);
        setPasswordCurrent("");
        setPasswordNext("");
        setPasswordConfirm("");
        fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((userData) => setUser(userData ?? null))
          .catch(() => null);
      })
      .catch(() => setPasswordMsg("Password update failed."))
      .finally(() => setPasswordBusy(false));
  };

  const parseAutocharPatterns = (value: string) =>
    value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const createAutocharPreset = () => {
    if (!token) return;
    const name = autocharName.trim();
    if (!name) {
      setAutocharStatus("Name is required.");
      return;
    }
    setAutocharStatus("Saving...");
    fetch("/api/autochar/presets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        description: autocharDescription.trim(),
        patterns: parseAutocharPatterns(autocharPatterns)
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setAutocharStatus(String(data.error));
          return;
        }
        setAutocharName("");
        setAutocharDescription("");
        setAutocharPatterns("");
        setAutocharStatus("Preset saved.");
        fetch("/api/autochar/presets", { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((resData) => setAutocharPresets(resData.presets ?? []))
          .catch(() => null);
      })
      .catch(() => setAutocharStatus("Save failed."));
  };

  const updateAutocharPreset = () => {
    if (!token || !autocharEditingId) return;
    const name = autocharName.trim();
    if (!name) {
      setAutocharStatus("Name is required.");
      return;
    }
    setAutocharStatus("Updating...");
    fetch(`/api/autochar/presets/${autocharEditingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        description: autocharDescription.trim(),
        patterns: parseAutocharPatterns(autocharPatterns)
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setAutocharStatus(String(data.error));
          return;
        }
        setAutocharStatus("Preset updated.");
        setAutocharEditingId(null);
        setAutocharName("");
        setAutocharDescription("");
        setAutocharPatterns("");
        fetch("/api/autochar/presets", { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((resData) => setAutocharPresets(resData.presets ?? []))
          .catch(() => null);
      })
      .catch(() => setAutocharStatus("Update failed."));
  };

  const deleteAutocharPreset = (presetId: string) => {
    if (!token) return;
    fetch(`/api/autochar/presets/${presetId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setAutocharStatus(String(data.error));
          return;
        }
        setAutocharPresets((prev) => prev.filter((preset) => preset.id !== presetId));
      })
      .catch(() => setAutocharStatus("Delete failed."));
  };

  const stageFiles = (files: FileList | null) => {
    if (!files || !token) return;
    Array.from(files).forEach((file) => {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setUploadMessage("Only .zip datasets are supported.");
        return;
      }
      const baseName = file.name.replace(/\.zip$/i, "").trim();
      const normalized = normalizeTriggerName(baseName);
      if (!baseName || !isValidTriggerName(normalized)) {
        setUploadMessage("Invalid ZIP name. Use letters, numbers, '_' or '-' only (no spaces).");
        return;
      }
      const form = new FormData();
      form.append("zip", file);
      fetch("/api/uploads/stage", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
        .then((res) => res.json())
        .then((data) => {
          const upload = data?.upload as StagedUpload | undefined;
          if (upload?.contains_videos || Number(upload?.video_count ?? 0) > 0) {
            const uploadName = upload?.name ?? file.name;
            const videoCount = Number(upload?.video_count ?? 0);
            setUploadMessage(
              `ACHTUNG: ZIP '${uploadName}' enthaelt ${videoCount} Video-Datei(en). Images-only ueberspringt Video-Capping.`
            );
          }
          refreshStagedUploads();
        })
        .catch(() => setUploadMessage("Upload failed"));
    });
  };

  const removeStaged = (id: string) => {
    if (!token) return;
    fetch(`/api/uploads/stage/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => refreshStagedUploads())
      .catch(() => null);
  };

  const commitUploads = (options?: { name?: string; note?: string; description?: string }) => {
    if (!token) return;
    if (!stagedUploads.length) {
      setUploadMessage("Stage at least one ZIP before launching.");
      return;
    }
    const payload = {
      uploads: stagedUploads.map((u) => u.id),
      name: options?.name,
      autotag: runConfig.autotag,
      autochar: runConfig.autochar,
      manualTagging: runConfig.manualTagging,
      facecap: runConfig.facecap,
      imagesOnly: runConfig.imagesOnly,
      train: runConfig.train,
      gpu: runConfig.gpu,
      baseModelId: runConfig.baseModelId,
      trainProfile: runConfig.trainProfile,
      note: options?.note ?? runConfig.note,
      description: options?.description,
      autocharPresets: selectedPresets,
      samplePrompts: runConfig.samplePrompts.filter((prompt) => prompt.trim() !== "")
    };
    setUploadMessage("Queuing staged uploads...");
    fetch("/api/uploads/commit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setUploadMessage(String(data.error));
          return;
        }
        const ids = Array.isArray(data.runs) ? data.runs : [];
        setUploadMessage(ids.length ? `Queued Run(s): ${ids.join(", ")}` : "Queued.");
        refreshStagedUploads();
        fetch("/api/runs", { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((resData) => setPipelineRuns(resData.runs ?? []))
          .catch(() => null);
      })
      .catch(() => setUploadMessage("Upload failed"));
  };

  if (!token) {
    return (
      <div className={`app-shell public-shell ${isMobileRouteActive ? "mobile-route" : ""}`}>
        <div className="main">
          <header className="topbar">
            <div className="public-topbar-logo">
              <img src="/logo.png" alt="FrameWorkX" loading="eager" decoding="async" />
            </div>
            <div className="top-actions">
              <button className="action-btn ghost" onClick={() => setLoginOpen(true)}>
                {t.signIn}
              </button>
              <button className="action-btn" onClick={() => setApplyOpen(true)}>
                {t.apply}
              </button>
              <div className="lang-switch">
                <button onClick={() => setLang("en")}>EN</button>
                <button onClick={() => setLang("de")}>DE</button>
              </div>
            </div>
          </header>
          <main className="content">
            <section className={`panel public-hero-v2 ${publicOverviewExpanded ? "is-expanded" : "is-collapsed"}`}>
              <div className="public-hero-v2-head">
                <div className="badge">{t.publicAssetStats}</div>
                <button className="action-btn ghost" onClick={() => setPublicOverviewExpanded((prev) => !prev)}>
                  {publicOverviewExpanded ? t.publicOverviewHide : t.publicOverviewShow}
                </button>
              </div>
              {publicOverviewExpanded ? (
                <>
                  <div className="public-hero-v2-main">
                    <h1>{t.publicWelcomeTitle}</h1>
                    <p className="public-hero-v2-lead">{t.publicWelcomeLead}</p>
                    <p className="public-hero-v2-body">{t.publicWelcomeBody}</p>
                    <ul className="public-hero-v2-list">
                      <li>{t.publicFeatureOne}</li>
                      <li>{t.publicFeatureTwo}</li>
                      <li>{t.publicFeatureThree}</li>
                    </ul>
                    <div className="public-hero-v2-actions">
                      <button className="action-btn" onClick={() => setLoginOpen(true)}>
                        {t.signIn}
                      </button>
                      <button className="action-btn ghost" onClick={() => setApplyOpen(true)}>
                        {t.apply}
                      </button>
                    </div>
                </div>
                  <aside className="public-hero-v2-side">
                    <div className="detail-title">{t.publicWhatIsTitle}</div>
                    <div className="muted small">{t.publicWhatIsBody}</div>
                    <div className="stat-grid">
                      <div className="stat-card">
                        <div className="label">{t.publicExploreImages}</div>
                        <div className="value">{loginGallerySafe.length}</div>
                      </div>
                      <div className="stat-card">
                        <div className="label">{t.publicExploreModels}</div>
                        <div className="value">{loginModelsSafe.length + loginLorasSafe.length}</div>
                      </div>
                    </div>
                  </aside>
                </>
              ) : null}
            </section>
            <div className="public-grid">
              <section className="panel login-feed">
                <div className="panel-header">
                  <h3>{t.publicExploreImages}</h3>
                </div>
                <div className="gallery-grid">
                  {loginGallerySafe.map((img) => (
                    <a
                      key={img.id}
                      className="gallery-tile"
                      href={publicImageHref(img.id, lang)}
                      title={`Open public image by @${img.username}`}
                      onClick={(event) => {
                        event.preventDefault();
                        fetch(`/api/gallery/images/public/${img.id}`)
                          .then((res) => res.json())
                          .then((data) => {
                            setLoginSelectedImage(data.image ?? null);
                            setLoginSelectedModelLabel(data.model_label ?? "");
                          })
                          .catch(() => null);
                      }}
                    >
                      <img
                        src={fileUrl(img.file_id, "", { thumb: true, size: 384 })}
                        alt={`Public image by @${img.username}`}
                        title={`Public image by @${img.username}`}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="tile-meta">
                        <div className="tile-user">
                          {renderAvatar(img.avatar_file_id, "")}
                          <span>@{img.username}</span>
                        </div>
                        <span className="tile-meta-stats">
                          <span>♥ {img.like_count ?? 0}</span>
                          <span>💬 {img.comment_count ?? 0}</span>
                        </span>
                      </div>
                    </a>
                  ))}
                  {!loginGallerySafe.length ? <div className="muted small">{t.publicNoImages}</div> : null}
                </div>
              </section>
              <section className="panel login-feed">
                <div className="panel-header">
                  <h3>{t.publicExploreModels}</h3>
                </div>
                <div className="model-grid">
                  {loginModelsSafe.map((model) => (
                    <a
                      key={model.id}
                      className="model-card login-model-card"
                      href={Array.isArray(model.images) && model.images[0] ? publicImageHref(model.images[0].id, lang) : "/"}
                      title={`Open public model ${model.name}`}
                    >
                      <div className="model-thumb-grid">
                        {(Array.isArray(model.images) ? model.images : []).slice(0, 4).map((img) => (
                          <img
                            key={img.id}
                            src={fileUrl(img.file_id, "", { thumb: true, size: 320 })}
                            alt={`Preview for public model ${model.name}`}
                            title={`Preview for public model ${model.name}`}
                            loading="lazy"
                            decoding="async"
                          />
                        ))}
                      </div>
                      <div className="tile-meta">
                        <div className="tile-user">
                          {renderAvatar(model.avatar_file_id, "")}
                          <span>@{model.username ?? "unknown"} • {model.name}</span>
                        </div>
                        <span className="tile-meta-stats">
                          <span>♥ {model.like_count ?? 0}</span>
                          <span>💬 {model.comment_count ?? 0}</span>
                        </span>
                      </div>
                    </a>
                  ))}
                  {loginLorasSafe.map((entry) => (
                    <a
                      key={entry.id}
                      className="lora-card"
                      href={publicLoraHref(entry.id, lang)}
                      title={`Open public model ${entry.name}`}
                      onClick={(event) => {
                        event.preventDefault();
                        fetch(`/api/loras/public/${entry.id}`)
                          .then((res) => res.json())
                          .then((data) => {
                            setLoginSelectedLora(data.lora ?? null);
                            setLoginSelectedLoraPreview(null);
                          })
                          .catch(() => null);
                      }}
                    >
                      <div className="lora-title">{entry.name}</div>
                      {Array.isArray(entry.preview_file_ids) && entry.preview_file_ids.length > 0 ? (
                        <div className="lora-previews">
                          {entry.preview_file_ids.slice(0, 4).map((fileId) => (
                            <img
                              key={fileId}
                              src={fileUrl(fileId, "", { thumb: true, size: 320 })}
                              alt={`${entry.name} preview`}
                              title={`${entry.name} preview`}
                              loading="lazy"
                              decoding="async"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="muted small">No previews yet.</div>
                      )}
                      <div className="tile-meta">
                        <div className="tile-user">
                          {renderAvatar(entry.avatar_file_id, "", entry.username)}
                          <span>@{entry.username} • LoRA</span>
                        </div>
                        <span className="tile-meta-stats">
                          <span>♥ {entry.like_count ?? 0}</span>
                          <span>💬 {entry.comment_count ?? 0}</span>
                        </span>
                      </div>
                    </a>
                  ))}
                  {!loginModelsSafe.length && !loginLorasSafe.length ? <div className="muted small">{t.publicNoModels}</div> : null}
                </div>
              </section>
            </div>
          </main>
        </div>
        {loginSelectedImage ? (
          <div className="image-modal">
            <div className="image-modal-content">
              <button className="modal-close" onClick={() => setLoginSelectedImage(null)}>
                Close
              </button>
                <div className="modal-body">
                  <div className="modal-image">
                  <img
                    src={fileUrl(loginSelectedImage.file_id, "")}
                    alt={`Public image by @${loginSelectedImage.username}`}
                    title={`Public image by @${loginSelectedImage.username}`}
                  />
                  </div>
                <div className="modal-info">
                  <div className="panel-header">
                    <h3>Public Image</h3>
                    <span className="badge">@{loginSelectedImage.username}</span>
                  </div>
                  <div className="stat-row">
                    <span>Prompt</span>
                    <span>{loginSelectedImage.prompt ?? ""}</span>
                  </div>
                  <div className="stat-row">
                    <span>Model</span>
                    <span>{loginSelectedModelLabel || "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Sampler</span>
                    <span>{loginSelectedImage.sampler ?? "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Scheduler</span>
                    <span>{loginSelectedImage.scheduler ?? "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Steps</span>
                    <span>{loginSelectedImage.steps ?? "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>CFG</span>
                    <span>{loginSelectedImage.cfg_scale ?? "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Seed</span>
                    <span>{loginSelectedImage.seed ?? "–"}</span>
                  </div>
                  <div className="muted small">Login to like, comment, or download.</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {loginSelectedLora ? (
          <div className="image-modal">
            <div className="image-modal-content">
              <button
                className="modal-close"
                onClick={() => {
                  setLoginSelectedLora(null);
                  setLoginSelectedLoraPreview(null);
                }}
              >
                Close
              </button>
              <div className="modal-body">
                <div className="modal-image">
                  <div className="lora-previews large">
                    {(Array.isArray(loginSelectedLora.preview_file_ids) ? loginSelectedLora.preview_file_ids : []).map((fileId) => (
                        <button
                          key={fileId}
                          className="preview-tile"
                          onClick={() => setLoginSelectedLoraPreview(fileId)}
                        >
                        <img
                          src={fileUrl(fileId, "", { thumb: true, size: 512 })}
                          alt={`${loginSelectedLora.name} preview`}
                          title={`${loginSelectedLora.name} preview`}
                          loading="lazy"
                          decoding="async"
                        />
                        </button>
                    ))}
                    {!Array.isArray(loginSelectedLora.preview_file_ids) || !loginSelectedLora.preview_file_ids.length ? (
                      <div className="muted small">No previews yet.</div>
                    ) : null}
                  </div>
                </div>
                <div className="modal-info">
                  <div className="panel-header">
                    <h3>{loginSelectedLora.name}</h3>
                    <span className="badge">@{loginSelectedLora.username}</span>
                  </div>
                  <div className="stat-row">
                    <span>Source</span>
                    <span>{loginSelectedLora.source === "external" ? "External Uploaded" : "Training"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Previews</span>
                    <span>
                      {loginSelectedLora.preview_count ?? 0}/11
                      {loginSelectedLora.preview_in_flight ? " • generating..." : ""}
                    </span>
                  </div>
                  <div className="muted small">Login to like, comment, or download.</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {loginSelectedLoraPreview ? (
          <div className="image-modal">
            <div className="image-modal-content lightbox-content">
              <div className="lightbox-toolbar">
                <span className="muted small">
                  {loginSelectedLora?.name ?? "Preview"}{" "}
                  {loginSelectedLoraPreviewIndex >= 0 ? `${loginSelectedLoraPreviewIndex + 1}/${loginSelectedLoraPreviewIds.length}` : ""}
                </span>
                <button className="modal-close" onClick={() => setLoginSelectedLoraPreview(null)}>
                  Close
                </button>
              </div>
              <div className="modal-body lightbox-body">
                <div className="modal-image lightbox-image-wrap">
                  {loginSelectedLoraPreviewIds.length > 1 ? (
                    <>
                      <button
                        className="lightbox-nav lightbox-nav-left"
                        title="Next (Arrow Left)"
                        onClick={() => {
                          if (loginSelectedLoraPreviewIndex < 0) return;
                          const nextIndex = (loginSelectedLoraPreviewIndex + 1) % loginSelectedLoraPreviewIds.length;
                          setLoginSelectedLoraPreview(loginSelectedLoraPreviewIds[nextIndex]);
                        }}
                      >
                        &#8592;
                      </button>
                      <button
                        className="lightbox-nav lightbox-nav-right"
                        title="Previous (Arrow Right)"
                        onClick={() => {
                          if (loginSelectedLoraPreviewIndex < 0) return;
                          const prevIndex =
                            (loginSelectedLoraPreviewIndex - 1 + loginSelectedLoraPreviewIds.length) %
                            loginSelectedLoraPreviewIds.length;
                          setLoginSelectedLoraPreview(loginSelectedLoraPreviewIds[prevIndex]);
                        }}
                      >
                        &#8594;
                      </button>
                    </>
                  ) : null}
                  <img
                    className={`lightbox-image lightbox-image-thumb ${loginSelectedLoraPreviewOriginalReady ? "is-faded" : ""}`}
                    src={fileUrl(loginSelectedLoraPreview, "", { thumb: true, size: 1280 })}
                    alt={`${loginSelectedLora?.name ?? "LoRA"} preview thumbnail`}
                    title={`${loginSelectedLora?.name ?? "LoRA"} preview thumbnail`}
                  />
                  <img
                    className={`lightbox-image lightbox-image-original ${loginSelectedLoraPreviewOriginalReady ? "is-ready" : ""}`}
                    src={fileUrl(loginSelectedLoraPreview, "")}
                    alt={`${loginSelectedLora?.name ?? "LoRA"} preview`}
                    title={`${loginSelectedLora?.name ?? "LoRA"} preview`}
                    onLoad={() => setLoginSelectedLoraPreviewOriginalReady(true)}
                    onError={() => setLoginSelectedLoraPreviewOriginalReady(false)}
                  />
                </div>
                <div className="lightbox-help muted small">
                  Keys: Left = next, Right = previous, Up = close
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {loginOpen ? (
          <div className="auth-modal">
            <div className="auth-modal-content panel">
              <div className="panel-header">
                <h3>{t.signIn}</h3>
                <button className="modal-close" onClick={() => setLoginOpen(false)}>
                  Close
                </button>
              </div>
              <LoginForm
                onLogin={(newToken) => {
                  setToken(newToken);
                  setAuthToken(newToken);
                }}
                labels={{ email: t.email, password: t.password, login: t.login }}
              />
            </div>
          </div>
        ) : null}
        {applyOpen ? (
          <div className="auth-modal">
            <div className="auth-modal-content panel">
              <div className="panel-header">
                <h3>Access request</h3>
                <button className="modal-close" onClick={() => setApplyOpen(false)}>
                  Close
                </button>
              </div>
              <div className="form-grid">
                <label className="form-row">
                  Display name
                  <input
                    className="input"
                    value={applyForm.display_name}
                    onChange={(e) => setApplyForm({ ...applyForm, display_name: e.target.value })}
                  />
                </label>
                <label className="form-row">
                  Email
                  <input
                    className="input"
                    type="email"
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                  />
                </label>
                <label className="form-row">
                  Username
                  <input
                    className="input"
                    value={applyForm.handle}
                    onChange={(e) => setApplyForm({ ...applyForm, handle: e.target.value })}
                  />
                </label>
                <label className="form-row">
                  Links
                  <input
                    className="input"
                    placeholder="Portfolio, socials, etc."
                    value={applyForm.links}
                    onChange={(e) => setApplyForm({ ...applyForm, links: e.target.value })}
                  />
                </label>
                <label className="form-row">
                  Motivation
                  <textarea
                    className="input"
                    rows={4}
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                  />
                </label>
                <div className="login-actions">
                  <button className="action-btn" disabled={applySubmitting} onClick={submitApplication}>
                    {applySubmitting ? "Submitting..." : "Submit request"}
                  </button>
                  {applyStatus ? <div className="muted small">{applyStatus}</div> : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const userPermissions = user?.permissions ?? {};
  const canGenerate = userPermissions["generate.create"] !== false;
  const canTrain = userPermissions["train.run"] !== false;
  const canUploadLora = isAdmin || userPermissions["lora.upload"] === true;
  const openProfile = (userId?: string | null) => {
    if (!token || !userId) return;
    fetch(`/api/users/public/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setProfileView(data.profile ?? null);
        setProfileStats(data.stats ?? null);
        setProfileRelationship(data.relationship ?? null);
        setProfileModels(data.models ?? []);
        setProfileLoras(data.loras ?? []);
        setProfileImages(data.images ?? []);
        setProfileReturnView(view);
        setView("profile");
      })
      .catch(() => null);
  };
  const toggleProfileFollow = () => {
    if (!token || !profileView?.id || !profileRelationship || profileRelationship.is_self || profileFollowBusy) return;
    setProfileFollowBusy(true);
    const method = profileRelationship.is_following ? "DELETE" : "POST";
    fetch(`/api/users/${profileView.id}/follow`, {
      method,
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) return;
        const nextFollowing = !profileRelationship.is_following;
        setProfileRelationship({ ...profileRelationship, is_following: nextFollowing });
        setProfileStats((prev) =>
          prev
            ? {
                ...prev,
                followers: Math.max(0, Number(prev.followers ?? 0) + (nextFollowing ? 1 : -1))
              }
            : prev
        );
      })
      .finally(() => setProfileFollowBusy(false));
  };
  const updateNotificationPref = (key: keyof NotificationPrefs, enabled: boolean) => {
    if (!token) return;
    setNotificationSaving((prev) => ({ ...prev, [key]: true }));
    fetch("/api/notifications/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ settings: { [key]: enabled } })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) return;
        setNotificationPrefs((prev) => ({ ...prev, [key]: enabled }));
      })
      .finally(() => setNotificationSaving((prev) => ({ ...prev, [key]: false })));
  };
  const refreshTwoFaStatus = () => {
    if (!token) return;
    fetch("/api/auth/2fa/status", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setTwoFaStatus({ ...DEFAULT_2FA_STATUS, ...(data ?? {}) }))
      .catch(() => setTwoFaStatus(DEFAULT_2FA_STATUS));
  };
  const startSecurityOnboarding = () => {
    if (!token) return;
    setSecurityBusy(true);
    setSecurityStatusMsg("Starting security onboarding...");
    fetch("/api/auth/2fa/onboarding/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error) {
          setSecurityStatusMsg(humanizeErrorCode(data?.error ?? "Could not start onboarding."));
          return;
        }
        setSecurityWizardSecret(String(data.secret ?? ""));
        setSecurityWizardUri(String(data.otpauth_uri ?? ""));
        setSecurityWizardCode("");
        setSecurityRecoveryCodes([]);
        setSecurityWizardStep(2);
        setSecurityWizardOpen(true);
        setSecurityStatusMsg("Scan secret in Google Authenticator and verify.");
      })
      .catch(() => setSecurityStatusMsg("Could not start onboarding."))
      .finally(() => setSecurityBusy(false));
  };
  const verifySecurityOnboarding = () => {
    if (!token) return;
    setSecurityBusy(true);
    setSecurityStatusMsg("Verifying TOTP...");
    fetch("/api/auth/2fa/onboarding/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code: securityWizardCode })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error) {
          setSecurityStatusMsg(humanizeErrorCode(data?.error ?? "TOTP verification failed."));
          return;
        }
        setSecurityRecoveryCodes(Array.isArray(data.recovery_sequences) ? data.recovery_sequences : []);
        setSecurityWizardStep(3);
        setSecurityStatusMsg("Security onboarding completed.");
        refreshTwoFaStatus();
      })
      .catch(() => setSecurityStatusMsg("TOTP verification failed."))
      .finally(() => setSecurityBusy(false));
  };
  const disableTwoFa = () => {
    if (!token) return;
    setSecurityBusy(true);
    setSecurityStatusMsg("Disabling 2FA...");
    fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        password: securityDisablePassword,
        code: securityDisableCode,
        emergency_sequence: securityDisableEmergency
      })
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data?.error) {
          setSecurityStatusMsg(humanizeErrorCode(data?.error ?? "Disable failed."));
          return;
        }
        setSecurityDisablePassword("");
        setSecurityDisableCode("");
        setSecurityDisableEmergency("");
        setSecurityWizardOpen(false);
        setSecurityWizardStep(1);
        setSecurityRecoveryCodes([]);
        setSecurityStatusMsg("2FA disabled. You can re-run Security Onboarding.");
        refreshTwoFaStatus();
      })
      .catch(() => setSecurityStatusMsg("Disable failed."))
      .finally(() => setSecurityBusy(false));
  };
  const markNotificationRead = (id: string) => {
    if (!token) return;
    fetch(`/api/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        const shouldDecrement = notificationList.some((entry) => entry.id === id && !entry.read_at);
        const now = new Date().toISOString();
        setNotificationList((prev) =>
          prev.map((entry) => (entry.id === id ? { ...entry, read_at: entry.read_at ?? now } : entry))
        );
        if (shouldDecrement) {
          setNotificationUnread((prev) => Math.max(0, prev - 1));
        }
      })
      .catch(() => null);
  };
  const markAllNotificationsRead = () => {
    if (!token) return;
    fetch("/api/notifications/read-all", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        const now = new Date().toISOString();
        setNotificationList((prev) => prev.map((entry) => ({ ...entry, read_at: entry.read_at ?? now })));
        setNotificationUnread(0);
      })
      .catch(() => null);
  };
  const canManageGalleryImage = (img?: { user_id?: string }) => {
    if (!img?.user_id || !user) return false;
    return img.user_id === user.id || isAdmin;
  };
  const toggleGalleryBulkMode = () => {
    setGalleryBulkMode((prev) => {
      const next = !prev;
      if (!next) {
        setGalleryBulkSelection([]);
        setGalleryBulkMessage("");
      }
      return next;
    });
  };
  const toggleGalleryBulkSelection = (imageId: string) => {
    setGalleryBulkSelection((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
    );
  };
  const runGalleryBulkAction = (action: "public" | "private" | "delete") => {
    if (!token || galleryBulkBusy || galleryBulkSelection.length === 0) return;
    const selectedIds = [...galleryBulkSelection];
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`
    };
    setGalleryBulkBusy(true);
    setGalleryBulkMessage("");
    Promise.allSettled(
      selectedIds.map((id) => {
        if (action === "delete") {
          return fetch(`/api/gallery/images/${id}`, {
            method: "DELETE",
            headers
          });
        }
        return fetch(`/api/gallery/images/${id}/public`, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ is_public: action === "public" })
        });
      })
    )
      .then((results) => {
        const success = results.filter((row) => row.status === "fulfilled" && row.value.ok).length;
        const failed = results.length - success;
        if (action === "delete" && selectedImage && selectedIds.includes(selectedImage.id)) {
          setSelectedImage(null);
          setSelectedMeta(null);
          setSelectedComments([]);
        }
        setGalleryBulkSelection([]);
        refreshGalleryImages();
        const actionLabel = action === "delete" ? "deleted" : action === "public" ? "set public" : "set private";
        setGalleryBulkMessage(`Bulk action complete: ${success} ${actionLabel}${failed ? `, ${failed} failed` : ""}.`);
      })
      .catch(() => setGalleryBulkMessage("Bulk action failed."))
      .finally(() => setGalleryBulkBusy(false));
  };
  const openGalleryImage = (imageId: string) => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`/api/gallery/images/${imageId}`, { headers }).then((res) => res.json()),
      fetch(`/api/gallery/images/${imageId}/comments`, { headers }).then((res) => res.json())
    ])
      .then(([detail, comments]) => {
        if (detail?.error) return;
        setSelectedImage(detail.image ?? null);
        setSelectedMeta({
          likes: detail.likes ?? 0,
          comments: detail.comments ?? 0,
          user_liked: Boolean(detail.user_liked)
        });
        setSelectedModelLabel(detail.model_label ?? "");
        setSelectedLoraLabels(Array.isArray(detail.lora_labels) ? detail.lora_labels : []);
        setSelectedComments(comments.comments ?? []);
        setCommentDraft("");
      })
      .catch(() => null);
  };
  const openGalleryModel = (modelId: string) => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`/api/gallery/models/${modelId}`, { headers }).then((res) => res.json()),
      fetch(`/api/gallery/models/${modelId}/comments`, { headers }).then((res) => res.json())
    ])
      .then(([detail, comments]) => {
        if (detail?.error) return;
        setSelectedModel(detail.model ?? null);
        setSelectedModelImages(detail.images ?? []);
        setSelectedModelMeta({
          likes: detail.likes ?? 0,
          comments: detail.comments ?? 0,
          user_liked: Boolean(detail.user_liked)
        });
        setSelectedModelComments(comments.comments ?? []);
        setModelCommentDraft("");
      })
      .catch(() => null);
  };
  const openLoraEntry = (entry: LoraEntry) => {
    setSelectedLoraEntry(entry);
    setLoraDetailPreviewOffset(0);
    setLoraDescriptionDraft(entry.description ?? "");
    setLoraNameDraft(entry.name ?? "");
    setLoraTriggerDraft(entry.trigger_token ?? entry.activator_token ?? "");
    setLoraDetailEditing(false);
    setLoraDescriptionEditing(false);
    setLoraDescriptionStatus("");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`/api/loras/${entry.id}`, { headers }).then((res) => res.json()),
      fetch(`/api/loras/${entry.id}/comments`, { headers }).then((res) => res.json())
    ])
      .then(([detail, comments]) => {
        const merged = { ...entry, ...(detail.lora ?? {}) };
        setSelectedLoraEntry(merged);
        setLoraDescriptionDraft(merged.description ?? "");
        setLoraNameDraft(merged.name ?? "");
        setLoraTriggerDraft(merged.trigger_token ?? merged.activator_token ?? "");
        setSelectedLoraMeta({
          likes: detail.likes ?? 0,
          comments: detail.comments ?? 0,
          user_liked: Boolean(detail.user_liked)
        });
        setSelectedLoraComments(comments.comments ?? []);
        setLoraCommentDraft("");
      })
      .catch(() => null);
  };

  const applyLoraEntryPatch = (loraId: string, patch: Partial<LoraEntry>) => {
    setSelectedLoraEntry((prev) => (prev && prev.id === loraId ? { ...prev, ...patch } : prev));
    setLoraEntries((prev) => prev.map((entry) => (entry.id === loraId ? { ...entry, ...patch } : entry)));
    setProfileLoras((prev) => prev.map((entry) => (entry.id === loraId ? { ...entry, ...patch } : entry)));
  };

  return (
    <div className={`app-shell ${isMobileRouteActive ? "mobile-route" : ""}`}>
      {isMobileRouteActive ? (
        <>
          <header className="mobile-topbar">
            <div className="mobile-topbar-brand">
              <div className="brand-title">FrameWorkX</div>
              <div className="brand-subtitle">Mobile Console</div>
            </div>
            <div className="mobile-topbar-actions">
              <button
                type="button"
                className="action-btn ghost mobile-notify-btn"
                onClick={() => setNotificationWidgetOpen((prev) => !prev)}
              >
                🔔
                {notificationUnread > 0 ? <span className="notify-count">{notificationUnread}</span> : null}
              </button>
              <button
                type="button"
                className="action-btn mobile-menu-btn"
                onClick={() => {
                  setNotificationWidgetOpen(false);
                  setMobileMenuOpen((prev) => !prev);
                }}
              >
                ☰
              </button>
            </div>
          </header>
          {notificationWidgetOpen ? (
            <div className="mobile-notify-panel">
              <div className="notify-popout-head">
                <span>Notifications</span>
                <button className="action-btn ghost" onClick={() => markAllNotificationsRead()}>
                  Read all
                </button>
              </div>
              <div className="notify-popout-list">
                {notificationList.length === 0 ? (
                  <div className="muted small">No notifications.</div>
                ) : (
                  [...notificationList]
                    .sort((a, b) => {
                      const scoreA = a.read_at ? 1 : 0;
                      const scoreB = b.read_at ? 1 : 0;
                      if (scoreA !== scoreB) return scoreA - scoreB;
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })
                    .slice(0, 8)
                    .map((item) => (
                      <button
                        key={`mobile-notify-${item.id}`}
                        className={`notify-item ${item.read_at ? "is-read" : "is-unread"}`}
                        onClick={() => {
                          if (!item.read_at) markNotificationRead(item.id);
                        }}
                      >
                        <span className="notify-item-title">{item.title}</span>
                        <span className="notify-item-body">{item.body ?? ""}</span>
                      </button>
                    ))
                )}
              </div>
            </div>
          ) : null}
          {mobileMenuOpen ? (
            <div className="mobile-menu-panel">
              <div className="mobile-drawer-head">
                <div>
                  <div className="brand-title">Navigation</div>
                  <div className="muted small">@{user?.username ?? "user"}</div>
                </div>
                <button type="button" className="action-btn ghost" onClick={() => setMobileMenuOpen(false)}>
                  Close
                </button>
              </div>
              <div className="mobile-drawer-status">
                <div className="stat-row">
                  <span>Queue</span>
                  <span>{activeQueueItems.length}</span>
                </div>
                <div className="stat-row">
                  <span>Jobs</span>
                  <span>{activeJobs.length}</span>
                </div>
                <div className="stat-row">
                  <span>Credits</span>
                  <span>{user?.credits_balance ?? 0}</span>
                </div>
              </div>
              <nav className="mobile-drawer-nav">
                {nav.map((key) => {
                  const locked = (key === "generator" && !canGenerate) || (key === "pipeline" && !canTrain);
                  return (
                    <button
                      key={`mobile-${key}`}
                      type="button"
                      className={`mobile-nav-btn ${view === key ? "is-active" : ""}`}
                      disabled={locked}
                      onClick={() => setView(key)}
                    >
                      {t[key]}
                    </button>
                  );
                })}
                {isAdmin ? (
                  <button
                    type="button"
                    className={`mobile-nav-btn ${view === "admin" ? "is-active" : ""}`}
                    onClick={() => {
                      setView("admin");
                      setAdminTab("queue");
                    }}
                  >
                    Admin Settings
                  </button>
                ) : null}
              </nav>
              <div className="mobile-drawer-foot">
                <div className="lang-switch">
                  <button type="button" onClick={() => setLang("en")}>EN</button>
                  <button type="button" onClick={() => setLang("de")}>DE</button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      <aside className="rail">
        <div className="brand">
          <div className="logo">
            <img src="/logo.png" alt="FrameWorkX logo" loading="eager" decoding="async" />
          </div>
        </div>
        <nav className="rail-nav">
          {nav.map((key) => {
            const locked = (key === "generator" && !canGenerate) || (key === "pipeline" && !canTrain);
            return (
              <button
                key={key}
                className={`rail-btn ${view === key ? "is-active" : ""} ${locked ? "is-disabled" : ""}`}
                onClick={() => {
                  if (locked) return;
                  setView(key);
                }}
              >
                {t[key]}
              </button>
            );
          })}
        </nav>
        <div className="rail-status">
          <div className="rail-status-title">Live</div>
          <div className="rail-status-grid">
            <div className="rail-stat">
              <div className="label">
                <span className="status-dot"></span>Queue
              </div>
              <div className="value">{activeQueueItems.length}</div>
            </div>
            <div className="rail-stat">
              <div className="label">Jobs</div>
              <div className="value">{activeJobs.length}</div>
            </div>
            <div className="rail-stat">
              <div className="label">Trainer</div>
              <div className="value">{activePipelineRuns.length}</div>
            </div>
            <div className="rail-stat">
              <div className="label">Training</div>
              <div className="value">{activeTrainingRuns.length}</div>
            </div>
          </div>
          <div className="rail-divider"></div>
          <div className="rail-status-title">Credits</div>
          <div className="rail-status-grid">
            <div className="rail-stat">
              <div className="label">Available</div>
              <div className="value credit-available">{user?.credits_balance ?? 0}</div>
            </div>
            <div className="rail-stat">
              <div className="label">Reserved</div>
              <div className="value credit-reserved">{user?.credits_reserved ?? 0}</div>
            </div>
            <div className="rail-stat">
              <div className="label">Daily grant</div>
              <div className="value credit-daily">{user?.credits_daily_allowance ?? 0}</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div></div>
          <div className="top-actions">
            {isAdmin ? (
              <button
                className="action-btn"
                onClick={() => {
                  setView("admin");
                  setAdminTab("queue");
                }}
              >
                Admin Settings
              </button>
            ) : null}
            <div className="notify-widget">
              <button
                className={`action-btn ghost notify-btn ${notificationWidgetOpen ? "is-active" : ""} ${
                  notificationPulse ? "is-pulse" : ""
                }`}
                onClick={() => {
                  setUserMenuOpen(false);
                  setNotificationWidgetOpen((prev) => !prev);
                  setNotificationPulse(false);
                }}
              >
                <span>Notifications</span>
                {notificationUnread > 0 ? <span className="notify-count">{notificationUnread}</span> : null}
              </button>
              {notificationWidgetOpen ? (
                <div className="notify-popout">
                  <div className="notify-popout-head">
                    <span>Notifications</span>
                    <button
                      className="action-btn ghost"
                      onClick={() => {
                        markAllNotificationsRead();
                      }}
                    >
                      Read all
                    </button>
                  </div>
                  <div className="notify-popout-list">
                    {notificationList.length === 0 ? (
                      <div className="muted small">No notifications.</div>
                    ) : (
                      [...notificationList]
                        .sort((a, b) => {
                          const scoreA = a.read_at ? 1 : 0;
                          const scoreB = b.read_at ? 1 : 0;
                          if (scoreA !== scoreB) return scoreA - scoreB;
                          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        })
                        .slice(0, 8)
                        .map((item) => (
                          <button
                            key={item.id}
                            className={`notify-item ${item.read_at ? "is-read" : "is-unread"}`}
                            onClick={() => {
                              if (!item.read_at) markNotificationRead(item.id);
                            }}
                          >
                            <span className="notify-item-title">{item.title}</span>
                            <span className="notify-item-body">{item.body ?? ""}</span>
                          </button>
                        ))
                    )}
                  </div>
                  <div className="notify-popout-foot">
                    <button
                      className="action-btn ghost"
                      onClick={() => {
                        setView("settings");
                        setNotificationWidgetOpen(false);
                      }}
                    >
                      Open Notification Center
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="user-menu" ref={userMenuRef}>
              <button
                className={`action-btn ghost user-menu-btn ${userMenuOpen ? "is-active" : ""}`}
                onClick={() => {
                  setNotificationWidgetOpen(false);
                  setUserMenuOpen((prev) => !prev);
                }}
              >
                {user?.username ? `@${user.username}` : "Account"}
              </button>
              {userMenuOpen ? (
                <div className="user-menu-popout">
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      openProfile(user?.id);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setView("edit_profile");
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setView("settings");
                    }}
                  >
                    Settings
                  </button>
                  <button className="user-menu-item is-disabled" disabled>
                    Favorites (soon)
                  </button>
                  <button
                    className="user-menu-item is-danger"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setNotificationWidgetOpen(false);
                      setToken("");
                      setAuthToken("");
                      setView("dashboard");
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
            <div className="lang-switch">
              <button onClick={() => setLang("en")}>EN</button>
              <button onClick={() => setLang("de")}>DE</button>
            </div>
          </div>
        </header>
        <main className="content">
          <section className={`view ${view === "dashboard" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>{t.commandDeck}</h1>
            </div>
            {isMobileRouteActive ? (
              <div className="mobile-command-deck">
                <div className="mobile-command-stats">
                  <div className="mobile-stat-card">
                    <span>Running</span>
                    <strong>{mobileDashboardJobs.filter((row) => row.status === "running").length}</strong>
                  </div>
                  <div className="mobile-stat-card">
                    <span>Queued</span>
                    <strong>
                      {
                        mobileDashboardJobs.filter((row) =>
                          ["queued", "queued_initiated", "ready_to_train", "manual_tagging"].includes(row.status)
                        ).length
                      }
                    </strong>
                  </div>
                  <div className="mobile-stat-card">
                    <span>Failed</span>
                    <strong>{mobileDashboardJobs.filter((row) => row.status === "failed").length}</strong>
                  </div>
                  <div className="mobile-stat-card">
                    <span>Train</span>
                    <strong>{dashboardTraining.filter((run) => run.status === "running").length}</strong>
                  </div>
                </div>
                <div className="mobile-job-list">
                  {mobileDashboardJobs.length === 0 ? (
                    <div className="muted small">No jobs.</div>
                  ) : (
                    mobileDashboardJobs.map((row) => (
                      <button
                        key={`mobile-job-${row.kind}-${row.id}`}
                        className={`mobile-job-card is-${row.status}`}
                        onClick={() => openDashboardModal(row.kind, row.id, row.phase)}
                      >
                        <div className="mobile-job-top">
                          <div className="mobile-job-title">{row.name}</div>
                          <span className="badge">{row.status}</span>
                        </div>
                        <div className="mobile-job-id">{row.id}</div>
                        {row.progressPct != null ? (
                          <div className="progress">
                            <span style={{ width: `${row.progressPct}%` }} />
                          </div>
                        ) : null}
                        <div className="mobile-job-meta">{row.meta.join(" • ") || row.phase}</div>
                      </button>
                    ))
                  )}
                  {mobileCompletedJobsCount > 0 ? (
                    <button
                      className="action-btn ghost mobile-show-completed-btn"
                      onClick={() => setMobileShowCompletedJobs((prev) => !prev)}
                    >
                      {mobileShowCompletedJobs
                        ? "Hide completed jobs"
                        : `Show completed jobs (${mobileCompletedJobsCount})`}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="dashboard-grid">
              <section className="panel task-column">
                <div className="panel-header">
                  <h3>Tasks</h3>
                  <span className="badge">Queue</span>
                </div>
                <div className="task-group">
                  <div className="mini-header">
                    <span>Active training</span>
                    <span className="badge">Live</span>
                  </div>
                  {dashboardTraining.filter((run) => run.status === "running").length === 0 ? (
                    <div className="muted small">No active training.</div>
                  ) : (
                    dashboardTraining
                      .filter((run) => run.status === "running")
                      .map((run) => (
                        <button
                          key={run.id}
                          className="task-row active-row"
                          onClick={() => openDashboardModal("training", run.id, "train")}
                        >
                          <span>{run.name ?? run.id}</span>
                          <span>{run.status}</span>
                        </button>
                      ))
                  )}
                </div>
                <div className="task-group">
                  <div className="mini-header">
                    <span>Queue</span>
                    <span className="badge">Pipeline</span>
                  </div>
                  {dashboardQueueMsg ? <div className="muted small">{dashboardQueueMsg}</div> : null}
                  {dashboardQueue.length === 0 ? (
                    <div className="muted small">Queue empty.</div>
                  ) : (
                    dashboardQueue.map((item) => (
                      <div key={`${item.item_type ?? "pipeline"}-${item.id}-${item.position ?? "na"}`} className="task-row-wrap">
                        <button
                          className="task-row"
                          onClick={() =>
                            item.item_type === "training"
                              ? openDashboardModal("training", item.id, "train_pre")
                              : openDashboardModal("pipeline", item.id, "prep")
                          }
                        >
                          <span>{item.name}</span>
                          <span>
                            {item.item_type === "training"
                              ? `training • ${item.status}`
                              : item.position != null
                                ? `#${item.position}`
                                : item.status}
                          </span>
                        </button>
                        {reorderableDashboardQueueIds.has(item.id) ? (
                          <div className="task-row-controls">
                            <button
                              className="action-btn ghost"
                              disabled={dashboardQueueMovePending === item.id}
                              onClick={() => reorderDashboardQueueItem(item, "up")}
                            >
                              Up
                            </button>
                            <button
                              className="action-btn ghost"
                              disabled={dashboardQueueMovePending === item.id}
                              onClick={() => reorderDashboardQueueItem(item, "down")}
                            >
                              Down
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="panel phase-column">
                <div className="panel-header">
                  <h3>Prep-Phase</h3>
                  <span className="badge">Dataset</span>
                </div>
                {prepPhaseRuns.length === 0 ? (
                  <div className="muted small">No jobs.</div>
                ) : (
                  prepPhaseRuns.map((run) => (
                    <button
                      key={run.id}
                      className={`phase-card ${run.status === "running" ? "active-row" : ""}`}
                      onClick={() => openDashboardModal("pipeline", run.id, "prep")}
                    >
                      <div className="title">{run.name}</div>
                      <div className="meta">
                        <span>{run.status}</span>
                        <span>{run.image_count ?? 0} imgs</span>
                      </div>
                    </button>
                  ))
                )}
              </section>

              <section className="panel phase-column">
                <div className="panel-header">
                  <h3>Train-Pre-Phase</h3>
                  <span className="badge">Plan</span>
                </div>
                {trainPrePhaseRuns.length === 0 ? (
                  <div className="muted small">No jobs.</div>
                ) : (
                  trainPrePhaseRuns.map((run: any) => (
                    <button
                      key={run.id}
                      className={`phase-card ${run.status === "running" ? "active-row" : ""}`}
                      onClick={() => openDashboardModal(run.pipeline_run_id ? "training" : "pipeline", run.id, "train_pre")}
                    >
                      <div className="title">{run.name ?? run.id}</div>
                      <div className="meta">
                        <span>{run.status}</span>
                        <span>{run.image_count ?? 0} imgs</span>
                      </div>
                    </button>
                  ))
                )}
              </section>

              <section className="panel phase-column">
                <div className="panel-header">
                  <h3>Train-Phase</h3>
                  <span className="badge">GPU</span>
                </div>
                {trainPhaseRuns.length === 0 ? (
                  <div className="muted small">No jobs.</div>
                ) : (
                  trainPhaseRuns.map((run) => (
                    <button
                      key={run.id}
                      className={`phase-card ${run.status === "running" ? "active-row" : ""}`}
                      onClick={() => openDashboardModal("training", run.id, "train")}
                    >
                      <div className="title">{run.name ?? run.id}</div>
                      <div className="meta">
                        <span>{run.status}</span>
                        <span>{run.image_count ?? 0} imgs</span>
                      </div>
                    </button>
                  ))
                )}
              </section>

              <section className="panel phase-column">
                <div className="panel-header">
                  <h3>Finishing-Phase</h3>
                  <span className="badge">Wrap</span>
                </div>
                {finishingPhaseRuns.length === 0 ? (
                  <div className="muted small">No jobs.</div>
                ) : (
                  finishingPhaseRuns.map((run) => (
                    <button
                      key={run.id}
                      className={`phase-card ${run.status === "running" ? "active-row" : ""}`}
                      onClick={() => openDashboardModal("training", run.id, "finishing")}
                    >
                      <div className="title">{run.name ?? run.id}</div>
                      <div className="meta">
                        <span>{run.status}</span>
                        <span>{run.image_count ?? 0} imgs</span>
                      </div>
                    </button>
                  ))
                )}
              </section>
            </div>

            {dashboardModalOpen ? (
              <div className="modal-overlay">
                <div className="dashboard-modal">
                  <div className="manual-header">
                    <div>
                      <div className="title">Job Details</div>
                      <div className="muted small">{dashboardModalData?.name ?? dashboardModalData?.id}</div>
                      <div className="muted small">{dashboardModalData?.id}</div>
                      {dashboardModalLastUpdated ? (
                        <div className="muted small">
                          Live update: {new Date(dashboardModalLastUpdated).toLocaleTimeString()}
                        </div>
                      ) : null}
                    </div>
                    <button
                      className="action-btn ghost"
                      onClick={() => {
                        setDashboardModalOpen(false);
                        setDashboardModalId(null);
                        setDashboardPreviewLightbox(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                  <div className="manual-body">
                    <div className="detail-group">
                      <div className="detail-title">Status</div>
                      <div className="job-status-layout with-cover">
                        {
                          <button
                            className="job-cover-frame"
                            onClick={() => {
                              if (dashboardDatasetCoverFileId) {
                                setDashboardPreviewLightbox(dashboardDatasetCoverFileId);
                                return;
                              }
                              if (dashboardDatasetCoverUrl) {
                                setDashboardPreviewLightbox(dashboardDatasetCoverUrl);
                              }
                            }}
                            disabled={!dashboardDatasetCoverFileId && !dashboardDatasetCoverUrl}
                            title="Open dataset image"
                          >
                            {dashboardDatasetCoverFileId || dashboardDatasetCoverUrl ? (
                              <img
                                src={
                                  dashboardDatasetCoverFileId
                                    ? fileUrl(dashboardDatasetCoverFileId, token, { thumb: true, size: 384 })
                                    : withToken(String(dashboardDatasetCoverUrl ?? ""), token)
                                }
                                alt="Dataset cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="job-cover-empty">No dataset image</div>
                            )}
                          </button>
                        }
                        <div className="job-status-table">
                          <div className="stat-row">
                            <span>Phase</span>
                            <span>{dashboardModalPhase}</span>
                          </div>
                          <div className="stat-row">
                            <span>State</span>
                            <span>{resolveDashboardModalStatus()}</span>
                          </div>
                          <div className="stat-row">
                            <span>Images</span>
                            <span>{dashboardModalImageCount ?? 0}</span>
                          </div>
                          {dashboardModalKind === "training" ? (
                            <>
                              <div className="stat-row">
                                <span>Progress</span>
                                <span>
                                  {dashboardModalData?.progress_pct != null ? `${dashboardModalData.progress_pct}%` : "-"}
                                </span>
                              </div>
                              <div className="stat-row">
                                <span>Epoch</span>
                                <span>
                                  {dashboardModalData?.epoch ?? "-"} / {dashboardModalData?.epoch_total ?? "-"}
                                </span>
                              </div>
                              <div className="stat-row">
                                <span>Step</span>
                                <span>
                                  {dashboardModalData?.step ?? "-"} / {dashboardModalData?.step_total ?? "-"}
                                </span>
                              </div>
                              <div className="stat-row">
                                <span>ETA</span>
                                <span>{formatEta(dashboardModalData?.eta_seconds)}</span>
                              </div>
                              <div className="stat-row">
                                <span>Last loss</span>
                                <span>
                                  {dashboardModalData?.last_loss != null
                                    ? Number(dashboardModalData.last_loss).toFixed(4)
                                    : "-"}
                                </span>
                              </div>
                            </>
                          ) : null}
                          <div className="stat-row">
                            <span>Actions</span>
                            <span className="job-actions">
                              {dashboardModalKind === "pipeline" ? (
                                <>
                                  <button
                                    className="action-btn ghost"
                                    disabled={dashboardModalData?.status === "running"}
                                    onClick={() => {
                                      if (dashboardModalData?.id) cancelPipelineRun(dashboardModalData.id);
                                    }}
                                  >
                                    Stop
                                  </button>
                                  <button
                                    className="action-btn"
                                    disabled={!["failed", "cancelled", "stopped"].includes(String(dashboardModalData?.status ?? ""))}
                                    onClick={() => {
                                      if (dashboardModalData?.id) retryPipelineRun(dashboardModalData.id);
                                    }}
                                  >
                                    Retry
                                  </button>
                                  <button
                                    className="action-btn danger"
                                    disabled={dashboardModalData?.status === "running"}
                                    onClick={() => {
                                      if (dashboardModalData?.id) deletePipelineRun(dashboardModalData.id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="action-btn ghost"
                                    disabled={["running", "removing"].includes(String(dashboardModalData?.status ?? ""))}
                                    onClick={() => {
                                      if (dashboardModalData?.id) cancelTrainingRun(dashboardModalData.id);
                                    }}
                                  >
                                    Stop
                                  </button>
                                  <button
                                    className="action-btn"
                                    disabled={
                                      !["failed", "cancelled", "stopped", "completed", "remove_failed"].includes(
                                        String(dashboardModalData?.status ?? "")
                                      )
                                    }
                                    onClick={() => {
                                      if (dashboardModalData?.id) retryTrainingRun(dashboardModalData.id);
                                    }}
                                  >
                                    Retry
                                  </button>
                                  <button
                                    className="action-btn danger"
                                    disabled={["running", "removing"].includes(String(dashboardModalData?.status ?? ""))}
                                    onClick={() => {
                                      if (dashboardModalData?.id) deleteTrainingRun(dashboardModalData.id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </span>
                          </div>
                          {(dashboardModalData?.error_message || dashboardModalEvents.length > 0) ? (
                            <div className="stat-row">
                              <span>Error log</span>
                              <button
                                className="info-btn"
                                onClick={() => setDashboardErrorOpen(true)}
                                title="Show error log"
                              >
                                I
                              </button>
                            </div>
                          ) : null}
                          {dashboardModalKind === "pipeline" && dashboardModalData?.status === "manual_tagging" ? (
                            <div className="stat-row">
                              <span>Manual tagging</span>
                              <button
                                className="action-btn"
                                onClick={() => {
                                  setDashboardModalOpen(false);
                                  openManualEditor(dashboardModalData.id, dashboardModalData.name ?? dashboardModalData.id);
                                }}
                              >
                                Continue
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="detail-group">
                      <div className="detail-title">Phase Steps</div>
                      {dashboardModalSteps.length === 0 ? (
                        <div className="muted small">No steps yet.</div>
                      ) : (
                        dashboardModalSteps.map((step) => (
                          <div key={step.step} className="stat-row">
                            <span>{step.step}</span>
                            <span>{step.status}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="detail-group">
                      <div className="detail-title">Previews</div>
                      {dashboardModalPreviews.length === 0 && dashboardTrainingPreviewGroups.length === 0 ? (
                        <div className="muted small">No previews yet.</div>
                      ) : (
                        <div className="preview-sections">
                          {dashboardTrainingPreviewGroups.map((group) => (
                            <div key={group.key} className="preview-section">
                              <div className="muted small">{group.label}</div>
                              <div className="preview-grid">
                                {group.items.map((row) => (
                                  <button
                                    key={row.file_id}
                                    className="preview-tile"
                                    onClick={() => setDashboardPreviewLightbox(row.file_id)}
                                  >
                                    <img className="preview-thumb" src={fileUrl(row.file_id, token, { thumb: true, size: 384 })} alt="Job preview" loading="lazy" decoding="async" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          {dashboardModalPreviews.length > 0 ? (
                            <div className="preview-section">
                              <div className="muted small">Pipeline Previews</div>
                              <div className="preview-grid">
                                {Array.from(new Set(dashboardModalPreviews)).map((fileId) => (
                                  <button
                                    key={fileId}
                                    className="preview-tile"
                                    onClick={() => setDashboardPreviewLightbox(fileId)}
                                  >
                                    <img className="preview-thumb" src={fileUrl(fileId, token, { thumb: true, size: 384 })} alt="Job preview" loading="lazy" decoding="async" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {dashboardPreviewLightbox ? (
              <div className="image-modal">
                <div className="image-modal-content">
                  <button className="modal-close" onClick={() => setDashboardPreviewLightbox(null)}>
                    Close
                  </button>
                  <div className="modal-body">
                    <div className="modal-image">
                      <img
                        src={
                          dashboardPreviewLightbox.startsWith("/api/")
                            ? withToken(dashboardPreviewLightbox, token)
                            : fileUrl(dashboardPreviewLightbox, token)
                        }
                        alt="Job preview"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {dashboardErrorOpen ? (
              <div className="modal-overlay">
                <div className="dashboard-modal error-modal">
                  <div className="manual-header">
                    <div>
                      <div className="title">Error Log</div>
                      <div className="muted small">{dashboardModalData?.name ?? dashboardModalId}</div>
                    </div>
                    <button className="action-btn ghost" onClick={() => setDashboardErrorOpen(false)}>
                      Close
                    </button>
                  </div>
                  <div className="manual-body">
                    {dashboardModalData?.error_message ? (
                      <div className="panel error-panel">
                        <div className="panel-header">
                          <h3>Latest Error</h3>
                        </div>
                        <div className="muted small">{dashboardModalData.error_message}</div>
                      </div>
                    ) : null}
                    <div className="panel error-panel">
                      <div className="panel-header">
                        <h3>Events</h3>
                      </div>
                      {dashboardModalEvents.length === 0 ? (
                        <div className="muted small">No error events recorded.</div>
                      ) : (
                        <div className="error-list">
                          {dashboardModalEvents.map((evt, idx) => (
                            <div key={`${evt.created_at}-${idx}`} className="stat-row">
                              <span>{evt.level ?? "info"}</span>
                              <span>{evt.message ?? "-"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className={`view ${view === "pipeline" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>{t.pipeline}</h1>
              <p>Upload management & pipeline queue</p>
            </div>
            {!canTrain ? (
              <section className="panel">
                <div className="panel-header">
                  <h3>Training locked</h3>
                  <span className="badge">Admin</span>
                </div>
                <div className="muted small">Training access is disabled for this account.</div>
              </section>
            ) : (
            <div className="wizard-launch">
              <section className="panel">
                <div className="panel-header">
                  <h3>Training Wizard</h3>
                  <span className="badge">Required</span>
                </div>
                <div className="form-grid">
                  <div className="muted small">
                    Start training via the wizard. It validates triggers, previews credits, and walks you through all
                    required steps.
                  </div>
                  <button className="action-btn" onClick={openTrainerWizard}>
                    Start Training Wizard
                  </button>
                </div>
              </section>
            </div>
            )}
          </section>

          <section className={`view ${view === "generator" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>{t.generator}</h1>
              <p>{t.previewOutput}</p>
            </div>
            {!canGenerate ? (
              <section className="panel">
                <div className="panel-header">
                  <h3>Generator locked</h3>
                  <span className="badge">Admin</span>
                </div>
                <div className="muted small">Generator access is disabled for this account.</div>
              </section>
            ) : (
            <div className="grid generator-grid">
              <section className="panel">
                <div className="panel-header">
                  <h3>Prompt</h3>
                  <span className="badge">MJOLNIR</span>
                </div>
                <div className="form-grid">
                  <label className="form-row">
                    Prompt
                    <textarea
                      className="input"
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </label>
                  <label className="form-row">
                    Negative
                    <textarea
                      className="input"
                      rows={3}
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                    />
                  </label>
                  <label className="form-row">
                    Base Model
                    <select
                      className="input"
                      value={modelId}
                      onChange={(e) => {
                        setModelId(e.target.value);
                        setLastModelId(e.target.value);
                      }}
                    >
                      <option value="">Select model</option>
                      {modelRegistry
                        .filter((model) => model.kind === "training_model" || model.kind === "base_model")
                        .map((model) => (
                          <option key={model.id} value={model.file_id ?? ""}>
                            {model.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  {selectedLoraId ? (
                    <div className="form-grid">
                      <div className="form-row">LoRA</div>
                      <div className="lora-row">
                        <input className="input" value={selectedLoraName || "Selected LoRA"} readOnly />
                        <input
                          className="input"
                          type="number"
                          step="0.05"
                          min="0.1"
                          max="1"
                          value={selectedLoraWeight}
                          onChange={(event) => setSelectedLoraWeight(Number(event.target.value))}
                        />
                      </div>
                      <button className="action-btn ghost" onClick={() => setSelectedLoraId("")}>
                        Clear LoRA
                      </button>
                    </div>
                  ) : null}
                  <button
                    className="action-btn"
                    onClick={() => {
                      if (!prompt) return;
                      if (wildcardPreview.missing.length) {
                        setGenerateMessage(`Missing wildcard list: ${wildcardPreview.missing.join(", ")}`);
                        return;
                      }
                      setGenerateMessage("Submitting...");
                      const { width, height } = parseRatio(ratio);
                      const parsedSeed = Number(seed);
                      const loraFiles = selectedLoraId ? [selectedLoraId] : [];
                      const resolvedBatchCount =
                        wildcardPreview.variants.length > 0 ? wildcardPreview.variants.length : Number(batchCount || 1);
                      fetch("/api/generation/jobs", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          prompt,
                          negative_prompt: negativePrompt,
                          sampler,
                          scheduler,
                          steps: Number(steps || 30),
                          cfg_scale: Number(cfgScale || 7.5),
                          width,
                          height,
                          seed: Number.isFinite(parsedSeed) && parsedSeed > 0 ? parsedSeed : null,
                          batch_count: resolvedBatchCount,
                          model_file_id: modelId || null,
                          lora_file_ids: loraFiles.length ? loraFiles : null,
                          is_public: isPublic,
                          preset_style_ids: selectedStyles,
                          wildcard_mode: wildcardMode
                        })
                      })
                        .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                        .then(({ ok, data }) => {
                          if (!ok) {
                            if (data?.error === "wildcard_list_missing" && Array.isArray(data?.wildcard_lists)) {
                              setGenerateMessage(`Missing wildcard list: ${data.wildcard_lists.join(", ")}`);
                            } else {
                              setGenerateMessage(humanizeErrorCode(data?.error ? String(data.error) : "Generate failed"));
                            }
                            return;
                          }
                          setGenerateMessage("Queued");
                          setGeneratedOutputs([]);
                          setGeneratorShowAllOutputs(false);
                          setActiveGenerationId(data?.job_id ?? null);
                          setActiveGenerationProgress(null);
                          setActiveGenerationEta(null);
                          fetch("/api/generation/jobs", { headers: { Authorization: `Bearer ${token}` } })
                            .then((res) => res.json())
                            .then((dataJobs) => setJobs(dataJobs.jobs ?? []))
                            .catch(() => null);
                          if (data?.job_id) {
                            setJobs((prev) => {
                              if (prev.some((job) => job.id === data.job_id)) return prev;
                              return [{ id: data.job_id, status: "queued", prompt, error_message: undefined }, ...prev];
                            });
                          }
                          setPrompt("");
                          setNegativePrompt("");
                        })
                        .catch(() => setGenerateMessage("Generate failed"));
                    }}
                  >
                    Generate
                  </button>
                  {generateMessage ? <div className="muted small">{generateMessage}</div> : null}
                  {activeGenerationId ? (
                    <div className="mini-list">
                      <div className="muted small">Active job</div>
                      <div className="progress">
                        <span style={{ width: `${activeGenerationProgress ?? 0}%` }}></span>
                      </div>
                      <div className="stat-row">
                        <span>{activeGenerationId.slice(0, 8)}</span>
                        <span>
                          {activeGenerationProgress ?? 0}%{activeGenerationEta ? ` • ETA ${activeGenerationEta}s` : ""}
                        </span>
                      </div>
                      <div className="run-actions">
                        <button
                          className="action-btn ghost"
                          onClick={() => cancelGenerationJob(activeGenerationId)}
                        >
                          Stop job
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="mini-list">
                    <div className="mini-header">
                      <span className="muted small">Recent jobs</span>
                      <button className="action-btn ghost" onClick={clearGenerationHistory}>
                        Clear history
                      </button>
                    </div>
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className={`stat-row ${job.status === "failed" ? "is-failed" : ""}`}>
                        <span>{job.prompt?.slice(0, 28) ?? job.id}</span>
                        <span className="job-status">
                          {job.status}
                          {job.error_message ? (
                            <span className="info-chip" aria-label="Show error">
                              i
                              <span className="info-pop">{job.error_message}</span>
                            </span>
                          ) : null}
                        </span>
                        <span className="job-actions">
                          {job.status === "queued" ? (
                            <button className="action-btn ghost" onClick={() => cancelGenerationJob(job.id)}>
                              Stop
                            </button>
                          ) : null}
                          <button className="action-btn danger" onClick={() => deleteGenerationJob(job.id)}>
                            Delete
                          </button>
                        </span>
                      </div>
                    ))}
                    {!jobs.length ? <div className="muted small">No jobs yet.</div> : null}
                  </div>
                </div>
              </section>
              <section className="panel">
                <div className="panel-header">
                  <h3>{t.styles}</h3>
                  <span className="badge">Presets</span>
                </div>
                {styleOptions.length === 0 ? (
                  <div className="muted small">No styles configured.</div>
                ) : (
                  <div className="style-grid">
                    {styleOptions.map((style) => {
                      const active = selectedStyles.includes(style.id);
                      return (
                        <button
                          key={style.id}
                          className={`style-chip ${active ? "is-active" : ""}`}
                          onClick={() =>
                            setSelectedStyles((prev) =>
                              prev.includes(style.id) ? prev.filter((id) => id !== style.id) : [...prev, style.id]
                            )
                          }
                        >
                          <span className="style-name">{style.name}</span>
                          <span className="style-desc">{style.description}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedStyles.length > 0 ? (
                  <button className="action-btn ghost" onClick={() => setSelectedStyles([])}>
                    Clear styles
                  </button>
                ) : null}
              </section>
              <section className="panel">
                <div className="panel-header">
                  <h3>Settings</h3>
                  <span className="badge">Render</span>
                </div>
                <div className="form-grid">
                  <label className="form-row">
                    Aspect Ratio
                    <select className="input" value={ratio} onChange={(e) => setRatio(e.target.value)}>
                      {RATIO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-row">
                    Steps
                    <input className="input" value={steps} onChange={(e) => setSteps(e.target.value)} />
                  </label>
                  <label className="form-row">
                    Batch Count
                    <input className="input" value={batchCount} onChange={(e) => setBatchCount(e.target.value)} />
                  </label>
                  <label className="form-row form-check">
                    <span>Public</span>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                  </label>
                  <button className="action-btn ghost" onClick={() => setGeneratorAdvancedOpen((prev) => !prev)}>
                    {generatorAdvancedOpen ? "Hide advanced" : "Show advanced"}
                  </button>
                  {generatorAdvancedOpen ? (
                    <div className="generator-advanced">
                      <label className="form-row">
                        CFG Scale
                        <input className="input" value={cfgScale} onChange={(e) => setCfgScale(e.target.value)} />
                      </label>
                      <label className="form-row">
                        Seed (-0 = random)
                        <input className="input" value={seed} onChange={(e) => setSeed(e.target.value)} />
                      </label>
                      <label className="form-row">
                        Sampler
                        <select className="input" value={sampler} onChange={(e) => setSampler(e.target.value)}>
                          {samplerOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-row">
                        Scheduler
                        <select className="input" value={scheduler} onChange={(e) => setScheduler(e.target.value)}>
                          {schedulerOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                  {samplerOptions.length === 0 || schedulerOptions.length === 0 ? (
                    <div className="form-row">Admin must configure generation options.</div>
                  ) : null}
                </div>
              </section>
              <section className="panel generator-preview-panel">
                <div className="panel-header">
                  <h3>{t.previewOutput}</h3>
                  {generatedOutputs.length > 8 ? (
                    <button className="action-btn ghost" onClick={() => setGeneratorShowAllOutputs((prev) => !prev)}>
                      {generatorShowAllOutputs ? "Show less" : `Show all (${generatedOutputs.length})`}
                    </button>
                  ) : null}
                </div>
                <div className={`image-grid ${generatorShowAllOutputs ? "is-expanded" : "is-compact"}`}>
                  {visibleGeneratedOutputs.map((img) => (
                    <div key={img.id} className="image-tile">
                      <img src={fileUrl(img.file_id, token, { thumb: true, size: 384 })} alt="" loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
                {!generatedOutputs.length ? <div className="muted small">No outputs yet.</div> : null}
              </section>
            </div>
            )}
          </section>

          <section className={`view ${view === "gallery" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>{t.gallery}</h1>
              <div className="gallery-header">
                <p>{galleryMode === "private" ? "Private gallery" : "Public feed"}</p>
                <div className="gallery-actions">
                  <button className="action-btn ghost" onClick={toggleGalleryBulkMode}>
                    {galleryBulkMode ? "Cancel Bulk Action" : "Bulk Action"}
                  </button>
                  <button
                    className="action-btn ghost"
                    onClick={() => setGalleryMode((prev) => (prev === "public" ? "private" : "public"))}
                  >
                    {galleryMode === "public" ? "Private gallery" : "Public feed"}
                  </button>
                </div>
              </div>
            </div>
            {galleryModels.filter((model) => model.id !== "generated").length > 0 ? (
              <section className="model-section">
                <div className="panel-header">
                  <h3>Models</h3>
                  <span className="badge">Gallery</span>
                </div>
                <div className="model-grid">
                  {galleryModels
                    .filter((model) => model.id !== "generated")
                    .map((model) => (
                      <button
                        key={model.id}
                        className="model-card"
                        onClick={() => openGalleryModel(model.id)}
                      >
                        <div className="model-head">
                          <div>
                            <div className="model-title">{model.name}</div>
                          <div className="tile-user">
                            {renderAvatar(model.avatar_file_id, token)}
                            <button
                              className="link-btn muted small"
                              onClick={(event) => {
                                event.stopPropagation();
                                openProfile(model.user_id);
                              }}
                            >
                              @{model.username ?? "unknown"}
                            </button>
                          </div>
                          </div>
                          <div className="model-stats">
                            <span>♥ {model.like_count ?? 0}</span>
                            <span>💬 {model.comment_count ?? 0}</span>
                          </div>
                        </div>
                        <div className="model-thumb-grid">
                          {(model.images ?? []).slice(0, 6).map((img) => (
                            <img key={img.id} src={fileUrl(img.file_id, token, { thumb: true, size: 320 })} alt="" loading="lazy" decoding="async" />
                          ))}
                        </div>
                      </button>
                    ))}
                </div>
              </section>
            ) : null}
            {galleryBulkMode ? (
              <div className="bulk-gallery-bar">
                <div className="muted small">{galleryBulkSelection.length} selected</div>
                <div className="gallery-actions">
                  <button
                    className="action-btn ghost"
                    disabled={galleryBulkBusy || galleryBulkSelection.length === 0}
                    onClick={() => runGalleryBulkAction("public")}
                  >
                    Set Public
                  </button>
                  <button
                    className="action-btn ghost"
                    disabled={galleryBulkBusy || galleryBulkSelection.length === 0}
                    onClick={() => runGalleryBulkAction("private")}
                  >
                    Set Private
                  </button>
                  <button
                    className="action-btn danger"
                    disabled={galleryBulkBusy || galleryBulkSelection.length === 0}
                    onClick={() => {
                      if (!confirm(`Delete ${galleryBulkSelection.length} selected image(s)? This cannot be undone.`)) return;
                      runGalleryBulkAction("delete");
                    }}
                  >
                    Delete Selected
                  </button>
                </div>
                {galleryBulkMessage ? <div className="muted small">{galleryBulkMessage}</div> : null}
              </div>
            ) : null}
            <div className="gallery-grid">
              {galleryImages.map((img) => (
                <button
                  key={img.id}
                  className={`gallery-tile ${galleryBulkMode && canManageGalleryImage(img) ? "is-selectable" : ""} ${
                    galleryBulkSelection.includes(img.id) ? "is-selected" : ""
                  }`}
                  onClick={() => {
                    if (galleryBulkMode) {
                      if (!canManageGalleryImage(img)) return;
                      toggleGalleryBulkSelection(img.id);
                      return;
                    }
                    openGalleryImage(img.id);
                  }}
                >
                    {galleryBulkMode && canManageGalleryImage(img) ? (
                      <span className="bulk-select-marker">{galleryBulkSelection.includes(img.id) ? "Selected" : "Select"}</span>
                    ) : null}
                    <img src={fileUrl(img.file_id, token, { thumb: true, size: 384 })} alt="" loading="lazy" decoding="async" />
                  <div className="tile-meta">
                    <div className="tile-user">
                      {renderAvatar(img.avatar_file_id, token)}
                      <button
                        className="link-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          openProfile(img.user_id);
                        }}
                      >
                        @{img.username}
                        {img.is_public ? " • Public" : ""}
                      </button>
                    </div>
                    <span className="tile-meta-stats">
                      <span>♥ {img.like_count ?? 0}</span>
                      <span>💬 {img.comment_count ?? 0}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className={`view ${view === "lora" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>{loraDetailActive ? selectedLoraEntry?.name ?? t.lora : t.lora}</h1>
              <div className="gallery-header">
                <p>
                  {loraDetailActive
                    ? "Model detail"
                    : loraMode === "private"
                      ? "Private gallery"
                      : "Public feed"}
                </p>
                <div className="gallery-actions">
                  {loraDetailActive ? (
                    <button
                      className="action-btn ghost"
                      onClick={() => {
                        setLoraRouteId("");
                        setSelectedLoraEntry(null);
                        setSelectedLoraPreview(null);
                      }}
                    >
                      Back to list
                    </button>
                  ) : null}
                  {loraDetailActive && selectedLoraEntry && (selectedLoraEntry.user_id === user?.id || user?.role === "admin") ? (
                    <button
                      className="action-btn icon-danger-btn"
                      title={
                        ["queued", "processing"].includes(String(selectedLoraEntry.remove_status ?? ""))
                          ? "Delete already queued"
                          : "Delete model"
                      }
                      disabled={["queued", "processing"].includes(String(selectedLoraEntry.remove_status ?? ""))}
                      onClick={() => {
                        if (!token) return;
                        if (!confirm(`Delete LoRA \"${selectedLoraEntry.name}\"? This cannot be undone.`)) return;
                        fetch(`/api/loras/${selectedLoraEntry.id}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` }
                        })
                          .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                          .then(({ ok }) => {
                            if (!ok) {
                              setLoraDescriptionStatus("Delete failed.");
                              return;
                            }
                            setLoraDescriptionStatus("Delete queued.");
                            setLoraRouteId("");
                            setSelectedLoraEntry(null);
                            setSelectedLoraPreview(null);
                            refreshLoraEntries();
                          })
                          .catch(() => setLoraDescriptionStatus("Delete failed."));
                      }}
                    >
                      ⓧ
                    </button>
                  ) : null}
                  {!loraDetailActive && loraMode === "private" ? (
                    <button className="action-btn ghost" onClick={() => setLoraUploadOpen(true)}>
                      Upload LoRA
                    </button>
                  ) : null}
                  {!loraDetailActive && token ? (
                    <button
                      className="action-btn ghost"
                      onClick={() => {
                        setLoraBulkMode((prev) => !prev);
                        setLoraBulkSelection([]);
                        setLoraBulkMessage("");
                      }}
                    >
                      {loraBulkMode ? "Cancel Bulk Action" : "Bulk Action"}
                    </button>
                  ) : null}
                  {!loraDetailActive ? (
                    <button
                      className="action-btn ghost"
                      onClick={() => setLoraMode((prev) => (prev === "public" ? "private" : "public"))}
                    >
                      {loraMode === "public" ? "Private gallery" : "Public feed"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            {!loraDetailActive && loraBulkMode ? (
              <div className="bulk-gallery-bar">
                <span className="muted small">{loraBulkSelection.length} selected</span>
                <button
                  className="action-btn ghost"
                  disabled={loraBulkBusy || manageableVisibleLoraIds.length === 0}
                  onClick={() => setLoraBulkSelection(manageableVisibleLoraIds)}
                >
                  Select all
                </button>
                <button
                  className="action-btn ghost"
                  disabled={loraBulkBusy || loraBulkSelection.length === 0}
                  onClick={() => setLoraBulkSelection([])}
                >
                  Clear
                </button>
                <button
                  className="action-btn ghost"
                  disabled={loraBulkBusy || loraBulkSelection.length === 0}
                  onClick={generateLoraBulkPreviews}
                >
                  Generate previews
                </button>
                <button
                  className="action-btn ghost"
                  disabled={loraBulkBusy || loraBulkSelection.length === 0}
                  onClick={() => applyLoraBulkVisibility(true)}
                >
                  Set Public
                </button>
                <button
                  className="action-btn ghost"
                  disabled={loraBulkBusy || loraBulkSelection.length === 0}
                  onClick={() => applyLoraBulkVisibility(false)}
                >
                  Set Private
                </button>
                <button
                  className="action-btn danger"
                  disabled={loraBulkBusy || loraBulkSelection.length === 0}
                  onClick={deleteLoraBulkSelection}
                >
                  Delete Selected
                </button>
                {loraBulkMessage ? <span className="muted small">{loraBulkMessage}</span> : null}
              </div>
            ) : null}
            {!loraDetailActive ? <div className="lora-grid">
              {loraEntries.map((entry) => (
                <button
                  key={entry.id}
                  className={`lora-card ${loraBulkMode && canManageLoraEntry(entry) ? "is-selectable" : ""} ${
                    loraBulkSelection.includes(entry.id) ? "is-selected" : ""
                  }`}
                  onClick={() => {
                    if (loraBulkMode && canManageLoraEntry(entry)) {
                      toggleLoraBulkSelection(entry.id);
                      return;
                    }
                    setLoraRouteId(entry.id);
                    openLoraEntry(entry);
                  }}
                >
                  {loraBulkMode ? (
                    <span className="bulk-select-marker">
                      {canManageLoraEntry(entry)
                        ? loraBulkSelection.includes(entry.id)
                          ? "selected"
                          : "select"
                        : "view"}
                    </span>
                  ) : null}
                  <div className="lora-title">{entry.name}</div>
                  {entry.remove_status ? (
                    <div className="muted small">
                      {entry.remove_status === "queued"
                        ? "Removing (queued)"
                        : entry.remove_status === "processing"
                          ? "Removing (in progress)"
                          : entry.remove_status === "failed"
                            ? "Remove failed"
                            : entry.remove_status}
                    </div>
                  ) : null}
                  {entry.preview_file_ids && entry.preview_file_ids.length > 0 ? (
                    <div className="lora-previews">
                      {entry.preview_file_ids.slice(0, 4).map((fileId) => (
                        <img
                          key={fileId}
                          src={withToken(`/api/files/${fileId}`, token)}
                          alt={`${entry.name} preview`}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="muted small">No previews yet.</div>
                  )}
                  <div className="tile-meta">
                    <button
                      className="link-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        openProfile(entry.user_id);
                      }}
                    >
                      @{entry.username}
                      {entry.source === "external" ? " • External" : ""}
                    </button>
                    <span className="tile-meta-stats">
                      <span>♥ {entry.like_count ?? 0}</span>
                      <span>💬 {entry.comment_count ?? 0}</span>
                    </span>
                  </div>
                  {loraPreviewStatus[entry.id] ? (
                    <div className="muted small">{loraPreviewStatus[entry.id]}</div>
                  ) : null}
                </button>
              ))}
              {!loraEntries.length ? <div className="muted small">No LoRA entries yet.</div> : null}
            </div> : null}
            {loraDetailActive && selectedLoraEntry ? (
              <div className="lora-detail-page panel">
                <div className="lora-detail-main">
                  <div className="lora-detail-stats">
                    <div className="stat-card">
                      <div className="label">Likes</div>
                      <div className="value">{selectedLoraMeta?.likes ?? selectedLoraEntry.like_count ?? 0}</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Downloads</div>
                      <div className="value">{selectedLoraEntry.download_count ?? "—"}</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Generated</div>
                      <div className="value">{selectedLoraEntry.generated_count ?? "—"}</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Favorite</div>
                      <div className="value">{selectedLoraEntry.favorite_count ?? "planned"}</div>
                    </div>
                  </div>
                  <div className="lora-preview-stage">
                    <button
                      className="lora-stage-nav"
                      onClick={() => setLoraDetailPreviewOffset((prev) => prev - 1)}
                      disabled={selectedLoraPreviewIds.length <= 2}
                    >
                      ◀
                    </button>
                    <div className="lora-previews large two-up">
                      {selectedLoraPreviewWindow.map((fileId) => (
                        <button key={fileId} className="preview-tile" onClick={() => setSelectedLoraPreview(fileId)}>
                          <img src={withToken(`/api/files/${fileId}`, token)} alt={`${selectedLoraEntry.name} preview`} />
                        </button>
                      ))}
                      {!selectedLoraPreviewIds.length ? <div className="muted small">No previews yet.</div> : null}
                    </div>
                    <button
                      className="lora-stage-nav"
                      onClick={() => setLoraDetailPreviewOffset((prev) => prev + 1)}
                      disabled={selectedLoraPreviewIds.length <= 2}
                    >
                      ▶
                    </button>
                  </div>
                  <div className="model-description">
                    <div className="stat-row">
                      <span>Description</span>
                      <span />
                    </div>
                    <div className="muted small">
                      {selectedLoraEntry.description?.trim() ? selectedLoraEntry.description : "—"}
                    </div>
                  </div>
                </div>
                <aside className="lora-detail-side">
                  <div className="modal-actions lora-actions lora-actions--social">
                    <button
                      className="action-btn"
                      onClick={() => {
                        if (!token || !selectedLoraMeta) return;
                        const headers = { Authorization: `Bearer ${token}` };
                        const method = selectedLoraMeta.user_liked ? "DELETE" : "POST";
                        fetch(`/api/loras/${selectedLoraEntry.id}/like`, { method, headers })
                          .then(() => {
                            setSelectedLoraMeta((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    user_liked: !prev.user_liked,
                                    likes: prev.likes + (prev.user_liked ? -1 : 1)
                                  }
                                : prev
                            );
                          })
                          .catch(() => null);
                      }}
                    >
                      {selectedLoraMeta?.user_liked ? "Unlike" : "Like"} ({selectedLoraMeta?.likes ?? 0})
                    </button>
                  </div>
                  <div className="modal-actions lora-actions lora-actions--primary">
                    <button
                      className="action-btn"
                      onClick={() => {
                        setSelectedLoraId(selectedLoraEntry.file_id);
                        setSelectedLoraName(selectedLoraEntry.name);
                        setSelectedLoraWeight(0.75);
                        setView("generator");
                      }}
                    >
                      Generate with LoRA
                    </button>
                    {selectedLoraEntry.user_id === user?.id || user?.role === "admin" ? (
                      <a className="action-btn ghost" href={fileUrl(selectedLoraEntry.file_id, token)} target="_blank" rel="noreferrer">
                        Download LoRA
                      </a>
                    ) : null}
                    {selectedLoraEntry.dataset_file_id &&
                    (selectedLoraEntry.user_id === user?.id || user?.role === "admin") ? (
                      <a className="action-btn ghost" href={fileUrl(selectedLoraEntry.dataset_file_id, token)} target="_blank" rel="noreferrer">
                        Download dataset
                      </a>
                    ) : null}
                  </div>
                  {selectedLoraEntry.user_id === user?.id || user?.role === "admin" ? (
                    <div className="panel lora-detail-files">
                      <div className="detail-title">Model edit</div>
                      {loraDetailEditing ? (
                        <div className="description-edit">
                          <input
                            className="input"
                            value={loraNameDraft}
                            onChange={(e) => setLoraNameDraft(e.target.value)}
                            placeholder="Model name"
                          />
                          <textarea
                            className="input"
                            rows={3}
                            value={loraDescriptionDraft}
                            onChange={(e) => setLoraDescriptionDraft(e.target.value)}
                            placeholder="Model description"
                          />
                          <input
                            className="input"
                            value={loraTriggerDraft}
                            onChange={(e) => setLoraTriggerDraft(e.target.value)}
                            placeholder="Trigger / Activator token"
                          />
                          <div className="wizard-actions">
                            <button
                              className="action-btn ghost"
                              onClick={() => {
                                setLoraNameDraft(selectedLoraEntry.name ?? "");
                                setLoraDescriptionDraft(selectedLoraEntry.description ?? "");
                                setLoraTriggerDraft(selectedLoraEntry.trigger_token ?? selectedLoraEntry.activator_token ?? "");
                                setLoraDetailEditing(false);
                                setLoraDescriptionStatus("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => {
                                if (!token) return;
                                const nextName = loraNameDraft.trim();
                                if (!nextName) {
                                  setLoraDescriptionStatus("Model name is required.");
                                  return;
                                }
                                const nextDescription = loraDescriptionDraft.trim();
                                const nextTrigger = loraTriggerDraft.trim();
                                fetch(`/api/loras/${selectedLoraEntry.id}`, {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({
                                    name: nextName,
                                    description: nextDescription,
                                    trigger_token: nextTrigger,
                                    activator_token: nextTrigger
                                  })
                                })
                                  .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                                  .then(({ ok, data }) => {
                                    if (!ok) {
                                      setLoraDescriptionStatus(data?.error ?? "Update failed.");
                                      return;
                                    }
                                    applyLoraEntryPatch(selectedLoraEntry.id, {
                                      name: nextName,
                                      description: nextDescription,
                                      trigger_token: nextTrigger,
                                      activator_token: nextTrigger
                                    });
                                    setLoraDescriptionStatus("Saved.");
                                    setLoraDetailEditing(false);
                                  })
                                  .catch(() => setLoraDescriptionStatus("Update failed."));
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="description-read">
                          <button className="action-btn ghost" onClick={() => setLoraDetailEditing(true)}>
                            Edit model
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                  <div className="panel lora-detail-files">
                    <div className="detail-title">Details</div>
                    <div className="stat-row"><span>Source</span><span>{selectedLoraEntry.source === "external" ? "External Uploaded" : "Training"}</span></div>
                    <div className="stat-row"><span>Visibility</span><span>{selectedLoraEntry.is_public ? "Public" : "Private"}</span></div>
                    <div className="stat-row"><span>Previews</span><span>{selectedLoraEntry.preview_count ?? 0}/11</span></div>
                    <div className="stat-row"><span>Trigger / Activator</span><span>{selectedLoraEntry.trigger_token?.trim() || selectedLoraEntry.activator_token?.trim() || "—"}</span></div>
                  </div>
                  <div className="panel lora-detail-files">
                    <div className="detail-title">Files</div>
                    <div className="stat-row"><span>Main</span><span>LoRA</span></div>
                    {selectedLoraEntry.dataset_file_id ? <div className="stat-row"><span>Additional</span><span>Dataset</span></div> : null}
                  </div>
                  <div className="panel lora-detail-author">
                    <div className="tile-user">
                      {renderAvatar(selectedLoraEntry.avatar_file_id ?? null, token, selectedLoraEntry.username)}
                      <button className="link-btn" onClick={() => openProfile(selectedLoraEntry.user_id)}>
                        @{selectedLoraEntry.username}
                      </button>
                    </div>
                    <div className="tile-meta-stats">
                      <span>♥ {selectedLoraEntry.like_count ?? 0}</span>
                      <span>💬 {selectedLoraEntry.comment_count ?? 0}</span>
                    </div>
                    <div className="modal-actions lora-actions">
                      <button className="action-btn ghost" onClick={() => openProfile(selectedLoraEntry.user_id)}>Profile</button>
                      <button className="action-btn ghost" onClick={() => openDmWithUser(selectedLoraEntry.user_id)}>Message</button>
                    </div>
                  </div>
                </aside>
              </div>
            ) : null}
          </section>

          <section className={`view ${view === "profile" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>Profile</h1>
              <div className="gallery-actions">
                <button className="action-btn ghost" onClick={() => setView(profileReturnView)}>
                  Back
                </button>
              </div>
            </div>
            {profileView ? (
              <>
                <section className="panel profile-hero">
                  <div className="profile-avatar">
                    {profileView.avatar_file_id ? (
                      <img src={fileUrl(profileView.avatar_file_id, token, { thumb: true, size: 192 })} alt="avatar" loading="lazy" decoding="async" />
                    ) : (
                      <div className="avatar-preview placeholder">No avatar</div>
                    )}
                  </div>
                  <div className="profile-info">
                    <div className="profile-name">{profileView.display_name || profileView.username}</div>
                    <div className="muted small">@{profileView.username}</div>
                    <div className="profile-bio">{profileView.bio || "No bio yet."}</div>
                    {profileRelationship && !profileRelationship.is_self ? (
                      <div className="login-actions">
                        <button className="action-btn" disabled={profileFollowBusy} onClick={toggleProfileFollow}>
                          {profileRelationship.is_following ? "Unfollow" : "Follow"}
                        </button>
                        <button className="action-btn ghost" onClick={() => openDmWithUser(profileView.id)}>
                          Message
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="profile-stats">
                    <div className="stat-grid">
                      <div className="stat-card">
                        <div className="label">Models</div>
                        <div className="value">{profileStats?.models ?? 0}</div>
                      </div>
                      <div className="stat-card">
                        <div className="label">Images</div>
                        <div className="value">{profileStats?.images ?? 0}</div>
                      </div>
                      <div className="stat-card">
                        <div className="label">Likes (Models)</div>
                        <div className="value">{profileStats?.likes_models ?? 0}</div>
                      </div>
                      <div className="stat-card">
                        <div className="label">Likes (Images)</div>
                        <div className="value">{profileStats?.likes_images ?? 0}</div>
                      </div>
                      <div className="stat-card">
                        <div className="label">Followers</div>
                        <div className="value">{profileStats?.followers ?? 0}</div>
                      </div>
                      <div className="stat-card">
                        <div className="label">Uses by Others</div>
                        <div className="value">{profileStats?.generations_with_my_assets ?? 0}</div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <h3>Public Models</h3>
                    <span className="badge">Gallery</span>
                  </div>
                  <div className="model-grid">
                    {profileModels.map((model) => (
                      <button key={model.id} className="model-card" onClick={() => openGalleryModel(model.id)}>
                        <div className="model-thumb-grid">
                          {(model.images ?? []).slice(0, 4).map((img) => (
                            <img key={img.id} src={fileUrl(img.file_id, token, { thumb: true, size: 320 })} alt="" loading="lazy" decoding="async" />
                          ))}
                        </div>
                        <div className="tile-meta">
                          <div className="tile-user">
                            {renderAvatar(model.avatar_file_id, token)}
                            <span>@{model.username ?? "unknown"} • {model.name}</span>
                          </div>
                          <span className="tile-meta-stats">
                            <span>♥ {model.like_count ?? 0}</span>
                            <span>💬 {model.comment_count ?? 0}</span>
                          </span>
                        </div>
                      </button>
                    ))}
                    {profileLoras.map((entry) => (
                      <button
                        key={entry.id}
                        className="lora-card"
                        onClick={() => {
                          setView("lora");
                          setLoraRouteId(entry.id);
                          openLoraEntry(entry);
                        }}
                      >
                        <div className="lora-title">{entry.name}</div>
                        {entry.preview_file_ids && entry.preview_file_ids.length > 0 ? (
                          <div className="lora-previews">
                            {entry.preview_file_ids.slice(0, 4).map((fileId) => (
                              <img key={fileId} src={fileUrl(fileId, token, { thumb: true, size: 320 })} alt={`${entry.name} preview`} loading="lazy" decoding="async" />
                            ))}
                          </div>
                        ) : (
                          <div className="muted small">No previews yet.</div>
                        )}
                        <div className="tile-meta">
                          <div className="tile-user">
                            {renderAvatar(entry.avatar_file_id, token, entry.username)}
                            <span>@{entry.username} • LoRA</span>
                          </div>
                          <span className="tile-meta-stats">
                            <span>♥ {entry.like_count ?? 0}</span>
                            <span>💬 {entry.comment_count ?? 0}</span>
                          </span>
                        </div>
                      </button>
                    ))}
                    {!profileModels.length && !profileLoras.length ? (
                      <div className="muted small">No public models yet.</div>
                    ) : null}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <h3>Public Images</h3>
                    <span className="badge">Gallery</span>
                  </div>
                  <div className="gallery-grid">
                    {profileImages.map((img) => (
                      <button key={img.id} className="gallery-tile" onClick={() => openGalleryImage(img.id)}>
                        <img src={fileUrl(img.file_id, token, { thumb: true, size: 384 })} alt="" loading="lazy" decoding="async" />
                        <div className="tile-meta">
                          <div className="tile-user">
                            {renderAvatar(img.avatar_file_id, token)}
                            <span>@{img.username}</span>
                          </div>
                          <span className="tile-meta-stats">
                            <span>♥ {img.like_count ?? 0}</span>
                            <span>💬 {img.comment_count ?? 0}</span>
                          </span>
                        </div>
                      </button>
                    ))}
                    {!profileImages.length ? <div className="muted small">No public images yet.</div> : null}
                  </div>
                </section>
              </>
            ) : (
              <div className="muted small">Profile not found.</div>
            )}
          </section>

          <section className={`view ${view === "messages" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>Messages</h1>
              <p>Direct conversations</p>
            </div>
            <section className="panel dm-layout">
              <aside className="dm-sidebar">
                <div className="dm-sidebar-head">
                  <div className="panel-header">
                    <h3>Threads</h3>
                    <span className="badge">{dmUnreadCount} unread</span>
                  </div>
                  <input
                    className="input"
                    placeholder="Search threads..."
                    value={dmThreadQuery}
                    onChange={(e) => setDmThreadQuery(e.target.value)}
                  />
                </div>
                <div className="dm-thread-list">
                  {dmFilteredThreads.length === 0 ? (
                    <div className="muted small">No conversations yet.</div>
                  ) : (
                    dmFilteredThreads.map((thread) => {
                      const selected = dmActiveThreadId === thread.id;
                      return (
                        <button
                          key={thread.id}
                          className={`dm-thread-item ${selected ? "is-active" : ""}`}
                          onClick={() => setDmActiveThreadId(thread.id)}
                        >
                          <div className="dm-thread-top">
                            <span className="dm-thread-name">
                              {thread.peer_display_name || thread.peer_username}
                            </span>
                            {thread.unread_count ? <span className="badge">{thread.unread_count}</span> : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <div className="dm-main">
                {dmActiveThread ? (
                  <>
                    <div className="dm-main-head">
                      <div>
                        <div className="dm-peer-name">
                          {dmActiveThread.peer_display_name || dmActiveThread.peer_username}
                        </div>
                        <div className="muted small">@{dmActiveThread.peer_username}</div>
                      </div>
                      <div className="job-actions">
                        {dmActiveThread.blocked_by_me ? (
                          <button className="action-btn ghost" onClick={() => unblockDmUser(dmActiveThread.peer_user_id)}>
                            Unblock
                          </button>
                        ) : (
                          <button className="action-btn danger" onClick={() => blockDmUser(dmActiveThread.peer_user_id)}>
                            Block
                          </button>
                        )}
                        <button className="action-btn ghost" onClick={() => deleteDmThread(dmActiveThread.id)}>
                          Delete Thread
                        </button>
                      </div>
                    </div>

                    <div className="dm-message-list">
                      {dmLoading ? (
                        <div className="muted small">Loading messages...</div>
                      ) : dmMessages.length === 0 ? (
                        <div className="muted small">No messages yet.</div>
                      ) : (
                        dmMessages.map((message) => {
                          const mine = message.sender_user_id === user?.id;
                          return (
                            <div key={message.id} className={`dm-bubble-row ${mine ? "is-mine" : "is-peer"}`}>
                              <div className={`dm-bubble ${mine ? "is-mine" : "is-peer"}`}>
                                <div className="dm-bubble-text">{message.body}</div>
                                <div className="dm-bubble-time">{new Date(message.created_at).toLocaleTimeString()}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="dm-composer">
                      {dmActiveThread.blocked_by_me || dmActiveThread.blocked_by_peer ? (
                        <div className="muted small">
                          Messaging is blocked for this thread.
                        </div>
                      ) : (
                        <>
                          <textarea
                            className="input"
                            rows={3}
                            value={dmDraft}
                            onChange={(e) => setDmDraft(e.target.value)}
                            placeholder={`Write to @${dmActiveThread.peer_username}`}
                          />
                          <div className="dm-composer-actions">
                            <button className="action-btn ghost" onClick={() => setDmEmojiOpen((prev) => !prev)}>
                              Emoji
                            </button>
                            <button className="action-btn ghost" onClick={() => refreshDmMessages(dmActiveThread.id)}>
                              Refresh
                            </button>
                            <button className="action-btn" onClick={() => sendDmMessage()}>
                              Send
                            </button>
                          </div>
                          {dmEmojiOpen ? (
                            <div className="dm-emoji-grid">
                              {DM_EMOJI_SET.map((emoji) => (
                                <button
                                  key={emoji}
                                  className="dm-emoji-btn"
                                  onClick={() => setDmDraft((prev) => `${prev}${emoji}`)}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="muted small">Select a thread to start chatting.</div>
                )}
              </div>

              <aside className="dm-rightbar">
                <div className="panel-header">
                  <h3>Blocked Users</h3>
                  <span className="badge">{dmBlocks.length}</span>
                </div>
                <div className="mini-list">
                  {dmBlocks.length === 0 ? (
                    <div className="muted small">No blocked users.</div>
                  ) : (
                    dmBlocks.map((entry) => (
                      <div key={entry.user_id} className="stat-row">
                        <span>{entry.display_name || entry.username}</span>
                        <button className="action-btn ghost" onClick={() => unblockDmUser(entry.user_id)}>
                          Unblock
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {dmStatus ? <div className="muted small">{dmStatus}</div> : null}
              </aside>
            </section>
          </section>

          <section className={`view ${view === "edit_profile" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>Edit Profile</h1>
              <p>Account profile and avatar</p>
            </div>
            <section className="panel">
              <div className="panel-header">
                <h3>User Profile</h3>
                <span className="badge">Account</span>
              </div>
              <div className="form-grid">
                <div className="stat-row">
                  <span>Credits</span>
                  <span>{user?.credits_balance ?? 0}</span>
                </div>
                <div className="stat-row">
                  <span>Daily Allowance</span>
                  <span>{user?.credits_daily_allowance ?? 0}</span>
                </div>
                <label className="form-row">
                  Display Name
                  <input
                    className="input"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  />
                </label>
                <label className="form-row">
                  Bio
                  <input className="input" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
                </label>
                <label className="form-row">
                  Avatar
                  <div className="avatar-row">
                    {profile.avatar_file_id ? (
                      <img className="avatar-preview" src={fileUrl(profile.avatar_file_id, token, { thumb: true, size: 192 })} alt="avatar" loading="lazy" decoding="async" />
                    ) : (
                      <div className="avatar-preview placeholder">No avatar</div>
                    )}
                    <input
                      className="input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const form = new FormData();
                        form.append("file", file);
                        setAvatarStatus("Uploading...");
                        fetch("/api/users/me/avatar", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                          body: form
                        })
                          .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                          .then(({ ok, data }) => {
                            if (!ok) {
                              setAvatarStatus(data?.error ?? "Upload failed.");
                              return;
                            }
                            setProfile((prev) => ({ ...prev, avatar_file_id: data.file_id }));
                            setAvatarStatus("Uploaded.");
                          })
                          .catch(() => setAvatarStatus("Upload failed."));
                      }}
                    />
                  </div>
                  {avatarStatus ? <div className="muted small">{avatarStatus}</div> : null}
                </label>
                <div className="job-actions">
                  <button
                    className="action-btn"
                    onClick={() => {
                      fetch("/api/users/me/profile", {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(profile)
                      }).then(() => null);
                    }}
                  >
                    Save Profile
                  </button>
                  <button
                    className="action-btn ghost"
                    onClick={() => {
                      setSettingsTab("security");
                      setView("settings");
                    }}
                  >
                    Open Settings
                  </button>
                </div>
              </div>
            </section>
          </section>

          <section className={`view ${view === "settings" ? "is-active" : ""}`}>
            <div className="view-header">
              <h1>{t.settings}</h1>
              <p>User settings</p>
            </div>
            <div className="settings-layout">
              <aside className="settings-nav">
                <button
                  className={`settings-tab ${settingsTab === "security" ? "is-active" : ""}`}
                  onClick={() => setSettingsTab("security")}
                >
                  Security
                </button>
                <button
                  className={`settings-tab ${settingsTab === "notifications" ? "is-active" : ""}`}
                  onClick={() => setSettingsTab("notifications")}
                >
                  Notifications
                </button>
                <button
                  className={`settings-tab ${settingsTab === "automation" ? "is-active" : ""}`}
                  onClick={() => setSettingsTab("automation")}
                >
                  Wildcards & AutoChar
                </button>
                <button
                  className={`settings-tab ${settingsTab === "tokens" ? "is-active" : ""}`}
                  onClick={() => setSettingsTab("tokens")}
                >
                  API Tokens
                </button>
              </aside>

              <div className="settings-content">
                {settingsTab === "security" ? (
                  <div className="settings-stack">
                    <section className="panel">
                      <div className="panel-header">
                        <h3>Password</h3>
                        <span className="badge">Security</span>
                      </div>
                      <div className="form-grid">
                        <div className="muted small">
                          Change password and secure your account credentials.
                        </div>
                        {user?.must_change_password ? (
                          <div className="muted small">Password update is required before continuing.</div>
                        ) : null}
                        <button className="action-btn" onClick={() => setPasswordOpen(true)}>
                          Change Password
                        </button>
                      </div>
                    </section>

                    <section className="panel">
                      <div className="panel-header">
                        <h3>Security Onboarding</h3>
                        <span className="badge">{twoFaStatus.enabled ? "2FA On" : "2FA Off"}</span>
                      </div>
                      <div className="form-grid">
                        <div className="stat-row">
                          <span>2FA Status</span>
                          <span>{twoFaStatus.enabled ? "Enabled" : "Disabled"}</span>
                        </div>
                        <div className="stat-row">
                          <span>2FA Lock</span>
                          <span>{twoFaStatus.locked ? "Locked (3 failed)" : "Unlocked"}</span>
                        </div>
                        <div className="stat-row">
                          <span>Trusted IPs</span>
                          <span>{twoFaStatus.trusted_ip_count}</span>
                        </div>
                        <div className="stat-row">
                          <span>Emergency left</span>
                          <span>{twoFaStatus.recovery_remaining}</span>
                        </div>
                        <div className="job-actions">
                          <button className="action-btn" disabled={securityBusy} onClick={startSecurityOnboarding}>
                            {twoFaStatus.enabled ? "Re-run Onboarding" : "Start Security Onboarding"}
                          </button>
                          <button className="action-btn ghost" onClick={refreshTwoFaStatus}>
                            Refresh
                          </button>
                        </div>
                        {securityStatusMsg ? <div className="muted small">{securityStatusMsg}</div> : null}
                      </div>
                    </section>

                    {securityWizardOpen ? (
                      <section className="panel">
                        <div className="panel-header">
                          <h3>Onboarding Wizard</h3>
                          <span className="badge">Step {securityWizardStep}/3</span>
                        </div>
                        <div className="form-grid">
                          {securityWizardStep === 2 ? (
                            <>
                              <div className="muted small">
                                Add a new account in Google Authenticator with this secret or otpauth URI, then enter
                                the 6-digit code.
                              </div>
                              <label className="form-row">
                                Secret
                                <input className="input" value={securityWizardSecret} readOnly />
                              </label>
                              <label className="form-row">
                                OTPAuth URI
                                <input className="input" value={securityWizardUri} readOnly />
                              </label>
                              <label className="form-row">
                                TOTP Code
                                <input
                                  className="input"
                                  value={securityWizardCode}
                                  onChange={(e) => setSecurityWizardCode(e.target.value)}
                                  placeholder="123456"
                                />
                              </label>
                              <div className="job-actions">
                                <button className="action-btn" disabled={securityBusy} onClick={verifySecurityOnboarding}>
                                  Verify & Enable
                                </button>
                              </div>
                            </>
                          ) : null}
                          {securityWizardStep === 3 ? (
                            <>
                              <div className="muted small">
                                Save these emergency codes now. They are shown once and can unlock/reset 2FA.
                              </div>
                              {securityRecoveryCodes.map((code, idx) => (
                                <div key={code} className="stat-row">
                                  <span>Sequence {idx + 1}</span>
                                  <span>{code}</span>
                                </div>
                              ))}
                              <div className="job-actions">
                                <button
                                  className="action-btn ghost"
                                  onClick={() => {
                                    setSecurityWizardOpen(false);
                                    setSecurityWizardStep(1);
                                    setSecurityRecoveryCodes([]);
                                  }}
                                >
                                  Close Wizard
                                </button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </section>
                    ) : null}

                    {twoFaStatus.enabled ? (
                      <section className="panel">
                        <div className="panel-header">
                          <h3>Disable 2FA</h3>
                          <span className="badge">Emergency</span>
                        </div>
                        <div className="form-grid">
                          <div className="muted small">
                            Disable requires your password plus either current TOTP code or one emergency code.
                          </div>
                          <label className="form-row">
                            Password
                            <input
                              className="input"
                              type="password"
                              value={securityDisablePassword}
                              onChange={(e) => setSecurityDisablePassword(e.target.value)}
                            />
                          </label>
                          <label className="form-row">
                            TOTP Code (optional)
                            <input
                              className="input"
                              value={securityDisableCode}
                              onChange={(e) => setSecurityDisableCode(e.target.value)}
                              placeholder="123456"
                            />
                          </label>
                          <label className="form-row">
                            Emergency Code (optional)
                            <input
                              className="input"
                              value={securityDisableEmergency}
                              onChange={(e) => setSecurityDisableEmergency(e.target.value)}
                              placeholder="XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX"
                            />
                          </label>
                          <div className="job-actions">
                            <button className="action-btn danger" disabled={securityBusy} onClick={disableTwoFa}>
                              Disable 2FA
                            </button>
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                {settingsTab === "notifications" ? (
                  <section className="panel">
                    <div className="panel-header">
                      <h3>Notification Center</h3>
                      <span className="badge">{notificationUnread} unread</span>
                    </div>
                    <div className="form-grid">
                      {NOTIFICATION_LABELS.map((entry) => (
                        <label key={entry.key} className="stat-row">
                          <span>{entry.label}</span>
                          <input
                            type="checkbox"
                            checked={Boolean(notificationPrefs[entry.key])}
                            disabled={Boolean(notificationSaving[entry.key])}
                            onChange={(e) => updateNotificationPref(entry.key, e.target.checked)}
                          />
                        </label>
                      ))}
                      <div className="job-actions">
                        <button className="action-btn ghost" onClick={markAllNotificationsRead}>
                          Mark all as read
                        </button>
                      </div>
                      <div className="form-row">
                        {notificationList.length === 0 ? (
                          <div className="muted small">No notifications yet.</div>
                        ) : (
                          notificationList.slice(0, 20).map((item) => (
                            <div key={item.id} className="stat-row">
                              <span>
                                <strong>{item.title}</strong>
                                {item.body ? ` - ${item.body}` : ""}
                                <span className="muted small"> ({new Date(item.created_at).toLocaleString()})</span>
                              </span>
                              {!item.read_at ? (
                                <button className="action-btn ghost" onClick={() => markNotificationRead(item.id)}>
                                  Read
                                </button>
                              ) : (
                                <span className="muted small">read</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </section>
                ) : null}

                {settingsTab === "automation" ? (
                  <div className="settings-stack">
                    <section className="panel">
                      <div className="panel-header">
                        <h3>AutoChar Presets</h3>
                        <span className="badge">Personal</span>
                      </div>
                      <div className="form-grid">
                        <label className="form-row">
                          Name
                          <input className="input" value={autocharName} onChange={(e) => setAutocharName(e.target.value)} />
                        </label>
                        <label className="form-row">
                          Description
                          <input
                            className="input"
                            value={autocharDescription}
                            onChange={(e) => setAutocharDescription(e.target.value)}
                          />
                        </label>
                        <label className="form-row">
                          Patterns (comma or newline)
                          <textarea
                            className="input"
                            rows={4}
                            value={autocharPatterns}
                            onChange={(e) => setAutocharPatterns(e.target.value)}
                          />
                        </label>
                        <div className="job-actions">
                          <button
                            className="action-btn"
                            onClick={autocharEditingId ? updateAutocharPreset : createAutocharPreset}
                          >
                            {autocharEditingId ? "Update Preset" : "Save Preset"}
                          </button>
                          {autocharEditingId ? (
                            <button
                              className="action-btn ghost"
                              onClick={() => {
                                setAutocharEditingId(null);
                                setAutocharName("");
                                setAutocharDescription("");
                                setAutocharPatterns("");
                              }}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                        {autocharStatus ? <div className="form-row">{autocharStatus}</div> : null}
                        {autocharPresets.length === 0 ? (
                          <div className="muted small">No presets yet.</div>
                        ) : (
                          autocharPresets.map((preset) => (
                            <div key={preset.id} className="stat-row">
                              <span>
                                {preset.name}
                                {preset.description ? ` • ${preset.description}` : ""}
                              </span>
                              <span className="job-actions">
                                <span className="muted small">{preset.patterns?.length ?? 0} tags</span>
                                <button
                                  className="action-btn ghost"
                                  onClick={() => {
                                    setAutocharEditingId(preset.id);
                                    setAutocharName(preset.name);
                                    setAutocharDescription(preset.description ?? "");
                                    setAutocharPatterns((preset.patterns ?? []).join(", "));
                                  }}
                                >
                                  Edit
                                </button>
                                <button className="action-btn ghost" onClick={() => deleteAutocharPreset(preset.id)}>
                                  Delete
                                </button>
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    <section className="panel">
                      <div className="panel-header">
                        <h3>Wildcard Lists</h3>
                        <span className="badge">Personal</span>
                      </div>
                      <div className="form-grid">
                        <div className="muted small">
                          Create lists here and use them in generator prompts as tokens like <code>__my_list__</code>.
                        </div>
                        <label className="form-row">
                          Mode
                          <select
                            className="input"
                            value={wildcardMode}
                            onChange={(e) => {
                              const mode = e.target.value === "random" ? "random" : "sequential";
                              setWildcardMode(mode);
                              setWildcardMessage("Wildcard mode changed. Save to apply.");
                            }}
                          >
                            <option value="sequential">Sequential (line by line)</option>
                            <option value="random">Random</option>
                          </select>
                        </label>
                        <label className="form-row">
                          List name
                          <input
                            className="input"
                            placeholder="my_list"
                            value={wildcardNameInput}
                            onChange={(e) => setWildcardNameInput(e.target.value)}
                          />
                        </label>
                        <label className="form-row">
                          Entries (one per line)
                          <textarea
                            className="input"
                            rows={5}
                            placeholder={"entry_one\nentry_two\nentry_three"}
                            value={wildcardEntriesInput}
                            onChange={(e) => setWildcardEntriesInput(e.target.value)}
                          />
                        </label>
                        <div className="job-actions">
                          <button className="action-btn ghost" onClick={addOrUpdateWildcard}>
                            {wildcardEditName ? "Update List" : "Add List"}
                          </button>
                          {wildcardEditName ? (
                            <button
                              className="action-btn ghost"
                              onClick={() => {
                                setWildcardEditName("");
                                setWildcardNameInput("");
                                setWildcardEntriesInput("");
                                setWildcardMessage("");
                              }}
                            >
                              Cancel
                            </button>
                          ) : null}
                          <button
                            className="action-btn"
                            disabled={wildcardSaving}
                            onClick={() => saveWildcardSettings(wildcardLists, wildcardMode)}
                          >
                            Save Wildcards
                          </button>
                        </div>
                        {wildcardMessage ? <div className="muted small">{wildcardMessage}</div> : null}
                        {wildcardLists.length === 0 ? (
                          <div className="muted small">No wildcard lists yet.</div>
                        ) : (
                          wildcardLists.map((row) => (
                            <div key={row.name} className="stat-row">
                              <span>{row.name}</span>
                              <span className="job-actions">
                                <span className="muted small">{row.entries.length} entries</span>
                                <button className="action-btn ghost" onClick={() => editWildcard(row.name)}>
                                  Edit
                                </button>
                                <button className="action-btn danger" onClick={() => removeWildcard(row.name)}>
                                  Remove
                                </button>
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                ) : null}

                {settingsTab === "tokens" ? (
                  <section className="panel">
                    <div className="panel-header">
                      <h3>User Tokens</h3>
                      <span className="badge">Access</span>
                    </div>
                    <div className="form-grid">
                      <div className="muted small">
                        API bearer tokens are shown once. Store them safely.
                      </div>
                      <button
                        className="action-btn"
                        onClick={() => {
                          fetch("/api/users/me/tokens", {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` }
                          })
                            .then((res) => res.json())
                            .then((data) => setNewToken(data.token ?? null))
                            .catch(() => setNewToken(null));
                        }}
                      >
                        Create Bearer Token
                      </button>
                      {newToken ? <div className="form-row">{newToken}</div> : null}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </section>

          {isAdmin ? (
            <section className={`view ${view === "admin" ? "is-active" : ""}`}>
              <div className="view-header">
                <h1>Admin Settings</h1>
                <p>System control</p>
              </div>
              <div className="admin-tabs">
                {adminTabs.map((tab) => (
                  <button
                    key={tab}
                    className={`tab-btn ${adminTab === tab ? "is-active" : ""}`}
                    onClick={() => setAdminTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="grid two-col">
                <section className={`panel ${adminTab === "queue" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Queue Control</h3>
                    <span className="badge">Admin</span>
                  </div>
                  <div className="form-grid">
                    <div className="queue-meta">
                      <div>
                        <div className="name">Queue Mode</div>
                        <div className="muted small">Start/Pause/Stop orchestrator processing.</div>
                      </div>
                      <div className={`pill ${queueStatus.queue_paused ? "is-paused" : "is-running"}`}>
                        {queueStatus.queue_paused ? "paused" : "running"}
                      </div>
                    </div>
                    <div className="muted small">
                      Active pipeline: {queueStatus.active_pipeline_id || "–"}
                    </div>
                    <div className="muted small">
                      Active generation: {queueStatus.active_generation_id || "–"}
                    </div>
                    <div className="muted small">
                      Active training: {queueStatus.active_training_id || "–"}
                    </div>
                    <div className="queue-actions">
                      <button className="action-btn" onClick={() => queueCommand("start")}>
                        Start
                      </button>
                      <button className="action-btn" onClick={() => queueCommand("pause")}>
                        Pause
                      </button>
                      <button className="action-btn" onClick={() => queueCommand("stop")}>
                        Stop
                      </button>
                      <button className="action-btn" onClick={() => queueCommand("restart")}>
                        Restart
                      </button>
                      <button className="action-btn ghost" onClick={() => refreshQueueStatus()}>
                        Refresh
                      </button>
                    </div>
                  </div>
                </section>

                <section className={`panel ${adminTab === "core" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Core Settings</h3>
                    <span className="badge">Pipeline</span>
                  </div>
                  <div className="settings-grid">
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Capping</span>
                        <span className="muted small">Controls frame extraction from videos.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">FPS</div>
                          <div className="muted small">Frames per second during capping.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          value={coreSettings.capping_fps}
                          onChange={(e) => setCoreSettings({ ...coreSettings, capping_fps: e.target.value })}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">JPEG quality</div>
                          <div className="muted small">ffmpeg qscale (2 = near-lossless).</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          value={coreSettings.capping_jpeg_quality}
                          onChange={(e) =>
                            setCoreSettings({ ...coreSettings, capping_jpeg_quality: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Selection</span>
                        <span className="muted small">How frames are picked before cropping.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">Target per character</div>
                          <div className="muted small">Max selected before cropping.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          value={coreSettings.selection_target_per_character}
                          onChange={(e) =>
                            setCoreSettings({ ...coreSettings, selection_target_per_character: e.target.value })
                          }
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Face quota</div>
                          <div className="muted small">Target count of face-close shots.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          value={coreSettings.selection_face_quota}
                          onChange={(e) =>
                            setCoreSettings({ ...coreSettings, selection_face_quota: e.target.value })
                          }
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Hamming threshold</div>
                          <div className="muted small">Minimum pHash distance for diversity.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          value={coreSettings.selection_hamming_threshold}
                          onChange={(e) =>
                            setCoreSettings({ ...coreSettings, selection_hamming_threshold: e.target.value })
                          }
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Hamming relaxed</div>
                          <div className="muted small">Fallback pHash distance.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          value={coreSettings.selection_hamming_relaxed}
                          onChange={(e) =>
                            setCoreSettings({ ...coreSettings, selection_hamming_relaxed: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Autotag</span>
                        <span className="muted small">Default thresholds when not overridden.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">General threshold</div>
                          <div className="muted small">Score cutoff for general tags.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          value={coreSettings.autotag_general_threshold}
                          onChange={(e) =>
                            setCoreSettings({ ...coreSettings, autotag_general_threshold: e.target.value })
                          }
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Character threshold</div>
                          <div className="muted small">Score cutoff for character tags.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          value={coreSettings.autotag_character_threshold}
                          onChange={(e) =>
                            setCoreSettings({ ...coreSettings, autotag_character_threshold: e.target.value })
                          }
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Max tags</div>
                          <div className="muted small">Maximum tags per image.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          value={coreSettings.autotag_max_tags}
                          onChange={(e) => setCoreSettings({ ...coreSettings, autotag_max_tags: e.target.value })}
                        />
                      </label>
                    </div>
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Output</span>
                        <span className="muted small">Final caps on produced images.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">Max images per set</div>
                          <div className="muted small">Trim overflow to _overflow.</div>
                        </div>
                        <input
                          className="input"
                          type="number"
                          value={coreSettings.output_max_images}
                          onChange={(e) => setCoreSettings({ ...coreSettings, output_max_images: e.target.value })}
                        />
                      </label>
                    </div>
                    <button
                      className="action-btn"
                      onClick={() => {
                        const entries: [string, any][] = [
                          ["capping_fps", Number(coreSettings.capping_fps || 0)],
                          ["capping_jpeg_quality", Number(coreSettings.capping_jpeg_quality || 0)],
                          ["selection_target_per_character", Number(coreSettings.selection_target_per_character || 0)],
                          ["selection_face_quota", Number(coreSettings.selection_face_quota || 0)],
                          ["selection_hamming_threshold", Number(coreSettings.selection_hamming_threshold || 0)],
                          ["selection_hamming_relaxed", Number(coreSettings.selection_hamming_relaxed || 0)],
                          ["autotag_general_threshold", Number(coreSettings.autotag_general_threshold || 0)],
                          ["autotag_character_threshold", Number(coreSettings.autotag_character_threshold || 0)],
                          ["autotag_max_tags", Number(coreSettings.autotag_max_tags || 0)],
                          ["output_max_images", Number(coreSettings.output_max_images || 0)]
                        ];
                        Promise.all(
                          entries.map(([key, value]) =>
                            fetch("/api/settings/admin", {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({ key, value })
                            })
                          )
                        ).then(() => null);
                      }}
                    >
                      Save Core Settings
                    </button>
                  </div>
                </section>

                <section className={`panel ${adminTab === "tagger" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Tagger</h3>
                    <span className="badge">Models</span>
                  </div>
                  <div className="settings-grid">
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Hugging Face</span>
                        <span className="muted small">Token stored in DB for downloads.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">HF token</div>
                          <div className="muted small">Needed for private models.</div>
                        </div>
                        <input
                          className="input"
                          type="password"
                          value={hfToken}
                          onChange={(e) => setHfToken(e.target.value)}
                        />
                      </label>
                      <button
                        className="action-btn"
                        onClick={() => {
                          fetch("/api/settings/admin", {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ key: "hf_token", value: hfToken })
                          }).then(() => null);
                        }}
                      >
                        Save Tagger Token
                      </button>
                    </div>
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Download / Switch model</span>
                        <span className="muted small">Repo id or full link.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">Quick picks</div>
                          <div className="muted small">Choose curated tagger.</div>
                        </div>
                        <select
                          className="input"
                          value={taggerPreset}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTaggerPreset(val);
                            setTaggerRepoId(val);
                          }}
                        >
                          <option value="">Select a model...</option>
                          <optgroup label="General">
                            <option value="SmilingWolf/wd-eva02-large-tagger-v3">
                              EVA02 Large (default)
                            </option>
                          </optgroup>
                          <optgroup label="Anime">
                            <option value="SmilingWolf/wd-swinv2-tagger-v3">SwinV2 (anime)</option>
                            <option value="SmilingWolf/wd-convnext-tagger-v3">ConvNeXt (anime)</option>
                          </optgroup>
                          <optgroup label="Realistic">
                            <option value="SmilingWolf/wd-swinv2-tagger-v3">SwinV2 (realistic)</option>
                            <option value="SmilingWolf/wd-convnext-tagger-v3">ConvNeXt (realistic)</option>
                          </optgroup>
                        </select>
                      </label>
                      <label className="form-row">
                        Repo ID or link
                        <input
                          className="input"
                          value={taggerRepoId}
                          onChange={(e) => setTaggerRepoId(e.target.value)}
                        />
                      </label>
                      <button
                        className="action-btn"
                        onClick={() => {
                          if (!taggerRepoId) return;
                          setTaggerStatus("Downloading...");
                          fetch("/api/admin/tagger/download", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ repo_id: taggerRepoId, force: true })
                          })
                            .then((res) => res.json())
                            .then((data) => {
                              if (data.error) {
                                setTaggerStatus(String(data.error));
                              } else {
                                if (data.message === "already_exists") {
                                  setTaggerStatus("Model already exists.");
                                } else {
                                  setTaggerStatus("Download complete.");
                                }
                                setTaggerDefault(data.model_id ?? taggerDefault);
                                refreshTaggerModels();
                              }
                            })
                            .catch(() => setTaggerStatus("Download failed."));
                        }}
                      >
                        Download / Refresh
                      </button>
                      {taggerStatus ? <div className="form-row">{taggerStatus}</div> : null}
                    </div>
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Local models</span>
                        <span className="muted small">Stored under storage/tagger_models.</span>
                      </div>
                      <div className="stat-row">
                        <span>Current default</span>
                        <span>{taggerDefault || "unknown"}</span>
                      </div>
                      <div className="queue-actions">
                        <button className="action-btn ghost" onClick={refreshTaggerModels}>
                          Refresh list
                        </button>
                      </div>
                      {taggerModels.map((model) => (
                        <div key={model.id} className="stat-row">
                          <span>{model.name}</span>
                          <span className="job-actions">
                            <button
                              className="action-btn ghost"
                              onClick={() => {
                                fetch("/api/admin/tagger/default", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ model_id: model.id })
                                })
                                  .then((res) => res.json())
                                  .then(() => setTaggerDefault(model.id))
                                  .catch(() => null);
                              }}
                            >
                              Set default
                            </button>
                            <button
                              className="action-btn danger"
                              onClick={() => {
                                fetch(`/api/admin/tagger/models/${model.id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` }
                                })
                                  .then((res) => res.json())
                                  .then((data) => {
                                    if (data.error) {
                                      setTaggerStatus(String(data.error));
                                      return;
                                    }
                                    refreshTaggerModels();
                                  })
                                  .catch(() => setTaggerStatus("Delete failed."));
                              }}
                            >
                              Delete
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className={`panel ${adminTab === "generation" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Generation Options</h3>
                    <span className="badge">Admin</span>
                  </div>
                  <div className="form-grid">
                    <div className="form-row">
                      Samplers
                      <div className="pill-list">
                        {DEFAULT_SAMPLERS.map((opt) => {
                          const active = adminSamplerSelection.includes(opt);
                          return (
                            <button
                              key={opt}
                              className={`pill ${active ? "is-active" : ""}`}
                              onClick={() => {
                                setAdminSamplerSelection((prev) =>
                                  prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
                                );
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="form-row">
                      Schedulers
                      <div className="pill-list">
                        {DEFAULT_SCHEDULERS.map((opt) => {
                          const active = adminSchedulerSelection.includes(opt);
                          return (
                            <button
                              key={opt}
                              className={`pill ${active ? "is-active" : ""}`}
                              onClick={() => {
                                setAdminSchedulerSelection((prev) =>
                                  prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
                                );
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      className="action-btn"
                      onClick={() => {
                        const updates = [
                          { key: "generation.samplers", value: adminSamplerSelection },
                          { key: "generation.schedulers", value: adminSchedulerSelection }
                        ];
                        Promise.all(
                          updates.map((item) =>
                            fetch("/api/settings/admin", {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify(item)
                            })
                          )
                        ).then(() => {
                          setSamplerOptions(adminSamplerSelection);
                          setSchedulerOptions(adminSchedulerSelection);
                        });
                      }}
                    >
                      Save Generation Options
                    </button>
                  </div>
                </section>

                <section className={`panel ${adminTab === "credits" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Credits</h3>
                    <span className="badge">Admin</span>
                  </div>
                  <div className="form-grid">
                    <label className="form-row">
                      Credits per Generation
                      <input
                        className="input"
                        value={adminCreditCostGenerate}
                        onChange={(e) => setAdminCreditCostGenerate(e.target.value)}
                      />
                    </label>
                    <label className="form-row">
                      Credits per Training
                      <input
                        className="input"
                        value={adminCreditCostTrain}
                        onChange={(e) => setAdminCreditCostTrain(e.target.value)}
                      />
                    </label>
                    <button
                      className="action-btn"
                      onClick={() => {
                        const updates = [
                          { key: "credits.generate", value: Number(adminCreditCostGenerate || 1) },
                          { key: "credits.train", value: Number(adminCreditCostTrain || 5) }
                        ];
                        Promise.all(
                          updates.map((item) =>
                            fetch("/api/settings/admin", {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify(item)
                            })
                          )
                        ).then(() => null);
                      }}
                    >
                      Save Credit Costs
                    </button>
                    <label className="form-row">
                      User ID / Username / Email
                      <input
                        className="input"
                        value={adminCredits.user_id}
                        onChange={(e) => setAdminCredits({ ...adminCredits, user_id: e.target.value })}
                      />
                    </label>
                    <label className="form-row">
                      Delta
                      <input
                        className="input"
                        value={adminCredits.delta}
                        onChange={(e) => setAdminCredits({ ...adminCredits, delta: e.target.value })}
                      />
                    </label>
                    <label className="form-row">
                      Daily Allowance
                      <input
                        className="input"
                        value={adminCredits.daily_allowance}
                        onChange={(e) =>
                          setAdminCredits({ ...adminCredits, daily_allowance: e.target.value })
                        }
                      />
                    </label>
                    <button
                      className={`action-btn ${adminCreditsBusy ? "is-loading" : ""}`}
                      onClick={async () => {
                        if (adminCreditsBusy) return;
                        const payload: Record<string, unknown> = { user_id: adminCredits.user_id };
                        if (adminCredits.delta.trim() !== "") {
                          payload.delta = Number(adminCredits.delta);
                        }
                        if (adminCredits.daily_allowance.trim() !== "") {
                          payload.daily_allowance = Number(adminCredits.daily_allowance);
                        }
                        try {
                          setAdminCreditsBusy(true);
                          setAdminCreditsStatus("Applying credits...");
                          const res = await fetch("/api/admin/credits", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                          });
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            setAdminCreditsStatus(data.error ?? "Failed to apply credits.");
                          } else {
                            setAdminCreditsStatus("Credits applied.");
                            fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
                              .then((r) => r.json())
                              .then((data) => setUser(data ?? null))
                              .catch(() => null);
                            refreshSelectedAdminUser().catch(() => null);
                            refreshAdminCreditLedger(1).catch(() => null);
                          }
                        } catch {
                          setAdminCreditsStatus("Failed to apply credits.");
                        } finally {
                          setAdminCreditsBusy(false);
                        }
                      }}
                    >
                      Apply Credits
                    </button>
                    {adminCreditsStatus ? <div className="status-msg">{adminCreditsStatus}</div> : null}

                    <div className="detail-group">
                      <div className="detail-title">Credit Ledger</div>
                      <div className="admin-ledger-filters">
                        <label className="form-row">
                          User
                          <input
                            className="input"
                            placeholder="username / email / user id"
                            value={adminLedgerUserFilter}
                            onChange={(e) => setAdminLedgerUserFilter(e.target.value)}
                          />
                        </label>
                        <label className="form-row">
                          Reason
                          <select
                            className="input"
                            value={adminLedgerReasonFilter}
                            onChange={(e) => setAdminLedgerReasonFilter(e.target.value)}
                          >
                            <option value="">all</option>
                            {CREDIT_LEDGER_REASON_OPTIONS.map((value) => (
                              <option key={`reason-${value}`} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-row">
                          Ref type
                          <select
                            className="input"
                            value={adminLedgerRefTypeFilter}
                            onChange={(e) => setAdminLedgerRefTypeFilter(e.target.value)}
                          >
                            <option value="">all</option>
                            {CREDIT_LEDGER_REF_TYPE_OPTIONS.map((value) => (
                              <option key={`ref-${value}`} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-row">
                          Delta
                          <select
                            className="input"
                            value={adminLedgerDeltaSign}
                            onChange={(e) => setAdminLedgerDeltaSign(e.target.value as "all" | "plus" | "minus")}
                          >
                            <option value="all">all</option>
                            <option value="plus">plus</option>
                            <option value="minus">minus</option>
                          </select>
                        </label>
                        <label className="form-row">
                          From
                          <input
                            className="input"
                            type="datetime-local"
                            value={adminLedgerFrom}
                            onChange={(e) => setAdminLedgerFrom(e.target.value)}
                          />
                        </label>
                        <label className="form-row">
                          To
                          <input
                            className="input"
                            type="datetime-local"
                            value={adminLedgerTo}
                            onChange={(e) => setAdminLedgerTo(e.target.value)}
                          />
                        </label>
                        <label className="form-row">
                          Page size
                          <select
                            className="input"
                            value={String(adminLedgerPageSize)}
                            onChange={(e) => {
                              setAdminLedgerPageSize(Number(e.target.value));
                              setAdminLedgerPage(1);
                            }}
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        </label>
                        <div className="job-actions">
                          <button
                            className={`action-btn ${adminLedgerLoading ? "is-loading" : ""}`}
                            onClick={() => {
                              setAdminLedgerPage(1);
                              refreshAdminCreditLedger(1).catch(() => null);
                            }}
                          >
                            Load Ledger
                          </button>
                          <button
                            className="action-btn ghost"
                            onClick={() => {
                              setAdminLedgerUserFilter("");
                              setAdminLedgerReasonFilter("");
                              setAdminLedgerRefTypeFilter("");
                              setAdminLedgerDeltaSign("all");
                              setAdminLedgerFrom("");
                              setAdminLedgerTo("");
                              setAdminLedgerPage(1);
                              refreshAdminCreditLedger(1).catch(() => null);
                            }}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      <div className="muted small">
                        Total: {adminLedgerTotal} | Page {adminLedgerPage}
                      </div>
                      {adminLedgerStatus ? <div className="muted small">{adminLedgerStatus}</div> : null}
                      <div className="admin-ledger-list">
                        {adminLedgerEntries.map((entry) => (
                          <button
                            key={entry.id}
                            className="admin-ledger-item"
                            onClick={() => openAdminCreditLedgerDetail(entry.id).catch(() => null)}
                          >
                            <span>{new Date(entry.created_at).toLocaleString()}</span>
                            <span>@{entry.username}</span>
                            <span className={entry.delta >= 0 ? "credit-plus" : "credit-minus"}>
                              {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                            </span>
                            <span>{entry.reason ?? "—"}</span>
                            <span>{entry.ref_type ?? "—"}</span>
                          </button>
                        ))}
                        {!adminLedgerLoading && adminLedgerEntries.length === 0 ? (
                          <div className="muted small">No ledger entries for current filter.</div>
                        ) : null}
                      </div>
                      <div className="job-actions">
                        <button
                          className="action-btn ghost"
                          disabled={adminLedgerPage <= 1}
                          onClick={() => {
                            const next = Math.max(1, adminLedgerPage - 1);
                            setAdminLedgerPage(next);
                            refreshAdminCreditLedger(next).catch(() => null);
                          }}
                        >
                          Prev
                        </button>
                        <button
                          className="action-btn ghost"
                          disabled={adminLedgerPage * adminLedgerPageSize >= adminLedgerTotal}
                          onClick={() => {
                            const next = adminLedgerPage + 1;
                            setAdminLedgerPage(next);
                            refreshAdminCreditLedger(next).catch(() => null);
                          }}
                        >
                          Next
                        </button>
                        <button
                          className="action-btn"
                          disabled={!adminLedgerEntries.length}
                          onClick={exportAdminLedgerCsv}
                        >
                          Export CSV
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`panel ${adminTab === "users" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Users</h3>
                    <span className="badge">Admin</span>
                  </div>
                  <div className="form-grid">
                    <div className="panel-subtitle">User management</div>
                    <div className="admin-user-search">
                      <label className="form-row">
                        Search Field
                        <select
                          className="input"
                          value={adminUserSearchField}
                          onChange={(e) => setAdminUserSearchField(e.target.value as "email" | "username" | "id")}
                        >
                          <option value="email">Email</option>
                          <option value="username">Username</option>
                          <option value="id">User ID</option>
                        </select>
                      </label>
                      <label className="form-row">
                        Search Value
                        <input
                          className="input"
                          placeholder={
                            adminUserSearchField === "email"
                              ? "user@example.com"
                              : adminUserSearchField === "username"
                                ? "username"
                                : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          }
                          value={adminUserSearchValue}
                          onChange={(e) => setAdminUserSearchValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              runAdminUserSearch().catch(() => null);
                            }
                          }}
                        />
                      </label>
                      <button
                        className={`action-btn ${adminUserSearchBusy ? "is-loading" : ""}`}
                        onClick={() => runAdminUserSearch().catch(() => null)}
                      >
                        Search User
                      </button>
                      {adminUserSearchStatus ? <div className="muted small">{adminUserSearchStatus}</div> : null}
                    </div>

                    {adminUsers.length > 1 ? (
                      <div className="admin-user-search-results">
                        <div className="muted small">Mehrere Treffer, bitte User waehlen:</div>
                        <div className="admin-user-result-list">
                          {adminUsers.map((result) => (
                            <button
                              key={result.id}
                              className={`admin-user-result-item ${adminUserSelectedId === result.id ? "is-active" : ""}`}
                              onClick={() => {
                                setAdminUserSelectedId(result.id);
                                setAdminUserPasswordResult("");
                              }}
                            >
                              <span>{result.username}</span>
                              <span className="muted small">{result.email}</span>
                              <span className="muted small">{result.id}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedAdminUser ? (
                      <div className="admin-user-profile">
                        <div className="admin-user-profile-header">
                          <div>
                            <div className="admin-user-name">{selectedAdminUser.username}</div>
                            <div className="muted small">{selectedAdminUser.email}</div>
                            <div className="muted small">{selectedAdminUser.id}</div>
                          </div>
                          <div className="badge">{selectedAdminUser.role}</div>
                        </div>
                        <div className="admin-user-form-grid">
                          <label className="form-row">
                            Role
                            <select
                              className="input"
                              value={selectedAdminUser.role}
                              disabled={adminUserStatusBusy}
                              onChange={async (e) => {
                                if (!token) return;
                                const role = e.target.value;
                                setAdminUserStatusBusy(true);
                                try {
                                  const res = await fetch(`/api/admin/users/${selectedAdminUser.id}`, {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ role })
                                  });
                                  if (!res.ok) return;
                                  setAdminUsers((prev) =>
                                    prev.map((row) => (row.id === selectedAdminUser.id ? { ...row, role } : row))
                                  );
                                } finally {
                                  setAdminUserStatusBusy(false);
                                }
                              }}
                            >
                              <option value="admin">admin</option>
                              <option value="member">member</option>
                              <option value="guest">guest</option>
                            </select>
                          </label>
                          <label className="form-row">
                            Status
                            <select
                              className="input"
                              value={selectedAdminUser.status}
                              disabled={adminUserStatusBusy}
                              onChange={async (e) => {
                                if (!token) return;
                                const status = e.target.value;
                                setAdminUserStatusBusy(true);
                                try {
                                  const res = await fetch(`/api/admin/users/${selectedAdminUser.id}`, {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ status })
                                  });
                                  if (!res.ok) return;
                                  setAdminUsers((prev) =>
                                    prev.map((row) => (row.id === selectedAdminUser.id ? { ...row, status } : row))
                                  );
                                } finally {
                                  setAdminUserStatusBusy(false);
                                }
                              }}
                            >
                              <option value="active">active</option>
                              <option value="disabled">disabled</option>
                            </select>
                          </label>
                          <div className="stat-row">
                            <span>Credits</span>
                            <span>{selectedAdminUser.credits_balance ?? 0}</span>
                          </div>
                          <div className="stat-row">
                            <span>Reserved</span>
                            <span>{selectedAdminUser.credits_reserved ?? 0}</span>
                          </div>
                          <div className="stat-row">
                            <span>Daily Allowance</span>
                            <span>{selectedAdminUser.credits_daily_allowance ?? 0}</span>
                          </div>
                          <div className="stat-row">
                            <span>2FA</span>
                            <span>
                              {selectedAdminUser.twofa_enabled ? "enabled" : "disabled"}
                              {selectedAdminUser.twofa_locked ? " (locked)" : ""}
                            </span>
                          </div>
                          <div className="stat-row">
                            <span>Trusted IPs</span>
                            <span>{selectedAdminUser.trusted_ip_count ?? 0}</span>
                          </div>
                          <div className="stat-row">
                            <span>Recovery Codes</span>
                            <span>{selectedAdminUser.recovery_remaining ?? 0}</span>
                          </div>
                          <div className="stat-row">
                            <span>Must Change Password</span>
                            <span>{selectedAdminUser.must_change_password ? "yes" : "no"}</span>
                          </div>
                          <div className="stat-row">
                            <span>Created</span>
                            <span>{selectedAdminUser.created_at ? new Date(selectedAdminUser.created_at).toLocaleString() : "-"}</span>
                          </div>
                          <div className="stat-row">
                            <span>Updated</span>
                            <span>{selectedAdminUser.updated_at ? new Date(selectedAdminUser.updated_at).toLocaleString() : "-"}</span>
                          </div>
                        </div>

                        <div className="admin-user-actions">
                          <button
                            className="action-btn ghost"
                            disabled={!selectedAdminUser.twofa_locked}
                            onClick={async () => {
                              if (!token || !selectedAdminUser.twofa_locked) return;
                              const res = await fetch(`/api/admin/users/${selectedAdminUser.id}/2fa/unlock`, {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (!res.ok) return;
                              setAdminUsers((prev) =>
                                prev.map((row) =>
                                  row.id === selectedAdminUser.id ? { ...row, twofa_locked: false } : row
                                )
                              );
                            }}
                          >
                            Unlock 2FA
                          </button>
                          <button
                            className="action-btn danger"
                            onClick={() => {
                              if (!token) return;
                              const confirmDelete = window.confirm(
                                `Delete user ${selectedAdminUser.username}? This cannot be undone.`
                              );
                              if (!confirmDelete) return;
                              fetch(`/api/admin/users/${selectedAdminUser.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` }
                              })
                                .then(async (res) => {
                                  if (!res.ok) {
                                    const data = await res.json().catch(() => ({}));
                                    alert(data.error ?? "Delete failed");
                                    return;
                                  }
                                  setAdminUsers((prev) => prev.filter((row) => row.id !== selectedAdminUser.id));
                                  setAdminUserSelectedId("");
                                  setAdminUserPasswordResult("");
                                })
                                .catch(() => null);
                            }}
                          >
                            Delete User
                          </button>
                        </div>

                        <div className="admin-user-credits">
                          <div className="perm-title">Credits & Allowance</div>
                          <div className="admin-user-password-grid">
                            <label className="form-row">
                              Credit Delta (+/-)
                              <input
                                className="input"
                                value={adminUserCreditsDelta}
                                onChange={(e) => setAdminUserCreditsDelta(e.target.value)}
                                placeholder="z.B. 25 oder -10"
                              />
                            </label>
                            <label className="form-row">
                              Daily Allowance
                              <input
                                className="input"
                                value={adminUserCreditsAllowance}
                                onChange={(e) => setAdminUserCreditsAllowance(e.target.value)}
                              />
                            </label>
                            <button
                              className={`action-btn ${adminUserCreditsBusy ? "is-loading" : ""}`}
                              disabled={adminUserCreditsBusy}
                              onClick={async () => {
                                if (!token) return;
                                const payload: Record<string, unknown> = { user_id: selectedAdminUser.id };
                                if (adminUserCreditsDelta.trim() !== "") {
                                  payload.delta = Number(adminUserCreditsDelta);
                                }
                                if (adminUserCreditsAllowance.trim() !== "") {
                                  payload.daily_allowance = Number(adminUserCreditsAllowance);
                                }
                                if (!("delta" in payload) && !("daily_allowance" in payload)) {
                                  setAdminUserCreditsStatus("Bitte Delta oder Allowance setzen.");
                                  return;
                                }
                                setAdminUserCreditsBusy(true);
                                setAdminUserCreditsStatus("Speichere...");
                                try {
                                  const res = await fetch("/api/admin/credits", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify(payload)
                                  });
                                  const data = await res.json().catch(() => ({}));
                                  if (!res.ok) {
                                    setAdminUserCreditsStatus(humanizeErrorCode(data?.error ?? "Update fehlgeschlagen"));
                                    return;
                                  }
                                  setAdminUserCreditsStatus("Gespeichert.");
                                  await refreshSelectedAdminUser();
                                  await refreshAdminCreditLedger(1);
                                } catch {
                                  setAdminUserCreditsStatus("Update fehlgeschlagen");
                                } finally {
                                  setAdminUserCreditsBusy(false);
                                }
                              }}
                            >
                              Apply
                            </button>
                          </div>
                          {adminUserCreditsStatus ? <div className="muted small">{adminUserCreditsStatus}</div> : null}
                        </div>

                        <div className="admin-user-password">
                          <div className="perm-title">Password Reset</div>
                          <div className="admin-user-password-grid">
                            <label className="form-row">
                              New Password (optional)
                              <input
                                className="input"
                                type="text"
                                placeholder="Leer lassen = random"
                                value={adminUserPasswordValue}
                                onChange={(e) => setAdminUserPasswordValue(e.target.value)}
                              />
                            </label>
                            <label className="stat-row">
                              <span>Force change at next login</span>
                              <input
                                type="checkbox"
                                checked={adminUserPasswordMustChange}
                                onChange={(e) => setAdminUserPasswordMustChange(e.target.checked)}
                              />
                            </label>
                            <button
                              className={`action-btn ${adminUserPasswordBusy ? "is-loading" : ""}`}
                              disabled={adminUserPasswordBusy}
                              onClick={async () => {
                                if (!token) return;
                                setAdminUserPasswordBusy(true);
                                setAdminUserPasswordResult("Reset running...");
                                try {
                                  const payload: Record<string, unknown> = {
                                    must_change_password: adminUserPasswordMustChange
                                  };
                                  if (adminUserPasswordValue.trim()) {
                                    payload.password = adminUserPasswordValue.trim();
                                  }
                                  const res = await fetch(`/api/admin/users/${selectedAdminUser.id}/password/reset`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify(payload)
                                  });
                                  const data = await res.json().catch(() => ({}));
                                  if (!res.ok) {
                                    setAdminUserPasswordResult(humanizeErrorCode(data?.error ?? "Reset failed"));
                                    return;
                                  }
                                  setAdminUserPasswordResult(`New password: ${String(data.password ?? "")}`);
                                  setAdminUsers((prev) =>
                                    prev.map((row) =>
                                      row.id === selectedAdminUser.id
                                        ? { ...row, must_change_password: Boolean(data.must_change_password) }
                                        : row
                                    )
                                  );
                                  setAdminUserPasswordValue("");
                                } catch {
                                  setAdminUserPasswordResult("Reset failed");
                                } finally {
                                  setAdminUserPasswordBusy(false);
                                }
                              }}
                            >
                              Reset Password
                            </button>
                          </div>
                          {adminUserPasswordResult ? (
                            <div className="status-msg break-anywhere">{adminUserPasswordResult}</div>
                          ) : null}
                        </div>

                        <div className="admin-user-password">
                          <div className="perm-title">Impersonate</div>
                          <div className="admin-user-password-grid">
                            <label className="form-row">
                              Admin Password (confirm)
                              <input
                                className="input"
                                type="password"
                                value={adminUserImpersonatePassword}
                                onChange={(e) => setAdminUserImpersonatePassword(e.target.value)}
                                placeholder="Dein eigenes Passwort"
                              />
                            </label>
                            <div className="muted small">
                              Oeffnet neues Fenster als dieser User. Session endet mit Tab/Fenster.
                            </div>
                            <button
                              className={`action-btn ${adminUserImpersonateBusy ? "is-loading" : ""}`}
                              disabled={adminUserImpersonateBusy || !adminUserImpersonatePassword}
                              onClick={async () => {
                                if (!token) return;
                                setAdminUserImpersonateBusy(true);
                                setAdminUserImpersonateStatus("Starte Impersonate...");
                                try {
                                  const res = await fetch(`/api/admin/users/${selectedAdminUser.id}/impersonate`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ password: adminUserImpersonatePassword })
                                  });
                                  const data = await res.json().catch(() => ({}));
                                  if (!res.ok) {
                                    setAdminUserImpersonateStatus(humanizeErrorCode(data?.error ?? "Impersonate failed"));
                                    return;
                                  }
                                  const impToken = String(data.token ?? "");
                                  if (!impToken) {
                                    setAdminUserImpersonateStatus("Kein Session-Token erhalten.");
                                    return;
                                  }
                                  const base = typeof window !== "undefined" ? window.location.origin : "";
                                  const url = `${base}/?impersonate=1&imp_token=${encodeURIComponent(impToken)}`;
                                  const win = window.open(url, "_blank", "noopener,noreferrer");
                                  if (!win) {
                                    setAdminUserImpersonateStatus("Popup blockiert. Bitte Popups erlauben.");
                                    return;
                                  }
                                  setAdminUserImpersonateStatus(`Impersonate aktiv fuer ${selectedAdminUser.username}.`);
                                  setAdminUserImpersonatePassword("");
                                } catch {
                                  setAdminUserImpersonateStatus("Impersonate failed");
                                } finally {
                                  setAdminUserImpersonateBusy(false);
                                }
                              }}
                            >
                              Open as User
                            </button>
                          </div>
                          {adminUserImpersonateStatus ? (
                            <div className="muted small">{adminUserImpersonateStatus}</div>
                          ) : null}
                        </div>

                        <div className="admin-user-perms">
                          <div className="perm-title">Permissions</div>
                          <div className="perm-grid">
                            {USER_PERMISSION_DEFS.map((perm) => {
                              const isUserAdmin = selectedAdminUser.role === "admin";
                              const enabled = (selectedAdminUser.permissions ?? {})[perm.key] ?? perm.defaultEnabled;
                              const permBusyKey = `${selectedAdminUser.id}:${perm.key}`;
                              const permBusy = Boolean(adminUserPermBusy[permBusyKey]);
                              return (
                                <label key={perm.key} className="perm-toggle">
                                  <span>{perm.label}</span>
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    disabled={isUserAdmin || permBusy}
                                    onChange={async (e) => {
                                      if (!token) return;
                                      const next = e.target.checked;
                                      setAdminUserPermBusy((prev) => ({ ...prev, [permBusyKey]: true }));
                                      try {
                                        const res = await fetch(`/api/admin/users/${selectedAdminUser.id}/permissions`, {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`
                                          },
                                          body: JSON.stringify({ key: perm.key, enabled: next })
                                        });
                                        if (!res.ok) return;
                                        setAdminUsers((prev) =>
                                          prev.map((row) =>
                                            row.id === selectedAdminUser.id
                                              ? { ...row, permissions: { ...(row.permissions ?? {}), [perm.key]: next } }
                                              : row
                                          )
                                        );
                                      } finally {
                                        setAdminUserPermBusy((prev) => ({ ...prev, [permBusyKey]: false }));
                                      }
                                    }}
                                  />
                                </label>
                              );
                            })}
                          </div>
                          {selectedAdminUser.role === "admin" ? (
                            <div className="muted small">Admin has full access.</div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="muted small">Noch kein User geladen. Bitte Suche ausfuehren.</div>
                    )}

                    <div className="muted small">
                      Hinweis: User-Liste wird absichtlich nicht global geladen. Suche erfolgt gezielt ueber Formular.
                    </div>
                  </div>
                </section>

                <section className={`panel ${adminTab === "applications" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Applications</h3>
                    <span className="badge">Review</span>
                  </div>
                  <div className="form-grid">
                    {adminApplications.length === 0 ? (
                      <div className="muted small">No applications yet.</div>
                    ) : (
                      adminApplications.map((app) => (
                        <div key={app.id} className="user-admin-row">
                          <div className="user-admin-meta">
                            <div className="stat-row">
                              <span>{app.display_name || "Applicant"}</span>
                              <span>{app.email}</span>
                            </div>
                            <div className="stat-row">
                              <span>Status {app.status}</span>
                              <span>{new Date(app.created_at).toLocaleString()}</span>
                            </div>
                            {app.handle ? <div className="muted small">Username: {app.handle}</div> : null}
                            {app.links ? <div className="muted small">Links: {app.links}</div> : null}
                            {app.message ? <div className="muted small">"{app.message}"</div> : null}
                          </div>
                          <div className="user-admin-actions">
                            <div className="user-admin-controls">
                              <button
                                className="action-btn"
                                onClick={() => {
                                  fetch(`/api/admin/applications/${app.id}`, {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ status: "approved" })
                                  }).then(() =>
                                    setAdminApplications((prev) =>
                                      prev.map((row) => (row.id === app.id ? { ...row, status: "approved" } : row))
                                    )
                                  );
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="action-btn ghost"
                                onClick={() => {
                                  fetch(`/api/admin/applications/${app.id}`, {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ status: "rejected" })
                                  }).then(() =>
                                    setAdminApplications((prev) =>
                                      prev.map((row) => (row.id === app.id ? { ...row, status: "rejected" } : row))
                                    )
                                  );
                                }}
                              >
                                Reject
                              </button>
                              {app.status === "rejected" ? (
                                <button
                                  className="action-btn ghost"
                                  onClick={() => {
                                    fetch(`/api/admin/applications/${app.id}`, {
                                      method: "DELETE",
                                      headers: { Authorization: `Bearer ${token}` }
                                    }).then(() =>
                                      setAdminApplications((prev) => prev.filter((row) => row.id !== app.id))
                                    );
                                  }}
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className={`panel ${adminTab === "models" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Model Registry</h3>
                    <span className="badge">Admin</span>
                  </div>
                  <div className="form-grid">
                    <button
                      className="action-btn"
                      onClick={() => {
                        fetch("/api/models/registry/reload", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` }
                        })
                          .then((res) => res.json())
                          .then(() => {
                            fetch("/api/models/registry", { headers: { Authorization: `Bearer ${token}` } })
                              .then((res) => res.json())
                              .then((data) => setModelRegistry(data.models ?? []))
                              .catch(() => setModelRegistry([]));
                          })
                          .catch(() => null);
                      }}
                    >
                      Reload FTP Models
                    </button>
                    <label className="form-row">
                      Kind
                      <select
                        className="input"
                        value={newModel.kind}
                        onChange={(e) => setNewModel({ ...newModel, kind: e.target.value })}
                      >
                        <option value="training_model">training_model</option>
                        <option value="base_model">base_model</option>
                        <option value="lora">lora</option>
                      </select>
                    </label>
                    <label className="form-row">
                      Name
                      <input
                        className="input"
                        value={newModel.name}
                        onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                      />
                    </label>
                    <label className="form-row">
                      Version
                      <input
                        className="input"
                        value={newModel.version}
                        onChange={(e) => setNewModel({ ...newModel, version: e.target.value })}
                      />
                    </label>
                    <label className="form-row">
                      File Path
                      <input
                        className="input"
                        value={newModel.file_path}
                        onChange={(e) => setNewModel({ ...newModel, file_path: e.target.value })}
                      />
                    </label>
                    <button
                      className="action-btn"
                      onClick={() => {
                        if (!newModel.name || !newModel.file_path) return;
                        fetch("/api/models/registry", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify(newModel)
                        }).then(() => {
                          setNewModel({ ...newModel, name: "", version: "", file_path: "" });
                        });
                      }}
                    >
                      Add Model
                    </button>
                    <div className="form-row">Registry Entries</div>
                    {modelRegistry.map((model) => (
                      <div key={model.id} className="stat-row">
                        <span>{model.name}</span>
                        <span>{model.kind}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`panel ${adminTab === "archives" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Archive Restore</h3>
                    <span className="badge">Admin</span>
                  </div>
                  <div className="form-grid">
                    <div className="archive-controls">
                      <label className="form-row">
                        Search
                        <input
                          className="input"
                          value={adminArchiveQuery}
                          onChange={(e) => setAdminArchiveQuery(e.target.value)}
                          placeholder="label or path"
                        />
                      </label>
                      <label className="form-row">
                        Type
                        <select
                          className="input"
                          value={adminArchiveTypeFilter}
                          onChange={(e) => setAdminArchiveTypeFilter(e.target.value)}
                        >
                          <option value="all">all</option>
                          <option value="pipeline_run">pipeline_run</option>
                          <option value="training_run">training_run</option>
                          <option value="generation_job">generation_job</option>
                          <option value="lora">lora</option>
                          <option value="gallery_image">gallery_image</option>
                          <option value="preview">preview</option>
                          <option value="training_output">training_output</option>
                          <option value="pipeline_output">pipeline_output</option>
                          <option value="generation_output">generation_output</option>
                          <option value="file_cleanup">file_cleanup</option>
                        </select>
                      </label>
                      <label className="form-row">
                        Reason
                        <select
                          className="input"
                          value={adminArchiveReasonFilter}
                          onChange={(e) => setAdminArchiveReasonFilter(e.target.value)}
                        >
                          <option value="all">all</option>
                          <option value="delete_pipeline_run">delete_pipeline_run</option>
                          <option value="delete_training_run">delete_training_run</option>
                          <option value="delete_generation_job">delete_generation_job</option>
                          <option value="delete_lora">delete_lora</option>
                          <option value="delete_image">delete_image</option>
                          <option value="cleanup_lora_preview">cleanup_lora_preview</option>
                          <option value="delete_unused">delete_unused</option>
                        </select>
                      </label>
                      <label className="form-row">
                        Origin
                        <select
                          className="input"
                          value={adminArchiveOriginFilter}
                          onChange={(e) => setAdminArchiveOriginFilter(e.target.value)}
                        >
                          <option value="all">all</option>
                          <option value="auto">auto</option>
                          <option value="manual">manual</option>
                        </select>
                      </label>
                      <label className="form-row">
                        User ID
                        <input
                          className="input"
                          value={adminArchiveUser}
                          onChange={(e) => setAdminArchiveUser(e.target.value)}
                          placeholder="optional"
                        />
                      </label>
                      <label className="inline archive-toggle">
                        <input
                          type="checkbox"
                          checked={adminArchiveOverwrite}
                          onChange={(e) => setAdminArchiveOverwrite(e.target.checked)}
                        />
                        <span>Overwrite existing</span>
                      </label>
                      <button className="action-btn ghost" onClick={() => refreshAdminArchives()}>
                        Refresh
                      </button>
                      <label className="form-row">
                        Retention (days)
                        <input
                          className="input"
                          type="number"
                          min={1}
                          value={adminArchiveRetentionDays}
                          onChange={(e) => setAdminArchiveRetentionDays(e.target.value)}
                        />
                      </label>
                      <button className="action-btn ghost" onClick={saveArchiveRetentionDays}>
                        Save Retention
                      </button>
                      <button className="action-btn danger" onClick={pruneArchivesNow}>
                        Archive Prune
                      </button>
                    </div>
                    <div className="muted small">
                      Archived deletions are retained for {adminArchiveRetentionDays || "30"} day(s). Restores re-create
                      files and register them in file registry.
                    </div>
                    {adminArchiveMessage ? <div className="muted small">{adminArchiveMessage}</div> : null}
                    {adminArchiveLoading ? (
                      <div className="muted small">Loading archives...</div>
                    ) : (
                      <div className="archive-list">
                        {adminArchives
                          .filter((item) =>
                            adminArchiveTypeFilter === "all" ? true : (item.type ?? "unknown") === adminArchiveTypeFilter
                          )
                          .filter((item) =>
                            adminArchiveReasonFilter === "all"
                              ? true
                              : (item.reason ?? "unknown") === adminArchiveReasonFilter
                          )
                          .filter((item) =>
                            adminArchiveOriginFilter === "all"
                              ? true
                              : (item.origin ?? "auto") === adminArchiveOriginFilter
                          ).length === 0 ? (
                          <div className="muted small">No archives found.</div>
                        ) : (
                          adminArchives
                            .filter((item) =>
                              adminArchiveTypeFilter === "all"
                                ? true
                                : (item.type ?? "unknown") === adminArchiveTypeFilter
                            )
                            .filter((item) =>
                              adminArchiveReasonFilter === "all"
                                ? true
                                : (item.reason ?? "unknown") === adminArchiveReasonFilter
                            )
                            .filter((item) =>
                              adminArchiveOriginFilter === "all"
                                ? true
                                : (item.origin ?? "auto") === adminArchiveOriginFilter
                            )
                            .map((item) => (
                              <div key={item.path} className="archive-row">
                                <div>
                                  <div className="archive-title">{item.display_name ?? item.label ?? "archive"}</div>
                                  <div className="muted small">{item.path}</div>
                                  <div className="archive-meta">
                                    <span>{item.type ?? "unknown"}</span>
                                    <span>{item.reason ?? "unknown"}</span>
                                    <span>{item.origin ?? "auto"}</span>
                                    <span>{item.source_name ?? item.source_id ?? "—"}</span>
                                    <span>{item.user_id ?? "system"}</span>
                                    <span>{formatBytes(item.size_bytes ?? 0)}</span>
                                    <span>{item.entry_count ?? 0} items</span>
                                    <span>{new Date(item.modified_at).toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="archive-actions">
                                  <button
                                    className="action-btn ghost"
                                    onClick={() => openArchiveDetails(item.path)}
                                  >
                                    Details
                                  </button>
                                  <button
                                    className="action-btn danger"
                                    onClick={() => {
                                      if (
                                        !window.confirm(
                                          "Permanently delete this archive? This cannot be undone."
                                        )
                                      )
                                        return;
                                      deleteAdminArchive(item.path);
                                    }}
                                  >
                                    Remove
                                  </button>
                                  <button
                                    className="action-btn"
                                    onClick={() => {
                                      if (!window.confirm("Restore this archive?")) return;
                                      restoreAdminArchive(item.path);
                                    }}
                                  >
                                    Restore
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section className={`panel ${adminTab === "notifications" ? "" : "is-hidden"}`}>
                  <div className="panel-header">
                    <h3>Notifications</h3>
                    <span className="badge">Admin</span>
                  </div>
                  <div className="settings-grid">
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Enable</span>
                        <span className="muted small">Master switch plus per-event controls.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">Notifications enabled</div>
                          <div className="muted small">Master switch for all notifications.</div>
                        </div>
                        <select
                          className="input"
                          value={notifyEnabled ? "true" : "false"}
                          onChange={(e) => setNotifyEnabled(e.target.value === "true")}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Instance label</div>
                          <div className="muted small">Shown in notification footers.</div>
                        </div>
                        <input
                          className="input"
                          value={instanceLabel}
                          onChange={(e) => setInstanceLabel(e.target.value)}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Instance URL</div>
                          <div className="muted small">Link target for notifications.</div>
                        </div>
                        <input
                          className="input"
                          value={instanceUrl}
                          onChange={(e) => setInstanceUrl(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Channels</span>
                        <span className="muted small">Choose which channels receive notifications.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">Email (SMTP)</div>
                          <div className="muted small">Enable SMTP delivery.</div>
                        </div>
                        <select
                          className="input"
                          value={notifyChannelEmail ? "true" : "false"}
                          onChange={(e) => setNotifyChannelEmail(e.target.value === "true")}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Slack</div>
                          <div className="muted small">Webhook delivery.</div>
                        </div>
                        <select
                          className="input"
                          value={notifyChannelSlack ? "true" : "false"}
                          onChange={(e) => setNotifyChannelSlack(e.target.value === "true")}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Discord</div>
                          <div className="muted small">Webhook delivery.</div>
                        </div>
                        <select
                          className="input"
                          value={notifyChannelDiscord ? "true" : "false"}
                          onChange={(e) => setNotifyChannelDiscord(e.target.value === "true")}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Generic Webhook</div>
                          <div className="muted small">POST JSON payload to your endpoint.</div>
                        </div>
                        <select
                          className="input"
                          value={notifyChannelWebhook ? "true" : "false"}
                          onChange={(e) => setNotifyChannelWebhook(e.target.value === "true")}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                      <label className="form-row">
                        Slack webhook URL
                        <input
                          className="input"
                          value={slackWebhookUrl}
                          onChange={(e) => setSlackWebhookUrl(e.target.value)}
                        />
                      </label>
                      <label className="form-row">
                        Discord webhook URL
                        <input
                          className="input"
                          value={discordWebhookUrl}
                          onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                        />
                      </label>
                      <label className="form-row">
                        Webhook URL
                        <input
                          className="input"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                        />
                      </label>
                      <label className="form-row">
                        Webhook secret
                        <input
                          className="input"
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="setting-group">
                      <div className="group-head">
                        <span>Events</span>
                        <span className="muted small">Choose which events trigger notifications.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">Job finished</div>
                          <div className="muted small">Run transitions to done.</div>
                        </div>
                        <select
                          className="input"
                          value={notifyJobFinish ? "true" : "false"}
                          onChange={(e) => setNotifyJobFinish(e.target.value === "true")}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Job failed</div>
                          <div className="muted small">Run transitions to failed.</div>
                        </div>
                        <select
                          className="input"
                          value={notifyJobFailed ? "true" : "false"}
                          onChange={(e) => setNotifyJobFailed(e.target.value === "true")}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Queue drained</div>
                          <div className="muted small">No active runs and workers idle.</div>
                        </div>
                        <select
                          className="input"
                          value={notifyQueueFinish ? "true" : "false"}
                          onChange={(e) => setNotifyQueueFinish(e.target.value === "true")}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                    </div>
                    <div className="setting-group">
                      <div className="group-head">
                        <span>SMTP</span>
                        <span className="muted small">Credentials for email delivery.</span>
                      </div>
                      <label className="setting-row">
                        <div>
                          <div className="name">Host</div>
                          <div className="muted small">SMTP server hostname.</div>
                        </div>
                        <input
                          className="input"
                          value={smtpSettings.smtp_host}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Port</div>
                          <div className="muted small">587 (STARTTLS) or 465 (SSL).</div>
                        </div>
                        <input
                          className="input"
                          value={smtpSettings.smtp_port}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_port: e.target.value })}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Username</div>
                          <div className="muted small">Leave empty if not required.</div>
                        </div>
                        <input
                          className="input"
                          value={smtpSettings.smtp_user}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_user: e.target.value })}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Password</div>
                          <div className="muted small">Stored in DB (masked in UI).</div>
                        </div>
                        <input
                          className="input"
                          type="password"
                          value={smtpSettings.smtp_pass}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_pass: e.target.value })}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">From</div>
                          <div className="muted small">Sender address.</div>
                        </div>
                        <input
                          className="input"
                          value={smtpSettings.smtp_from}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_from: e.target.value })}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">To</div>
                          <div className="muted small">Recipient address.</div>
                        </div>
                        <input
                          className="input"
                          value={smtpTo}
                          onChange={(e) => setSmtpTo(e.target.value)}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Base URL</div>
                          <div className="muted small">Reset links base.</div>
                        </div>
                        <input
                          className="input"
                          value={smtpSettings.smtp_base_url}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_base_url: e.target.value })}
                        />
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Use SSL</div>
                          <div className="muted small">Implicit SSL (disable STARTTLS).</div>
                        </div>
                        <select
                          className="input"
                          value={smtpSettings.smtp_ssl ? "true" : "false"}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_ssl: e.target.value === "true" })}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                      <label className="setting-row">
                        <div>
                          <div className="name">Use TLS</div>
                          <div className="muted small">STARTTLS upgrade for SMTP.</div>
                        </div>
                        <select
                          className="input"
                          value={smtpSettings.smtp_tls ? "true" : "false"}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_tls: e.target.value === "true" })}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </label>
                    </div>
                    <button
                      className="action-btn"
                      onClick={() => {
                        const entries: [string, any][] = [
                          ["instance_label", instanceLabel],
                          ["instance_url", instanceUrl],
                          ["notifications_enabled", notifyEnabled],
                          ["notify_channel_email", notifyChannelEmail],
                          ["notify_channel_slack", notifyChannelSlack],
                          ["notify_channel_discord", notifyChannelDiscord],
                          ["notify_channel_webhook", notifyChannelWebhook],
                          ["notify_job_finish", notifyJobFinish],
                          ["notify_job_failed", notifyJobFailed],
                          ["notify_queue_finish", notifyQueueFinish],
                          ["slack_webhook_url", slackWebhookUrl],
                          ["discord_webhook_url", discordWebhookUrl],
                          ["webhook_url", webhookUrl],
                          ["webhook_secret", webhookSecret],
                          ["smtp_host", smtpSettings.smtp_host],
                          ["smtp_port", Number(smtpSettings.smtp_port || 587)],
                          ["smtp_user", smtpSettings.smtp_user],
                          ["smtp_pass", smtpSettings.smtp_pass],
                          ["smtp_from", smtpSettings.smtp_from],
                          ["smtp_to", smtpTo],
                          ["smtp_base_url", smtpSettings.smtp_base_url],
                          ["smtp_ssl", smtpSettings.smtp_ssl],
                          ["smtp_tls", smtpSettings.smtp_tls]
                        ];
                        Promise.all(
                          entries.map(([key, value]) =>
                            fetch("/api/settings/admin", {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({ key, value })
                            })
                          )
                        ).then(() => null);
                      }}
                    >
                      Save Notifications
                    </button>
                  </div>
                </section>
              </div>
            </section>
          ) : null}
        </main>
        {token && !isMobileRouteActive ? (
          <div className={`mini-dm ${miniDmOpen ? "is-open" : ""}`}>
            {!miniDmOpen ? (
              <button
                className="mini-dm-toggle"
                onClick={() => {
                  setMiniDmOpen(true);
                  setMiniDmMode("threads");
                  refreshDmThreads();
                  refreshDmUnread();
                }}
              >
                <span>Messenger</span>
                {dmUnreadCount > 0 ? <span className="badge">{dmUnreadCount}</span> : null}
              </button>
            ) : (
              <div className="mini-dm-panel">
                <div className="mini-dm-head">
                  {miniDmMode === "chat" ? (
                    <button className="action-btn ghost" onClick={() => setMiniDmMode("threads")}>
                      Back
                    </button>
                  ) : (
                    <span>Threads</span>
                  )}
                  <div className="job-actions">
                    <button
                      className="action-btn ghost"
                      onClick={() => {
                        refreshDmThreads();
                        refreshDmUnread();
                        if (miniDmThreadId) {
                          refreshDmMessages(miniDmThreadId, { incremental: true });
                        }
                      }}
                    >
                      Refresh
                    </button>
                    <button className="action-btn ghost" onClick={() => setMiniDmOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
                <div className={`mini-dm-slider ${miniDmMode === "chat" ? "is-chat" : "is-threads"}`}>
                  <div className="mini-dm-slide mini-dm-threads">
                    <input
                      className="input"
                      placeholder="Search threads..."
                      value={miniDmQuery}
                      onChange={(e) => setMiniDmQuery(e.target.value)}
                    />
                    <div className="mini-dm-thread-list">
                      {miniDmFilteredThreads.map((thread) => (
                        <button
                          key={thread.id}
                          className={`mini-dm-thread-item ${miniDmThreadId === thread.id ? "is-active" : ""}`}
                          onClick={() => {
                            setMiniDmThreadId(thread.id);
                            setDmActiveThreadId(thread.id);
                            refreshDmMessages(thread.id);
                            setMiniDmMode("chat");
                          }}
                        >
                          <span>{thread.peer_display_name || thread.peer_username}</span>
                          {Number(thread.unread_count ?? 0) > 0 ? <span className="badge">{thread.unread_count}</span> : null}
                        </button>
                      ))}
                      {!miniDmFilteredThreads.length ? <div className="muted small">No threads.</div> : null}
                    </div>
                  </div>
                  <div className="mini-dm-slide mini-dm-chat">
                    <div className="mini-dm-chat-title muted small">
                      {miniDmActiveThread ? `@${miniDmActiveThread.peer_username}` : "No thread selected"}
                    </div>
                    {miniDmActiveThread ? (
                      <div className="job-actions">
                        {miniDmActiveThread.blocked_by_me ? (
                          <button className="action-btn ghost" onClick={() => unblockDmUser(miniDmActiveThread.peer_user_id)}>
                            Unblock
                          </button>
                        ) : (
                          <button className="action-btn danger" onClick={() => blockDmUser(miniDmActiveThread.peer_user_id)}>
                            Block
                          </button>
                        )}
                        <button
                          className="action-btn ghost"
                          onClick={() => {
                            deleteDmThread(miniDmActiveThread.id);
                            setMiniDmMode("threads");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                    <div className="mini-dm-message-list">
                      {dmMessages.map((message) => {
                        const mine = message.sender_user_id === user?.id;
                        return (
                          <div key={message.id} className={`mini-dm-bubble ${mine ? "is-mine" : "is-peer"}`}>
                            <div>{message.body}</div>
                          </div>
                        );
                      })}
                      {!dmMessages.length ? <div className="muted small">No messages yet.</div> : null}
                    </div>
                    <div className="mini-dm-compose">
                      <textarea
                        className="input"
                        rows={2}
                        value={dmDraft}
                        onChange={(e) => setDmDraft(e.target.value)}
                        placeholder={miniDmActiveThread ? `Write to @${miniDmActiveThread.peer_username}` : "Write message..."}
                      />
                      <div className="job-actions">
                        <button className="action-btn ghost" onClick={() => setMiniDmEmojiOpen((prev) => !prev)}>
                          Emoji
                        </button>
                        <button className="action-btn" onClick={() => sendDmMessage({ threadId: miniDmThreadId })}>
                          Send
                        </button>
                      </div>
                      {miniDmEmojiOpen ? (
                        <div className="mini-dm-emoji-grid">
                          {DM_EMOJI_SET.map((emoji) => (
                            <button
                              key={`mini-${emoji}`}
                              className="mini-dm-emoji-btn"
                              onClick={() => setDmDraft((prev) => `${prev}${emoji}`)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
        {adminArchiveDetailOpen ? (
          <div className="modal-overlay">
            <div className="archive-details-modal">
              <div className="manual-header">
                <div>
                  <div className="title">Archive Details</div>
                  <div className="muted small">{adminArchiveDetail?.archive?.display_name ?? "Loading..."}</div>
                </div>
                <button className="action-btn ghost" onClick={() => setAdminArchiveDetailOpen(false)}>
                  Close
                </button>
              </div>
              <div className="archive-details-body">
                {!adminArchiveDetail ? (
                  <div className="muted small">Loading archive details...</div>
                ) : (
                  <>
                    <div className="detail-group">
                      <div className="detail-title">Overview</div>
                      <div className="archive-detail-grid">
                        <div className="stat-row">
                          <span>Type</span>
                          <span>{adminArchiveDetail.archive?.type ?? "unknown"}</span>
                        </div>
                        <div className="stat-row">
                          <span>Reason</span>
                          <span>{adminArchiveDetail.archive?.reason ?? "unknown"}</span>
                        </div>
                        <div className="stat-row">
                          <span>Origin</span>
                          <span>{adminArchiveDetail.archive?.origin ?? "auto"}</span>
                        </div>
                        <div className="stat-row">
                          <span>Source</span>
                          <span>
                            {adminArchiveDetail.archive?.source_name ?? adminArchiveDetail.archive?.source_id ?? "—"}
                          </span>
                        </div>
                        <div className="stat-row">
                          <span>User</span>
                          <span>{adminArchiveDetail.archive?.user_id ?? "system"}</span>
                        </div>
                        <div className="stat-row">
                          <span>Items</span>
                          <span>{adminArchiveDetail.archive?.entry_count ?? 0}</span>
                        </div>
                        <div className="stat-row">
                          <span>Size</span>
                          <span>{formatBytes(adminArchiveDetail.archive?.size_bytes ?? 0)}</span>
                        </div>
                        <div className="stat-row">
                          <span>Modified</span>
                          <span>
                            {adminArchiveDetail.archive?.modified_at
                              ? new Date(adminArchiveDetail.archive.modified_at).toLocaleString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="muted small">{adminArchiveDetail.archive?.path}</div>
                    </div>
                    <div className="detail-group">
                      <div className="detail-title">Entries</div>
                      <input
                        className="input"
                        placeholder="Filter entries"
                        value={adminArchiveEntryFilter}
                        onChange={(e) => setAdminArchiveEntryFilter(e.target.value)}
                      />
                      <div className="archive-entry-list">
                        {adminArchiveDetail.entries
                          .filter((entry) =>
                            adminArchiveEntryFilter.trim()
                              ? entry.path.toLowerCase().includes(adminArchiveEntryFilter.trim().toLowerCase())
                              : true
                          )
                          .map((entry) => (
                            <div key={`${entry.path}-${entry.name}`} className="archive-entry-row">
                              <span>{entry.path}</span>
                              <span>{entry.type}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="detail-group">
                      <div className="detail-title">Actions</div>
                      <button
                        className="action-btn"
                        onClick={() => {
                          if (!adminArchiveDetail.archive?.path) return;
                          if (!window.confirm("Restore this archive?")) return;
                          restoreAdminArchive(adminArchiveDetail.archive.path);
                        }}
                      >
                        Restore Archive
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => {
                          if (!adminArchiveDetail?.archive?.path) return;
                          if (
                            !window.confirm(
                              "Permanently delete this archive? This cannot be undone."
                            )
                          )
                            return;
                          deleteAdminArchive(adminArchiveDetail.archive.path);
                          setAdminArchiveDetailOpen(false);
                        }}
                      >
                        Remove Archive
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {adminLedgerDetailOpen ? (
          <div className="modal-overlay">
            <div className="archive-details-modal">
              <div className="manual-header">
                <div>
                  <div className="title">Credit Ledger Detail</div>
                  <div className="muted small job-actions">
                    <span>{adminLedgerDetail?.entry?.id ?? "Loading..."}</span>
                    {adminLedgerDetail?.entry?.id ? (
                      <button
                        className="action-btn ghost"
                        onClick={() => copyText(adminLedgerDetail.entry.id).catch(() => null)}
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
                </div>
                <button className="action-btn ghost" onClick={() => setAdminLedgerDetailOpen(false)}>
                  Close
                </button>
              </div>
              <div className="archive-details-body">
                {!adminLedgerDetail ? (
                  <div className="muted small">Loading ledger detail...</div>
                ) : (
                  <>
                    {adminLedgerCopyStatus ? <div className="muted small">{adminLedgerCopyStatus}</div> : null}
                    <div className="detail-group">
                      <div className="detail-title">Entry</div>
                      <div className="archive-detail-grid">
                        <div className="stat-row">
                          <span>User</span>
                          <span>@{adminLedgerDetail.entry.username}</span>
                        </div>
                        <div className="stat-row">
                          <span>User ID</span>
                          <span className="job-actions">
                            <span>{adminLedgerDetail.entry.user_id}</span>
                            <button
                              className="action-btn ghost"
                              onClick={() => copyText(adminLedgerDetail.entry.user_id).catch(() => null)}
                            >
                              Copy
                            </button>
                          </span>
                        </div>
                        <div className="stat-row">
                          <span>Email</span>
                          <span>{adminLedgerDetail.entry.email}</span>
                        </div>
                        <div className="stat-row">
                          <span>Delta</span>
                          <span className={adminLedgerDetail.entry.delta >= 0 ? "credit-plus" : "credit-minus"}>
                            {adminLedgerDetail.entry.delta >= 0
                              ? `+${adminLedgerDetail.entry.delta}`
                              : adminLedgerDetail.entry.delta}
                          </span>
                        </div>
                        <div className="stat-row">
                          <span>Reason</span>
                          <span>{adminLedgerDetail.entry.reason ?? "—"}</span>
                        </div>
                        <div className="stat-row">
                          <span>Ref Type</span>
                          <span>{adminLedgerDetail.entry.ref_type ?? "—"}</span>
                        </div>
                        <div className="stat-row">
                          <span>Ref ID</span>
                          <span className="job-actions">
                            <span>{adminLedgerDetail.entry.ref_id ?? "—"}</span>
                            {adminLedgerDetail.entry.ref_id ? (
                              <button
                                className="action-btn ghost"
                                onClick={() => copyText(String(adminLedgerDetail.entry.ref_id)).catch(() => null)}
                              >
                                Copy
                              </button>
                            ) : null}
                          </span>
                        </div>
                        <div className="stat-row">
                          <span>Created</span>
                          <span>{new Date(adminLedgerDetail.entry.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="detail-group">
                      <div className="detail-title">Matched Intent (best effort)</div>
                      {adminLedgerDetail.intent ? (
                        <pre className="archive-manifest">
                          {JSON.stringify(adminLedgerDetail.intent, null, 2)}
                        </pre>
                      ) : (
                        <div className="muted small">No matching processed intent found.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {trainerWizardOpen ? (
          <div className="modal-overlay">
            <div className="trainer-modal">
              <div className="manual-header">
                <div>
                  <div className="title">Training Wizard</div>
                  <div className="muted small">
                    Step {trainerWizardStep + 1} of {wizardSteps.length} · {wizardStepLabel}
                  </div>
                </div>
                <button className="action-btn ghost" onClick={() => closeTrainerWizard()}>
                  Cancel
                </button>
              </div>
              <div className="trainer-body">
                <div className="wizard-steps">
                  {wizardSteps.map((step, idx) => (
                    <div
                      key={`${step}-${idx}`}
                      className={`wizard-step ${
                        idx === trainerWizardStep ? "active" : idx < trainerWizardStep ? "complete" : ""
                      }`}
                    >
                      <span className="wizard-index">{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="wizard-content">
                  {trainerWizardStep === 0 ? (
                    <div className="wizard-mode-grid">
                      <button className="wizard-card" onClick={() => selectTrainerMode("single")}>
                        <div className="wizard-card-title">Single Model Training</div>
                        <div className="muted small">
                          One dataset ZIP. The model name becomes the trigger (normalized to lowercase).
                        </div>
                      </button>
                      <button className="wizard-card" onClick={() => selectTrainerMode("batch")}>
                        <div className="wizard-card-title">Batch Training</div>
                        <div className="muted small">Multiple ZIPs. Each ZIP filename becomes a trigger.</div>
                      </button>
                    </div>
                  ) : null}

                  {trainerWizardMode === "single" && trainerWizardStep === 1 ? (
                    <div className="wizard-section">
                      <div className="wizard-section-title">Model Identity</div>
                      <div className="wizard-grid">
                        <label className="form-row">
                          Model name (Trigger)
                          <input
                            className="input"
                            value={trainerName}
                            onChange={(e) => setTrainerName(e.target.value)}
                            placeholder="e.g. my_cool_model"
                          />
                        </label>
                        <div className="wizard-hint">
                          Allowed: a-z, 0-9, "_" or "-" only. No spaces. Length 3-64. Trigger is written into tags.
                        </div>
                        {!singleNameLengthValid && trainerName.trim() ? (
                          <div className="wizard-warning">Name must be 3-64 characters after normalization.</div>
                        ) : null}
                        {trainerName.trim() && !isValidTriggerName(normalizedSingleName) ? (
                          <div className="wizard-warning">Invalid characters detected. Use letters/numbers/_/- only.</div>
                        ) : null}
                        {singleTriggerDuplicate ? (
                          <div className="wizard-warning">
                            Trigger already exists: {normalizedSingleName}. You can still proceed in Review.
                          </div>
                        ) : null}
                        <div className="wizard-preview">
                          <span>Trigger preview</span>
                          <strong>{normalizedSingleName || "-"}</strong>
                        </div>
                        <label className="form-row">
                          Description
                          <textarea
                            className="input"
                            rows={2}
                            value={trainerDescription}
                            onChange={(e) => setTrainerDescription(e.target.value)}
                            placeholder="Short description (optional)."
                          />
                        </label>
                        <label className="form-row">
                          Notes
                          <textarea
                            className="input"
                            rows={2}
                            value={trainerNotes}
                            onChange={(e) => setTrainerNotes(e.target.value)}
                            placeholder="Internal notes (optional)."
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}

                  {trainerWizardMode === "single" && trainerWizardStep === 2 ? (
                    <div className="wizard-section">
                      <div className="wizard-section-title">Upload Dataset ZIP</div>
                      <div className="wizard-grid">
                        <label className="form-row">
                          ZIP file (exactly one)
                          <input
                            className="input"
                            type="file"
                            accept=".zip,application/zip,application/x-zip-compressed"
                            onChange={(e) => {
                              stageFiles(e.target.files);
                              if (e.currentTarget) e.currentTarget.value = "";
                            }}
                          />
                        </label>
                        <div className="wizard-hint">We accept a single ZIP. Remove extras before continuing.</div>
                        {stagedContainsVideos ? (
                          <div className="wizard-warning">
                            ATTENTION: Detected {stagedVideoCount} video file(s) in staged ZIP.
                          </div>
                        ) : null}
                        {stagedUploads.length === 0 ? <div className="wizard-warning">No ZIP staged yet.</div> : null}
                        {stagedUploads.length > 1 ? (
                          <div className="wizard-warning">Only one ZIP allowed for single-model training.</div>
                        ) : null}
                        <div className="staged-list">
                          {stagedUploads.length === 0 ? (
                            <div className="muted small">Drop a ZIP to start staging.</div>
                          ) : (
                            stagedUploads.map((upload) => (
                              <div key={upload.id} className="staged-item">
                                <div>
                                  <div className="name">{upload.name}</div>
                                  <div className="muted small">{formatBytes(upload.size)}</div>
                                </div>
                                <button className="action-btn ghost" onClick={() => removeStaged(upload.id)}>
                                  Remove
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="wizard-preview-list">
                          <div className="wizard-section-title">Trigger preview</div>
                          {stagedUploads.length === 0 ? (
                            <div className="muted small">Waiting for ZIP.</div>
                          ) : (
                            stagedUploads.map((upload) => (
                              <div key={`preview-${upload.id}`} className="stat-row">
                                <span>{upload.name}</span>
                                <span>{deriveZipTrigger(upload.name)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {trainerWizardMode === "batch" && trainerWizardStep === 1 ? (
                    <div className="wizard-section">
                      <div className="wizard-section-title">Upload Batch ZIPs</div>
                      <div className="wizard-grid">
                        <label className="form-row">
                          ZIP files (max {wizardMaxBatch})
                          <input
                            className="input"
                            type="file"
                            accept=".zip,application/zip,application/x-zip-compressed"
                            multiple
                            onChange={(e) => {
                              stageFiles(e.target.files);
                              if (e.currentTarget) e.currentTarget.value = "";
                            }}
                          />
                        </label>
                        <div className="wizard-hint">
                          Trigger = ZIP filename (normalized, lowercase). Invalid names are rejected.
                        </div>
                        {stagedContainsVideos ? (
                          <div className="wizard-warning">
                            ATTENTION: Detected {stagedVideoCount} video file(s) in staged ZIPs.
                          </div>
                        ) : null}
                        {batchLimitExceeded ? (
                          <div className="wizard-warning">
                            Batch limit exceeded. Max {wizardMaxBatch} ZIPs per run.
                          </div>
                        ) : null}
                        {batchInvalidNames.length > 0 ? (
                          <div className="wizard-warning">Invalid ZIP names: {batchInvalidNames.join(", ")}</div>
                        ) : null}
                        {batchInternalDuplicates.length > 0 ? (
                          <div className="wizard-warning">
                            Duplicate triggers inside batch: {batchInternalDuplicates.join(", ")}
                          </div>
                        ) : null}
                        {batchDuplicatesExisting.length > 0 ? (
                          <div className="wizard-warning">
                            Existing trigger(s) found: {batchDuplicatesExisting
                              .map((info) => info.normalized)
                              .join(", ")}
                          </div>
                        ) : null}
                        <div className="staged-list">
                          {stagedUploads.length === 0 ? (
                            <div className="muted small">Drop ZIPs to start staging.</div>
                          ) : (
                            stagedUploads.map((upload) => (
                              <div key={upload.id} className="staged-item">
                                <div>
                                  <div className="name">{upload.name}</div>
                                  <div className="muted small">{formatBytes(upload.size)}</div>
                                </div>
                                <button className="action-btn ghost" onClick={() => removeStaged(upload.id)}>
                                  Remove
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="wizard-preview-list">
                          <div className="wizard-section-title">Trigger preview</div>
                          {batchTriggerInfo.length === 0 ? (
                            <div className="muted small">Waiting for ZIPs.</div>
                          ) : (
                            batchTriggerInfo.map((info) => (
                              <div
                                key={`preview-${info.id}`}
                                className={`stat-row ${info.valid ? "" : "stat-row-error"}`}
                              >
                                <span>{info.name}</span>
                                <span>{info.normalized || "-"}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {trainerWizardMode &&
                  ((trainerWizardMode === "single" && trainerWizardStep === 3) ||
                    (trainerWizardMode === "batch" && trainerWizardStep === 2)) ? (
                    <div className="wizard-section">
                      <div className="wizard-section-title">Training & Performance • Input & Processing</div>
                      <div className="wizard-grid two-col">
                        <div className="panel">
                          <div className="panel-header">
                            <h3>Training & Performance</h3>
                            <span className="badge">GPU / Profile</span>
                          </div>
                          <div className="settings-grid">
                            <label className="setting-row">
                              <div>
                                <div className="name">Train</div>
                                <div className="muted small">Run LoRA training on finished dataset.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={runConfig.train}
                                onChange={(e) => setRunConfig({ ...runConfig, train: e.target.checked })}
                              />
                            </label>
                            <label className="setting-row">
                              <div>
                                <div className="name">Use GPU</div>
                                <div className="muted small">Accelerate autotagging when available.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={runConfig.gpu}
                                onChange={(e) => setRunConfig({ ...runConfig, gpu: e.target.checked })}
                              />
                            </label>
                            <label className="setting-row">
                              <div>
                                <div className="name">Train profile</div>
                                <div className="muted small">Training recipe for LoRA runs.</div>
                              </div>
                              <select
                                className="input"
                                value={runConfig.trainProfile}
                                onChange={(e) => setRunConfig({ ...runConfig, trainProfile: e.target.value })}
                              >
                                <option value="">Select profile</option>
                                {trainProfiles.map((profile) => (
                                  <option key={profile.id} value={profile.name}>
                                    {profile.label ?? profile.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="setting-row">
                              <div>
                                <div className="name">Base model</div>
                                <div className="muted small">Model used for training.</div>
                              </div>
                              <select
                                className="input"
                                value={runConfig.baseModelId}
                                onChange={(e) => setRunConfig({ ...runConfig, baseModelId: e.target.value })}
                              >
                                <option value="">Auto (first training model)</option>
                                {modelRegistry
                                  .filter((model) => model.kind === "training_model" || model.kind === "base_model")
                                  .map((model) => (
                                    <option key={model.id} value={model.file_id ?? ""}>
                                      {model.name}
                                    </option>
                                  ))}
                              </select>
                            </label>
                          </div>
                        </div>
                        <div className="panel">
                          <div className="panel-header">
                            <h3>Input & Processing</h3>
                            <span className="badge">Pre-Processing</span>
                          </div>
                          <div className="settings-grid">
                            <label className="setting-row">
                              <div>
                                <div className="name">Facecap</div>
                                <div className="muted small">Detect faces while capping videos.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={runConfig.facecap}
                                onChange={(e) => setRunConfig({ ...runConfig, facecap: e.target.checked })}
                              />
                            </label>
                            <label className="setting-row">
                              <div>
                                <div className="name">Images only</div>
                                <div className="muted small">Skip video capping/archive.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={runConfig.imagesOnly}
                                onChange={(e) => setRunConfig({ ...runConfig, imagesOnly: e.target.checked })}
                              />
                            </label>
                            <div className="wizard-hint">
                              Images-only skips video processing. Facecap changes pipeline behavior during capping.
                            </div>
                            {runConfig.imagesOnly && stagedContainsVideos ? (
                              <div className="wizard-warning">
                                ACHTUNG: Images-only is active, but staged ZIPs contain {stagedVideoCount} video
                                file(s). These videos will be ignored/skipped.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {trainerWizardMode &&
                  ((trainerWizardMode === "single" && trainerWizardStep === 4) ||
                    (trainerWizardMode === "batch" && trainerWizardStep === 3)) ? (
                    <div className="wizard-section">
                      <div className="wizard-section-title">Tagging</div>
                      <div className="wizard-grid two-col">
                        <div className="panel">
                          <div className="panel-header">
                            <h3>Tagging Config</h3>
                            <span className="badge">Auto / Manual</span>
                          </div>
                          <div className="settings-grid">
                            <label className="setting-row">
                              <div>
                                <div className="name">Manual tagging</div>
                                <div className="muted small">Pause after autotag to edit tags.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={runConfig.manualTagging}
                                onChange={(e) => setRunConfig({ ...runConfig, manualTagging: e.target.checked })}
                              />
                            </label>
                            <label className="setting-row">
                              <div>
                                <div className="name">Autotag</div>
                                <div className="muted small">Generate tags for each image.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={runConfig.autotag}
                                disabled={runConfig.manualTagging}
                                onChange={(e) => setRunConfig({ ...runConfig, autotag: e.target.checked })}
                              />
                            </label>
                            <label className="setting-row">
                              <div>
                                <div className="name">AutoChar</div>
                                <div className="muted small">Remove unwanted tags using presets.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={runConfig.autochar}
                                disabled={runConfig.manualTagging}
                                onChange={(e) => setRunConfig({ ...runConfig, autochar: e.target.checked })}
                              />
                            </label>
                            <label className="setting-row">
                              <div>
                                <div className="name">AutoChar presets</div>
                                <div className="muted small">Multi-select presets.</div>
                              </div>
                              <select
                                className="input"
                                multiple
                                size={5}
                                disabled={!runConfig.autochar || runConfig.manualTagging}
                                value={selectedPresets}
                                onChange={(e) =>
                                  setSelectedPresets(Array.from(e.target.selectedOptions).map((opt) => opt.value))
                                }
                              >
                                {autocharPresets.map((preset) => (
                                  <option key={preset.id} value={preset.name}>
                                    {preset.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                        <div className="panel">
                          <div className="panel-header">
                            <h3>Notes</h3>
                            <span className="badge">Manual Tagging</span>
                          </div>
                          <div className="settings-grid">
                            <div className="wizard-hint">
                              Manual tagging pauses the run after autotagging. You must resume it later.
                            </div>
                            {runConfig.manualTagging ? (
                              <div className="wizard-warning">Manual tagging is enabled. The run will pause.</div>
                            ) : (
                              <div className="muted small">Autotag runs uninterrupted when manual tagging is off.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {trainerWizardMode &&
                  ((trainerWizardMode === "single" && trainerWizardStep === 5) ||
                    (trainerWizardMode === "batch" && trainerWizardStep === 4)) ? (
                    <div className="wizard-section">
                      <div className="wizard-section-title">Sample Prompts</div>
                      <div className="wizard-grid">
                        <label className="setting-row">
                          <div>
                            <div className="name">Use defaults</div>
                            <div className="muted small">Insert default prompts for this run.</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={trainerUseDefaults}
                            onChange={(e) => {
                              const next = e.target.checked;
                              setTrainerUseDefaults(next);
                              if (next) {
                                setRunConfig((prev) => ({ ...prev, samplePrompts: [...DEFAULT_SAMPLE_PROMPTS] }));
                              }
                            }}
                          />
                        </label>
                        {runConfig.samplePrompts.map((prompt, idx) => (
                          <label key={`wizard-sample-${idx}`} className="form-row">
                            Prompt {idx + 1}
                            <input
                              className="input"
                              value={prompt}
                              disabled={trainerUseDefaults}
                              onChange={(e) => {
                                const next = [...runConfig.samplePrompts];
                                next[idx] = e.target.value;
                                setRunConfig({ ...runConfig, samplePrompts: next });
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {trainerWizardMode &&
                  ((trainerWizardMode === "single" && trainerWizardStep === 6) ||
                    (trainerWizardMode === "batch" && trainerWizardStep === 5)) ? (
                    <div className="wizard-section">
                      <div className="wizard-section-title">Review & Confirm</div>
                      <div className="wizard-summary">
                        <div className="summary-group">
                          <div className="summary-title">Triggers</div>
                          <div className="summary-body">
                            {trainerWizardMode === "single" ? (
                              <div className="stat-row">
                                <span>{trainerName || "-"}</span>
                                <span>{normalizedSingleName || "-"}</span>
                              </div>
                            ) : (
                              batchTriggerInfo.map((info) => (
                                <div key={`summary-${info.id}`} className="stat-row">
                                  <span>{info.name}</span>
                                  <span>{info.normalized || "-"}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="summary-group">
                          <div className="summary-title">Credits</div>
                          <div className="summary-body">
                            <div className="stat-row">
                              <span>Per run</span>
                              <span>{creditsPerRun}</span>
                            </div>
                            {trainerWizardMode === "batch" ? (
                              <div className="stat-row">
                                <span>Total ({batchUploadCount} runs)</span>
                                <span>{creditsTotal}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="summary-group">
                          <div className="summary-title">Training & Performance</div>
                          <div className="summary-body">
                            <div className="stat-row">
                              <span>Training</span>
                              <span>{runConfig.train ? "enabled" : "disabled"}</span>
                            </div>
                            <div className="stat-row">
                              <span>GPU</span>
                              <span>{runConfig.gpu ? "enabled" : "disabled"}</span>
                            </div>
                            <div className="stat-row">
                              <span>Profile</span>
                              <span>{runConfig.trainProfile || "auto"}</span>
                            </div>
                            <div className="stat-row">
                              <span>Base model</span>
                              <span>{runConfig.baseModelId || "auto"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="summary-group">
                          <div className="summary-title">Tagging</div>
                          <div className="summary-body">
                            <div className="stat-row">
                              <span>Manual</span>
                              <span>{runConfig.manualTagging ? "yes (pause)" : "no"}</span>
                            </div>
                            <div className="stat-row">
                              <span>Autotag</span>
                              <span>{runConfig.autotag ? "enabled" : "disabled"}</span>
                            </div>
                            <div className="stat-row">
                              <span>AutoChar</span>
                              <span>
                                {runConfig.autochar ? `enabled (${selectedPresets.length} presets)` : "disabled"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="summary-group">
                          <div className="summary-title">Input Flags</div>
                          <div className="summary-body">
                            <div className="stat-row">
                              <span>Images only</span>
                              <span>{runConfig.imagesOnly ? "yes" : "no"}</span>
                            </div>
                            <div className="stat-row">
                              <span>Facecap</span>
                              <span>{runConfig.facecap ? "yes" : "no"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="summary-group">
                          <div className="summary-title">Sample Prompts</div>
                          <div className="summary-body">
                            {runConfig.samplePrompts.filter((prompt) => prompt.trim() !== "").length === 0 ? (
                              <div className="muted small">No prompts provided.</div>
                            ) : (
                              runConfig.samplePrompts
                                .filter((prompt) => prompt.trim() !== "")
                                .map((prompt, idx) => (
                                  <div key={`prompt-summary-${idx}`} className="muted small">
                                    {prompt}
                                  </div>
                                ))
                            )}
                          </div>
                        </div>
                        {trainerWizardMode === "single" ? (
                          <div className="summary-group">
                            <div className="summary-title">Metadata</div>
                            <div className="summary-body">
                              <div className="stat-row">
                                <span>Description</span>
                                <span>{trainerDescription || "-"}</span>
                              </div>
                              <div className="stat-row">
                                <span>Notes</span>
                                <span>{trainerNotes || "-"}</span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      {batchLimitExceeded ? (
                        <div className="wizard-warning">
                          Batch limit exceeded. Reduce to {wizardMaxBatch} ZIPs.
                        </div>
                      ) : null}
                      {batchInternalDuplicates.length > 0 ? (
                        <div className="wizard-warning">
                          Duplicate triggers inside batch: {batchInternalDuplicates.join(", ")}.
                        </div>
                      ) : null}
                      {duplicateWarning ? (
                        <div className="wizard-warning">
                          Trigger already exists: {duplicateWarningNames.join(", ")}. Confirmation required on start.
                        </div>
                      ) : null}
                      {uploadMessage ? <div className="wizard-hint">{uploadMessage}</div> : null}
                    </div>
                  ) : null}
                </div>
                <div className="wizard-actions">
                  <button className="action-btn ghost" disabled={trainerWizardStep === 0} onClick={goWizardBack}>
                    Back
                  </button>
                  {trainerWizardMode && trainerWizardStep < wizardSteps.length - 1 ? (
                    <button className="action-btn" disabled={!wizardCanContinue()} onClick={goWizardNext}>
                      Next
                    </button>
                  ) : null}
                  {trainerWizardMode && trainerWizardStep === wizardSteps.length - 1 ? (
                    <button
                      className="action-btn"
                      disabled={!wizardSubmitReadyBase}
                      onClick={() => submitWizardTraining()}
                    >
                      Start Training
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {trainerDuplicateConfirmOpen ? (
          <div className="modal-overlay">
            <div className="confirm-modal">
              <div className="manual-header">
                <div>
                  <div className="title">Duplicate Trigger Found</div>
                  <div className="muted small">Proceeding may overwrite or conflict with existing runs.</div>
                </div>
                <button className="action-btn ghost" onClick={() => setTrainerDuplicateConfirmOpen(false)}>
                  Close
                </button>
              </div>
              <div className="manual-body">
                <div className="wizard-warning">
                  Trigger already exists: {duplicateWarningNames.join(", ")}. Continue anyway?
                </div>
                <div className="wizard-actions">
                  <button className="action-btn ghost" onClick={() => setTrainerDuplicateConfirmOpen(false)}>
                    Cancel
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => {
                      setTrainerConfirmDuplicates(true);
                      setTrainerDuplicateConfirmOpen(false);
                      submitWizardTraining({ forceDuplicateConfirm: true });
                    }}
                  >
                    Yes, start training
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {manualOpen ? (
          <div className="modal-overlay">
            <div className="manual-modal">
              <div className="manual-header">
                <div>
                  <div className="title">Manual Tagging</div>
                  <div className="muted small">{manualRunName || manualRunId}</div>
                  <div className="muted small">{manualRunId}</div>
                </div>
                <button
                  className="action-btn ghost"
                  onClick={() => {
                    setManualOpen(false);
                    setManualRunId("");
                  }}
                >
                  Close
                </button>
              </div>
              <div className="manual-body">
                <div className="manual-controls">
                  <div className="control-row">
                    <input
                      className="input"
                      placeholder="Search tags or filename"
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                    />
                    <label className="inline">
                      <input
                        type="checkbox"
                        checked={manualFaceOnly}
                        onChange={(e) => setManualFaceOnly(e.target.checked)}
                      />
                      <span>Face only</span>
                    </label>
                  </div>
                  <div className="control-row">
                    <input
                      className="input"
                      placeholder="Add tags (comma)"
                      value={manualBulkAdd}
                      onChange={(e) => setManualBulkAdd(e.target.value)}
                    />
                    <button className="action-btn ghost" onClick={() => applyManualBulk("add")}>
                      Apply Add
                    </button>
                    <input
                      className="input"
                      placeholder="Remove tags (comma)"
                      value={manualBulkRemove}
                      onChange={(e) => setManualBulkRemove(e.target.value)}
                    />
                    <button className="action-btn ghost" onClick={() => applyManualBulk("remove")}>
                      Apply Remove
                    </button>
                  </div>
                <div className="control-row tags-row">
                  <input
                    className="input"
                    placeholder="Filter tags"
                    value={manualTagFilter}
                    onChange={(e) => setManualTagFilter(e.target.value)}
                  />
                  <div className="tag-match">
                    <span className="muted small">Match</span>
                    <button
                      className={`action-btn ghost ${manualTagMatch === "any" ? "is-active" : ""}`}
                      onClick={() => setManualTagMatch("any")}
                    >
                      Any
                    </button>
                    <button
                      className={`action-btn ghost ${manualTagMatch === "all" ? "is-active" : ""}`}
                      onClick={() => setManualTagMatch("all")}
                    >
                      All
                    </button>
                  </div>
                  <button className="action-btn ghost" onClick={removeSelectedTags}>
                    Remove Selected Tags
                  </button>
                  <button className="action-btn" onClick={saveManualChanges}>
                    Save Changes
                    </button>
                    <button className="action-btn" onClick={resumeManualRun}>
                      Resume Pipeline
                    </button>
                  </div>
                  <div className="manual-tags">
                  {manualTagsVisible.length === 0 ? (
                    <div className="muted small">No tags yet.</div>
                  ) : (
                    manualTagsVisible.map((tag) => (
                      <button
                        key={tag.tag}
                        className={`tag-chip ${manualFilterTags.includes(tag.tag) ? "active" : ""}`}
                        onClick={() =>
                          setManualFilterTags((prev) =>
                            prev.includes(tag.tag) ? prev.filter((t) => t !== tag.tag) : [...prev, tag.tag]
                          )
                        }
                      >
                        {tag.tag} · {tag.count}
                      </button>
                      ))
                    )}
                  </div>
                  {manualMsg ? <div className="manual-msg">{manualMsg}</div> : null}
                </div>
                <div className="manual-grid">
                  {manualVisible.length === 0 ? (
                    <div className="muted small">No images loaded.</div>
                  ) : (
                    manualVisible.map((img) => (
                      <div key={img.path} className="manual-card">
                        <div className="manual-card-head">
                          <label className="inline">
                            <input
                              type="checkbox"
                              checked={manualSelected.includes(img.path)}
                              onChange={() => toggleManualSelected(img.path)}
                            />
                            <span>Select</span>
                          </label>
                          {img.isFace ? <span className="pill pill-queued">face</span> : null}
                        </div>
                        <img src={img.url} alt={img.name} />
                        <div className="manual-meta">{img.name}</div>
                        <textarea
                          rows={3}
                          value={img.caption}
                          onChange={(e) => updateManualCaption(img.path, e.target.value)}
                        />
                      </div>
                    ))
                  )}
                </div>
                <div className="manual-footer">
                  <button
                    className="action-btn ghost"
                    disabled={manualFiltered.length <= manualPage * 48}
                    onClick={() => setManualPage((prev) => prev + 1)}
                  >
                    Load More
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {selectedImage ? (
          <div className="image-modal">
            <div className="image-modal-content">
              <button className="modal-close" onClick={() => setSelectedImage(null)}>
                Close
              </button>
              <div className="modal-body">
                <div className="modal-image">
                  <img src={fileUrl(selectedImage.file_id, token)} alt="" />
                </div>
                <div className="modal-info">
                  <div className="panel-header">
                    <h3>Image</h3>
                    <span className="badge">@{selectedImage.username}</span>
                  </div>
                  <div className="stat-row">
                    <span>Prompt</span>
                    <span>{selectedImage.prompt ?? ""}</span>
                  </div>
                  {selectedImage.negative_prompt ? (
                    <div className="stat-row">
                      <span>Negative</span>
                      <span>{selectedImage.negative_prompt}</span>
                    </div>
                  ) : null}
                  <div className="stat-row">
                    <span>Model</span>
                    <span>{selectedModelLabel || "–"}</span>
                  </div>
                  {selectedLoraLabels.length ? (
                    <div className="stat-row">
                      <span>LoRAs</span>
                      <span>{selectedLoraLabels.join(", ")}</span>
                    </div>
                  ) : null}
                  <div className="stat-row">
                    <span>Sampler</span>
                    <span>{selectedImage.sampler ?? "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Scheduler</span>
                    <span>{selectedImage.scheduler ?? "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Steps</span>
                    <span>{selectedImage.steps ?? "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>CFG</span>
                    <span>{selectedImage.cfg_scale ?? "–"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Seed</span>
                    <span>{selectedImage.seed ?? "–"}</span>
                  </div>
                  <div className="modal-actions lora-actions lora-actions--social">
                    <button
                      className="action-btn"
                      onClick={() => {
                        if (!token || !selectedMeta) return;
                        const method = selectedMeta.user_liked ? "DELETE" : "POST";
                        fetch(`/api/gallery/images/${selectedImage.id}/like`, {
                          method,
                          headers: { Authorization: `Bearer ${token}` }
                        })
                          .then(() => {
                            setSelectedMeta((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    user_liked: !prev.user_liked,
                                    likes: prev.likes + (prev.user_liked ? -1 : 1)
                                  }
                                : prev
                            );
                          })
                          .catch(() => null);
                      }}
                    >
                      {selectedMeta?.user_liked ? "Unlike" : "Like"} ({selectedMeta?.likes ?? 0})
                    </button>
                    <a
                      className="action-btn ghost"
                      href={fileUrl(selectedImage.file_id, token)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  </div>
                  <div className="modal-actions lora-actions lora-actions--primary">
                    {selectedImage.user_id === user?.id ? (
                      <button
                        className="action-btn ghost"
                        onClick={() => {
                          if (!token) return;
                          fetch(`/api/gallery/images/${selectedImage.id}/public`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ is_public: !selectedImage.is_public })
                          })
                            .then(() => {
                              const nextIsPublic = !selectedImage.is_public;
                              setSelectedImage((prev) => (prev ? { ...prev, is_public: nextIsPublic } : prev));
                              refreshGalleryImages();
                              if (galleryMode === "private" && nextIsPublic) {
                                setSelectedImage(null);
                              }
                              if (galleryMode === "public" && !nextIsPublic) {
                                setSelectedImage(null);
                              }
                            })
                            .catch(() => null);
                        }}
                      >
                        {selectedImage.is_public ? "Make Private" : "Make Public"}
                      </button>
                    ) : null}
                    {selectedImage.user_id === user?.id || isAdmin ? (
                      <button
                        className="action-btn ghost"
                        onClick={() => {
                          if (!token) return;
                          fetch(`/api/gallery/images/${selectedImage.id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` }
                          })
                            .then(() => {
                              refreshGalleryImages();
                              setSelectedImage(null);
                            })
                            .catch(() => null);
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                  <div className="modal-comments">
                    <div className="muted small">Comments</div>
                    <div className="comment-list">
                      {selectedComments.map((comment) => (
                        <div key={comment.id} className="comment-row">
                          <span>@{comment.username}</span>
                          <span>{comment.body}</span>
                          {comment.pinned || comment.featured ? (
                            <span className="comment-flags">
                              {comment.pinned ? <span className="comment-flag">Pinned</span> : null}
                              {comment.featured ? <span className="comment-flag">Featured</span> : null}
                            </span>
                          ) : null}
                          {isAdmin || selectedImage.user_id === user?.id ? (
                            <>
                              <button
                                className="action-btn ghost"
                                onClick={() => {
                                  if (!token) return;
                                  fetch(`/api/gallery/images/${selectedImage.id}/comments/${comment.id}`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ pinned: !comment.pinned })
                                  })
                                    .then(() =>
                                      fetch(`/api/gallery/images/${selectedImage.id}/comments`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      })
                                    )
                                    .then((res) => res.json())
                                    .then((data) => setSelectedComments(data.comments ?? []))
                                    .catch(() => null);
                                }}
                              >
                                {comment.pinned ? "Unpin" : "Pin"}
                              </button>
                              <button
                                className="action-btn ghost"
                                onClick={() => {
                                  if (!token) return;
                                  fetch(`/api/gallery/images/${selectedImage.id}/comments/${comment.id}`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ featured: !comment.featured })
                                  })
                                    .then(() =>
                                      fetch(`/api/gallery/images/${selectedImage.id}/comments`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      })
                                    )
                                    .then((res) => res.json())
                                    .then((data) => setSelectedComments(data.comments ?? []))
                                    .catch(() => null);
                                }}
                              >
                                {comment.featured ? "Unfeature" : "Feature"}
                              </button>
                            </>
                          ) : null}
                          {comment.user_id === user?.id || selectedImage.user_id === user?.id || isAdmin ? (
                            <button
                              className="action-btn ghost"
                              onClick={() => {
                                if (!token) return;
                                fetch(`/api/gallery/images/${selectedImage.id}/comments/${comment.id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` }
                                })
                                  .then(() =>
                                    fetch(`/api/gallery/images/${selectedImage.id}/comments`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    })
                                  )
                                  .then((res) => res.json())
                                  .then((data) => setSelectedComments(data.comments ?? []))
                                  .catch(() => null);
                              }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      ))}
                      {!selectedComments.length ? <div className="muted small">No comments yet.</div> : null}
                    </div>
                    <div className="comment-input">
                      <input
                        className="input"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Add a comment"
                      />
                      <button
                        className="action-btn"
                        onClick={() => {
                          if (!token || !commentDraft.trim()) return;
                          fetch(`/api/gallery/images/${selectedImage.id}/comments`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ body: commentDraft.trim() })
                          })
                            .then(() => {
                              setCommentDraft("");
                              return fetch(`/api/gallery/images/${selectedImage.id}/comments`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                            })
                            .then((res) => res.json())
                            .then((data) => setSelectedComments(data.comments ?? []))
                            .catch(() => null);
                        }}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {selectedModel ? (
          <div className="image-modal">
            <div className="image-modal-content">
              <button className="modal-close" onClick={() => setSelectedModel(null)}>
                Close
              </button>
              <div className="modal-body">
                <div className="modal-image">
                  <div className="model-thumb-grid large">
                    {selectedModelImages.map((img) => (
                      <img key={img.id} src={fileUrl(img.file_id, token, { thumb: true, size: 320 })} alt="" loading="lazy" decoding="async" />
                    ))}
                  </div>
                </div>
                <div className="modal-info">
                  <div className="panel-header">
                    <h3>{selectedModel.name}</h3>
                    <span className="badge">@{selectedModel.username ?? "unknown"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Model ID</span>
                    <span>{selectedModel.id}</span>
                  </div>
                  <div className="stat-row">
                    <span>Status</span>
                    <span>{selectedModel.status ?? "–"}</span>
                  </div>
                  <div className="modal-actions lora-actions lora-actions--manage">
                    <button
                      className="action-btn"
                      onClick={() => {
                        if (!token || !selectedModelMeta) return;
                        const method = selectedModelMeta.user_liked ? "DELETE" : "POST";
                        fetch(`/api/gallery/models/${selectedModel.id}/like`, {
                          method,
                          headers: { Authorization: `Bearer ${token}` }
                        })
                          .then(() => {
                            setSelectedModelMeta((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    user_liked: !prev.user_liked,
                                    likes: prev.likes + (prev.user_liked ? -1 : 1)
                                  }
                                : prev
                            );
                          })
                          .catch(() => null);
                      }}
                    >
                      {selectedModelMeta?.user_liked ? "Unlike" : "Like"} ({selectedModelMeta?.likes ?? 0})
                    </button>
                  </div>
                  <div className="modal-comments">
                    <div className="muted small">Comments</div>
                    <div className="comment-list">
                      {selectedModelComments.map((comment) => (
                        <div key={comment.id} className="comment-row">
                          <span>@{comment.username}</span>
                          <span>{comment.body}</span>
                          {comment.pinned || comment.featured ? (
                            <span className="comment-flags">
                              {comment.pinned ? <span className="comment-flag">Pinned</span> : null}
                              {comment.featured ? <span className="comment-flag">Featured</span> : null}
                            </span>
                          ) : null}
                          {isAdmin || selectedModel.user_id === user?.id ? (
                            <>
                              <button
                                className="action-btn ghost"
                                onClick={() => {
                                  if (!token) return;
                                  fetch(`/api/gallery/models/${selectedModel.id}/comments/${comment.id}`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ pinned: !comment.pinned })
                                  })
                                    .then(() =>
                                      fetch(`/api/gallery/models/${selectedModel.id}/comments`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      })
                                    )
                                    .then((res) => res.json())
                                    .then((data) => setSelectedModelComments(data.comments ?? []))
                                    .catch(() => null);
                                }}
                              >
                                {comment.pinned ? "Unpin" : "Pin"}
                              </button>
                              <button
                                className="action-btn ghost"
                                onClick={() => {
                                  if (!token) return;
                                  fetch(`/api/gallery/models/${selectedModel.id}/comments/${comment.id}`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ featured: !comment.featured })
                                  })
                                    .then(() =>
                                      fetch(`/api/gallery/models/${selectedModel.id}/comments`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      })
                                    )
                                    .then((res) => res.json())
                                    .then((data) => setSelectedModelComments(data.comments ?? []))
                                    .catch(() => null);
                                }}
                              >
                                {comment.featured ? "Unfeature" : "Feature"}
                              </button>
                            </>
                          ) : null}
                          {comment.user_id === user?.id || selectedModel.user_id === user?.id || isAdmin ? (
                            <button
                              className="action-btn ghost"
                              onClick={() => {
                                if (!token) return;
                                fetch(`/api/gallery/models/${selectedModel.id}/comments/${comment.id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` }
                                })
                                  .then(() =>
                                    fetch(`/api/gallery/models/${selectedModel.id}/comments`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    })
                                  )
                                  .then((res) => res.json())
                                  .then((data) => setSelectedModelComments(data.comments ?? []))
                                  .catch(() => null);
                              }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      ))}
                      {!selectedModelComments.length ? <div className="muted small">No comments yet.</div> : null}
                    </div>
                    <div className="comment-input">
                      <input
                        className="input"
                        value={modelCommentDraft}
                        onChange={(e) => setModelCommentDraft(e.target.value)}
                        placeholder="Add a comment"
                      />
                      <button
                        className="action-btn"
                        onClick={() => {
                          if (!token || !modelCommentDraft.trim()) return;
                          fetch(`/api/gallery/models/${selectedModel.id}/comments`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ body: modelCommentDraft.trim() })
                          })
                            .then(() => {
                              setModelCommentDraft("");
                              return fetch(`/api/gallery/models/${selectedModel.id}/comments`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                            })
                            .then((res) => res.json())
                            .then((data) => setSelectedModelComments(data.comments ?? []))
                            .catch(() => null);
                        }}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {loraUploadOpen ? (
          <div className="auth-modal">
            <div className="auth-modal-content panel">
              <div className="panel-header">
                <h3>Upload LoRA</h3>
                <button className="modal-close" onClick={() => setLoraUploadOpen(false)}>
                  Close
                </button>
              </div>
              {canUploadLora ? (
                <div className="form-grid">
                  <label className="form-row">
                    LoRA file
                    <input
                      className="input"
                      type="file"
                      accept=".safetensors,.pt,.ckpt"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setLoraUploadFile(file);
                        if (file && !loraUploadName.trim()) {
                          const base = file.name.replace(/\.[^/.]+$/, "");
                          setLoraUploadName(base);
                        }
                      }}
                    />
                  </label>
                  <label className="form-row">
                    Name
                    <input
                      className="input"
                      value={loraUploadName}
                      onChange={(e) => setLoraUploadName(e.target.value)}
                    />
                  </label>
                  <label className="form-row form-check">
                    <span>Public</span>
                    <input
                      type="checkbox"
                      checked={loraUploadPublic}
                      onChange={(e) => setLoraUploadPublic(e.target.checked)}
                    />
                  </label>
                  <button
                    className="action-btn"
                    onClick={() => {
                      if (!token || !loraUploadFile) return;
                      const form = new FormData();
                      form.append("file", loraUploadFile);
                      if (loraUploadName.trim()) form.append("name", loraUploadName.trim());
                      form.append("is_public", String(loraUploadPublic));
                      setLoraUploadStatus("Uploading...");
                      setLoraUploadProgress(0);
                      const xhr = new XMLHttpRequest();
                      xhr.open("POST", "/api/loras/upload");
                      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                      xhr.upload.onprogress = (event) => {
                        if (!event.lengthComputable) return;
                        const pct = Math.round((event.loaded / event.total) * 100);
                        setLoraUploadProgress(pct);
                      };
                      xhr.upload.onload = () => {
                        setLoraUploadStatus("Processing...");
                      };
                      xhr.onload = () => {
                        try {
                          const data = JSON.parse(xhr.responseText || "{}");
                          if (xhr.status >= 400) {
                            setLoraUploadStatus(data?.error ?? "Upload failed.");
                            return;
                          }
                          setLoraUploadStatus("Uploaded.");
                          setLoraUploadFile(null);
                          setLoraUploadName("");
                          setLoraUploadPublic(false);
                          setLoraUploadProgress(100);
                          refreshLoraEntries();
                        } catch {
                          setLoraUploadStatus("Upload failed.");
                        }
                      };
                      xhr.onerror = () => setLoraUploadStatus("Upload failed.");
                      xhr.send(form);
                    }}
                  >
                    Upload to gallery
                  </button>
                  {loraUploadStatus ? <div className="muted small">{loraUploadStatus}</div> : null}
                  {loraUploadStatus === "Uploading..." ? (
                    <div className="progress">
                      <span style={{ width: `${loraUploadProgress}%` }}></span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="muted small">LoRA upload permission required.</div>
              )}
            </div>
          </div>
        ) : null}
        {view === "lora" && selectedLoraEntry && !loraDetailActive ? (
          <div className="image-modal">
            <div className="image-modal-content">
              <button
                className="modal-close"
                onClick={() => {
                  setSelectedLoraEntry(null);
                  setSelectedLoraPreview(null);
                }}
              >
                Close
              </button>
              <div className="modal-body">
                <div className="modal-image">
                  <div className="lora-preview-stage">
                    <button
                      className="lora-stage-nav"
                      onClick={() => setLoraDetailPreviewOffset((prev) => prev - 1)}
                      disabled={selectedLoraPreviewIds.length <= 2}
                    >
                      ◀
                    </button>
                    <div className="lora-previews large two-up">
                      {selectedLoraPreviewWindow.map((fileId) => (
                        <button key={fileId} className="preview-tile" onClick={() => setSelectedLoraPreview(fileId)}>
                          <img src={withToken(`/api/files/${fileId}`, token)} alt={`${selectedLoraEntry.name} preview`} />
                        </button>
                      ))}
                      {!selectedLoraPreviewIds.length ? <div className="muted small">No previews yet.</div> : null}
                    </div>
                    <button
                      className="lora-stage-nav"
                      onClick={() => setLoraDetailPreviewOffset((prev) => prev + 1)}
                      disabled={selectedLoraPreviewIds.length <= 2}
                    >
                      ▶
                    </button>
                  </div>
                  <div className="lora-stage-caption muted small">
                    {selectedLoraEntry.description?.trim() || "No description yet."}
                  </div>
                </div>
                <div className="modal-info">
                  <div className="panel-header">
                    <h3>{selectedLoraEntry.name}</h3>
                    <span className="badge">@{selectedLoraEntry.username}</span>
                  </div>
                  <div className="lora-detail-stats">
                    <div className="stat-card">
                      <div className="label">Likes</div>
                      <div className="value">{selectedLoraMeta?.likes ?? selectedLoraEntry.like_count ?? 0}</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Downloads</div>
                      <div className="value">{selectedLoraEntry.download_count ?? "—"}</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Generated</div>
                      <div className="value">{selectedLoraEntry.generated_count ?? "—"}</div>
                    </div>
                    <div className="stat-card">
                      <div className="label">Favorite</div>
                      <div className="value">planned</div>
                    </div>
                  </div>
                  <div className="model-description">
                    <div className="stat-row">
                      <span>Description</span>
                      <span />
                    </div>
                    {selectedLoraEntry.user_id === user?.id || user?.role === "admin" ? (
                      loraDescriptionEditing ? (
                        <div className="description-edit">
                          <textarea
                            className="input"
                            rows={3}
                            value={loraDescriptionDraft}
                            onChange={(e) => setLoraDescriptionDraft(e.target.value)}
                            placeholder="Add a short description for this model."
                          />
                          <div className="wizard-actions">
                            <button
                              className="action-btn ghost"
                              onClick={() => {
                                setLoraDescriptionDraft(selectedLoraEntry.description ?? "");
                                setLoraDescriptionEditing(false);
                                setLoraDescriptionStatus("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => {
                                if (!token) return;
                                const nextDescription = loraDescriptionDraft.trim();
                                fetch(`/api/loras/${selectedLoraEntry.id}`, {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ description: nextDescription })
                                })
                                  .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                                  .then(({ ok, data }) => {
                                    if (!ok) {
                                      setLoraDescriptionStatus(data?.error ?? "Update failed.");
                                      return;
                                    }
                                    setSelectedLoraEntry((prev) =>
                                      prev ? { ...prev, description: nextDescription } : prev
                                    );
                                    setLoraEntries((prev) =>
                                      prev.map((entry) =>
                                        entry.id === selectedLoraEntry.id
                                          ? { ...entry, description: nextDescription }
                                          : entry
                                      )
                                    );
                                    setLoraDescriptionStatus("Saved.");
                                    setLoraDescriptionEditing(false);
                                  })
                                  .catch(() => setLoraDescriptionStatus("Update failed."));
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="description-read">
                          <div className="muted small">
                            {selectedLoraEntry.description?.trim() ? selectedLoraEntry.description : "—"}
                          </div>
                          <button className="action-btn ghost" onClick={() => setLoraDescriptionEditing(true)}>
                            Edit description
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="muted small">
                        {selectedLoraEntry.description?.trim() ? selectedLoraEntry.description : "—"}
                      </div>
                    )}
                    {loraDescriptionStatus ? <div className="muted small">{loraDescriptionStatus}</div> : null}
                  </div>
                  <div className="stat-row">
                    <span>Source</span>
                    <span>{selectedLoraEntry.source === "external" ? "External Uploaded" : "Training"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Visibility</span>
                    <span>{selectedLoraEntry.is_public ? "Public" : "Private"}</span>
                  </div>
                  <div className="stat-row">
                    <span>Previews</span>
                    <span>
                      {selectedLoraEntry.preview_count ?? 0}/11
                      {selectedLoraEntry.preview_in_flight ? " • generating..." : ""}
                    </span>
                  </div>
                  <div className="modal-actions lora-actions lora-actions--social">
                    <button
                      className="action-btn"
                      onClick={() => {
                        if (!token || !selectedLoraMeta) return;
                        const headers = { Authorization: `Bearer ${token}` };
                        const method = selectedLoraMeta.user_liked ? "DELETE" : "POST";
                        fetch(`/api/loras/${selectedLoraEntry.id}/like`, { method, headers })
                          .then(() => {
                            setSelectedLoraMeta((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    user_liked: !prev.user_liked,
                                    likes: prev.likes + (prev.user_liked ? -1 : 1)
                                  }
                                : prev
                            );
                          })
                          .catch(() => null);
                      }}
                    >
                      {selectedLoraMeta?.user_liked ? "Unlike" : "Like"} ({selectedLoraMeta?.likes ?? 0})
                    </button>
                  </div>
                  <div className="modal-actions lora-actions lora-actions--primary">
                    <button
                      className="action-btn"
                      onClick={() => {
                        setSelectedLoraId(selectedLoraEntry.file_id);
                        setSelectedLoraName(selectedLoraEntry.name);
                        setSelectedLoraWeight(0.75);
                        setView("generator");
                      }}
                    >
                      Generate with LoRA
                    </button>
                    {selectedLoraEntry.user_id === user?.id || user?.role === "admin" ? (
                      <a
                        className="action-btn ghost"
                        href={fileUrl(selectedLoraEntry.file_id, token)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download LoRA
                      </a>
                    ) : null}
                    {selectedLoraEntry.dataset_file_id &&
                    (selectedLoraEntry.user_id === user?.id || user?.role === "admin") ? (
                      <a
                        className="action-btn ghost"
                        href={fileUrl(selectedLoraEntry.dataset_file_id, token)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download dataset
                      </a>
                    ) : null}
                  </div>
                  <div className="modal-actions lora-actions lora-actions--manage">
                    {user?.role === "admin" ? (
                      <button
                        className="action-btn"
                        disabled={Boolean(selectedLoraEntry.preview_in_flight)}
                        onClick={() => {
                          if (!token) return;
                          setLoraPreviewStatus((prev) => ({
                            ...prev,
                            [selectedLoraEntry.id]: "Queuing previews..."
                          }));
                          fetch(`/api/loras/${selectedLoraEntry.id}/previews`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` }
                          })
                            .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                            .then(({ ok, data }) => {
                              if (!ok) {
                                  setLoraPreviewStatus((prev) => ({
                                    ...prev,
                                    [selectedLoraEntry.id]: humanizeErrorCode(data?.error ?? "Failed to queue previews.")
                                  }));
                                return;
                              }
                              setLoraPreviewStatus((prev) => ({
                                ...prev,
                                [selectedLoraEntry.id]: "Preview jobs queued."
                              }));
                              refreshLoraEntries();
                            })
                            .catch(() => {
                              setLoraPreviewStatus((prev) => ({
                                ...prev,
                                [selectedLoraEntry.id]: "Failed to queue previews."
                              }));
                            });
                        }}
                      >
                        Regen previews
                      </button>
                    ) : selectedLoraEntry.user_id === user?.id &&
                      !(selectedLoraEntry.preview_in_flight ?? 0) &&
                      (selectedLoraEntry.preview_count ?? 0) === 0 ? (
                      <button
                        className="action-btn"
                        onClick={() => {
                          if (!token) return;
                          setLoraPreviewStatus((prev) => ({
                            ...prev,
                            [selectedLoraEntry.id]: "Queuing previews..."
                          }));
                          fetch(`/api/loras/${selectedLoraEntry.id}/previews`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` }
                          })
                            .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                            .then(({ ok, data }) => {
                              if (!ok) {
                                  setLoraPreviewStatus((prev) => ({
                                    ...prev,
                                    [selectedLoraEntry.id]: humanizeErrorCode(data?.error ?? "Failed to queue previews.")
                                  }));
                                return;
                              }
                              setLoraPreviewStatus((prev) => ({
                                ...prev,
                                [selectedLoraEntry.id]: "Preview jobs queued."
                              }));
                              refreshLoraEntries();
                            })
                            .catch(() => {
                              setLoraPreviewStatus((prev) => ({
                                ...prev,
                                [selectedLoraEntry.id]: "Failed to queue previews."
                              }));
                            });
                        }}
                      >
                        Generate previews
                      </button>
                    ) : null}
                  {selectedLoraEntry.user_id === user?.id ? (
                    <button
                      className="action-btn ghost"
                      onClick={() => {
                        if (!token) return;
                        fetch(`/api/loras/${selectedLoraEntry.id}/public`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ is_public: !selectedLoraEntry.is_public })
                          })
                            .then(() => {
                              const nextIsPublic = !selectedLoraEntry.is_public;
                              setSelectedLoraEntry((prev) => (prev ? { ...prev, is_public: nextIsPublic } : prev));
                              refreshLoraEntries();
                              if (loraMode === "private" && nextIsPublic) {
                                setSelectedLoraEntry(null);
                                setSelectedLoraPreview(null);
                              }
                              if (loraMode === "public" && !nextIsPublic) {
                                setSelectedLoraEntry(null);
                                setSelectedLoraPreview(null);
                              }
                            })
                            .catch(() => null);
                        }}
                      >
                        {selectedLoraEntry.is_public ? "Make Private" : "Make Public"}
                      </button>
                    ) : null}
                    {selectedLoraEntry.user_id === user?.id || user?.role === "admin" ? (
                      <button
                        className="action-btn danger"
                        disabled={["queued", "processing"].includes(String(selectedLoraEntry.remove_status ?? ""))}
                        onClick={() => {
                          if (!token) return;
                          if (!confirm(`Delete LoRA \"${selectedLoraEntry.name}\"? This cannot be undone.`)) return;
                          fetch(`/api/loras/${selectedLoraEntry.id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` }
                          })
                            .then(async (res) => {
                              const data = await res.json().catch(() => ({}));
                              if (!res.ok) {
                                setLoraBulkMessage(humanizeErrorCode(String(data?.error ?? "delete_failed")));
                                return;
                              }
                              setLoraBulkMessage("LoRA queued for removal.");
                              setSelectedLoraEntry((prev) =>
                                prev ? { ...prev, remove_status: "queued" } : prev
                              );
                              refreshLoraEntries();
                            })
                            .catch(() => null);
                        }}
                      >
                        {["queued", "processing"].includes(String(selectedLoraEntry.remove_status ?? ""))
                          ? "Removing..."
                          : "Delete LoRA"}
                      </button>
                    ) : null}
                  </div>
                  <div className="modal-comments">
                    <div className="muted small">Comments</div>
                    <div className="comment-list">
                      {selectedLoraComments.map((comment) => (
                        <div key={comment.id} className="comment-row">
                          <span>@{comment.username}</span>
                          <span>{comment.body}</span>
                          {comment.pinned || comment.featured ? (
                            <span className="comment-flags">
                              {comment.pinned ? <span className="comment-flag">Pinned</span> : null}
                              {comment.featured ? <span className="comment-flag">Featured</span> : null}
                            </span>
                          ) : null}
                          {isAdmin || selectedLoraEntry.user_id === user?.id ? (
                            <>
                              <button
                                className="action-btn ghost"
                                onClick={() => {
                                  if (!token) return;
                                  fetch(`/api/loras/${selectedLoraEntry.id}/comments/${comment.id}`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ pinned: !comment.pinned })
                                  })
                                    .then(() =>
                                      fetch(`/api/loras/${selectedLoraEntry.id}/comments`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      })
                                    )
                                    .then((res) => res.json())
                                    .then((data) => setSelectedLoraComments(data.comments ?? []))
                                    .catch(() => null);
                                }}
                              >
                                {comment.pinned ? "Unpin" : "Pin"}
                              </button>
                              <button
                                className="action-btn ghost"
                                onClick={() => {
                                  if (!token) return;
                                  fetch(`/api/loras/${selectedLoraEntry.id}/comments/${comment.id}`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ featured: !comment.featured })
                                  })
                                    .then(() =>
                                      fetch(`/api/loras/${selectedLoraEntry.id}/comments`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      })
                                    )
                                    .then((res) => res.json())
                                    .then((data) => setSelectedLoraComments(data.comments ?? []))
                                    .catch(() => null);
                                }}
                              >
                                {comment.featured ? "Unfeature" : "Feature"}
                              </button>
                            </>
                          ) : null}
                          {comment.user_id === user?.id || selectedLoraEntry.user_id === user?.id || isAdmin ? (
                            <button
                              className="action-btn ghost"
                              onClick={() => {
                                if (!token) return;
                                fetch(`/api/loras/${selectedLoraEntry.id}/comments/${comment.id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` }
                                })
                                  .then(() =>
                                    fetch(`/api/loras/${selectedLoraEntry.id}/comments`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    })
                                  )
                                  .then((res) => res.json())
                                  .then((data) => setSelectedLoraComments(data.comments ?? []))
                                  .catch(() => null);
                              }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      ))}
                      {!selectedLoraComments.length ? <div className="muted small">No comments yet.</div> : null}
                    </div>
                    <div className="comment-input">
                      <input
                        className="input"
                        value={loraCommentDraft}
                        onChange={(e) => setLoraCommentDraft(e.target.value)}
                        placeholder="Add a comment"
                      />
                      <button
                        className="action-btn"
                        onClick={() => {
                          if (!token || !loraCommentDraft.trim()) return;
                          fetch(`/api/loras/${selectedLoraEntry.id}/comments`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ body: loraCommentDraft.trim() })
                          })
                            .then(() => {
                              setLoraCommentDraft("");
                              return fetch(`/api/loras/${selectedLoraEntry.id}/comments`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                            })
                            .then((res) => res.json())
                            .then((data) => setSelectedLoraComments(data.comments ?? []))
                            .catch(() => null);
                        }}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                  {loraPreviewStatus[selectedLoraEntry.id] ? (
                    <div className="muted small">{loraPreviewStatus[selectedLoraEntry.id]}</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {selectedLoraPreview ? (
          <div className="image-modal">
            <div className="image-modal-content lightbox-content">
              <div className="lightbox-toolbar">
                <span className="muted small">
                  {selectedLoraEntry?.name ?? "Preview"}{" "}
                  {selectedLoraPreviewIndex >= 0 ? `${selectedLoraPreviewIndex + 1}/${selectedLoraPreviewIds.length}` : ""}
                </span>
                <button className="modal-close" onClick={() => setSelectedLoraPreview(null)}>
                  Close
                </button>
              </div>
              <div className="modal-body lightbox-body">
                <div className="modal-image lightbox-image-wrap">
                  {selectedLoraPreviewIds.length > 1 ? (
                    <>
                      <button
                        className="lightbox-nav lightbox-nav-left"
                        title="Next (Arrow Left)"
                        onClick={() => {
                          if (selectedLoraPreviewIndex < 0) return;
                          const nextIndex = (selectedLoraPreviewIndex + 1) % selectedLoraPreviewIds.length;
                          setSelectedLoraPreview(selectedLoraPreviewIds[nextIndex]);
                        }}
                      >
                        &#8592;
                      </button>
                      <button
                        className="lightbox-nav lightbox-nav-right"
                        title="Previous (Arrow Right)"
                        onClick={() => {
                          if (selectedLoraPreviewIndex < 0) return;
                          const prevIndex =
                            (selectedLoraPreviewIndex - 1 + selectedLoraPreviewIds.length) % selectedLoraPreviewIds.length;
                          setSelectedLoraPreview(selectedLoraPreviewIds[prevIndex]);
                        }}
                      >
                        &#8594;
                      </button>
                    </>
                  ) : null}
                  <img
                    className={`lightbox-image lightbox-image-thumb ${selectedLoraPreviewOriginalReady ? "is-faded" : ""}`}
                    src={fileUrl(selectedLoraPreview, token, { thumb: true, size: 1280 })}
                    alt="LoRA preview thumb"
                  />
                  <img
                    className={`lightbox-image lightbox-image-original ${selectedLoraPreviewOriginalReady ? "is-ready" : ""}`}
                    src={fileUrl(selectedLoraPreview, token)}
                    alt="LoRA preview"
                    onLoad={() => setSelectedLoraPreviewOriginalReady(true)}
                    onError={() => setSelectedLoraPreviewOriginalReady(false)}
                  />
                </div>
                <div className="lightbox-help muted small">
                  Keys: Left = next, Right = previous, Up = close
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {passwordOpen ? (
          <div className="modal-overlay">
            <div className="password-modal">
              <div className="manual-header">
                <div>
                  <div className="title">Change password</div>
                  {user?.must_change_password ? (
                    <div className="muted small">Temporary credentials detected. Please set a new password.</div>
                  ) : null}
                </div>
                {!user?.must_change_password ? (
                  <button className="action-btn ghost" onClick={() => setPasswordOpen(false)}>
                    Close
                  </button>
                ) : null}
              </div>
              <div className="manual-body">
                <div className="form-grid">
                  {!user?.must_change_password ? (
                    <label className="form-row">
                      Current password
                      <input
                        className="input"
                        type="password"
                        value={passwordCurrent}
                        onChange={(e) => setPasswordCurrent(e.target.value)}
                      />
                    </label>
                  ) : null}
                  <label className="form-row">
                    New password
                    <input
                      className="input"
                      type="password"
                      value={passwordNext}
                      onChange={(e) => setPasswordNext(e.target.value)}
                    />
                  </label>
                  <label className="form-row">
                    Confirm password
                    <input
                      className="input"
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                  </label>
                  <div className="login-actions">
                    <button className="action-btn" disabled={passwordBusy} onClick={submitPasswordChange}>
                      {passwordBusy ? "Updating..." : "Update password"}
                    </button>
                    {passwordMsg ? <div className="muted small">{passwordMsg}</div> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LoginForm({
  onLogin,
  labels
}: {
  onLogin: (token: string) => void;
  labels: { email: string; password: string; login: string };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [emergencySequence, setEmergencySequence] = useState("");
  const [challengeLocked, setChallengeLocked] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (challengeId) {
          fetch("/api/auth/login/2fa/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              challenge_id: challengeId,
              code: totpCode,
              emergency_sequence: emergencySequence
            })
          })
            .then((res) => res.json())
            .then((data) => {
              if (data?.token) {
                onLogin(data.token);
                setError(null);
                setChallengeId(null);
                setTotpCode("");
                setEmergencySequence("");
                setChallengeLocked(false);
                return;
              }
              if (data?.error === "totp_locked") {
                setChallengeLocked(true);
                setError("totp_locked_use_emergency_or_admin");
                return;
              }
              setError(String(data?.error ?? "totp_verify_failed"));
            })
            .catch(() => setError("totp_verify_failed"));
          return;
        }
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.token) {
              onLogin(data.token);
              setError(null);
            } else if (data?.status === "totp_required" && data?.challenge_id) {
              setChallengeId(String(data.challenge_id));
              setError("totp_required_for_new_ip");
            } else if (data?.error === "totp_locked") {
              if (data?.challenge_id) {
                setChallengeId(String(data.challenge_id));
              }
              setChallengeLocked(true);
              setError("totp_locked_use_emergency_or_admin");
            } else {
              setError("login_failed");
            }
          })
          .catch(() => setError("login_failed"));
      }}
    >
      <div className="form-grid">
        <label className="form-row">
          {labels.email}
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} disabled={Boolean(challengeId)} />
        </label>
        <label className="form-row">
          {labels.password}
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={Boolean(challengeId)}
          />
        </label>
        {challengeId ? (
          <>
            <label className="form-row">
              TOTP Code
              <input
                className="input"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                disabled={challengeLocked}
              />
            </label>
            <label className="form-row">
              Emergency Code (if locked)
              <input
                className="input"
                value={emergencySequence}
                onChange={(e) => setEmergencySequence(e.target.value)}
                placeholder="XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX"
              />
            </label>
          </>
        ) : null}
        {error ? <div className="form-row">{humanizeErrorCode(error)}</div> : null}
        <button className="action-btn" type="submit">
          {challengeId ? "Verify 2FA" : labels.login}
        </button>
        {challengeId ? (
          <button
            className="action-btn ghost"
            type="button"
            onClick={() => {
              setChallengeId(null);
              setTotpCode("");
              setEmergencySequence("");
              setChallengeLocked(false);
              setError(null);
            }}
          >
            Cancel 2FA
          </button>
        ) : null}
      </div>
    </form>
  );
}

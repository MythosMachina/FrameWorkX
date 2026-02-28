import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
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
        publicWelcomeLead: "FrameWorkX combines dataset-to-model training with image generation and gallery publishing for public model and image workflows.",
        publicWelcomeBody: "Browse public models and public images, compare styles, and review outputs before you sign in. The public view is designed for discovery, quality checks, and sharing.",
        publicFeatureOne: "Train LoRA models with transparent pipeline phases and live progress.",
        publicFeatureTwo: "Generate images with controllable settings and reusable prompt logic.",
        publicFeatureThree: "Publish public models and public images with shareable links.",
        publicWhatIsTitle: "What is FrameWorkX?",
        publicWhatIsBody: "FrameWorkX is an all-in-one platform for LoRA workflows: train, generate, organize, and publish in one continuous system.",
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
        publicWelcomeLead: "FrameWorkX verbindet den gesamten Ablauf von Datensatz zu Modelltraining mit Bildgenerierung und Galerie-Publishing fuer oeffentliche Modelle und Bilder.",
        publicWelcomeBody: "Durchsuche oeffentliche Modelle und oeffentliche Bilder, vergleiche Stile und pruefe Outputs vor dem Login. Die Public-Ansicht ist fuer Discovery, Qualitaetscheck und Sharing gebaut.",
        publicFeatureOne: "LoRA-Modelle mit transparenten Pipeline-Phasen und Live-Fortschritt trainieren.",
        publicFeatureTwo: "Bilder mit kontrollierbaren Einstellungen und wiederverwendbarer Prompt-Logik generieren.",
        publicFeatureThree: "Oeffentliche Modelle und oeffentliche Bilder mit teilbaren Links veroeffentlichen.",
        publicWhatIsTitle: "Was ist FrameWorkX?",
        publicWhatIsBody: "FrameWorkX ist eine All-in-One Plattform fuer LoRA-Workflows: trainieren, generieren, organisieren und veroeffentlichen in einem durchgaengigen System.",
        publicExploreImages: "Oeffentliche Bilder",
        publicExploreModels: "Oeffentliche Modelle",
        publicNoImages: "Noch keine oeffentlichen Bilder vorhanden.",
        publicNoModels: "Noch keine oeffentlichen Modelle vorhanden.",
        publicAssetStats: "Live Public Uebersicht",
        publicOverviewShow: "Uebersicht anzeigen",
        publicOverviewHide: "Uebersicht ausblenden"
    }
};
const nav = ["dashboard", "pipeline", "generator", "gallery", "lora", "messages", "settings"];
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
];
function humanizeErrorCode(input) {
    const code = String(input ?? "").trim();
    if (!code)
        return "Unknown error.";
    const map = {
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
        pipeline_still_active_delete_pipeline_first: "This training run is still attached to an active pipeline. Delete/stop the pipeline run first.",
        thread_not_found: "Conversation not found.",
        dm_blocked: "Messaging is blocked for this user/thread.",
        message_required: "Message text is required.",
        message_too_long: "Message is too long.",
        not_found: "Item not found.",
        forbidden: "You are not allowed to do this.",
        unauthorized: "Please sign in again.",
        insufficient_credits: "Not enough credits for this action."
    };
    if (map[code])
        return map[code];
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
const DEFAULT_NOTIFICATION_PREFS = {
    "notify.like.email": true,
    "notify.comment.email": true,
    "notify.training_done.email": true,
    "notify.training_failed.email": true,
    "notify.new_follower.email": true,
    "notify.dm.email": true
};
const DEFAULT_2FA_STATUS = {
    enabled: false,
    locked: false,
    failed_attempts: 0,
    onboarding_pending: false,
    trusted_ip_count: 0,
    recovery_remaining: 0
};
const NOTIFICATION_LABELS = [
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
        }
        catch {
            // ignore URL/session storage errors
        }
    }
    try {
        return localStorage.getItem("fx_token") ?? "";
    }
    catch {
        return "";
    }
}
function setToken(token) {
    if (typeof window !== "undefined") {
        try {
            const impActive = sessionStorage.getItem("fx_imp_active") === "1";
            if (impActive) {
                if (token) {
                    sessionStorage.setItem("fx_imp_token", token);
                }
                else {
                    sessionStorage.removeItem("fx_imp_token");
                    sessionStorage.removeItem("fx_imp_active");
                }
                return;
            }
        }
        catch {
            // ignore session storage errors
        }
    }
    try {
        localStorage.setItem("fx_token", token);
    }
    catch {
        // ignore storage errors (Safari private mode / locked storage)
    }
}
function getLastModelId() {
    try {
        return localStorage.getItem("fx_last_model_id") ?? "";
    }
    catch {
        return "";
    }
}
function setLastModelId(modelId) {
    try {
        localStorage.setItem("fx_last_model_id", modelId);
    }
    catch {
        // ignore storage errors (Safari private mode / locked storage)
    }
}
function getGeneratorSettings() {
    try {
        const raw = localStorage.getItem("fx_generator_settings");
        if (!raw)
            return {};
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.seed === 0 || parsed.seed === "0")) {
            parsed.seed = "-0";
        }
        return parsed;
    }
    catch {
        return {};
    }
}
function setGeneratorSettings(settings) {
    try {
        localStorage.setItem("fx_generator_settings", JSON.stringify(settings));
    }
    catch {
        // ignore storage errors (Safari private mode / locked storage)
    }
}
function publicImageHref(imageId, lang) {
    const params = new URLSearchParams();
    params.set("image", imageId);
    params.set("lang", lang);
    return `/?${params.toString()}`;
}
function publicLoraHref(loraId, lang) {
    const params = new URLSearchParams();
    params.set("lora", loraId);
    params.set("lang", lang);
    return `/?${params.toString()}`;
}
function fileUrl(fileId, token, options) {
    const params = new URLSearchParams();
    if (token)
        params.set("token", token);
    if (options?.thumb) {
        params.set("variant", "thumb");
        params.set("size", String(options.size ?? 384));
    }
    const query = params.toString();
    return `/api/files/${fileId}${query ? `?${query}` : ""}`;
}
function renderAvatar(fileId, authToken, altLabel) {
    if (!fileId) {
        return _jsx("span", { className: "tile-avatar-wrap placeholder" });
    }
    return (_jsx("span", { className: "tile-avatar-wrap", children: _jsx("img", { className: "tile-avatar-img", src: fileUrl(fileId, authToken ?? "", { thumb: true, size: 96 }), alt: altLabel ?? "User avatar", title: altLabel ?? "User avatar", loading: "lazy", decoding: "async" }) }));
}
function withToken(url, token) {
    if (!url || !token)
        return url;
    if (url.includes("token=") || url.includes("access_token="))
        return url;
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}token=${encodeURIComponent(token)}`;
}
function parseRatio(ratio) {
    const match = ratio.match(/(\\d+)x(\\d+)/);
    if (!match)
        return { width: 1024, height: 1024 };
    return { width: Number(match[1]), height: Number(match[2]) };
}
function formatBytes(size) {
    if (!Number.isFinite(size))
        return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = size;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
        value /= 1024;
        idx += 1;
    }
    return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}
function parseTagList(text) {
    return String(text || "")
        .toLowerCase()
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.replace(/\s+/g, "_"));
}
function normalizeWildcardName(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
}
function parseWildcardSetting(raw) {
    const source = raw?.lists ?? raw;
    if (!source || typeof source !== "object")
        return [];
    const out = [];
    if (Array.isArray(source)) {
        for (const row of source) {
            const name = normalizeWildcardName(row?.name ?? "");
            const entries = Array.isArray(row?.entries) ? row.entries.map((v) => String(v).trim()).filter(Boolean) : [];
            if (!name || !entries.length)
                continue;
            out.push({ name, entries });
        }
        return out;
    }
    for (const [key, value] of Object.entries(source)) {
        const name = normalizeWildcardName(key);
        const entries = Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
        if (!name || !entries.length)
            continue;
        out.push({ name, entries });
    }
    return out;
}
function wildcardListsToMap(lists) {
    const out = {};
    for (const row of lists) {
        const name = normalizeWildcardName(row.name);
        const entries = Array.isArray(row.entries) ? row.entries.map((value) => String(value).trim()).filter(Boolean) : [];
        if (!name || !entries.length)
            continue;
        out[name] = entries;
    }
    return out;
}
function parseWildcardEntries(text) {
    const seen = new Set();
    const out = [];
    for (const line of String(text ?? "").split(/\r?\n/)) {
        const cleaned = line.trim();
        if (!cleaned || seen.has(cleaned))
            continue;
        seen.add(cleaned);
        out.push(cleaned);
    }
    return out;
}
function expandWildcardPromptPreview(prompt, lists, mode) {
    const tokenRegex = /__([a-z0-9_-]+)__/gi;
    const tokenNames = new Set();
    const source = String(prompt ?? "");
    let match;
    while ((match = tokenRegex.exec(source)) !== null) {
        tokenNames.add(normalizeWildcardName(match[1]));
    }
    const tokens = Array.from(tokenNames);
    if (!tokens.length)
        return { tokens, missing: [], variants: [] };
    const mapped = wildcardListsToMap(lists);
    const missing = tokens.filter((token) => !Array.isArray(mapped[token]) || mapped[token].length === 0);
    if (missing.length)
        return { tokens, missing, variants: [] };
    const variantCount = Math.max(...tokens.map((token) => mapped[token].length), 1);
    const variants = [];
    for (let i = 0; i < variantCount; i += 1) {
        let next = prompt;
        for (const token of tokens) {
            const values = mapped[token];
            const selected = mode === "random" ? values[Math.floor(Math.random() * values.length)] : values[i % values.length];
            next = next.replace(new RegExp(`__${token}__`, "gi"), selected);
        }
        variants.push(next);
    }
    return { tokens, missing: [], variants };
}
const MOBILE_ROUTE_PATH = "/m";
function isMobileRoute(pathname) {
    return pathname === MOBILE_ROUTE_PATH || pathname.startsWith(`${MOBILE_ROUTE_PATH}/`);
}
function detectMobileClient() {
    if (typeof window === "undefined")
        return false;
    const ua = String(window.navigator.userAgent ?? "");
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua) || coarse;
}
function getInitialLang() {
    if (typeof window === "undefined")
        return "en";
    try {
        const url = new URL(window.location.href);
        const queryLang = url.searchParams.get("lang");
        if (queryLang === "de" || queryLang === "en") {
            localStorage.setItem("fx_lang", queryLang);
            return queryLang;
        }
    }
    catch {
        // ignore URL parsing issues
    }
    try {
        const stored = localStorage.getItem("fx_lang");
        if (stored === "de" || stored === "en")
            return stored;
    }
    catch {
        // ignore storage errors
    }
    if (typeof navigator !== "undefined" && String(navigator.language ?? "").toLowerCase().startsWith("de")) {
        return "de";
    }
    return "en";
}
export default function App() {
    const [isMobileRouteActive, setIsMobileRouteActive] = useState(typeof window !== "undefined" ? isMobileRoute(window.location.pathname) : false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileShowCompletedJobs, setMobileShowCompletedJobs] = useState(false);
    const [view, setView] = useState("dashboard");
    const [settingsTab, setSettingsTab] = useState("profile");
    const [lang, setLang] = useState(() => getInitialLang());
    const [token, setAuthToken] = useState(getToken());
    const [queue, setQueue] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [trainingRuns, setTrainingRuns] = useState([]);
    const [pipelineRuns, setPipelineRuns] = useState([]);
    const [selectedRunId, setSelectedRunId] = useState("");
    const [selectedRun, setSelectedRun] = useState(null);
    const [selectedRunSteps, setSelectedRunSteps] = useState([]);
    const [selectedRunEvents, setSelectedRunEvents] = useState([]);
    const [selectedRunPreviews, setSelectedRunPreviews] = useState([]);
    const [selectedTrainingPreviews, setSelectedTrainingPreviews] = useState([]);
    const [dashboardPipeline, setDashboardPipeline] = useState([]);
    const [dashboardTraining, setDashboardTraining] = useState([]);
    const [dashboardQueue, setDashboardQueue] = useState([]);
    const [dashboardQueueMsg, setDashboardQueueMsg] = useState("");
    const [dashboardQueueMovePending, setDashboardQueueMovePending] = useState(null);
    const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
    const [dashboardModalKind, setDashboardModalKind] = useState("pipeline");
    const [dashboardModalPhase, setDashboardModalPhase] = useState("prep");
    const [dashboardModalId, setDashboardModalId] = useState(null);
    const [dashboardModalData, setDashboardModalData] = useState(null);
    const [dashboardModalSteps, setDashboardModalSteps] = useState([]);
    const [dashboardModalImageCount, setDashboardModalImageCount] = useState(null);
    const [dashboardModalEvents, setDashboardModalEvents] = useState([]);
    const [dashboardModalPreviews, setDashboardModalPreviews] = useState([]);
    const [dashboardModalTrainingPreviews, setDashboardModalTrainingPreviews] = useState([]);
    const [dashboardDatasetCoverUrl, setDashboardDatasetCoverUrl] = useState(null);
    const [dashboardDatasetCoverFileId, setDashboardDatasetCoverFileId] = useState(null);
    const [dashboardModalLastUpdated, setDashboardModalLastUpdated] = useState(null);
    const [dashboardPreviewLightbox, setDashboardPreviewLightbox] = useState(null);
    const [dashboardErrorOpen, setDashboardErrorOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    const [manualRunId, setManualRunId] = useState("");
    const [manualRunName, setManualRunName] = useState("");
    const [manualImages, setManualImages] = useState([]);
    const [manualFiltered, setManualFiltered] = useState([]);
    const [manualSelected, setManualSelected] = useState([]);
    const [manualDirty, setManualDirty] = useState({});
    const [manualTags, setManualTags] = useState([]);
    const [manualFilterTags, setManualFilterTags] = useState([]);
    const [manualTagMatch, setManualTagMatch] = useState("any");
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
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({ display_name: "", bio: "", avatar_file_id: null });
    const [avatarStatus, setAvatarStatus] = useState("");
    const [newToken, setNewToken] = useState(null);
    const [twoFaStatus, setTwoFaStatus] = useState(DEFAULT_2FA_STATUS);
    const [securityWizardOpen, setSecurityWizardOpen] = useState(false);
    const [securityWizardStep, setSecurityWizardStep] = useState(1);
    const [securityWizardSecret, setSecurityWizardSecret] = useState("");
    const [securityWizardUri, setSecurityWizardUri] = useState("");
    const [securityWizardCode, setSecurityWizardCode] = useState("");
    const [securityRecoveryCodes, setSecurityRecoveryCodes] = useState([]);
    const [securityStatusMsg, setSecurityStatusMsg] = useState("");
    const [securityBusy, setSecurityBusy] = useState(false);
    const [securityDisablePassword, setSecurityDisablePassword] = useState("");
    const [securityDisableCode, setSecurityDisableCode] = useState("");
    const [securityDisableEmergency, setSecurityDisableEmergency] = useState("");
    const [settingsMap, setSettingsMap] = useState({});
    const [samplerOptions, setSamplerOptions] = useState(DEFAULT_SAMPLERS);
    const [schedulerOptions, setSchedulerOptions] = useState(DEFAULT_SCHEDULERS);
    const [adminSamplerSelection, setAdminSamplerSelection] = useState(DEFAULT_SAMPLERS);
    const [adminSchedulerSelection, setAdminSchedulerSelection] = useState(DEFAULT_SCHEDULERS);
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
    const [taggerModels, setTaggerModels] = useState([]);
    const [taggerStatus, setTaggerStatus] = useState("");
    const [adminCreditCostGenerate, setAdminCreditCostGenerate] = useState("1");
    const [adminCreditCostTrain, setAdminCreditCostTrain] = useState("5");
    const [adminTab, setAdminTab] = useState("queue");
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
    const [adminLedgerEntries, setAdminLedgerEntries] = useState([]);
    const [adminLedgerLoading, setAdminLedgerLoading] = useState(false);
    const [adminLedgerStatus, setAdminLedgerStatus] = useState("");
    const [adminLedgerUserFilter, setAdminLedgerUserFilter] = useState("");
    const [adminLedgerReasonFilter, setAdminLedgerReasonFilter] = useState("");
    const [adminLedgerRefTypeFilter, setAdminLedgerRefTypeFilter] = useState("");
    const [adminLedgerDeltaSign, setAdminLedgerDeltaSign] = useState("all");
    const [adminLedgerFrom, setAdminLedgerFrom] = useState("");
    const [adminLedgerTo, setAdminLedgerTo] = useState("");
    const [adminLedgerPage, setAdminLedgerPage] = useState(1);
    const [adminLedgerPageSize, setAdminLedgerPageSize] = useState(25);
    const [adminLedgerTotal, setAdminLedgerTotal] = useState(0);
    const [adminLedgerDetailOpen, setAdminLedgerDetailOpen] = useState(false);
    const [adminLedgerDetail, setAdminLedgerDetail] = useState(null);
    const [adminLedgerCopyStatus, setAdminLedgerCopyStatus] = useState("");
    const [loginGallery, setLoginGallery] = useState([]);
    const [loginModels, setLoginModels] = useState([]);
    const [loginLoras, setLoginLoras] = useState([]);
    const [loginSelectedImage, setLoginSelectedImage] = useState(null);
    const [loginSelectedModelLabel, setLoginSelectedModelLabel] = useState("");
    const [loginSelectedLora, setLoginSelectedLora] = useState(null);
    const [loginSelectedLoraPreview, setLoginSelectedLoraPreview] = useState(null);
    const [loginSelectedLoraPreviewOriginalReady, setLoginSelectedLoraPreviewOriginalReady] = useState(false);
    const [galleryModels, setGalleryModels] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [galleryBulkMode, setGalleryBulkMode] = useState(false);
    const [galleryBulkSelection, setGalleryBulkSelection] = useState([]);
    const [galleryBulkBusy, setGalleryBulkBusy] = useState(false);
    const [galleryBulkMessage, setGalleryBulkMessage] = useState("");
    const [loraEntries, setLoraEntries] = useState([]);
    const [loraMode, setLoraMode] = useState("public");
    const [loraName, setLoraName] = useState("");
    const [loraFileId, setLoraFileId] = useState("");
    const [loraIsPublic, setLoraIsPublic] = useState(false);
    const [loraUploadOpen, setLoraUploadOpen] = useState(false);
    const [loraUploadFile, setLoraUploadFile] = useState(null);
    const [loraUploadName, setLoraUploadName] = useState("");
    const [loraUploadPublic, setLoraUploadPublic] = useState(false);
    const [loraUploadStatus, setLoraUploadStatus] = useState("");
    const [loraUploadProgress, setLoraUploadProgress] = useState(0);
    const [loraBulkMode, setLoraBulkMode] = useState(false);
    const [loraBulkSelection, setLoraBulkSelection] = useState([]);
    const [loraBulkBusy, setLoraBulkBusy] = useState(false);
    const [loraBulkMessage, setLoraBulkMessage] = useState("");
    const [styleOptions, setStyleOptions] = useState([]);
    const [selectedStyles, setSelectedStyles] = useState([]);
    const [loraPreviewStatus, setLoraPreviewStatus] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedMeta, setSelectedMeta] = useState(null);
    const [selectedModelLabel, setSelectedModelLabel] = useState("");
    const [selectedLoraLabels, setSelectedLoraLabels] = useState([]);
    const [selectedComments, setSelectedComments] = useState([]);
    const [commentDraft, setCommentDraft] = useState("");
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedModelImages, setSelectedModelImages] = useState([]);
    const [selectedModelMeta, setSelectedModelMeta] = useState(null);
    const [selectedModelComments, setSelectedModelComments] = useState([]);
    const [modelCommentDraft, setModelCommentDraft] = useState("");
    const [selectedLoraEntry, setSelectedLoraEntry] = useState(null);
    const [selectedLoraPreview, setSelectedLoraPreview] = useState(null);
    const [selectedLoraPreviewOriginalReady, setSelectedLoraPreviewOriginalReady] = useState(false);
    const [selectedLoraMeta, setSelectedLoraMeta] = useState(null);
    const [selectedLoraComments, setSelectedLoraComments] = useState([]);
    const [loraCommentDraft, setLoraCommentDraft] = useState("");
    const [loraDescriptionDraft, setLoraDescriptionDraft] = useState("");
    const [loraDescriptionEditing, setLoraDescriptionEditing] = useState(false);
    const [loraDescriptionStatus, setLoraDescriptionStatus] = useState("");
    const [profileView, setProfileView] = useState(null);
    const [profileStats, setProfileStats] = useState(null);
    const [profileRelationship, setProfileRelationship] = useState(null);
    const [profileFollowBusy, setProfileFollowBusy] = useState(false);
    const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
    const [notificationSaving, setNotificationSaving] = useState({});
    const [notificationList, setNotificationList] = useState([]);
    const [notificationUnread, setNotificationUnread] = useState(0);
    const [notificationWidgetOpen, setNotificationWidgetOpen] = useState(false);
    const [notificationPulse, setNotificationPulse] = useState(false);
    const [publicOverviewExpanded, setPublicOverviewExpanded] = useState(true);
    const [dmThreads, setDmThreads] = useState([]);
    const [dmActiveThreadId, setDmActiveThreadId] = useState("");
    const [dmMessages, setDmMessages] = useState([]);
    const dmMessagesRef = useRef([]);
    const publicDeepLinkHandledRef = useRef(false);
    const [dmDraft, setDmDraft] = useState("");
    const [dmStatus, setDmStatus] = useState("");
    const [dmLoading, setDmLoading] = useState(false);
    const [dmUnreadCount, setDmUnreadCount] = useState(0);
    const [dmBlocks, setDmBlocks] = useState([]);
    const [dmThreadQuery, setDmThreadQuery] = useState("");
    const [dmEmojiOpen, setDmEmojiOpen] = useState(false);
    const [miniDmOpen, setMiniDmOpen] = useState(false);
    const [miniDmMode, setMiniDmMode] = useState("threads");
    const [miniDmThreadId, setMiniDmThreadId] = useState("");
    const [miniDmQuery, setMiniDmQuery] = useState("");
    const [miniDmEmojiOpen, setMiniDmEmojiOpen] = useState(false);
    const [profileModels, setProfileModels] = useState([]);
    const [profileLoras, setProfileLoras] = useState([]);
    const [profileImages, setProfileImages] = useState([]);
    const [profileReturnView, setProfileReturnView] = useState("gallery");
    const [galleryMode, setGalleryMode] = useState("public");
    const [modelRegistry, setModelRegistry] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [adminUserSearchField, setAdminUserSearchField] = useState("email");
    const [adminUserSearchValue, setAdminUserSearchValue] = useState("");
    const [adminUserSearchBusy, setAdminUserSearchBusy] = useState(false);
    const [adminUserSearchStatus, setAdminUserSearchStatus] = useState("");
    const [adminUserSelectedId, setAdminUserSelectedId] = useState("");
    const [adminUserPermBusy, setAdminUserPermBusy] = useState({});
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
    const [adminApplications, setAdminApplications] = useState([]);
    const [adminArchives, setAdminArchives] = useState([]);
    const [adminArchiveQuery, setAdminArchiveQuery] = useState("");
    const [adminArchiveUser, setAdminArchiveUser] = useState("");
    const [adminArchiveLoading, setAdminArchiveLoading] = useState(false);
    const [adminArchiveMessage, setAdminArchiveMessage] = useState("");
    const [adminArchiveOverwrite, setAdminArchiveOverwrite] = useState(false);
    const [adminArchiveTypeFilter, setAdminArchiveTypeFilter] = useState("all");
    const [adminArchiveReasonFilter, setAdminArchiveReasonFilter] = useState("all");
    const [adminArchiveOriginFilter, setAdminArchiveOriginFilter] = useState("all");
    const [adminArchiveRetentionDays, setAdminArchiveRetentionDays] = useState("30");
    const [adminArchiveDetail, setAdminArchiveDetail] = useState(null);
    const [adminArchiveDetailOpen, setAdminArchiveDetailOpen] = useState(false);
    const [adminArchiveEntryFilter, setAdminArchiveEntryFilter] = useState("");
    const [stagedUploads, setStagedUploads] = useState([]);
    const [uploadMessage, setUploadMessage] = useState("");
    const [autocharPresets, setAutocharPresets] = useState([]);
    const [autocharName, setAutocharName] = useState("");
    const [autocharDescription, setAutocharDescription] = useState("");
    const [autocharPatterns, setAutocharPatterns] = useState("");
    const [autocharStatus, setAutocharStatus] = useState("");
    const [autocharEditingId, setAutocharEditingId] = useState(null);
    const [trainProfiles, setTrainProfiles] = useState([]);
    const [selectedPresets, setSelectedPresets] = useState([]);
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
    const [trainerWizardMode, setTrainerWizardMode] = useState(null);
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
    const [modelId, setModelId] = useState(getLastModelId());
    const generatorSettings = getGeneratorSettings();
    const [sampler, setSampler] = useState(String(generatorSettings.sampler ?? "Euler"));
    const [scheduler, setScheduler] = useState(String(generatorSettings.scheduler ?? "Karras"));
    const [ratio, setRatio] = useState(String(generatorSettings.ratio ?? RATIO_OPTIONS[0]));
    const [steps, setSteps] = useState(String(generatorSettings.steps ?? "30"));
    const [cfgScale, setCfgScale] = useState(String(generatorSettings.cfgScale ?? "7.5"));
    const [batchCount, setBatchCount] = useState(String(generatorSettings.batchCount ?? "1"));
    const [seed, setSeed] = useState(String(generatorSettings.seed ?? "-0"));
    const [wildcardMode, setWildcardMode] = useState("sequential");
    const [wildcardLists, setWildcardLists] = useState([]);
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
    const [activeGenerationId, setActiveGenerationId] = useState(null);
    const [activeGenerationProgress, setActiveGenerationProgress] = useState(null);
    const [activeGenerationEta, setActiveGenerationEta] = useState(null);
    const [generatedOutputs, setGeneratedOutputs] = useState([]);
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
    const activeQueueItems = useMemo(() => queue.filter((item) => {
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
    }), [queue]);
    const activeJobs = useMemo(() => jobs.filter((job) => ["queued", "running", "rendering"].includes(String(job.status ?? ""))), [jobs]);
    const activePipelineRuns = useMemo(() => pipelineRuns.filter((run) => ["queued", "queued_initiated", "running", "manual_tagging", "ready_to_train"].includes(String(run.status ?? ""))), [pipelineRuns]);
    const activeTrainingRuns = useMemo(() => trainingRuns.filter((run) => ["queued", "running"].includes(String(run.status ?? ""))), [trainingRuns]);
    const selectedAdminUser = useMemo(() => adminUsers.find((row) => row.id === adminUserSelectedId) ?? null, [adminUsers, adminUserSelectedId]);
    useEffect(() => {
        if (!selectedAdminUser)
            return;
        setAdminUserCreditsDelta("");
        setAdminUserCreditsAllowance(String(selectedAdminUser.credits_daily_allowance ?? ""));
        setAdminUserCreditsStatus("");
        setAdminUserPasswordResult("");
        setAdminUserImpersonateStatus("");
    }, [selectedAdminUser?.id]);
    const wildcardPreview = useMemo(() => expandWildcardPromptPreview(prompt, wildcardLists, wildcardMode), [prompt, wildcardLists, wildcardMode]);
    const visibleGeneratedOutputs = useMemo(() => (generatorShowAllOutputs ? generatedOutputs : generatedOutputs.slice(0, 8)), [generatedOutputs, generatorShowAllOutputs]);
    const dmActiveThread = useMemo(() => dmThreads.find((thread) => thread.id === dmActiveThreadId) ?? null, [dmThreads, dmActiveThreadId]);
    const dmFilteredThreads = useMemo(() => {
        const query = dmThreadQuery.trim().toLowerCase();
        if (!query)
            return dmThreads;
        return dmThreads.filter((thread) => {
            const username = String(thread.peer_username ?? "").toLowerCase();
            const displayName = String(thread.peer_display_name ?? "").toLowerCase();
            const preview = String(thread.last_message_body ?? "").toLowerCase();
            return username.includes(query) || displayName.includes(query) || preview.includes(query);
        });
    }, [dmThreads, dmThreadQuery]);
    const miniDmActiveThread = useMemo(() => dmThreads.find((thread) => thread.id === miniDmThreadId) ?? null, [dmThreads, miniDmThreadId]);
    const miniDmFilteredThreads = useMemo(() => {
        const query = miniDmQuery.trim().toLowerCase();
        if (!query)
            return dmThreads;
        return dmThreads.filter((thread) => {
            const username = String(thread.peer_username ?? "").toLowerCase();
            const displayName = String(thread.peer_display_name ?? "").toLowerCase();
            const preview = String(thread.last_message_body ?? "").toLowerCase();
            return username.includes(query) || displayName.includes(query) || preview.includes(query);
        });
    }, [dmThreads, miniDmQuery]);
    const selectedLoraPreviewIds = useMemo(() => (Array.isArray(selectedLoraEntry?.preview_file_ids) ? selectedLoraEntry?.preview_file_ids : []), [selectedLoraEntry?.preview_file_ids]);
    const selectedLoraPreviewIndex = useMemo(() => {
        if (!selectedLoraPreview)
            return -1;
        return selectedLoraPreviewIds.indexOf(selectedLoraPreview);
    }, [selectedLoraPreviewIds, selectedLoraPreview]);
    const loginSelectedLoraPreviewIds = useMemo(() => (Array.isArray(loginSelectedLora?.preview_file_ids) ? loginSelectedLora?.preview_file_ids : []), [loginSelectedLora?.preview_file_ids]);
    const loginSelectedLoraPreviewIndex = useMemo(() => {
        if (!loginSelectedLoraPreview)
            return -1;
        return loginSelectedLoraPreviewIds.indexOf(loginSelectedLoraPreview);
    }, [loginSelectedLoraPreviewIds, loginSelectedLoraPreview]);
    const reorderableDashboardQueueIds = useMemo(() => {
        return new Set(dashboardQueue
            .filter((item) => item.item_type === "pipeline" && item.status === "queued")
            .map((item) => item.id));
    }, [dashboardQueue]);
    const loginGallerySafe = useMemo(() => (Array.isArray(loginGallery) ? loginGallery : []).filter((row) => row && typeof row.id === "string" && typeof row.file_id === "string"), [loginGallery]);
    const loginModelsSafe = useMemo(() => (Array.isArray(loginModels) ? loginModels : []).filter((row) => row && typeof row.id === "string" && typeof row.name === "string"), [loginModels]);
    const loginLorasSafe = useMemo(() => (Array.isArray(loginLoras) ? loginLoras : []).filter((row) => row && typeof row.id === "string" && typeof row.name === "string"), [loginLoras]);
    const dashboardTrainingPreviewGroups = useMemo(() => {
        const map = new Map();
        for (const row of dashboardModalTrainingPreviews) {
            const fileId = String(row?.file_id ?? "").trim();
            if (!fileId)
                continue;
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
        if (typeof window === "undefined")
            return;
        const syncRoute = () => {
            setIsMobileRouteActive(isMobileRoute(window.location.pathname));
        };
        const mobileClient = detectMobileClient();
        if (mobileClient && window.location.pathname === "/") {
            window.history.replaceState({}, "", MOBILE_ROUTE_PATH);
            setIsMobileRouteActive(true);
        }
        else {
            syncRoute();
        }
        window.addEventListener("popstate", syncRoute);
        return () => window.removeEventListener("popstate", syncRoute);
    }, []);
    useEffect(() => {
        if (typeof document === "undefined")
            return;
        document.body.classList.toggle("mobile-route", isMobileRouteActive);
        return () => document.body.classList.remove("mobile-route");
    }, [isMobileRouteActive]);
    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined")
            return;
        const isPublicLanding = !token;
        const origin = window.location.origin || "https://frameworkx.lenz-service.de";
        const publicUrl = `${origin}/`;
        const publicQuery = new URLSearchParams();
        publicQuery.set("lang", lang);
        if (isPublicLanding && loginSelectedLora?.id) {
            publicQuery.set("lora", loginSelectedLora.id);
        }
        else if (isPublicLanding && loginSelectedImage?.id) {
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
        const upsertMeta = (selector, attr, key, content) => {
            let node = document.head.querySelector(selector);
            if (!node) {
                node = document.createElement("meta");
                node.setAttribute(attr, key);
                node.setAttribute("data-seo-managed", "1");
                document.head.appendChild(node);
            }
            node.setAttribute("content", content);
        };
        const upsertLink = (selector, rel, href, hreflang) => {
            let node = document.head.querySelector(selector);
            if (!node) {
                node = document.createElement("link");
                node.setAttribute("rel", rel);
                node.setAttribute("data-seo-managed", "1");
                document.head.appendChild(node);
            }
            node.setAttribute("href", href);
            if (hreflang)
                node.setAttribute("hreflang", hreflang);
            if (!hreflang)
                node.removeAttribute("hreflang");
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
        let script = document.getElementById(jsonLdId);
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
        if (typeof window === "undefined")
            return;
        try {
            localStorage.setItem("fx_lang", lang);
        }
        catch {
            // ignore storage errors
        }
    }, [lang]);
    useEffect(() => {
        if (token)
            return;
        setPublicOverviewExpanded(true);
        const timer = window.setTimeout(() => setPublicOverviewExpanded(false), 10_000);
        return () => window.clearTimeout(timer);
    }, [token]);
    useEffect(() => {
        if (typeof window === "undefined" || token)
            return;
        if (publicDeepLinkHandledRef.current)
            return;
        publicDeepLinkHandledRef.current = true;
        let cancelled = false;
        const url = new URL(window.location.href);
        const imageId = (url.searchParams.get("image") ?? "").trim();
        const loraId = (url.searchParams.get("lora") ?? "").trim();
        if (!imageId && !loraId)
            return;
        const clearUnknownParams = () => {
            if (cancelled)
                return;
            const next = new URL(window.location.href);
            if (next.searchParams.get("image"))
                next.searchParams.delete("image");
            if (next.searchParams.get("lora"))
                next.searchParams.delete("lora");
            window.history.replaceState({}, "", `${next.pathname}${next.search}${next.hash}`);
        };
        if (loraId) {
            fetch(`/api/loras/public/${encodeURIComponent(loraId)}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                if (cancelled)
                    return;
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
            if (cancelled)
                return;
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
        if (typeof window === "undefined" || token)
            return;
        const next = new URL(window.location.href);
        if (lang)
            next.searchParams.set("lang", lang);
        if (loginSelectedLora?.id) {
            next.searchParams.set("lora", loginSelectedLora.id);
            next.searchParams.delete("image");
        }
        else if (loginSelectedImage?.id) {
            next.searchParams.set("image", loginSelectedImage.id);
            next.searchParams.delete("lora");
        }
        else {
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
        if (!token)
            return;
        const headers = { Authorization: `Bearer ${token}` };
        fetch("/api/training/profiles", { headers })
            .then((res) => res.json())
            .then((data) => setTrainProfiles(data.profiles ?? []))
            .catch(() => setTrainProfiles([]));
        fetch("/api/users/me/profile", { headers })
            .then((res) => res.json())
            .then((data) => setProfile({ display_name: data.display_name ?? "", bio: data.bio ?? "", avatar_file_id: data.avatar_file_id ?? null }))
            .catch(() => setProfile({ display_name: "", bio: "", avatar_file_id: null }));
        fetch("/api/settings", { headers })
            .then((res) => res.json())
            .then((data) => {
            const map = {};
            const userMap = {};
            (data.global ?? []).forEach((entry) => {
                map[entry.key] = entry.value;
            });
            (data.user ?? []).forEach((entry) => {
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
                selection_target_per_character: String(map["selection_target_per_character"] ?? CORE_DEFAULTS.selection_target_per_character),
                selection_face_quota: String(map["selection_face_quota"] ?? CORE_DEFAULTS.selection_face_quota),
                selection_hamming_threshold: String(map["selection_hamming_threshold"] ?? CORE_DEFAULTS.selection_hamming_threshold),
                selection_hamming_relaxed: String(map["selection_hamming_relaxed"] ?? CORE_DEFAULTS.selection_hamming_relaxed),
                autotag_general_threshold: String(map["autotag_general_threshold"] ?? CORE_DEFAULTS.autotag_general_threshold),
                autotag_character_threshold: String(map["autotag_character_threshold"] ?? CORE_DEFAULTS.autotag_character_threshold),
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
            const list = (data.threads ?? []);
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
            .then((data) => setDmBlocks((data.blocks ?? [])))
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
                .then((data) => setQueueStatus({
                queue_paused: Boolean(data.queue_paused ?? false),
                active_pipeline_id: data.active_pipeline_id ?? "",
                active_generation_id: data.active_generation_id ?? "",
                active_training_id: data.active_training_id ?? ""
            }))
                .catch(() => setQueueStatus({
                queue_paused: false,
                active_pipeline_id: "",
                active_generation_id: "",
                active_training_id: ""
            }));
        }
        else {
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
        if (!token || !isAdmin)
            return;
        if (adminTab !== "archives")
            return;
        refreshAdminArchives();
        refreshArchiveRetentionDays();
    }, [adminTab, token, isAdmin, adminArchiveQuery, adminArchiveUser]);
    useEffect(() => {
        if (!token || !isAdmin)
            return;
        if (adminTab !== "credits")
            return;
        refreshAdminCreditLedger().catch(() => null);
    }, [token, isAdmin, adminTab, adminLedgerPage, adminLedgerPageSize]);
    useEffect(() => {
        if (!token)
            return;
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
        if (!token || view !== "lora")
            return;
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
                if (cancelled)
                    return;
                setSelectedRun(data.run ?? null);
                setSelectedRunSteps(data.steps ?? []);
                setSelectedRunEvents(data.events ?? []);
                setSelectedRunPreviews(data.previews ?? []);
                setSelectedTrainingPreviews(data.training_previews ?? []);
            })
                .catch(() => {
                if (cancelled)
                    return;
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
        const normalizeTag = (tag) => tag.trim().toLowerCase();
        const parseCaptionTags = (caption) => caption
            ? caption
                .split(",")
                .map((tag) => normalizeTag(tag))
                .filter(Boolean)
            : [];
        const normalizedFilter = manualFilterTags.map((tag) => normalizeTag(tag)).filter(Boolean);
        const filtered = manualImages.filter((img) => {
            if (manualFaceOnly && !img.isFace)
                return false;
            const hay = `${img.name} ${img.caption || ""}`.toLowerCase();
            const matchesQuery = !query || hay.includes(query);
            if (!matchesQuery)
                return false;
            if (!normalizedFilter.length)
                return true;
            const tags = parseCaptionTags(img.caption);
            if (!tags.length)
                return false;
            if (manualTagMatch === "all") {
                return normalizedFilter.every((tag) => tags.includes(tag));
            }
            return normalizedFilter.some((tag) => tags.includes(tag));
        });
        setManualFiltered(filtered);
        setManualPage(1);
    }, [manualImages, manualSearch, manualFaceOnly, manualFilterTags, manualTagMatch]);
    useEffect(() => {
        if (!token || user)
            return;
        let cancelled = false;
        let timeout;
        const headers = { Authorization: `Bearer ${token}` };
        const retryLoad = () => {
            fetch("/api/users/me", { headers })
                .then((res) => res.json())
                .then((data) => {
                if (cancelled)
                    return;
                if (data?.role) {
                    setUser(data);
                    return;
                }
                timeout = window.setTimeout(retryLoad, 3000);
            })
                .catch(() => {
                if (cancelled)
                    return;
                timeout = window.setTimeout(retryLoad, 3000);
            });
        };
        retryLoad();
        return () => {
            cancelled = true;
            if (timeout)
                window.clearTimeout(timeout);
        };
    }, [token, user]);
    useEffect(() => {
        if (user?.must_change_password) {
            setPasswordOpen(true);
        }
    }, [user?.must_change_password]);
    useEffect(() => {
        if (!runConfig.manualTagging)
            return;
        setRunConfig((prev) => ({
            ...prev,
            autotag: true,
            autochar: false
        }));
    }, [runConfig.manualTagging]);
    useEffect(() => {
        const baseModels = modelRegistry.filter((model) => model.kind === "training_model" || model.kind === "base_model");
        if (!baseModels.length)
            return;
        const stored = getLastModelId();
        const storedValid = stored && baseModels.some((model) => model.file_id === stored);
        if (!modelId) {
            if (storedValid) {
                setModelId(stored);
            }
            else {
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
        if (!trainProfiles.length)
            return;
        if (runConfig.trainProfile)
            return;
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
    const filterPhaseSteps = (steps, kind, phase) => {
        if (kind === "pipeline") {
            return steps.filter((step) => prepStepSet.has(step.step));
        }
        const target = phase === "train_pre" ? "train_pre" : phase === "train" ? "train_phase" : "finishing";
        return steps.filter((step) => step.step === target);
    };
    const resolveDashboardModalStatus = () => {
        if (dashboardModalData?.status_live)
            return String(dashboardModalData.status_live);
        if (dashboardModalData?.status)
            return String(dashboardModalData.status);
        const running = dashboardModalSteps.find((step) => step.status === "running");
        if (running)
            return `running (${running.step})`;
        const failed = dashboardModalSteps.find((step) => step.status === "failed");
        if (failed)
            return `failed (${failed.step})`;
        const last = dashboardModalSteps[dashboardModalSteps.length - 1];
        if (last?.status)
            return String(last.status);
        return "-";
    };
    const formatEta = (value) => {
        if (!Number.isFinite(Number(value)))
            return "-";
        const seconds = Math.max(0, Math.round(Number(value)));
        const minutes = Math.floor(seconds / 60);
        const rest = seconds % 60;
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
        if (minutes > 0)
            return `${minutes}m ${rest}s`;
        return `${rest}s`;
    };
    const normalizeTriggerName = (value) => value.trim().toLowerCase();
    const isValidTriggerName = (value) => /^[a-z0-9_-]+$/.test(value);
    const deriveZipTrigger = (name) => {
        const base = name.replace(/\.zip$/i, "").trim();
        return normalizeTriggerName(base);
    };
    const existingTriggerSet = useMemo(() => {
        const set = new Set();
        for (const run of pipelineRuns) {
            if (run.name)
                set.add(String(run.name).toLowerCase());
        }
        for (const run of trainingRuns) {
            if (run?.name)
                set.add(String(run.name).toLowerCase());
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
    const closeTrainerWizard = (options) => {
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
    const selectTrainerMode = (mode) => {
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
        if (!trainerWizardMode)
            return false;
        if (trainerWizardMode === "single") {
            if (trainerWizardStep === 1)
                return singleNameValid;
            if (trainerWizardStep === 2)
                return stagedUploads.length === 1;
        }
        if (trainerWizardMode === "batch") {
            if (trainerWizardStep === 1)
                return (stagedUploads.length > 0 &&
                    !batchLimitExceeded &&
                    batchInvalid.length === 0 &&
                    batchDuplicatesInternal.length === 0);
        }
        return true;
    };
    const submitWizardTraining = (options) => {
        if (!wizardSubmitReadyBase)
            return;
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
        }
        else {
            commitUploads();
        }
        closeTrainerWizard({ clearStaged: false });
    };
    const wizardSteps = trainerWizardMode === "single"
        ? ["Mode", "Name", "Upload", "Training", "Tagging", "Prompts", "Review"]
        : trainerWizardMode === "batch"
            ? ["Mode", "Upload", "Training", "Tagging", "Prompts", "Review"]
            : ["Mode"];
    const wizardStepLabel = wizardSteps[trainerWizardStep] ?? "Mode";
    const normalizedSingleName = normalizeTriggerName(trainerName);
    const singleNameLengthValid = normalizedSingleName.length >= 3 && normalizedSingleName.length <= 64;
    const singleNameValid = trainerName.trim().length > 0 &&
        !/\s/.test(trainerName) &&
        isValidTriggerName(normalizedSingleName) &&
        singleNameLengthValid;
    const singleTriggerDuplicate = Boolean(normalizedSingleName) && existingTriggerSet.has(normalizedSingleName);
    const batchInvalid = batchTriggerInfo.filter((info) => !info.valid);
    const batchDuplicatesExisting = batchTriggerInfo.filter((info) => info.duplicateExisting);
    const batchTriggers = batchTriggerInfo.map((info) => info.normalized);
    const batchDuplicatesInternal = batchTriggers.filter((name, idx) => name && batchTriggers.indexOf(name) !== idx);
    const stagedVideoCount = stagedUploads.reduce((sum, upload) => sum + Number(upload.video_count ?? 0), 0);
    const stagedContainsVideos = stagedVideoCount > 0 || stagedUploads.some((upload) => Boolean(upload.contains_videos));
    const trainCost = Number(settingsMap["credits.train"] ?? 5) || 5;
    const batchUploadCount = stagedUploads.length;
    const batchLimitExceeded = batchUploadCount > wizardMaxBatch;
    const duplicateWarning = trainerWizardMode === "single"
        ? singleTriggerDuplicate
        : trainerWizardMode === "batch"
            ? batchDuplicatesExisting.length > 0
            : false;
    const duplicateWarningNames = trainerWizardMode === "single"
        ? singleTriggerDuplicate
            ? [normalizedSingleName]
            : []
        : batchDuplicatesExisting.map((info) => info.normalized);
    const batchInvalidNames = batchInvalid.map((info) => info.name);
    const batchInternalDuplicates = Array.from(new Set(batchDuplicatesInternal));
    const creditsPerRun = runConfig.train ? trainCost : 0;
    const creditsTotal = trainerWizardMode === "batch" ? creditsPerRun * Math.max(batchUploadCount, 0) : creditsPerRun;
    const wizardSubmitReadyBase = trainerWizardMode === "single"
        ? singleNameValid && stagedUploads.length === 1
        : trainerWizardMode === "batch"
            ? stagedUploads.length > 0 &&
                !batchLimitExceeded &&
                batchInvalid.length === 0 &&
                batchDuplicatesInternal.length === 0
            : false;
    const wizardSubmitReady = wizardSubmitReadyBase && (!duplicateWarning || trainerConfirmDuplicates);
    const prepPhaseRuns = useMemo(() => dashboardPipeline.filter((run) => ["queued", "queued_initiated", "running", "manual_tagging", "failed"].includes(String(run.status ?? ""))), [dashboardPipeline]);
    const trainPrePhaseRuns = useMemo(() => {
        const trainingPhase = dashboardTraining.filter((run) => {
            if (["removing", "remove_failed"].includes(String(run.status ?? "")))
                return false;
            const steps = run.steps ?? {};
            const inTrainPhase = ["running", "failed"].includes(String(steps.train_phase ?? ""));
            const inFinishing = ["running", "pending", "failed"].includes(String(steps.finishing ?? ""));
            return !inTrainPhase && !inFinishing && run.status !== "completed";
        });
        const waitingPipeline = dashboardPipeline.filter((run) => run.status === "ready_to_train" && !dashboardTraining.some((training) => training.pipeline_run_id === run.id));
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
    const trainPhaseRuns = useMemo(() => dashboardTraining.filter((run) => {
        if (["removing", "remove_failed"].includes(String(run.status ?? "")))
            return false;
        const steps = run.steps ?? {};
        return (["running", "failed"].includes(String(steps.train_phase ?? "")) ||
            (run.status === "running" && !steps.train_pre) ||
            (run.status === "failed" && steps.train_pre === "done" && !steps.finishing));
    }), [dashboardTraining]);
    const finishingPhaseRuns = useMemo(() => dashboardTraining.filter((run) => {
        if (["removing", "remove_failed"].includes(String(run.status ?? "")))
            return false;
        const steps = run.steps ?? {};
        return ["running", "failed"].includes(String(steps.finishing ?? "")) || (run.status === "completed" && steps.finishing);
    }), [dashboardTraining]);
    const mobileDashboardJobs = useMemo(() => {
        const rows = [];
        for (const run of dashboardTraining) {
            const steps = run.steps ?? {};
            const phase = steps.finishing === "running" || steps.finishing === "failed" || run.status === "completed"
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
            if (rows.some((item) => item.id === run.id))
                continue;
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
        const rank = (status) => {
            if (status === "running")
                return 0;
            if (status === "queued" || status === "queued_initiated" || status === "manual_tagging" || status === "ready_to_train") {
                return 1;
            }
            if (status === "failed")
                return 2;
            return 3;
        };
        const visibleRows = rows.filter((row) => {
            if (mobileShowCompletedJobs)
                return true;
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
    const openDashboardModal = (kind, id, phase) => {
        if (!token)
            return;
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
                setDashboardModalPreviews(Array.isArray(data.previews) ? data.previews.map((row) => String(row.file_id)).filter(Boolean) : []);
                setDashboardModalTrainingPreviews(Array.isArray(data.training_previews)
                    ? data.training_previews
                        .map((row) => ({
                        file_id: String(row?.file_id ?? "").trim(),
                        epoch: row?.epoch != null ? Number(row.epoch) : null
                    }))
                        .filter((row) => Boolean(row.file_id))
                    : []);
                setDashboardDatasetCoverUrl(data.dataset_cover_url ? String(data.dataset_cover_url) : null);
                setDashboardDatasetCoverFileId(data.dataset_cover_file_id ? String(data.dataset_cover_file_id) : null);
                setDashboardModalLastUpdated(Date.now());
            })
                .catch(() => null);
        }
        else {
            fetch(`/api/training/runs/${id}/details`, { headers })
                .then((res) => res.json())
                .then((data) => {
                const steps = data.steps ?? [];
                const stepMap = steps.reduce((acc, row) => {
                    acc[String(row.step)] = String(row.status ?? "");
                    return acc;
                }, {});
                const nextPhase = stepMap.finishing === "running" || stepMap.finishing === "done" || data.run?.status === "completed"
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
                setDashboardModalTrainingPreviews(Array.isArray(data.training_previews)
                    ? data.training_previews
                        .map((row) => ({
                        file_id: String(row?.file_id ?? "").trim(),
                        epoch: row?.epoch != null ? Number(row.epoch) : null
                    }))
                        .filter((row) => Boolean(row.file_id))
                    : []);
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
        if (!isMobileRouteActive || !mobileMenuOpen)
            return;
        setMobileMenuOpen(false);
    }, [view, isMobileRouteActive, mobileMenuOpen]);
    useEffect(() => {
        if (!dashboardModalOpen || !dashboardModalId || !token)
            return;
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
                    setDashboardModalPreviews(Array.isArray(data.previews) ? data.previews.map((row) => String(row.file_id)).filter(Boolean) : []);
                    setDashboardModalTrainingPreviews(Array.isArray(data.training_previews)
                        ? data.training_previews
                            .map((row) => ({
                            file_id: String(row?.file_id ?? "").trim(),
                            epoch: row?.epoch != null ? Number(row.epoch) : null
                        }))
                            .filter((row) => Boolean(row.file_id))
                        : []);
                    setDashboardDatasetCoverUrl(data.dataset_cover_url ? String(data.dataset_cover_url) : null);
                    setDashboardDatasetCoverFileId(data.dataset_cover_file_id ? String(data.dataset_cover_file_id) : null);
                    setDashboardModalLastUpdated(Date.now());
                })
                    .catch(() => null);
            }
            else {
                fetch(`/api/training/runs/${dashboardModalId}/details`, { headers })
                    .then((res) => res.json())
                    .then((data) => {
                    const steps = data.steps ?? [];
                    const stepMap = steps.reduce((acc, row) => {
                        acc[String(row.step)] = String(row.status ?? "");
                        return acc;
                    }, {});
                    const nextPhase = stepMap.finishing === "running" || stepMap.finishing === "done" || data.run?.status === "completed"
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
                    setDashboardModalTrainingPreviews(Array.isArray(data.training_previews)
                        ? data.training_previews
                            .map((row) => ({
                            file_id: String(row?.file_id ?? "").trim(),
                            epoch: row?.epoch != null ? Number(row.epoch) : null
                        }))
                            .filter((row) => Boolean(row.file_id))
                        : []);
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
        if (!token || view !== "generator")
            return;
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
                    const current = list.find((job) => job.id === activeGenerationId);
                    if (current) {
                        setActiveGenerationProgress(typeof current.progress_pct === "number" ? current.progress_pct : null);
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
        if (!token || manualImages.length === 0)
            return;
        setManualImages((prev) => prev.map((img) => ({
            ...img,
            url: withToken(img.url, token)
        })));
    }, [token]);
    useEffect(() => {
        if (!token || (view !== "dashboard" && view !== "pipeline"))
            return;
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
        if (!token)
            return;
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
        if (!notificationPulse)
            return;
        const timeout = window.setTimeout(() => setNotificationPulse(false), 2500);
        return () => window.clearTimeout(timeout);
    }, [notificationPulse]);
    useEffect(() => {
        if (view === "generator")
            return;
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
        if (!token || !miniDmThreadId)
            return;
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
        if (!token || view !== "settings" || settingsTab !== "security")
            return;
        refreshTwoFaStatus();
    }, [token, view, settingsTab]);
    useEffect(() => {
        if (!token)
            return;
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
        if (!token || view !== "gallery")
            return;
        const headers = { Authorization: `Bearer ${token}` };
        const endpoint = galleryMode === "private" ? "/api/gallery/private" : "/api/gallery/public";
        fetch(endpoint, { headers })
            .then((res) => res.json())
            .then((data) => setGalleryImages(data.images ?? []))
            .catch(() => setGalleryImages([]));
    }, [token, view, galleryMode]);
    useEffect(() => {
        if (!token)
            return;
        try {
            const raw = sessionStorage.getItem("fx_mini_dm_state");
            if (!raw)
                return;
            const parsed = JSON.parse(raw);
            if (typeof parsed?.open === "boolean")
                setMiniDmOpen(parsed.open);
            if (parsed?.mode === "threads" || parsed?.mode === "chat")
                setMiniDmMode(parsed.mode);
            if (typeof parsed?.threadId === "string")
                setMiniDmThreadId(parsed.threadId);
        }
        catch {
            // ignore bad session state
        }
    }, [token]);
    useEffect(() => {
        if (!token)
            return;
        try {
            sessionStorage.setItem("fx_mini_dm_state", JSON.stringify({ open: miniDmOpen, mode: miniDmMode, threadId: miniDmThreadId }));
        }
        catch {
            // ignore storage errors
        }
    }, [token, miniDmOpen, miniDmMode, miniDmThreadId]);
    useEffect(() => {
        if (!miniDmOpen || miniDmMode !== "chat") {
            setMiniDmEmojiOpen(false);
        }
    }, [miniDmOpen, miniDmMode]);
    useEffect(() => {
        if (!galleryBulkMode)
            return;
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
        if (!hasAny)
            return;
        const onKeyDown = (event) => {
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
                        setSelectedLoraPreview(selectedLoraPreviewIds[(idx - 1 + selectedLoraPreviewIds.length) % selectedLoraPreviewIds.length]);
                    }
                    return;
                }
                if (hasLogin && loginSelectedLoraPreview) {
                    const idx = loginSelectedLoraPreviewIds.indexOf(loginSelectedLoraPreview);
                    if (idx >= 0) {
                        setLoginSelectedLoraPreview(loginSelectedLoraPreviewIds[(idx - 1 + loginSelectedLoraPreviewIds.length) % loginSelectedLoraPreviewIds.length]);
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
        if (!selectedLoraPreview || selectedLoraPreviewIndex < 0 || selectedLoraPreviewIds.length < 2)
            return;
        const nextId = selectedLoraPreviewIds[(selectedLoraPreviewIndex + 1) % selectedLoraPreviewIds.length];
        const prevId = selectedLoraPreviewIds[(selectedLoraPreviewIndex - 1 + selectedLoraPreviewIds.length) % selectedLoraPreviewIds.length];
        [nextId, prevId].forEach((fileId) => {
            const thumb = new Image();
            thumb.src = fileUrl(fileId, token, { thumb: true, size: 1024 });
            const original = new Image();
            original.src = fileUrl(fileId, token);
        });
    }, [selectedLoraPreview, selectedLoraPreviewIndex, selectedLoraPreviewIds, token]);
    useEffect(() => {
        if (!loginSelectedLoraPreview || loginSelectedLoraPreviewIndex < 0 || loginSelectedLoraPreviewIds.length < 2)
            return;
        const nextId = loginSelectedLoraPreviewIds[(loginSelectedLoraPreviewIndex + 1) % loginSelectedLoraPreviewIds.length];
        const prevId = loginSelectedLoraPreviewIds[(loginSelectedLoraPreviewIndex - 1 + loginSelectedLoraPreviewIds.length) % loginSelectedLoraPreviewIds.length];
        [nextId, prevId].forEach((fileId) => {
            const thumb = new Image();
            thumb.src = fileUrl(fileId, "", { thumb: true, size: 1024 });
            const original = new Image();
            original.src = fileUrl(fileId, "");
        });
    }, [loginSelectedLoraPreview, loginSelectedLoraPreviewIndex, loginSelectedLoraPreviewIds]);
    useEffect(() => {
        if (token)
            return;
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
        if (!token || !isAdmin)
            return;
        fetch("/api/admin/queue/status", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setQueueStatus({
            queue_paused: Boolean(data.queue_paused ?? false),
            active_pipeline_id: data.active_pipeline_id ?? "",
            active_generation_id: data.active_generation_id ?? "",
            active_training_id: data.active_training_id ?? ""
        }))
            .catch(() => setQueueStatus({
            queue_paused: false,
            active_pipeline_id: "",
            active_generation_id: "",
            active_training_id: ""
        }));
    };
    const refreshAdminCreditLedger = async (pageOverride) => {
        if (!token || !isAdmin)
            return;
        const page = Math.max(1, pageOverride ?? adminLedgerPage);
        const params = new URLSearchParams({
            page: String(page),
            page_size: String(adminLedgerPageSize)
        });
        if (adminLedgerUserFilter.trim())
            params.set("user", adminLedgerUserFilter.trim());
        if (adminLedgerReasonFilter.trim())
            params.set("reason", adminLedgerReasonFilter.trim());
        if (adminLedgerRefTypeFilter.trim())
            params.set("ref_type", adminLedgerRefTypeFilter.trim());
        if (adminLedgerDeltaSign !== "all")
            params.set("delta_sign", adminLedgerDeltaSign);
        if (adminLedgerFrom)
            params.set("from", adminLedgerFrom);
        if (adminLedgerTo)
            params.set("to", adminLedgerTo);
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
            setAdminLedgerEntries((data.entries ?? []));
            setAdminLedgerTotal(Number(data.total ?? 0));
            setAdminLedgerPage(Number(data.page ?? page));
        }
        catch {
            setAdminLedgerEntries([]);
            setAdminLedgerTotal(0);
            setAdminLedgerStatus("Ledger load failed");
        }
        finally {
            setAdminLedgerLoading(false);
        }
    };
    const openAdminCreditLedgerDetail = async (entryId) => {
        if (!token || !isAdmin || !entryId)
            return;
        setAdminLedgerDetailOpen(true);
        setAdminLedgerDetail(null);
        const res = await fetch(`/api/admin/credits/ledger/${entryId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok)
            return;
        const data = await res.json().catch(() => ({}));
        setAdminLedgerDetail((data ?? null));
    };
    const copyText = async (value) => {
        try {
            await navigator.clipboard.writeText(value);
            setAdminLedgerCopyStatus("Copied.");
            window.setTimeout(() => setAdminLedgerCopyStatus(""), 1200);
        }
        catch {
            setAdminLedgerCopyStatus("Copy failed.");
            window.setTimeout(() => setAdminLedgerCopyStatus(""), 1800);
        }
    };
    const exportAdminLedgerCsv = () => {
        if (!adminLedgerEntries.length)
            return;
        const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const header = ["id", "created_at", "user_id", "username", "email", "delta", "reason", "ref_type", "ref_id"];
        const lines = [
            header.join(","),
            ...adminLedgerEntries.map((entry) => [
                escape(entry.id),
                escape(entry.created_at),
                escape(entry.user_id),
                escape(entry.username),
                escape(entry.email),
                escape(entry.delta),
                escape(entry.reason ?? ""),
                escape(entry.ref_type ?? ""),
                escape(entry.ref_id ?? "")
            ].join(","))
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
        if (!token || !isAdmin)
            return;
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
            const list = (data.users ?? []);
            setAdminUsers(list);
            setAdminUserSelectedId(list[0]?.id ?? "");
            setAdminUserSearchStatus(list.length ? `${list.length} Treffer` : "Keine Treffer");
            setAdminUserPasswordResult("");
        }
        catch {
            setAdminUsers([]);
            setAdminUserSelectedId("");
            setAdminUserSearchStatus("Suche fehlgeschlagen");
        }
        finally {
            setAdminUserSearchBusy(false);
        }
    };
    const refreshSelectedAdminUser = async () => {
        if (!token || !isAdmin || !adminUserSelectedId)
            return;
        const current = adminUsers.find((row) => row.id === adminUserSelectedId);
        if (!current)
            return;
        const field = current.email === adminUserSearchValue.trim() ? "email" : "id";
        const value = field === "email" ? current.email : current.id;
        const params = new URLSearchParams({ field, value, limit: "1" });
        const res = await fetch(`/api/admin/users/search?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok)
            return;
        const data = await res.json().catch(() => ({}));
        const fresh = (data.users ?? [])[0];
        if (!fresh)
            return;
        setAdminUsers((prev) => prev.map((row) => (row.id === fresh.id ? fresh : row)));
    };
    const refreshAdminArchives = () => {
        if (!token || !isAdmin)
            return;
        setAdminArchiveLoading(true);
        setAdminArchiveMessage("");
        const params = new URLSearchParams();
        if (adminArchiveQuery.trim())
            params.set("query", adminArchiveQuery.trim());
        if (adminArchiveUser.trim())
            params.set("user_id", adminArchiveUser.trim());
        params.set("limit", "250");
        fetch(`/api/admin/archives?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setAdminArchives(data.archives ?? []))
            .catch(() => setAdminArchives([]))
            .finally(() => setAdminArchiveLoading(false));
    };
    const refreshArchiveRetentionDays = () => {
        if (!token || !isAdmin)
            return;
        fetch("/api/admin/archives/retention", { headers: { Authorization: `Bearer ${token}` } })
            .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))
            .then(({ ok, data }) => {
            if (!ok)
                return;
            const value = Number(data?.retention_days);
            if (Number.isFinite(value) && value >= 1) {
                setAdminArchiveRetentionDays(String(Math.round(value)));
            }
        })
            .catch(() => null);
    };
    const restoreAdminArchive = (archivePath) => {
        if (!token || !isAdmin)
            return;
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
    const openArchiveDetails = (archivePath) => {
        if (!token || !isAdmin)
            return;
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
    const deleteAdminArchive = (archivePath) => {
        if (!token || !isAdmin)
            return;
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
    const queueCommand = (action) => {
        if (!token || !isAdmin)
            return;
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
        if (!token || !isAdmin)
            return;
        fetch("/api/admin/tagger/models", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setTaggerModels(data.models ?? []))
            .catch(() => setTaggerModels([]));
    };
    const refreshStagedUploads = () => {
        if (!token)
            return;
        fetch("/api/uploads/staged", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setStagedUploads(data.uploads ?? []))
            .catch(() => setStagedUploads([]));
    };
    const refreshPipelineRuns = () => {
        if (!token)
            return;
        fetch("/api/runs", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setPipelineRuns(data.runs ?? []))
            .catch(() => setPipelineRuns([]));
    };
    const refreshDashboardOverview = () => {
        if (!token)
            return;
        const headers = { Authorization: `Bearer ${token}` };
        fetch("/api/dashboard/overview", { headers })
            .then((res) => res.json())
            .then((data) => {
            const trainingSteps = (data.training_steps ?? []).reduce((acc, row) => {
                acc[row.run_id] = row.steps ?? {};
                return acc;
            }, {});
            const trainingRuns = (data.training_runs ?? []).map((run) => ({
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
        if (!token)
            return;
        fetch("/api/training/runs", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setTrainingRuns(data.runs ?? []))
            .catch(() => setTrainingRuns([]));
    };
    const refreshJobs = () => {
        if (!token)
            return;
        fetch("/api/generation/jobs", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setJobs(data.jobs ?? []))
            .catch(() => setJobs([]));
    };
    const refreshDmUnread = () => {
        if (!token)
            return;
        fetch("/api/dm/unread-count", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setDmUnreadCount(Number(data.unread_count ?? 0)))
            .catch(() => setDmUnreadCount(0));
    };
    const refreshDmBlocks = () => {
        if (!token)
            return;
        fetch("/api/dm/blocks", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setDmBlocks((data.blocks ?? [])))
            .catch(() => setDmBlocks([]));
    };
    const refreshDmThreads = (selectId) => {
        if (!token)
            return;
        fetch("/api/dm/threads", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => {
            const list = (data.threads ?? []);
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
    const refreshDmMessages = (threadId, options) => {
        if (!token || !threadId)
            return;
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
            const incoming = (data.messages ?? []).filter((row) => Boolean(row?.id));
            if (incremental) {
                if (incoming.length) {
                    setDmMessages((prev) => {
                        const map = new Map(prev.map((msg) => [msg.id, msg]));
                        for (const row of incoming)
                            map.set(row.id, row);
                        return Array.from(map.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    });
                }
            }
            else {
                setDmMessages(incoming);
            }
            if (!markRead)
                return null;
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
            if (!incremental)
                setDmMessages([]);
        })
            .finally(() => {
            if (!incremental)
                setDmLoading(false);
        });
    };
    const openDmWithUser = (targetUserId) => {
        if (!token || !targetUserId)
            return;
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
            setView("messages");
            setDmActiveThreadId(threadId);
            refreshDmThreads(threadId);
            refreshDmMessages(threadId);
        })
            .catch(() => setDmStatus("Could not open chat."));
    };
    const reorderDashboardQueueItem = (item, direction) => {
        if (!token)
            return;
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
    const sendDmMessage = (options) => {
        if (!token)
            return;
        const threadId = String(options?.threadId ?? dmActiveThreadId ?? "");
        if (!threadId)
            return;
        const body = String(options?.body ?? dmDraft).trim();
        if (!body)
            return;
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
                    if (prev.some((msg) => msg.id === data.message.id))
                        return prev;
                    return [...prev, data.message].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                });
            }
            else {
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
    const deleteDmThread = (threadId) => {
        if (!token || !threadId)
            return;
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
    const blockDmUser = (targetUserId) => {
        if (!token || !targetUserId)
            return;
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
    const unblockDmUser = (targetUserId) => {
        if (!token || !targetUserId)
            return;
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
    const saveWildcardSettings = (nextLists, nextMode) => {
        if (!token)
            return;
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
            if (!modeRes.ok)
                throw new Error("wildcard_mode_save_failed");
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
    const editWildcard = (name) => {
        const found = wildcardLists.find((row) => row.name === name);
        if (!found)
            return;
        setWildcardEditName(name);
        setWildcardNameInput(found.name);
        setWildcardEntriesInput(found.entries.join("\n"));
        setWildcardMessage("");
    };
    const removeWildcard = (name) => {
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
        if (!token)
            return;
        const endpoint = mode === "private" ? "/api/loras/private" : "/api/loras/public";
        const headers = { Authorization: `Bearer ${token}` };
        fetch(endpoint, { headers })
            .then((res) => res.json())
            .then((data) => setLoraEntries(data.loras ?? []))
            .catch(() => setLoraEntries([]));
    };
    const canManageLoraEntry = (entry) => Boolean(entry.user_id && (entry.user_id === user?.id || isAdmin));
    const manageableVisibleLoraIds = useMemo(() => loraEntries.filter((entry) => canManageLoraEntry(entry)).map((entry) => entry.id), [loraEntries, user?.id, isAdmin]);
    useEffect(() => {
        setLoraBulkSelection((prev) => prev.filter((id) => manageableVisibleLoraIds.includes(id)));
    }, [manageableVisibleLoraIds]);
    const toggleLoraBulkSelection = (loraId) => {
        setLoraBulkSelection((prev) => (prev.includes(loraId) ? prev.filter((id) => id !== loraId) : [...prev, loraId]));
    };
    const applyLoraBulkVisibility = async (isPublic) => {
        if (!token || !loraBulkSelection.length || loraBulkBusy)
            return;
        setLoraBulkBusy(true);
        setLoraBulkMessage("Applying visibility...");
        try {
            const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
            const results = await Promise.all(loraBulkSelection.map(async (id) => {
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
            }));
            const okCount = results.filter((row) => row.ok).length;
            const failed = results.filter((row) => !row.ok);
            if (failed.length) {
                setLoraBulkMessage(`Updated ${okCount}/${results.length}. Failed: ${failed
                    .slice(0, 3)
                    .map((row) => humanizeErrorCode(row.error))
                    .join(", ")}`);
            }
            else {
                setLoraBulkMessage(`Updated ${okCount}/${results.length}.`);
            }
            setLoraBulkSelection([]);
            refreshLoraEntries();
            if (selectedLoraEntry)
                openLoraEntry(selectedLoraEntry);
        }
        catch {
            setLoraBulkMessage("Bulk visibility update failed.");
        }
        finally {
            setLoraBulkBusy(false);
        }
    };
    const generateLoraBulkPreviews = async () => {
        if (!token || !loraBulkSelection.length || loraBulkBusy)
            return;
        setLoraBulkBusy(true);
        setLoraBulkMessage("Queuing preview generation...");
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const results = await Promise.all(loraBulkSelection.map(async (id) => {
                const res = await fetch(`/api/loras/${id}/previews`, {
                    method: "POST",
                    headers
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    return { ok: false, id, error: String(data?.error ?? "preview_queue_failed") };
                }
                return { ok: true, id };
            }));
            const okCount = results.filter((row) => row.ok).length;
            const failed = results.filter((row) => !row.ok);
            if (failed.length) {
                setLoraBulkMessage(`Queued previews ${okCount}/${results.length}. Failed: ${failed
                    .slice(0, 3)
                    .map((row) => humanizeErrorCode(row.error))
                    .join(", ")}`);
            }
            else {
                setLoraBulkMessage(`Queued previews ${okCount}/${results.length}.`);
            }
            setLoraBulkSelection([]);
            refreshLoraEntries();
            if (selectedLoraEntry)
                openLoraEntry(selectedLoraEntry);
        }
        catch {
            setLoraBulkMessage("Bulk preview queue failed.");
        }
        finally {
            setLoraBulkBusy(false);
        }
    };
    const deleteLoraBulkSelection = async () => {
        if (!token || !loraBulkSelection.length || loraBulkBusy)
            return;
        if (!confirm(`Delete ${loraBulkSelection.length} selected LoRA(s)? This cannot be undone.`))
            return;
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
                setLoraBulkMessage(`Queued ${queued}/${loraBulkSelection.length}. Skipped: ${errors
                    .slice(0, 3)
                    .map((row) => humanizeErrorCode(String(row?.error ?? "unknown_error")))
                    .join(", ")}`);
            }
            else {
                setLoraBulkMessage(`Queued ${queued}/${loraBulkSelection.length} for removal.`);
            }
            setLoraBulkSelection([]);
            refreshLoraEntries();
        }
        catch {
            setLoraBulkMessage("Bulk delete failed.");
        }
        finally {
            setLoraBulkBusy(false);
        }
    };
    const cancelPipelineRun = (runId) => {
        if (!token)
            return;
        fetch(`/api/runs/${runId}/cancel`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => refreshPipelineRuns())
            .catch(() => null);
    };
    const retryPipelineRun = (runId) => {
        if (!token)
            return;
        fetch(`/api/runs/${runId}/retry`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => refreshPipelineRuns())
            .catch(() => null);
    };
    const deletePipelineRun = (runId) => {
        if (!token)
            return;
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
    const cancelTrainingRun = (runId) => {
        if (!token)
            return;
        fetch(`/api/training/runs/${runId}/cancel`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => refreshTrainingRuns())
            .catch(() => null);
    };
    const retryTrainingRun = (runId) => {
        if (!token)
            return;
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
    const deleteTrainingRun = (runId) => {
        if (!token)
            return;
        setTrainingRuns((prev) => prev.map((run) => (run.id === runId ? { ...run, status: "removing" } : run)));
        setDashboardTraining((prev) => prev.map((run) => (run.id === runId ? { ...run, status: "removing" } : run)));
        if (dashboardModalKind === "training" && dashboardModalData?.id === runId) {
            setDashboardModalData((prev) => (prev ? { ...prev, status: "removing", status_live: "removing" } : prev));
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
        if (!token || !isAdmin)
            return;
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
        if (!token || !isAdmin)
            return;
        if (!window.confirm("Run archive prune now? Old archives beyond retention will be permanently deleted."))
            return;
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
    const cancelGenerationJob = (jobId) => {
        if (!token)
            return;
        fetch(`/api/generation/jobs/${jobId}/cancel`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => refreshJobs())
            .catch(() => null);
    };
    const deleteGenerationJob = (jobId) => {
        if (!token)
            return;
        fetch(`/api/generation/jobs/${jobId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => refreshJobs())
            .catch(() => null);
    };
    const clearGenerationHistory = () => {
        if (!token)
            return;
        fetch("/api/generation/jobs?scope=history", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => refreshJobs())
            .catch(() => null);
    };
    const openManualEditor = (runId, runName) => {
        if (!token)
            return;
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
            const imgs = (data.images ?? []).map((img) => ({
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
    const toggleManualSelected = (path) => {
        setManualSelected((prev) => prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]);
    };
    const updateManualCaption = (path, caption) => {
        setManualImages((prev) => prev.map((img) => (img.path === path ? { ...img, caption } : img)));
        setManualDirty((prev) => ({ ...prev, [path]: caption }));
    };
    const applyManualBulk = (mode) => {
        const raw = mode === "add" ? manualBulkAdd : manualBulkRemove;
        const tags = parseTagList(raw);
        if (!tags.length)
            return;
        const targets = manualSelected.length > 0
            ? manualImages.filter((img) => manualSelected.includes(img.path))
            : manualFiltered;
        const updates = {};
        for (const img of targets) {
            const current = parseTagList(img.caption);
            let next = current;
            if (mode === "add") {
                next = Array.from(new Set([...current, ...tags]));
            }
            else {
                const remove = new Set(tags);
                next = current.filter((tag) => !remove.has(tag));
            }
            updates[img.path] = next.join(", ");
        }
        setManualImages((prev) => prev.map((img) => (updates[img.path] !== undefined ? { ...img, caption: updates[img.path] } : img)));
        setManualDirty((prev) => ({ ...prev, ...updates }));
    };
    const saveManualChanges = () => {
        if (!token || !manualRunId)
            return;
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
        if (!token || !manualRunId)
            return;
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
        if (!token || !manualRunId)
            return;
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
        if (!token)
            return;
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
    const parseAutocharPatterns = (value) => value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    const createAutocharPreset = () => {
        if (!token)
            return;
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
        if (!token || !autocharEditingId)
            return;
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
    const deleteAutocharPreset = (presetId) => {
        if (!token)
            return;
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
    const stageFiles = (files) => {
        if (!files || !token)
            return;
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
                const upload = data?.upload;
                if (upload?.contains_videos || Number(upload?.video_count ?? 0) > 0) {
                    const uploadName = upload?.name ?? file.name;
                    const videoCount = Number(upload?.video_count ?? 0);
                    setUploadMessage(`ACHTUNG: ZIP '${uploadName}' enthaelt ${videoCount} Video-Datei(en). Images-only ueberspringt Video-Capping.`);
                }
                refreshStagedUploads();
            })
                .catch(() => setUploadMessage("Upload failed"));
        });
    };
    const removeStaged = (id) => {
        if (!token)
            return;
        fetch(`/api/uploads/stage/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => refreshStagedUploads())
            .catch(() => null);
    };
    const commitUploads = (options) => {
        if (!token)
            return;
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
        return (_jsxs("div", { className: `app-shell public-shell ${isMobileRouteActive ? "mobile-route" : ""}`, children: [_jsxs("div", { className: "main", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { children: [_jsx("div", { className: "brand-title", children: "FrameWorkX" }), _jsx("div", { className: "brand-subtitle", children: "Mjolnir Console" })] }), _jsxs("div", { className: "top-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: () => setLoginOpen(true), children: t.signIn }), _jsx("button", { className: "action-btn", onClick: () => setApplyOpen(true), children: t.apply }), _jsxs("div", { className: "lang-switch", children: [_jsx("button", { onClick: () => setLang("en"), children: "EN" }), _jsx("button", { onClick: () => setLang("de"), children: "DE" })] })] })] }), _jsxs("main", { className: "content", children: [_jsxs("section", { className: `panel public-hero-v2 ${publicOverviewExpanded ? "is-expanded" : "is-collapsed"}`, children: [_jsxs("div", { className: "public-hero-v2-head", children: [_jsx("div", { className: "badge", children: t.publicAssetStats }), _jsx("button", { className: "action-btn ghost", onClick: () => setPublicOverviewExpanded((prev) => !prev), children: publicOverviewExpanded ? t.publicOverviewHide : t.publicOverviewShow })] }), publicOverviewExpanded ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "public-hero-v2-main", children: [_jsx("h1", { children: t.publicWelcomeTitle }), _jsx("p", { className: "public-hero-v2-lead", children: t.publicWelcomeLead }), _jsx("p", { className: "public-hero-v2-body", children: t.publicWelcomeBody }), _jsxs("ul", { className: "public-hero-v2-list", children: [_jsx("li", { children: t.publicFeatureOne }), _jsx("li", { children: t.publicFeatureTwo }), _jsx("li", { children: t.publicFeatureThree })] }), _jsxs("div", { className: "public-hero-v2-actions", children: [_jsx("button", { className: "action-btn", onClick: () => setLoginOpen(true), children: t.signIn }), _jsx("button", { className: "action-btn ghost", onClick: () => setApplyOpen(true), children: t.apply })] })] }), _jsxs("aside", { className: "public-hero-v2-side", children: [_jsx("div", { className: "detail-title", children: t.publicWhatIsTitle }), _jsx("div", { className: "muted small", children: t.publicWhatIsBody }), _jsxs("div", { className: "stat-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "label", children: t.publicExploreImages }), _jsx("div", { className: "value", children: loginGallerySafe.length })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "label", children: t.publicExploreModels }), _jsx("div", { className: "value", children: loginModelsSafe.length + loginLorasSafe.length })] })] })] })] })) : null] }), _jsxs("div", { className: "public-grid", children: [_jsxs("section", { className: "panel login-feed", children: [_jsx("div", { className: "panel-header", children: _jsx("h3", { children: t.publicExploreImages }) }), _jsxs("div", { className: "gallery-grid", children: [loginGallerySafe.map((img) => (_jsxs("a", { className: "gallery-tile", href: publicImageHref(img.id, lang), title: `Open public image by @${img.username}`, onClick: (event) => {
                                                                event.preventDefault();
                                                                fetch(`/api/gallery/images/public/${img.id}`)
                                                                    .then((res) => res.json())
                                                                    .then((data) => {
                                                                    setLoginSelectedImage(data.image ?? null);
                                                                    setLoginSelectedModelLabel(data.model_label ?? "");
                                                                })
                                                                    .catch(() => null);
                                                            }, children: [_jsx("img", { src: fileUrl(img.file_id, "", { thumb: true, size: 384 }), alt: `Public image by @${img.username}`, title: `Public image by @${img.username}`, loading: "lazy", decoding: "async" }), _jsxs("div", { className: "tile-meta", children: [_jsxs("div", { className: "tile-user", children: [renderAvatar(img.avatar_file_id, ""), _jsxs("span", { children: ["@", img.username] })] }), _jsxs("span", { className: "tile-meta-stats", children: [_jsxs("span", { children: ["\u2665 ", img.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", img.comment_count ?? 0] })] })] })] }, img.id))), !loginGallerySafe.length ? _jsx("div", { className: "muted small", children: t.publicNoImages }) : null] })] }), _jsxs("section", { className: "panel login-feed", children: [_jsx("div", { className: "panel-header", children: _jsx("h3", { children: t.publicExploreModels }) }), _jsxs("div", { className: "model-grid", children: [loginModelsSafe.map((model) => (_jsxs("a", { className: "model-card login-model-card", href: Array.isArray(model.images) && model.images[0] ? publicImageHref(model.images[0].id, lang) : "/", title: `Open public model ${model.name}`, children: [_jsx("div", { className: "model-thumb-grid", children: (Array.isArray(model.images) ? model.images : []).slice(0, 4).map((img) => (_jsx("img", { src: fileUrl(img.file_id, "", { thumb: true, size: 320 }), alt: `Preview for public model ${model.name}`, title: `Preview for public model ${model.name}`, loading: "lazy", decoding: "async" }, img.id))) }), _jsxs("div", { className: "tile-meta", children: [_jsxs("div", { className: "tile-user", children: [renderAvatar(model.avatar_file_id, ""), _jsxs("span", { children: ["@", model.username ?? "unknown", " \u2022 ", model.name] })] }), _jsxs("span", { className: "tile-meta-stats", children: [_jsxs("span", { children: ["\u2665 ", model.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", model.comment_count ?? 0] })] })] })] }, model.id))), loginLorasSafe.map((entry) => (_jsxs("a", { className: "lora-card", href: publicLoraHref(entry.id, lang), title: `Open public model ${entry.name}`, onClick: (event) => {
                                                                event.preventDefault();
                                                                fetch(`/api/loras/public/${entry.id}`)
                                                                    .then((res) => res.json())
                                                                    .then((data) => {
                                                                    setLoginSelectedLora(data.lora ?? null);
                                                                    setLoginSelectedLoraPreview(null);
                                                                })
                                                                    .catch(() => null);
                                                            }, children: [_jsx("div", { className: "lora-title", children: entry.name }), Array.isArray(entry.preview_file_ids) && entry.preview_file_ids.length > 0 ? (_jsx("div", { className: "lora-previews", children: entry.preview_file_ids.slice(0, 4).map((fileId) => (_jsx("img", { src: fileUrl(fileId, "", { thumb: true, size: 320 }), alt: `${entry.name} preview`, title: `${entry.name} preview`, loading: "lazy", decoding: "async" }, fileId))) })) : (_jsx("div", { className: "muted small", children: "No previews yet." })), _jsxs("div", { className: "tile-meta", children: [_jsxs("span", { children: ["@", entry.username, " \u2022 LoRA"] }), _jsxs("span", { className: "tile-meta-stats", children: [_jsxs("span", { children: ["\u2665 ", entry.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", entry.comment_count ?? 0] })] })] })] }, entry.id))), !loginModelsSafe.length && !loginLorasSafe.length ? _jsx("div", { className: "muted small", children: t.publicNoModels }) : null] })] })] })] })] }), loginSelectedImage ? (_jsx("div", { className: "image-modal", children: _jsxs("div", { className: "image-modal-content", children: [_jsx("button", { className: "modal-close", onClick: () => setLoginSelectedImage(null), children: "Close" }), _jsxs("div", { className: "modal-body", children: [_jsx("div", { className: "modal-image", children: _jsx("img", { src: fileUrl(loginSelectedImage.file_id, ""), alt: `Public image by @${loginSelectedImage.username}`, title: `Public image by @${loginSelectedImage.username}` }) }), _jsxs("div", { className: "modal-info", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Public Image" }), _jsxs("span", { className: "badge", children: ["@", loginSelectedImage.username] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Prompt" }), _jsx("span", { children: loginSelectedImage.prompt ?? "" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Model" }), _jsx("span", { children: loginSelectedModelLabel || "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Sampler" }), _jsx("span", { children: loginSelectedImage.sampler ?? "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Scheduler" }), _jsx("span", { children: loginSelectedImage.scheduler ?? "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Steps" }), _jsx("span", { children: loginSelectedImage.steps ?? "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "CFG" }), _jsx("span", { children: loginSelectedImage.cfg_scale ?? "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Seed" }), _jsx("span", { children: loginSelectedImage.seed ?? "–" })] }), _jsx("div", { className: "muted small", children: "Login to like, comment, or download." })] })] })] }) })) : null, loginSelectedLora ? (_jsx("div", { className: "image-modal", children: _jsxs("div", { className: "image-modal-content", children: [_jsx("button", { className: "modal-close", onClick: () => {
                                    setLoginSelectedLora(null);
                                    setLoginSelectedLoraPreview(null);
                                }, children: "Close" }), _jsxs("div", { className: "modal-body", children: [_jsx("div", { className: "modal-image", children: _jsxs("div", { className: "lora-previews large", children: [(Array.isArray(loginSelectedLora.preview_file_ids) ? loginSelectedLora.preview_file_ids : []).map((fileId) => (_jsx("button", { className: "preview-tile", onClick: () => setLoginSelectedLoraPreview(fileId), children: _jsx("img", { src: fileUrl(fileId, "", { thumb: true, size: 512 }), alt: `${loginSelectedLora.name} preview`, title: `${loginSelectedLora.name} preview`, loading: "lazy", decoding: "async" }) }, fileId))), !Array.isArray(loginSelectedLora.preview_file_ids) || !loginSelectedLora.preview_file_ids.length ? (_jsx("div", { className: "muted small", children: "No previews yet." })) : null] }) }), _jsxs("div", { className: "modal-info", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: loginSelectedLora.name }), _jsxs("span", { className: "badge", children: ["@", loginSelectedLora.username] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Source" }), _jsx("span", { children: loginSelectedLora.source === "external" ? "External Uploaded" : "Training" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Previews" }), _jsxs("span", { children: [loginSelectedLora.preview_count ?? 0, "/11", loginSelectedLora.preview_in_flight ? " • generating..." : ""] })] }), _jsx("div", { className: "muted small", children: "Login to like, comment, or download." })] })] })] }) })) : null, loginSelectedLoraPreview ? (_jsx("div", { className: "image-modal", children: _jsxs("div", { className: "image-modal-content lightbox-content", children: [_jsxs("div", { className: "lightbox-toolbar", children: [_jsxs("span", { className: "muted small", children: [loginSelectedLora?.name ?? "Preview", " ", loginSelectedLoraPreviewIndex >= 0 ? `${loginSelectedLoraPreviewIndex + 1}/${loginSelectedLoraPreviewIds.length}` : ""] }), _jsx("button", { className: "modal-close", onClick: () => setLoginSelectedLoraPreview(null), children: "Close" })] }), _jsxs("div", { className: "modal-body lightbox-body", children: [_jsxs("div", { className: "modal-image lightbox-image-wrap", children: [loginSelectedLoraPreviewIds.length > 1 ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "lightbox-nav lightbox-nav-left", title: "Next (Arrow Left)", onClick: () => {
                                                            if (loginSelectedLoraPreviewIndex < 0)
                                                                return;
                                                            const nextIndex = (loginSelectedLoraPreviewIndex + 1) % loginSelectedLoraPreviewIds.length;
                                                            setLoginSelectedLoraPreview(loginSelectedLoraPreviewIds[nextIndex]);
                                                        }, children: "\u2190" }), _jsx("button", { className: "lightbox-nav lightbox-nav-right", title: "Previous (Arrow Right)", onClick: () => {
                                                            if (loginSelectedLoraPreviewIndex < 0)
                                                                return;
                                                            const prevIndex = (loginSelectedLoraPreviewIndex - 1 + loginSelectedLoraPreviewIds.length) %
                                                                loginSelectedLoraPreviewIds.length;
                                                            setLoginSelectedLoraPreview(loginSelectedLoraPreviewIds[prevIndex]);
                                                        }, children: "\u2192" })] })) : null, _jsx("img", { className: `lightbox-image lightbox-image-thumb ${loginSelectedLoraPreviewOriginalReady ? "is-faded" : ""}`, src: fileUrl(loginSelectedLoraPreview, "", { thumb: true, size: 1280 }), alt: `${loginSelectedLora?.name ?? "LoRA"} preview thumbnail`, title: `${loginSelectedLora?.name ?? "LoRA"} preview thumbnail` }), _jsx("img", { className: `lightbox-image lightbox-image-original ${loginSelectedLoraPreviewOriginalReady ? "is-ready" : ""}`, src: fileUrl(loginSelectedLoraPreview, ""), alt: `${loginSelectedLora?.name ?? "LoRA"} preview`, title: `${loginSelectedLora?.name ?? "LoRA"} preview`, onLoad: () => setLoginSelectedLoraPreviewOriginalReady(true), onError: () => setLoginSelectedLoraPreviewOriginalReady(false) })] }), _jsx("div", { className: "lightbox-help muted small", children: "Keys: Left = next, Right = previous, Up = close" })] })] }) })) : null, loginOpen ? (_jsx("div", { className: "auth-modal", children: _jsxs("div", { className: "auth-modal-content panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: t.signIn }), _jsx("button", { className: "modal-close", onClick: () => setLoginOpen(false), children: "Close" })] }), _jsx(LoginForm, { onLogin: (newToken) => {
                                    setToken(newToken);
                                    setAuthToken(newToken);
                                }, labels: { email: t.email, password: t.password, login: t.login } })] }) })) : null, applyOpen ? (_jsx("div", { className: "auth-modal", children: _jsxs("div", { className: "auth-modal-content panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Access request" }), _jsx("button", { className: "modal-close", onClick: () => setApplyOpen(false), children: "Close" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { className: "form-row", children: ["Display name", _jsx("input", { className: "input", value: applyForm.display_name, onChange: (e) => setApplyForm({ ...applyForm, display_name: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Email", _jsx("input", { className: "input", type: "email", value: applyForm.email, onChange: (e) => setApplyForm({ ...applyForm, email: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Username", _jsx("input", { className: "input", value: applyForm.handle, onChange: (e) => setApplyForm({ ...applyForm, handle: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Links", _jsx("input", { className: "input", placeholder: "Portfolio, socials, etc.", value: applyForm.links, onChange: (e) => setApplyForm({ ...applyForm, links: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Motivation", _jsx("textarea", { className: "input", rows: 4, value: applyForm.message, onChange: (e) => setApplyForm({ ...applyForm, message: e.target.value }) })] }), _jsxs("div", { className: "login-actions", children: [_jsx("button", { className: "action-btn", disabled: applySubmitting, onClick: submitApplication, children: applySubmitting ? "Submitting..." : "Submit request" }), applyStatus ? _jsx("div", { className: "muted small", children: applyStatus }) : null] })] })] }) })) : null] }));
    }
    const userPermissions = user?.permissions ?? {};
    const canGenerate = userPermissions["generate.create"] !== false;
    const canTrain = userPermissions["train.run"] !== false;
    const canUploadLora = isAdmin || userPermissions["lora.upload"] === true;
    const openProfile = (userId) => {
        if (!token || !userId)
            return;
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
        if (!token || !profileView?.id || !profileRelationship || profileRelationship.is_self || profileFollowBusy)
            return;
        setProfileFollowBusy(true);
        const method = profileRelationship.is_following ? "DELETE" : "POST";
        fetch(`/api/users/${profileView.id}/follow`, {
            method,
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => res.json())
            .then((data) => {
            if (data?.error)
                return;
            const nextFollowing = !profileRelationship.is_following;
            setProfileRelationship({ ...profileRelationship, is_following: nextFollowing });
            setProfileStats((prev) => prev
                ? {
                    ...prev,
                    followers: Math.max(0, Number(prev.followers ?? 0) + (nextFollowing ? 1 : -1))
                }
                : prev);
        })
            .finally(() => setProfileFollowBusy(false));
    };
    const updateNotificationPref = (key, enabled) => {
        if (!token)
            return;
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
            if (data?.error)
                return;
            setNotificationPrefs((prev) => ({ ...prev, [key]: enabled }));
        })
            .finally(() => setNotificationSaving((prev) => ({ ...prev, [key]: false })));
    };
    const refreshTwoFaStatus = () => {
        if (!token)
            return;
        fetch("/api/auth/2fa/status", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => setTwoFaStatus({ ...DEFAULT_2FA_STATUS, ...(data ?? {}) }))
            .catch(() => setTwoFaStatus(DEFAULT_2FA_STATUS));
    };
    const startSecurityOnboarding = () => {
        if (!token)
            return;
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
        if (!token)
            return;
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
        if (!token)
            return;
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
    const markNotificationRead = (id) => {
        if (!token)
            return;
        fetch(`/api/notifications/${id}/read`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => {
            const shouldDecrement = notificationList.some((entry) => entry.id === id && !entry.read_at);
            const now = new Date().toISOString();
            setNotificationList((prev) => prev.map((entry) => (entry.id === id ? { ...entry, read_at: entry.read_at ?? now } : entry)));
            if (shouldDecrement) {
                setNotificationUnread((prev) => Math.max(0, prev - 1));
            }
        })
            .catch(() => null);
    };
    const markAllNotificationsRead = () => {
        if (!token)
            return;
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
    const canManageGalleryImage = (img) => {
        if (!img?.user_id || !user)
            return false;
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
    const toggleGalleryBulkSelection = (imageId) => {
        setGalleryBulkSelection((prev) => prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]);
    };
    const runGalleryBulkAction = (action) => {
        if (!token || galleryBulkBusy || galleryBulkSelection.length === 0)
            return;
        const selectedIds = [...galleryBulkSelection];
        const headers = {
            Authorization: `Bearer ${token}`
        };
        setGalleryBulkBusy(true);
        setGalleryBulkMessage("");
        Promise.allSettled(selectedIds.map((id) => {
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
        }))
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
    const openGalleryImage = (imageId) => {
        if (!token)
            return;
        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`/api/gallery/images/${imageId}`, { headers }).then((res) => res.json()),
            fetch(`/api/gallery/images/${imageId}/comments`, { headers }).then((res) => res.json())
        ])
            .then(([detail, comments]) => {
            if (detail?.error)
                return;
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
    const openGalleryModel = (modelId) => {
        if (!token)
            return;
        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`/api/gallery/models/${modelId}`, { headers }).then((res) => res.json()),
            fetch(`/api/gallery/models/${modelId}/comments`, { headers }).then((res) => res.json())
        ])
            .then(([detail, comments]) => {
            if (detail?.error)
                return;
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
    const openLoraEntry = (entry) => {
        setSelectedLoraEntry(entry);
        setLoraDescriptionDraft(entry.description ?? "");
        setLoraDescriptionEditing(false);
        setLoraDescriptionStatus("");
        if (!token)
            return;
        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`/api/loras/${entry.id}`, { headers }).then((res) => res.json()),
            fetch(`/api/loras/${entry.id}/comments`, { headers }).then((res) => res.json())
        ])
            .then(([detail, comments]) => {
            setSelectedLoraEntry({ ...entry, ...(detail.lora ?? {}) });
            setLoraDescriptionDraft(detail?.lora?.description ?? entry.description ?? "");
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
    return (_jsxs("div", { className: `app-shell ${isMobileRouteActive ? "mobile-route" : ""}`, children: [isMobileRouteActive ? (_jsxs(_Fragment, { children: [_jsxs("header", { className: "mobile-topbar", children: [_jsxs("div", { className: "mobile-topbar-brand", children: [_jsx("div", { className: "brand-title", children: "FrameWorkX" }), _jsx("div", { className: "brand-subtitle", children: "Mobile Console" })] }), _jsxs("div", { className: "mobile-topbar-actions", children: [_jsxs("button", { className: "action-btn ghost mobile-notify-btn", onClick: () => setNotificationWidgetOpen((prev) => !prev), children: ["\uD83D\uDD14", notificationUnread > 0 ? _jsx("span", { className: "notify-count", children: notificationUnread }) : null] }), _jsx("button", { className: "action-btn mobile-menu-btn", onClick: () => setMobileMenuOpen(true), children: "\u2630" })] })] }), notificationWidgetOpen ? (_jsxs("div", { className: "mobile-notify-panel", children: [_jsxs("div", { className: "notify-popout-head", children: [_jsx("span", { children: "Notifications" }), _jsx("button", { className: "action-btn ghost", onClick: () => markAllNotificationsRead(), children: "Read all" })] }), _jsx("div", { className: "notify-popout-list", children: notificationList.length === 0 ? (_jsx("div", { className: "muted small", children: "No notifications." })) : ([...notificationList]
                                    .sort((a, b) => {
                                    const scoreA = a.read_at ? 1 : 0;
                                    const scoreB = b.read_at ? 1 : 0;
                                    if (scoreA !== scoreB)
                                        return scoreA - scoreB;
                                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                                })
                                    .slice(0, 8)
                                    .map((item) => (_jsxs("button", { className: `notify-item ${item.read_at ? "is-read" : "is-unread"}`, onClick: () => {
                                        if (!item.read_at)
                                            markNotificationRead(item.id);
                                    }, children: [_jsx("span", { className: "notify-item-title", children: item.title }), _jsx("span", { className: "notify-item-body", children: item.body ?? "" })] }, `mobile-notify-${item.id}`)))) })] })) : null, _jsx("div", { className: `mobile-drawer-backdrop ${mobileMenuOpen ? "is-open" : ""}`, onClick: () => setMobileMenuOpen(false) }), _jsxs("aside", { className: `mobile-drawer ${mobileMenuOpen ? "is-open" : ""}`, children: [_jsxs("div", { className: "mobile-drawer-head", children: [_jsxs("div", { children: [_jsx("div", { className: "brand-title", children: "Navigation" }), _jsxs("div", { className: "muted small", children: ["@", user?.username ?? "user"] })] }), _jsx("button", { className: "action-btn ghost", onClick: () => setMobileMenuOpen(false), children: "Close" })] }), _jsxs("div", { className: "mobile-drawer-status", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Queue" }), _jsx("span", { children: activeQueueItems.length })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Jobs" }), _jsx("span", { children: activeJobs.length })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Credits" }), _jsx("span", { children: user?.credits_balance ?? 0 })] })] }), _jsxs("nav", { className: "mobile-drawer-nav", children: [nav.map((key) => {
                                        const locked = (key === "generator" && !canGenerate) || (key === "pipeline" && !canTrain);
                                        return (_jsx("button", { className: `mobile-nav-btn ${view === key ? "is-active" : ""}`, disabled: locked, onClick: () => setView(key), children: t[key] }, `mobile-${key}`));
                                    }), isAdmin ? (_jsx("button", { className: `mobile-nav-btn ${view === "admin" ? "is-active" : ""}`, onClick: () => {
                                            setView("admin");
                                            setAdminTab("queue");
                                        }, children: "Admin Settings" })) : null] }), _jsx("div", { className: "mobile-drawer-foot", children: _jsxs("div", { className: "lang-switch", children: [_jsx("button", { onClick: () => setLang("en"), children: "EN" }), _jsx("button", { onClick: () => setLang("de"), children: "DE" })] }) })] })] })) : null, _jsxs("aside", { className: "rail", children: [_jsxs("div", { className: "brand", children: [_jsx("div", { className: "logo", children: "FX" }), _jsx("div", { className: "brand-title", children: "FrameWorkX" }), _jsx("div", { className: "brand-subtitle", children: "Mjolnir Console" })] }), _jsx("nav", { className: "rail-nav", children: nav.map((key) => {
                            const locked = (key === "generator" && !canGenerate) || (key === "pipeline" && !canTrain);
                            return (_jsx("button", { className: `rail-btn ${view === key ? "is-active" : ""} ${locked ? "is-disabled" : ""}`, onClick: () => {
                                    if (locked)
                                        return;
                                    setView(key);
                                }, children: t[key] }, key));
                        }) }), _jsxs("div", { className: "rail-status", children: [_jsx("div", { className: "rail-status-title", children: "Live" }), _jsxs("div", { className: "rail-status-grid", children: [_jsxs("div", { className: "rail-stat", children: [_jsxs("div", { className: "label", children: [_jsx("span", { className: "status-dot" }), "Queue"] }), _jsx("div", { className: "value", children: activeQueueItems.length })] }), _jsxs("div", { className: "rail-stat", children: [_jsx("div", { className: "label", children: "Jobs" }), _jsx("div", { className: "value", children: activeJobs.length })] }), _jsxs("div", { className: "rail-stat", children: [_jsx("div", { className: "label", children: "Trainer" }), _jsx("div", { className: "value", children: activePipelineRuns.length })] }), _jsxs("div", { className: "rail-stat", children: [_jsx("div", { className: "label", children: "Training" }), _jsx("div", { className: "value", children: activeTrainingRuns.length })] })] }), _jsx("div", { className: "rail-divider" }), _jsx("div", { className: "rail-status-title", children: "Credits" }), _jsxs("div", { className: "rail-status-grid", children: [_jsxs("div", { className: "rail-stat", children: [_jsx("div", { className: "label", children: "Available" }), _jsx("div", { className: "value credit-available", children: user?.credits_balance ?? 0 })] }), _jsxs("div", { className: "rail-stat", children: [_jsx("div", { className: "label", children: "Reserved" }), _jsx("div", { className: "value credit-reserved", children: user?.credits_reserved ?? 0 })] }), _jsxs("div", { className: "rail-stat", children: [_jsx("div", { className: "label", children: "Daily grant" }), _jsx("div", { className: "value credit-daily", children: user?.credits_daily_allowance ?? 0 })] })] })] })] }), _jsxs("div", { className: "main", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { children: [_jsx("div", { className: "brand-title", children: "FrameWorkX" }), _jsx("div", { className: "brand-subtitle", children: "Unified pipeline control" })] }), _jsxs("div", { className: "top-actions", children: [isAdmin ? (_jsx("button", { className: "action-btn", onClick: () => {
                                            setView("admin");
                                            setAdminTab("queue");
                                        }, children: "Admin Settings" })) : null, _jsxs("div", { className: "notify-widget", children: [_jsxs("button", { className: `action-btn ghost notify-btn ${notificationWidgetOpen ? "is-active" : ""} ${notificationPulse ? "is-pulse" : ""}`, onClick: () => {
                                                    setNotificationWidgetOpen((prev) => !prev);
                                                    setNotificationPulse(false);
                                                }, children: [_jsx("span", { children: "Notifications" }), notificationUnread > 0 ? _jsx("span", { className: "notify-count", children: notificationUnread }) : null] }), notificationWidgetOpen ? (_jsxs("div", { className: "notify-popout", children: [_jsxs("div", { className: "notify-popout-head", children: [_jsx("span", { children: "Notifications" }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                    markAllNotificationsRead();
                                                                }, children: "Read all" })] }), _jsx("div", { className: "notify-popout-list", children: notificationList.length === 0 ? (_jsx("div", { className: "muted small", children: "No notifications." })) : ([...notificationList]
                                                            .sort((a, b) => {
                                                            const scoreA = a.read_at ? 1 : 0;
                                                            const scoreB = b.read_at ? 1 : 0;
                                                            if (scoreA !== scoreB)
                                                                return scoreA - scoreB;
                                                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                                                        })
                                                            .slice(0, 8)
                                                            .map((item) => (_jsxs("button", { className: `notify-item ${item.read_at ? "is-read" : "is-unread"}`, onClick: () => {
                                                                if (!item.read_at)
                                                                    markNotificationRead(item.id);
                                                            }, children: [_jsx("span", { className: "notify-item-title", children: item.title }), _jsx("span", { className: "notify-item-body", children: item.body ?? "" })] }, item.id)))) }), _jsx("div", { className: "notify-popout-foot", children: _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                setView("settings");
                                                                setNotificationWidgetOpen(false);
                                                            }, children: "Open Notification Center" }) })] })) : null] }), _jsxs("div", { className: "lang-switch", children: [_jsx("button", { onClick: () => setLang("en"), children: "EN" }), _jsx("button", { onClick: () => setLang("de"), children: "DE" })] })] })] }), _jsxs("main", { className: "content", children: [_jsxs("section", { className: `view ${view === "dashboard" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: t.commandDeck }), _jsx("p", { children: t.queue })] }), isMobileRouteActive ? (_jsxs("div", { className: "mobile-command-deck", children: [_jsxs("div", { className: "mobile-command-stats", children: [_jsxs("div", { className: "mobile-stat-card", children: [_jsx("span", { children: "Running" }), _jsx("strong", { children: mobileDashboardJobs.filter((row) => row.status === "running").length })] }), _jsxs("div", { className: "mobile-stat-card", children: [_jsx("span", { children: "Queued" }), _jsx("strong", { children: mobileDashboardJobs.filter((row) => ["queued", "queued_initiated", "ready_to_train", "manual_tagging"].includes(row.status)).length })] }), _jsxs("div", { className: "mobile-stat-card", children: [_jsx("span", { children: "Failed" }), _jsx("strong", { children: mobileDashboardJobs.filter((row) => row.status === "failed").length })] }), _jsxs("div", { className: "mobile-stat-card", children: [_jsx("span", { children: "Train" }), _jsx("strong", { children: dashboardTraining.filter((run) => run.status === "running").length })] })] }), _jsxs("div", { className: "mobile-job-list", children: [mobileDashboardJobs.length === 0 ? (_jsx("div", { className: "muted small", children: "No jobs." })) : (mobileDashboardJobs.map((row) => (_jsxs("button", { className: `mobile-job-card is-${row.status}`, onClick: () => openDashboardModal(row.kind, row.id, row.phase), children: [_jsxs("div", { className: "mobile-job-top", children: [_jsx("div", { className: "mobile-job-title", children: row.name }), _jsx("span", { className: "badge", children: row.status })] }), _jsx("div", { className: "mobile-job-id", children: row.id }), row.progressPct != null ? (_jsx("div", { className: "progress", children: _jsx("span", { style: { width: `${row.progressPct}%` } }) })) : null, _jsx("div", { className: "mobile-job-meta", children: row.meta.join(" • ") || row.phase })] }, `mobile-job-${row.kind}-${row.id}`)))), mobileCompletedJobsCount > 0 ? (_jsx("button", { className: "action-btn ghost mobile-show-completed-btn", onClick: () => setMobileShowCompletedJobs((prev) => !prev), children: mobileShowCompletedJobs
                                                            ? "Hide completed jobs"
                                                            : `Show completed jobs (${mobileCompletedJobsCount})` })) : null] })] })) : null, _jsxs("div", { className: "dashboard-grid", children: [_jsxs("section", { className: "panel task-column", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Tasks" }), _jsx("span", { className: "badge", children: "Queue" })] }), _jsxs("div", { className: "task-group", children: [_jsxs("div", { className: "mini-header", children: [_jsx("span", { children: "Active training" }), _jsx("span", { className: "badge", children: "Live" })] }), dashboardTraining.filter((run) => run.status === "running").length === 0 ? (_jsx("div", { className: "muted small", children: "No active training." })) : (dashboardTraining
                                                                .filter((run) => run.status === "running")
                                                                .map((run) => (_jsxs("button", { className: "task-row active-row", onClick: () => openDashboardModal("training", run.id, "train"), children: [_jsx("span", { children: run.name ?? run.id }), _jsx("span", { children: run.status })] }, run.id))))] }), _jsxs("div", { className: "task-group", children: [_jsxs("div", { className: "mini-header", children: [_jsx("span", { children: "Queue" }), _jsx("span", { className: "badge", children: "Pipeline" })] }), dashboardQueueMsg ? _jsx("div", { className: "muted small", children: dashboardQueueMsg }) : null, dashboardQueue.length === 0 ? (_jsx("div", { className: "muted small", children: "Queue empty." })) : (dashboardQueue.map((item) => (_jsxs("div", { className: "task-row-wrap", children: [_jsxs("button", { className: "task-row", onClick: () => item.item_type === "training"
                                                                            ? openDashboardModal("training", item.id, "train_pre")
                                                                            : openDashboardModal("pipeline", item.id, "prep"), children: [_jsx("span", { children: item.name }), _jsx("span", { children: item.item_type === "training"
                                                                                    ? `training • ${item.status}`
                                                                                    : item.position != null
                                                                                        ? `#${item.position}`
                                                                                        : item.status })] }), reorderableDashboardQueueIds.has(item.id) ? (_jsxs("div", { className: "task-row-controls", children: [_jsx("button", { className: "action-btn ghost", disabled: dashboardQueueMovePending === item.id, onClick: () => reorderDashboardQueueItem(item, "up"), children: "Up" }), _jsx("button", { className: "action-btn ghost", disabled: dashboardQueueMovePending === item.id, onClick: () => reorderDashboardQueueItem(item, "down"), children: "Down" })] })) : null] }, `${item.item_type ?? "pipeline"}-${item.id}-${item.position ?? "na"}`))))] })] }), _jsxs("section", { className: "panel phase-column", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Prep-Phase" }), _jsx("span", { className: "badge", children: "Dataset" })] }), prepPhaseRuns.length === 0 ? (_jsx("div", { className: "muted small", children: "No jobs." })) : (prepPhaseRuns.map((run) => (_jsxs("button", { className: `phase-card ${run.status === "running" ? "active-row" : ""}`, onClick: () => openDashboardModal("pipeline", run.id, "prep"), children: [_jsx("div", { className: "title", children: run.name }), _jsxs("div", { className: "meta", children: [_jsx("span", { children: run.status }), _jsxs("span", { children: [run.image_count ?? 0, " imgs"] })] })] }, run.id))))] }), _jsxs("section", { className: "panel phase-column", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Train-Pre-Phase" }), _jsx("span", { className: "badge", children: "Plan" })] }), trainPrePhaseRuns.length === 0 ? (_jsx("div", { className: "muted small", children: "No jobs." })) : (trainPrePhaseRuns.map((run) => (_jsxs("button", { className: `phase-card ${run.status === "running" ? "active-row" : ""}`, onClick: () => openDashboardModal(run.pipeline_run_id ? "training" : "pipeline", run.id, "train_pre"), children: [_jsx("div", { className: "title", children: run.name ?? run.id }), _jsxs("div", { className: "meta", children: [_jsx("span", { children: run.status }), _jsxs("span", { children: [run.image_count ?? 0, " imgs"] })] })] }, run.id))))] }), _jsxs("section", { className: "panel phase-column", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Train-Phase" }), _jsx("span", { className: "badge", children: "GPU" })] }), trainPhaseRuns.length === 0 ? (_jsx("div", { className: "muted small", children: "No jobs." })) : (trainPhaseRuns.map((run) => (_jsxs("button", { className: `phase-card ${run.status === "running" ? "active-row" : ""}`, onClick: () => openDashboardModal("training", run.id, "train"), children: [_jsx("div", { className: "title", children: run.name ?? run.id }), _jsxs("div", { className: "meta", children: [_jsx("span", { children: run.status }), _jsxs("span", { children: [run.image_count ?? 0, " imgs"] })] })] }, run.id))))] }), _jsxs("section", { className: "panel phase-column", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Finishing-Phase" }), _jsx("span", { className: "badge", children: "Wrap" })] }), finishingPhaseRuns.length === 0 ? (_jsx("div", { className: "muted small", children: "No jobs." })) : (finishingPhaseRuns.map((run) => (_jsxs("button", { className: `phase-card ${run.status === "running" ? "active-row" : ""}`, onClick: () => openDashboardModal("training", run.id, "finishing"), children: [_jsx("div", { className: "title", children: run.name ?? run.id }), _jsxs("div", { className: "meta", children: [_jsx("span", { children: run.status }), _jsxs("span", { children: [run.image_count ?? 0, " imgs"] })] })] }, run.id))))] })] }), dashboardModalOpen ? (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "dashboard-modal", children: [_jsxs("div", { className: "manual-header", children: [_jsxs("div", { children: [_jsx("div", { className: "title", children: "Job Details" }), _jsx("div", { className: "muted small", children: dashboardModalData?.name ?? dashboardModalData?.id }), _jsx("div", { className: "muted small", children: dashboardModalData?.id }), dashboardModalLastUpdated ? (_jsxs("div", { className: "muted small", children: ["Live update: ", new Date(dashboardModalLastUpdated).toLocaleTimeString()] })) : null] }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                setDashboardModalOpen(false);
                                                                setDashboardModalId(null);
                                                                setDashboardPreviewLightbox(null);
                                                            }, children: "Close" })] }), _jsxs("div", { className: "manual-body", children: [_jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Status" }), _jsxs("div", { className: "job-status-layout with-cover", children: [_jsx("button", { className: "job-cover-frame", onClick: () => {
                                                                                if (dashboardDatasetCoverFileId) {
                                                                                    setDashboardPreviewLightbox(dashboardDatasetCoverFileId);
                                                                                    return;
                                                                                }
                                                                                if (dashboardDatasetCoverUrl) {
                                                                                    setDashboardPreviewLightbox(dashboardDatasetCoverUrl);
                                                                                }
                                                                            }, disabled: !dashboardDatasetCoverFileId && !dashboardDatasetCoverUrl, title: "Open dataset image", children: dashboardDatasetCoverFileId || dashboardDatasetCoverUrl ? (_jsx("img", { src: dashboardDatasetCoverFileId
                                                                                    ? fileUrl(dashboardDatasetCoverFileId, token, { thumb: true, size: 384 })
                                                                                    : withToken(String(dashboardDatasetCoverUrl ?? ""), token), alt: "Dataset cover", loading: "lazy", decoding: "async" })) : (_jsx("div", { className: "job-cover-empty", children: "No dataset image" })) }), _jsxs("div", { className: "job-status-table", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Phase" }), _jsx("span", { children: dashboardModalPhase })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "State" }), _jsx("span", { children: resolveDashboardModalStatus() })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Images" }), _jsx("span", { children: dashboardModalImageCount ?? 0 })] }), dashboardModalKind === "training" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Progress" }), _jsx("span", { children: dashboardModalData?.progress_pct != null ? `${dashboardModalData.progress_pct}%` : "-" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Epoch" }), _jsxs("span", { children: [dashboardModalData?.epoch ?? "-", " / ", dashboardModalData?.epoch_total ?? "-"] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Step" }), _jsxs("span", { children: [dashboardModalData?.step ?? "-", " / ", dashboardModalData?.step_total ?? "-"] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "ETA" }), _jsx("span", { children: formatEta(dashboardModalData?.eta_seconds) })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Last loss" }), _jsx("span", { children: dashboardModalData?.last_loss != null
                                                                                                        ? Number(dashboardModalData.last_loss).toFixed(4)
                                                                                                        : "-" })] })] })) : null, _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Actions" }), _jsx("span", { className: "job-actions", children: dashboardModalKind === "pipeline" ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "action-btn ghost", disabled: dashboardModalData?.status === "running", onClick: () => {
                                                                                                            if (dashboardModalData?.id)
                                                                                                                cancelPipelineRun(dashboardModalData.id);
                                                                                                        }, children: "Stop" }), _jsx("button", { className: "action-btn", disabled: !["failed", "cancelled", "stopped"].includes(String(dashboardModalData?.status ?? "")), onClick: () => {
                                                                                                            if (dashboardModalData?.id)
                                                                                                                retryPipelineRun(dashboardModalData.id);
                                                                                                        }, children: "Retry" }), _jsx("button", { className: "action-btn danger", disabled: dashboardModalData?.status === "running", onClick: () => {
                                                                                                            if (dashboardModalData?.id)
                                                                                                                deletePipelineRun(dashboardModalData.id);
                                                                                                        }, children: "Delete" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { className: "action-btn ghost", disabled: ["running", "removing"].includes(String(dashboardModalData?.status ?? "")), onClick: () => {
                                                                                                            if (dashboardModalData?.id)
                                                                                                                cancelTrainingRun(dashboardModalData.id);
                                                                                                        }, children: "Stop" }), _jsx("button", { className: "action-btn", disabled: !["failed", "cancelled", "stopped", "completed", "remove_failed"].includes(String(dashboardModalData?.status ?? "")), onClick: () => {
                                                                                                            if (dashboardModalData?.id)
                                                                                                                retryTrainingRun(dashboardModalData.id);
                                                                                                        }, children: "Retry" }), _jsx("button", { className: "action-btn danger", disabled: ["running", "removing"].includes(String(dashboardModalData?.status ?? "")), onClick: () => {
                                                                                                            if (dashboardModalData?.id)
                                                                                                                deleteTrainingRun(dashboardModalData.id);
                                                                                                        }, children: "Delete" })] })) })] }), (dashboardModalData?.error_message || dashboardModalEvents.length > 0) ? (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Error log" }), _jsx("button", { className: "info-btn", onClick: () => setDashboardErrorOpen(true), title: "Show error log", children: "I" })] })) : null, dashboardModalKind === "pipeline" && dashboardModalData?.status === "manual_tagging" ? (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Manual tagging" }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                                                setDashboardModalOpen(false);
                                                                                                openManualEditor(dashboardModalData.id, dashboardModalData.name ?? dashboardModalData.id);
                                                                                            }, children: "Continue" })] })) : null] })] })] }), _jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Phase Steps" }), dashboardModalSteps.length === 0 ? (_jsx("div", { className: "muted small", children: "No steps yet." })) : (dashboardModalSteps.map((step) => (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: step.step }), _jsx("span", { children: step.status })] }, step.step))))] }), _jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Previews" }), dashboardModalPreviews.length === 0 && dashboardTrainingPreviewGroups.length === 0 ? (_jsx("div", { className: "muted small", children: "No previews yet." })) : (_jsxs("div", { className: "preview-sections", children: [dashboardTrainingPreviewGroups.map((group) => (_jsxs("div", { className: "preview-section", children: [_jsx("div", { className: "muted small", children: group.label }), _jsx("div", { className: "preview-grid", children: group.items.map((row) => (_jsx("button", { className: "preview-tile", onClick: () => setDashboardPreviewLightbox(row.file_id), children: _jsx("img", { className: "preview-thumb", src: fileUrl(row.file_id, token, { thumb: true, size: 384 }), alt: "Job preview", loading: "lazy", decoding: "async" }) }, row.file_id))) })] }, group.key))), dashboardModalPreviews.length > 0 ? (_jsxs("div", { className: "preview-section", children: [_jsx("div", { className: "muted small", children: "Pipeline Previews" }), _jsx("div", { className: "preview-grid", children: Array.from(new Set(dashboardModalPreviews)).map((fileId) => (_jsx("button", { className: "preview-tile", onClick: () => setDashboardPreviewLightbox(fileId), children: _jsx("img", { className: "preview-thumb", src: fileUrl(fileId, token, { thumb: true, size: 384 }), alt: "Job preview", loading: "lazy", decoding: "async" }) }, fileId))) })] })) : null] }))] })] })] }) })) : null, dashboardPreviewLightbox ? (_jsx("div", { className: "image-modal", children: _jsxs("div", { className: "image-modal-content", children: [_jsx("button", { className: "modal-close", onClick: () => setDashboardPreviewLightbox(null), children: "Close" }), _jsx("div", { className: "modal-body", children: _jsx("div", { className: "modal-image", children: _jsx("img", { src: dashboardPreviewLightbox.startsWith("/api/")
                                                                ? withToken(dashboardPreviewLightbox, token)
                                                                : fileUrl(dashboardPreviewLightbox, token), alt: "Job preview" }) }) })] }) })) : null, dashboardErrorOpen ? (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "dashboard-modal error-modal", children: [_jsxs("div", { className: "manual-header", children: [_jsxs("div", { children: [_jsx("div", { className: "title", children: "Error Log" }), _jsx("div", { className: "muted small", children: dashboardModalData?.name ?? dashboardModalId })] }), _jsx("button", { className: "action-btn ghost", onClick: () => setDashboardErrorOpen(false), children: "Close" })] }), _jsxs("div", { className: "manual-body", children: [dashboardModalData?.error_message ? (_jsxs("div", { className: "panel error-panel", children: [_jsx("div", { className: "panel-header", children: _jsx("h3", { children: "Latest Error" }) }), _jsx("div", { className: "muted small", children: dashboardModalData.error_message })] })) : null, _jsxs("div", { className: "panel error-panel", children: [_jsx("div", { className: "panel-header", children: _jsx("h3", { children: "Events" }) }), dashboardModalEvents.length === 0 ? (_jsx("div", { className: "muted small", children: "No error events recorded." })) : (_jsx("div", { className: "error-list", children: dashboardModalEvents.map((evt, idx) => (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: evt.level ?? "info" }), _jsx("span", { children: evt.message ?? "-" })] }, `${evt.created_at}-${idx}`))) }))] })] })] }) })) : null] }), _jsxs("section", { className: `view ${view === "pipeline" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: t.pipeline }), _jsx("p", { children: "Upload management & pipeline queue" })] }), !canTrain ? (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Training locked" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsx("div", { className: "muted small", children: "Training access is disabled for this account." })] })) : (_jsx("div", { className: "wizard-launch", children: _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Training Wizard" }), _jsx("span", { className: "badge", children: "Required" })] }), _jsxs("div", { className: "form-grid", children: [_jsx("div", { className: "muted small", children: "Start training via the wizard. It validates triggers, previews credits, and walks you through all required steps." }), _jsx("button", { className: "action-btn", onClick: openTrainerWizard, children: "Start Training Wizard" })] })] }) }))] }), _jsxs("section", { className: `view ${view === "generator" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: t.generator }), _jsx("p", { children: t.previewOutput })] }), !canGenerate ? (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Generator locked" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsx("div", { className: "muted small", children: "Generator access is disabled for this account." })] })) : (_jsxs("div", { className: "grid generator-grid", children: [_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Prompt" }), _jsx("span", { className: "badge", children: "MJOLNIR" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { className: "form-row", children: ["Prompt", _jsx("textarea", { className: "input", rows: 4, value: prompt, onChange: (e) => setPrompt(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Negative", _jsx("textarea", { className: "input", rows: 3, value: negativePrompt, onChange: (e) => setNegativePrompt(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Base Model", _jsxs("select", { className: "input", value: modelId, onChange: (e) => {
                                                                            setModelId(e.target.value);
                                                                            setLastModelId(e.target.value);
                                                                        }, children: [_jsx("option", { value: "", children: "Select model" }), modelRegistry
                                                                                .filter((model) => model.kind === "training_model" || model.kind === "base_model")
                                                                                .map((model) => (_jsx("option", { value: model.file_id ?? "", children: model.name }, model.id)))] })] }), selectedLoraId ? (_jsxs("div", { className: "form-grid", children: [_jsx("div", { className: "form-row", children: "LoRA" }), _jsxs("div", { className: "lora-row", children: [_jsx("input", { className: "input", value: selectedLoraName || "Selected LoRA", readOnly: true }), _jsx("input", { className: "input", type: "number", step: "0.05", min: "0.1", max: "1", value: selectedLoraWeight, onChange: (event) => setSelectedLoraWeight(Number(event.target.value)) })] }), _jsx("button", { className: "action-btn ghost", onClick: () => setSelectedLoraId(""), children: "Clear LoRA" })] })) : null, _jsx("button", { className: "action-btn", onClick: () => {
                                                                    if (!prompt)
                                                                        return;
                                                                    if (wildcardPreview.missing.length) {
                                                                        setGenerateMessage(`Missing wildcard list: ${wildcardPreview.missing.join(", ")}`);
                                                                        return;
                                                                    }
                                                                    setGenerateMessage("Submitting...");
                                                                    const { width, height } = parseRatio(ratio);
                                                                    const parsedSeed = Number(seed);
                                                                    const loraFiles = selectedLoraId ? [selectedLoraId] : [];
                                                                    const resolvedBatchCount = wildcardPreview.variants.length > 0 ? wildcardPreview.variants.length : Number(batchCount || 1);
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
                                                                            }
                                                                            else {
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
                                                                                if (prev.some((job) => job.id === data.job_id))
                                                                                    return prev;
                                                                                return [{ id: data.job_id, status: "queued", prompt, error_message: undefined }, ...prev];
                                                                            });
                                                                        }
                                                                        setPrompt("");
                                                                        setNegativePrompt("");
                                                                    })
                                                                        .catch(() => setGenerateMessage("Generate failed"));
                                                                }, children: "Generate" }), generateMessage ? _jsx("div", { className: "muted small", children: generateMessage }) : null, activeGenerationId ? (_jsxs("div", { className: "mini-list", children: [_jsx("div", { className: "muted small", children: "Active job" }), _jsx("div", { className: "progress", children: _jsx("span", { style: { width: `${activeGenerationProgress ?? 0}%` } }) }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: activeGenerationId.slice(0, 8) }), _jsxs("span", { children: [activeGenerationProgress ?? 0, "%", activeGenerationEta ? ` • ETA ${activeGenerationEta}s` : ""] })] }), _jsx("div", { className: "run-actions", children: _jsx("button", { className: "action-btn ghost", onClick: () => cancelGenerationJob(activeGenerationId), children: "Stop job" }) })] })) : null, _jsxs("div", { className: "mini-list", children: [_jsxs("div", { className: "mini-header", children: [_jsx("span", { className: "muted small", children: "Recent jobs" }), _jsx("button", { className: "action-btn ghost", onClick: clearGenerationHistory, children: "Clear history" })] }), jobs.slice(0, 5).map((job) => (_jsxs("div", { className: `stat-row ${job.status === "failed" ? "is-failed" : ""}`, children: [_jsx("span", { children: job.prompt?.slice(0, 28) ?? job.id }), _jsxs("span", { className: "job-status", children: [job.status, job.error_message ? (_jsxs("span", { className: "info-chip", "aria-label": "Show error", children: ["i", _jsx("span", { className: "info-pop", children: job.error_message })] })) : null] }), _jsxs("span", { className: "job-actions", children: [job.status === "queued" ? (_jsx("button", { className: "action-btn ghost", onClick: () => cancelGenerationJob(job.id), children: "Stop" })) : null, _jsx("button", { className: "action-btn danger", onClick: () => deleteGenerationJob(job.id), children: "Delete" })] })] }, job.id))), !jobs.length ? _jsx("div", { className: "muted small", children: "No jobs yet." }) : null] })] })] }), _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: t.styles }), _jsx("span", { className: "badge", children: "Presets" })] }), styleOptions.length === 0 ? (_jsx("div", { className: "muted small", children: "No styles configured." })) : (_jsx("div", { className: "style-grid", children: styleOptions.map((style) => {
                                                            const active = selectedStyles.includes(style.id);
                                                            return (_jsxs("button", { className: `style-chip ${active ? "is-active" : ""}`, onClick: () => setSelectedStyles((prev) => prev.includes(style.id) ? prev.filter((id) => id !== style.id) : [...prev, style.id]), children: [_jsx("span", { className: "style-name", children: style.name }), _jsx("span", { className: "style-desc", children: style.description })] }, style.id));
                                                        }) })), selectedStyles.length > 0 ? (_jsx("button", { className: "action-btn ghost", onClick: () => setSelectedStyles([]), children: "Clear styles" })) : null] }), _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Settings" }), _jsx("span", { className: "badge", children: "Render" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { className: "form-row", children: ["Aspect Ratio", _jsx("select", { className: "input", value: ratio, onChange: (e) => setRatio(e.target.value), children: RATIO_OPTIONS.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })] }), _jsxs("label", { className: "form-row", children: ["Steps", _jsx("input", { className: "input", value: steps, onChange: (e) => setSteps(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Batch Count", _jsx("input", { className: "input", value: batchCount, onChange: (e) => setBatchCount(e.target.value) })] }), _jsxs("label", { className: "form-row form-check", children: [_jsx("span", { children: "Public" }), _jsx("input", { type: "checkbox", checked: isPublic, onChange: (e) => setIsPublic(e.target.checked) })] }), _jsx("button", { className: "action-btn ghost", onClick: () => setGeneratorAdvancedOpen((prev) => !prev), children: generatorAdvancedOpen ? "Hide advanced" : "Show advanced" }), generatorAdvancedOpen ? (_jsxs("div", { className: "generator-advanced", children: [_jsxs("label", { className: "form-row", children: ["CFG Scale", _jsx("input", { className: "input", value: cfgScale, onChange: (e) => setCfgScale(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Seed (-0 = random)", _jsx("input", { className: "input", value: seed, onChange: (e) => setSeed(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Sampler", _jsx("select", { className: "input", value: sampler, onChange: (e) => setSampler(e.target.value), children: samplerOptions.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })] }), _jsxs("label", { className: "form-row", children: ["Scheduler", _jsx("select", { className: "input", value: scheduler, onChange: (e) => setScheduler(e.target.value), children: schedulerOptions.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })] })] })) : null, samplerOptions.length === 0 || schedulerOptions.length === 0 ? (_jsx("div", { className: "form-row", children: "Admin must configure generation options." })) : null] })] }), _jsxs("section", { className: "panel generator-preview-panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: t.previewOutput }), generatedOutputs.length > 8 ? (_jsx("button", { className: "action-btn ghost", onClick: () => setGeneratorShowAllOutputs((prev) => !prev), children: generatorShowAllOutputs ? "Show less" : `Show all (${generatedOutputs.length})` })) : null] }), _jsx("div", { className: `image-grid ${generatorShowAllOutputs ? "is-expanded" : "is-compact"}`, children: visibleGeneratedOutputs.map((img) => (_jsx("div", { className: "image-tile", children: _jsx("img", { src: fileUrl(img.file_id, token, { thumb: true, size: 384 }), alt: "", loading: "lazy", decoding: "async" }) }, img.id))) }), !generatedOutputs.length ? _jsx("div", { className: "muted small", children: "No outputs yet." }) : null] })] }))] }), _jsxs("section", { className: `view ${view === "gallery" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: t.gallery }), _jsxs("div", { className: "gallery-header", children: [_jsx("p", { children: galleryMode === "private" ? "Private gallery" : "Public feed" }), _jsxs("div", { className: "gallery-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: toggleGalleryBulkMode, children: galleryBulkMode ? "Cancel Bulk Action" : "Bulk Action" }), _jsx("button", { className: "action-btn ghost", onClick: () => setGalleryMode((prev) => (prev === "public" ? "private" : "public")), children: galleryMode === "public" ? "Private gallery" : "Public feed" })] })] })] }), galleryModels.filter((model) => model.id !== "generated").length > 0 ? (_jsxs("section", { className: "model-section", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Models" }), _jsx("span", { className: "badge", children: "Gallery" })] }), _jsx("div", { className: "model-grid", children: galleryModels
                                                    .filter((model) => model.id !== "generated")
                                                    .map((model) => (_jsxs("button", { className: "model-card", onClick: () => openGalleryModel(model.id), children: [_jsxs("div", { className: "model-head", children: [_jsxs("div", { children: [_jsx("div", { className: "model-title", children: model.name }), _jsxs("div", { className: "tile-user", children: [renderAvatar(model.avatar_file_id, token), _jsxs("button", { className: "link-btn muted small", onClick: (event) => {
                                                                                        event.stopPropagation();
                                                                                        openProfile(model.user_id);
                                                                                    }, children: ["@", model.username ?? "unknown"] })] })] }), _jsxs("div", { className: "model-stats", children: [_jsxs("span", { children: ["\u2665 ", model.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", model.comment_count ?? 0] })] })] }), _jsx("div", { className: "model-thumb-grid", children: (model.images ?? []).slice(0, 6).map((img) => (_jsx("img", { src: fileUrl(img.file_id, token, { thumb: true, size: 320 }), alt: "", loading: "lazy", decoding: "async" }, img.id))) })] }, model.id))) })] })) : null, galleryBulkMode ? (_jsxs("div", { className: "bulk-gallery-bar", children: [_jsxs("div", { className: "muted small", children: [galleryBulkSelection.length, " selected"] }), _jsxs("div", { className: "gallery-actions", children: [_jsx("button", { className: "action-btn ghost", disabled: galleryBulkBusy || galleryBulkSelection.length === 0, onClick: () => runGalleryBulkAction("public"), children: "Set Public" }), _jsx("button", { className: "action-btn ghost", disabled: galleryBulkBusy || galleryBulkSelection.length === 0, onClick: () => runGalleryBulkAction("private"), children: "Set Private" }), _jsx("button", { className: "action-btn danger", disabled: galleryBulkBusy || galleryBulkSelection.length === 0, onClick: () => {
                                                            if (!confirm(`Delete ${galleryBulkSelection.length} selected image(s)? This cannot be undone.`))
                                                                return;
                                                            runGalleryBulkAction("delete");
                                                        }, children: "Delete Selected" })] }), galleryBulkMessage ? _jsx("div", { className: "muted small", children: galleryBulkMessage }) : null] })) : null, _jsx("div", { className: "gallery-grid", children: galleryImages.map((img) => (_jsxs("button", { className: `gallery-tile ${galleryBulkMode && canManageGalleryImage(img) ? "is-selectable" : ""} ${galleryBulkSelection.includes(img.id) ? "is-selected" : ""}`, onClick: () => {
                                                if (galleryBulkMode) {
                                                    if (!canManageGalleryImage(img))
                                                        return;
                                                    toggleGalleryBulkSelection(img.id);
                                                    return;
                                                }
                                                openGalleryImage(img.id);
                                            }, children: [galleryBulkMode && canManageGalleryImage(img) ? (_jsx("span", { className: "bulk-select-marker", children: galleryBulkSelection.includes(img.id) ? "Selected" : "Select" })) : null, _jsx("img", { src: fileUrl(img.file_id, token, { thumb: true, size: 384 }), alt: "", loading: "lazy", decoding: "async" }), _jsxs("div", { className: "tile-meta", children: [_jsxs("div", { className: "tile-user", children: [renderAvatar(img.avatar_file_id, token), _jsxs("button", { className: "link-btn", onClick: (event) => {
                                                                        event.stopPropagation();
                                                                        openProfile(img.user_id);
                                                                    }, children: ["@", img.username, img.is_public ? " • Public" : ""] })] }), _jsxs("span", { className: "tile-meta-stats", children: [_jsxs("span", { children: ["\u2665 ", img.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", img.comment_count ?? 0] })] })] })] }, img.id))) })] }), _jsxs("section", { className: `view ${view === "lora" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: t.lora }), _jsxs("div", { className: "gallery-header", children: [_jsx("p", { children: loraMode === "private" ? "Private gallery" : "Public feed" }), _jsxs("div", { className: "gallery-actions", children: [loraMode === "private" ? (_jsx("button", { className: "action-btn ghost", onClick: () => setLoraUploadOpen(true), children: "Upload LoRA" })) : null, token ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                    setLoraBulkMode((prev) => !prev);
                                                                    setLoraBulkSelection([]);
                                                                    setLoraBulkMessage("");
                                                                }, children: loraBulkMode ? "Cancel Bulk Action" : "Bulk Action" })) : null, _jsx("button", { className: "action-btn ghost", onClick: () => setLoraMode((prev) => (prev === "public" ? "private" : "public")), children: loraMode === "public" ? "Private gallery" : "Public feed" })] })] })] }), loraBulkMode ? (_jsxs("div", { className: "bulk-gallery-bar", children: [_jsxs("span", { className: "muted small", children: [loraBulkSelection.length, " selected"] }), _jsx("button", { className: "action-btn ghost", disabled: loraBulkBusy || manageableVisibleLoraIds.length === 0, onClick: () => setLoraBulkSelection(manageableVisibleLoraIds), children: "Select all" }), _jsx("button", { className: "action-btn ghost", disabled: loraBulkBusy || loraBulkSelection.length === 0, onClick: () => setLoraBulkSelection([]), children: "Clear" }), _jsx("button", { className: "action-btn ghost", disabled: loraBulkBusy || loraBulkSelection.length === 0, onClick: generateLoraBulkPreviews, children: "Generate previews" }), _jsx("button", { className: "action-btn ghost", disabled: loraBulkBusy || loraBulkSelection.length === 0, onClick: () => applyLoraBulkVisibility(true), children: "Set Public" }), _jsx("button", { className: "action-btn ghost", disabled: loraBulkBusy || loraBulkSelection.length === 0, onClick: () => applyLoraBulkVisibility(false), children: "Set Private" }), _jsx("button", { className: "action-btn danger", disabled: loraBulkBusy || loraBulkSelection.length === 0, onClick: deleteLoraBulkSelection, children: "Delete Selected" }), loraBulkMessage ? _jsx("span", { className: "muted small", children: loraBulkMessage }) : null] })) : null, _jsxs("div", { className: "lora-grid", children: [loraEntries.map((entry) => (_jsxs("button", { className: `lora-card ${loraBulkMode && canManageLoraEntry(entry) ? "is-selectable" : ""} ${loraBulkSelection.includes(entry.id) ? "is-selected" : ""}`, onClick: () => {
                                                    if (loraBulkMode && canManageLoraEntry(entry)) {
                                                        toggleLoraBulkSelection(entry.id);
                                                        return;
                                                    }
                                                    openLoraEntry(entry);
                                                }, children: [loraBulkMode ? (_jsx("span", { className: "bulk-select-marker", children: canManageLoraEntry(entry)
                                                            ? loraBulkSelection.includes(entry.id)
                                                                ? "selected"
                                                                : "select"
                                                            : "view" })) : null, _jsx("div", { className: "lora-title", children: entry.name }), entry.remove_status ? (_jsx("div", { className: "muted small", children: entry.remove_status === "queued"
                                                            ? "Removing (queued)"
                                                            : entry.remove_status === "processing"
                                                                ? "Removing (in progress)"
                                                                : entry.remove_status === "failed"
                                                                    ? "Remove failed"
                                                                    : entry.remove_status })) : null, entry.preview_file_ids && entry.preview_file_ids.length > 0 ? (_jsx("div", { className: "lora-previews", children: entry.preview_file_ids.slice(0, 4).map((fileId) => (_jsx("img", { src: withToken(`/api/files/${fileId}`, token), alt: `${entry.name} preview`, loading: "lazy" }, fileId))) })) : (_jsx("div", { className: "muted small", children: "No previews yet." })), _jsxs("div", { className: "tile-meta", children: [_jsxs("button", { className: "link-btn", onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    openProfile(entry.user_id);
                                                                }, children: ["@", entry.username, entry.source === "external" ? " • External" : ""] }), _jsxs("span", { className: "tile-meta-stats", children: [_jsxs("span", { children: ["\u2665 ", entry.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", entry.comment_count ?? 0] })] })] }), loraPreviewStatus[entry.id] ? (_jsx("div", { className: "muted small", children: loraPreviewStatus[entry.id] })) : null] }, entry.id))), !loraEntries.length ? _jsx("div", { className: "muted small", children: "No LoRA entries yet." }) : null] })] }), _jsxs("section", { className: `view ${view === "profile" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: "Profile" }), _jsx("div", { className: "gallery-actions", children: _jsx("button", { className: "action-btn ghost", onClick: () => setView(profileReturnView), children: "Back" }) })] }), profileView ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "panel profile-hero", children: [_jsx("div", { className: "profile-avatar", children: profileView.avatar_file_id ? (_jsx("img", { src: fileUrl(profileView.avatar_file_id, token, { thumb: true, size: 192 }), alt: "avatar", loading: "lazy", decoding: "async" })) : (_jsx("div", { className: "avatar-preview placeholder", children: "No avatar" })) }), _jsxs("div", { className: "profile-info", children: [_jsx("div", { className: "profile-name", children: profileView.display_name || profileView.username }), _jsxs("div", { className: "muted small", children: ["@", profileView.username] }), _jsx("div", { className: "profile-bio", children: profileView.bio || "No bio yet." }), profileRelationship && !profileRelationship.is_self ? (_jsxs("div", { className: "login-actions", children: [_jsx("button", { className: "action-btn", disabled: profileFollowBusy, onClick: toggleProfileFollow, children: profileRelationship.is_following ? "Unfollow" : "Follow" }), _jsx("button", { className: "action-btn ghost", onClick: () => openDmWithUser(profileView.id), children: "Message" })] })) : null] }), _jsx("div", { className: "profile-stats", children: _jsxs("div", { className: "stat-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "label", children: "Models" }), _jsx("div", { className: "value", children: profileStats?.models ?? 0 })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "label", children: "Images" }), _jsx("div", { className: "value", children: profileStats?.images ?? 0 })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "label", children: "Likes (Models)" }), _jsx("div", { className: "value", children: profileStats?.likes_models ?? 0 })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "label", children: "Likes (Images)" }), _jsx("div", { className: "value", children: profileStats?.likes_images ?? 0 })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "label", children: "Followers" }), _jsx("div", { className: "value", children: profileStats?.followers ?? 0 })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "label", children: "Uses by Others" }), _jsx("div", { className: "value", children: profileStats?.generations_with_my_assets ?? 0 })] })] }) })] }), _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Public Models" }), _jsx("span", { className: "badge", children: "Gallery" })] }), _jsxs("div", { className: "model-grid", children: [profileModels.map((model) => (_jsxs("button", { className: "model-card", onClick: () => openGalleryModel(model.id), children: [_jsx("div", { className: "model-thumb-grid", children: (model.images ?? []).slice(0, 4).map((img) => (_jsx("img", { src: fileUrl(img.file_id, token, { thumb: true, size: 320 }), alt: "", loading: "lazy", decoding: "async" }, img.id))) }), _jsxs("div", { className: "tile-meta", children: [_jsxs("div", { className: "tile-user", children: [renderAvatar(model.avatar_file_id, token), _jsxs("span", { children: ["@", model.username ?? "unknown", " \u2022 ", model.name] })] }), _jsxs("span", { className: "tile-meta-stats", children: [_jsxs("span", { children: ["\u2665 ", model.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", model.comment_count ?? 0] })] })] })] }, model.id))), profileLoras.map((entry) => (_jsxs("button", { className: "lora-card", onClick: () => openLoraEntry(entry), children: [_jsx("div", { className: "lora-title", children: entry.name }), entry.preview_file_ids && entry.preview_file_ids.length > 0 ? (_jsx("div", { className: "lora-previews", children: entry.preview_file_ids.slice(0, 4).map((fileId) => (_jsx("img", { src: fileUrl(fileId, token, { thumb: true, size: 320 }), alt: `${entry.name} preview`, loading: "lazy", decoding: "async" }, fileId))) })) : (_jsx("div", { className: "muted small", children: "No previews yet." })), _jsxs("div", { className: "tile-meta", children: [_jsxs("span", { children: ["@", entry.username, " \u2022 LoRA"] }), _jsxs("span", { className: "tile-meta-stats", children: [_jsxs("span", { children: ["\u2665 ", entry.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", entry.comment_count ?? 0] })] })] })] }, entry.id))), !profileModels.length && !profileLoras.length ? (_jsx("div", { className: "muted small", children: "No public models yet." })) : null] })] }), _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Public Images" }), _jsx("span", { className: "badge", children: "Gallery" })] }), _jsxs("div", { className: "gallery-grid", children: [profileImages.map((img) => (_jsxs("button", { className: "gallery-tile", onClick: () => openGalleryImage(img.id), children: [_jsx("img", { src: fileUrl(img.file_id, token, { thumb: true, size: 384 }), alt: "", loading: "lazy", decoding: "async" }), _jsxs("div", { className: "tile-meta", children: [_jsxs("div", { className: "tile-user", children: [renderAvatar(img.avatar_file_id, token), _jsxs("span", { children: ["@", img.username] })] }), _jsxs("span", { className: "tile-meta-stats", children: [_jsxs("span", { children: ["\u2665 ", img.like_count ?? 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", img.comment_count ?? 0] })] })] })] }, img.id))), !profileImages.length ? _jsx("div", { className: "muted small", children: "No public images yet." }) : null] })] })] })) : (_jsx("div", { className: "muted small", children: "Profile not found." }))] }), _jsxs("section", { className: `view ${view === "messages" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: "Messages" }), _jsx("p", { children: "Direct conversations" })] }), _jsxs("section", { className: "panel dm-layout", children: [_jsxs("aside", { className: "dm-sidebar", children: [_jsxs("div", { className: "dm-sidebar-head", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Threads" }), _jsxs("span", { className: "badge", children: [dmUnreadCount, " unread"] })] }), _jsx("input", { className: "input", placeholder: "Search threads...", value: dmThreadQuery, onChange: (e) => setDmThreadQuery(e.target.value) })] }), _jsx("div", { className: "dm-thread-list", children: dmFilteredThreads.length === 0 ? (_jsx("div", { className: "muted small", children: "No conversations yet." })) : (dmFilteredThreads.map((thread) => {
                                                            const selected = dmActiveThreadId === thread.id;
                                                            return (_jsx("button", { className: `dm-thread-item ${selected ? "is-active" : ""}`, onClick: () => setDmActiveThreadId(thread.id), children: _jsxs("div", { className: "dm-thread-top", children: [_jsx("span", { className: "dm-thread-name", children: thread.peer_display_name || thread.peer_username }), thread.unread_count ? _jsx("span", { className: "badge", children: thread.unread_count }) : null] }) }, thread.id));
                                                        })) })] }), _jsx("div", { className: "dm-main", children: dmActiveThread ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "dm-main-head", children: [_jsxs("div", { children: [_jsx("div", { className: "dm-peer-name", children: dmActiveThread.peer_display_name || dmActiveThread.peer_username }), _jsxs("div", { className: "muted small", children: ["@", dmActiveThread.peer_username] })] }), _jsxs("div", { className: "job-actions", children: [dmActiveThread.blocked_by_me ? (_jsx("button", { className: "action-btn ghost", onClick: () => unblockDmUser(dmActiveThread.peer_user_id), children: "Unblock" })) : (_jsx("button", { className: "action-btn danger", onClick: () => blockDmUser(dmActiveThread.peer_user_id), children: "Block" })), _jsx("button", { className: "action-btn ghost", onClick: () => deleteDmThread(dmActiveThread.id), children: "Delete Thread" })] })] }), _jsx("div", { className: "dm-message-list", children: dmLoading ? (_jsx("div", { className: "muted small", children: "Loading messages..." })) : dmMessages.length === 0 ? (_jsx("div", { className: "muted small", children: "No messages yet." })) : (dmMessages.map((message) => {
                                                                const mine = message.sender_user_id === user?.id;
                                                                return (_jsx("div", { className: `dm-bubble-row ${mine ? "is-mine" : "is-peer"}`, children: _jsxs("div", { className: `dm-bubble ${mine ? "is-mine" : "is-peer"}`, children: [_jsx("div", { className: "dm-bubble-text", children: message.body }), _jsx("div", { className: "dm-bubble-time", children: new Date(message.created_at).toLocaleTimeString() })] }) }, message.id));
                                                            })) }), _jsx("div", { className: "dm-composer", children: dmActiveThread.blocked_by_me || dmActiveThread.blocked_by_peer ? (_jsx("div", { className: "muted small", children: "Messaging is blocked for this thread." })) : (_jsxs(_Fragment, { children: [_jsx("textarea", { className: "input", rows: 3, value: dmDraft, onChange: (e) => setDmDraft(e.target.value), placeholder: `Write to @${dmActiveThread.peer_username}` }), _jsxs("div", { className: "dm-composer-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: () => setDmEmojiOpen((prev) => !prev), children: "Emoji" }), _jsx("button", { className: "action-btn ghost", onClick: () => refreshDmMessages(dmActiveThread.id), children: "Refresh" }), _jsx("button", { className: "action-btn", onClick: () => sendDmMessage(), children: "Send" })] }), dmEmojiOpen ? (_jsx("div", { className: "dm-emoji-grid", children: DM_EMOJI_SET.map((emoji) => (_jsx("button", { className: "dm-emoji-btn", onClick: () => setDmDraft((prev) => `${prev}${emoji}`), children: emoji }, emoji))) })) : null] })) })] })) : (_jsx("div", { className: "muted small", children: "Select a thread to start chatting." })) }), _jsxs("aside", { className: "dm-rightbar", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Blocked Users" }), _jsx("span", { className: "badge", children: dmBlocks.length })] }), _jsx("div", { className: "mini-list", children: dmBlocks.length === 0 ? (_jsx("div", { className: "muted small", children: "No blocked users." })) : (dmBlocks.map((entry) => (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: entry.display_name || entry.username }), _jsx("button", { className: "action-btn ghost", onClick: () => unblockDmUser(entry.user_id), children: "Unblock" })] }, entry.user_id)))) }), dmStatus ? _jsx("div", { className: "muted small", children: dmStatus }) : null] })] })] }), _jsxs("section", { className: `view ${view === "settings" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: t.settings }), _jsx("p", { children: "User settings" })] }), _jsxs("div", { className: "settings-layout", children: [_jsxs("aside", { className: "settings-nav", children: [_jsx("button", { className: `settings-tab ${settingsTab === "profile" ? "is-active" : ""}`, onClick: () => setSettingsTab("profile"), children: "Profile" }), _jsx("button", { className: `settings-tab ${settingsTab === "security" ? "is-active" : ""}`, onClick: () => setSettingsTab("security"), children: "Security" }), _jsx("button", { className: `settings-tab ${settingsTab === "notifications" ? "is-active" : ""}`, onClick: () => setSettingsTab("notifications"), children: "Notifications" }), _jsx("button", { className: `settings-tab ${settingsTab === "automation" ? "is-active" : ""}`, onClick: () => setSettingsTab("automation"), children: "Wildcards & AutoChar" }), _jsx("button", { className: `settings-tab ${settingsTab === "tokens" ? "is-active" : ""}`, onClick: () => setSettingsTab("tokens"), children: "API Tokens" })] }), _jsxs("div", { className: "settings-content", children: [settingsTab === "profile" ? (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "User Profile" }), _jsx("span", { className: "badge", children: "Account" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Credits" }), _jsx("span", { children: user?.credits_balance ?? 0 })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Daily Allowance" }), _jsx("span", { children: user?.credits_daily_allowance ?? 0 })] }), _jsxs("label", { className: "form-row", children: ["Display Name", _jsx("input", { className: "input", value: profile.display_name, onChange: (e) => setProfile({ ...profile, display_name: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Bio", _jsx("input", { className: "input", value: profile.bio, onChange: (e) => setProfile({ ...profile, bio: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Avatar", _jsxs("div", { className: "avatar-row", children: [profile.avatar_file_id ? (_jsx("img", { className: "avatar-preview", src: fileUrl(profile.avatar_file_id, token, { thumb: true, size: 192 }), alt: "avatar", loading: "lazy", decoding: "async" })) : (_jsx("div", { className: "avatar-preview placeholder", children: "No avatar" })), _jsx("input", { className: "input", type: "file", accept: "image/*", onChange: (e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (!file)
                                                                                                return;
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
                                                                                        } })] }), avatarStatus ? _jsx("div", { className: "muted small", children: avatarStatus }) : null] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                            fetch("/api/users/me/profile", {
                                                                                method: "PUT",
                                                                                headers: {
                                                                                    "Content-Type": "application/json",
                                                                                    Authorization: `Bearer ${token}`
                                                                                },
                                                                                body: JSON.stringify(profile)
                                                                            }).then(() => null);
                                                                        }, children: "Save Profile" })] })] })) : null, settingsTab === "security" ? (_jsxs("div", { className: "settings-stack", children: [_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Password" }), _jsx("span", { className: "badge", children: "Security" })] }), _jsxs("div", { className: "form-grid", children: [_jsx("div", { className: "muted small", children: "Change password and secure your account credentials." }), user?.must_change_password ? (_jsx("div", { className: "muted small", children: "Password update is required before continuing." })) : null, _jsx("button", { className: "action-btn", onClick: () => setPasswordOpen(true), children: "Change Password" })] })] }), _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Security Onboarding" }), _jsx("span", { className: "badge", children: twoFaStatus.enabled ? "2FA On" : "2FA Off" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "2FA Status" }), _jsx("span", { children: twoFaStatus.enabled ? "Enabled" : "Disabled" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "2FA Lock" }), _jsx("span", { children: twoFaStatus.locked ? "Locked (3 failed)" : "Unlocked" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Trusted IPs" }), _jsx("span", { children: twoFaStatus.trusted_ip_count })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Emergency left" }), _jsx("span", { children: twoFaStatus.recovery_remaining })] }), _jsxs("div", { className: "job-actions", children: [_jsx("button", { className: "action-btn", disabled: securityBusy, onClick: startSecurityOnboarding, children: twoFaStatus.enabled ? "Re-run Onboarding" : "Start Security Onboarding" }), _jsx("button", { className: "action-btn ghost", onClick: refreshTwoFaStatus, children: "Refresh" })] }), securityStatusMsg ? _jsx("div", { className: "muted small", children: securityStatusMsg }) : null] })] }), securityWizardOpen ? (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Onboarding Wizard" }), _jsxs("span", { className: "badge", children: ["Step ", securityWizardStep, "/3"] })] }), _jsxs("div", { className: "form-grid", children: [securityWizardStep === 2 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "muted small", children: "Add a new account in Google Authenticator with this secret or otpauth URI, then enter the 6-digit code." }), _jsxs("label", { className: "form-row", children: ["Secret", _jsx("input", { className: "input", value: securityWizardSecret, readOnly: true })] }), _jsxs("label", { className: "form-row", children: ["OTPAuth URI", _jsx("input", { className: "input", value: securityWizardUri, readOnly: true })] }), _jsxs("label", { className: "form-row", children: ["TOTP Code", _jsx("input", { className: "input", value: securityWizardCode, onChange: (e) => setSecurityWizardCode(e.target.value), placeholder: "123456" })] }), _jsx("div", { className: "job-actions", children: _jsx("button", { className: "action-btn", disabled: securityBusy, onClick: verifySecurityOnboarding, children: "Verify & Enable" }) })] })) : null, securityWizardStep === 3 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "muted small", children: "Save these emergency codes now. They are shown once and can unlock/reset 2FA." }), securityRecoveryCodes.map((code, idx) => (_jsxs("div", { className: "stat-row", children: [_jsxs("span", { children: ["Sequence ", idx + 1] }), _jsx("span", { children: code })] }, code))), _jsx("div", { className: "job-actions", children: _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                                setSecurityWizardOpen(false);
                                                                                                setSecurityWizardStep(1);
                                                                                                setSecurityRecoveryCodes([]);
                                                                                            }, children: "Close Wizard" }) })] })) : null] })] })) : null, twoFaStatus.enabled ? (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Disable 2FA" }), _jsx("span", { className: "badge", children: "Emergency" })] }), _jsxs("div", { className: "form-grid", children: [_jsx("div", { className: "muted small", children: "Disable requires your password plus either current TOTP code or one emergency code." }), _jsxs("label", { className: "form-row", children: ["Password", _jsx("input", { className: "input", type: "password", value: securityDisablePassword, onChange: (e) => setSecurityDisablePassword(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["TOTP Code (optional)", _jsx("input", { className: "input", value: securityDisableCode, onChange: (e) => setSecurityDisableCode(e.target.value), placeholder: "123456" })] }), _jsxs("label", { className: "form-row", children: ["Emergency Code (optional)", _jsx("input", { className: "input", value: securityDisableEmergency, onChange: (e) => setSecurityDisableEmergency(e.target.value), placeholder: "XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX" })] }), _jsx("div", { className: "job-actions", children: _jsx("button", { className: "action-btn danger", disabled: securityBusy, onClick: disableTwoFa, children: "Disable 2FA" }) })] })] })) : null] })) : null, settingsTab === "notifications" ? (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Notification Center" }), _jsxs("span", { className: "badge", children: [notificationUnread, " unread"] })] }), _jsxs("div", { className: "form-grid", children: [NOTIFICATION_LABELS.map((entry) => (_jsxs("label", { className: "stat-row", children: [_jsx("span", { children: entry.label }), _jsx("input", { type: "checkbox", checked: Boolean(notificationPrefs[entry.key]), disabled: Boolean(notificationSaving[entry.key]), onChange: (e) => updateNotificationPref(entry.key, e.target.checked) })] }, entry.key))), _jsx("div", { className: "job-actions", children: _jsx("button", { className: "action-btn ghost", onClick: markAllNotificationsRead, children: "Mark all as read" }) }), _jsx("div", { className: "form-row", children: notificationList.length === 0 ? (_jsx("div", { className: "muted small", children: "No notifications yet." })) : (notificationList.slice(0, 20).map((item) => (_jsxs("div", { className: "stat-row", children: [_jsxs("span", { children: [_jsx("strong", { children: item.title }), item.body ? ` - ${item.body}` : "", _jsxs("span", { className: "muted small", children: [" (", new Date(item.created_at).toLocaleString(), ")"] })] }), !item.read_at ? (_jsx("button", { className: "action-btn ghost", onClick: () => markNotificationRead(item.id), children: "Read" })) : (_jsx("span", { className: "muted small", children: "read" }))] }, item.id)))) })] })] })) : null, settingsTab === "automation" ? (_jsxs("div", { className: "settings-stack", children: [_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "AutoChar Presets" }), _jsx("span", { className: "badge", children: "Personal" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { className: "form-row", children: ["Name", _jsx("input", { className: "input", value: autocharName, onChange: (e) => setAutocharName(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Description", _jsx("input", { className: "input", value: autocharDescription, onChange: (e) => setAutocharDescription(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Patterns (comma or newline)", _jsx("textarea", { className: "input", rows: 4, value: autocharPatterns, onChange: (e) => setAutocharPatterns(e.target.value) })] }), _jsxs("div", { className: "job-actions", children: [_jsx("button", { className: "action-btn", onClick: autocharEditingId ? updateAutocharPreset : createAutocharPreset, children: autocharEditingId ? "Update Preset" : "Save Preset" }), autocharEditingId ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                            setAutocharEditingId(null);
                                                                                            setAutocharName("");
                                                                                            setAutocharDescription("");
                                                                                            setAutocharPatterns("");
                                                                                        }, children: "Cancel" })) : null] }), autocharStatus ? _jsx("div", { className: "form-row", children: autocharStatus }) : null, autocharPresets.length === 0 ? (_jsx("div", { className: "muted small", children: "No presets yet." })) : (autocharPresets.map((preset) => (_jsxs("div", { className: "stat-row", children: [_jsxs("span", { children: [preset.name, preset.description ? ` • ${preset.description}` : ""] }), _jsxs("span", { className: "job-actions", children: [_jsxs("span", { className: "muted small", children: [preset.patterns?.length ?? 0, " tags"] }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                                    setAutocharEditingId(preset.id);
                                                                                                    setAutocharName(preset.name);
                                                                                                    setAutocharDescription(preset.description ?? "");
                                                                                                    setAutocharPatterns((preset.patterns ?? []).join(", "));
                                                                                                }, children: "Edit" }), _jsx("button", { className: "action-btn ghost", onClick: () => deleteAutocharPreset(preset.id), children: "Delete" })] })] }, preset.id))))] })] }), _jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Wildcard Lists" }), _jsx("span", { className: "badge", children: "Personal" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "muted small", children: ["Create lists here and use them in generator prompts as tokens like ", _jsx("code", { children: "__my_list__" }), "."] }), _jsxs("label", { className: "form-row", children: ["Mode", _jsxs("select", { className: "input", value: wildcardMode, onChange: (e) => {
                                                                                            const mode = e.target.value === "random" ? "random" : "sequential";
                                                                                            setWildcardMode(mode);
                                                                                            setWildcardMessage("Wildcard mode changed. Save to apply.");
                                                                                        }, children: [_jsx("option", { value: "sequential", children: "Sequential (line by line)" }), _jsx("option", { value: "random", children: "Random" })] })] }), _jsxs("label", { className: "form-row", children: ["List name", _jsx("input", { className: "input", placeholder: "my_list", value: wildcardNameInput, onChange: (e) => setWildcardNameInput(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Entries (one per line)", _jsx("textarea", { className: "input", rows: 5, placeholder: "entry_one\nentry_two\nentry_three", value: wildcardEntriesInput, onChange: (e) => setWildcardEntriesInput(e.target.value) })] }), _jsxs("div", { className: "job-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: addOrUpdateWildcard, children: wildcardEditName ? "Update List" : "Add List" }), wildcardEditName ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                            setWildcardEditName("");
                                                                                            setWildcardNameInput("");
                                                                                            setWildcardEntriesInput("");
                                                                                            setWildcardMessage("");
                                                                                        }, children: "Cancel" })) : null, _jsx("button", { className: "action-btn", disabled: wildcardSaving, onClick: () => saveWildcardSettings(wildcardLists, wildcardMode), children: "Save Wildcards" })] }), wildcardMessage ? _jsx("div", { className: "muted small", children: wildcardMessage }) : null, wildcardLists.length === 0 ? (_jsx("div", { className: "muted small", children: "No wildcard lists yet." })) : (wildcardLists.map((row) => (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: row.name }), _jsxs("span", { className: "job-actions", children: [_jsxs("span", { className: "muted small", children: [row.entries.length, " entries"] }), _jsx("button", { className: "action-btn ghost", onClick: () => editWildcard(row.name), children: "Edit" }), _jsx("button", { className: "action-btn danger", onClick: () => removeWildcard(row.name), children: "Remove" })] })] }, row.name))))] })] })] })) : null, settingsTab === "tokens" ? (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "User Tokens" }), _jsx("span", { className: "badge", children: "Access" })] }), _jsxs("div", { className: "form-grid", children: [_jsx("div", { className: "muted small", children: "API bearer tokens are shown once. Store them safely." }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                            fetch("/api/users/me/tokens", {
                                                                                method: "POST",
                                                                                headers: { Authorization: `Bearer ${token}` }
                                                                            })
                                                                                .then((res) => res.json())
                                                                                .then((data) => setNewToken(data.token ?? null))
                                                                                .catch(() => setNewToken(null));
                                                                        }, children: "Create Bearer Token" }), newToken ? _jsx("div", { className: "form-row", children: newToken }) : null] })] })) : null] })] })] }), isAdmin ? (_jsxs("section", { className: `view ${view === "admin" ? "is-active" : ""}`, children: [_jsxs("div", { className: "view-header", children: [_jsx("h1", { children: "Admin Settings" }), _jsx("p", { children: "System control" })] }), _jsx("div", { className: "admin-tabs", children: adminTabs.map((tab) => (_jsx("button", { className: `tab-btn ${adminTab === tab ? "is-active" : ""}`, onClick: () => setAdminTab(tab), children: tab }, tab))) }), _jsxs("div", { className: "grid two-col", children: [_jsxs("section", { className: `panel ${adminTab === "queue" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Queue Control" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "queue-meta", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Queue Mode" }), _jsx("div", { className: "muted small", children: "Start/Pause/Stop orchestrator processing." })] }), _jsx("div", { className: `pill ${queueStatus.queue_paused ? "is-paused" : "is-running"}`, children: queueStatus.queue_paused ? "paused" : "running" })] }), _jsxs("div", { className: "muted small", children: ["Active pipeline: ", queueStatus.active_pipeline_id || "–"] }), _jsxs("div", { className: "muted small", children: ["Active generation: ", queueStatus.active_generation_id || "–"] }), _jsxs("div", { className: "muted small", children: ["Active training: ", queueStatus.active_training_id || "–"] }), _jsxs("div", { className: "queue-actions", children: [_jsx("button", { className: "action-btn", onClick: () => queueCommand("start"), children: "Start" }), _jsx("button", { className: "action-btn", onClick: () => queueCommand("pause"), children: "Pause" }), _jsx("button", { className: "action-btn", onClick: () => queueCommand("stop"), children: "Stop" }), _jsx("button", { className: "action-btn", onClick: () => queueCommand("restart"), children: "Restart" }), _jsx("button", { className: "action-btn ghost", onClick: () => refreshQueueStatus(), children: "Refresh" })] })] })] }), _jsxs("section", { className: `panel ${adminTab === "core" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Core Settings" }), _jsx("span", { className: "badge", children: "Pipeline" })] }), _jsxs("div", { className: "settings-grid", children: [_jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Capping" }), _jsx("span", { className: "muted small", children: "Controls frame extraction from videos." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "FPS" }), _jsx("div", { className: "muted small", children: "Frames per second during capping." })] }), _jsx("input", { className: "input", type: "number", value: coreSettings.capping_fps, onChange: (e) => setCoreSettings({ ...coreSettings, capping_fps: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "JPEG quality" }), _jsx("div", { className: "muted small", children: "ffmpeg qscale (2 = near-lossless)." })] }), _jsx("input", { className: "input", type: "number", value: coreSettings.capping_jpeg_quality, onChange: (e) => setCoreSettings({ ...coreSettings, capping_jpeg_quality: e.target.value }) })] })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Selection" }), _jsx("span", { className: "muted small", children: "How frames are picked before cropping." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Target per character" }), _jsx("div", { className: "muted small", children: "Max selected before cropping." })] }), _jsx("input", { className: "input", type: "number", value: coreSettings.selection_target_per_character, onChange: (e) => setCoreSettings({ ...coreSettings, selection_target_per_character: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Face quota" }), _jsx("div", { className: "muted small", children: "Target count of face-close shots." })] }), _jsx("input", { className: "input", type: "number", value: coreSettings.selection_face_quota, onChange: (e) => setCoreSettings({ ...coreSettings, selection_face_quota: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Hamming threshold" }), _jsx("div", { className: "muted small", children: "Minimum pHash distance for diversity." })] }), _jsx("input", { className: "input", type: "number", value: coreSettings.selection_hamming_threshold, onChange: (e) => setCoreSettings({ ...coreSettings, selection_hamming_threshold: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Hamming relaxed" }), _jsx("div", { className: "muted small", children: "Fallback pHash distance." })] }), _jsx("input", { className: "input", type: "number", value: coreSettings.selection_hamming_relaxed, onChange: (e) => setCoreSettings({ ...coreSettings, selection_hamming_relaxed: e.target.value }) })] })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Autotag" }), _jsx("span", { className: "muted small", children: "Default thresholds when not overridden." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "General threshold" }), _jsx("div", { className: "muted small", children: "Score cutoff for general tags." })] }), _jsx("input", { className: "input", type: "number", step: "0.01", value: coreSettings.autotag_general_threshold, onChange: (e) => setCoreSettings({ ...coreSettings, autotag_general_threshold: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Character threshold" }), _jsx("div", { className: "muted small", children: "Score cutoff for character tags." })] }), _jsx("input", { className: "input", type: "number", step: "0.01", value: coreSettings.autotag_character_threshold, onChange: (e) => setCoreSettings({ ...coreSettings, autotag_character_threshold: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Max tags" }), _jsx("div", { className: "muted small", children: "Maximum tags per image." })] }), _jsx("input", { className: "input", type: "number", value: coreSettings.autotag_max_tags, onChange: (e) => setCoreSettings({ ...coreSettings, autotag_max_tags: e.target.value }) })] })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Output" }), _jsx("span", { className: "muted small", children: "Final caps on produced images." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Max images per set" }), _jsx("div", { className: "muted small", children: "Trim overflow to _overflow." })] }), _jsx("input", { className: "input", type: "number", value: coreSettings.output_max_images, onChange: (e) => setCoreSettings({ ...coreSettings, output_max_images: e.target.value }) })] })] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                    const entries = [
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
                                                                    Promise.all(entries.map(([key, value]) => fetch("/api/settings/admin", {
                                                                        method: "PUT",
                                                                        headers: {
                                                                            "Content-Type": "application/json",
                                                                            Authorization: `Bearer ${token}`
                                                                        },
                                                                        body: JSON.stringify({ key, value })
                                                                    }))).then(() => null);
                                                                }, children: "Save Core Settings" })] })] }), _jsxs("section", { className: `panel ${adminTab === "tagger" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Tagger" }), _jsx("span", { className: "badge", children: "Models" })] }), _jsxs("div", { className: "settings-grid", children: [_jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Hugging Face" }), _jsx("span", { className: "muted small", children: "Token stored in DB for downloads." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "HF token" }), _jsx("div", { className: "muted small", children: "Needed for private models." })] }), _jsx("input", { className: "input", type: "password", value: hfToken, onChange: (e) => setHfToken(e.target.value) })] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                            fetch("/api/settings/admin", {
                                                                                method: "PUT",
                                                                                headers: {
                                                                                    "Content-Type": "application/json",
                                                                                    Authorization: `Bearer ${token}`
                                                                                },
                                                                                body: JSON.stringify({ key: "hf_token", value: hfToken })
                                                                            }).then(() => null);
                                                                        }, children: "Save Tagger Token" })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Download / Switch model" }), _jsx("span", { className: "muted small", children: "Repo id or full link." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Quick picks" }), _jsx("div", { className: "muted small", children: "Choose curated tagger." })] }), _jsxs("select", { className: "input", value: taggerPreset, onChange: (e) => {
                                                                                    const val = e.target.value;
                                                                                    setTaggerPreset(val);
                                                                                    setTaggerRepoId(val);
                                                                                }, children: [_jsx("option", { value: "", children: "Select a model..." }), _jsx("optgroup", { label: "General", children: _jsx("option", { value: "SmilingWolf/wd-eva02-large-tagger-v3", children: "EVA02 Large (default)" }) }), _jsxs("optgroup", { label: "Anime", children: [_jsx("option", { value: "SmilingWolf/wd-swinv2-tagger-v3", children: "SwinV2 (anime)" }), _jsx("option", { value: "SmilingWolf/wd-convnext-tagger-v3", children: "ConvNeXt (anime)" })] }), _jsxs("optgroup", { label: "Realistic", children: [_jsx("option", { value: "SmilingWolf/wd-swinv2-tagger-v3", children: "SwinV2 (realistic)" }), _jsx("option", { value: "SmilingWolf/wd-convnext-tagger-v3", children: "ConvNeXt (realistic)" })] })] })] }), _jsxs("label", { className: "form-row", children: ["Repo ID or link", _jsx("input", { className: "input", value: taggerRepoId, onChange: (e) => setTaggerRepoId(e.target.value) })] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                            if (!taggerRepoId)
                                                                                return;
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
                                                                                }
                                                                                else {
                                                                                    if (data.message === "already_exists") {
                                                                                        setTaggerStatus("Model already exists.");
                                                                                    }
                                                                                    else {
                                                                                        setTaggerStatus("Download complete.");
                                                                                    }
                                                                                    setTaggerDefault(data.model_id ?? taggerDefault);
                                                                                    refreshTaggerModels();
                                                                                }
                                                                            })
                                                                                .catch(() => setTaggerStatus("Download failed."));
                                                                        }, children: "Download / Refresh" }), taggerStatus ? _jsx("div", { className: "form-row", children: taggerStatus }) : null] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Local models" }), _jsx("span", { className: "muted small", children: "Stored under storage/tagger_models." })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Current default" }), _jsx("span", { children: taggerDefault || "unknown" })] }), _jsx("div", { className: "queue-actions", children: _jsx("button", { className: "action-btn ghost", onClick: refreshTaggerModels, children: "Refresh list" }) }), taggerModels.map((model) => (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: model.name }), _jsxs("span", { className: "job-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: () => {
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
                                                                                        }, children: "Set default" }), _jsx("button", { className: "action-btn danger", onClick: () => {
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
                                                                                        }, children: "Delete" })] })] }, model.id)))] })] })] }), _jsxs("section", { className: `panel ${adminTab === "generation" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Generation Options" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-row", children: ["Samplers", _jsx("div", { className: "pill-list", children: DEFAULT_SAMPLERS.map((opt) => {
                                                                            const active = adminSamplerSelection.includes(opt);
                                                                            return (_jsx("button", { className: `pill ${active ? "is-active" : ""}`, onClick: () => {
                                                                                    setAdminSamplerSelection((prev) => prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]);
                                                                                }, children: opt }, opt));
                                                                        }) })] }), _jsxs("div", { className: "form-row", children: ["Schedulers", _jsx("div", { className: "pill-list", children: DEFAULT_SCHEDULERS.map((opt) => {
                                                                            const active = adminSchedulerSelection.includes(opt);
                                                                            return (_jsx("button", { className: `pill ${active ? "is-active" : ""}`, onClick: () => {
                                                                                    setAdminSchedulerSelection((prev) => prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]);
                                                                                }, children: opt }, opt));
                                                                        }) })] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                    const updates = [
                                                                        { key: "generation.samplers", value: adminSamplerSelection },
                                                                        { key: "generation.schedulers", value: adminSchedulerSelection }
                                                                    ];
                                                                    Promise.all(updates.map((item) => fetch("/api/settings/admin", {
                                                                        method: "PUT",
                                                                        headers: {
                                                                            "Content-Type": "application/json",
                                                                            Authorization: `Bearer ${token}`
                                                                        },
                                                                        body: JSON.stringify(item)
                                                                    }))).then(() => {
                                                                        setSamplerOptions(adminSamplerSelection);
                                                                        setSchedulerOptions(adminSchedulerSelection);
                                                                    });
                                                                }, children: "Save Generation Options" })] })] }), _jsxs("section", { className: `panel ${adminTab === "credits" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Credits" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { className: "form-row", children: ["Credits per Generation", _jsx("input", { className: "input", value: adminCreditCostGenerate, onChange: (e) => setAdminCreditCostGenerate(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Credits per Training", _jsx("input", { className: "input", value: adminCreditCostTrain, onChange: (e) => setAdminCreditCostTrain(e.target.value) })] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                    const updates = [
                                                                        { key: "credits.generate", value: Number(adminCreditCostGenerate || 1) },
                                                                        { key: "credits.train", value: Number(adminCreditCostTrain || 5) }
                                                                    ];
                                                                    Promise.all(updates.map((item) => fetch("/api/settings/admin", {
                                                                        method: "PUT",
                                                                        headers: {
                                                                            "Content-Type": "application/json",
                                                                            Authorization: `Bearer ${token}`
                                                                        },
                                                                        body: JSON.stringify(item)
                                                                    }))).then(() => null);
                                                                }, children: "Save Credit Costs" }), _jsxs("label", { className: "form-row", children: ["User ID / Username / Email", _jsx("input", { className: "input", value: adminCredits.user_id, onChange: (e) => setAdminCredits({ ...adminCredits, user_id: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Delta", _jsx("input", { className: "input", value: adminCredits.delta, onChange: (e) => setAdminCredits({ ...adminCredits, delta: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Daily Allowance", _jsx("input", { className: "input", value: adminCredits.daily_allowance, onChange: (e) => setAdminCredits({ ...adminCredits, daily_allowance: e.target.value }) })] }), _jsx("button", { className: `action-btn ${adminCreditsBusy ? "is-loading" : ""}`, onClick: async () => {
                                                                    if (adminCreditsBusy)
                                                                        return;
                                                                    const payload = { user_id: adminCredits.user_id };
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
                                                                        }
                                                                        else {
                                                                            setAdminCreditsStatus("Credits applied.");
                                                                            fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
                                                                                .then((r) => r.json())
                                                                                .then((data) => setUser(data ?? null))
                                                                                .catch(() => null);
                                                                            refreshSelectedAdminUser().catch(() => null);
                                                                            refreshAdminCreditLedger(1).catch(() => null);
                                                                        }
                                                                    }
                                                                    catch {
                                                                        setAdminCreditsStatus("Failed to apply credits.");
                                                                    }
                                                                    finally {
                                                                        setAdminCreditsBusy(false);
                                                                    }
                                                                }, children: "Apply Credits" }), adminCreditsStatus ? _jsx("div", { className: "status-msg", children: adminCreditsStatus }) : null, _jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Credit Ledger" }), _jsxs("div", { className: "admin-ledger-filters", children: [_jsxs("label", { className: "form-row", children: ["User", _jsx("input", { className: "input", placeholder: "username / email / user id", value: adminLedgerUserFilter, onChange: (e) => setAdminLedgerUserFilter(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Reason", _jsxs("select", { className: "input", value: adminLedgerReasonFilter, onChange: (e) => setAdminLedgerReasonFilter(e.target.value), children: [_jsx("option", { value: "", children: "all" }), CREDIT_LEDGER_REASON_OPTIONS.map((value) => (_jsx("option", { value: value, children: value }, `reason-${value}`)))] })] }), _jsxs("label", { className: "form-row", children: ["Ref type", _jsxs("select", { className: "input", value: adminLedgerRefTypeFilter, onChange: (e) => setAdminLedgerRefTypeFilter(e.target.value), children: [_jsx("option", { value: "", children: "all" }), CREDIT_LEDGER_REF_TYPE_OPTIONS.map((value) => (_jsx("option", { value: value, children: value }, `ref-${value}`)))] })] }), _jsxs("label", { className: "form-row", children: ["Delta", _jsxs("select", { className: "input", value: adminLedgerDeltaSign, onChange: (e) => setAdminLedgerDeltaSign(e.target.value), children: [_jsx("option", { value: "all", children: "all" }), _jsx("option", { value: "plus", children: "plus" }), _jsx("option", { value: "minus", children: "minus" })] })] }), _jsxs("label", { className: "form-row", children: ["From", _jsx("input", { className: "input", type: "datetime-local", value: adminLedgerFrom, onChange: (e) => setAdminLedgerFrom(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["To", _jsx("input", { className: "input", type: "datetime-local", value: adminLedgerTo, onChange: (e) => setAdminLedgerTo(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Page size", _jsxs("select", { className: "input", value: String(adminLedgerPageSize), onChange: (e) => {
                                                                                            setAdminLedgerPageSize(Number(e.target.value));
                                                                                            setAdminLedgerPage(1);
                                                                                        }, children: [_jsx("option", { value: "10", children: "10" }), _jsx("option", { value: "25", children: "25" }), _jsx("option", { value: "50", children: "50" }), _jsx("option", { value: "100", children: "100" })] })] }), _jsxs("div", { className: "job-actions", children: [_jsx("button", { className: `action-btn ${adminLedgerLoading ? "is-loading" : ""}`, onClick: () => {
                                                                                            setAdminLedgerPage(1);
                                                                                            refreshAdminCreditLedger(1).catch(() => null);
                                                                                        }, children: "Load Ledger" }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                            setAdminLedgerUserFilter("");
                                                                                            setAdminLedgerReasonFilter("");
                                                                                            setAdminLedgerRefTypeFilter("");
                                                                                            setAdminLedgerDeltaSign("all");
                                                                                            setAdminLedgerFrom("");
                                                                                            setAdminLedgerTo("");
                                                                                            setAdminLedgerPage(1);
                                                                                            refreshAdminCreditLedger(1).catch(() => null);
                                                                                        }, children: "Reset" })] })] }), _jsxs("div", { className: "muted small", children: ["Total: ", adminLedgerTotal, " | Page ", adminLedgerPage] }), adminLedgerStatus ? _jsx("div", { className: "muted small", children: adminLedgerStatus }) : null, _jsxs("div", { className: "admin-ledger-list", children: [adminLedgerEntries.map((entry) => (_jsxs("button", { className: "admin-ledger-item", onClick: () => openAdminCreditLedgerDetail(entry.id).catch(() => null), children: [_jsx("span", { children: new Date(entry.created_at).toLocaleString() }), _jsxs("span", { children: ["@", entry.username] }), _jsx("span", { className: entry.delta >= 0 ? "credit-plus" : "credit-minus", children: entry.delta >= 0 ? `+${entry.delta}` : entry.delta }), _jsx("span", { children: entry.reason ?? "—" }), _jsx("span", { children: entry.ref_type ?? "—" })] }, entry.id))), !adminLedgerLoading && adminLedgerEntries.length === 0 ? (_jsx("div", { className: "muted small", children: "No ledger entries for current filter." })) : null] }), _jsxs("div", { className: "job-actions", children: [_jsx("button", { className: "action-btn ghost", disabled: adminLedgerPage <= 1, onClick: () => {
                                                                                    const next = Math.max(1, adminLedgerPage - 1);
                                                                                    setAdminLedgerPage(next);
                                                                                    refreshAdminCreditLedger(next).catch(() => null);
                                                                                }, children: "Prev" }), _jsx("button", { className: "action-btn ghost", disabled: adminLedgerPage * adminLedgerPageSize >= adminLedgerTotal, onClick: () => {
                                                                                    const next = adminLedgerPage + 1;
                                                                                    setAdminLedgerPage(next);
                                                                                    refreshAdminCreditLedger(next).catch(() => null);
                                                                                }, children: "Next" }), _jsx("button", { className: "action-btn", disabled: !adminLedgerEntries.length, onClick: exportAdminLedgerCsv, children: "Export CSV" })] })] })] })] }), _jsxs("section", { className: `panel ${adminTab === "users" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Users" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsxs("div", { className: "form-grid", children: [_jsx("div", { className: "panel-subtitle", children: "User management" }), _jsxs("div", { className: "admin-user-search", children: [_jsxs("label", { className: "form-row", children: ["Search Field", _jsxs("select", { className: "input", value: adminUserSearchField, onChange: (e) => setAdminUserSearchField(e.target.value), children: [_jsx("option", { value: "email", children: "Email" }), _jsx("option", { value: "username", children: "Username" }), _jsx("option", { value: "id", children: "User ID" })] })] }), _jsxs("label", { className: "form-row", children: ["Search Value", _jsx("input", { className: "input", placeholder: adminUserSearchField === "email"
                                                                                    ? "user@example.com"
                                                                                    : adminUserSearchField === "username"
                                                                                        ? "asatyr"
                                                                                        : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", value: adminUserSearchValue, onChange: (e) => setAdminUserSearchValue(e.target.value), onKeyDown: (e) => {
                                                                                    if (e.key === "Enter") {
                                                                                        e.preventDefault();
                                                                                        runAdminUserSearch().catch(() => null);
                                                                                    }
                                                                                } })] }), _jsx("button", { className: `action-btn ${adminUserSearchBusy ? "is-loading" : ""}`, onClick: () => runAdminUserSearch().catch(() => null), children: "Search User" }), adminUserSearchStatus ? _jsx("div", { className: "muted small", children: adminUserSearchStatus }) : null] }), adminUsers.length > 1 ? (_jsxs("div", { className: "admin-user-search-results", children: [_jsx("div", { className: "muted small", children: "Mehrere Treffer, bitte User waehlen:" }), _jsx("div", { className: "admin-user-result-list", children: adminUsers.map((result) => (_jsxs("button", { className: `admin-user-result-item ${adminUserSelectedId === result.id ? "is-active" : ""}`, onClick: () => {
                                                                                setAdminUserSelectedId(result.id);
                                                                                setAdminUserPasswordResult("");
                                                                            }, children: [_jsx("span", { children: result.username }), _jsx("span", { className: "muted small", children: result.email }), _jsx("span", { className: "muted small", children: result.id })] }, result.id))) })] })) : null, selectedAdminUser ? (_jsxs("div", { className: "admin-user-profile", children: [_jsxs("div", { className: "admin-user-profile-header", children: [_jsxs("div", { children: [_jsx("div", { className: "admin-user-name", children: selectedAdminUser.username }), _jsx("div", { className: "muted small", children: selectedAdminUser.email }), _jsx("div", { className: "muted small", children: selectedAdminUser.id })] }), _jsx("div", { className: "badge", children: selectedAdminUser.role })] }), _jsxs("div", { className: "admin-user-form-grid", children: [_jsxs("label", { className: "form-row", children: ["Role", _jsxs("select", { className: "input", value: selectedAdminUser.role, disabled: adminUserStatusBusy, onChange: async (e) => {
                                                                                            if (!token)
                                                                                                return;
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
                                                                                                if (!res.ok)
                                                                                                    return;
                                                                                                setAdminUsers((prev) => prev.map((row) => (row.id === selectedAdminUser.id ? { ...row, role } : row)));
                                                                                            }
                                                                                            finally {
                                                                                                setAdminUserStatusBusy(false);
                                                                                            }
                                                                                        }, children: [_jsx("option", { value: "admin", children: "admin" }), _jsx("option", { value: "member", children: "member" }), _jsx("option", { value: "guest", children: "guest" })] })] }), _jsxs("label", { className: "form-row", children: ["Status", _jsxs("select", { className: "input", value: selectedAdminUser.status, disabled: adminUserStatusBusy, onChange: async (e) => {
                                                                                            if (!token)
                                                                                                return;
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
                                                                                                if (!res.ok)
                                                                                                    return;
                                                                                                setAdminUsers((prev) => prev.map((row) => (row.id === selectedAdminUser.id ? { ...row, status } : row)));
                                                                                            }
                                                                                            finally {
                                                                                                setAdminUserStatusBusy(false);
                                                                                            }
                                                                                        }, children: [_jsx("option", { value: "active", children: "active" }), _jsx("option", { value: "disabled", children: "disabled" })] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Credits" }), _jsx("span", { children: selectedAdminUser.credits_balance ?? 0 })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Reserved" }), _jsx("span", { children: selectedAdminUser.credits_reserved ?? 0 })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Daily Allowance" }), _jsx("span", { children: selectedAdminUser.credits_daily_allowance ?? 0 })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "2FA" }), _jsxs("span", { children: [selectedAdminUser.twofa_enabled ? "enabled" : "disabled", selectedAdminUser.twofa_locked ? " (locked)" : ""] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Trusted IPs" }), _jsx("span", { children: selectedAdminUser.trusted_ip_count ?? 0 })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Recovery Codes" }), _jsx("span", { children: selectedAdminUser.recovery_remaining ?? 0 })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Must Change Password" }), _jsx("span", { children: selectedAdminUser.must_change_password ? "yes" : "no" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Created" }), _jsx("span", { children: selectedAdminUser.created_at ? new Date(selectedAdminUser.created_at).toLocaleString() : "-" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Updated" }), _jsx("span", { children: selectedAdminUser.updated_at ? new Date(selectedAdminUser.updated_at).toLocaleString() : "-" })] })] }), _jsxs("div", { className: "admin-user-actions", children: [_jsx("button", { className: "action-btn ghost", disabled: !selectedAdminUser.twofa_locked, onClick: async () => {
                                                                                    if (!token || !selectedAdminUser.twofa_locked)
                                                                                        return;
                                                                                    const res = await fetch(`/api/admin/users/${selectedAdminUser.id}/2fa/unlock`, {
                                                                                        method: "POST",
                                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                                    });
                                                                                    if (!res.ok)
                                                                                        return;
                                                                                    setAdminUsers((prev) => prev.map((row) => row.id === selectedAdminUser.id ? { ...row, twofa_locked: false } : row));
                                                                                }, children: "Unlock 2FA" }), _jsx("button", { className: "action-btn danger", onClick: () => {
                                                                                    if (!token)
                                                                                        return;
                                                                                    const confirmDelete = window.confirm(`Delete user ${selectedAdminUser.username}? This cannot be undone.`);
                                                                                    if (!confirmDelete)
                                                                                        return;
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
                                                                                }, children: "Delete User" })] }), _jsxs("div", { className: "admin-user-credits", children: [_jsx("div", { className: "perm-title", children: "Credits & Allowance" }), _jsxs("div", { className: "admin-user-password-grid", children: [_jsxs("label", { className: "form-row", children: ["Credit Delta (+/-)", _jsx("input", { className: "input", value: adminUserCreditsDelta, onChange: (e) => setAdminUserCreditsDelta(e.target.value), placeholder: "z.B. 25 oder -10" })] }), _jsxs("label", { className: "form-row", children: ["Daily Allowance", _jsx("input", { className: "input", value: adminUserCreditsAllowance, onChange: (e) => setAdminUserCreditsAllowance(e.target.value) })] }), _jsx("button", { className: `action-btn ${adminUserCreditsBusy ? "is-loading" : ""}`, disabled: adminUserCreditsBusy, onClick: async () => {
                                                                                            if (!token)
                                                                                                return;
                                                                                            const payload = { user_id: selectedAdminUser.id };
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
                                                                                            }
                                                                                            catch {
                                                                                                setAdminUserCreditsStatus("Update fehlgeschlagen");
                                                                                            }
                                                                                            finally {
                                                                                                setAdminUserCreditsBusy(false);
                                                                                            }
                                                                                        }, children: "Apply" })] }), adminUserCreditsStatus ? _jsx("div", { className: "muted small", children: adminUserCreditsStatus }) : null] }), _jsxs("div", { className: "admin-user-password", children: [_jsx("div", { className: "perm-title", children: "Password Reset" }), _jsxs("div", { className: "admin-user-password-grid", children: [_jsxs("label", { className: "form-row", children: ["New Password (optional)", _jsx("input", { className: "input", type: "text", placeholder: "Leer lassen = random", value: adminUserPasswordValue, onChange: (e) => setAdminUserPasswordValue(e.target.value) })] }), _jsxs("label", { className: "stat-row", children: [_jsx("span", { children: "Force change at next login" }), _jsx("input", { type: "checkbox", checked: adminUserPasswordMustChange, onChange: (e) => setAdminUserPasswordMustChange(e.target.checked) })] }), _jsx("button", { className: `action-btn ${adminUserPasswordBusy ? "is-loading" : ""}`, disabled: adminUserPasswordBusy, onClick: async () => {
                                                                                            if (!token)
                                                                                                return;
                                                                                            setAdminUserPasswordBusy(true);
                                                                                            setAdminUserPasswordResult("Reset running...");
                                                                                            try {
                                                                                                const payload = {
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
                                                                                                setAdminUsers((prev) => prev.map((row) => row.id === selectedAdminUser.id
                                                                                                    ? { ...row, must_change_password: Boolean(data.must_change_password) }
                                                                                                    : row));
                                                                                                setAdminUserPasswordValue("");
                                                                                            }
                                                                                            catch {
                                                                                                setAdminUserPasswordResult("Reset failed");
                                                                                            }
                                                                                            finally {
                                                                                                setAdminUserPasswordBusy(false);
                                                                                            }
                                                                                        }, children: "Reset Password" })] }), adminUserPasswordResult ? (_jsx("div", { className: "status-msg break-anywhere", children: adminUserPasswordResult })) : null] }), _jsxs("div", { className: "admin-user-password", children: [_jsx("div", { className: "perm-title", children: "Impersonate" }), _jsxs("div", { className: "admin-user-password-grid", children: [_jsxs("label", { className: "form-row", children: ["Admin Password (confirm)", _jsx("input", { className: "input", type: "password", value: adminUserImpersonatePassword, onChange: (e) => setAdminUserImpersonatePassword(e.target.value), placeholder: "Dein eigenes Passwort" })] }), _jsx("div", { className: "muted small", children: "Oeffnet neues Fenster als dieser User. Session endet mit Tab/Fenster." }), _jsx("button", { className: `action-btn ${adminUserImpersonateBusy ? "is-loading" : ""}`, disabled: adminUserImpersonateBusy || !adminUserImpersonatePassword, onClick: async () => {
                                                                                            if (!token)
                                                                                                return;
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
                                                                                            }
                                                                                            catch {
                                                                                                setAdminUserImpersonateStatus("Impersonate failed");
                                                                                            }
                                                                                            finally {
                                                                                                setAdminUserImpersonateBusy(false);
                                                                                            }
                                                                                        }, children: "Open as User" })] }), adminUserImpersonateStatus ? (_jsx("div", { className: "muted small", children: adminUserImpersonateStatus })) : null] }), _jsxs("div", { className: "admin-user-perms", children: [_jsx("div", { className: "perm-title", children: "Permissions" }), _jsx("div", { className: "perm-grid", children: USER_PERMISSION_DEFS.map((perm) => {
                                                                                    const isUserAdmin = selectedAdminUser.role === "admin";
                                                                                    const enabled = (selectedAdminUser.permissions ?? {})[perm.key] ?? perm.defaultEnabled;
                                                                                    const permBusyKey = `${selectedAdminUser.id}:${perm.key}`;
                                                                                    const permBusy = Boolean(adminUserPermBusy[permBusyKey]);
                                                                                    return (_jsxs("label", { className: "perm-toggle", children: [_jsx("span", { children: perm.label }), _jsx("input", { type: "checkbox", checked: enabled, disabled: isUserAdmin || permBusy, onChange: async (e) => {
                                                                                                    if (!token)
                                                                                                        return;
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
                                                                                                        if (!res.ok)
                                                                                                            return;
                                                                                                        setAdminUsers((prev) => prev.map((row) => row.id === selectedAdminUser.id
                                                                                                            ? { ...row, permissions: { ...(row.permissions ?? {}), [perm.key]: next } }
                                                                                                            : row));
                                                                                                    }
                                                                                                    finally {
                                                                                                        setAdminUserPermBusy((prev) => ({ ...prev, [permBusyKey]: false }));
                                                                                                    }
                                                                                                } })] }, perm.key));
                                                                                }) }), selectedAdminUser.role === "admin" ? (_jsx("div", { className: "muted small", children: "Admin has full access." })) : null] })] })) : (_jsx("div", { className: "muted small", children: "Noch kein User geladen. Bitte Suche ausfuehren." })), _jsx("div", { className: "muted small", children: "Hinweis: User-Liste wird absichtlich nicht global geladen. Suche erfolgt gezielt ueber Formular." })] })] }), _jsxs("section", { className: `panel ${adminTab === "applications" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Applications" }), _jsx("span", { className: "badge", children: "Review" })] }), _jsx("div", { className: "form-grid", children: adminApplications.length === 0 ? (_jsx("div", { className: "muted small", children: "No applications yet." })) : (adminApplications.map((app) => (_jsxs("div", { className: "user-admin-row", children: [_jsxs("div", { className: "user-admin-meta", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: app.display_name || "Applicant" }), _jsx("span", { children: app.email })] }), _jsxs("div", { className: "stat-row", children: [_jsxs("span", { children: ["Status ", app.status] }), _jsx("span", { children: new Date(app.created_at).toLocaleString() })] }), app.handle ? _jsxs("div", { className: "muted small", children: ["Username: ", app.handle] }) : null, app.links ? _jsxs("div", { className: "muted small", children: ["Links: ", app.links] }) : null, app.message ? _jsxs("div", { className: "muted small", children: ["\"", app.message, "\""] }) : null] }), _jsx("div", { className: "user-admin-actions", children: _jsxs("div", { className: "user-admin-controls", children: [_jsx("button", { className: "action-btn", onClick: () => {
                                                                                    fetch(`/api/admin/applications/${app.id}`, {
                                                                                        method: "PUT",
                                                                                        headers: {
                                                                                            "Content-Type": "application/json",
                                                                                            Authorization: `Bearer ${token}`
                                                                                        },
                                                                                        body: JSON.stringify({ status: "approved" })
                                                                                    }).then(() => setAdminApplications((prev) => prev.map((row) => (row.id === app.id ? { ...row, status: "approved" } : row))));
                                                                                }, children: "Approve" }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                    fetch(`/api/admin/applications/${app.id}`, {
                                                                                        method: "PUT",
                                                                                        headers: {
                                                                                            "Content-Type": "application/json",
                                                                                            Authorization: `Bearer ${token}`
                                                                                        },
                                                                                        body: JSON.stringify({ status: "rejected" })
                                                                                    }).then(() => setAdminApplications((prev) => prev.map((row) => (row.id === app.id ? { ...row, status: "rejected" } : row))));
                                                                                }, children: "Reject" }), app.status === "rejected" ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                    fetch(`/api/admin/applications/${app.id}`, {
                                                                                        method: "DELETE",
                                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                                    }).then(() => setAdminApplications((prev) => prev.filter((row) => row.id !== app.id)));
                                                                                }, children: "Delete" })) : null] }) })] }, app.id)))) })] }), _jsxs("section", { className: `panel ${adminTab === "models" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Model Registry" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsxs("div", { className: "form-grid", children: [_jsx("button", { className: "action-btn", onClick: () => {
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
                                                                }, children: "Reload FTP Models" }), _jsxs("label", { className: "form-row", children: ["Kind", _jsxs("select", { className: "input", value: newModel.kind, onChange: (e) => setNewModel({ ...newModel, kind: e.target.value }), children: [_jsx("option", { value: "training_model", children: "training_model" }), _jsx("option", { value: "base_model", children: "base_model" }), _jsx("option", { value: "lora", children: "lora" })] })] }), _jsxs("label", { className: "form-row", children: ["Name", _jsx("input", { className: "input", value: newModel.name, onChange: (e) => setNewModel({ ...newModel, name: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["Version", _jsx("input", { className: "input", value: newModel.version, onChange: (e) => setNewModel({ ...newModel, version: e.target.value }) })] }), _jsxs("label", { className: "form-row", children: ["File Path", _jsx("input", { className: "input", value: newModel.file_path, onChange: (e) => setNewModel({ ...newModel, file_path: e.target.value }) })] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                    if (!newModel.name || !newModel.file_path)
                                                                        return;
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
                                                                }, children: "Add Model" }), _jsx("div", { className: "form-row", children: "Registry Entries" }), modelRegistry.map((model) => (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: model.name }), _jsx("span", { children: model.kind })] }, model.id)))] })] }), _jsxs("section", { className: `panel ${adminTab === "archives" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Archive Restore" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "archive-controls", children: [_jsxs("label", { className: "form-row", children: ["Search", _jsx("input", { className: "input", value: adminArchiveQuery, onChange: (e) => setAdminArchiveQuery(e.target.value), placeholder: "label or path" })] }), _jsxs("label", { className: "form-row", children: ["Type", _jsxs("select", { className: "input", value: adminArchiveTypeFilter, onChange: (e) => setAdminArchiveTypeFilter(e.target.value), children: [_jsx("option", { value: "all", children: "all" }), _jsx("option", { value: "pipeline_run", children: "pipeline_run" }), _jsx("option", { value: "training_run", children: "training_run" }), _jsx("option", { value: "generation_job", children: "generation_job" }), _jsx("option", { value: "lora", children: "lora" }), _jsx("option", { value: "gallery_image", children: "gallery_image" }), _jsx("option", { value: "preview", children: "preview" }), _jsx("option", { value: "training_output", children: "training_output" }), _jsx("option", { value: "pipeline_output", children: "pipeline_output" }), _jsx("option", { value: "generation_output", children: "generation_output" }), _jsx("option", { value: "file_cleanup", children: "file_cleanup" })] })] }), _jsxs("label", { className: "form-row", children: ["Reason", _jsxs("select", { className: "input", value: adminArchiveReasonFilter, onChange: (e) => setAdminArchiveReasonFilter(e.target.value), children: [_jsx("option", { value: "all", children: "all" }), _jsx("option", { value: "delete_pipeline_run", children: "delete_pipeline_run" }), _jsx("option", { value: "delete_training_run", children: "delete_training_run" }), _jsx("option", { value: "delete_generation_job", children: "delete_generation_job" }), _jsx("option", { value: "delete_lora", children: "delete_lora" }), _jsx("option", { value: "delete_image", children: "delete_image" }), _jsx("option", { value: "cleanup_lora_preview", children: "cleanup_lora_preview" }), _jsx("option", { value: "delete_unused", children: "delete_unused" })] })] }), _jsxs("label", { className: "form-row", children: ["Origin", _jsxs("select", { className: "input", value: adminArchiveOriginFilter, onChange: (e) => setAdminArchiveOriginFilter(e.target.value), children: [_jsx("option", { value: "all", children: "all" }), _jsx("option", { value: "auto", children: "auto" }), _jsx("option", { value: "manual", children: "manual" })] })] }), _jsxs("label", { className: "form-row", children: ["User ID", _jsx("input", { className: "input", value: adminArchiveUser, onChange: (e) => setAdminArchiveUser(e.target.value), placeholder: "optional" })] }), _jsxs("label", { className: "inline archive-toggle", children: [_jsx("input", { type: "checkbox", checked: adminArchiveOverwrite, onChange: (e) => setAdminArchiveOverwrite(e.target.checked) }), _jsx("span", { children: "Overwrite existing" })] }), _jsx("button", { className: "action-btn ghost", onClick: () => refreshAdminArchives(), children: "Refresh" }), _jsxs("label", { className: "form-row", children: ["Retention (days)", _jsx("input", { className: "input", type: "number", min: 1, value: adminArchiveRetentionDays, onChange: (e) => setAdminArchiveRetentionDays(e.target.value) })] }), _jsx("button", { className: "action-btn ghost", onClick: saveArchiveRetentionDays, children: "Save Retention" }), _jsx("button", { className: "action-btn danger", onClick: pruneArchivesNow, children: "Archive Prune" })] }), _jsxs("div", { className: "muted small", children: ["Archived deletions are retained for ", adminArchiveRetentionDays || "30", " day(s). Restores re-create files and register them in file registry."] }), adminArchiveMessage ? _jsx("div", { className: "muted small", children: adminArchiveMessage }) : null, adminArchiveLoading ? (_jsx("div", { className: "muted small", children: "Loading archives..." })) : (_jsx("div", { className: "archive-list", children: adminArchives
                                                                    .filter((item) => adminArchiveTypeFilter === "all" ? true : (item.type ?? "unknown") === adminArchiveTypeFilter)
                                                                    .filter((item) => adminArchiveReasonFilter === "all"
                                                                    ? true
                                                                    : (item.reason ?? "unknown") === adminArchiveReasonFilter)
                                                                    .filter((item) => adminArchiveOriginFilter === "all"
                                                                    ? true
                                                                    : (item.origin ?? "auto") === adminArchiveOriginFilter).length === 0 ? (_jsx("div", { className: "muted small", children: "No archives found." })) : (adminArchives
                                                                    .filter((item) => adminArchiveTypeFilter === "all"
                                                                    ? true
                                                                    : (item.type ?? "unknown") === adminArchiveTypeFilter)
                                                                    .filter((item) => adminArchiveReasonFilter === "all"
                                                                    ? true
                                                                    : (item.reason ?? "unknown") === adminArchiveReasonFilter)
                                                                    .filter((item) => adminArchiveOriginFilter === "all"
                                                                    ? true
                                                                    : (item.origin ?? "auto") === adminArchiveOriginFilter)
                                                                    .map((item) => (_jsxs("div", { className: "archive-row", children: [_jsxs("div", { children: [_jsx("div", { className: "archive-title", children: item.display_name ?? item.label ?? "archive" }), _jsx("div", { className: "muted small", children: item.path }), _jsxs("div", { className: "archive-meta", children: [_jsx("span", { children: item.type ?? "unknown" }), _jsx("span", { children: item.reason ?? "unknown" }), _jsx("span", { children: item.origin ?? "auto" }), _jsx("span", { children: item.source_name ?? item.source_id ?? "—" }), _jsx("span", { children: item.user_id ?? "system" }), _jsx("span", { children: formatBytes(item.size_bytes ?? 0) }), _jsxs("span", { children: [item.entry_count ?? 0, " items"] }), _jsx("span", { children: new Date(item.modified_at).toLocaleString() })] })] }), _jsxs("div", { className: "archive-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: () => openArchiveDetails(item.path), children: "Details" }), _jsx("button", { className: "action-btn danger", onClick: () => {
                                                                                        if (!window.confirm("Permanently delete this archive? This cannot be undone."))
                                                                                            return;
                                                                                        deleteAdminArchive(item.path);
                                                                                    }, children: "Remove" }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                                        if (!window.confirm("Restore this archive?"))
                                                                                            return;
                                                                                        restoreAdminArchive(item.path);
                                                                                    }, children: "Restore" })] })] }, item.path)))) }))] })] }), _jsxs("section", { className: `panel ${adminTab === "notifications" ? "" : "is-hidden"}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Notifications" }), _jsx("span", { className: "badge", children: "Admin" })] }), _jsxs("div", { className: "settings-grid", children: [_jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Enable" }), _jsx("span", { className: "muted small", children: "Master switch plus per-event controls." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Notifications enabled" }), _jsx("div", { className: "muted small", children: "Master switch for all notifications." })] }), _jsxs("select", { className: "input", value: notifyEnabled ? "true" : "false", onChange: (e) => setNotifyEnabled(e.target.value === "true"), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Instance label" }), _jsx("div", { className: "muted small", children: "Shown in notification footers." })] }), _jsx("input", { className: "input", value: instanceLabel, onChange: (e) => setInstanceLabel(e.target.value) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Instance URL" }), _jsx("div", { className: "muted small", children: "Link target for notifications." })] }), _jsx("input", { className: "input", value: instanceUrl, onChange: (e) => setInstanceUrl(e.target.value) })] })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Channels" }), _jsx("span", { className: "muted small", children: "Choose which channels receive notifications." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Email (SMTP)" }), _jsx("div", { className: "muted small", children: "Enable SMTP delivery." })] }), _jsxs("select", { className: "input", value: notifyChannelEmail ? "true" : "false", onChange: (e) => setNotifyChannelEmail(e.target.value === "true"), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Slack" }), _jsx("div", { className: "muted small", children: "Webhook delivery." })] }), _jsxs("select", { className: "input", value: notifyChannelSlack ? "true" : "false", onChange: (e) => setNotifyChannelSlack(e.target.value === "true"), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Discord" }), _jsx("div", { className: "muted small", children: "Webhook delivery." })] }), _jsxs("select", { className: "input", value: notifyChannelDiscord ? "true" : "false", onChange: (e) => setNotifyChannelDiscord(e.target.value === "true"), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Generic Webhook" }), _jsx("div", { className: "muted small", children: "POST JSON payload to your endpoint." })] }), _jsxs("select", { className: "input", value: notifyChannelWebhook ? "true" : "false", onChange: (e) => setNotifyChannelWebhook(e.target.value === "true"), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] }), _jsxs("label", { className: "form-row", children: ["Slack webhook URL", _jsx("input", { className: "input", value: slackWebhookUrl, onChange: (e) => setSlackWebhookUrl(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Discord webhook URL", _jsx("input", { className: "input", value: discordWebhookUrl, onChange: (e) => setDiscordWebhookUrl(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Webhook URL", _jsx("input", { className: "input", value: webhookUrl, onChange: (e) => setWebhookUrl(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Webhook secret", _jsx("input", { className: "input", value: webhookSecret, onChange: (e) => setWebhookSecret(e.target.value) })] })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "Events" }), _jsx("span", { className: "muted small", children: "Choose which events trigger notifications." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Job finished" }), _jsx("div", { className: "muted small", children: "Run transitions to done." })] }), _jsxs("select", { className: "input", value: notifyJobFinish ? "true" : "false", onChange: (e) => setNotifyJobFinish(e.target.value === "true"), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Job failed" }), _jsx("div", { className: "muted small", children: "Run transitions to failed." })] }), _jsxs("select", { className: "input", value: notifyJobFailed ? "true" : "false", onChange: (e) => setNotifyJobFailed(e.target.value === "true"), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Queue drained" }), _jsx("div", { className: "muted small", children: "No active runs and workers idle." })] }), _jsxs("select", { className: "input", value: notifyQueueFinish ? "true" : "false", onChange: (e) => setNotifyQueueFinish(e.target.value === "true"), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "group-head", children: [_jsx("span", { children: "SMTP" }), _jsx("span", { className: "muted small", children: "Credentials for email delivery." })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Host" }), _jsx("div", { className: "muted small", children: "SMTP server hostname." })] }), _jsx("input", { className: "input", value: smtpSettings.smtp_host, onChange: (e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Port" }), _jsx("div", { className: "muted small", children: "587 (STARTTLS) or 465 (SSL)." })] }), _jsx("input", { className: "input", value: smtpSettings.smtp_port, onChange: (e) => setSmtpSettings({ ...smtpSettings, smtp_port: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Username" }), _jsx("div", { className: "muted small", children: "Leave empty if not required." })] }), _jsx("input", { className: "input", value: smtpSettings.smtp_user, onChange: (e) => setSmtpSettings({ ...smtpSettings, smtp_user: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Password" }), _jsx("div", { className: "muted small", children: "Stored in DB (masked in UI)." })] }), _jsx("input", { className: "input", type: "password", value: smtpSettings.smtp_pass, onChange: (e) => setSmtpSettings({ ...smtpSettings, smtp_pass: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "From" }), _jsx("div", { className: "muted small", children: "Sender address." })] }), _jsx("input", { className: "input", value: smtpSettings.smtp_from, onChange: (e) => setSmtpSettings({ ...smtpSettings, smtp_from: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "To" }), _jsx("div", { className: "muted small", children: "Recipient address." })] }), _jsx("input", { className: "input", value: smtpTo, onChange: (e) => setSmtpTo(e.target.value) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Base URL" }), _jsx("div", { className: "muted small", children: "Reset links base." })] }), _jsx("input", { className: "input", value: smtpSettings.smtp_base_url, onChange: (e) => setSmtpSettings({ ...smtpSettings, smtp_base_url: e.target.value }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Use SSL" }), _jsx("div", { className: "muted small", children: "Implicit SSL (disable STARTTLS)." })] }), _jsxs("select", { className: "input", value: smtpSettings.smtp_ssl ? "true" : "false", onChange: (e) => setSmtpSettings({ ...smtpSettings, smtp_ssl: e.target.value === "true" }), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Use TLS" }), _jsx("div", { className: "muted small", children: "STARTTLS upgrade for SMTP." })] }), _jsxs("select", { className: "input", value: smtpSettings.smtp_tls ? "true" : "false", onChange: (e) => setSmtpSettings({ ...smtpSettings, smtp_tls: e.target.value === "true" }), children: [_jsx("option", { value: "false", children: "false" }), _jsx("option", { value: "true", children: "true" })] })] })] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                    const entries = [
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
                                                                    Promise.all(entries.map(([key, value]) => fetch("/api/settings/admin", {
                                                                        method: "PUT",
                                                                        headers: {
                                                                            "Content-Type": "application/json",
                                                                            Authorization: `Bearer ${token}`
                                                                        },
                                                                        body: JSON.stringify({ key, value })
                                                                    }))).then(() => null);
                                                                }, children: "Save Notifications" })] })] })] })] })) : null] }), token && !isMobileRouteActive ? (_jsx("div", { className: `mini-dm ${miniDmOpen ? "is-open" : ""}`, children: !miniDmOpen ? (_jsxs("button", { className: "mini-dm-toggle", onClick: () => {
                                setMiniDmOpen(true);
                                setMiniDmMode("threads");
                                refreshDmThreads();
                                refreshDmUnread();
                            }, children: [_jsx("span", { children: "Messenger" }), dmUnreadCount > 0 ? _jsx("span", { className: "badge", children: dmUnreadCount }) : null] })) : (_jsxs("div", { className: "mini-dm-panel", children: [_jsxs("div", { className: "mini-dm-head", children: [miniDmMode === "chat" ? (_jsx("button", { className: "action-btn ghost", onClick: () => setMiniDmMode("threads"), children: "Back" })) : (_jsx("span", { children: "Threads" })), _jsxs("div", { className: "job-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                        refreshDmThreads();
                                                        refreshDmUnread();
                                                        if (miniDmThreadId) {
                                                            refreshDmMessages(miniDmThreadId, { incremental: true });
                                                        }
                                                    }, children: "Refresh" }), _jsx("button", { className: "action-btn ghost", onClick: () => setMiniDmOpen(false), children: "Close" })] })] }), _jsxs("div", { className: `mini-dm-slider ${miniDmMode === "chat" ? "is-chat" : "is-threads"}`, children: [_jsxs("div", { className: "mini-dm-slide mini-dm-threads", children: [_jsx("input", { className: "input", placeholder: "Search threads...", value: miniDmQuery, onChange: (e) => setMiniDmQuery(e.target.value) }), _jsxs("div", { className: "mini-dm-thread-list", children: [miniDmFilteredThreads.map((thread) => (_jsxs("button", { className: `mini-dm-thread-item ${miniDmThreadId === thread.id ? "is-active" : ""}`, onClick: () => {
                                                                setMiniDmThreadId(thread.id);
                                                                setDmActiveThreadId(thread.id);
                                                                refreshDmMessages(thread.id);
                                                                setMiniDmMode("chat");
                                                            }, children: [_jsx("span", { children: thread.peer_display_name || thread.peer_username }), Number(thread.unread_count ?? 0) > 0 ? _jsx("span", { className: "badge", children: thread.unread_count }) : null] }, thread.id))), !miniDmFilteredThreads.length ? _jsx("div", { className: "muted small", children: "No threads." }) : null] })] }), _jsxs("div", { className: "mini-dm-slide mini-dm-chat", children: [_jsx("div", { className: "mini-dm-chat-title muted small", children: miniDmActiveThread ? `@${miniDmActiveThread.peer_username}` : "No thread selected" }), miniDmActiveThread ? (_jsxs("div", { className: "job-actions", children: [miniDmActiveThread.blocked_by_me ? (_jsx("button", { className: "action-btn ghost", onClick: () => unblockDmUser(miniDmActiveThread.peer_user_id), children: "Unblock" })) : (_jsx("button", { className: "action-btn danger", onClick: () => blockDmUser(miniDmActiveThread.peer_user_id), children: "Block" })), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                deleteDmThread(miniDmActiveThread.id);
                                                                setMiniDmMode("threads");
                                                            }, children: "Delete" })] })) : null, _jsxs("div", { className: "mini-dm-message-list", children: [dmMessages.map((message) => {
                                                            const mine = message.sender_user_id === user?.id;
                                                            return (_jsx("div", { className: `mini-dm-bubble ${mine ? "is-mine" : "is-peer"}`, children: _jsx("div", { children: message.body }) }, message.id));
                                                        }), !dmMessages.length ? _jsx("div", { className: "muted small", children: "No messages yet." }) : null] }), _jsxs("div", { className: "mini-dm-compose", children: [_jsx("textarea", { className: "input", rows: 2, value: dmDraft, onChange: (e) => setDmDraft(e.target.value), placeholder: miniDmActiveThread ? `Write to @${miniDmActiveThread.peer_username}` : "Write message..." }), _jsxs("div", { className: "job-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: () => setMiniDmEmojiOpen((prev) => !prev), children: "Emoji" }), _jsx("button", { className: "action-btn", onClick: () => sendDmMessage({ threadId: miniDmThreadId }), children: "Send" })] }), miniDmEmojiOpen ? (_jsx("div", { className: "mini-dm-emoji-grid", children: DM_EMOJI_SET.map((emoji) => (_jsx("button", { className: "mini-dm-emoji-btn", onClick: () => setDmDraft((prev) => `${prev}${emoji}`), children: emoji }, `mini-${emoji}`))) })) : null] })] })] })] })) })) : null, adminArchiveDetailOpen ? (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "archive-details-modal", children: [_jsxs("div", { className: "manual-header", children: [_jsxs("div", { children: [_jsx("div", { className: "title", children: "Archive Details" }), _jsx("div", { className: "muted small", children: adminArchiveDetail?.archive?.display_name ?? "Loading..." })] }), _jsx("button", { className: "action-btn ghost", onClick: () => setAdminArchiveDetailOpen(false), children: "Close" })] }), _jsx("div", { className: "archive-details-body", children: !adminArchiveDetail ? (_jsx("div", { className: "muted small", children: "Loading archive details..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Overview" }), _jsxs("div", { className: "archive-detail-grid", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Type" }), _jsx("span", { children: adminArchiveDetail.archive?.type ?? "unknown" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Reason" }), _jsx("span", { children: adminArchiveDetail.archive?.reason ?? "unknown" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Origin" }), _jsx("span", { children: adminArchiveDetail.archive?.origin ?? "auto" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Source" }), _jsx("span", { children: adminArchiveDetail.archive?.source_name ?? adminArchiveDetail.archive?.source_id ?? "—" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "User" }), _jsx("span", { children: adminArchiveDetail.archive?.user_id ?? "system" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Items" }), _jsx("span", { children: adminArchiveDetail.archive?.entry_count ?? 0 })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Size" }), _jsx("span", { children: formatBytes(adminArchiveDetail.archive?.size_bytes ?? 0) })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Modified" }), _jsx("span", { children: adminArchiveDetail.archive?.modified_at
                                                                            ? new Date(adminArchiveDetail.archive.modified_at).toLocaleString()
                                                                            : "—" })] })] }), _jsx("div", { className: "muted small", children: adminArchiveDetail.archive?.path })] }), _jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Entries" }), _jsx("input", { className: "input", placeholder: "Filter entries", value: adminArchiveEntryFilter, onChange: (e) => setAdminArchiveEntryFilter(e.target.value) }), _jsx("div", { className: "archive-entry-list", children: adminArchiveDetail.entries
                                                            .filter((entry) => adminArchiveEntryFilter.trim()
                                                            ? entry.path.toLowerCase().includes(adminArchiveEntryFilter.trim().toLowerCase())
                                                            : true)
                                                            .map((entry) => (_jsxs("div", { className: "archive-entry-row", children: [_jsx("span", { children: entry.path }), _jsx("span", { children: entry.type })] }, `${entry.path}-${entry.name}`))) })] }), _jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Actions" }), _jsx("button", { className: "action-btn", onClick: () => {
                                                            if (!adminArchiveDetail.archive?.path)
                                                                return;
                                                            if (!window.confirm("Restore this archive?"))
                                                                return;
                                                            restoreAdminArchive(adminArchiveDetail.archive.path);
                                                        }, children: "Restore Archive" }), _jsx("button", { className: "action-btn danger", onClick: () => {
                                                            if (!adminArchiveDetail?.archive?.path)
                                                                return;
                                                            if (!window.confirm("Permanently delete this archive? This cannot be undone."))
                                                                return;
                                                            deleteAdminArchive(adminArchiveDetail.archive.path);
                                                            setAdminArchiveDetailOpen(false);
                                                        }, children: "Remove Archive" })] })] })) })] }) })) : null, adminLedgerDetailOpen ? (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "archive-details-modal", children: [_jsxs("div", { className: "manual-header", children: [_jsxs("div", { children: [_jsx("div", { className: "title", children: "Credit Ledger Detail" }), _jsxs("div", { className: "muted small job-actions", children: [_jsx("span", { children: adminLedgerDetail?.entry?.id ?? "Loading..." }), adminLedgerDetail?.entry?.id ? (_jsx("button", { className: "action-btn ghost", onClick: () => copyText(adminLedgerDetail.entry.id).catch(() => null), children: "Copy" })) : null] })] }), _jsx("button", { className: "action-btn ghost", onClick: () => setAdminLedgerDetailOpen(false), children: "Close" })] }), _jsx("div", { className: "archive-details-body", children: !adminLedgerDetail ? (_jsx("div", { className: "muted small", children: "Loading ledger detail..." })) : (_jsxs(_Fragment, { children: [adminLedgerCopyStatus ? _jsx("div", { className: "muted small", children: adminLedgerCopyStatus }) : null, _jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Entry" }), _jsxs("div", { className: "archive-detail-grid", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "User" }), _jsxs("span", { children: ["@", adminLedgerDetail.entry.username] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "User ID" }), _jsxs("span", { className: "job-actions", children: [_jsx("span", { children: adminLedgerDetail.entry.user_id }), _jsx("button", { className: "action-btn ghost", onClick: () => copyText(adminLedgerDetail.entry.user_id).catch(() => null), children: "Copy" })] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Email" }), _jsx("span", { children: adminLedgerDetail.entry.email })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Delta" }), _jsx("span", { className: adminLedgerDetail.entry.delta >= 0 ? "credit-plus" : "credit-minus", children: adminLedgerDetail.entry.delta >= 0
                                                                            ? `+${adminLedgerDetail.entry.delta}`
                                                                            : adminLedgerDetail.entry.delta })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Reason" }), _jsx("span", { children: adminLedgerDetail.entry.reason ?? "—" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Ref Type" }), _jsx("span", { children: adminLedgerDetail.entry.ref_type ?? "—" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Ref ID" }), _jsxs("span", { className: "job-actions", children: [_jsx("span", { children: adminLedgerDetail.entry.ref_id ?? "—" }), adminLedgerDetail.entry.ref_id ? (_jsx("button", { className: "action-btn ghost", onClick: () => copyText(String(adminLedgerDetail.entry.ref_id)).catch(() => null), children: "Copy" })) : null] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Created" }), _jsx("span", { children: new Date(adminLedgerDetail.entry.created_at).toLocaleString() })] })] })] }), _jsxs("div", { className: "detail-group", children: [_jsx("div", { className: "detail-title", children: "Matched Intent (best effort)" }), adminLedgerDetail.intent ? (_jsx("pre", { className: "archive-manifest", children: JSON.stringify(adminLedgerDetail.intent, null, 2) })) : (_jsx("div", { className: "muted small", children: "No matching processed intent found." }))] })] })) })] }) })) : null, trainerWizardOpen ? (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "trainer-modal", children: [_jsxs("div", { className: "manual-header", children: [_jsxs("div", { children: [_jsx("div", { className: "title", children: "Training Wizard" }), _jsxs("div", { className: "muted small", children: ["Step ", trainerWizardStep + 1, " of ", wizardSteps.length, " \u00B7 ", wizardStepLabel] })] }), _jsx("button", { className: "action-btn ghost", onClick: () => closeTrainerWizard(), children: "Cancel" })] }), _jsxs("div", { className: "trainer-body", children: [_jsx("div", { className: "wizard-steps", children: wizardSteps.map((step, idx) => (_jsxs("div", { className: `wizard-step ${idx === trainerWizardStep ? "active" : idx < trainerWizardStep ? "complete" : ""}`, children: [_jsx("span", { className: "wizard-index", children: idx + 1 }), _jsx("span", { children: step })] }, `${step}-${idx}`))) }), _jsxs("div", { className: "wizard-content", children: [trainerWizardStep === 0 ? (_jsxs("div", { className: "wizard-mode-grid", children: [_jsxs("button", { className: "wizard-card", onClick: () => selectTrainerMode("single"), children: [_jsx("div", { className: "wizard-card-title", children: "Single Model Training" }), _jsx("div", { className: "muted small", children: "One dataset ZIP. The model name becomes the trigger (normalized to lowercase)." })] }), _jsxs("button", { className: "wizard-card", onClick: () => selectTrainerMode("batch"), children: [_jsx("div", { className: "wizard-card-title", children: "Batch Training" }), _jsx("div", { className: "muted small", children: "Multiple ZIPs. Each ZIP filename becomes a trigger." })] })] })) : null, trainerWizardMode === "single" && trainerWizardStep === 1 ? (_jsxs("div", { className: "wizard-section", children: [_jsx("div", { className: "wizard-section-title", children: "Model Identity" }), _jsxs("div", { className: "wizard-grid", children: [_jsxs("label", { className: "form-row", children: ["Model name (Trigger)", _jsx("input", { className: "input", value: trainerName, onChange: (e) => setTrainerName(e.target.value), placeholder: "e.g. my_cool_model" })] }), _jsx("div", { className: "wizard-hint", children: "Allowed: a-z, 0-9, \"_\" or \"-\" only. No spaces. Length 3-64. Trigger is written into tags." }), !singleNameLengthValid && trainerName.trim() ? (_jsx("div", { className: "wizard-warning", children: "Name must be 3-64 characters after normalization." })) : null, trainerName.trim() && !isValidTriggerName(normalizedSingleName) ? (_jsx("div", { className: "wizard-warning", children: "Invalid characters detected. Use letters/numbers/_/- only." })) : null, singleTriggerDuplicate ? (_jsxs("div", { className: "wizard-warning", children: ["Trigger already exists: ", normalizedSingleName, ". You can still proceed in Review."] })) : null, _jsxs("div", { className: "wizard-preview", children: [_jsx("span", { children: "Trigger preview" }), _jsx("strong", { children: normalizedSingleName || "-" })] }), _jsxs("label", { className: "form-row", children: ["Description", _jsx("textarea", { className: "input", rows: 2, value: trainerDescription, onChange: (e) => setTrainerDescription(e.target.value), placeholder: "Short description (optional)." })] }), _jsxs("label", { className: "form-row", children: ["Notes", _jsx("textarea", { className: "input", rows: 2, value: trainerNotes, onChange: (e) => setTrainerNotes(e.target.value), placeholder: "Internal notes (optional)." })] })] })] })) : null, trainerWizardMode === "single" && trainerWizardStep === 2 ? (_jsxs("div", { className: "wizard-section", children: [_jsx("div", { className: "wizard-section-title", children: "Upload Dataset ZIP" }), _jsxs("div", { className: "wizard-grid", children: [_jsxs("label", { className: "form-row", children: ["ZIP file (exactly one)", _jsx("input", { className: "input", type: "file", accept: ".zip,application/zip,application/x-zip-compressed", onChange: (e) => {
                                                                                stageFiles(e.target.files);
                                                                                if (e.currentTarget)
                                                                                    e.currentTarget.value = "";
                                                                            } })] }), _jsx("div", { className: "wizard-hint", children: "We accept a single ZIP. Remove extras before continuing." }), stagedContainsVideos ? (_jsxs("div", { className: "wizard-warning", children: ["ATTENTION: Detected ", stagedVideoCount, " video file(s) in staged ZIP."] })) : null, stagedUploads.length === 0 ? _jsx("div", { className: "wizard-warning", children: "No ZIP staged yet." }) : null, stagedUploads.length > 1 ? (_jsx("div", { className: "wizard-warning", children: "Only one ZIP allowed for single-model training." })) : null, _jsx("div", { className: "staged-list", children: stagedUploads.length === 0 ? (_jsx("div", { className: "muted small", children: "Drop a ZIP to start staging." })) : (stagedUploads.map((upload) => (_jsxs("div", { className: "staged-item", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: upload.name }), _jsx("div", { className: "muted small", children: formatBytes(upload.size) })] }), _jsx("button", { className: "action-btn ghost", onClick: () => removeStaged(upload.id), children: "Remove" })] }, upload.id)))) }), _jsxs("div", { className: "wizard-preview-list", children: [_jsx("div", { className: "wizard-section-title", children: "Trigger preview" }), stagedUploads.length === 0 ? (_jsx("div", { className: "muted small", children: "Waiting for ZIP." })) : (stagedUploads.map((upload) => (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: upload.name }), _jsx("span", { children: deriveZipTrigger(upload.name) })] }, `preview-${upload.id}`))))] })] })] })) : null, trainerWizardMode === "batch" && trainerWizardStep === 1 ? (_jsxs("div", { className: "wizard-section", children: [_jsx("div", { className: "wizard-section-title", children: "Upload Batch ZIPs" }), _jsxs("div", { className: "wizard-grid", children: [_jsxs("label", { className: "form-row", children: ["ZIP files (max ", wizardMaxBatch, ")", _jsx("input", { className: "input", type: "file", accept: ".zip,application/zip,application/x-zip-compressed", multiple: true, onChange: (e) => {
                                                                                stageFiles(e.target.files);
                                                                                if (e.currentTarget)
                                                                                    e.currentTarget.value = "";
                                                                            } })] }), _jsx("div", { className: "wizard-hint", children: "Trigger = ZIP filename (normalized, lowercase). Invalid names are rejected." }), stagedContainsVideos ? (_jsxs("div", { className: "wizard-warning", children: ["ATTENTION: Detected ", stagedVideoCount, " video file(s) in staged ZIPs."] })) : null, batchLimitExceeded ? (_jsxs("div", { className: "wizard-warning", children: ["Batch limit exceeded. Max ", wizardMaxBatch, " ZIPs per run."] })) : null, batchInvalidNames.length > 0 ? (_jsxs("div", { className: "wizard-warning", children: ["Invalid ZIP names: ", batchInvalidNames.join(", ")] })) : null, batchInternalDuplicates.length > 0 ? (_jsxs("div", { className: "wizard-warning", children: ["Duplicate triggers inside batch: ", batchInternalDuplicates.join(", ")] })) : null, batchDuplicatesExisting.length > 0 ? (_jsxs("div", { className: "wizard-warning", children: ["Existing trigger(s) found: ", batchDuplicatesExisting
                                                                            .map((info) => info.normalized)
                                                                            .join(", ")] })) : null, _jsx("div", { className: "staged-list", children: stagedUploads.length === 0 ? (_jsx("div", { className: "muted small", children: "Drop ZIPs to start staging." })) : (stagedUploads.map((upload) => (_jsxs("div", { className: "staged-item", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: upload.name }), _jsx("div", { className: "muted small", children: formatBytes(upload.size) })] }), _jsx("button", { className: "action-btn ghost", onClick: () => removeStaged(upload.id), children: "Remove" })] }, upload.id)))) }), _jsxs("div", { className: "wizard-preview-list", children: [_jsx("div", { className: "wizard-section-title", children: "Trigger preview" }), batchTriggerInfo.length === 0 ? (_jsx("div", { className: "muted small", children: "Waiting for ZIPs." })) : (batchTriggerInfo.map((info) => (_jsxs("div", { className: `stat-row ${info.valid ? "" : "stat-row-error"}`, children: [_jsx("span", { children: info.name }), _jsx("span", { children: info.normalized || "-" })] }, `preview-${info.id}`))))] })] })] })) : null, trainerWizardMode &&
                                                    ((trainerWizardMode === "single" && trainerWizardStep === 3) ||
                                                        (trainerWizardMode === "batch" && trainerWizardStep === 2)) ? (_jsxs("div", { className: "wizard-section", children: [_jsx("div", { className: "wizard-section-title", children: "Training & Performance \u2022 Input & Processing" }), _jsxs("div", { className: "wizard-grid two-col", children: [_jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Training & Performance" }), _jsx("span", { className: "badge", children: "GPU / Profile" })] }), _jsxs("div", { className: "settings-grid", children: [_jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Train" }), _jsx("div", { className: "muted small", children: "Run LoRA training on finished dataset." })] }), _jsx("input", { type: "checkbox", checked: runConfig.train, onChange: (e) => setRunConfig({ ...runConfig, train: e.target.checked }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Use GPU" }), _jsx("div", { className: "muted small", children: "Accelerate autotagging when available." })] }), _jsx("input", { type: "checkbox", checked: runConfig.gpu, onChange: (e) => setRunConfig({ ...runConfig, gpu: e.target.checked }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Train profile" }), _jsx("div", { className: "muted small", children: "Training recipe for LoRA runs." })] }), _jsxs("select", { className: "input", value: runConfig.trainProfile, onChange: (e) => setRunConfig({ ...runConfig, trainProfile: e.target.value }), children: [_jsx("option", { value: "", children: "Select profile" }), trainProfiles.map((profile) => (_jsx("option", { value: profile.name, children: profile.label ?? profile.name }, profile.id)))] })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Base model" }), _jsx("div", { className: "muted small", children: "Model used for training." })] }), _jsxs("select", { className: "input", value: runConfig.baseModelId, onChange: (e) => setRunConfig({ ...runConfig, baseModelId: e.target.value }), children: [_jsx("option", { value: "", children: "Auto (first training model)" }), modelRegistry
                                                                                                    .filter((model) => model.kind === "training_model" || model.kind === "base_model")
                                                                                                    .map((model) => (_jsx("option", { value: model.file_id ?? "", children: model.name }, model.id)))] })] })] })] }), _jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Input & Processing" }), _jsx("span", { className: "badge", children: "Pre-Processing" })] }), _jsxs("div", { className: "settings-grid", children: [_jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Facecap" }), _jsx("div", { className: "muted small", children: "Detect faces while capping videos." })] }), _jsx("input", { type: "checkbox", checked: runConfig.facecap, onChange: (e) => setRunConfig({ ...runConfig, facecap: e.target.checked }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Images only" }), _jsx("div", { className: "muted small", children: "Skip video capping/archive." })] }), _jsx("input", { type: "checkbox", checked: runConfig.imagesOnly, onChange: (e) => setRunConfig({ ...runConfig, imagesOnly: e.target.checked }) })] }), _jsx("div", { className: "wizard-hint", children: "Images-only skips video processing. Facecap changes pipeline behavior during capping." }), runConfig.imagesOnly && stagedContainsVideos ? (_jsxs("div", { className: "wizard-warning", children: ["ACHTUNG: Images-only is active, but staged ZIPs contain ", stagedVideoCount, " video file(s). These videos will be ignored/skipped."] })) : null] })] })] })] })) : null, trainerWizardMode &&
                                                    ((trainerWizardMode === "single" && trainerWizardStep === 4) ||
                                                        (trainerWizardMode === "batch" && trainerWizardStep === 3)) ? (_jsxs("div", { className: "wizard-section", children: [_jsx("div", { className: "wizard-section-title", children: "Tagging" }), _jsxs("div", { className: "wizard-grid two-col", children: [_jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Tagging Config" }), _jsx("span", { className: "badge", children: "Auto / Manual" })] }), _jsxs("div", { className: "settings-grid", children: [_jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Manual tagging" }), _jsx("div", { className: "muted small", children: "Pause after autotag to edit tags." })] }), _jsx("input", { type: "checkbox", checked: runConfig.manualTagging, onChange: (e) => setRunConfig({ ...runConfig, manualTagging: e.target.checked }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Autotag" }), _jsx("div", { className: "muted small", children: "Generate tags for each image." })] }), _jsx("input", { type: "checkbox", checked: runConfig.autotag, disabled: runConfig.manualTagging, onChange: (e) => setRunConfig({ ...runConfig, autotag: e.target.checked }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "AutoChar" }), _jsx("div", { className: "muted small", children: "Remove unwanted tags using presets." })] }), _jsx("input", { type: "checkbox", checked: runConfig.autochar, disabled: runConfig.manualTagging, onChange: (e) => setRunConfig({ ...runConfig, autochar: e.target.checked }) })] }), _jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "AutoChar presets" }), _jsx("div", { className: "muted small", children: "Multi-select presets." })] }), _jsx("select", { className: "input", multiple: true, size: 5, disabled: !runConfig.autochar || runConfig.manualTagging, value: selectedPresets, onChange: (e) => setSelectedPresets(Array.from(e.target.selectedOptions).map((opt) => opt.value)), children: autocharPresets.map((preset) => (_jsx("option", { value: preset.name, children: preset.name }, preset.id))) })] })] })] }), _jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Notes" }), _jsx("span", { className: "badge", children: "Manual Tagging" })] }), _jsxs("div", { className: "settings-grid", children: [_jsx("div", { className: "wizard-hint", children: "Manual tagging pauses the run after autotagging. You must resume it later." }), runConfig.manualTagging ? (_jsx("div", { className: "wizard-warning", children: "Manual tagging is enabled. The run will pause." })) : (_jsx("div", { className: "muted small", children: "Autotag runs uninterrupted when manual tagging is off." }))] })] })] })] })) : null, trainerWizardMode &&
                                                    ((trainerWizardMode === "single" && trainerWizardStep === 5) ||
                                                        (trainerWizardMode === "batch" && trainerWizardStep === 4)) ? (_jsxs("div", { className: "wizard-section", children: [_jsx("div", { className: "wizard-section-title", children: "Sample Prompts" }), _jsxs("div", { className: "wizard-grid", children: [_jsxs("label", { className: "setting-row", children: [_jsxs("div", { children: [_jsx("div", { className: "name", children: "Use defaults" }), _jsx("div", { className: "muted small", children: "Insert default prompts for this run." })] }), _jsx("input", { type: "checkbox", checked: trainerUseDefaults, onChange: (e) => {
                                                                                const next = e.target.checked;
                                                                                setTrainerUseDefaults(next);
                                                                                if (next) {
                                                                                    setRunConfig((prev) => ({ ...prev, samplePrompts: [...DEFAULT_SAMPLE_PROMPTS] }));
                                                                                }
                                                                            } })] }), runConfig.samplePrompts.map((prompt, idx) => (_jsxs("label", { className: "form-row", children: ["Prompt ", idx + 1, _jsx("input", { className: "input", value: prompt, disabled: trainerUseDefaults, onChange: (e) => {
                                                                                const next = [...runConfig.samplePrompts];
                                                                                next[idx] = e.target.value;
                                                                                setRunConfig({ ...runConfig, samplePrompts: next });
                                                                            } })] }, `wizard-sample-${idx}`)))] })] })) : null, trainerWizardMode &&
                                                    ((trainerWizardMode === "single" && trainerWizardStep === 6) ||
                                                        (trainerWizardMode === "batch" && trainerWizardStep === 5)) ? (_jsxs("div", { className: "wizard-section", children: [_jsx("div", { className: "wizard-section-title", children: "Review & Confirm" }), _jsxs("div", { className: "wizard-summary", children: [_jsxs("div", { className: "summary-group", children: [_jsx("div", { className: "summary-title", children: "Triggers" }), _jsx("div", { className: "summary-body", children: trainerWizardMode === "single" ? (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: trainerName || "-" }), _jsx("span", { children: normalizedSingleName || "-" })] })) : (batchTriggerInfo.map((info) => (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: info.name }), _jsx("span", { children: info.normalized || "-" })] }, `summary-${info.id}`)))) })] }), _jsxs("div", { className: "summary-group", children: [_jsx("div", { className: "summary-title", children: "Credits" }), _jsxs("div", { className: "summary-body", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Per run" }), _jsx("span", { children: creditsPerRun })] }), trainerWizardMode === "batch" ? (_jsxs("div", { className: "stat-row", children: [_jsxs("span", { children: ["Total (", batchUploadCount, " runs)"] }), _jsx("span", { children: creditsTotal })] })) : null] })] }), _jsxs("div", { className: "summary-group", children: [_jsx("div", { className: "summary-title", children: "Training & Performance" }), _jsxs("div", { className: "summary-body", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Training" }), _jsx("span", { children: runConfig.train ? "enabled" : "disabled" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "GPU" }), _jsx("span", { children: runConfig.gpu ? "enabled" : "disabled" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Profile" }), _jsx("span", { children: runConfig.trainProfile || "auto" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Base model" }), _jsx("span", { children: runConfig.baseModelId || "auto" })] })] })] }), _jsxs("div", { className: "summary-group", children: [_jsx("div", { className: "summary-title", children: "Tagging" }), _jsxs("div", { className: "summary-body", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Manual" }), _jsx("span", { children: runConfig.manualTagging ? "yes (pause)" : "no" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Autotag" }), _jsx("span", { children: runConfig.autotag ? "enabled" : "disabled" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "AutoChar" }), _jsx("span", { children: runConfig.autochar ? `enabled (${selectedPresets.length} presets)` : "disabled" })] })] })] }), _jsxs("div", { className: "summary-group", children: [_jsx("div", { className: "summary-title", children: "Input Flags" }), _jsxs("div", { className: "summary-body", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Images only" }), _jsx("span", { children: runConfig.imagesOnly ? "yes" : "no" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Facecap" }), _jsx("span", { children: runConfig.facecap ? "yes" : "no" })] })] })] }), _jsxs("div", { className: "summary-group", children: [_jsx("div", { className: "summary-title", children: "Sample Prompts" }), _jsx("div", { className: "summary-body", children: runConfig.samplePrompts.filter((prompt) => prompt.trim() !== "").length === 0 ? (_jsx("div", { className: "muted small", children: "No prompts provided." })) : (runConfig.samplePrompts
                                                                                .filter((prompt) => prompt.trim() !== "")
                                                                                .map((prompt, idx) => (_jsx("div", { className: "muted small", children: prompt }, `prompt-summary-${idx}`)))) })] }), trainerWizardMode === "single" ? (_jsxs("div", { className: "summary-group", children: [_jsx("div", { className: "summary-title", children: "Metadata" }), _jsxs("div", { className: "summary-body", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Description" }), _jsx("span", { children: trainerDescription || "-" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Notes" }), _jsx("span", { children: trainerNotes || "-" })] })] })] })) : null] }), batchLimitExceeded ? (_jsxs("div", { className: "wizard-warning", children: ["Batch limit exceeded. Reduce to ", wizardMaxBatch, " ZIPs."] })) : null, batchInternalDuplicates.length > 0 ? (_jsxs("div", { className: "wizard-warning", children: ["Duplicate triggers inside batch: ", batchInternalDuplicates.join(", "), "."] })) : null, duplicateWarning ? (_jsxs("div", { className: "wizard-warning", children: ["Trigger already exists: ", duplicateWarningNames.join(", "), ". Confirmation required on start."] })) : null, uploadMessage ? _jsx("div", { className: "wizard-hint", children: uploadMessage }) : null] })) : null] }), _jsxs("div", { className: "wizard-actions", children: [_jsx("button", { className: "action-btn ghost", disabled: trainerWizardStep === 0, onClick: goWizardBack, children: "Back" }), trainerWizardMode && trainerWizardStep < wizardSteps.length - 1 ? (_jsx("button", { className: "action-btn", disabled: !wizardCanContinue(), onClick: goWizardNext, children: "Next" })) : null, trainerWizardMode && trainerWizardStep === wizardSteps.length - 1 ? (_jsx("button", { className: "action-btn", disabled: !wizardSubmitReadyBase, onClick: () => submitWizardTraining(), children: "Start Training" })) : null] })] })] }) })) : null, trainerDuplicateConfirmOpen ? (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "confirm-modal", children: [_jsxs("div", { className: "manual-header", children: [_jsxs("div", { children: [_jsx("div", { className: "title", children: "Duplicate Trigger Found" }), _jsx("div", { className: "muted small", children: "Proceeding may overwrite or conflict with existing runs." })] }), _jsx("button", { className: "action-btn ghost", onClick: () => setTrainerDuplicateConfirmOpen(false), children: "Close" })] }), _jsxs("div", { className: "manual-body", children: [_jsxs("div", { className: "wizard-warning", children: ["Trigger already exists: ", duplicateWarningNames.join(", "), ". Continue anyway?"] }), _jsxs("div", { className: "wizard-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: () => setTrainerDuplicateConfirmOpen(false), children: "Cancel" }), _jsx("button", { className: "action-btn", onClick: () => {
                                                        setTrainerConfirmDuplicates(true);
                                                        setTrainerDuplicateConfirmOpen(false);
                                                        submitWizardTraining({ forceDuplicateConfirm: true });
                                                    }, children: "Yes, start training" })] })] })] }) })) : null, manualOpen ? (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "manual-modal", children: [_jsxs("div", { className: "manual-header", children: [_jsxs("div", { children: [_jsx("div", { className: "title", children: "Manual Tagging" }), _jsx("div", { className: "muted small", children: manualRunName || manualRunId }), _jsx("div", { className: "muted small", children: manualRunId })] }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                setManualOpen(false);
                                                setManualRunId("");
                                            }, children: "Close" })] }), _jsxs("div", { className: "manual-body", children: [_jsxs("div", { className: "manual-controls", children: [_jsxs("div", { className: "control-row", children: [_jsx("input", { className: "input", placeholder: "Search tags or filename", value: manualSearch, onChange: (e) => setManualSearch(e.target.value) }), _jsxs("label", { className: "inline", children: [_jsx("input", { type: "checkbox", checked: manualFaceOnly, onChange: (e) => setManualFaceOnly(e.target.checked) }), _jsx("span", { children: "Face only" })] })] }), _jsxs("div", { className: "control-row", children: [_jsx("input", { className: "input", placeholder: "Add tags (comma)", value: manualBulkAdd, onChange: (e) => setManualBulkAdd(e.target.value) }), _jsx("button", { className: "action-btn ghost", onClick: () => applyManualBulk("add"), children: "Apply Add" }), _jsx("input", { className: "input", placeholder: "Remove tags (comma)", value: manualBulkRemove, onChange: (e) => setManualBulkRemove(e.target.value) }), _jsx("button", { className: "action-btn ghost", onClick: () => applyManualBulk("remove"), children: "Apply Remove" })] }), _jsxs("div", { className: "control-row tags-row", children: [_jsx("input", { className: "input", placeholder: "Filter tags", value: manualTagFilter, onChange: (e) => setManualTagFilter(e.target.value) }), _jsxs("div", { className: "tag-match", children: [_jsx("span", { className: "muted small", children: "Match" }), _jsx("button", { className: `action-btn ghost ${manualTagMatch === "any" ? "is-active" : ""}`, onClick: () => setManualTagMatch("any"), children: "Any" }), _jsx("button", { className: `action-btn ghost ${manualTagMatch === "all" ? "is-active" : ""}`, onClick: () => setManualTagMatch("all"), children: "All" })] }), _jsx("button", { className: "action-btn ghost", onClick: removeSelectedTags, children: "Remove Selected Tags" }), _jsx("button", { className: "action-btn", onClick: saveManualChanges, children: "Save Changes" }), _jsx("button", { className: "action-btn", onClick: resumeManualRun, children: "Resume Pipeline" })] }), _jsx("div", { className: "manual-tags", children: manualTagsVisible.length === 0 ? (_jsx("div", { className: "muted small", children: "No tags yet." })) : (manualTagsVisible.map((tag) => (_jsxs("button", { className: `tag-chip ${manualFilterTags.includes(tag.tag) ? "active" : ""}`, onClick: () => setManualFilterTags((prev) => prev.includes(tag.tag) ? prev.filter((t) => t !== tag.tag) : [...prev, tag.tag]), children: [tag.tag, " \u00B7 ", tag.count] }, tag.tag)))) }), manualMsg ? _jsx("div", { className: "manual-msg", children: manualMsg }) : null] }), _jsx("div", { className: "manual-grid", children: manualVisible.length === 0 ? (_jsx("div", { className: "muted small", children: "No images loaded." })) : (manualVisible.map((img) => (_jsxs("div", { className: "manual-card", children: [_jsxs("div", { className: "manual-card-head", children: [_jsxs("label", { className: "inline", children: [_jsx("input", { type: "checkbox", checked: manualSelected.includes(img.path), onChange: () => toggleManualSelected(img.path) }), _jsx("span", { children: "Select" })] }), img.isFace ? _jsx("span", { className: "pill pill-queued", children: "face" }) : null] }), _jsx("img", { src: img.url, alt: img.name }), _jsx("div", { className: "manual-meta", children: img.name }), _jsx("textarea", { rows: 3, value: img.caption, onChange: (e) => updateManualCaption(img.path, e.target.value) })] }, img.path)))) }), _jsx("div", { className: "manual-footer", children: _jsx("button", { className: "action-btn ghost", disabled: manualFiltered.length <= manualPage * 48, onClick: () => setManualPage((prev) => prev + 1), children: "Load More" }) })] })] }) })) : null, selectedImage ? (_jsx("div", { className: "image-modal", children: _jsxs("div", { className: "image-modal-content", children: [_jsx("button", { className: "modal-close", onClick: () => setSelectedImage(null), children: "Close" }), _jsxs("div", { className: "modal-body", children: [_jsx("div", { className: "modal-image", children: _jsx("img", { src: fileUrl(selectedImage.file_id, token), alt: "" }) }), _jsxs("div", { className: "modal-info", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Image" }), _jsxs("span", { className: "badge", children: ["@", selectedImage.username] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Prompt" }), _jsx("span", { children: selectedImage.prompt ?? "" })] }), selectedImage.negative_prompt ? (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Negative" }), _jsx("span", { children: selectedImage.negative_prompt })] })) : null, _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Model" }), _jsx("span", { children: selectedModelLabel || "–" })] }), selectedLoraLabels.length ? (_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "LoRAs" }), _jsx("span", { children: selectedLoraLabels.join(", ") })] })) : null, _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Sampler" }), _jsx("span", { children: selectedImage.sampler ?? "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Scheduler" }), _jsx("span", { children: selectedImage.scheduler ?? "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Steps" }), _jsx("span", { children: selectedImage.steps ?? "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "CFG" }), _jsx("span", { children: selectedImage.cfg_scale ?? "–" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Seed" }), _jsx("span", { children: selectedImage.seed ?? "–" })] }), _jsxs("div", { className: "modal-actions lora-actions lora-actions--social", children: [_jsxs("button", { className: "action-btn", onClick: () => {
                                                                if (!token || !selectedMeta)
                                                                    return;
                                                                const method = selectedMeta.user_liked ? "DELETE" : "POST";
                                                                fetch(`/api/gallery/images/${selectedImage.id}/like`, {
                                                                    method,
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                })
                                                                    .then(() => {
                                                                    setSelectedMeta((prev) => prev
                                                                        ? {
                                                                            ...prev,
                                                                            user_liked: !prev.user_liked,
                                                                            likes: prev.likes + (prev.user_liked ? -1 : 1)
                                                                        }
                                                                        : prev);
                                                                })
                                                                    .catch(() => null);
                                                            }, children: [selectedMeta?.user_liked ? "Unlike" : "Like", " (", selectedMeta?.likes ?? 0, ")"] }), _jsx("a", { className: "action-btn ghost", href: fileUrl(selectedImage.file_id, token), target: "_blank", rel: "noreferrer", children: "Download" })] }), _jsxs("div", { className: "modal-actions lora-actions lora-actions--primary", children: [selectedImage.user_id === user?.id ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                if (!token)
                                                                    return;
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
                                                            }, children: selectedImage.is_public ? "Make Private" : "Make Public" })) : null, selectedImage.user_id === user?.id || isAdmin ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                if (!token)
                                                                    return;
                                                                fetch(`/api/gallery/images/${selectedImage.id}`, {
                                                                    method: "DELETE",
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                })
                                                                    .then(() => {
                                                                    refreshGalleryImages();
                                                                    setSelectedImage(null);
                                                                })
                                                                    .catch(() => null);
                                                            }, children: "Delete" })) : null] }), _jsxs("div", { className: "modal-comments", children: [_jsx("div", { className: "muted small", children: "Comments" }), _jsxs("div", { className: "comment-list", children: [selectedComments.map((comment) => (_jsxs("div", { className: "comment-row", children: [_jsxs("span", { children: ["@", comment.username] }), _jsx("span", { children: comment.body }), comment.pinned || comment.featured ? (_jsxs("span", { className: "comment-flags", children: [comment.pinned ? _jsx("span", { className: "comment-flag", children: "Pinned" }) : null, comment.featured ? _jsx("span", { className: "comment-flag", children: "Featured" }) : null] })) : null, isAdmin || selectedImage.user_id === user?.id ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                        if (!token)
                                                                                            return;
                                                                                        fetch(`/api/gallery/images/${selectedImage.id}/comments/${comment.id}`, {
                                                                                            method: "PATCH",
                                                                                            headers: {
                                                                                                "Content-Type": "application/json",
                                                                                                Authorization: `Bearer ${token}`
                                                                                            },
                                                                                            body: JSON.stringify({ pinned: !comment.pinned })
                                                                                        })
                                                                                            .then(() => fetch(`/api/gallery/images/${selectedImage.id}/comments`, {
                                                                                            headers: { Authorization: `Bearer ${token}` }
                                                                                        }))
                                                                                            .then((res) => res.json())
                                                                                            .then((data) => setSelectedComments(data.comments ?? []))
                                                                                            .catch(() => null);
                                                                                    }, children: comment.pinned ? "Unpin" : "Pin" }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                        if (!token)
                                                                                            return;
                                                                                        fetch(`/api/gallery/images/${selectedImage.id}/comments/${comment.id}`, {
                                                                                            method: "PATCH",
                                                                                            headers: {
                                                                                                "Content-Type": "application/json",
                                                                                                Authorization: `Bearer ${token}`
                                                                                            },
                                                                                            body: JSON.stringify({ featured: !comment.featured })
                                                                                        })
                                                                                            .then(() => fetch(`/api/gallery/images/${selectedImage.id}/comments`, {
                                                                                            headers: { Authorization: `Bearer ${token}` }
                                                                                        }))
                                                                                            .then((res) => res.json())
                                                                                            .then((data) => setSelectedComments(data.comments ?? []))
                                                                                            .catch(() => null);
                                                                                    }, children: comment.featured ? "Unfeature" : "Feature" })] })) : null, comment.user_id === user?.id || selectedImage.user_id === user?.id || isAdmin ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                if (!token)
                                                                                    return;
                                                                                fetch(`/api/gallery/images/${selectedImage.id}/comments/${comment.id}`, {
                                                                                    method: "DELETE",
                                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                                })
                                                                                    .then(() => fetch(`/api/gallery/images/${selectedImage.id}/comments`, {
                                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                                }))
                                                                                    .then((res) => res.json())
                                                                                    .then((data) => setSelectedComments(data.comments ?? []))
                                                                                    .catch(() => null);
                                                                            }, children: "Delete" })) : null] }, comment.id))), !selectedComments.length ? _jsx("div", { className: "muted small", children: "No comments yet." }) : null] }), _jsxs("div", { className: "comment-input", children: [_jsx("input", { className: "input", value: commentDraft, onChange: (e) => setCommentDraft(e.target.value), placeholder: "Add a comment" }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                        if (!token || !commentDraft.trim())
                                                                            return;
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
                                                                    }, children: "Post" })] })] })] })] })] }) })) : null, selectedModel ? (_jsx("div", { className: "image-modal", children: _jsxs("div", { className: "image-modal-content", children: [_jsx("button", { className: "modal-close", onClick: () => setSelectedModel(null), children: "Close" }), _jsxs("div", { className: "modal-body", children: [_jsx("div", { className: "modal-image", children: _jsx("div", { className: "model-thumb-grid large", children: selectedModelImages.map((img) => (_jsx("img", { src: fileUrl(img.file_id, token, { thumb: true, size: 320 }), alt: "", loading: "lazy", decoding: "async" }, img.id))) }) }), _jsxs("div", { className: "modal-info", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: selectedModel.name }), _jsxs("span", { className: "badge", children: ["@", selectedModel.username ?? "unknown"] })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Model ID" }), _jsx("span", { children: selectedModel.id })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Status" }), _jsx("span", { children: selectedModel.status ?? "–" })] }), _jsx("div", { className: "modal-actions lora-actions lora-actions--manage", children: _jsxs("button", { className: "action-btn", onClick: () => {
                                                            if (!token || !selectedModelMeta)
                                                                return;
                                                            const method = selectedModelMeta.user_liked ? "DELETE" : "POST";
                                                            fetch(`/api/gallery/models/${selectedModel.id}/like`, {
                                                                method,
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            })
                                                                .then(() => {
                                                                setSelectedModelMeta((prev) => prev
                                                                    ? {
                                                                        ...prev,
                                                                        user_liked: !prev.user_liked,
                                                                        likes: prev.likes + (prev.user_liked ? -1 : 1)
                                                                    }
                                                                    : prev);
                                                            })
                                                                .catch(() => null);
                                                        }, children: [selectedModelMeta?.user_liked ? "Unlike" : "Like", " (", selectedModelMeta?.likes ?? 0, ")"] }) }), _jsxs("div", { className: "modal-comments", children: [_jsx("div", { className: "muted small", children: "Comments" }), _jsxs("div", { className: "comment-list", children: [selectedModelComments.map((comment) => (_jsxs("div", { className: "comment-row", children: [_jsxs("span", { children: ["@", comment.username] }), _jsx("span", { children: comment.body }), comment.pinned || comment.featured ? (_jsxs("span", { className: "comment-flags", children: [comment.pinned ? _jsx("span", { className: "comment-flag", children: "Pinned" }) : null, comment.featured ? _jsx("span", { className: "comment-flag", children: "Featured" }) : null] })) : null, isAdmin || selectedModel.user_id === user?.id ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                        if (!token)
                                                                                            return;
                                                                                        fetch(`/api/gallery/models/${selectedModel.id}/comments/${comment.id}`, {
                                                                                            method: "PATCH",
                                                                                            headers: {
                                                                                                "Content-Type": "application/json",
                                                                                                Authorization: `Bearer ${token}`
                                                                                            },
                                                                                            body: JSON.stringify({ pinned: !comment.pinned })
                                                                                        })
                                                                                            .then(() => fetch(`/api/gallery/models/${selectedModel.id}/comments`, {
                                                                                            headers: { Authorization: `Bearer ${token}` }
                                                                                        }))
                                                                                            .then((res) => res.json())
                                                                                            .then((data) => setSelectedModelComments(data.comments ?? []))
                                                                                            .catch(() => null);
                                                                                    }, children: comment.pinned ? "Unpin" : "Pin" }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                        if (!token)
                                                                                            return;
                                                                                        fetch(`/api/gallery/models/${selectedModel.id}/comments/${comment.id}`, {
                                                                                            method: "PATCH",
                                                                                            headers: {
                                                                                                "Content-Type": "application/json",
                                                                                                Authorization: `Bearer ${token}`
                                                                                            },
                                                                                            body: JSON.stringify({ featured: !comment.featured })
                                                                                        })
                                                                                            .then(() => fetch(`/api/gallery/models/${selectedModel.id}/comments`, {
                                                                                            headers: { Authorization: `Bearer ${token}` }
                                                                                        }))
                                                                                            .then((res) => res.json())
                                                                                            .then((data) => setSelectedModelComments(data.comments ?? []))
                                                                                            .catch(() => null);
                                                                                    }, children: comment.featured ? "Unfeature" : "Feature" })] })) : null, comment.user_id === user?.id || selectedModel.user_id === user?.id || isAdmin ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                if (!token)
                                                                                    return;
                                                                                fetch(`/api/gallery/models/${selectedModel.id}/comments/${comment.id}`, {
                                                                                    method: "DELETE",
                                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                                })
                                                                                    .then(() => fetch(`/api/gallery/models/${selectedModel.id}/comments`, {
                                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                                }))
                                                                                    .then((res) => res.json())
                                                                                    .then((data) => setSelectedModelComments(data.comments ?? []))
                                                                                    .catch(() => null);
                                                                            }, children: "Delete" })) : null] }, comment.id))), !selectedModelComments.length ? _jsx("div", { className: "muted small", children: "No comments yet." }) : null] }), _jsxs("div", { className: "comment-input", children: [_jsx("input", { className: "input", value: modelCommentDraft, onChange: (e) => setModelCommentDraft(e.target.value), placeholder: "Add a comment" }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                        if (!token || !modelCommentDraft.trim())
                                                                            return;
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
                                                                    }, children: "Post" })] })] })] })] })] }) })) : null, loraUploadOpen ? (_jsx("div", { className: "auth-modal", children: _jsxs("div", { className: "auth-modal-content panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: "Upload LoRA" }), _jsx("button", { className: "modal-close", onClick: () => setLoraUploadOpen(false), children: "Close" })] }), canUploadLora ? (_jsxs("div", { className: "form-grid", children: [_jsxs("label", { className: "form-row", children: ["LoRA file", _jsx("input", { className: "input", type: "file", accept: ".safetensors,.pt,.ckpt", onChange: (e) => {
                                                        const file = e.target.files?.[0] ?? null;
                                                        setLoraUploadFile(file);
                                                        if (file && !loraUploadName.trim()) {
                                                            const base = file.name.replace(/\.[^/.]+$/, "");
                                                            setLoraUploadName(base);
                                                        }
                                                    } })] }), _jsxs("label", { className: "form-row", children: ["Name", _jsx("input", { className: "input", value: loraUploadName, onChange: (e) => setLoraUploadName(e.target.value) })] }), _jsxs("label", { className: "form-row form-check", children: [_jsx("span", { children: "Public" }), _jsx("input", { type: "checkbox", checked: loraUploadPublic, onChange: (e) => setLoraUploadPublic(e.target.checked) })] }), _jsx("button", { className: "action-btn", onClick: () => {
                                                if (!token || !loraUploadFile)
                                                    return;
                                                const form = new FormData();
                                                form.append("file", loraUploadFile);
                                                if (loraUploadName.trim())
                                                    form.append("name", loraUploadName.trim());
                                                form.append("is_public", String(loraUploadPublic));
                                                setLoraUploadStatus("Uploading...");
                                                setLoraUploadProgress(0);
                                                const xhr = new XMLHttpRequest();
                                                xhr.open("POST", "/api/loras/upload");
                                                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                                                xhr.upload.onprogress = (event) => {
                                                    if (!event.lengthComputable)
                                                        return;
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
                                                    }
                                                    catch {
                                                        setLoraUploadStatus("Upload failed.");
                                                    }
                                                };
                                                xhr.onerror = () => setLoraUploadStatus("Upload failed.");
                                                xhr.send(form);
                                            }, children: "Upload to gallery" }), loraUploadStatus ? _jsx("div", { className: "muted small", children: loraUploadStatus }) : null, loraUploadStatus === "Uploading..." ? (_jsx("div", { className: "progress", children: _jsx("span", { style: { width: `${loraUploadProgress}%` } }) })) : null] })) : (_jsx("div", { className: "muted small", children: "LoRA upload permission required." }))] }) })) : null, selectedLoraEntry ? (_jsx("div", { className: "image-modal", children: _jsxs("div", { className: "image-modal-content", children: [_jsx("button", { className: "modal-close", onClick: () => {
                                        setSelectedLoraEntry(null);
                                        setSelectedLoraPreview(null);
                                    }, children: "Close" }), _jsxs("div", { className: "modal-body", children: [_jsx("div", { className: "modal-image", children: _jsxs("div", { className: "lora-previews large", children: [(selectedLoraEntry.preview_file_ids ?? []).map((fileId) => (_jsx("button", { className: "preview-tile", onClick: () => setSelectedLoraPreview(fileId), children: _jsx("img", { src: withToken(`/api/files/${fileId}`, token), alt: `${selectedLoraEntry.name} preview` }) }, fileId))), !selectedLoraEntry.preview_file_ids?.length ? (_jsx("div", { className: "muted small", children: "No previews yet." })) : null] }) }), _jsxs("div", { className: "modal-info", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: selectedLoraEntry.name }), _jsxs("span", { className: "badge", children: ["@", selectedLoraEntry.username] })] }), _jsxs("div", { className: "model-description", children: [_jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Description" }), _jsx("span", {})] }), selectedLoraEntry.user_id === user?.id || user?.role === "admin" ? (loraDescriptionEditing ? (_jsxs("div", { className: "description-edit", children: [_jsx("textarea", { className: "input", rows: 3, value: loraDescriptionDraft, onChange: (e) => setLoraDescriptionDraft(e.target.value), placeholder: "Add a short description for this model." }), _jsxs("div", { className: "wizard-actions", children: [_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                setLoraDescriptionDraft(selectedLoraEntry.description ?? "");
                                                                                setLoraDescriptionEditing(false);
                                                                                setLoraDescriptionStatus("");
                                                                            }, children: "Cancel" }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                                if (!token)
                                                                                    return;
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
                                                                                    setSelectedLoraEntry((prev) => prev ? { ...prev, description: nextDescription } : prev);
                                                                                    setLoraEntries((prev) => prev.map((entry) => entry.id === selectedLoraEntry.id
                                                                                        ? { ...entry, description: nextDescription }
                                                                                        : entry));
                                                                                    setLoraDescriptionStatus("Saved.");
                                                                                    setLoraDescriptionEditing(false);
                                                                                })
                                                                                    .catch(() => setLoraDescriptionStatus("Update failed."));
                                                                            }, children: "Save" })] })] })) : (_jsxs("div", { className: "description-read", children: [_jsx("div", { className: "muted small", children: selectedLoraEntry.description?.trim() ? selectedLoraEntry.description : "—" }), _jsx("button", { className: "action-btn ghost", onClick: () => setLoraDescriptionEditing(true), children: "Edit description" })] }))) : (_jsx("div", { className: "muted small", children: selectedLoraEntry.description?.trim() ? selectedLoraEntry.description : "—" })), loraDescriptionStatus ? _jsx("div", { className: "muted small", children: loraDescriptionStatus }) : null] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Source" }), _jsx("span", { children: selectedLoraEntry.source === "external" ? "External Uploaded" : "Training" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Visibility" }), _jsx("span", { children: selectedLoraEntry.is_public ? "Public" : "Private" })] }), _jsxs("div", { className: "stat-row", children: [_jsx("span", { children: "Previews" }), _jsxs("span", { children: [selectedLoraEntry.preview_count ?? 0, "/11", selectedLoraEntry.preview_in_flight ? " • generating..." : ""] })] }), _jsx("div", { className: "modal-actions lora-actions lora-actions--social", children: _jsxs("button", { className: "action-btn", onClick: () => {
                                                            if (!token || !selectedLoraMeta)
                                                                return;
                                                            const headers = { Authorization: `Bearer ${token}` };
                                                            const method = selectedLoraMeta.user_liked ? "DELETE" : "POST";
                                                            fetch(`/api/loras/${selectedLoraEntry.id}/like`, { method, headers })
                                                                .then(() => {
                                                                setSelectedLoraMeta((prev) => prev
                                                                    ? {
                                                                        ...prev,
                                                                        user_liked: !prev.user_liked,
                                                                        likes: prev.likes + (prev.user_liked ? -1 : 1)
                                                                    }
                                                                    : prev);
                                                            })
                                                                .catch(() => null);
                                                        }, children: [selectedLoraMeta?.user_liked ? "Unlike" : "Like", " (", selectedLoraMeta?.likes ?? 0, ")"] }) }), _jsxs("div", { className: "modal-actions lora-actions lora-actions--primary", children: [_jsx("button", { className: "action-btn", onClick: () => {
                                                                setSelectedLoraId(selectedLoraEntry.file_id);
                                                                setSelectedLoraName(selectedLoraEntry.name);
                                                                setSelectedLoraWeight(0.75);
                                                                setView("generator");
                                                            }, children: "Generate with LoRA" }), selectedLoraEntry.user_id === user?.id || user?.role === "admin" ? (_jsx("a", { className: "action-btn ghost", href: fileUrl(selectedLoraEntry.file_id, token), target: "_blank", rel: "noreferrer", children: "Download LoRA" })) : null, selectedLoraEntry.dataset_file_id &&
                                                            (selectedLoraEntry.user_id === user?.id || user?.role === "admin") ? (_jsx("a", { className: "action-btn ghost", href: fileUrl(selectedLoraEntry.dataset_file_id, token), target: "_blank", rel: "noreferrer", children: "Download dataset" })) : null] }), _jsxs("div", { className: "modal-actions lora-actions lora-actions--manage", children: [user?.role === "admin" ? (_jsx("button", { className: "action-btn", disabled: Boolean(selectedLoraEntry.preview_in_flight), onClick: () => {
                                                                if (!token)
                                                                    return;
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
                                                            }, children: "Regen previews" })) : selectedLoraEntry.user_id === user?.id &&
                                                            !(selectedLoraEntry.preview_in_flight ?? 0) &&
                                                            (selectedLoraEntry.preview_count ?? 0) === 0 ? (_jsx("button", { className: "action-btn", onClick: () => {
                                                                if (!token)
                                                                    return;
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
                                                            }, children: "Generate previews" })) : null, selectedLoraEntry.user_id === user?.id ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                if (!token)
                                                                    return;
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
                                                            }, children: selectedLoraEntry.is_public ? "Make Private" : "Make Public" })) : null, selectedLoraEntry.user_id === user?.id || user?.role === "admin" ? (_jsx("button", { className: "action-btn danger", disabled: ["queued", "processing"].includes(String(selectedLoraEntry.remove_status ?? "")), onClick: () => {
                                                                if (!token)
                                                                    return;
                                                                if (!confirm(`Delete LoRA \"${selectedLoraEntry.name}\"? This cannot be undone.`))
                                                                    return;
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
                                                                    setSelectedLoraEntry((prev) => prev ? { ...prev, remove_status: "queued" } : prev);
                                                                    refreshLoraEntries();
                                                                })
                                                                    .catch(() => null);
                                                            }, children: ["queued", "processing"].includes(String(selectedLoraEntry.remove_status ?? ""))
                                                                ? "Removing..."
                                                                : "Delete LoRA" })) : null] }), _jsxs("div", { className: "modal-comments", children: [_jsx("div", { className: "muted small", children: "Comments" }), _jsxs("div", { className: "comment-list", children: [selectedLoraComments.map((comment) => (_jsxs("div", { className: "comment-row", children: [_jsxs("span", { children: ["@", comment.username] }), _jsx("span", { children: comment.body }), comment.pinned || comment.featured ? (_jsxs("span", { className: "comment-flags", children: [comment.pinned ? _jsx("span", { className: "comment-flag", children: "Pinned" }) : null, comment.featured ? _jsx("span", { className: "comment-flag", children: "Featured" }) : null] })) : null, isAdmin || selectedLoraEntry.user_id === user?.id ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                        if (!token)
                                                                                            return;
                                                                                        fetch(`/api/loras/${selectedLoraEntry.id}/comments/${comment.id}`, {
                                                                                            method: "PATCH",
                                                                                            headers: {
                                                                                                "Content-Type": "application/json",
                                                                                                Authorization: `Bearer ${token}`
                                                                                            },
                                                                                            body: JSON.stringify({ pinned: !comment.pinned })
                                                                                        })
                                                                                            .then(() => fetch(`/api/loras/${selectedLoraEntry.id}/comments`, {
                                                                                            headers: { Authorization: `Bearer ${token}` }
                                                                                        }))
                                                                                            .then((res) => res.json())
                                                                                            .then((data) => setSelectedLoraComments(data.comments ?? []))
                                                                                            .catch(() => null);
                                                                                    }, children: comment.pinned ? "Unpin" : "Pin" }), _jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                        if (!token)
                                                                                            return;
                                                                                        fetch(`/api/loras/${selectedLoraEntry.id}/comments/${comment.id}`, {
                                                                                            method: "PATCH",
                                                                                            headers: {
                                                                                                "Content-Type": "application/json",
                                                                                                Authorization: `Bearer ${token}`
                                                                                            },
                                                                                            body: JSON.stringify({ featured: !comment.featured })
                                                                                        })
                                                                                            .then(() => fetch(`/api/loras/${selectedLoraEntry.id}/comments`, {
                                                                                            headers: { Authorization: `Bearer ${token}` }
                                                                                        }))
                                                                                            .then((res) => res.json())
                                                                                            .then((data) => setSelectedLoraComments(data.comments ?? []))
                                                                                            .catch(() => null);
                                                                                    }, children: comment.featured ? "Unfeature" : "Feature" })] })) : null, comment.user_id === user?.id || selectedLoraEntry.user_id === user?.id || isAdmin ? (_jsx("button", { className: "action-btn ghost", onClick: () => {
                                                                                if (!token)
                                                                                    return;
                                                                                fetch(`/api/loras/${selectedLoraEntry.id}/comments/${comment.id}`, {
                                                                                    method: "DELETE",
                                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                                })
                                                                                    .then(() => fetch(`/api/loras/${selectedLoraEntry.id}/comments`, {
                                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                                }))
                                                                                    .then((res) => res.json())
                                                                                    .then((data) => setSelectedLoraComments(data.comments ?? []))
                                                                                    .catch(() => null);
                                                                            }, children: "Delete" })) : null] }, comment.id))), !selectedLoraComments.length ? _jsx("div", { className: "muted small", children: "No comments yet." }) : null] }), _jsxs("div", { className: "comment-input", children: [_jsx("input", { className: "input", value: loraCommentDraft, onChange: (e) => setLoraCommentDraft(e.target.value), placeholder: "Add a comment" }), _jsx("button", { className: "action-btn", onClick: () => {
                                                                        if (!token || !loraCommentDraft.trim())
                                                                            return;
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
                                                                    }, children: "Post" })] })] }), loraPreviewStatus[selectedLoraEntry.id] ? (_jsx("div", { className: "muted small", children: loraPreviewStatus[selectedLoraEntry.id] })) : null] })] })] }) })) : null, selectedLoraPreview ? (_jsx("div", { className: "image-modal", children: _jsxs("div", { className: "image-modal-content lightbox-content", children: [_jsxs("div", { className: "lightbox-toolbar", children: [_jsxs("span", { className: "muted small", children: [selectedLoraEntry?.name ?? "Preview", " ", selectedLoraPreviewIndex >= 0 ? `${selectedLoraPreviewIndex + 1}/${selectedLoraPreviewIds.length}` : ""] }), _jsx("button", { className: "modal-close", onClick: () => setSelectedLoraPreview(null), children: "Close" })] }), _jsxs("div", { className: "modal-body lightbox-body", children: [_jsxs("div", { className: "modal-image lightbox-image-wrap", children: [selectedLoraPreviewIds.length > 1 ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "lightbox-nav lightbox-nav-left", title: "Next (Arrow Left)", onClick: () => {
                                                                if (selectedLoraPreviewIndex < 0)
                                                                    return;
                                                                const nextIndex = (selectedLoraPreviewIndex + 1) % selectedLoraPreviewIds.length;
                                                                setSelectedLoraPreview(selectedLoraPreviewIds[nextIndex]);
                                                            }, children: "\u2190" }), _jsx("button", { className: "lightbox-nav lightbox-nav-right", title: "Previous (Arrow Right)", onClick: () => {
                                                                if (selectedLoraPreviewIndex < 0)
                                                                    return;
                                                                const prevIndex = (selectedLoraPreviewIndex - 1 + selectedLoraPreviewIds.length) % selectedLoraPreviewIds.length;
                                                                setSelectedLoraPreview(selectedLoraPreviewIds[prevIndex]);
                                                            }, children: "\u2192" })] })) : null, _jsx("img", { className: `lightbox-image lightbox-image-thumb ${selectedLoraPreviewOriginalReady ? "is-faded" : ""}`, src: fileUrl(selectedLoraPreview, token, { thumb: true, size: 1280 }), alt: "LoRA preview thumb" }), _jsx("img", { className: `lightbox-image lightbox-image-original ${selectedLoraPreviewOriginalReady ? "is-ready" : ""}`, src: fileUrl(selectedLoraPreview, token), alt: "LoRA preview", onLoad: () => setSelectedLoraPreviewOriginalReady(true), onError: () => setSelectedLoraPreviewOriginalReady(false) })] }), _jsx("div", { className: "lightbox-help muted small", children: "Keys: Left = next, Right = previous, Up = close" })] })] }) })) : null, passwordOpen ? (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "password-modal", children: [_jsxs("div", { className: "manual-header", children: [_jsxs("div", { children: [_jsx("div", { className: "title", children: "Change password" }), user?.must_change_password ? (_jsx("div", { className: "muted small", children: "Temporary credentials detected. Please set a new password." })) : null] }), !user?.must_change_password ? (_jsx("button", { className: "action-btn ghost", onClick: () => setPasswordOpen(false), children: "Close" })) : null] }), _jsx("div", { className: "manual-body", children: _jsxs("div", { className: "form-grid", children: [!user?.must_change_password ? (_jsxs("label", { className: "form-row", children: ["Current password", _jsx("input", { className: "input", type: "password", value: passwordCurrent, onChange: (e) => setPasswordCurrent(e.target.value) })] })) : null, _jsxs("label", { className: "form-row", children: ["New password", _jsx("input", { className: "input", type: "password", value: passwordNext, onChange: (e) => setPasswordNext(e.target.value) })] }), _jsxs("label", { className: "form-row", children: ["Confirm password", _jsx("input", { className: "input", type: "password", value: passwordConfirm, onChange: (e) => setPasswordConfirm(e.target.value) })] }), _jsxs("div", { className: "login-actions", children: [_jsx("button", { className: "action-btn", disabled: passwordBusy, onClick: submitPasswordChange, children: passwordBusy ? "Updating..." : "Update password" }), passwordMsg ? _jsx("div", { className: "muted small", children: passwordMsg }) : null] })] }) })] }) })) : null] })] }));
}
function LoginForm({ onLogin, labels }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [challengeId, setChallengeId] = useState(null);
    const [totpCode, setTotpCode] = useState("");
    const [emergencySequence, setEmergencySequence] = useState("");
    const [challengeLocked, setChallengeLocked] = useState(false);
    return (_jsx("form", { onSubmit: (event) => {
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
                }
                else if (data?.status === "totp_required" && data?.challenge_id) {
                    setChallengeId(String(data.challenge_id));
                    setError("totp_required_for_new_ip");
                }
                else if (data?.error === "totp_locked") {
                    if (data?.challenge_id) {
                        setChallengeId(String(data.challenge_id));
                    }
                    setChallengeLocked(true);
                    setError("totp_locked_use_emergency_or_admin");
                }
                else {
                    setError("login_failed");
                }
            })
                .catch(() => setError("login_failed"));
        }, children: _jsxs("div", { className: "form-grid", children: [_jsxs("label", { className: "form-row", children: [labels.email, _jsx("input", { className: "input", value: email, onChange: (e) => setEmail(e.target.value), disabled: Boolean(challengeId) })] }), _jsxs("label", { className: "form-row", children: [labels.password, _jsx("input", { className: "input", type: "password", value: password, onChange: (e) => setPassword(e.target.value), disabled: Boolean(challengeId) })] }), challengeId ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "form-row", children: ["TOTP Code", _jsx("input", { className: "input", value: totpCode, onChange: (e) => setTotpCode(e.target.value), placeholder: "123456", disabled: challengeLocked })] }), _jsxs("label", { className: "form-row", children: ["Emergency Code (if locked)", _jsx("input", { className: "input", value: emergencySequence, onChange: (e) => setEmergencySequence(e.target.value), placeholder: "XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX XXXXXXXX-XXXXXXXX" })] })] })) : null, error ? _jsx("div", { className: "form-row", children: humanizeErrorCode(error) }) : null, _jsx("button", { className: "action-btn", type: "submit", children: challengeId ? "Verify 2FA" : labels.login }), challengeId ? (_jsx("button", { className: "action-btn ghost", type: "button", onClick: () => {
                        setChallengeId(null);
                        setTotpCode("");
                        setEmergencySequence("");
                        setChallengeLocked(false);
                        setError(null);
                    }, children: "Cancel 2FA" })) : null] }) }));
}

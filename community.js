/* ==========================================================================
   TG COMMUNITY — REAL-TIME WHATSAPP CHAT APPLICATION LOGIC
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp, 
    addDoc, 
    deleteDoc, 
    where 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyChF016PV2A8EeHYu54KMZDDvvLDSvvDQE",
    authDomain: "tg-esports-community.firebaseapp.com",
    projectId: "tg-esports-community",
    storageBucket: "tg-esports-community.firebasestorage.app",
    messagingSenderId: "905506453361",
    appId: "1:905506453361:web:4b4437b089b3987c3528d0"
};

let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase Init Note:", e);
}

// Global Constants
const ADMIN_EMAIL = "fozyajay27@gmail.com";
const DEMO_STORAGE_KEY = "tg_community_active_user";
const LOCAL_MESSAGES_KEY = "tg_community_wa_messages_v1";

// DOM Elements
const authModal = document.getElementById("communityAuthModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const googleSignInBtn = document.getElementById("googleSignIn");
const demoSignInBtn = document.getElementById("demoSignIn");
const demoUsernameInput = document.getElementById("demoUsernameInput");
const modalAvatarPreview = document.getElementById("modalAvatarPreview");
const modalAvatarInput = document.getElementById("modalAvatarInput");
const modalAvatarHint = document.getElementById("modalAvatarHint");
const authMessage = document.getElementById("authMessage");

const chatStream = document.getElementById("communityChatStream");
const waChatForm = document.getElementById("waChatForm");
const waMessageInput = document.getElementById("waMessageInput");
const waSendBtn = document.getElementById("waSendBtn");

const tabGeneral = document.getElementById("tabGeneral");
const tabAnnouncements = document.getElementById("tabAnnouncements");
const waRibbonText = document.getElementById("waRibbonText");
const waAnnouncementsLock = document.getElementById("waAnnouncementsLock");

const navSignInBtn = document.getElementById("navSignInBtn");
const navProfileWrap = document.getElementById("navProfileWrap");
const navProfileBtn = document.getElementById("navProfileBtn");
const navProfileNamePreview = document.getElementById("navProfileNamePreview");
const navProfileDropdown = document.getElementById("navProfileDropdown");
const navProfileAvatar = document.getElementById("navProfileAvatar");
const dropdownAvatar = document.getElementById("dropdownAvatar");
const dropdownName = document.getElementById("dropdownName");
const dropdownTag = document.getElementById("dropdownTag");
const changePhotoInput = document.getElementById("changePhotoInput");
const dropChannelGeneral = document.getElementById("dropChannelGeneral");
const dropChannelAnnouncements = document.getElementById("dropChannelAnnouncements");
const navLogoutBtn = document.getElementById("navLogoutBtn");

const menuProfileCard = document.getElementById("menuProfileCard");
const menuProfileAvatar = document.getElementById("menuProfileAvatar");
const menuProfileName = document.getElementById("menuProfileName");
const menuProfileTag = document.getElementById("menuProfileTag");
const menuLoginCta = document.getElementById("menuLoginCta");
const menuTabGeneral = document.getElementById("menuTabGeneral");
const menuTabAnnouncements = document.getElementById("menuTabAnnouncements");
const menuLogoutBtn = document.getElementById("menuLogoutBtn");

// State
let currentUser = null;
let currentChannel = "general"; // "general" | "announcements"
let allMessages = [];
let unsubscribeFirestore = null;
let selectedAvatarDataUrl = "";

// Initial Seed Messages (Used if Firestore collection is fresh)
const INITIAL_SEED_MESSAGES = [
    {
        id: "seed_1",
        text: "🔥 WELCOME TO THE OFFICIAL TOTAL GAMING COMMUNITY HUB! Drop your Free Fire Gamer Tag below and connect with all TG fans!",
        author: "TOTAL GAMING OFFICIAL (Ajay)",
        authorUid: "admin_ajay_001",
        authorEmail: "fozyajay27@gmail.com",
        authorPhoto: "tg-logo.png",
        isAdmin: true,
        channel: "general",
        createdAt: Date.now() - 1000 * 60 * 120,
        likesCount: 64
    },
    {
        id: "seed_2",
        text: "Full support to Mafia, Delete, FozyAjay and the entire TG Esports squad for the upcoming championship! 🏆🇮🇳",
        author: "TG_Aman_Gamer",
        authorUid: "user_seed_01",
        authorEmail: "aman.fan@gmail.com",
        authorPhoto: "",
        isAdmin: false,
        channel: "general",
        createdAt: Date.now() - 1000 * 60 * 95,
        likesCount: 18
    },
    {
        id: "seed_3",
        text: "Can't wait for the new bootcamp vlog on Saturday! What time will it premiere on YouTube? ❤️",
        author: "EsportsFan_Rahul",
        authorUid: "user_seed_02",
        authorEmail: "rahul@gmail.com",
        authorPhoto: "",
        isAdmin: false,
        channel: "general",
        createdAt: Date.now() - 1000 * 60 * 45,
        likesCount: 9
    },
    {
        id: "seed_4",
        text: "📢 [OFFICIAL ANNOUNCEMENT] Bootcamp schedule is locked in! Double scrims starting tonight against top tier teams. Daily highlight reels will be shared here for community members!",
        author: "TOTAL GAMING OFFICIAL (Ajay)",
        authorUid: "admin_ajay_001",
        authorEmail: "fozyajay27@gmail.com",
        authorPhoto: "tg-logo.png",
        isAdmin: true,
        channel: "announcements",
        createdAt: Date.now() - 1000 * 60 * 180,
        likesCount: 142
    },
    {
        id: "seed_5",
        text: "📢 [OFFICIAL ANNOUNCEMENT] Exclusive community custom room matches will be hosted this Sunday! Winners get official TG merchandise vouchers. Stay tuned for room ID & password!",
        author: "TOTAL GAMING OFFICIAL (Ajay)",
        authorUid: "admin_ajay_001",
        authorEmail: "fozyajay27@gmail.com",
        authorPhoto: "tg-logo.png",
        isAdmin: true,
        channel: "announcements",
        createdAt: Date.now() - 1000 * 60 * 60,
        likesCount: 98
    }
];

// Helper: Process and Resize Avatar Image to Lightweight Square DataURL
function processAvatarFile(file, callback) {
    if (!file || !file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const size = 128;
            canvas.width = size;
            canvas.height = size;
            
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;
            
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Helper: Check if user is Admin
function isAdmin(user) {
    if (!user) return false;
    const email = (user.email || "").toLowerCase();
    return email === ADMIN_EMAIL.toLowerCase() || user.isAdmin === true || user.role === "admin";
}

// Helper: Format Time for WhatsApp Bubble
function formatTime(timestamp) {
    if (!timestamp) return "Just now";
    let date = timestamp;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (typeof timestamp === "number") date = new Date(timestamp);
    else if (!(date instanceof Date)) date = new Date(timestamp);
    
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Helper: Format Date for Separators
function formatDateSeparator(timestamp) {
    if (!timestamp) return "TODAY";
    let date = timestamp;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (typeof timestamp === "number") date = new Date(timestamp);
    else if (!(date instanceof Date)) date = new Date(timestamp);

    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "TODAY";
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "YESTERDAY";

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
}

// Load Cached Messages from LocalStorage
function getLocalMessages() {
    try {
        const data = localStorage.getItem(LOCAL_MESSAGES_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.warn("Local storage parse note:", e);
    }
    return INITIAL_SEED_MESSAGES;
}

// Save Messages to LocalStorage
function saveLocalMessages(msgs) {
    try {
        localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));
    } catch (e) {
        console.warn("Local storage save note:", e);
    }
}

// Render Header User Chip & Sync Nav Dropdowns
function renderUserUI(user) {
    if (user) {
        const isUserAdmin = isAdmin(user);
        const displayName = user.displayName || (isUserAdmin ? "TG Admin" : "TG Fan");
        const avatarInitial = displayName.substring(0, 2).toUpperCase();

        // Navbar Profile
        if (navSignInBtn) navSignInBtn.hidden = true;
        if (navProfileWrap) {
            navProfileWrap.removeAttribute("hidden");
            navProfileWrap.hidden = false;
        }
        if (navProfileNamePreview) navProfileNamePreview.textContent = displayName;
        if (navProfileAvatar) {
            if (user.photoURL) navProfileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}"/>`;
            else navProfileAvatar.textContent = avatarInitial;
        }
        if (dropdownAvatar) {
            if (user.photoURL) dropdownAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}"/>`;
            else dropdownAvatar.textContent = avatarInitial;
        }
        if (dropdownName) dropdownName.textContent = displayName;
        if (dropdownTag) {
            dropdownTag.innerHTML = isUserAdmin 
                ? `<span style="background:#ffd700;box-shadow:0 0 8px #ffd700;"></span> Official Admin`
                : `<span></span> Verified Member`;
        }

        // Sync Mobile Drawer
        if (menuLoginCta) menuLoginCta.hidden = true;
        if (menuProfileCard) {
            menuProfileCard.removeAttribute("hidden");
            menuProfileCard.hidden = false;
        }
        if (menuProfileAvatar) {
            if (user.photoURL) menuProfileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}"/>`;
            else menuProfileAvatar.textContent = avatarInitial;
        }
        if (menuProfileName) menuProfileName.textContent = displayName;
        if (menuProfileTag) {
            menuProfileTag.innerHTML = isUserAdmin 
                ? `<span style="background:#ffd700;box-shadow:0 0 8px #ffd700;"></span> Official Admin`
                : `<span></span> Member`;
        }
        if (menuLogoutBtn) {
            menuLogoutBtn.removeAttribute("hidden");
            menuLogoutBtn.hidden = false;
        }

    } else {
        if (navSignInBtn) {
            navSignInBtn.removeAttribute("hidden");
            navSignInBtn.hidden = false;
        }
        if (navProfileWrap) navProfileWrap.hidden = true;
        if (navProfileDropdown) navProfileDropdown.classList.remove("show");
        if (menuProfileCard) menuProfileCard.hidden = true;
        if (menuLoginCta) {
            menuLoginCta.removeAttribute("hidden");
            menuLoginCta.hidden = false;
        }
        if (menuLogoutBtn) menuLogoutBtn.hidden = true;
    }
}

// Render Entire WhatsApp Chat Stream
function renderChatStream() {
    if (!chatStream) return;
    chatStream.innerHTML = "";

    // Filter messages by active channel
    const filtered = allMessages.filter(m => (m.channel || "general") === currentChannel);

    // System Security Notice Pill
    const sysNotice = document.createElement("div");
    sysNotice.className = "wa-system-notice";
    sysNotice.innerHTML = `
        <span>${currentChannel === "announcements" 
            ? "Official Announcements Channel. Only verified Total Gaming Admins can post broadcasts here." 
            : "Welcome to TG Fan Lounge! Open community chat for all fans. Messages are moderated in real-time."}
        </span>
    `;
    chatStream.appendChild(sysNotice);

    if (filtered.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "wa-stream-loading";
        emptyMsg.innerHTML = `<span>No messages in this channel yet. Be the first to post!</span>`;
        chatStream.appendChild(emptyMsg);
        return;
    }

    let lastDateStr = "";

    filtered.forEach(msg => {
        // Date Separator if date changed
        const dateStr = formatDateSeparator(msg.createdAt);
        if (dateStr !== lastDateStr) {
            const dateDivider = document.createElement("div");
            dateDivider.className = "wa-date-divider";
            dateDivider.textContent = dateStr;
            chatStream.appendChild(dateDivider);
            lastDateStr = dateStr;
        }

        const isAuthorMe = currentUser && (msg.authorUid === currentUser.uid || (currentUser.email && msg.authorEmail === currentUser.email));
        const isMsgAdmin = msg.isAdmin === true || (msg.authorEmail && msg.authorEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase());
        const userIsAdmin = isAdmin(currentUser);

        const row = document.createElement("div");
        row.className = `wa-msg-row ${isAuthorMe ? "outgoing" : "incoming"}`;
        row.id = `msg_row_${msg.id}`;

        const bubble = document.createElement("div");
        bubble.className = `wa-msg-bubble ${isMsgAdmin ? "admin-post" : ""}`;

        // Admin VIP Special Header
        if (isMsgAdmin) {
            const adminHeader = document.createElement("div");
            adminHeader.className = "wa-admin-header";
            adminHeader.innerHTML = `
                <span class="wa-admin-badge-pill">
                    TOTAL GAMING OFFICIAL ADMIN
                </span>
                <span class="wa-admin-channel-pill">
                    ${msg.channel === "announcements" ? "OFFICIAL BROADCAST" : "VERIFIED"}
                </span>
            `;
            bubble.appendChild(adminHeader);
        }

        // Author Avatar & Name Row
        if (!isAuthorMe || isMsgAdmin) {
            const authorRow = document.createElement("div");
            authorRow.className = "wa-author-row";

            const authorAvatar = document.createElement("div");
            authorAvatar.className = "wa-msg-author-avatar";
            const authorPhoto = msg.authorPhoto || (isAuthorMe && currentUser ? currentUser.photoURL : "");
            if (authorPhoto) {
                authorAvatar.innerHTML = `<img src="${authorPhoto}" alt="${msg.author || "User"}"/>`;
            } else {
                authorAvatar.textContent = (msg.author || "TG").substring(0, 2).toUpperCase();
            }

            const authorSpan = document.createElement("span");
            authorSpan.className = "wa-author-name";
            authorSpan.textContent = msg.author || (isMsgAdmin ? "Total Gaming Admin" : "TG Fan");

            authorRow.appendChild(authorAvatar);
            authorRow.appendChild(authorSpan);

            if (isMsgAdmin) {
                const vipTag = document.createElement("span");
                vipTag.className = "wa-author-tag";
                vipTag.textContent = "VIP";
                authorRow.appendChild(vipTag);
            } else {
                const fanTag = document.createElement("span");
                fanTag.className = "wa-author-tag";
                fanTag.textContent = "FAN";
                authorRow.appendChild(fanTag);
            }

            bubble.appendChild(authorRow);
        }

        // Message Text
        const textP = document.createElement("div");
        textP.className = "wa-msg-text";
        textP.textContent = msg.text;
        bubble.appendChild(textP);

        // Bubble Footer (Timestamp, Likes, Double Ticks, Delete)
        const metaDiv = document.createElement("div");
        metaDiv.className = "wa-bubble-meta";

        // Likes / Reactions Badge
        const likeBadge = document.createElement("button");
        likeBadge.type = "button";
        likeBadge.className = "wa-like-badge";
        likeBadge.title = "Like this message";
        likeBadge.innerHTML = `<span>❤️</span> <span class="like-count">${msg.likesCount || 0}</span>`;
        likeBadge.addEventListener("click", () => handleLikeMessage(msg.id));
        metaDiv.appendChild(likeBadge);

        // Timestamp
        const timeSpan = document.createElement("span");
        timeSpan.className = "wa-msg-time";
        timeSpan.textContent = formatTime(msg.createdAt);
        metaDiv.appendChild(timeSpan);

        // WhatsApp Double Checkmark for Outgoing
        if (isAuthorMe) {
            const ticksSpan = document.createElement("span");
            ticksSpan.className = "wa-ticks";
            ticksSpan.title = "Read";
            ticksSpan.innerHTML = `✓✓`;
            metaDiv.appendChild(ticksSpan);
        }

        // Delete Button: Admin can delete ANY message; Normal user can delete ONLY own message
        if (userIsAdmin || isAuthorMe) {
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "wa-delete-btn";
            delBtn.title = userIsAdmin && !isAuthorMe ? "Delete as Admin Moderator" : "Delete your message";
            delBtn.innerHTML = `🗑️`;
            delBtn.addEventListener("click", () => handleDeleteMessage(msg.id, msg.author));
            metaDiv.appendChild(delBtn);
        }

        bubble.appendChild(metaDiv);
        row.appendChild(bubble);
        chatStream.appendChild(row);
    });

    // Scroll to bottom
    chatStream.scrollTop = chatStream.scrollHeight;
}

// Switch Active Channel
function switchChannel(channel) {
    currentChannel = channel;

    // Header tabs
    if (tabGeneral && tabAnnouncements) {
        if (channel === "general") {
            tabGeneral.classList.add("active");
            tabGeneral.setAttribute("aria-selected", "true");
            tabAnnouncements.classList.remove("active");
            tabAnnouncements.setAttribute("aria-selected", "false");
        } else {
            tabAnnouncements.classList.add("active");
            tabAnnouncements.setAttribute("aria-selected", "true");
            tabGeneral.classList.remove("active");
            tabGeneral.setAttribute("aria-selected", "false");
        }
    }

    // Dropdown channels
    if (dropChannelGeneral && dropChannelAnnouncements) {
        dropChannelGeneral.classList.toggle("active", channel === "general");
        dropChannelAnnouncements.classList.toggle("active", channel === "announcements");
    }

    // Menu channels
    if (menuTabGeneral && menuTabAnnouncements) {
        menuTabGeneral.classList.toggle("active", channel === "general");
        menuTabAnnouncements.classList.toggle("active", channel === "announcements");
    }

    // Update Info Ribbon Text
    if (waRibbonText) {
        waRibbonText.innerHTML = channel === "announcements"
            ? `📢 <strong>Official Announcements Channel</strong>. Broadcast messages from verified Total Gaming Admins.`
            : `Messages in <strong>Fan Lounge</strong> are live for all TG fans. Respect community rules.`;
    }

    // Input Lock for non-admins on Announcements channel
    const userIsAdmin = isAdmin(currentUser);
    if (channel === "announcements" && !userIsAdmin) {
        if (waAnnouncementsLock) waAnnouncementsLock.hidden = false;
        if (waMessageInput) {
            waMessageInput.disabled = true;
            waMessageInput.placeholder = "🔒 Only Official TG Admins can post in Official Announcements";
        }
        if (waSendBtn) waSendBtn.disabled = true;
    } else {
        if (waAnnouncementsLock) waAnnouncementsLock.hidden = true;
        if (waMessageInput) {
            waMessageInput.disabled = false;
            waMessageInput.placeholder = channel === "announcements" 
                ? "Type an official announcement..." 
                : "Type a message in TG Community...";
        }
        if (waSendBtn) waSendBtn.disabled = false;
    }

    renderChatStream();
}

// Send Message Handler
async function handleSendMessage(e) {
    if (e) e.preventDefault();
    if (!waMessageInput) return;

    const text = waMessageInput.value.trim();
    if (!text) return;

    // Check authentication
    if (!currentUser) {
        showAuthModal();
        return;
    }

    const userIsAdmin = isAdmin(currentUser);

    // Block non-admin from posting in announcements
    if (currentChannel === "announcements" && !userIsAdmin) {
        alert("Only official Total Gaming Admins can post in Announcements channel.");
        return;
    }

    waMessageInput.value = "";

    const newMsg = {
        text,
        author: currentUser.displayName || (userIsAdmin ? "TOTAL GAMING OFFICIAL (Ajay)" : "TG Fan"),
        authorUid: currentUser.uid || "fan_" + Date.now(),
        authorEmail: currentUser.email || "",
        authorPhoto: currentUser.photoURL || "",
        isAdmin: userIsAdmin,
        channel: currentChannel,
        createdAt: Date.now(),
        likesCount: 0
    };

    // 1. If Firebase DB available, write to Firestore
    if (db) {
        try {
            const chatCol = collection(db, "tg_community_chat");
            await addDoc(chatCol, {
                ...newMsg,
                serverTime: serverTimestamp()
            });
            return;
        } catch (err) {
            console.warn("Firestore post note, saving locally:", err);
        }
    }

    // 2. Fallback to LocalStorage
    const localId = "local_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const fullMsg = { ...newMsg, id: localId };
    allMessages.push(fullMsg);
    saveLocalMessages(allMessages);
    renderChatStream();
}

// Delete Message Handler
async function handleDeleteMessage(msgId, authorName) {
    if (!confirm(`Are you sure you want to delete this message from ${authorName || "the chat"}?`)) return;

    if (db && !msgId.startsWith("seed_") && !msgId.startsWith("local_")) {
        try {
            const docRef = doc(db, "tg_community_chat", msgId);
            await deleteDoc(docRef);
            return;
        } catch (err) {
            console.warn("Firestore delete note:", err);
        }
    }

    // Local / fallback delete
    allMessages = allMessages.filter(m => m.id !== msgId);
    saveLocalMessages(allMessages);
    renderChatStream();
}

// Like Message Handler
function handleLikeMessage(msgId) {
    const msg = allMessages.find(m => m.id === msgId);
    if (!msg) return;

    msg.likesCount = (msg.likesCount || 0) + 1;
    saveLocalMessages(allMessages);
    renderChatStream();
}

// Auth Modal Controls
function showAuthModal() {
    if (!authModal) return;
    authModal.removeAttribute("hidden");
    authModal.hidden = false;
    selectedAvatarDataUrl = "";
    if (modalAvatarPreview) modalAvatarPreview.innerHTML = "TG";
    if (modalAvatarHint) {
        modalAvatarHint.textContent = "Upload custom photo (optional)";
        modalAvatarHint.style.color = "#718096";
    }
    if (demoUsernameInput) {
        demoUsernameInput.value = "";
        demoUsernameInput.focus();
    }
    if (authMessage) {
        authMessage.className = "auth-feedback";
        authMessage.textContent = "";
        authMessage.style.display = "none";
    }
}

function hideAuthModal() {
    if (!authModal) return;
    authModal.setAttribute("hidden", "true");
    authModal.hidden = true;
}

function showAuthFeedback(msg, type = "error") {
    if (!authMessage) return;
    authMessage.textContent = msg;
    authMessage.className = `auth-feedback ${type}`;
    authMessage.style.display = "block";
}

// Google Sign In
async function handleGoogleSignIn() {
    if (!auth) {
        showAuthFeedback("Google Sign-In is initializing. Try Gamer Tag login below.", "error");
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        currentUser = {
            uid: user.uid,
            displayName: user.displayName || "TG Community Fan",
            email: user.email,
            photoURL: user.photoURL || "",
            isAnonymous: false
        };
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentUser));
        renderUserUI(currentUser);
        hideAuthModal();
        switchChannel(currentChannel);
    } catch (err) {
        console.warn("Popup error, trying redirect:", err);
        try {
            await signInWithRedirect(auth, provider);
        } catch (redirErr) {
            showAuthFeedback("Google Sign-In note: " + (redirErr.message || "Please use Gamer Tag login"), "error");
        }
    }
}

// Demo / Gamer Tag Fan Sign In
function handleDemoSignIn() {
    const tag = (demoUsernameInput ? demoUsernameInput.value.trim() : "");
    if (!tag) {
        showAuthFeedback("Please enter your Gamer Tag to join the chat.", "error");
        return;
    }

    const isTaggedAdmin = tag.toLowerCase() === "ajay" || tag.toLowerCase() === "fozyajay";
    currentUser = {
        uid: "fan_" + Date.now(),
        displayName: tag,
        email: isTaggedAdmin ? ADMIN_EMAIL : "",
        photoURL: selectedAvatarDataUrl || "",
        isAnonymous: true,
        isAdmin: isTaggedAdmin
    };

    try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentUser));
    } catch (e) {}

    renderUserUI(currentUser);
    hideAuthModal();
    switchChannel(currentChannel);
}

// Logout Handler
async function handleLogout() {
    if (auth) {
        try {
            await signOut(auth);
        } catch (e) {}
    }
    currentUser = null;
    selectedAvatarDataUrl = "";
    localStorage.removeItem(DEMO_STORAGE_KEY);
    renderUserUI(null);
    switchChannel(currentChannel);
}

// Real-Time Sync Setup (Firestore + LocalStorage fallback)
function initChatSync() {
    // 1. Load cached messages first for instant speed
    allMessages = getLocalMessages();
    renderChatStream();

    // 2. Attach Firestore Real-Time Listener
    if (db) {
        try {
            const chatCol = collection(db, "tg_community_chat");
            const q = query(chatCol, orderBy("createdAt", "asc"));
            
            unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                const liveMsgs = [];
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    liveMsgs.push({
                        id: docSnap.id,
                        ...data,
                        createdAt: data.createdAt || Date.now()
                    });
                });

                if (liveMsgs.length > 0) {
                    allMessages = liveMsgs;
                } else if (allMessages.length === 0) {
                    allMessages = INITIAL_SEED_MESSAGES;
                }
                saveLocalMessages(allMessages);
                renderChatStream();
            }, (error) => {
                console.warn("Firestore snapshot note, keeping local stream:", error);
            });
        } catch (e) {
            console.warn("Firestore sync init note:", e);
        }
    }
}

// Event Listeners Initialization
function initEventListeners() {
    // Message Form Submit
    if (waChatForm) {
        waChatForm.addEventListener("submit", handleSendMessage);
    }
    if (waMessageInput) {
        waMessageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    // Channel Switcher Tabs in WhatsApp Header
    if (tabGeneral) tabGeneral.addEventListener("click", () => switchChannel("general"));
    if (tabAnnouncements) tabAnnouncements.addEventListener("click", () => switchChannel("announcements"));

    // Modal buttons & Trigger Actions
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", hideAuthModal);
    }
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener("click", handleGoogleSignIn);
    }
    if (demoSignInBtn) {
        demoSignInBtn.addEventListener("click", handleDemoSignIn);
    }
    if (navSignInBtn) {
        navSignInBtn.addEventListener("click", showAuthModal);
    }
    if (menuLoginCta) {
        menuLoginCta.addEventListener("click", () => {
            showAuthModal();
            if (menuPanel) menuPanel.classList.remove("show");
        });
    }

    // Custom Avatar Upload in Login Modal
    if (modalAvatarInput) {
        modalAvatarInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                processAvatarFile(file, (dataUrl) => {
                    selectedAvatarDataUrl = dataUrl;
                    if (modalAvatarPreview) {
                        modalAvatarPreview.innerHTML = `<img src="${dataUrl}" alt="Preview"/>`;
                    }
                    if (modalAvatarHint) {
                        modalAvatarHint.textContent = "Photo selected ✓";
                        modalAvatarHint.style.color = "#25d366";
                    }
                });
            }
        });
    }

    // Change Photo in Profile Dropdown
    if (changePhotoInput) {
        changePhotoInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                processAvatarFile(file, (dataUrl) => {
                    if (currentUser) {
                        currentUser.photoURL = dataUrl;
                        try {
                            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentUser));
                        } catch (err) {}
                        renderUserUI(currentUser);
                        renderChatStream();
                    }
                });
            }
        });
    }

    // Dropdown Channel Buttons
    if (dropChannelGeneral) {
        dropChannelGeneral.addEventListener("click", () => {
            switchChannel("general");
            if (navProfileDropdown) navProfileDropdown.classList.remove("show");
        });
    }
    if (dropChannelAnnouncements) {
        dropChannelAnnouncements.addEventListener("click", () => {
            switchChannel("announcements");
            if (navProfileDropdown) navProfileDropdown.classList.remove("show");
        });
    }

    // Menu Panel Channel Buttons
    if (menuTabGeneral) {
        menuTabGeneral.addEventListener("click", () => {
            switchChannel("general");
            if (menuPanel) menuPanel.classList.remove("show");
        });
    }
    if (menuTabAnnouncements) {
        menuTabAnnouncements.addEventListener("click", () => {
            switchChannel("announcements");
            if (menuPanel) menuPanel.classList.remove("show");
        });
    }

    // Navbar Profile Dropdown
    if (navProfileBtn && navProfileDropdown) {
        navProfileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navProfileDropdown.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (navProfileDropdown.classList.contains("show") && !navProfileDropdown.contains(e.target) && !navProfileBtn.contains(e.target)) {
                navProfileDropdown.classList.remove("show");
            }
        });
    }

    if (navLogoutBtn) navLogoutBtn.addEventListener("click", handleLogout);
    if (menuLogoutBtn) menuLogoutBtn.addEventListener("click", handleLogout);

    // Cross tab sync
    window.addEventListener("storage", (e) => {
        if (e.key === DEMO_STORAGE_KEY) {
            try {
                currentUser = e.newValue ? JSON.parse(e.newValue) : null;
                renderUserUI(currentUser);
                switchChannel(currentChannel);
            } catch (err) {}
        }
        if (e.key === LOCAL_MESSAGES_KEY) {
            try {
                allMessages = e.newValue ? JSON.parse(e.newValue) : [];
                renderChatStream();
            } catch (err) {}
        }
    });
}

// App Initialization
function initApp() {
    initEventListeners();

    // 1. Check Saved Local User
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
        } catch (e) {
            localStorage.removeItem(DEMO_STORAGE_KEY);
        }
    }

    renderUserUI(currentUser);

    // 2. Check Firebase Redirect / Auth
    if (auth) {
        getRedirectResult(auth).then(result => {
            if (result && result.user) {
                currentUser = {
                    uid: result.user.uid,
                    displayName: result.user.displayName || "TG Community Fan",
                    email: result.user.email,
                    photoURL: result.user.photoURL || "",
                    isAnonymous: false
                };
                localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentUser));
                renderUserUI(currentUser);
                switchChannel(currentChannel);
            }
        }).catch(e => console.warn(e));

        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = {
                    uid: user.uid,
                    displayName: user.displayName || "TG Community Fan",
                    email: user.email,
                    photoURL: user.photoURL || "",
                    isAnonymous: user.isAnonymous
                };
                localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentUser));
                renderUserUI(currentUser);
            }
        });
    }

    // 3. Start Chat Sync
    initChatSync();
}

// Start Application
initApp();

// Theme Toggle and Navigation
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("tg-theme");
if (savedTheme === "light") document.body.classList.add("light-theme");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        localStorage.setItem("tg-theme", document.body.classList.contains("light-theme") ? "light" : "dark");
    });
}

const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");
if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", () => {
        menuPanel.classList.toggle("show");
    });
    document.querySelectorAll(".menu-panel a").forEach(link => link.addEventListener("click", () => {
        menuPanel.classList.remove("show");
    }));
}
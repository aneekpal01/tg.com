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
const authMessage = document.getElementById("authMessage");

const chatStream = document.getElementById("communityChatStream");
const waChatForm = document.getElementById("waChatForm");
const waMessageInput = document.getElementById("waMessageInput");
const waSendBtn = document.getElementById("waSendBtn");
const waEmojiToggle = document.getElementById("waEmojiToggle");
const waEmojiShelf = document.getElementById("waEmojiShelf");
const waEmojiClose = document.getElementById("waEmojiClose");

const tabGeneral = document.getElementById("tabGeneral");
const tabAnnouncements = document.getElementById("tabAnnouncements");
const waRibbonText = document.getElementById("waRibbonText");
const waAnnouncementsLock = document.getElementById("waAnnouncementsLock");
const waUserChip = document.getElementById("waUserChip");
const navProfileWrap = document.getElementById("navProfileWrap");
const navProfileBtn = document.getElementById("navProfileBtn");
const navProfileDropdown = document.getElementById("navProfileDropdown");
const navProfileAvatar = document.getElementById("navProfileAvatar");
const dropdownAvatar = document.getElementById("dropdownAvatar");
const dropdownName = document.getElementById("dropdownName");
const dropdownTag = document.getElementById("dropdownTag");
const navLogoutBtn = document.getElementById("navLogoutBtn");
const menuProfileCard = document.getElementById("menuProfileCard");
const menuProfileAvatar = document.getElementById("menuProfileAvatar");
const menuProfileName = document.getElementById("menuProfileName");
const menuProfileTag = document.getElementById("menuProfileTag");
const menuLogoutBtn = document.getElementById("menuLogoutBtn");

// State
let currentUser = null;
let currentChannel = "general"; // "general" | "announcements"
let allMessages = [];
let unsubscribeFirestore = null;

// Initial Seed Messages (Used if Firestore collection is fresh)
const INITIAL_SEED_MESSAGES = [
    {
        id: "seed_1",
        text: "🔥 WELCOME TO THE OFFICIAL TOTAL GAMING COMMUNITY HUB! Drop your Free Fire Gamer Tag below and connect with all TG fans!",
        author: "TOTAL GAMING OFFICIAL (Ajay)",
        authorUid: "admin_ajay_001",
        authorEmail: "fozyajay27@gmail.com",
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
        isAdmin: true,
        channel: "announcements",
        createdAt: Date.now() - 1000 * 60 * 60,
        likesCount: 98
    }
];

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
    if (!waUserChip) return;
    waUserChip.innerHTML = "";

    if (user) {
        const isUserAdmin = isAdmin(user);
        const displayName = user.displayName || (isUserAdmin ? "TG Admin" : "TG Fan");
        const avatarInitial = displayName.substring(0, 2).toUpperCase();

        const chipBtn = document.createElement("button");
        chipBtn.type = "button";
        chipBtn.className = "wa-chip-btn";
        chipBtn.title = `Logged in as ${displayName}`;

        const avatarDiv = document.createElement("div");
        avatarDiv.className = "wa-chip-avatar";
        if (user.photoURL) {
            const img = document.createElement("img");
            img.src = user.photoURL;
            img.alt = displayName;
            avatarDiv.appendChild(img);
        } else {
            avatarDiv.textContent = avatarInitial;
        }

        const nameSpan = document.createElement("span");
        nameSpan.textContent = displayName;

        chipBtn.appendChild(avatarDiv);
        chipBtn.appendChild(nameSpan);

        if (isUserAdmin) {
            const adminStar = document.createElement("span");
            adminStar.className = "wa-admin-star-badge";
            adminStar.textContent = "⭐ ADMIN";
            chipBtn.appendChild(adminStar);
        }

        chipBtn.addEventListener("click", () => {
            if (confirm(`Logged in as ${displayName}. Do you want to log out?`)) {
                handleLogout();
            }
        });

        waUserChip.appendChild(chipBtn);

        // Sync Desktop Navbar Profile
        if (navProfileWrap) {
            navProfileWrap.removeAttribute("hidden");
            navProfileWrap.hidden = false;
        }
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
        const loginBtn = document.createElement("button");
        loginBtn.type = "button";
        loginBtn.className = "wa-chip-btn";
        loginBtn.innerHTML = `<span>🎮</span> <span>Sign In to Chat</span>`;
        loginBtn.addEventListener("click", () => {
            showAuthModal();
        });
        waUserChip.appendChild(loginBtn);

        if (navProfileWrap) navProfileWrap.hidden = true;
        if (menuProfileCard) menuProfileCard.hidden = true;
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
        <span>🔒</span>
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
                    <span>👑</span> TOTAL GAMING OFFICIAL ADMIN
                </span>
                <span class="wa-admin-channel-pill">
                    ${msg.channel === "announcements" ? "📢 OFFICIAL BROADCAST" : "💬 VERIFIED"}
                </span>
            `;
            bubble.appendChild(adminHeader);
        }

        // Author Name Row (for incoming messages or admin posts)
        if (!isAuthorMe || isMsgAdmin) {
            const authorRow = document.createElement("div");
            authorRow.className = "wa-msg-author-row";

            const authorName = document.createElement("span");
            authorName.className = "wa-msg-author";
            authorName.textContent = msg.author || "TG Fan";

            const authorTag = document.createElement("span");
            authorTag.className = "wa-author-tag";
            authorTag.textContent = isMsgAdmin ? "VIP" : "FAN";

            authorRow.appendChild(authorName);
            authorRow.appendChild(authorTag);
            bubble.appendChild(authorRow);
        }

        // Message Text Content
        const msgText = document.createElement("p");
        msgText.className = "wa-msg-text";
        msgText.textContent = msg.text;
        bubble.appendChild(msgText);

        // Bottom Meta Row (Like, Delete, Time, Double Ticks)
        const metaRow = document.createElement("div");
        metaRow.className = "wa-msg-meta";

        // Like Button
        const likeBtn = document.createElement("button");
        likeBtn.type = "button";
        likeBtn.className = "wa-msg-like-btn";
        const likeKey = `tg_walike_${msg.id}_${currentUser ? currentUser.uid : "guest"}`;
        let userLiked = localStorage.getItem(likeKey) === "true";
        let likesCount = (msg.likesCount || 0) + (userLiked ? 1 : 0);

        function updateLikeUI() {
            likeBtn.innerHTML = `<span>${userLiked ? "❤️" : "🤍"}</span><span>${likesCount > 0 ? likesCount : ""}</span>`;
            likeBtn.classList.toggle("liked", userLiked);
        }
        updateLikeUI();

        likeBtn.addEventListener("click", () => {
            userLiked = !userLiked;
            likesCount += userLiked ? 1 : -1;
            localStorage.setItem(likeKey, userLiked ? "true" : "false");
            updateLikeUI();
        });
        metaRow.appendChild(likeBtn);

        // Admin Only (or author) Delete Button
        if (userIsAdmin || isAuthorMe) {
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "wa-msg-delete-btn";
            deleteBtn.title = userIsAdmin && !isAuthorMe ? "Admin: Remove this message" : "Delete your message";
            deleteBtn.innerHTML = `🗑️`;
            deleteBtn.addEventListener("click", () => {
                const promptMsg = userIsAdmin && !isAuthorMe 
                    ? `Admin Action: Delete message from "${msg.author}"?` 
                    : "Delete your message?";
                if (confirm(promptMsg)) {
                    deleteMessage(msg.id);
                }
            });
            metaRow.appendChild(deleteBtn);
        }

        // Timestamp
        const timeSpan = document.createElement("span");
        timeSpan.className = "wa-msg-time";
        timeSpan.textContent = formatTime(msg.createdAt);
        metaRow.appendChild(timeSpan);

        // Double Blue Ticks for Outgoing
        if (isAuthorMe) {
            const ticksSpan = document.createElement("span");
            ticksSpan.className = "wa-msg-ticks";
            ticksSpan.innerHTML = `
                <svg viewBox="0 0 16 15" width="16" height="15" fill="currentColor">
                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51z"/>
                </svg>
            `;
            metaRow.appendChild(ticksSpan);
        }

        bubble.appendChild(metaRow);
        row.appendChild(bubble);
        chatStream.appendChild(row);
    });

    scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
    if (chatStream) {
        setTimeout(() => {
            chatStream.scrollTop = chatStream.scrollHeight;
        }, 30);
    }
}

// Delete Message Function
async function deleteMessage(messageId) {
    // 1. Delete from Firestore if available
    if (db) {
        try {
            await deleteDoc(doc(db, "tg_community_chat", messageId));
        } catch (e) {
            console.warn("Firestore delete fallback to local:", e);
        }
    }

    // 2. Delete from Local Array & Storage
    allMessages = allMessages.filter(m => m.id !== messageId);
    saveLocalMessages(allMessages);
    renderChatStream();
}

// Post New Message
async function postMessage(text) {
    if (!text || !text.trim()) return;

    // Ensure User Session
    if (!currentUser) {
        // Auto-assign a guest fan identity if none
        const guestName = "TG_Fan_" + Math.floor(100 + Math.random() * 900);
        currentUser = {
            uid: "guest_" + Date.now(),
            displayName: guestName,
            email: "",
            photoURL: "",
            isAnonymous: true
        };
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentUser));
        renderUserUI(currentUser);
    }

    const isUserAdmin = isAdmin(currentUser);

    // Channel Guard: Only Admin can post in Announcements
    if (currentChannel === "announcements" && !isUserAdmin) {
        alert("Only Official TG Admins (fozyajay27@gmail.com) can post in Official Announcements channel.");
        return;
    }

    const newMsg = {
        id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        text: text.trim(),
        author: currentUser.displayName || "TG Community Member",
        authorUid: currentUser.uid,
        authorEmail: currentUser.email || "",
        authorPhoto: currentUser.photoURL || "",
        isAdmin: isUserAdmin,
        channel: currentChannel,
        createdAt: Date.now(),
        likesCount: 0
    };

    // 1. Save to Firestore if available
    if (db) {
        try {
            await setDoc(doc(db, "tg_community_chat", newMsg.id), {
                ...newMsg,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.warn("Firestore write error, saving locally:", e);
        }
    }

    // 2. Append locally
    allMessages.push(newMsg);
    saveLocalMessages(allMessages);
    renderChatStream();
    scrollToBottom();
}

// Switch Active Channel
function switchChannel(channel) {
    currentChannel = channel;

    if (channel === "general") {
        tabGeneral.classList.add("active");
        tabGeneral.setAttribute("aria-selected", "true");
        tabAnnouncements.classList.remove("active");
        tabAnnouncements.setAttribute("aria-selected", "false");

        waRibbonText.innerHTML = `Messages in <strong>Fan Lounge</strong> are live for all TG fans. Respect community rules.`;
        if (waAnnouncementsLock) waAnnouncementsLock.hidden = true;
        if (waChatForm) waChatForm.hidden = false;

    } else if (channel === "announcements") {
        tabAnnouncements.classList.add("active");
        tabAnnouncements.setAttribute("aria-selected", "true");
        tabGeneral.classList.remove("active");
        tabGeneral.setAttribute("aria-selected", "false");

        const isUserAdmin = isAdmin(currentUser);
        waRibbonText.innerHTML = `<strong>Official Announcements Channel</strong>: Verified updates direct from TG Management.`;

        if (!isUserAdmin) {
            if (waAnnouncementsLock) waAnnouncementsLock.hidden = false;
            if (waChatForm) waChatForm.hidden = true;
        } else {
            if (waAnnouncementsLock) waAnnouncementsLock.hidden = true;
            if (waChatForm) waChatForm.hidden = false;
        }
    }

    renderChatStream();
}

// Setup Real-time Firestore Listener
function initChatSync() {
    allMessages = getLocalMessages();
    renderChatStream();

    if (!db) return;

    try {
        const q = query(collection(db, "tg_community_chat"), orderBy("createdAt", "asc"));
        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const fetched = [];
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    fetched.push({
                        id: docSnap.id,
                        ...data,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().getTime() : (data.createdAt || Date.now())
                    });
                });
                allMessages = fetched;
                saveLocalMessages(allMessages);
                renderChatStream();
            }
        }, (err) => {
            console.warn("Firestore snapshot notice:", err);
        });
    } catch (e) {
        console.warn("Realtime listener note:", e);
    }
}

// Auth Handlers
function showAuthModal() {
    if (authModal) {
        authModal.removeAttribute("hidden");
        authModal.hidden = false;
    }
}

function hideAuthModal() {
    if (authModal) {
        authModal.setAttribute("hidden", "");
        authModal.hidden = true;
    }
}

async function handleGoogleSignIn() {
    if (!auth) {
        alert("Firebase Auth is not available. Using Gamer Tag login instead.");
        return;
    }
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const result = await signInWithPopup(auth, provider);
        if (result && result.user) {
            const user = {
                uid: result.user.uid,
                displayName: result.user.displayName || "TG Community Fan",
                email: result.user.email,
                photoURL: result.user.photoURL || "",
                isAnonymous: false
            };
            currentUser = user;
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
            renderUserUI(currentUser);
            hideAuthModal();
            switchChannel(currentChannel);
        }
    } catch (err) {
        console.warn("Google sign-in popup error, trying redirect:", err);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
            if (authMessage) {
                authMessage.className = "auth-feedback error";
                authMessage.textContent = "Google Sign-in was closed or blocked. Try quick Fan Login below.";
            }
        }
    }
}

function handleDemoSignIn() {
    const customName = (demoUsernameInput ? demoUsernameInput.value.trim() : "") || "TG_Fan_" + Math.floor(100 + Math.random() * 900);
    const user = {
        uid: "fan_" + Date.now(),
        displayName: customName,
        email: "",
        photoURL: "",
        isAnonymous: true
    };
    currentUser = user;
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
    renderUserUI(currentUser);
    hideAuthModal();
    switchChannel(currentChannel);
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem(DEMO_STORAGE_KEY);
    if (auth) {
        signOut(auth).catch(e => console.warn(e));
    }
    renderUserUI(null);
    switchChannel("general");
}

// Event Listeners Initialization
function initEventListeners() {
    // Tab Switches
    if (tabGeneral) {
        tabGeneral.addEventListener("click", () => switchChannel("general"));
    }
    if (tabAnnouncements) {
        tabAnnouncements.addEventListener("click", () => switchChannel("announcements"));
    }

    // Message Input Submit Form
    if (waChatForm) {
        waChatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (waMessageInput) {
                const text = waMessageInput.value;
                if (text && text.trim()) {
                    postMessage(text);
                    waMessageInput.value = "";
                    if (waEmojiShelf) waEmojiShelf.hidden = true;
                }
            }
        });
    }

    // Emoji Drawer Toggle
    if (waEmojiToggle && waEmojiShelf) {
        waEmojiToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            waEmojiShelf.hidden = !waEmojiShelf.hidden;
        });
    }

    if (waEmojiClose && waEmojiShelf) {
        waEmojiClose.addEventListener("click", () => {
            waEmojiShelf.hidden = true;
        });
    }

    // Emoji Item Clicks
    document.querySelectorAll(".wa-emoji-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const emoji = btn.getAttribute("data-emoji");
            if (emoji && waMessageInput) {
                waMessageInput.value += emoji;
                waMessageInput.focus();
            }
        });
    });

    // Close Emoji shelf when clicking outside
    document.addEventListener("click", (e) => {
        if (waEmojiShelf && !waEmojiShelf.hidden && !waEmojiShelf.contains(e.target) && !waEmojiToggle.contains(e.target)) {
            waEmojiShelf.hidden = true;
        }
    });

    // Modal buttons
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", hideAuthModal);
    }
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener("click", handleGoogleSignIn);
    }
    if (demoSignInBtn) {
        demoSignInBtn.addEventListener("click", handleDemoSignIn);
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

const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {
    window.addEventListener("scroll", () => {
        const scrolled = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
        backToTopBtn.classList.toggle("visible", scrolled > 200);
    }, { passive: true });
    backToTopBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

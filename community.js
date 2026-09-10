/* ==========================================================================
   TG ESPORTS COMMUNITY — SCRIPT & SOCIAL FEED
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInAnonymously, 
    signOut, 
    setPersistence, 
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp, 
    addDoc, 
    deleteDoc 
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
    console.warn("Firebase notice:", e);
}

const ADMIN_EMAIL = "fozyajay27@gmail.com";
const DEMO_STORAGE_KEY = "tg_community_demo_user";
const COMMENT_COOLDOWN_MS = 4000;

// DOM Elements
const hero = document.getElementById("communityHero");
const authModal = document.getElementById("communityAuthModal");
const content = document.getElementById("communityContent");
const authMessage = document.getElementById("authMessage");
const postsState = document.getElementById("postsState");
const postsRoot = document.getElementById("communityPosts");
const profileRoot = document.getElementById("communityProfile");
const googleSignInBtn = document.getElementById("googleSignIn");
const demoSignInBtn = document.getElementById("demoSignIn");
const modalCloseBtn = document.getElementById("modalCloseBtn");

let currentUser = null;
let unsubscribePosts = null;
let postUnsubscribers = [];

// Default Official Esports Seed Posts
const DEFAULT_POSTS = [
    {
        id: "tg-post-1",
        author: "TOTAL GAMING ESPORTS",
        timeAgo: "2h ago",
        title: "OFFICIAL ROSTER ANNOUNCEMENT & CHAMPIONSHIP GRIND",
        text: "The squad is in bootcamp preparing for the upcoming Free Fire Championship stages! Mafia, FozyAjay, Delete, Aztec, Shanky and Wota are putting in double sessions daily. Let us know your favorite clutch play from this season in the comments below! 🔥",
        createdAt: new Date(Date.now() - 3600000 * 2),
        likesCount: 142,
        initialComments: [
            { id: "c1", displayName: "Aman_TG_Fan", timeAgo: "3m ago", text: "Full support to TG Mafia and the whole squad! 🏆", likesCount: 8, createdAt: new Date(Date.now() - 60000 * 3) },
            { id: "c2", displayName: "Rahul_Esports", timeAgo: "28m ago", text: "Can't wait to see Delete and FozyAjay dominate again!", likesCount: 4, createdAt: new Date(Date.now() - 60000 * 28) }
        ]
    },
    {
        id: "tg-post-2",
        author: "TOTAL GAMING ESPORTS",
        timeAgo: "1d ago",
        title: "BEHIND THE SCENES BOOTCAMP VLOG THIS SATURDAY",
        text: "We just finished shooting an exclusive bootcamp tour and player reaction video. Look out for the premiere on the official Total Gaming YouTube channel this Saturday! Drop your questions for the team below.",
        createdAt: new Date(Date.now() - 3600000 * 24),
        likesCount: 89,
        initialComments: [
            { id: "c3", displayName: "FreeFireLover", timeAgo: "12h ago", text: "Super excited for the vlog! Total Gaming on top ❤️", likesCount: 5, createdAt: new Date(Date.now() - 3600000 * 12) }
        ]
    }
];

// Helper Functions
function formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";
    let date = timestamp;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (!(timestamp instanceof Date)) date = new Date(timestamp);

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isAdmin(user) {
    return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function clearPostListeners() {
    if (unsubscribePosts) {
        unsubscribePosts();
        unsubscribePosts = null;
    }
    postUnsubscribers.forEach(unsub => unsub && unsub());
    postUnsubscribers = [];
}

// Render Compact Top-Left Profile Bar
function renderProfile(user) {
    profileRoot.innerHTML = "";

    const userGroup = document.createElement("div");
    userGroup.className = "profile-user-group";

    const avatar = document.createElement("div");
    avatar.className = "profile-avatar-small";
    if (user.photoURL) {
        const img = document.createElement("img");
        img.src = user.photoURL;
        img.alt = user.displayName || "User";
        avatar.appendChild(img);
    } else {
        avatar.textContent = "TG";
    }

    const details = document.createElement("div");
    details.className = "profile-details";

    const name = document.createElement("span");
    name.className = "profile-username";
    name.textContent = user.displayName || "TG Community Member";

    const tag = document.createElement("span");
    tag.className = "profile-usertag";
    tag.innerHTML = `<span></span> ${user.isAnonymous ? "Demo Member" : "Verified Member"}`;

    details.appendChild(name);
    details.appendChild(tag);
    userGroup.appendChild(avatar);
    userGroup.appendChild(details);

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "profile-logout-btn";
    logoutBtn.type = "button";
    logoutBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Logout</span>
    `;
    logoutBtn.addEventListener("click", handleLogout);

    profileRoot.appendChild(userGroup);
    profileRoot.appendChild(logoutBtn);
}

// Render Local / Seed Post
function renderLocalPost(postData, user) {
    const card = document.createElement("article");
    card.className = "community-post-card";

    // Header
    const header = document.createElement("div");
    header.className = "post-header";

    const headerLeft = document.createElement("div");
    headerLeft.className = "post-header-left";

    const avatar = document.createElement("div");
    avatar.className = "post-avatar";
    avatar.textContent = "TG";

    const meta = document.createElement("div");
    meta.className = "post-meta";

    const author = document.createElement("strong");
    author.innerHTML = `${postData.author || "TOTAL GAMING ESPORTS"} <svg viewBox="0 0 24 24" width="14" height="14" fill="#00eaff"><path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z"/></svg>`;

    const sub = document.createElement("span");
    sub.textContent = "Official TG Community";

    meta.appendChild(author);
    meta.appendChild(sub);
    headerLeft.appendChild(avatar);
    headerLeft.appendChild(meta);

    const timeSpan = document.createElement("span");
    timeSpan.className = "post-time";
    timeSpan.textContent = postData.timeAgo || formatTimeAgo(postData.createdAt);

    header.appendChild(headerLeft);
    header.appendChild(timeSpan);

    // Title & Body
    const title = document.createElement("h2");
    title.className = "post-title";
    title.textContent = postData.title;

    const body = document.createElement("p");
    body.className = "post-body";
    body.textContent = postData.text;

    // Likes & Comments Action Bar
    const actionBar = document.createElement("div");
    actionBar.className = "post-action-bar";

    const likeButton = document.createElement("button");
    likeButton.className = "post-like-btn";
    likeButton.type = "button";

    const localLikesKey = `tg_likes_${postData.id}`;
    let userLiked = localStorage.getItem(`${localLikesKey}_${user.uid}`) === "true";
    let likesCount = postData.likesCount + (userLiked ? 1 : 0);

    function updatePostLikeUI() {
        likeButton.innerHTML = `<span>${userLiked ? "❤️" : "🤍"}</span> ${likesCount} Likes`;
        likeButton.classList.toggle("liked", userLiked);
    }
    updatePostLikeUI();

    likeButton.addEventListener("click", () => {
        userLiked = !userLiked;
        likesCount += userLiked ? 1 : -1;
        localStorage.setItem(`${localLikesKey}_${user.uid}`, userLiked ? "true" : "false");
        updatePostLikeUI();
    });

    const commentsBadge = document.createElement("button");
    commentsBadge.className = "post-comments-badge";
    commentsBadge.type = "button";

    actionBar.appendChild(likeButton);
    actionBar.appendChild(commentsBadge);

    // Comments Section
    const commentsSec = document.createElement("section");
    commentsSec.className = "post-comments-section";

    const commentsTitle = document.createElement("h3");
    commentsTitle.className = "comments-title";
    commentsTitle.textContent = "COMMENTS";

    const commentList = document.createElement("div");
    commentList.className = "comment-list";

    // Load saved local comments
    const savedCommentsKey = `tg_comments_${postData.id}`;
    let savedComments = [];
    try {
        savedComments = JSON.parse(localStorage.getItem(savedCommentsKey) || "[]");
    } catch (e) {
        savedComments = [];
    }

    const allComments = [...(postData.initialComments || []), ...savedComments];

    function updateCommentsBadge() {
        commentsBadge.innerHTML = `<span>💬</span> ${allComments.length} Comments`;
    }
    updateCommentsBadge();

    // Render Comments List
    function renderCommentList() {
        commentList.innerHTML = "";
        if (allComments.length === 0) {
            const empty = document.createElement("p");
            empty.className = "comment-empty-msg";
            empty.textContent = "Be the first to comment.";
            commentList.appendChild(empty);
            return;
        }

        allComments.forEach(c => {
            const item = document.createElement("article");
            item.className = "comment-item";

            const cAvatar = document.createElement("div");
            cAvatar.className = "comment-avatar";
            cAvatar.textContent = (c.displayName || "U").substring(0, 2).toUpperCase();

            const cBodyWrap = document.createElement("div");
            cBodyWrap.className = "comment-body-wrap";

            const topRow = document.createElement("div");
            topRow.className = "comment-top-row";

            const cAuthor = document.createElement("strong");
            cAuthor.className = "comment-author";
            cAuthor.textContent = c.displayName || "TG Community Member";

            const cTime = document.createElement("span");
            cTime.className = "comment-timestamp";
            cTime.textContent = c.timeAgo || formatTimeAgo(c.createdAt);

            topRow.appendChild(cAuthor);
            topRow.appendChild(cTime);

            const cText = document.createElement("p");
            cText.className = "comment-text";
            cText.textContent = c.text;

            // Comment Action Row (Like & Reply)
            const actionsRow = document.createElement("div");
            actionsRow.className = "comment-actions-row";

            const cLikeBtn = document.createElement("button");
            cLikeBtn.className = "comment-like-action";
            cLikeBtn.type = "button";
            
            const commentLikeKey = `tg_clike_${c.id}_${user.uid}`;
            let commentLiked = localStorage.getItem(commentLikeKey) === "true";
            let commentLikesCount = (c.likesCount || 0) + (commentLiked ? 1 : 0);

            function updateCommentLikeUI() {
                cLikeBtn.innerHTML = `<span>${commentLiked ? "❤️" : "♡"}</span> Like${commentLikesCount > 0 ? ` (${commentLikesCount})` : ""}`;
                cLikeBtn.classList.toggle("liked", commentLiked);
            }
            updateCommentLikeUI();

            cLikeBtn.addEventListener("click", () => {
                commentLiked = !commentLiked;
                commentLikesCount += commentLiked ? 1 : -1;
                localStorage.setItem(commentLikeKey, commentLiked ? "true" : "false");
                updateCommentLikeUI();
            });

            const cReplyBtn = document.createElement("button");
            cReplyBtn.className = "comment-reply-action";
            cReplyBtn.type = "button";
            cReplyBtn.textContent = "Reply";
            cReplyBtn.addEventListener("click", () => {
                inputField.value = `@${c.displayName} `;
                inputField.focus();
            });

            actionsRow.appendChild(cLikeBtn);
            actionsRow.appendChild(cReplyBtn);

            cBodyWrap.appendChild(topRow);
            cBodyWrap.appendChild(cText);
            cBodyWrap.appendChild(actionsRow);

            item.appendChild(cAvatar);
            item.appendChild(cBodyWrap);
            commentList.appendChild(item);
        });
    }
    renderCommentList();

    // Modern Chat-Style Input Box
    const form = document.createElement("form");
    form.className = "comment-input-wrap";

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.className = "comment-input-field";
    inputField.maxLength = 280;
    inputField.required = true;
    inputField.placeholder = "Write a comment...";

    const sendBtn = document.createElement("button");
    sendBtn.type = "submit";
    sendBtn.className = "comment-send-btn";
    sendBtn.setAttribute("aria-label", "Send comment");
    sendBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
    `;

    form.appendChild(inputField);
    form.appendChild(sendBtn);

    // Focus input when comment badge is clicked
    commentsBadge.addEventListener("click", () => {
        inputField.focus();
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = inputField.value.trim();
        if (!text) return;

        const lastComment = Number(localStorage.getItem("tg-last-comment") || 0);
        if (Date.now() - lastComment < COMMENT_COOLDOWN_MS) {
            inputField.placeholder = "Please wait a few seconds...";
            setTimeout(() => { inputField.placeholder = "Write a comment..."; }, 2500);
            return;
        }

        const newComment = {
            id: "cmt_" + Date.now(),
            displayName: user.displayName || "TG Community Member",
            text: text,
            likesCount: 0,
            timeAgo: "Just now",
            createdAt: new Date()
        };

        allComments.push(newComment);
        savedComments.push(newComment);
        localStorage.setItem(savedCommentsKey, JSON.stringify(savedComments));
        localStorage.setItem("tg-last-comment", String(Date.now()));

        renderCommentList();
        updateCommentsBadge();
        inputField.value = "";
    });

    commentsSec.appendChild(commentsTitle);
    commentsSec.appendChild(commentList);
    commentsSec.appendChild(form);

    card.appendChild(header);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actionBar);
    card.appendChild(commentsSec);

    return card;
}

// Load Posts Function
function loadPosts(user) {
    clearPostListeners();
    postsRoot.innerHTML = "";
    postsState.hidden = false;
    postsState.textContent = "Loading community updates...";

    if (!db) {
        postsState.hidden = true;
        DEFAULT_POSTS.forEach(post => postsRoot.appendChild(renderLocalPost(post, user)));
        return;
    }

    try {
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        unsubscribePosts = onSnapshot(postsQuery, snapshot => {
            postsRoot.innerHTML = "";
            postsState.hidden = true;
            if (snapshot.empty) {
                DEFAULT_POSTS.forEach(post => postsRoot.appendChild(renderLocalPost(post, user)));
                return;
            }
            snapshot.forEach(post => {
                const data = post.data();
                data.id = post.id;
                postsRoot.appendChild(renderLocalPost(data, user));
            });
        }, error => {
            console.warn("Firestore fallback to official posts:", error);
            postsState.hidden = true;
            postsRoot.innerHTML = "";
            DEFAULT_POSTS.forEach(post => postsRoot.appendChild(renderLocalPost(post, user)));
        });
    } catch (e) {
        postsState.hidden = true;
        DEFAULT_POSTS.forEach(post => postsRoot.appendChild(renderLocalPost(post, user)));
    }
}

// State Switchers
function showLoginGate() {
    clearPostListeners();
    currentUser = null;
    if (hero) {
        hero.hidden = false;
        hero.removeAttribute("hidden");
    }
    authModal.hidden = false;
    authModal.removeAttribute("hidden");
    content.hidden = true;
    content.setAttribute("hidden", "");
    authMessage.textContent = "";
    authMessage.className = "auth-feedback";
    demoSignInBtn.disabled = false;
    updateNavProfileUI(null);
}

function showCommunityContent(user) {
    currentUser = user;
    if (hero) {
        hero.hidden = true;
        hero.setAttribute("hidden", "");
    }
    authModal.hidden = true;
    authModal.setAttribute("hidden", "");
    content.hidden = false;
    content.removeAttribute("hidden");
    renderProfile(user);
    loadPosts(user);
    updateNavProfileUI(user);
}

// Authentication Handlers
function handleLogout() {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    if (auth) {
        signOut(auth).catch(() => {});
    }
    showLoginGate();
}

// Continue with Google Button Clicked
googleSignInBtn.addEventListener("click", () => {
    authMessage.textContent = "Google Sign-In will be available soon.";
    authMessage.className = "auth-feedback alert";
});

// Demo Login Button Clicked
demoSignInBtn.addEventListener("click", async () => {
    authMessage.textContent = "";
    authMessage.className = "auth-feedback";
    demoSignInBtn.disabled = true;

    const demoUser = {
        uid: "demo_" + Math.random().toString(36).substring(2, 9),
        displayName: "TG Community Member",
        isAnonymous: true,
        photoURL: ""
    };

    // Save session in localStorage (persistent across reloads and tab navigation)
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));

    if (auth) {
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInAnonymously(auth);
        } catch (e) {
            console.info("Proceeding with local demo session:", e);
        }
    }

    showCommunityContent(demoUser);
});

// Close Button (Return to previous page or index.html)
if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
        if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
            window.history.back();
        } else {
            window.location.href = "index.html";
        }
    });
}

// Global Navbar Profile Elements
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

function updateNavProfileUI(user) {
    if (user) {
        const displayName = user.displayName || "TG Community Member";
        const isDemo = user.isAnonymous !== false;
        const tagText = isDemo ? "Demo Member" : "Verified Member";
        const avatarInitial = displayName.substring(0, 2).toUpperCase();

        if (navProfileWrap) {
            navProfileWrap.removeAttribute("hidden");
            navProfileWrap.hidden = false;
        }

        if (navProfileAvatar) {
            if (user.photoURL) {
                navProfileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
            } else {
                navProfileAvatar.textContent = avatarInitial;
            }
        }

        if (dropdownAvatar) {
            if (user.photoURL) {
                dropdownAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
            } else {
                dropdownAvatar.textContent = avatarInitial;
            }
        }

        if (dropdownName) {
            dropdownName.textContent = displayName;
        }

        if (dropdownTag) {
            dropdownTag.innerHTML = `<span></span> ${tagText}`;
        }

        if (menuProfileCard) {
            menuProfileCard.removeAttribute("hidden");
            menuProfileCard.hidden = false;
        }

        if (menuProfileAvatar) {
            if (user.photoURL) {
                menuProfileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
            } else {
                menuProfileAvatar.textContent = avatarInitial;
            }
        }

        if (menuProfileName) {
            menuProfileName.textContent = displayName;
        }

        if (menuProfileTag) {
            menuProfileTag.innerHTML = `<span></span> ${tagText}`;
        }

        if (menuLogoutBtn) {
            menuLogoutBtn.removeAttribute("hidden");
            menuLogoutBtn.hidden = false;
        }
    } else {
        if (navProfileWrap) {
            navProfileWrap.setAttribute("hidden", "");
            navProfileWrap.hidden = true;
        }

        if (navProfileDropdown) {
            navProfileDropdown.classList.remove("show");
        }

        if (navProfileBtn) {
            navProfileBtn.setAttribute("aria-expanded", "false");
        }

        if (menuProfileCard) {
            menuProfileCard.setAttribute("hidden", "");
            menuProfileCard.hidden = true;
        }

        if (menuLogoutBtn) {
            menuLogoutBtn.setAttribute("hidden", "");
            menuLogoutBtn.hidden = true;
        }
    }
}

// Wire up Navbar Profile Dropdown Events
if (navProfileBtn && navProfileDropdown) {
    navProfileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = navProfileDropdown.classList.toggle("show");
        navProfileBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (e) => {
        if (navProfileDropdown.classList.contains("show") && !navProfileDropdown.contains(e.target) && !navProfileBtn.contains(e.target)) {
            navProfileDropdown.classList.remove("show");
            navProfileBtn.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navProfileDropdown.classList.contains("show")) {
            navProfileDropdown.classList.remove("show");
            navProfileBtn.setAttribute("aria-expanded", "false");
        }
    });
}

if (navLogoutBtn) {
    navLogoutBtn.addEventListener("click", handleLogout);
}

if (menuLogoutBtn) {
    menuLogoutBtn.addEventListener("click", () => {
        handleLogout();
        if (menuPanel) {
            menuPanel.classList.remove("show");
            if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
        }
    });
}

// Listen to cross-tab storage changes
window.addEventListener("storage", (e) => {
    if (e.key === DEMO_STORAGE_KEY) {
        if (e.newValue) {
            try {
                const user = JSON.parse(e.newValue);
                showCommunityContent(user);
            } catch (err) {
                showLoginGate();
            }
        } else {
            showLoginGate();
        }
    }
});

// Initialize Auth State on Page Load
function initAuth() {
    // 1. Check if user session is saved in localStorage
    const savedUser = localStorage.getItem(DEMO_STORAGE_KEY) || sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            showCommunityContent(user);
            return;
        } catch (e) {
            localStorage.removeItem(DEMO_STORAGE_KEY);
        }
    }

    // 2. Check Firebase Auth State
    if (auth) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const activeUser = {
                    uid: user.uid,
                    displayName: user.displayName || "TG Community Member",
                    email: user.email,
                    photoURL: user.photoURL || "",
                    isAnonymous: user.isAnonymous
                };
                localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(activeUser));
                showCommunityContent(activeUser);
            } else if (!localStorage.getItem(DEMO_STORAGE_KEY)) {
                showLoginGate();
            }
        });
    } else {
        showLoginGate();
    }
}

initAuth();

// ==========================================================================
// Theme Toggle & Navigation Controls
// ==========================================================================
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("tg-theme");
if (savedTheme === "light") document.body.classList.add("light-theme");

function updateThemeLabel() {
    if (themeToggle) {
        themeToggle.setAttribute("aria-label", document.body.classList.contains("light-theme") ? "Switch to dark mode" : "Switch to light mode");
    }
}
updateThemeLabel();

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        localStorage.setItem("tg-theme", document.body.classList.contains("light-theme") ? "light" : "dark");
        updateThemeLabel();
    });
}

const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");
if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", () => {
        const open = menuPanel.classList.toggle("show");
        menuBtn.setAttribute("aria-expanded", String(open));
    });

    document.querySelectorAll(".menu-panel a").forEach(link => link.addEventListener("click", () => {
        menuPanel.classList.remove("show");
        menuBtn.setAttribute("aria-expanded", "false");
    }));

    document.addEventListener("click", event => {
        if (menuPanel.classList.contains("show") && !menuPanel.contains(event.target) && !menuBtn.contains(event.target)) {
            menuPanel.classList.remove("show");
            menuBtn.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            menuPanel.classList.remove("show");
            menuBtn.setAttribute("aria-expanded", "false");
        }
    });
}

// Back to Top Button
const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add("visible");
        } else {
            backToTopBtn.classList.remove("visible");
        }
    }, { passive: true });

    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

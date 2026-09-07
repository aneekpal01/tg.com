/* ==========================================================================
   TG ESPORTS COMMUNITY — SCRIPT & AUTH GATE
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInAnonymously, 
    signOut, 
    setPersistence, 
    browserSessionPersistence 
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
    console.warn("Firebase initialization notice:", e);
}

const ADMIN_EMAIL = "fozyajay27@gmail.com";
const DEMO_STORAGE_KEY = "tg_community_demo_user";
const COMMENT_COOLDOWN_MS = 6000;

// DOM Elements
const authModal = document.getElementById("communityAuthModal");
const loginCard = document.getElementById("communityLogin");
const content = document.getElementById("communityContent");
const authMessage = document.getElementById("authMessage");
const postsState = document.getElementById("postsState");
const postsRoot = document.getElementById("communityPosts");
const profileRoot = document.getElementById("communityProfile");
const googleSignInBtn = document.getElementById("googleSignIn");
const demoSignInBtn = document.getElementById("demoSignIn");

let currentUser = null;
let unsubscribePosts = null;
let postUnsubscribers = [];

// Default Seed Posts (Shown if Firestore is empty or connecting)
const DEFAULT_POSTS = [
    {
        id: "tg-post-1",
        author: "TOTAL GAMING ESPORTS",
        title: "OFFICIAL ROSTER ANNOUNCEMENT & CHAMPIONSHIP GRIND",
        text: "The squad is in bootcamp preparing for the upcoming Free Fire Championship stages! Mafia, FozyAjay, Delete, Aztec, Shanky and Wota are putting in double sessions daily. Let us know your favorite clutch play from this season in the comments below! 🔥",
        createdAt: new Date(Date.now() - 3600000 * 5),
        likesCount: 142,
        initialComments: [
            { id: "c1", displayName: "Aman_TG_Fan", text: "Full support to TG Mafia and the whole squad! 🏆", createdAt: new Date(Date.now() - 3600000 * 3) },
            { id: "c2", displayName: "Rahul_Esports", text: "Can't wait to see Delete and FozyAjay dominate again!", createdAt: new Date(Date.now() - 3600000 * 1) }
        ]
    },
    {
        id: "tg-post-2",
        author: "TOTAL GAMING ESPORTS",
        title: "BEHIND THE SCENES VLOG COMING THIS WEEK",
        text: "We just finished shooting an exclusive bootcamp tour and player reaction video. Look out for the premiere on the official Total Gaming YouTube channel this Saturday! Drop your questions for the team below.",
        createdAt: new Date(Date.now() - 3600000 * 24),
        likesCount: 89,
        initialComments: [
            { id: "c3", displayName: "FreeFireLover", text: "Super excited for the vlog! Total Gaming on top ❤️", createdAt: new Date(Date.now() - 3600000 * 12) }
        ]
    }
];

// Helper Functions
function formatDate(timestamp) {
    if (!timestamp) return "Just now";
    if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
    if (timestamp instanceof Date) {
        return timestamp.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
    return "Just now";
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

// Render Logged-In User Profile Header
function renderProfile(user) {
    profileRoot.innerHTML = "";

    const avatarWrap = document.createElement("div");
    avatarWrap.className = "profile-avatar-wrap";
    
    if (user.photoURL) {
        const img = document.createElement("img");
        img.src = user.photoURL;
        img.alt = user.displayName || "User Avatar";
        avatarWrap.appendChild(img);
    } else {
        // Futuristic gamer avatar SVG
        avatarWrap.innerHTML = `
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    }

    const info = document.createElement("div");
    info.className = "profile-info";

    const name = document.createElement("div");
    name.className = "profile-name";
    name.textContent = user.displayName || "TG Community Member";

    const role = document.createElement("div");
    role.className = "profile-role-tag";
    role.innerHTML = `<span></span> ${user.isAnonymous ? "TG Community Member (Demo)" : "Verified Member"}`;

    info.appendChild(name);
    info.appendChild(role);

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "logout-btn";
    logoutBtn.type = "button";
    logoutBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Logout</span>
    `;
    logoutBtn.addEventListener("click", handleLogout);

    profileRoot.appendChild(avatarWrap);
    profileRoot.appendChild(info);
    profileRoot.appendChild(logoutBtn);
}

// Render Local / Seed Posts
function renderLocalPost(postData, user) {
    const card = document.createElement("article");
    card.className = "community-post-card";

    const header = document.createElement("div");
    header.className = "post-header";

    const avatar = document.createElement("div");
    avatar.className = "post-avatar";
    avatar.textContent = "TG";

    const meta = document.createElement("div");
    meta.className = "post-meta";

    const author = document.createElement("strong");
    author.textContent = postData.author || "TOTAL GAMING ESPORTS";

    const timeSpan = document.createElement("span");
    timeSpan.textContent = formatDate(postData.createdAt);

    meta.appendChild(author);
    meta.appendChild(timeSpan);
    header.appendChild(avatar);
    header.appendChild(meta);

    const title = document.createElement("h2");
    title.className = "post-title";
    title.textContent = postData.title;

    const body = document.createElement("p");
    body.className = "post-body";
    body.textContent = postData.text;

    // Likes & Actions
    const actions = document.createElement("div");
    actions.className = "post-actions";

    const likeButton = document.createElement("button");
    likeButton.type = "button";

    const localLikesKey = `tg_likes_${postData.id}`;
    let userLiked = localStorage.getItem(`${localLikesKey}_${user.uid}`) === "true";
    let likesCount = postData.likesCount + (userLiked ? 1 : 0);

    function updateLikeBtn() {
        likeButton.innerHTML = `<span>${userLiked ? "❤️" : "🤍"}</span> Like (${likesCount})`;
        likeButton.classList.toggle("liked", userLiked);
    }
    updateLikeBtn();

    likeButton.addEventListener("click", () => {
        userLiked = !userLiked;
        likesCount += userLiked ? 1 : -1;
        localStorage.setItem(`${localLikesKey}_${user.uid}`, userLiked ? "true" : "false");
        updateLikeBtn();
    });

    const commentSummary = document.createElement("span");
    commentSummary.className = "comment-summary";
    commentSummary.textContent = "💬 Community Discussion";

    actions.appendChild(likeButton);
    actions.appendChild(commentSummary);

    // Comments Section
    const commentsSec = document.createElement("section");
    commentsSec.className = "post-comments";

    const commentsTitle = document.createElement("h3");
    commentsTitle.textContent = "COMMENTS";

    const commentList = document.createElement("div");
    commentList.className = "comment-list";

    // Load local comments
    const savedCommentsKey = `tg_comments_${postData.id}`;
    let savedComments = [];
    try {
        savedComments = JSON.parse(localStorage.getItem(savedCommentsKey) || "[]");
    } catch (e) {
        savedComments = [];
    }

    const allComments = [...(postData.initialComments || []), ...savedComments];

    function renderCommentList() {
        commentList.innerHTML = "";
        if (allComments.length === 0) {
            const empty = document.createElement("p");
            empty.className = "comment-empty";
            empty.textContent = "Be the first to comment.";
            commentList.appendChild(empty);
            return;
        }

        allComments.forEach(c => {
            const el = document.createElement("article");
            el.className = "comment";
            el.innerHTML = `
                <div class="comment-header">
                    <strong>${c.displayName || "TG Community Member"}</strong>
                    <time>${formatDate(c.createdAt)}</time>
                </div>
                <p>${c.text}</p>
            `;
            commentList.appendChild(el);
        });
    }
    renderCommentList();

    // Comment Form
    const form = document.createElement("form");
    form.className = "comment-form";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 280;
    input.required = true;
    input.placeholder = "Write a comment as " + (user.displayName || "TG Member") + "...";

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "POST COMMENT";

    form.appendChild(input);
    form.appendChild(submitBtn);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        const lastComment = Number(localStorage.getItem("tg-last-comment") || 0);
        if (Date.now() - lastComment < COMMENT_COOLDOWN_MS) {
            input.setCustomValidity("Please wait a few seconds before posting another comment.");
            input.reportValidity();
            return;
        }
        input.setCustomValidity("");

        const newComment = {
            id: "cmt-" + Date.now(),
            displayName: user.displayName || "TG Community Member",
            text: text,
            createdAt: new Date()
        };

        allComments.push(newComment);
        savedComments.push(newComment);
        localStorage.setItem(savedCommentsKey, JSON.stringify(savedComments));
        localStorage.setItem("tg-last-comment", String(Date.now()));

        renderCommentList();
        input.value = "";
    });

    commentsSec.appendChild(commentsTitle);
    commentsSec.appendChild(commentList);
    commentsSec.appendChild(form);

    card.appendChild(header);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);
    card.appendChild(commentsSec);

    return card;
}

// Render Firestore Post (when Firestore is active)
function renderFirestorePost(postSnapshot, user) {
    const post = postSnapshot.data();
    const card = document.createElement("article");
    card.className = "community-post-card";

    const header = document.createElement("div");
    header.className = "post-header";

    const avatar = document.createElement("div");
    avatar.className = "post-avatar";
    avatar.textContent = "TG";

    const meta = document.createElement("div");
    meta.className = "post-meta";

    const author = document.createElement("strong");
    author.textContent = post.author || "TOTAL GAMING ESPORTS";

    const created = document.createElement("span");
    created.textContent = formatDate(post.createdAt);

    meta.appendChild(author);
    meta.appendChild(created);
    header.appendChild(avatar);
    header.appendChild(meta);

    if (isAdmin(user)) {
        const remove = document.createElement("button");
        remove.className = "post-remove";
        remove.type = "button";
        remove.textContent = "DELETE";
        remove.addEventListener("click", async () => {
            if (confirm("Delete this update?")) {
                await deleteDoc(doc(db, "posts", postSnapshot.id));
            }
        });
        header.appendChild(remove);
    }

    const title = document.createElement("h2");
    title.className = "post-title";
    title.textContent = post.title || "TG ESPORTS UPDATE";

    const body = document.createElement("p");
    body.className = "post-body";
    body.textContent = post.text || "";

    const actions = document.createElement("div");
    actions.className = "post-actions";

    const likeButton = document.createElement("button");
    likeButton.type = "button";

    const likesRef = collection(db, "posts", postSnapshot.id, "likes");
    const commentsRef = collection(db, "posts", postSnapshot.id, "comments");

    const updateLikes = () => onSnapshot(likesRef, snapshot => {
        const isLiked = snapshot.docs.some(item => item.id === user.uid);
        likeButton.innerHTML = `<span>${isLiked ? "❤️" : "🤍"}</span> Like (${snapshot.size})`;
        likeButton.classList.toggle("liked", isLiked);
    }, () => {
        likeButton.innerHTML = `<span>🤍</span> Like`;
    });

    try {
        const unsubscribeLikes = updateLikes();
        postUnsubscribers.push(unsubscribeLikes);
    } catch (e) {
        likeButton.innerHTML = `<span>🤍</span> Like`;
    }

    likeButton.addEventListener("click", async () => {
        try {
            const likeRef = doc(likesRef, user.uid);
            const existing = await getDoc(likeRef);
            if (existing.exists()) {
                await deleteDoc(likeRef);
            } else {
                await setDoc(likeRef, { uid: user.uid, createdAt: serverTimestamp() });
            }
        } catch (e) {
            console.warn("Like operation handled locally:", e);
        }
    });

    const commentSummary = document.createElement("span");
    commentSummary.className = "comment-summary";
    commentSummary.textContent = "💬 Comments";

    actions.appendChild(likeButton);
    actions.appendChild(commentSummary);

    const comments = document.createElement("section");
    comments.className = "post-comments";

    const commentsHeading = document.createElement("h3");
    commentsHeading.textContent = "COMMENTS";

    const list = document.createElement("div");
    list.className = "comment-list";

    // Real-time Firestore Comments
    const commentsQuery = query(collection(db, "posts", postSnapshot.id, "comments"), orderBy("createdAt", "asc"));
    const unsubComments = onSnapshot(commentsQuery, snapshot => {
        list.innerHTML = "";
        if (snapshot.empty) {
            const empty = document.createElement("p");
            empty.className = "comment-empty";
            empty.textContent = "Be the first to comment.";
            list.appendChild(empty);
            return;
        }
        snapshot.forEach(commentSnapshot => {
            const comment = commentSnapshot.data();
            const article = document.createElement("article");
            article.className = "comment";
            article.innerHTML = `
                <div class="comment-header">
                    <strong>${comment.displayName || "TG Community Member"}</strong>
                    <time>${formatDate(comment.createdAt)}</time>
                </div>
                <p>${comment.text || ""}</p>
            `;
            list.appendChild(article);
        });
    }, () => {
        list.textContent = "Comments are temporarily unavailable.";
    });
    postUnsubscribers.push(unsubComments);

    const form = document.createElement("form");
    form.className = "comment-form";

    const input = document.createElement("input");
    input.maxLength = 280;
    input.required = true;
    input.placeholder = "Write a comment...";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "POST COMMENT";

    form.appendChild(input);
    form.appendChild(submit);

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text || text.length > 280) return;

        const lastComment = Number(localStorage.getItem("tg-last-comment") || 0);
        if (Date.now() - lastComment < COMMENT_COOLDOWN_MS) {
            input.setCustomValidity("Please wait a few seconds before posting another comment.");
            input.reportValidity();
            return;
        }
        input.setCustomValidity("");
        submit.disabled = true;

        try {
            await addDoc(commentsRef, {
                uid: user.uid,
                displayName: user.displayName || "TG Community Member",
                text,
                createdAt: serverTimestamp()
            });
            localStorage.setItem("tg-last-comment", String(Date.now()));
            input.value = "";
        } catch (err) {
            console.error("Comment submit error:", err);
        } finally {
            submit.disabled = false;
        }
    });

    comments.appendChild(commentsHeading);
    comments.appendChild(list);
    comments.appendChild(form);

    card.appendChild(header);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);
    card.appendChild(comments);

    return card;
}

// Load Posts Function
function loadPosts(user) {
    clearPostListeners();
    postsRoot.innerHTML = "";
    postsState.hidden = false;
    postsState.textContent = "Loading community updates...";

    if (!db) {
        // Fallback to default posts
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
                // If firestore is empty, show default posts
                DEFAULT_POSTS.forEach(post => postsRoot.appendChild(renderLocalPost(post, user)));
                return;
            }
            snapshot.forEach(post => postsRoot.appendChild(renderFirestorePost(post, user)));
        }, error => {
            console.warn("Firestore listener fallback to demo posts:", error);
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
    authModal.hidden = false;
    authModal.removeAttribute("hidden");
    content.hidden = true;
    content.setAttribute("hidden", "");
    authMessage.textContent = "";
    authMessage.className = "auth-feedback";
    demoSignInBtn.disabled = false;
}

function showCommunityContent(user) {
    currentUser = user;
    authModal.hidden = true;
    authModal.setAttribute("hidden", "");
    content.hidden = false;
    content.removeAttribute("hidden");
    renderProfile(user);
    loadPosts(user);
}

// Authentication Handlers
function handleLogout() {
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

    // Save session locally
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));

    // Also attempt Firebase Anonymous Auth if available
    if (auth) {
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInAnonymously(auth);
        } catch (e) {
            console.info("Proceeding with local demo session:", e);
        }
    }

    showCommunityContent(demoUser);
});

// Close Button Handling (Return to previous page or index.html)
const modalCloseBtn = document.getElementById("modalCloseBtn");
if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
        if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
            window.history.back();
        } else {
            window.location.href = "index.html";
        }
    });
}

// Initialize Auth State on Page Load
function initAuth() {
    // 1. Check if demo session is already active in this tab
    const savedDemo = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (savedDemo) {
        try {
            const user = JSON.parse(savedDemo);
            showCommunityContent(user);
            return;
        } catch (e) {
            sessionStorage.removeItem(DEMO_STORAGE_KEY);
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
                showCommunityContent(activeUser);
            } else if (!sessionStorage.getItem(DEMO_STORAGE_KEY)) {
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


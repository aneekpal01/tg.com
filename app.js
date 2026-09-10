/* ==================================================
   FIREBASE IMPORTS
================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* ==================================================
   FIREBASE CONFIG
================================================== */

const firebaseConfig = {

    apiKey:
    "AIzaSyChF016PV2A8EeHYu54KMZDDvvLDSvvDQE",

    authDomain:
    "tg-esports-community.firebaseapp.com",

    projectId:
    "tg-esports-community",

    storageBucket:
    "tg-esports-community.firebasestorage.app",

    messagingSenderId:
    "905506453361",

    appId:
    "1:905506453361:web:4b4437b089b3987c3528d0",

    measurementId:
    "G-6WVQEP1HD5"

};


/* ==================================================
   INITIALIZE
================================================== */

const app =
initializeApp(firebaseConfig);

const auth =
getAuth(app);

const db =
getFirestore(app);


/* ==================================================
   MAIN ADMIN
================================================== */

const ADMIN_EMAIL =
"fozyajay27@gmail.com";


/*
   Secondary admins ko baad me yaha add
   kiya ja sakta hai.

   Example:

   "secondary@gmail.com"

*/

const SECONDARY_ADMINS = [

    // "secondary@gmail.com"

];


/* ==================================================
   ADMIN CHECK
================================================== */

function isAdmin(user){

    if(!user || !user.email){

        return false;

    }


    const email =
    user.email.toLowerCase();


    if(
        email ===
        ADMIN_EMAIL.toLowerCase()
    ){

        return true;

    }


    return SECONDARY_ADMINS
        .map(e => e.toLowerCase())
        .includes(email);

}


/* ==================================================
   ELEMENTS
================================================== */

const menuBtn =
document.getElementById("menuBtn");

const menuPanel =
document.getElementById("menuPanel");


const adminUpdatesBtn =
document.getElementById("adminUpdatesBtn");

const adminLoginBtn =
document.getElementById("adminLoginBtn");

const updatesModal =
document.getElementById("updatesModal");

const updatesCloseBtn =
document.getElementById("updatesCloseBtn");


const loginModal =
document.getElementById("loginModal");

const loginXBtn =
document.getElementById("loginXBtn");

const closeLoginBtn =
document.getElementById("closeLoginBtn");

const loginBtn =
document.getElementById("loginBtn");


const logoutBtn =
document.getElementById("logoutBtn");

const adminPanel =
document.getElementById("adminPanel");


const adminUser =
document.getElementById("adminUser");

const loginMessage =
document.getElementById("loginMessage");

const adminMessage =
document.getElementById("adminMessage");

const publishBtn =
document.getElementById("publishBtn");


const communityPostBtn =
document.getElementById("communityPostBtn");

const postsContainer =
document.getElementById("postsContainer");

const adminUpdatesContainer =
document.getElementById("adminUpdatesContainer");

const navbar =
document.querySelector(".navbar");

const themeToggle =
document.getElementById("themeToggle");

const savedTheme =
localStorage.getItem("tg-theme");

if(savedTheme === "light"){
    document.body.classList.add("light-theme");
    themeToggle.setAttribute("aria-label", "Switch to dark mode");
}

themeToggle.addEventListener(
    "click",
    () => {

        const isLight =
        document.body.classList.toggle("light-theme");

        localStorage.setItem(
            "tg-theme",
            isLight ? "light" : "dark"
        );

        themeToggle.setAttribute(
            "aria-label",
            isLight ? "Switch to dark mode" : "Switch to light mode"
        );

    }
);


/* ==================================================
   MENU
================================================== */

let lastScrollY = window.scrollY;

window.addEventListener(
    "scroll",
    () => {

        const currentScrollY = window.scrollY;

        if(currentScrollY <= 20 || currentScrollY < lastScrollY){
            navbar.classList.remove("nav-hidden");
        }
        else if(currentScrollY > lastScrollY){
            navbar.classList.add("nav-hidden");
        }

        lastScrollY = currentScrollY;

    },
    { passive:true }
);

menuBtn.addEventListener(
    "click",
    () => {

        menuPanel.classList.toggle("show");
        menuBtn.setAttribute(
            "aria-expanded",
            menuPanel.classList.contains("show") ? "true" : "false"
        );

    }
);

document.addEventListener(
    "click",
    event => {

        if(
            !menuPanel.classList.contains("show") ||
            menuPanel.contains(event.target) ||
            menuBtn.contains(event.target)
        ){
            return;
        }

        menuPanel.classList.remove("show");
        menuBtn.setAttribute("aria-expanded", "false");

    }
);

document.addEventListener(
    "keydown",
    event => {

        if(event.key !== "Escape"){
            return;
        }

        menuPanel.classList.remove("show");
        menuBtn.setAttribute("aria-expanded", "false");

    }
);


document.querySelectorAll(
    ".menu-panel a"
).forEach(link => {

    link.addEventListener(
        "click",
        () => {

            menuPanel.classList.remove(
                "show"
            );
            menuBtn.setAttribute("aria-expanded", "false");

        }
    );

});


/* ==================================================
   ADMIN UPDATES OPEN
================================================== */

adminUpdatesBtn.addEventListener(
    "click",
    () => {

        updatesModal.classList.add(
            "show"
        );

    }
);


adminLoginBtn.addEventListener(
    "click",
    () => {

        menuPanel.classList.remove("show");
        menuBtn.setAttribute("aria-expanded", "false");
        loginModal.classList.add("show");

    }
);


/* ==================================================
   ADMIN UPDATES CLOSE
================================================== */

updatesCloseBtn.addEventListener(
    "click",
    () => {

        updatesModal.classList.remove(
            "show"
        );

    }
);


/* ==================================================
   LOGIN MODAL OPEN
==================================================

   Admin login ab menu me nahi hai.

   Is version me admin login panel
   automatically open hoga jab admin
   account login karega through this
   hidden login trigger.

   Future version me isko Firebase
   Google Login se fully automatic
   banaya ja sakta hai.

================================================== */


/* ==================================================
   CLOSE LOGIN
================================================== */

function closeLogin(){

    loginModal.classList.remove(
        "show"
    );

    loginMessage.textContent = "";

}


loginXBtn.addEventListener(
    "click",
    closeLogin
);


closeLoginBtn.addEventListener(
    "click",
    closeLogin
);


/* ==================================================
   ADMIN LOGIN
================================================== */

loginBtn.addEventListener(
    "click",
    async () => {

        const email =
        document
        .getElementById(
            "adminEmail"
        )
        .value
        .trim();


        const password =
        document
        .getElementById(
            "adminPassword"
        )
        .value;


        if(!email || !password){

            loginMessage.textContent =
            "Please enter Gmail and password.";

            return;

        }


        if(
            email.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
            &&
            !SECONDARY_ADMINS
            .map(e => e.toLowerCase())
            .includes(
                email.toLowerCase()
            )
        ){

            loginMessage.textContent =
            "Access denied. Admin account only.";

            return;

        }


        try{

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        }

        catch(error){

            console.error(error);

            loginMessage.textContent =
            "Login failed. Check Gmail/password.";

        }

    }
);


/* ==================================================
   AUTH STATE
================================================== */

onAuthStateChanged(
    auth,
    user => {

        if(user){

            if(isAdmin(user)){

                adminUser.textContent =
                "Logged in as: " +
                user.email;


                loginModal.classList.remove(
                    "show"
                );


                adminPanel.classList.add(
                    "show"
                );

            }

            else{

                signOut(auth);

            }

        }

    }
);


/* ==================================================
   PUBLISH ADMIN UPDATE
================================================== */

publishBtn.addEventListener(
    "click",
    async () => {

        const user =
        auth.currentUser;


        if(!isAdmin(user)){

            adminMessage.textContent =
            "Admin permission required.";

            return;

        }


        const title =
        document
        .getElementById(
            "adminPostTitle"
        )
        .value
        .trim();


        const text =
        document
        .getElementById(
            "adminPostText"
        )
        .value
        .trim();


        if(!title || !text){

            adminMessage.textContent =
            "Please enter title and update.";

            return;

        }


        try{

            await addDoc(
                collection(
                    db,
                    "posts"
                ),
                {

                    title:title,

                    text:text,

                    author:"TG ADMIN",

                    type:"admin",

                    uid:user.uid,

                    createdAt:
                    serverTimestamp()

                }
            );


            document
            .getElementById(
                "adminPostTitle"
            )
            .value = "";


            document
            .getElementById(
                "adminPostText"
            )
            .value = "";


            adminMessage.textContent =
            "🔴 Live update published successfully!";

        }

        catch(error){

            console.error(error);

            adminMessage.textContent =
            "Publish failed. Check Firestore rules.";

        }

    }
);


/* ==================================================
   ADMIN LOGOUT
================================================== */

logoutBtn.addEventListener(
    "click",
    async () => {

        await signOut(auth);

        adminPanel.classList.remove(
            "show"
        );

        adminMessage.textContent = "";

    }
);


/* ==================================================
   COMMUNITY POST
================================================== */

communityPostBtn.addEventListener(
    "click",
    async () => {

        const name =
        document
        .getElementById(
            "communityName"
        )
        .value
        .trim();


        const text =
        document
        .getElementById(
            "communityText"
        )
        .value
        .trim();


        if(!name || !text){

            alert(
                "Please enter your name and message."
            );

            return;

        }


        try{

            await addDoc(
                collection(
                    db,
                    "posts"
                ),
                {

                    title:"Community Post",

                    text:text,

                    author:name,

                    type:"community",

                    createdAt:
                    serverTimestamp()

                }
            );


            document
            .getElementById(
                "communityText"
            )
            .value = "";


            alert(
                "Community post published!"
            );

        }

        catch(error){

            console.error(error);

            alert(
                "Could not publish post. Check Firebase."
            );

        }

    }
);


/* ==================================================
   LOAD ALL POSTS
================================================== */

const postsQuery =
query(
    collection(
        db,
        "posts"
    ),
    orderBy(
        "createdAt",
        "desc"
    )
);


onSnapshot(
    postsQuery,
    snapshot => {

        postsContainer.innerHTML = "";


        if(snapshot.empty){

            postsContainer.innerHTML =
            `
            <p style="color:#777;text-align:center;">
                No community posts yet.
            </p>
            `;

            return;

        }


        snapshot.forEach(
            docSnap => {

                const post =
                docSnap.data();


                const card =
                document.createElement(
                    "div"
                );


                card.className =
                "post-card";


                if(
                    post.type ===
                    "admin"
                ){

                    card.classList.add(
                        "admin-post"
                    );

                }


                const title =
                document.createElement(
                    "h4"
                );


                title.textContent =
                post.type === "admin"
                ? "🔴 " + post.title
                : "💬 Community Post";


                const author =
                document.createElement(
                    "small"
                );


                author.style.color =
                "#aaa";


                author.textContent =
                "By " +
                (
                    post.author ||
                    "Unknown"
                );


                const text =
                document.createElement(
                    "p"
                );


                text.textContent =
                post.text || "";


                const date =
                document.createElement(
                    "div"
                );


                date.className =
                "post-date";


                if(
                    post.createdAt &&
                    post.createdAt.toDate
                ){

                    date.textContent =
                    post.createdAt
                    .toDate()
                    .toLocaleString();

                }


                card.appendChild(
                    title
                );

                card.appendChild(
                    author
                );

                card.appendChild(
                    text
                );

                card.appendChild(
                    date
                );


                postsContainer.appendChild(
                    card
                );

            }
        );

    },

    error => {

        console.error(error);

        postsContainer.innerHTML =
        `
        <p style="color:#ff6b6b;text-align:center;">
            Unable to load posts.
        </p>
        `;

    }
);


/* ==================================================
   LOAD ONLY ADMIN UPDATES
================================================== */

const adminUpdatesQuery =
query(
    collection(
        db,
        "posts"
    ),
    where(
        "type",
        "==",
        "admin"
    ),
    orderBy(
        "createdAt",
        "desc"
    )
);


onSnapshot(
    adminUpdatesQuery,
    snapshot => {

        adminUpdatesContainer.innerHTML =
        "";


        if(snapshot.empty){

            adminUpdatesContainer.innerHTML =
            `
            <p style="color:#777;text-align:center;">
                No official updates yet.
            </p>
            `;

            return;

        }


        snapshot.forEach(
            docSnap => {

                const post =
                docSnap.data();


                const card =
                document.createElement(
                    "div"
                );

                card.className =
                "update-card";


                const title =
                document.createElement(
                    "h3"
                );

                title.textContent =
                "🔴 " +
                (
                    post.title ||
                    "TG Official Update"
                );


                const text =
                document.createElement(
                    "p"
                );

                text.textContent =
                post.text || "";


                const meta =
                document.createElement(
                    "div"
                );

                meta.className =
                "update-meta";


                if(
                    post.createdAt &&
                    post.createdAt.toDate
                ){

                    meta.textContent =
                    "TG ADMIN • " +
                    post.createdAt
                    .toDate()
                    .toLocaleString();

                }
                else{

                    meta.textContent =
                    "TG ADMIN • Just now";

                }


                card.appendChild(
                    title
                );

                card.appendChild(
                    text
                );

                card.appendChild(
                    meta
                );


                adminUpdatesContainer.appendChild(
                    card
                );

            }
        );

    },

    error => {

        console.error(error);

        adminUpdatesContainer.innerHTML =
        `
        <p style="color:#ff6b6b;text-align:center;">
            Unable to load official updates.
        </p>
        `;

    }
);


/* ==================================================
   SCROLL REVEAL
================================================== */

const revealElements =
document.querySelectorAll(
    ".reveal"
);


function revealOnScroll(){

    const windowHeight =
    window.innerHeight;


    revealElements.forEach(
        element => {

            const elementTop =
            element
            .getBoundingClientRect()
            .top;


            if(
                elementTop <
                windowHeight - 80
            ){

                element.classList.add(
                    "active"
                );

            }

        }
    );

}


window.addEventListener(
    "scroll",
    revealOnScroll
);


revealOnScroll();


/* ==================================================
   CLOSE MODALS BY CLICKING OUTSIDE
================================================== */

loginModal.addEventListener(
    "click",
    event => {

        if(
            event.target ===
            loginModal
        ){

            closeLogin();

        }

    }
);


updatesModal.addEventListener(
    "click",
    event => {

        if(
            event.target ===
            updatesModal
        ){

            updatesModal.classList.remove(
                "show"
            );

        }

    }
);

/* ==================================================
   GLOBAL USER PROFILE (NAVBAR & MOBILE MENU)
   ================================================== */

const DEMO_STORAGE_KEY = "tg_community_demo_user";

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

function updateGlobalProfileUI(user){
    if(user){
        const displayName = user.displayName || "TG Community Member";
        const isDemo = user.isAnonymous !== false;
        const tagText = isDemo ? "Demo Member" : "Verified Member";
        const avatarInitial = displayName.substring(0, 2).toUpperCase();

        if(navProfileWrap){
            navProfileWrap.removeAttribute("hidden");
            navProfileWrap.hidden = false;
        }

        if(navProfileAvatar){
            if(user.photoURL){
                navProfileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
            } else {
                navProfileAvatar.textContent = avatarInitial;
            }
        }

        if(dropdownAvatar){
            if(user.photoURL){
                dropdownAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
            } else {
                dropdownAvatar.textContent = avatarInitial;
            }
        }

        if(dropdownName){
            dropdownName.textContent = displayName;
        }

        if(dropdownTag){
            dropdownTag.innerHTML = `<span></span> ${tagText}`;
        }

        if(menuProfileCard){
            menuProfileCard.removeAttribute("hidden");
            menuProfileCard.hidden = false;
        }

        if(menuProfileAvatar){
            if(user.photoURL){
                menuProfileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
            } else {
                menuProfileAvatar.textContent = avatarInitial;
            }
        }

        if(menuProfileName){
            menuProfileName.textContent = displayName;
        }

        if(menuProfileTag){
            menuProfileTag.innerHTML = `<span></span> ${tagText}`;
        }

        if(menuLogoutBtn){
            menuLogoutBtn.removeAttribute("hidden");
            menuLogoutBtn.hidden = false;
        }
    } else {
        if(navProfileWrap){
            navProfileWrap.setAttribute("hidden", "");
            navProfileWrap.hidden = true;
        }

        if(navProfileDropdown){
            navProfileDropdown.classList.remove("show");
        }

        if(navProfileBtn){
            navProfileBtn.setAttribute("aria-expanded", "false");
        }

        if(menuProfileCard){
            menuProfileCard.setAttribute("hidden", "");
            menuProfileCard.hidden = true;
        }

        if(menuLogoutBtn){
            menuLogoutBtn.setAttribute("hidden", "");
            menuLogoutBtn.hidden = true;
        }
    }
}

function handleGlobalLogout(){
    localStorage.removeItem(DEMO_STORAGE_KEY);
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    signOut(auth).catch(() => {});
    updateGlobalProfileUI(null);
}

function initGlobalProfile(){
    // Check local storage session
    const savedUser = localStorage.getItem(DEMO_STORAGE_KEY) || sessionStorage.getItem(DEMO_STORAGE_KEY);
    if(savedUser){
        try{
            const parsed = JSON.parse(savedUser);
            updateGlobalProfileUI(parsed);
        }catch(e){
            localStorage.removeItem(DEMO_STORAGE_KEY);
            updateGlobalProfileUI(null);
        }
    } else {
        updateGlobalProfileUI(null);
    }

    // Toggle dropdown
    if(navProfileBtn && navProfileDropdown){
        navProfileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = navProfileDropdown.classList.toggle("show");
            navProfileBtn.setAttribute("aria-expanded", String(isOpen));
        });

        document.addEventListener("click", (e) => {
            if(navProfileDropdown.classList.contains("show") && !navProfileDropdown.contains(e.target) && !navProfileBtn.contains(e.target)){
                navProfileDropdown.classList.remove("show");
                navProfileBtn.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", (e) => {
            if(e.key === "Escape" && navProfileDropdown.classList.contains("show")){
                navProfileDropdown.classList.remove("show");
                navProfileBtn.setAttribute("aria-expanded", "false");
            }
        });
    }

    if(navLogoutBtn){
        navLogoutBtn.addEventListener("click", handleGlobalLogout);
    }

    if(menuLogoutBtn){
        menuLogoutBtn.addEventListener("click", () => {
            handleGlobalLogout();
            if(menuPanel){
                menuPanel.classList.remove("show");
                if(menuBtn) menuBtn.setAttribute("aria-expanded", "false");
            }
        });
    }

    // Listen to storage changes across tabs
    window.addEventListener("storage", (e) => {
        if(e.key === DEMO_STORAGE_KEY){
            if(e.newValue){
                try{
                    updateGlobalProfileUI(JSON.parse(e.newValue));
                }catch(err){
                    updateGlobalProfileUI(null);
                }
            } else {
                updateGlobalProfileUI(null);
            }
        }
    });
}

initGlobalProfile();

/* ==================================================
   MAGNETIC CAROUSEL (ORIGINKIT EFFECT)
================================================== */
function initMagneticCarousel() {
    const track = document.getElementById("magneticCarouselTrack");
    const backdrop = document.getElementById("magneticBackdrop");
    if (!track) return;

    const cards = Array.from(track.querySelectorAll(".magnetic-card"));
    const count = cards.length;
    if (count === 0) return;

    // Config parameters based on Originkit presets
    const getDimensions = () => {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
        if (isMobile) {
            return {
                collapsedWidth: 70,
                hoverWidth: 150,
                collapsedHeight: 280,
                hoverHeight: 330,
                openSize: Math.min(window.innerWidth - 32, 440),
                gap: 8,
                influence: 110,
                blur: 24,
            };
        } else if (isTablet) {
            return {
                collapsedWidth: 90,
                hoverWidth: 180,
                collapsedHeight: 320,
                hoverHeight: 370,
                openSize: Math.min(window.innerWidth - 48, 540),
                gap: 12,
                influence: 150,
                blur: 26,
            };
        }
        return {
            collapsedWidth: 110,
            hoverWidth: 220,
            collapsedHeight: 350,
            hoverHeight: 410,
            openSize: 620,
            gap: 16,
            influence: 190,
            blur: 28,
        };
    };

    let targetFactors = new Array(count).fill(0);
    let curFactors = new Array(count).fill(0);
    let openIndex = null;
    let animLoopId = null;

    // Apply base dimensions
    const applyDimensions = () => {
        const { collapsedWidth, collapsedHeight, gap } = getDimensions();
        track.style.gap = `${gap}px`;
        cards.forEach((card) => {
            if (openIndex === null) {
                card.style.width = `${collapsedWidth}px`;
                card.style.height = `${collapsedHeight}px`;
                card.style.filter = "none";
                card.style.opacity = "1";
                card.classList.remove("open", "blurred");
            }
        });
    };
    applyDimensions();

    const startLoop = () => {
        if (animLoopId) return;
        const step = () => {
            if (openIndex !== null) {
                animLoopId = null;
                return;
            }
            const { collapsedWidth, hoverWidth, collapsedHeight, hoverHeight } = getDimensions();
            let moving = false;
            for (let i = 0; i < count; i++) {
                const diff = (targetFactors[i] ?? 0) - curFactors[i];
                if (Math.abs(diff) > 0.001) {
                    curFactors[i] += diff * 0.2; // Smooth continuous spring/lerp
                    moving = true;
                } else {
                    curFactors[i] = targetFactors[i] ?? 0;
                }
                const f = curFactors[i];
                const w = collapsedWidth + (hoverWidth - collapsedWidth) * f;
                const h = collapsedHeight + (hoverHeight - collapsedHeight) * f;
                cards[i].style.width = `${w}px`;
                cards[i].style.height = `${h}px`;
                cards[i].style.transition = "none";
            }
            if (moving) {
                animLoopId = requestAnimationFrame(step);
            } else {
                animLoopId = null;
            }
        };
        animLoopId = requestAnimationFrame(step);
    };

    const setTargetFromCursor = (clientX) => {
        const rect = track.getBoundingClientRect();
        const cx = clientX - rect.left;
        const { collapsedWidth, gap, influence } = getDimensions();
        const totalBase = count * collapsedWidth + (count - 1) * gap;
        const startX = (rect.width - totalBase) / 2;

        for (let i = 0; i < count; i++) {
            const center = startX + i * (collapsedWidth + gap) + collapsedWidth / 2;
            const dist = Math.abs(cx - center);
            const f = Math.max(0, 1 - dist / influence);
            targetFactors[i] = f * f * (3 - 2 * f); // Smoothstep falloff
        }
        startLoop();
    };

    track.addEventListener("mousemove", (e) => {
        if (openIndex !== null) return;
        setTargetFromCursor(e.clientX);
    });

    track.addEventListener("mouseleave", () => {
        if (openIndex !== null) return;
        targetFactors.fill(0);
        startLoop();
    });

    // Touch events for mobile
    track.addEventListener("touchmove", (e) => {
        if (openIndex !== null || !e.touches[0]) return;
        setTargetFromCursor(e.touches[0].clientX);
    }, { passive: true });

    track.addEventListener("touchend", () => {
        if (openIndex !== null) return;
        targetFactors.fill(0);
        startLoop();
    });

    const openCard = (idx) => {
        if (animLoopId) {
            cancelAnimationFrame(animLoopId);
            animLoopId = null;
        }
        openIndex = idx;
        const { collapsedWidth, collapsedHeight, openSize, blur } = getDimensions();
        const dur = 0.35;
        const ease = "cubic-bezier(0.44, 0, 0.56, 1)";
        const barTransition = `width ${dur}s ${ease}, height ${dur}s ${ease}, filter ${dur}s ${ease}, opacity ${dur}s ${ease}, transform ${dur}s ${ease}`;

        cards.forEach((card, i) => {
            card.style.transition = barTransition;
            if (i === idx) {
                card.style.width = `${openSize}px`;
                card.style.height = `${openSize}px`;
                card.style.filter = "none";
                card.style.opacity = "1";
                card.classList.add("open");
                card.classList.remove("blurred");
            } else {
                card.style.width = `${collapsedWidth}px`;
                card.style.height = `${collapsedHeight}px`;
                card.style.filter = `blur(${blur}px)`;
                card.style.opacity = "0.45";
                card.classList.remove("open");
                card.classList.add("blurred");
            }
        });

        if (backdrop) {
            backdrop.classList.add("active");
        }
    };

    const closeCard = () => {
        if (openIndex === null) return;
        const { collapsedWidth, collapsedHeight } = getDimensions();
        const dur = 0.35;
        const ease = "cubic-bezier(0.44, 0, 0.56, 1)";
        const barTransition = `width ${dur}s ${ease}, height ${dur}s ${ease}, filter ${dur}s ${ease}, opacity ${dur}s ${ease}`;

        cards.forEach((card) => {
            card.style.transition = barTransition;
            card.style.width = `${collapsedWidth}px`;
            card.style.height = `${collapsedHeight}px`;
            card.style.filter = "none";
            card.style.opacity = "1";
            card.classList.remove("open", "blurred");
        });

        if (backdrop) {
            backdrop.classList.remove("active");
        }

        targetFactors.fill(0);
        curFactors.fill(0);
        openIndex = null;
    };

    cards.forEach((card, idx) => {
        card.addEventListener("click", (e) => {
            e.stopPropagation();
            if (openIndex === idx) {
                closeCard();
            } else {
                openCard(idx);
            }
        });

        const closeBtn = card.querySelector(".magnetic-close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeCard();
            });
        }
    });

    if (backdrop) {
        backdrop.addEventListener("click", (e) => {
            e.stopPropagation();
            closeCard();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && openIndex !== null) {
            closeCard();
        }
    });

    window.addEventListener("resize", () => {
        if (openIndex === null) {
            applyDimensions();
        } else {
            openCard(openIndex);
        }
    });
}

initMagneticCarousel();

/* ==========================================================================
   OUR PLAYERS — 3D COVERFLOW CAROUSEL
   ========================================================================== */

function initPlayersCoverflow() {
    const container = document.getElementById("playersCoverflow");
    const stage = document.getElementById("coverflowStage");
    if (!container || !stage) return;

    const cards = Array.from(stage.querySelectorAll(".coverflow-card"));
    const prevBtn = document.getElementById("coverflowPrevBtn");
    const nextBtn = document.getElementById("coverflowNextBtn");
    const dotsContainer = document.getElementById("coverflowDots");
    const count = cards.length;
    if (count === 0) return;

    let activeIndex = 0;
    let autoplayTimer = null;

    // Create navigation dots
    if (dotsContainer) {
        dotsContainer.innerHTML = "";
        cards.forEach((_, idx) => {
            const dot = document.createElement("button");
            dot.className = `coverflow-dot ${idx === activeIndex ? "active" : ""}`;
            dot.setAttribute("type", "button");
            dot.setAttribute("aria-label", `Go to player ${idx + 1}`);
            dot.addEventListener("click", () => {
                setActive(idx);
                resetAutoplay();
            });
            dotsContainer.appendChild(dot);
        });
    }

    const updateCoverflow = () => {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
        const xSpacing = isMobile ? 120 : (isTablet ? 170 : 215);

        cards.forEach((card, i) => {
            let offset = i - activeIndex;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;

            const isCenter = offset === 0;
            const absOffset = Math.abs(offset);
            const zOffset = isCenter ? 90 : -absOffset * 70;
            const rotateY = offset * -26;
            const scale = isCenter ? 1 : Math.max(0.78, 1 - absOffset * 0.12);
            const opacity = absOffset > 2 ? 0 : (absOffset === 2 ? 0.35 : (absOffset === 1 ? 0.88 : 1));
            const zIndex = 25 - absOffset * 3;
            const pointerEvents = absOffset > 2 ? "none" : "auto";

            card.style.transform = `translateX(${offset * xSpacing}px) translateZ(${zOffset}px) rotateY(${rotateY}deg) scale(${scale})`;
            card.style.zIndex = zIndex;
            card.style.opacity = opacity;
            card.style.pointerEvents = pointerEvents;

            if (isCenter) {
                card.classList.add("active");
                card.setAttribute("aria-current", "true");
            } else {
                card.classList.remove("active");
                card.removeAttribute("aria-current");
            }
        });

        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll(".coverflow-dot");
            dots.forEach((dot, dotIdx) => {
                dot.classList.toggle("active", dotIdx === activeIndex);
            });
        }
    };

    const setActive = (newIndex) => {
        activeIndex = (newIndex + count) % count;
        updateCoverflow();
    };

    const next = () => {
        setActive(activeIndex + 1);
    };

    const prev = () => {
        setActive(activeIndex - 1);
    };

    // Silky Smooth Hover-Intent & Click Events
    let hoverTimer = null;
    let isTransitioning = false;

    const queueActivate = (targetIdx) => {
        if (targetIdx === activeIndex || isTransitioning) return;
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
            isTransitioning = true;
            setActive(targetIdx);
            resetAutoplay();
            setTimeout(() => {
                isTransitioning = false;
            }, 320);
        }, 70);
    };

    cards.forEach((card, idx) => {
        card.addEventListener("mouseenter", () => {
            if (window.innerWidth <= 768) return;
            queueActivate(idx);
        });

        card.addEventListener("mouseleave", () => {
            if (hoverTimer) clearTimeout(hoverTimer);
        });

        // Instant activation on click
        card.addEventListener("click", (e) => {
            if (e.target.closest(".coverflow-social-btn")) {
                return;
            }
            if (idx !== activeIndex) {
                e.preventDefault();
                if (hoverTimer) clearTimeout(hoverTimer);
                isTransitioning = false;
                setActive(idx);
                resetAutoplay();
            }
        });
    });

    // Control buttons
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            prev();
            resetAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            next();
            resetAutoplay();
        });
    }

    // Touch Swipe Detection
    let touchStartX = 0;
    let touchStartY = 0;
    stage.addEventListener("touchstart", (e) => {
        if (!e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener("touchend", (e) => {
        if (!e.changedTouches[0]) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
                next();
            } else {
                prev();
            }
            resetAutoplay();
        }
    }, { passive: true });

    // Keyboard Navigation (Left / Right Arrow)
    document.addEventListener("keydown", (e) => {
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
        if (tag === "input" || tag === "textarea" || tag === "select") return;

        // Check if players section is near viewport
        const rect = container.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInView) {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                prev();
                resetAutoplay();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                next();
                resetAutoplay();
            }
        }
    });

    // Window Resize Handler
    window.addEventListener("resize", () => {
        updateCoverflow();
    });

    // Optional subtle autoplay every 6 seconds, pauses on hover
    const startAutoplay = () => {
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = setInterval(() => {
            next();
        }, 6000);
    };

    const stopAutoplay = () => {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    };

    const resetAutoplay = () => {
        stopAutoplay();
        startAutoplay();
    };

    container.addEventListener("mouseenter", stopAutoplay);
    container.addEventListener("mouseleave", startAutoplay);
    container.addEventListener("touchstart", stopAutoplay, { passive: true });

    // Initial render
    updateCoverflow();
    startAutoplay();
}

initPlayersCoverflow();


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


/* ==================================================
   MENU
================================================== */

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

            document.addEventListener(
                "keydown",
                event => {

                    if(event.key !== "Escape"){
                        return;
                    }

                    menuPanel.classList.remove("show");
                    menuBtn.setAttribute("aria-expanded", "false");
                    closeLogin();
                    updatesModal.classList.remove("show");

                }
            );

        }

    }
);

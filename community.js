import{initializeApp}from"https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import{getAuth,onAuthStateChanged,signInAnonymously,signOut,setPersistence,browserSessionPersistence}from"https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import{getFirestore,collection,doc,getDoc,setDoc,query,orderBy,onSnapshot,serverTimestamp,addDoc,deleteDoc}from"https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const app=initializeApp({
    apiKey:"AIzaSyChF016PV2A8EeHYu54KMZDDvvLDSvvDQE",
    authDomain:"tg-esports-community.firebaseapp.com",
    projectId:"tg-esports-community",
    storageBucket:"tg-esports-community.firebasestorage.app",
    messagingSenderId:"905506453361",
    appId:"1:905506453361:web:4b4437b089b3987c3528d0"
});
const auth=getAuth(app);
const db=getFirestore(app);
const ADMIN_EMAIL="fozyajay27@gmail.com";
const login=document.getElementById("communityLogin");
const authModal=document.getElementById("communityAuthModal");
const content=document.getElementById("communityContent");
const authMessage=document.getElementById("authMessage");
const postsState=document.getElementById("postsState");
const postsRoot=document.getElementById("communityPosts");
const profileRoot=document.getElementById("communityProfile");
let unsubscribePosts=null;
let postUnsubscribers=[];
const COMMENT_COOLDOWN_MS=10000;

function escapeText(value){
    return String(value??"");
}

function formatDate(timestamp){
    if(!timestamp?.toDate)return"Just now";
    return timestamp.toDate().toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
}

function isAdmin(user){
    return user?.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase();
}

function clearPostListeners(){
    unsubscribePosts?.();
    postUnsubscribers.forEach(unsubscribe=>unsubscribe());
    postUnsubscribers=[];
}

function renderProfile(user){
    profileRoot.innerHTML="";
    if(user.photoURL){
        const image=document.createElement("img");
        image.src=user.photoURL;
        image.alt="";
        profileRoot.append(image);
    }else{
        const avatar=document.createElement("div");
        avatar.className="profile-avatar-fallback";
        avatar.textContent="TG";
        profileRoot.append(avatar);
    }
    const copy=document.createElement("div");
    const name=document.createElement("strong");
    name.textContent=user.isAnonymous?"TG Community Member":(user.displayName||"TG Community Member");
    const joined=document.createElement("span");
    joined.textContent=user.isAnonymous?"Demo development session":"Authenticated community member";
    copy.append(name,joined);
    const logout=document.createElement("button");
    logout.type="button";
    logout.textContent="SIGN OUT";
    logout.addEventListener("click",()=>signOut(auth));
    profileRoot.append(copy,logout);
}

function renderComments(postId,commentsRoot,user){
    const commentsQuery=query(collection(db,"posts",postId,"comments"),orderBy("createdAt","asc"));
    const unsubscribe=onSnapshot(commentsQuery,snapshot=>{
        commentsRoot.innerHTML="";
        snapshot.forEach(commentSnapshot=>{
            const comment=commentSnapshot.data();
            const article=document.createElement("article");
            article.className="comment";
            const heading=document.createElement("strong");
            heading.textContent=comment.displayName||"Community member";
            const time=document.createElement("time");
            time.textContent=formatDate(comment.createdAt);
            const body=document.createElement("p");
            body.textContent=comment.text||"";
            article.append(heading,time,body);
        });
        if(!snapshot.size){
            const empty=document.createElement("p");
            empty.className="comment-empty";
            empty.textContent="Be the first to comment.";
            commentsRoot.append(empty);
        }
    },()=>{
        commentsRoot.textContent="Comments are temporarily unavailable.";
    });
    postUnsubscribers.push(unsubscribe);
}

function renderPost(postSnapshot,user){
    const post=postSnapshot.data();
    const card=document.createElement("article");
    card.className="community-post-card";
    const header=document.createElement("div");
    header.className="post-header";
    const avatar=document.createElement("div");
    avatar.className="post-avatar";
    avatar.textContent="TG";
    const meta=document.createElement("div");
    meta.className="post-meta";
    const author=document.createElement("strong");
    author.textContent=post.author||"TG ESPORTS";
    const created=document.createElement("span");
    created.textContent=formatDate(post.createdAt);
    meta.append(author,created);
    header.append(avatar,meta);
    if(isAdmin(user)){
        const remove=document.createElement("button");
        remove.className="post-remove";
        remove.type="button";
        remove.textContent="DELETE";
        remove.addEventListener("click",async()=>{
            if(confirm("Delete this update?"))await deleteDoc(doc(db,"posts",postSnapshot.id));
        });
        header.append(remove);
    }
    const title=document.createElement("h2");
    title.className="post-title";
    title.textContent=post.title||"TG ESPORTS UPDATE";
    const body=document.createElement("p");
    body.className="post-body";
    body.textContent=post.text||"";
    const actions=document.createElement("div");
    actions.className="post-actions";
    const likeButton=document.createElement("button");
    likeButton.type="button";
    const likesRef=collection(db,"posts",postSnapshot.id,"likes");
    const commentsRef=collection(db,"posts",postSnapshot.id,"comments");
    const updateLikes=()=>onSnapshot(likesRef,snapshot=>{
        likeButton.textContent=`${snapshot.docs.some(item=>item.id===user.uid)?"♥":"♡"} Like ${snapshot.size}`;
        likeButton.classList.toggle("liked",snapshot.docs.some(item=>item.id===user.uid));
    });
    const unsubscribeLikes=updateLikes();
    postUnsubscribers.push(unsubscribeLikes);
    likeButton.addEventListener("click",async()=>{
        const likeRef=doc(likesRef,user.uid);
        const existing=await getDoc(likeRef);
        if(existing.exists())await deleteDoc(likeRef);
        else await setDoc(likeRef,{uid:user.uid,createdAt:serverTimestamp()});
    });
    const commentCount=document.createElement("span");
    commentCount.textContent="Comments";
    actions.append(likeButton,commentCount);
    const comments=document.createElement("section");
    comments.className="post-comments";
    const commentsHeading=document.createElement("h3");
    commentsHeading.textContent="COMMENTS";
    const list=document.createElement("div");
    list.className="comment-list";
    const form=document.createElement("form");
    form.className="comment-form";
    const input=document.createElement("input");
    input.maxLength=280;
    input.required=true;
    input.placeholder="Write a comment...";
    const submit=document.createElement("button");
    submit.type="submit";
    submit.textContent="POST COMMENT";
    form.append(input,submit);
    form.addEventListener("submit",async event=>{
        event.preventDefault();
        const text=input.value.trim();
        if(!text||text.length>280)return;
        const lastComment=Number(localStorage.getItem("tg-last-comment")||0);
        if(Date.now()-lastComment<COMMENT_COOLDOWN_MS){
            input.setCustomValidity("Please wait a few seconds before posting another comment.");
            input.reportValidity();
            return;
        }
        input.setCustomValidity("");
        submit.disabled=true;
        try{
            await addDoc(commentsRef,{uid:user.uid,displayName:user.displayName||"Community member",text,createdAt:serverTimestamp()});
            localStorage.setItem("tg-last-comment",String(Date.now()));
            input.value="";
        }finally{submit.disabled=false;}
    });
    comments.append(commentsHeading,list,form);
    card.append(header,title,body,actions,comments);
    renderComments(postSnapshot.id,list,user);
    return card;
}

function loadPosts(user){
    clearPostListeners();
    const postsQuery=query(collection(db,"posts"),orderBy("createdAt","desc"));
    unsubscribePosts=onSnapshot(postsQuery,snapshot=>{
        postsRoot.innerHTML="";
        postsState.hidden=true;
        if(snapshot.empty){
            postsState.hidden=false;
            postsState.textContent="No community updates yet.";
            return;
        }
        snapshot.forEach(post=>postsRoot.append(renderPost(post,user)));
    },()=>{
        postsState.hidden=false;
        postsState.textContent="Community updates are temporarily unavailable. Please try again later.";
    });
}

document.getElementById("googleSignIn").addEventListener("click",()=>{
    authMessage.textContent="Google Sign-In will be available soon.";
});

document.getElementById("demoSignIn").addEventListener("click",async()=>{
    authMessage.textContent="";
    const button=document.getElementById("demoSignIn");
    button.disabled=true;
    try{
        await setPersistence(auth,browserSessionPersistence);
        await signInAnonymously(auth);
    }catch(error){
        console.error(error);
        authMessage.textContent="Demo login could not be completed. Please try again.";
        button.disabled=false;
    }
});

onAuthStateChanged(auth,async user=>{
    if(!user){
        clearPostListeners();
        authModal.hidden=false;
        content.hidden=true;
        return;
    }
    authModal.hidden=true;
    content.hidden=false;
    renderProfile(user);
    loadPosts(user);
    const profileRef=doc(db,"users",user.uid);
    const profileSnapshot=await getDoc(profileRef).catch(error=>{
        console.error("Profile lookup failed",error);
        return null;
    });
    setDoc(profileRef,{
        uid:user.uid,
        displayName:user.displayName||"TG Community Member",
        photoURL:user.photoURL||"",
        ...(profileSnapshot?.exists()?{}:{joinedAt:serverTimestamp()})
    },{merge:true}).catch(error=>console.error("Profile sync failed",error));
});

const themeToggle=document.getElementById("themeToggle");
const savedTheme=localStorage.getItem("tg-theme");
if(savedTheme==="light")document.body.classList.add("light-theme");
function updateThemeLabel(){
    themeToggle.setAttribute("aria-label",document.body.classList.contains("light-theme")?"Switch to dark mode":"Switch to light mode");
}
updateThemeLabel();
themeToggle.addEventListener("click",()=>{
    document.body.classList.toggle("light-theme");
    localStorage.setItem("tg-theme",document.body.classList.contains("light-theme")?"light":"dark");
    updateThemeLabel();
});

const menuBtn=document.getElementById("menuBtn");
const menuPanel=document.getElementById("menuPanel");
menuBtn.addEventListener("click",()=>{
    const open=menuPanel.classList.toggle("show");
    menuBtn.setAttribute("aria-expanded",String(open));
});
document.querySelectorAll(".menu-panel a").forEach(link=>link.addEventListener("click",()=>{
    menuPanel.classList.remove("show");
    menuBtn.setAttribute("aria-expanded","false");
}));
document.addEventListener("click",event=>{
    if(menuPanel.classList.contains("show")&&!menuPanel.contains(event.target)&&!menuBtn.contains(event.target)){
        menuPanel.classList.remove("show");
        menuBtn.setAttribute("aria-expanded","false");
    }
});
document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
        menuPanel.classList.remove("show");
        menuBtn.setAttribute("aria-expanded","false");
    }
});

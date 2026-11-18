
import { initializeApp } from
"https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// REPLACE WITH YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// PAGE ELEMENTS
const loginPage = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");
const adminDashboard = document.getElementById("adminDashboard");
const studentDashboard = document.getElementById("studentDashboard");

function hideAllPages() {
    loginPage.classList.add("hidden");
    registerPage.classList.add("hidden");
    adminDashboard.classList.add("hidden");
    studentDashboard.classList.add("hidden");
}

function showLogin() {
    hideAllPages();
    loginPage.classList.remove("hidden");
}

function showMessage(element, message) {
    element.textContent = message;
}

// SWITCH BETWEEN LOGIN AND REGISTRATION
document.getElementById("showRegister").onclick = (e) => {
    e.preventDefault();
    hideAllPages();
    registerPage.classList.remove("hidden");
};

document.getElementById("showLogin").onclick = (e) => {
    e.preventDefault();
    showLogin();
};

// STUDENT REGISTRATION
document.getElementById("registerForm").addEventListener(
    "submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("studentName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        const message = document.getElementById("registerMessage");

        try {
            const result = await createUserWithEmailAndPassword(
                auth, email, password
            );

            // Every self-registered account is a student
            await setDoc(doc(db, "users", result.user.uid), {
                name: name,
                email: email,
                role: "student"
            });

            showMessage(message, "Account created successfully!");

            document.getElementById("registerForm").reset();

        } catch (error) {
            showMessage(message, error.message);
        }
    }
);

// ONE LOGIN FOR STUDENTS AND ADMIN
document.getElementById("loginForm").addEventListener(
    "submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const message = document.getElementById("loginMessage");

        try {
            await signInWithEmailAndPassword(auth, email, password);

            // The authentication listener checks the account role

        } catch (error) {
            showMessage(message, "Incorrect email or password.");
        }
    }
);

// CHECK USER ROLE AND OPEN THE CORRECT DASHBOARD
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        showLogin();
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
            await signOut(auth);
            showLogin();
            return;
        }

        const account = userDoc.data();

        hideAllPages();

        if (account.role === "admin") {
            adminDashboard.classList.remove("hidden");
        }

        else if (account.role === "student") {
            studentDashboard.classList.remove("hidden");

            document.getElementById("studentWelcome").textContent =
                "Welcome, " + account.name + "!";
        }

        else {
            await signOut(auth);
            showLogin();
        }

    } catch (error) {
        console.error(error);
        await signOut(auth);
        showLogin();
    }
});

// LOGOUT
document.getElementById("adminLogout").onclick = () => {
    signOut(auth);
};

document.getElementById("studentLogout").onclick = () => {
    signOut(auth);
};

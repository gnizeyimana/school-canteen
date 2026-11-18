
import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    setDoc,
    getDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


// 1. FIREBASE CONFIGURATION
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


// 2. YOUR ADMINISTRATOR UID
const ADMIN_UID = "PASTE_YOUR_ADMIN_UID_HERE";


// 3. REMEMBER LOGIN ON THIS BROWSER
await setPersistence(auth, browserLocalPersistence);


// 4. PAGE MANAGEMENT
const pages = [
    "loginPage",
    "registerPage",
    "adminPage",
    "studentPage"
];

function showPage(pageId) {
    pages.forEach(id => {
        document.getElementById(id).classList.add("hidden");
    });

    document.getElementById(pageId).classList.remove("hidden");
}

function showMessage(id, message, success = false) {
    const element = document.getElementById(id);
    element.textContent = message;
    element.className = success ? "message success" : "message";
}


// 5. SWITCH BETWEEN LOGIN AND REGISTRATION
document.getElementById("showRegister").onclick = event => {
    event.preventDefault();
    showPage("registerPage");
};

document.getElementById("showLogin").onclick = event => {
    event.preventDefault();
    showPage("loginPage");
};


// 6. STUDENT REGISTRATION
document.getElementById("registerForm").addEventListener("submit", async event => {
    event.preventDefault();

    const name = document.getElementById("studentName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    if (password !== confirm) {
        showMessage("registerMessage", "Passwords do not match.");
        return;
    }

    try {
        const credential = await createUserWithEmailAndPassword(
            auth, email, password
        );

        await setDoc(doc(db, "users", credential.user.uid), {
            name: name,
            email: email,
            role: "student",
            status: "approved"
        });

        showMessage("registerMessage", "Account created successfully!", true);

        // Firebase automatically signs in the new student.
    } catch (error) {
        showMessage("registerMessage", error.message);
    }
});


// 7. LOGIN
document.getElementById("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage("loginMessage", "Login successful!", true);
    } catch (error) {
        showMessage("loginMessage", error.message);
    }
});


// 8. FORGOT PASSWORD
document.getElementById("forgotPassword").onclick = async event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();

    if (!email) {
        showMessage("loginMessage", "Enter your email first.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showMessage("loginMessage", "Password reset email sent.", true);
    } catch (error) {
        showMessage("loginMessage", error.message);
    }
};


// 9. LOGOUT
document.getElementById("adminLogout").onclick = () => signOut(auth);
document.getElementById("studentLogout").onclick = () => signOut(auth);


// 10. ADD PRODUCT (ADMIN ONLY)
document.getElementById("productForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (auth.currentUser?.uid !== ADMIN_UID) {
        showMessage("productMessage", "Administrator access required.");
        return;
    }

    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const image = document.getElementById("productImage").value.trim();
    const place = document.getElementById("productPlace").value.trim();

    if (!name || !place || !Number.isFinite(price) || price <= 0) {
        showMessage("productMessage", "Enter valid product details.");
        return;
    }

    if (image && !image.startsWith("https://")) {
        showMessage("productMessage", "Use an HTTPS image URL.");
        return;
    }

    try {
        await addDoc(collection(db, "products"), {
            name,
            price,
            image,
            place,
            createdAt: serverTimestamp()
        });

        event.target.reset();
        showMessage("productMessage", "Product added successfully!", true);
    } catch (error) {
        showMessage("productMessage", error.message);
    }
});


// 11. DISPLAY PRODUCTS
let stopProducts = null;

function loadProducts(role) {
    if (stopProducts) stopProducts();

    stopProducts = onSnapshot(collection(db, "products"), snapshot => {
        const adminContainer = document.getElementById("adminProducts");
        const studentContainer = document.getElementById("studentProducts");

        adminContainer.replaceChildren();
        studentContainer.replaceChildren();

        snapshot.forEach(productDoc => {
            const product = productDoc.data();
            const id = productDoc.id;

            if (role === "admin") {
                const card = document.createElement("div");
                card.className = "product-card";

                const title = document.createElement("h4");
                title.textContent = product.name;

                const price = document.createElement("p");
                price.textContent = `Price: ${product.price} RWF`;

                const place = document.createElement("p");
                place.textContent = `Location: ${product.place}`;

                card.append(title, price, place);

                if (product.image) {
                    const img = document.createElement("img");
                    img.src = product.image;
                    img.alt = product.name;
                    img.referrerPolicy = "no-referrer";
                    card.prepend(img);
                }

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete Product";
                deleteButton.className = "delete-button";

                deleteButton.onclick = async () => {
                    if (confirm(`Delete ${product.name}?`)) {
                        await deleteDoc(doc(db, "products", id));
                    }
                };

                card.append(deleteButton);
                adminContainer.append(card);
            } else {
                const card = document.createElement("div");
                card.className = "product-card";

                const title = document.createElement("h4");
                title.textContent = product.name;

                const price = document.createElement("p");
                price.textContent = `Price: ${product.price} RWF`;

                const place = document.createElement("p");
                place.textContent = `Serving location: ${product.place}`;

                const quantity = document.createElement("input");
                quantity.type = "number";
                quantity.min = "1";
                quantity.max = "20";
                quantity.value = "1";
                quantity.setAttribute("aria-label", "Quantity");

                const delivery = document.createElement("input");
                delivery.type = "text";
                delivery.placeholder = "Your delivery location";
                delivery.required = true;

                const orderButton = document.createElement("button");
                orderButton.textContent = "Place Order";

                orderButton.onclick = async () => {
                    const qty = Number(quantity.value);
                    const deliveryPlace = delivery.value.trim();

                    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
                        alert("Choose a quantity from 1 to 20.");
                        return;
                    }

                    if (!deliveryPlace) {
                        alert("Enter your delivery location.");
                        return;
                    }

                    try {
                        const user = auth.currentUser;

                        if (!user) {
                            alert("Please log in again.");
                            return;
                        }

                        await addDoc(collection(db, "orders"), {
                            uid: user.uid,
                            email: user.email,
                            productId: id,
                            productName: product.name,
                            quantity: qty,
                            price: product.price,
                            total: product.price * qty,
                            deliveryPlace,
                            status: "Pending",
                            createdAt: serverTimestamp()
                        });

                        alert("Your order has been placed!");
                        delivery.value = "";
                        quantity.value = "1";
                    } catch (error) {
                        alert("Could not place order: " + error.message);
                    }
                };

                card.append(title, price, place, quantity, delivery, orderButton);
                studentContainer.append(card);
            }
        });
    }, error => {
        console.error("Product loading error:", error);
    });
}


// 12. DISPLAY ORDERS
let stopOrders = null;

function loadOrders(isAdmin) {
    if (stopOrders) stopOrders();

    const user = auth.currentUser;
    let ordersQuery;

    if (isAdmin) {
        ordersQuery = collection(db, "orders");
    } else {
        ordersQuery = query(
            collection(db, "orders"),
            where("uid", "==", user.uid)
        );
    }

    const container = document.getElementById(
        isAdmin ? "allOrders" : "myOrders"
    );

    stopOrders = onSnapshot(ordersQuery, snapshot => {
        container.replaceChildren();

        if (snapshot.empty) {
            container.textContent = "No orders yet.";
            return;
        }

        snapshot.forEach(orderDoc => {
            const order = orderDoc.data();
            const card = document.createElement("div");
            card.className = "order-card";

            const details = document.createElement("p");
            details.textContent =
                `Product: ${order.productName} | Quantity: ${order.quantity} | ` +
                `Total: ${order.total} RWF | Delivery: ${order.deliveryPlace} | ` +
                `Status: ${order.status}`;

            card.append(details);

            if (isAdmin) {
                const email = document.createElement("p");
                email.textContent = `Student: ${order.email}`;
                card.prepend(email);

                const status = document.createElement("select");

                ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"]
                    .forEach(value => {
                        const option = document.createElement("option");
                        option.value = value;
                        option.textContent = value;
                        option.selected = order.status === value;
                        status.append(option);
                    });

                status.onchange = async () => {
                    try {
                        await updateDoc(doc(db, "orders", orderDoc.id), {
                            status: status.value
                        });
                    } catch (error) {
                        alert("Could not update order: " + error.message);
                    }
                };

                card.append(status);
            }

            container.append(card);
        });
    }, error => {
        console.error("Order loading error:", error);
    });
}


// 13. CHECK WHO IS LOGGED IN
onAuthStateChanged(auth, async user => {
    if (stopProducts) stopProducts();
    if (stopOrders) stopOrders();

    if (!user) {
        showPage("loginPage");
        return;
    }

    try {
        if (user.uid === ADMIN_UID) {
            showPage("adminPage");
            loadProducts("admin");
            loadOrders(true);
            return;
        }

        const profile = await getDoc(doc(db, "users", user.uid));

        if (!profile.exists()) {
            alert("Student profile not found. Please contact the administrator.");
            await signOut(auth);
            return;
        }

        const student = profile.data();

        if (student.role !== "student" || student.status !== "approved") {
            alert("Student account is not configured correctly.");
            await signOut(auth);
            return;
        }

        showPage("studentPage");

        document.getElementById("studentWelcome").textContent =
            `Welcome, ${student.name}`;

        loadProducts("student");
        loadOrders(false);

    } catch (error) {
        console.error(error);
        alert("Could not load your dashboard. Please try again.");
    }
});

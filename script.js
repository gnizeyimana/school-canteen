

import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
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

// 2. CONNECT FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 3. ADMIN UID
// Replace this after creating your admin account.
const ADMIN_UID = "YOUR_ADMIN_UID";

let currentUser = null;
let stopProducts = null;
let stopOrders = null;

const $ = id => document.getElementById(id);

// 4. SHOW A PAGE
function showPage(page) {
    ["loginPage", "registerPage",
     "adminPage", "studentPage"].forEach(id => {
        $(id).hidden = id !== page;
    });
}

// 5. SWITCH BETWEEN LOGIN AND REGISTER
$("showRegister").onclick = () => {
    $("registerMessage").textContent = "";
    showPage("registerPage");
};

$("showLogin").onclick = () => {
    $("loginMessage").textContent = "";
    showPage("loginPage");
};

// 6. CREATE STUDENT ACCOUNT
$("registerForm").addEventListener("submit", async event => {
    event.preventDefault();

    const name = $("studentName").value.trim();
    const email = $("registerEmail").value.trim();
    const password = $("registerPassword").value;
    const confirm = $("confirmPassword").value;

    if (password !== confirm) {
        $("registerMessage").textContent =
            "Passwords do not match.";
        return;
    }

    if (password.length < 6) {
        $("registerMessage").textContent =
            "Password must have at least 6 characters.";
        return;
    }

    try {
        $("registerMessage").textContent = "Creating account...";

        const credential =
            await createUserWithEmailAndPassword(
                auth, email, password
            );

        await updateDoc(
            doc(db, "users", credential.user.uid),
            {
                name: name,
                email: email,
                role: "student"
            }
        ).catch(async () => {
            const { setDoc } = await import(
                "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js"
            );

            await setDoc(
                doc(db, "users", credential.user.uid),
                {
                    name: name,
                    email: email,
                    role: "student"
                }
            );
        });

        alert("Your account has been created!");
        $("registerForm").reset();

    } catch (error) {
        $("registerMessage").textContent =
            error.message;
    }
});

// 7. STUDENT OR ADMIN LOGIN
$("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

    try {
        $("loginMessage").textContent = "Logging in...";

        await signInWithEmailAndPassword(
            auth, email, password
        );

    } catch (error) {
        $("loginMessage").textContent =
            "Login failed: " + error.message;
    }
});

// 8. PASSWORD RESET
$("forgotPassword").onclick = async () => {
    const email = $("loginEmail").value.trim();

    if (!email) {
        alert("Enter your email address first.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent.");
    } catch (error) {
        alert(error.message);
    }
};

// 9. CHECK WHO LOGGED IN
onAuthStateChanged(auth, async user => {
    if (stopProducts) stopProducts();
    if (stopOrders) stopOrders();

    stopProducts = null;
    stopOrders = null;

    currentUser = user;

    $("logoutBtn").hidden = !user;

    if (!user) {
        showPage("loginPage");
        return;
    }

    if (user.uid === ADMIN_UID) {
        showPage("adminPage");
        loadProducts("admin");
        loadOrders(true);
    } else {
        showPage("studentPage");
        $("studentWelcome").textContent =
            "Welcome, " + user.email;
        loadProducts("student");
        loadOrders(false);
    }
});

// 10. LOGOUT
$("logoutBtn").onclick = async () => {
    await signOut(auth);
};

// 11. ADMIN ADDS PRODUCTS
$("productForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        return alert("Administrator access required.");
    }

    const name = $("productName").value.trim();
    const price = Number($("productPrice").value);
    const image = $("productImage").value.trim();
    const place = $("productPlace").value.trim();

    if (!name || !Number.isFinite(price) ||
        price <= 0 || !place) {
        return alert("Enter valid product details.");
    }

    try {
        await addDoc(collection(db, "products"), {
            name,
            price,
            image,
            place,
            createdAt: serverTimestamp()
        });

        $("productForm").reset();
        alert("Product added successfully!");

    } catch (error) {
        alert(error.message);
    }
});

// 12. DISPLAY PRODUCTS
function loadProducts(role) {
    stopProducts = onSnapshot(
        collection(db, "products"),
        snapshot => {
            const products = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            const container = role === "admin"
                ? $("adminProducts")
                : $("studentProducts");

            container.replaceChildren();

            if (!products.length) {
                container.textContent =
                    "No products available yet.";
                return;
            }

            products.forEach(product => {
                const card = document.createElement("div");
                card.className = "product-card";

                if (product.image) {
                    const img = document.createElement("img");
                    img.src = product.image;
                    img.alt = product.name;
                    img.referrerPolicy = "no-referrer";
                    card.appendChild(img);
                }

                const title = document.createElement("h3");
                title.textContent = product.name;

                const price = document.createElement("p");
                price.textContent =
                    "Price: " + product.price.toLocaleString() + " RWF";

                const place = document.createElement("p");
                place.textContent =
                    "Serving location: " + product.place;

                card.append(title, price, place);

                if (role === "admin") {
                    const remove = document.createElement("button");
                    remove.textContent = "Delete Product";

                    remove.onclick = () =>
                        deleteProduct(product.id);

                    card.appendChild(remove);

                } else {
                    const quantity = document.createElement("input");
                    quantity.type = "number";
                    quantity.min = "1";
                    quantity.value = "1";
                    quantity.placeholder = "Quantity";

                    const delivery = document.createElement("input");
                    delivery.placeholder = "Your delivery place";

                    const orderButton = document.createElement("button");
                    orderButton.textContent = "Order Now";

                    orderButton.onclick = () =>
                        placeOrder(product, quantity.value,
                                   delivery.value);

                    card.append(quantity, delivery, orderButton);
                }

                container.appendChild(card);
            });
        },
        error => alert(error.message)
    );
}

// 13. DELETE PRODUCT
async function deleteProduct(id) {
    if (!currentUser || currentUser.uid !== ADMIN_UID) return;

    if (!confirm("Are you sure you want to delete this product?"))
        return;

    try {
        await deleteDoc(doc(db, "products", id));
    } catch (error) {
        alert(error.message);
    }
}

// 14. STUDENTS PLACE ORDERS
async function placeOrder(product, quantity, delivery) {
    if (!currentUser || currentUser.uid === ADMIN_UID) return;

    const qty = Number(quantity);
    const place = delivery.trim();

    if (!Number.isInteger(qty) || qty < 1 || !place) {
        alert("Enter a valid quantity and delivery place.");
        return;
    }

    try {
        await addDoc(collection(db, "orders"), {
            uid: currentUser.uid,
            email: currentUser.email,
            product: product.name,
            productId: product.id,
            quantity: qty,
            price: product.price,
            total: product.price * qty,
            deliveryPlace: place,
            status: "Pending",
            createdAt: serverTimestamp()
        });

        alert("Your order was submitted successfully!");

    } catch (error) {
        alert(error.message);
    }
}

// 15. DISPLAY ORDERS
function loadOrders(isAdmin) {
    const ordersRef = collection(db, "orders");

    const ordersQuery = isAdmin
        ? ordersRef
        : query(ordersRef, where("uid", "==", currentUser.uid));

    stopOrders = onSnapshot(ordersQuery, snapshot => {
        const container = isAdmin
            ? $("allOrders")
            : $("myOrders");

        container.replaceChildren();

        if (snapshot.empty) {
            container.textContent = "No orders found.";
            return;
        }

        snapshot.forEach(orderDoc => {
            const order = orderDoc.data();
            const card = document.createElement("div");
            card.className = "order";

            const title = document.createElement("h3");
            title.textContent = order.product;

            const details = document.createElement("p");
            details.textContent =
                "Student: " + order.email +
                " | Quantity: " + order.quantity +
                " | Total: " + order.total.toLocaleString() +
                " RWF";

            const delivery = document.createElement("p");
            delivery.textContent =
                "Delivery: " + order.deliveryPlace;

            const status = document.createElement("p");
            status.textContent = "Status: " + order.status;
            status.className = "status";

            card.append(title, details, delivery, status);

            if (isAdmin) {
                const select = document.createElement("select");

                ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"]
                    .forEach(value => {
                        const option = document.createElement("option");
                        option.value = value;
                        option.textContent = value;
                        select.appendChild(option);
                    });

                select.value = order.status;

                select.onchange = async () => {
                    try {
                        await updateDoc(
                            doc(db, "orders", orderDoc.id),
                            { status: select.value }
                        );
                    } catch (error) {
                        alert(error.message);
                    }
                };

                card.appendChild(select);
            }

            container.appendChild(card);
        });
    }, error => alert(error.message));
}

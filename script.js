
// CHANGE THIS TO YOUR OWN ADMIN EMAIL
const ADMIN_EMAIL = "admin@school.com";

// Store data in browser for this prototype
let products = JSON.parse(localStorage.getItem("products")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];

let currentEmail = "";

// Save data
function saveData() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("orders", JSON.stringify(orders));
}

// LOGIN
function login() {
    const email = document.getElementById("email")
        .value.trim().toLowerCase();

    if (!email || !email.includes("@")) {
        document.getElementById("loginMessage").textContent =
            "Please enter a valid email address.";
        return;
    }

    currentEmail = email;

    document.getElementById("loginPage").hidden = true;
    document.getElementById("logoutBtn").hidden = false;

    if (email === ADMIN_EMAIL.toLowerCase()) {
        document.getElementById("adminPage").hidden = false;
        document.getElementById("studentPage").hidden = true;
        showAdmin();
    } else {
        document.getElementById("studentPage").hidden = false;
        document.getElementById("adminPage").hidden = true;

        document.getElementById("studentEmail").textContent =
            "Logged in as: " + email;

        showStudent();
    }
}

// LOGOUT
function logout() {
    currentEmail = "";

    document.getElementById("loginPage").hidden = false;
    document.getElementById("adminPage").hidden = true;
    document.getElementById("studentPage").hidden = true;
    document.getElementById("logoutBtn").hidden = true;

    document.getElementById("email").value = "";
}

// ADMIN: ADD PRODUCT
function addProduct() {
    if (currentEmail !== ADMIN_EMAIL.toLowerCase()) return;

    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const image = document.getElementById("productImage").value.trim();
    const place = document.getElementById("productPlace").value.trim();

    if (!name || !Number.isFinite(price) || price <= 0 || !place) {
        alert("Enter a product name, valid price and serving location.");
        return;
    }

    products.push({
        id: Date.now(),
        name: name,
        price: price,
        image: image,
        place: place
    });

    saveData();

    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productImage").value = "";
    document.getElementById("productPlace").value = "";

    showAdmin();
    alert("Product added successfully!");
}

// ADMIN: DISPLAY PRODUCTS
function showAdmin() {
    if (currentEmail !== ADMIN_EMAIL.toLowerCase()) return;

    const container = document.getElementById("adminProducts");

    container.innerHTML = products.map(p => `
        <div class="product-card">
            ${p.image ? `<img src="${escapeHTML(p.image)}" alt="Product">` : ""}
            <h3>${escapeHTML(p.name)}</h3>
            <p>Price: ${p.price.toLocaleString()} RWF</p>
            <p>Place: ${escapeHTML(p.place)}</p>
            <button onclick="deleteProduct(${p.id})">
                Delete Product
            </button>
        </div>
    `).join("") || "<p>No products added yet.</p>";

    showAllOrders();
}

// ADMIN: DELETE PRODUCT
function deleteProduct(id) {
    if (currentEmail !== ADMIN_EMAIL.toLowerCase()) return;

    if (!confirm("Delete this product?")) return;

    products = products.filter(p => p.id !== id);

    saveData();
    showAdmin();
}

// STUDENT: DISPLAY PRODUCTS
function showStudent() {
    const container = document.getElementById("studentProducts");

    container.innerHTML = products.map(p => `
        <div class="product-card">
            ${p.image ? `<img src="${escapeHTML(p.image)}" alt="Product">` : ""}
            <h3>${escapeHTML(p.name)}</h3>
            <p>Price: ${p.price.toLocaleString()} RWF</p>
            <p>Serving place: ${escapeHTML(p.place)}</p>

            <label>Quantity</label>
            <input type="number" id="qty-${p.id}" min="1" value="1">

            <label>Delivery place</label>
            <input type="text" id="place-${p.id}"
                   placeholder="Where should we deliver?">

            <button onclick="placeOrder(${p.id})">
                Order Now
            </button>
        </div>
    `).join("") || "<p>No products available yet.</p>";

    showMyOrders();
}

// STUDENT: PLACE ORDER
function placeOrder(id) {
    if (!currentEmail ||
        currentEmail === ADMIN_EMAIL.toLowerCase()) return;

    const product = products.find(p => p.id === id);

    if (!product) {
        alert("This product is no longer available.");
        return;
    }

    const quantity = Number(
        document.getElementById("qty-" + id).value
    );

    const place = document.getElementById("place-" + id)
        .value.trim();

    if (!Number.isInteger(quantity) || quantity < 1 || !place) {
        alert("Enter a valid quantity and delivery place.");
        return;
    }

    orders.push({
        id: Date.now(),
        student: currentEmail,
        product: product.name,
        quantity: quantity,
        price: product.price,
        total: product.price * quantity,
        deliveryPlace: place,
        status: "Pending",
        date: new Date().toLocaleString()
    });

    saveData();

    alert("Your order has been submitted!");

    showStudent();
}

// ADMIN: VIEW ALL ORDERS
function showAllOrders() {
    const container = document.getElementById("allOrders");

    container.innerHTML = orders.map(o => `
        <div class="order">
            <h3>${escapeHTML(o.product)}</h3>
            <p>Student: ${escapeHTML(o.student)}</p>
            <p>Quantity: ${o.quantity}</p>
            <p>Total: ${o.total.toLocaleString()} RWF</p>
            <p>Delivery: ${escapeHTML(o.deliveryPlace)}</p>
            <p>Date: ${escapeHTML(o.date)}</p>
            <p>Status: ${escapeHTML(o.status)}</p>
        </div>
    `).join("") || "<p>No orders received yet.</p>";
}

// STUDENT: VIEW PERSONAL ORDERS
function showMyOrders() {
    const container = document.getElementById("myOrders");

    const myOrders = orders.filter(
        o => o.student === currentEmail
    );

    container.innerHTML = myOrders.map(o => `
        <div class="order">
            <h3>${escapeHTML(o.product)}</h3>
            <p>Quantity: ${o.quantity}</p>
            <p>Total: ${o.total.toLocaleString()} RWF</p>
            <p>Delivery: ${escapeHTML(o.deliveryPlace)}</p>
            <p>Status: ${escapeHTML(o.status)}</p>
        </div>
    `).join("") || "<p>You have not placed any orders.</p>";
}

// Basic HTML escaping for user-entered text
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}


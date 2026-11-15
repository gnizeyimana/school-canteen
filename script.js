
// Store information in the browser for this prototype
let students = JSON.parse(localStorage.getItem("students")) || [];
let products = JSON.parse(localStorage.getItem("products")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];

let settings = JSON.parse(localStorage.getItem("settings")) || {
    opening: "07:00",
    closing: "18:00",
    deadline: "17:00"
};

// Save information
function saveData() {
    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("settings", JSON.stringify(settings));
}

// Change website section
function showSection(sectionId) {
    document.querySelectorAll("main section").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");
}

// Register student
document.getElementById("studentForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const id = document.getElementById("studentId").value.trim();
    const name = document.getElementById("studentName").value.trim();
    const studentClass = document.getElementById("studentClass").value.trim();

    if (students.some(student => student.id === id)) {
        alert("This student ID already exists.");
        return;
    }

    students.push({ id, name, studentClass });

    saveData();
    this.reset();
    displayStudents();
});

// Display students
function displayStudents() {
    const list = document.getElementById("studentList");

    list.innerHTML = students.map(student => `
        <div class="item">
            <strong>${escapeHTML(student.name)}</strong>
            <p>ID: ${escapeHTML(student.id)}</p>
            <p>Class: ${escapeHTML(student.studentClass)}</p>
        </div>
    `).join("");

    document.getElementById("studentCount").textContent = students.length;
    updateStudentOptions();
}

// Add product
document.getElementById("productForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const product = {
        id: Date.now().toString(),
        name: document.getElementById("productName").value.trim(),
        price: Number(document.getElementById("productPrice").value),
        quantity: Number(document.getElementById("productQuantity").value),
        location: document.getElementById("productLocation").value.trim(),
        servingTime: document.getElementById("servingTime").value
    };

    if (products.some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
        alert("This product already exists.");
        return;
    }

    products.push(product);

    saveData();
    this.reset();
    displayProducts();
});

// Display products
function displayProducts() {
    const list = document.getElementById("productList");

    list.innerHTML = products.map(product => `
        <div class="item">
            <strong>${escapeHTML(product.name)}</strong>
            <p>Price: ${product.price} RWF</p>
            <p>Quantity: ${product.quantity}</p>
            <p>Collection Location: ${escapeHTML(product.location)}</p>
            <p>Serving Time: ${escapeHTML(product.servingTime)}</p>
        </div>
    `).join("");

    document.getElementById("productCount").textContent = products.length;
    updateProductOptions();
}

// Student selection
function updateStudentOptions() {
    const select = document.getElementById("orderStudent");

    select.innerHTML = '<option value="">Select Student</option>';

    students.forEach(student => {
        select.innerHTML += `
            <option value="${escapeHTML(student.id)}">
                ${escapeHTML(student.name)} (${escapeHTML(student.id)})
            </option>
        `;
    });
}

// Product selection
function updateProductOptions() {
    const select = document.getElementById("orderProduct");

    select.innerHTML = '<option value="">Select Product</option>';

    products.filter(p => p.quantity > 0).forEach(product => {
        select.innerHTML += `
            <option value="${escapeHTML(product.id)}">
                ${escapeHTML(product.name)} - ${product.price} RWF
            </option>
        `;
    });
}

// Place order
document.getElementById("orderForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const studentId = document.getElementById("orderStudent").value;
    const productId = document.getElementById("orderProduct").value;
    const quantity = Number(document.getElementById("orderQuantity").value);
    const date = document.getElementById("collectionDate").value;
    const time = document.getElementById("collectionTime").value;
    const paymentMethod = document.getElementById("paymentMethod").value;

    const student = students.find(s => s.id === studentId);
    const product = products.find(p => p.id === productId);

    if (!student || !product || quantity < 1) {
        alert("Please check your order details.");
        return;
    }

    const now = new Date();
    const selectedDateTime = new Date(`${date}T${time}`);

    if (selectedDateTime <= now) {
        alert("Choose a future collection time.");
        return;
    }

    const today = now.toISOString().slice(0, 10);
    const currentTime = now.toTimeString().slice(0, 5);

    if (date === today && currentTime > settings.deadline) {
        alert("The ordering deadline has passed.");
        return;
    }

    if (time < settings.opening || time > settings.closing) {
        alert("Choose a collection time during canteen opening hours.");
        return;
    }

    if (product.quantity < quantity) {
        alert("Not enough products available.");
        return;
    }

    const order = {
        id: Date.now().toString(),
        student: student.name,
        studentId: student.id,
        product: product.name,
        quantity: quantity,
        total: product.price * quantity,
        date: date,
        time: time,
        paymentMethod: paymentMethod,
        paymentStatus: "Unpaid",
        status: "Pending"
    };

    product.quantity -= quantity;
    orders.push(order);

    saveData();
    this.reset();
    displayProducts();
    displayOrders();

    alert("Your order has been placed successfully!");
});

// Display orders
function displayOrders() {
    const list = document.getElementById("orderList");

    list.innerHTML = orders.map(order => `
        <div class="item">
            <strong>Order #${escapeHTML(order.id)}</strong>
            <p>Student: ${escapeHTML(order.student)}</p>
            <p>Product: ${escapeHTML(order.product)}</p>
            <p>Quantity: ${order.quantity}</p>
            <p>Total: ${order.total} RWF</p>
            <p>Collection: ${escapeHTML(order.date)} at ${escapeHTML(order.time)}</p>
            <p>Payment: ${escapeHTML(order.paymentMethod)} - ${escapeHTML(order.paymentStatus)}</p>
            <p>Status: ${escapeHTML(order.status)}</p>

            <button onclick="updateOrderStatus('${order.id}', 'Preparing')">Preparing</button>
            <button onclick="updateOrderStatus('${order.id}', 'Ready')">Ready</button>
            <button onclick="updateOrderStatus('${order.id}', 'Collected')">Collected</button>
            <button onclick="updateOrderStatus('${order.id}', 'Cancelled')">Cancel</button>
            <button onclick="updatePayment('${order.id}')">Mark Paid</button>
        </div>
    `).join("");

    document.getElementById("orderCount").textContent = orders.length;
}

// Update order status
function updateOrderStatus(id, status) {
    const order = orders.find(o => o.id === id);

    if (!order) return;

    if (status === "Cancelled" && order.status !== "Cancelled") {
        const product = products.find(p => p.name === order.product);
        if (product) product.quantity += order.quantity;
    }

    order.status = status;

    saveData();
    displayOrders();
    displayProducts();
}

// Update payment
function updatePayment(id) {
    const order = orders.find(o => o.id === id);

    if (!order) return;

    order.paymentStatus = "Paid";

    saveData();
    displayOrders();
}

// Save canteen time settings
document.getElementById("settingsForm").addEventListener("submit", function(e) {
    e.preventDefault();

    settings = {
        opening: document.getElementById("openingTime").value,
        closing: document.getElementById("closingTime").value,
        deadline: document.getElementById("deadlineTime").value
    };

    if (
        !settings.opening ||
        !settings.closing ||
        !settings.deadline ||
        settings.opening >= settings.closing ||
        settings.deadline > settings.closing
    ) {
        alert("Please enter valid canteen times.");
        return;
    }

    saveData();
    alert("Time settings saved.");
});

// Prevent HTML from being inserted as user content
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// Load saved data when the page opens
function loadSettings() {
    document.getElementById("openingTime").value = settings.opening;
    document.getElementById("closingTime").value = settings.closing;
    document.getElementById("deadlineTime").value = settings.deadline;
}

displayStudents();
displayProducts();
displayOrders();
loadSettings();


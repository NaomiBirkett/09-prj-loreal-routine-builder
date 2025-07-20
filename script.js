/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateButton = document.getElementById("generateRoutine");

/* Store selected products */
const selectedProducts = new Map();

/* Initialize chat history with a system message */
const chatHistory = [
  {
    role: "system",
    content: `
You are a helpful and knowledgeable AI assistant for L’Oréal. You help users build personalized skincare, haircare, and makeup routines using L’Oréal products only.

L’Oréal owns the following brands, which you should recognize as valid L’Oréal products: 
L’Oréal Paris, Maybelline, Garnier, NYX Professional Makeup, CeraVe, La Roche-Posay, Vichy, SkinCeuticals, IT Cosmetics, Urban Decay, Redken, Matrix, Pureology, Kérastase, Mizani, Thayers, Essie, and more.

Do not recommend or discuss products from brands outside this list. If the user asks about a product from a different company, gently redirect them toward L’Oréal brands.

If the user asks something unrelated to beauty, politely guide them back to asking about skincare, haircare, or makeup.

Always respond in a warm, friendly, and professional tone.
    `.trim(),
  },
];

/* Show placeholder until category is selected */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Load selected products from localStorage */
function loadSelectedProducts() {
  const savedProducts = localStorage.getItem("selectedProducts");
  if (savedProducts) {
    const parsedProducts = JSON.parse(savedProducts);
    parsedProducts.forEach((product) => {
      selectedProducts.set(product.name, product);
    });
    updateSelectedProductsList();
  }
}

/* Save selected products to localStorage */
function saveSelectedProducts() {
  const productsArray = Array.from(selectedProducts.values());
  localStorage.setItem("selectedProducts", JSON.stringify(productsArray));
}

/* Display product cards */
function displayProducts(products) {
  productsContainer.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    // Determine button text based on whether the product is already selected
    const buttonText = selectedProducts.has(product.name) ? "Remove" : "Add";

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="product-overlay">
        <button class="add-btn" data-name="${product.name}">${buttonText}</button>
        <button class="info-btn" data-name="${product.name}">Info</button>
      </div>
    `;

    // Add event listener for the "add/remove" button
    card.querySelector(".add-btn").addEventListener("click", (e) => {
      const button = e.target;
      if (selectedProducts.has(product.name)) {
        selectedProducts.delete(product.name);
        button.textContent = "Add"; // Change button text to "Add"
      } else {
        selectedProducts.set(product.name, product);
        button.textContent = "Remove"; // Change button text to "Remove"
      }
      updateSelectedProductsList();
      saveSelectedProducts(); // Save changes to localStorage
    });

    // Add event listener for the "info" button
    card.querySelector(".info-btn").addEventListener("click", () => {
      openProductModal(product);
    });

    productsContainer.appendChild(card);
  });
}

/* Open product modal */
function openProductModal(product) {
  const modalBackdrop = document.createElement("div");
  modalBackdrop.classList.add("modal-backdrop");

  const modal = document.createElement("div");
  modal.classList.add("modal");

  modal.innerHTML = `
    <button class="modal-close">Close</button>
    <h3>${product.name}</h3>
    <p>${product.description}</p>
  `;

  // Close modal on button click
  modal.querySelector(".modal-close").addEventListener("click", () => {
    document.body.removeChild(modalBackdrop);
    document.body.removeChild(modal);
  });

  document.body.appendChild(modalBackdrop);
  document.body.appendChild(modal);
}

/* Show selected products */
function updateSelectedProductsList() {
  selectedProductsList.innerHTML = "";

  selectedProducts.forEach((product) => {
    const item = document.createElement("div");
    item.classList.add("product-card");
    item.style.flex = "0 1 calc(50% - 10px)";

    item.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="product-overlay">
        <button class="info-btn" data-name="${product.name}">Info</button>
        <button class="remove-btn" data-name="${product.name}">Remove</button>
      </div>
    `;

    // Add event listener for the "info" button
    item.querySelector(".info-btn").addEventListener("click", () => {
      openProductModal(product);
    });

    // Add event listener for the "remove" button
    item.querySelector(".remove-btn").addEventListener("click", () => {
      selectedProducts.delete(product.name); // Remove product from the list
      updateSelectedProductsList(); // Update the displayed list
      saveSelectedProducts(); // Save changes to localStorage
    });

    selectedProductsList.appendChild(item);
  });
}

/* Handle category change */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Generate routine using selected products */
generateButton.addEventListener("click", async () => {
  if (selectedProducts.size === 0) {
    chatWindow.innerHTML += `<div><em>Please select some products first.</em></div>`;
    return;
  }

  const productList = Array.from(selectedProducts.values())
    .map((p) => `${p.name} by ${p.brand}`)
    .join(", ");

  const prompt = `Create a personalized beauty routine using the following L'Oréal products: ${productList}. Provide step-by-step guidance.`;

  // Add user prompt to chat history & UI
  chatHistory.push({ role: "user", content: prompt });
  chatWindow.innerHTML += `<div class="user-message"><strong>You:</strong> ${prompt}</div>`;
  chatWindow.innerHTML += `<div><em>Thinking...</em></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  await sendChatToAI();
});

/* Handle user input submission */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  // Add user message to chat window
  chatWindow.innerHTML += `<div class="user-message"><strong>You:</strong> ${message}</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Add user message to chat history
  chatHistory.push({ role: "user", content: message });

  userInput.value = "";
  chatWindow.innerHTML += `<div><em>Thinking...</em></div>`;
  await sendChatToAI();
});

/* Send chat history to OpenAI via Cloudflare Worker */
async function sendChatToAI() {
  try {
    const response = await fetch(
      "https://loreal-worker.tankadin1988.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: chatHistory, // send full chat history!
          temperature: 0.8,
          max_tokens: 800,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      chatWindow.innerHTML += `<div class="assistant-message"><em>Error: ${data.error}</em></div>`;
      return;
    }

    // Remove the "Thinking..." message before appending the AI reply
    const thinkingElems = chatWindow.querySelectorAll("em");
    thinkingElems.forEach((el) => {
      if (el.textContent === "Thinking...") el.parentElement.remove();
    });

    // Add assistant message to chat window
    chatWindow.innerHTML += `<div class="assistant-message"><strong>Assistant:</strong> ${data.text.replace(
      /\n/g,
      "<br>"
    )}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Add assistant message to chat history
    chatHistory.push({ role: "assistant", content: data.text });
  } catch (err) {
    chatWindow.innerHTML += `<div class="assistant-message"><em>Network error: ${err.message}</em></div>`;
  }
}

// Load selected products on page load
window.addEventListener("load", () => {
  loadSelectedProducts();
});

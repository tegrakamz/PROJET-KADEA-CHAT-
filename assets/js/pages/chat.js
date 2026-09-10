// Contrôleur de la messagerie

import { requireAuth } from "../auth/authGuard.js";
import {
    getUser,
    saveUser,
    clearSession,
    removeToken,
    removeUser
} from "../utils/storage.js";
import { getCurrentUser } from "../services/authService.js";
import {
    getConversations,
    getConversationName,
    getConversationAvatar,
    getLastMessage,
    formatConversationTime,
    searchConversations,
    rememberConversation,
    getRememberedConversation,
    forgetConversation,
    getUsers,
    createConversation
} from "../services/conversationService.js";
import {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage
} from "../services/messageService.js";
import { CONFIG } from "../config/config.js";
import { showToast } from "../components/toast.js";
import { truncate } from "../utils/helpers.js";

// Variables d'état
let currentConversation = null;
let currentUser = null;
let allConversations = [];
let allUsers = [];
let pollingInterval = null;

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();

    currentUser = getUser();

    // Si le profil en cache local est incomplet, on interroge l'API
    if (!currentUser || !currentUser.id) {
        try {
            const response = await getCurrentUser();
            const user = response?.data?.user || response?.user || response?.data || response;

            if (!user || !user.id) {
                clearSession();
                window.location.replace("index.html");
                return;
            }

            saveUser(user);
            currentUser = user;
        } catch (error) {
            console.error("Impossible de récupérer le profil :", error);
            clearSession();
            window.location.replace("index.html");
            return;
        }
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

    initializeUserInterface();
    await loadConversations();
    initializeEvents();

    // Arrêt de l'actualisation périodique si l'utilisateur quitte la page
    window.addEventListener("beforeunload", stopPolling);
});

// Affiche les informations de l'utilisateur connecté dans le volet latéral
function initializeUserInterface() {
    const userFullname = document.getElementById("user-fullname");
    const userAvatar = document.getElementById("user-avatar");

    if (userFullname) {
        userFullname.textContent = currentUser.fullName || "Moi";
    }

    if (userAvatar) {
        const avatarUrl =
            currentUser.avatarUrl ||
            currentUser.avatar ||
            currentUser.photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || "Moi")}&background=2563eb&color=fff&bold=true`;

        userAvatar.src = avatarUrl;
    }
}

// Récupère les conversations et les affiche
async function loadConversations() {
    const loader = document.getElementById("conversations-loader");
    const emptyState = document.getElementById("conversations-empty");
    const container = document.getElementById("conversations-list");

    if (loader) loader.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    if (container) container.classList.add("hidden");

    try {
        allConversations = await getConversations();

        if (loader) loader.classList.add("hidden");

        if (!allConversations || allConversations.length === 0) {
            if (emptyState) emptyState.classList.remove("hidden");
            toggleChatActiveState(false);
            return;
        }

        if (container) container.classList.remove("hidden");
        displayConversations(allConversations);

        // Rouvre la dernière conversation consultée si elle est mémorisée
        const lastConvId = getRememberedConversation();
        if (lastConvId && allConversations.length > 0) {
            const lastConv = allConversations.find(c => String(c.id) === String(lastConvId));
            if (lastConv) {
                openConversation(lastConv);
                return;
            }
            forgetConversation();
        }

        toggleChatActiveState(false);

    } catch (error) {
        console.error("Erreur chargement des conversations :", error);
        if (loader) loader.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");

        showToast(
            error.message || "Impossible de charger vos conversations.",
            "error"
        );
    }
}

// Génère les éléments de la liste des conversations
function displayConversations(conversations) {
    const container = document.getElementById("conversations-list");
    if (!container) return;

    container.innerHTML = "";

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 text-center">
                <i data-lucide="search-x" class="w-6 h-6 mb-2 text-slate-300"></i>
                <p class="text-xs font-medium">Aucune conversation ne correspond à votre recherche.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    conversations.forEach(conversation => {
        const item = document.createElement("div");
        const isActive = currentConversation && String(currentConversation.id) === String(conversation.id);

        item.className = `
            flex items-center gap-3 p-4 cursor-pointer transition border-b border-slate-50 dark:border-slate-800/40
            ${isActive
                ? 'bg-[#f0f4ff]/60 dark:bg-blue-950/30 border-l-4 border-[#2563eb]'
                : 'hover:bg-[#f0f4ff]/20 dark:hover:bg-slate-800/30 border-l-4 border-transparent'}
        `;

        const name = getConversationName(conversation, currentUser.id);
        const avatarUrl = getConversationAvatar(conversation, currentUser.id);
        const lastMsg = getLastMessage(conversation);
        const time = formatConversationTime(conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt);

        item.innerHTML = `
            <div class="relative flex-shrink-0">
                <img
                    src="${escapeAttr(avatarUrl)}"
                    alt="${escapeAttr(name)}"
                    class="w-10 h-10 rounded-full object-cover bg-slate-100"
                    onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&bold=true'"
                >
                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline mb-0.5">
                    <h3 class="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        ${escapeHTML(name)}
                    </h3>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        ${time}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate pr-2">
                        ${escapeHTML(truncate(lastMsg, 40))}
                    </p>
                    ${conversation.unreadCount && conversation.unreadCount > 0 ? `
                        <span class="min-w-4 h-4 px-1 bg-[#2563eb] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            ${conversation.unreadCount}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;

        item.addEventListener("click", () => {
            openConversation(conversation);
        });

        container.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
}

// Ouvre une conversation sélectionnée
async function openConversation(conversation) {
    currentConversation = conversation;
    rememberConversation(conversation.id);

    toggleChatActiveState(true);

    const activeContactName = document.getElementById("active-contact-name");
    const activeContactAvatar = document.getElementById("active-contact-avatar");

    const name = getConversationName(conversation, currentUser.id);
    const avatarUrl = getConversationAvatar(conversation, currentUser.id);

    if (activeContactName) activeContactName.textContent = name;
    if (activeContactAvatar) activeContactAvatar.src = avatarUrl;

    displayConversations(allConversations);
    await loadMessages(conversation.id);

    // Active la relève régulière des messages
    startPolling(conversation.id);
}

// Charge les messages d'une discussion
async function loadMessages(conversationId, silent = false) {
    const container = document.getElementById("messages-container");

    try {
        const messages = await getMessages(conversationId);
        displayMessages(messages);
    } catch (error) {
        console.error("Erreur chargement des messages :", error);

        if (silent) return;

        // La conversation a été supprimée ou n'existe plus
        if (error.status === 404) {
            stopPolling();
            if (container) {
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                        <i data-lucide="ghost" class="w-8 h-8 mb-2 text-slate-300"></i>
                        <p class="text-xs font-medium">Cette conversation n'existe pas ou a été supprimée.</p>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
            showToast("Conversation introuvable.", "error");
            return;
        }

        showToast(
            error.message || "Impossible de charger les messages.",
            "error"
        );
    }
}

// Relève automatique des nouveaux messages toutes les 5 secondes
function startPolling(conversationId) {
    stopPolling();

    pollingInterval = setInterval(() => {
        if (currentConversation && String(currentConversation.id) === String(conversationId)) {
            loadMessages(conversationId, true);
        }
    }, CONFIG.REFRESH_INTERVAL || 5000);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// Affiche les bulles de messages
function displayMessages(messages) {
    const container = document.getElementById("messages-container");
    if (!container) return;

    // Détecte si la vue était déjà tout en bas
    const wasScrolledToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 80;

    container.innerHTML = "";

    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="flex justify-center my-4">
                <span class="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3 py-1 rounded-full text-[10px] font-medium italic">
                    Aucun message. Commencez la discussion !
                </span>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="flex justify-center my-2">
            <span class="bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-medium tracking-wide">
                Discussion sécurisée
            </span>
        </div>
    `;

    messages.forEach(message => {
        const senderId =
            message.senderId ||
            message.sender_id ||
            (message.sender && message.sender.id) ||
            (message.user && message.user.id);

        const isMine = String(senderId) === String(currentUser.id);
        const bubbleWrapper = document.createElement("div");

        if (isMine) {
            // Message envoyé (bulle bleue à droite)
            bubbleWrapper.className = "group flex items-end justify-end space-x-2 max-w-[75%] ml-auto";
            bubbleWrapper.innerHTML = `
                <button
                    class="btn-delete-message opacity-0 group-hover:opacity-100 transition p-1.5 text-slate-300 hover:text-red-500 rounded-lg"
                    title="Supprimer ce message"
                    data-message-id="${message.id || message._id || ""}"
                >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
                <button
                    class="btn-edit-message opacity-0 group-hover:opacity-100 transition p-1.5 text-slate-300 hover:text-[#2563eb] rounded-lg"
                    title="Modifier ce message"
                    data-message-id="${message.id || message._id || ""}"
                >
                    <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                </button>
                <div class="flex flex-col space-y-1 items-end">
                    <div class="bg-[#2563eb] text-white text-xs px-4 py-2.5 rounded-2xl rounded-br-none shadow-sm">
                        <p class="break-all whitespace-pre-line">${escapeHTML(getMessageContent(message))}</p>
                    </div>
                    <span class="text-[9px] text-slate-400 mr-1">
                        ${formatDate(message.createdAt || message.created_at)}${message.editedAt || message.updatedAt ? " · modifié" : ""}
                    </span>
                </div>
            `;

            const deleteBtn = bubbleWrapper.querySelector(".btn-delete-message");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", () => {
                    handleDeleteMessage(deleteBtn.dataset.messageId);
                });
            }

            const editBtn = bubbleWrapper.querySelector(".btn-edit-message");
            if (editBtn) {
                editBtn.addEventListener("click", () => {
                    handleEditMessage(editBtn.dataset.messageId, getMessageContent(message));
                });
            }

        } else {
            // Message reçu (bulle claire à gauche)
            bubbleWrapper.className = "flex items-end space-x-2 max-w-[75%]";
            bubbleWrapper.innerHTML = `
                <div class="flex flex-col space-y-1">
                    <div class="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-4 py-2.5 rounded-2xl rounded-bl-none border border-slate-200/60 dark:border-slate-700 shadow-sm">
                        <p class="break-all whitespace-pre-line">${escapeHTML(getMessageContent(message))}</p>
                    </div>
                    <span class="text-[9px] text-slate-400 dark:text-slate-500 ml-1">
                        ${formatDate(message.createdAt || message.created_at)}
                    </span>
                </div>
            `;
        }

        container.appendChild(bubbleWrapper);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }

    if (wasScrolledToBottom) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
        });
    }
}

function getMessageContent(message) {
    return message.content || message.text || message.message || "";
}

// Envoi d'un nouveau message
async function handleSendMessage(event) {
    if (event) event.preventDefault();

    const input = document.getElementById("message-input");
    const charCounter = document.getElementById("char-counter");

    if (!input) return;

    const content = input.value.trim();
    if (!content || !currentConversation) return;

    try {
        await sendMessage(currentConversation.id, content);

        input.value = "";
        if (charCounter) charCounter.textContent = "0 / 500";

        await loadMessages(currentConversation.id);

        // Met à jour l'aperçu local de la liste sans tout recharger
        const index = allConversations.findIndex(c => String(c.id) === String(currentConversation.id));
        if (index !== -1) {
            allConversations[index].lastMessageAt = new Date().toISOString();
            allConversations[index].last_message = content;
            allConversations[index].lastMessage = content;

            allConversations.sort((a, b) => {
                const dateA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0);
                return dateB - dateA;
            });

            displayConversations(allConversations);
        }

    } catch (error) {
        console.error("Erreur envoi du message :", error);
        input.value = content;
        showToast(
            error.message || "Le message n'a pas pu être envoyé.",
            "error"
        );
    }
}

// Modification d'un message existant
async function handleEditMessage(messageId, currentContent) {
    if (!messageId) return;

    const newContent = prompt("Modifier votre message :", currentContent);
    if (newContent === null) return;

    if (!newContent.trim()) {
        showToast("Le message ne peut pas être vide.", "error");
        return;
    }

    if (newContent.trim() === (currentContent || "").trim()) return;

    try {
        await editMessage(messageId, newContent);

        if (currentConversation) {
            await loadMessages(currentConversation.id);
        }

        showToast("Message modifié.", "success");
    } catch (error) {
        console.error("Erreur modification message :", error);
        showToast(
            error.message || "Impossible de modifier ce message.",
            "error"
        );
    }
}

// Suppression d'un message
async function handleDeleteMessage(messageId) {
    if (!messageId) return;

    const confirmed = confirm("Voulez-vous vraiment supprimer ce message ?");
    if (!confirmed) return;

    try {
        await deleteMessage(messageId);

        if (currentConversation) {
            await loadMessages(currentConversation.id);
        }

        showToast("Message supprimé.", "success");
    } catch (error) {
        console.error("Erreur suppression message :", error);
        showToast(
            error.message || "Impossible de supprimer ce message.",
            "error"
        );
    }
}

// Branchement des écouteurs d'événements
function initializeEvents() {
    const chatForm = document.getElementById("chat-form");
    if (chatForm) {
        chatForm.addEventListener("submit", handleSendMessage);
    }

    // Compteur de caractères dans la zone de texte
    const input = document.getElementById("message-input");
    const charCounter = document.getElementById("char-counter");
    const maxLength = CONFIG.MAX_MESSAGE_LENGTH || 500;

    if (input && charCounter) {
        input.addEventListener("input", (e) => {
            const length = e.target.value.length;
            charCounter.textContent = `${length} / ${maxLength}`;
            if (length > maxLength) {
                charCounter.classList.add("text-red-500");
            } else {
                charCounter.classList.remove("text-red-500");
            }
        });
    }

    // Recherche de conversation en direct dans la barre latérale
    const searchInput = document.getElementById("search-conversations");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const filtered = searchConversations(allConversations, e.target.value, currentUser.id);
            displayConversations(filtered);
        });
    }

    // Bascule du mode clair / sombre
    const themeToggleBtn = document.getElementById("btn-theme-toggle");
    const themeToggleIcon = document.getElementById("theme-toggle-icon");

    const updateThemeIcon = (isDark) => {
        if (themeToggleIcon) {
            themeToggleIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");
            if (window.lucide) window.lucide.createIcons();
        }
    };

    updateThemeIcon(document.documentElement.classList.contains("dark"));

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const isDark = document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            updateThemeIcon(isDark);
        });
    }

    // Déconnexion
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            const confirmed = confirm("Voulez-vous vraiment vous déconnecter ?");
            if (!confirmed) return;
            stopPolling();
            removeToken();
            removeUser();
            window.location.href = "index.html";
        });
    }

    // Modale de sélection d'un contact pour nouvelle discussion
    const newChatBtn = document.querySelector('[title="Nouvelle conversation"]');
    const modal = document.getElementById("new-chat-modal");
    const closeModalBtn = document.getElementById("close-new-chat-modal");
    const searchContactsInput = document.getElementById("search-contacts");

    if (newChatBtn && modal) {
        newChatBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
            if (searchContactsInput) searchContactsInput.value = "";
            loadContactsToModal();
        });
    }

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });

    if (searchContactsInput) {
        searchContactsInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            filterAndDisplayContacts(query);
        });
    }
}

// Charge les contacts dans la modale
async function loadContactsToModal() {
    const container = document.getElementById("contacts-list");
    const loader = document.getElementById("contacts-loader");

    if (!container) return;
    if (loader) loader.classList.remove("hidden");

    try {
        const users = await getUsers();
        if (loader) loader.classList.add("hidden");

        // Exclut son propre compte de la liste de contacts
        allUsers = users.filter(user => String(user.id) !== String(currentUser.id));
        renderContacts(allUsers);
    } catch (error) {
        console.error("Erreur de chargement des contacts :", error);
        if (loader) loader.classList.add("hidden");
        container.innerHTML = `<p class="text-center text-xs text-red-500 py-6">Impossible de charger les contacts.</p>`;
        showToast(
            error.message || "Impossible de charger les contacts.",
            "error"
        );
    }
}

// Affiche la liste des contacts dans la modale
function renderContacts(usersList) {
    const container = document.getElementById("contacts-list");
    if (!container) return;

    container.innerHTML = "";

    if (usersList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <p class="text-xs">Aucun utilisateur trouvé.</p>
            </div>
        `;
        return;
    }

    usersList.forEach(user => {
        const userItem = document.createElement("div");
        userItem.className = "flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl cursor-pointer transition";

        const name = user.fullName || "Utilisateur";
        const avatar =
            user.avatarUrl ||
            user.avatar ||
            user.photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&bold=true`;

        userItem.innerHTML = `
            <img src="${escapeAttr(avatar)}" alt="${escapeAttr(name)}" class="w-9 h-9 rounded-full object-cover bg-slate-100" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&bold=true'">
            <div class="flex-1">
                <h4 class="font-semibold text-xs text-slate-900 dark:text-slate-100">${escapeHTML(name)}</h4>
                <p class="text-[10px] text-slate-400 dark:text-slate-500">Démarrer une discussion</p>
            </div>
            <i data-lucide="message-square-plus" class="w-4 h-4 text-[#2563eb]"></i>
        `;

        userItem.addEventListener("click", async () => {
            const modal = document.getElementById("new-chat-modal");
            if (modal) modal.classList.add("hidden");
            await handleStartNewConversation(user.id);
        });

        container.appendChild(userItem);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Filtrage en direct des contacts dans la modale
function filterAndDisplayContacts(query) {
    if (!query) {
        renderContacts(allUsers);
        return;
    }

    const filtered = allUsers.filter(user => {
        const fullname = (user.fullName || "").toLowerCase();
        return fullname.includes(query);
    });

    renderContacts(filtered);
}

// Démarre ou sélectionne une discussion avec un contact
async function handleStartNewConversation(recipientId) {
    try {
        if (!currentUser || !currentUser.id) {
            currentUser = getUser();
            if (!currentUser || !currentUser.id) {
                const meRes = await getCurrentUser();
                const freshUser = meRes?.data?.user || meRes?.data || meRes?.user;
                if (freshUser) {
                    saveUser(freshUser);
                    currentUser = freshUser;
                }
            }
        }

        if (!currentUser?.id) {
            throw new Error("Impossible d'identifier votre compte utilisateur.");
        }

        if (!recipientId) {
            throw new Error("Destinataire invalide.");
        }

        const conversation = await createConversation(recipientId, currentUser.id);
        await loadConversations();

        if (conversation && (conversation.id || conversation.conversation?.id)) {
            const targetConv = conversation.id ? conversation : conversation.conversation;
            openConversation(targetConv);
        }

    } catch (error) {
        console.error("Erreur création discussion :", error);
        showToast(
            error.message || "Impossible de démarrer cette discussion.",
            "error"
        );
    }
}

// Bascule entre l'écran d'accueil et la zone de discussion active
function toggleChatActiveState(isActive) {
    const welcomeScreen = document.getElementById("chat-welcome-screen");
    const activeBox = document.getElementById("chat-active-box");

    if (isActive) {
        if (welcomeScreen) welcomeScreen.classList.add("hidden");
        if (activeBox) activeBox.classList.remove("hidden");
    } else {
        if (welcomeScreen) welcomeScreen.classList.remove("hidden");
        if (activeBox) activeBox.classList.add("hidden");
        stopPolling();
    }
}

// Formatage de l'heure
function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Échappement des caractères spéciaux pour se protéger des injections XSS
function escapeHTML(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(str) {
    return escapeHTML(str);
}

// ======================================================
// Kadea Chat
// Gestion principale de la page Chat
// ======================================================

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


// ======================================================
// Variables globales
// ======================================================

let currentConversation = null;
let currentUser = null;
let allConversations = []; // Stockage pour la recherche et le filtre en local
let allUsers = [];         // Stockage local des utilisateurs pour la recherche dans la modal
let pollingInterval = null; // Rafraîchissement automatique des messages (bonus "temps réel")


// ======================================================
// Initialisation
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    requireAuth();

    currentUser = getUser();
    console.log("Utilisateur du localStorage :", currentUser);

    // =====================================
    // Si le profil n'est pas encore enregistré,
    // on le récupère automatiquement via l'API
    // =====================================

    if (!currentUser) {

        try {

            const response = await getCurrentUser();

                console.log("Réponse API /auth/me :", response);

            const user = response.user || response.data || response;

            if (!user || !user.id) {

                console.error("Utilisateur invalide :", response);

                clearSession();

            window.location.replace("index.html");

            return;

}

        saveUser(user);

        currentUser = user;

        console.log("Utilisateur enregistré :", currentUser);

}

        catch (error) {

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

    // Nettoyage du polling si l'utilisateur quitte la page
    window.addEventListener("beforeunload", stopPolling);

});


// ======================================================
// Affichage de l'utilisateur connecté (En-tête gauche)
// ======================================================

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


// ======================================================
// Chargement des conversations (Barre latérale)
// ======================================================

async function loadConversations() {

    const loader = document.getElementById("conversations-loader");
    const emptyState = document.getElementById("conversations-empty");
    const container = document.getElementById("conversations-list");

    // Afficher le loader et cacher les autres états
    if (loader) loader.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    if (container) container.classList.add("hidden");

    try {

        allConversations = await getConversations();

        if (loader) loader.classList.add("hidden");

        if (!allConversations || allConversations.length === 0) {
            if (emptyState) emptyState.classList.remove("hidden");
            // Montrer l'écran de bienvenue par défaut s'il n'y a pas de discussion
            toggleChatActiveState(false);
            return;
        }

        if (container) container.classList.remove("hidden");
        displayConversations(allConversations);

        // Restaurer la dernière conversation ouverte (Bonus de confort utilisateur)
        const lastConvId = getRememberedConversation();
        if (lastConvId && allConversations.length > 0) {
            const lastConv = allConversations.find(c => String(c.id) === String(lastConvId));
            if (lastConv) {
                openConversation(lastConv);
                return;
            }
            // La conversation mémorisée n'existe plus (supprimée)
            forgetConversation();
        }

        // Si aucune session précédente n'est enregistrée, afficher l'écran d'accueil
        toggleChatActiveState(false);

    } catch (error) {

        console.error("Erreur lors du chargement des conversations :", error);
        if (loader) loader.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");

        // On informe clairement l'utilisateur (erreur réseau ou serveur)
        showToast(
            error.message || "Impossible de charger vos conversations.",
            "error"
        );

    }

}


// ======================================================
// Rendu dynamique de la liste des conversations
// ======================================================

function displayConversations(conversations) {

    const container = document.getElementById("conversations-list");

    if (!container) return;

    container.innerHTML = "";

    // État "aucun résultat" : la recherche ne retourne rien
    // (différent de "aucune conversation" qui concerne la liste complète)
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

        // Classes adaptées aux styles Tailwind de votre maquette HTML
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


// ======================================================
// Ouverture d'une conversation
// ======================================================

async function openConversation(conversation) {

    currentConversation = conversation;

    // Sauvegarde de l'état
    rememberConversation(conversation.id);

    // Activer l'affichage de la boîte de discussion (et cacher l'accueil)
    toggleChatActiveState(true);

    // Mettre à jour l'en-tête actif
    const activeContactName = document.getElementById("active-contact-name");
    const activeContactAvatar = document.getElementById("active-contact-avatar");

    const name = getConversationName(conversation, currentUser.id);
    const avatarUrl = getConversationAvatar(conversation, currentUser.id);

    if (activeContactName) {
        activeContactName.textContent = name;
    }

    if (activeContactAvatar) {
        activeContactAvatar.src = avatarUrl;
    }

    // Rafraîchir l'effet de sélection (sélection active sur la gauche)
    displayConversations(allConversations);

    await loadMessages(conversation.id);

    // Démarrer le rafraîchissement automatique des messages de cette conversation
    startPolling(conversation.id);

}


// ======================================================
// Chargement des messages d'une discussion
// ======================================================

async function loadMessages(conversationId, silent = false) {

    const container = document.getElementById("messages-container");

    try {

        const messages = await getMessages(conversationId);
        displayMessages(messages);

    } catch (error) {

        console.error("Erreur lors du chargement des messages :", error);

        // En mode silencieux (polling en arrière-plan), on n'interrompt pas l'utilisateur
        if (silent) return;

        // Cas particulier : la conversation n'existe pas (ou plus)
        // -> On l'indique clairement dans la zone de messages
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

        // Autres erreurs (réseau, serveur...)
        showToast(
            error.message || "Impossible de charger les messages.",
            "error"
        );

    }

}


// ======================================================
// Rafraîchissement automatique des messages (Bonus : temps réel)
// ======================================================

function startPolling(conversationId) {

    stopPolling();

    pollingInterval = setInterval(() => {
        // On ne rafraîchit que si la conversation est toujours celle affichée
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


// ======================================================
// Rendu dynamique des bulles de messages
// ======================================================

function displayMessages(messages) {

    const container = document.getElementById("messages-container");

    if (!container) return;

    // Ne pas casser le scroll de l'utilisateur s'il est en train de lire plus haut
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

    // Optionnel : Regroupement visuel par date (Aujourd'hui)
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
            // Message envoyé par l'utilisateur connecté (aligné à droite, bulle bleue)
            // Un bouton de suppression apparaît au survol (fonctionnalité bonus)
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

            // Écouteur sur le bouton de suppression qu'on vient de créer
            const deleteBtn = bubbleWrapper.querySelector(".btn-delete-message");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", () => {
                    handleDeleteMessage(deleteBtn.dataset.messageId);
                });
            }

            // Écouteur sur le bouton de modification (Bonus)
            const editBtn = bubbleWrapper.querySelector(".btn-edit-message");
            if (editBtn) {
                editBtn.addEventListener("click", () => {
                    handleEditMessage(editBtn.dataset.messageId, getMessageContent(message));
                });
            }

        } else {
            // Message reçu (aligné à gauche, bulle blanche)
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

    // Rafraîchir les icônes Lucide (nécessaire pour l'icône "supprimer")
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Défilement fluide vers le bas de la discussion,
    // uniquement si l'utilisateur était déjà proche du bas
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


// ======================================================
// Envoi de message (Formulaire)
// ======================================================

async function handleSendMessage(event) {

    if (event) event.preventDefault();

    const input = document.getElementById("message-input");
    const charCounter = document.getElementById("char-counter");

    if (!input) return;

    const content = input.value.trim();

    if (!content || !currentConversation) return;

    try {

        // CORRECT : On passe deux arguments distincts (id, puis contenu)
        await sendMessage(currentConversation.id, content);

        // Vider l'input et réinitialiser le compteur
        input.value = "";
        if (charCounter) charCounter.textContent = "0 / 500";

        // Charger immédiatement les nouveaux messages
        await loadMessages(currentConversation.id);

        // Mettre à jour l'aperçu dans la liste de gauche sans refaire d'appel API global
        const index = allConversations.findIndex(c => String(c.id) === String(currentConversation.id));
        if (index !== -1) {
            allConversations[index].lastMessageAt = new Date().toISOString();
            allConversations[index].last_message = content;
            allConversations[index].lastMessage = content;

            // Re-trier les conversations pour faire remonter celle-ci en haut
            allConversations.sort((a, b) => {
                const dateA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0);
                return dateB - dateA;
            });

            displayConversations(allConversations);
        }

    } catch (error) {

        console.error("Erreur lors de l'envoi du message :", error);

        // On remet le texte dans le champ pour ne pas faire perdre
        // sa saisie à l'utilisateur, et on affiche l'erreur clairement.
        input.value = content;

        showToast(
            error.message || "Le message n'a pas pu être envoyé.",
            "error"
        );

    }

}


// ======================================================
// Modification d'un message (Bonus)
// ======================================================

async function handleEditMessage(messageId, currentContent) {

    if (!messageId) return;

    const newContent = prompt("Modifier votre message :", currentContent);

    // L'utilisateur a annulé
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

        console.error("Erreur lors de la modification du message :", error);
        showToast(
            error.message || "Impossible de modifier ce message.",
            "error"
        );

    }

}


// ======================================================
// Suppression d'un message (Bonus)
// ======================================================

async function handleDeleteMessage(messageId) {

    if (!messageId) return;

    const confirmed = confirm("Voulez-vous vraiment supprimer ce message ?");
    if (!confirmed) return;

    try {

        await deleteMessage(messageId);

        // On recharge simplement les messages de la conversation active
        if (currentConversation) {
            await loadMessages(currentConversation.id);
        }

        showToast("Message supprimé.", "success");

    } catch (error) {

        console.error("Erreur lors de la suppression du message :", error);
        showToast(
            error.message || "Impossible de supprimer ce message.",
            "error"
        );

    }

}


// ======================================================
// Gestion des Événements
// ======================================================

function initializeEvents() {

    // Formulaire d'envoi de message
    const chatForm = document.getElementById("chat-form");
    if (chatForm) {
        chatForm.addEventListener("submit", handleSendMessage);
    }

    // Compteur de caractères dynamique (limite définie dans CONFIG)
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

    // Recherche de conversations en direct dans la barre latérale
    const searchInput = document.getElementById("search-conversations");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const filtered = searchConversations(allConversations, e.target.value, currentUser.id);
            displayConversations(filtered);
        });
    }

    // Bascule du thème sombre / clair (Bonus)
    const themeToggleBtn = document.getElementById("btn-theme-toggle");
    const themeToggleIcon = document.getElementById("theme-toggle-icon");

    const updateThemeIcon = (isDark) => {
        if (themeToggleIcon) {
            themeToggleIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");
            if (window.lucide) window.lucide.createIcons();
        }
    };

    // Synchronise l'icône avec le thème déjà appliqué au chargement de la page
    updateThemeIcon(document.documentElement.classList.contains("dark"));

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const isDark = document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            updateThemeIcon(isDark);
        });
    }

    // Déconnexion (Bouton aside)
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

    // Événements liés à la modal "Nouvelle conversation"
    const newChatBtn = document.querySelector('[title="Nouvelle conversation"]');
    const modal = document.getElementById("new-chat-modal");
    const closeModalBtn = document.getElementById("close-new-chat-modal");
    const searchContactsInput = document.getElementById("search-contacts");

    if (newChatBtn && modal) {
        newChatBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
            if (searchContactsInput) searchContactsInput.value = ""; // Vider la recherche à l'ouverture
            loadContactsToModal(); // Charger les utilisateurs
        });
    }

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    }

    // Fermer la modal en cliquant à l'extérieur de celle-ci
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });

    // Recherche dynamique en direct parmi les contacts chargés dans la modal
    if (searchContactsInput) {
        searchContactsInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            filterAndDisplayContacts(query);
        });
    }

}


// ======================================================
// Chargement et affichage des contacts dans la modal
// ======================================================

async function loadContactsToModal() {
    const container = document.getElementById("contacts-list");
    const loader = document.getElementById("contacts-loader");

    if (!container) return;

    if (loader) loader.classList.remove("hidden");

    try {
        const users = await getUsers(); // Appel API pour récupérer les utilisateurs

        if (loader) loader.classList.add("hidden");

        // Filtrer pour exclure notre propre profil de la liste
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


// Rendu dynamique de la liste brute de contacts dans la modal
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


// Filtre local des contacts dans la modal
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


// Action de création de la discussion après le clic sur un contact
async function handleStartNewConversation(recipientId) {
    try {
        // Appelle l'API pour créer ou récupérer la conversation existante
        const conversation = await createConversation(recipientId, currentUser.id);

        // Recharger la liste latérale pour inclure la nouvelle conversation
        await loadConversations();

        // Ouvrir immédiatement la nouvelle conversation créée
        openConversation(conversation);

    } catch (error) {
        console.error("Erreur lors de la création de la discussion :", error);
        showToast(
            error.message || "Impossible de démarrer cette discussion.",
            "error"
        );
    }
}


// ======================================================
// Basculer l'affichage (Écran d'accueil vs Conversation active)
// ======================================================

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


// ======================================================
// Utilitaires de protection et d'affichage
// ======================================================

function formatDate(dateString) {

    if (!dateString) return "";

    return new Date(dateString).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });

}

// Éviter l'injection XSS (sécurisation des chaînes de caractères affichées)
function escapeHTML(str) {

    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// Idem, mais pour une utilisation à l'intérieur d'un attribut HTML (src, alt...)
function escapeAttr(str) {
    return escapeHTML(str);
}

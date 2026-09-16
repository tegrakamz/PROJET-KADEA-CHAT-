// Gestion des conversations et des contacts

import { apiGet, apiPost } from "./api.js";
import {
    saveLastConversation,
    getLastConversation,
    removeLastConversation,
    getUser,
    getToken,
    parseJwt
} from "../utils/storage.js";

const ENDPOINTS = {
    CONVERSATIONS: "/conversations",
    USERS: "/users"
};

// Récupère une liste d'éléments quel que soit le format de réponse de l'API
function extractArray(response) {
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    if (response?.data?.conversations && Array.isArray(response.data.conversations)) return response.data.conversations;
    if (response?.data?.users && Array.isArray(response.data.users)) return response.data.users;
    if (Array.isArray(response?.conversations)) return response.conversations;
    if (Array.isArray(response?.users)) return response.users;
    return [];
}

// Liste de tous les utilisateurs du workspace
export async function getUsers() {
    const response = await apiGet(ENDPOINTS.USERS);
    return extractArray(response);
}

// Liste des conversations de l'utilisateur connecté, triées par date
export async function getConversations() {
    const response = await apiGet(ENDPOINTS.CONVERSATIONS);
    const conversations = extractArray(response);
    return sortConversations(conversations);
}

// Recherche d'une conversation par son identifiant
export async function getConversationById(id) {
    const conversations = await getConversations();
    return conversations.find(
        conversation => String(conversation.id) === String(id)
    ) || null;
}

// Récupère les participants d'une conversation
export function getParticipants(conversation) {
    return (
        conversation.participants ||
        conversation.members ||
        conversation.users ||
        []
    );
}

// Trouve le correspondant dans une conversation privée à deux
export function getOtherParticipant(conversation, currentUserId) {
    const participants = getParticipants(conversation);
    if (!Array.isArray(participants) || participants.length === 0) {
        return null;
    }

    let myId = currentUserId;
    if (!myId) {
        const u = getUser();
        myId = u?.id || u?.userId;
    }
    if (!myId) {
        const token = getToken();
        if (token) {
            const payload = parseJwt(token);
            myId = payload?.userId || payload?.id;
        }
    }

    const myIdStr = myId ? String(myId).toLowerCase() : null;

    if (myIdStr) {
        const other = participants.find(p => {
            const uid = p.userId ?? p.user?.id ?? p.id ?? p._id ?? (typeof p === "string" ? p : null);
            return uid && String(uid).toLowerCase() !== myIdStr;
        });
        if (other) return other;
    }

    // Si pas trouvé par ID, chercher le participant ayant un user ou fullName différent
    return participants[0] || null;
}

// Ouvre ou crée une conversation privée avec un utilisateur
export async function createConversation(recipientId, currentUserId) {
    const myId = currentUserId || getUser()?.id;

    if (!myId || myId === "undefined") {
        throw new Error("Impossible d'identifier votre compte utilisateur.");
    }

    if (!recipientId || recipientId === "undefined") {
        throw new Error("Destinataire invalide pour démarrer la discussion.");
    }

    // Si une discussion existe déjà avec cette personne, on la réutilise
    try {
        const existingConversations = await getConversations();
        const existing = existingConversations.find(conversation => {
            const participants = getParticipants(conversation);
            if (!Array.isArray(participants)) return false;
            const ids = participants.map(p => String(p.userId ?? p.user?.id ?? p.id ?? p._id ?? p));
            return ids.includes(String(myId)) && ids.includes(String(recipientId));
        });

        if (existing) {
            return existing;
        }
    } catch (error) {
        console.warn("Vérification des conversations existantes impossible :", error);
    }

    // Sinon on crée une nouvelle conversation privée
    const data = {
        type: "private",
        participantIds: [String(recipientId)]
    };

    const response = await apiPost(ENDPOINTS.CONVERSATIONS, data);
    return response?.data?.conversation || response?.data || response;
}

// Tri pour afficher la conversation la plus récente en premier
export function sortConversations(conversations) {
    return [...conversations].sort((a, b) => {
        const dateA = new Date(getConversationDate(a) || 0);
        const dateB = new Date(getConversationDate(b) || 0);
        return dateB - dateA;
    });
}

export function getConversationDate(conversation) {
    if (Array.isArray(conversation.messages) && conversation.messages.length > 0) {
        const last = conversation.messages[conversation.messages.length - 1];
        if (last?.createdAt) return last.createdAt;
    }
    return (
        conversation.updatedAt ||
        conversation.lastMessageAt ||
        conversation.createdAt ||
        (conversation.lastMessage && conversation.lastMessage.createdAt) ||
        null
    );
}

// Filtrage local des conversations par nom du contact
export function searchConversations(conversations, keyword, currentUserId) {
    if (!keyword) return conversations;
    const search = keyword.toLowerCase().trim();

    return conversations.filter(conversation => {
        const fullname = getConversationName(conversation, currentUserId);
        return fullname.toLowerCase().includes(search);
    });
}

// Mémorise la discussion ouverte
export function rememberConversation(id) {
    saveLastConversation(id);
}

// Récupère la dernière discussion ouverte
export function getRememberedConversation() {
    return getLastConversation();
}

// Efface la discussion mémorisée
export function forgetConversation() {
    removeLastConversation();
}

// Formate l'heure d'un message ou de la discussion (HH:MM)
export function formatConversationTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Extrait le texte du dernier message pour l'aperçu
export function getLastMessage(conversation) {
    if (Array.isArray(conversation.messages) && conversation.messages.length > 0) {
        const last = conversation.messages[conversation.messages.length - 1];
        return last?.content || last?.text || last?.message || "Aucun message";
    }
    const last = conversation.lastMessage;
    if (last && typeof last === "object") {
        return last.content || last.text || last.message || "Aucun message";
    }
    return last || conversation.last_message || "Aucun message";
}

// Détermine l'avatar du correspondant
export function getConversationAvatar(conversation, currentUserId) {
    const other = getOtherParticipant(conversation, currentUserId);
    const otherUser = other?.user || (typeof other === "object" && other?.fullName ? other : null);
    const convName = getConversationName(conversation, currentUserId);

    return (
        (otherUser && (otherUser.avatarUrl || otherUser.avatar_url || otherUser.avatar || otherUser.photo)) ||
        conversation.avatarUrl ||
        conversation.avatar ||
        conversation.photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(convName || "Discussion")}&background=2563eb&color=fff&bold=true&size=128`
    );
}

// Détermine le nom à afficher pour la conversation
export function getConversationName(conversation, currentUserId) {
    const other = getOtherParticipant(conversation, currentUserId);
    const otherUser = other?.user || (typeof other === "object" && other?.fullName ? other : null);

    if (otherUser && (otherUser.fullName || otherUser.fullname || otherUser.name)) {
        return otherUser.fullName || otherUser.fullname || otherUser.name;
    }

    if (conversation.name && conversation.name !== "Discussion" && conversation.name !== "null") {
        return conversation.name;
    }

    if (conversation.fullName || conversation.contactName) {
        return conversation.fullName || conversation.contactName;
    }

    if (otherUser && otherUser.email) {
        return otherUser.email.split('@')[0];
    }

    return conversation.name || "Discussion";
}

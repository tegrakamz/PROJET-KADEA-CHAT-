// ======================================================
// KADEA CHAT
// Service de gestion des conversations et des utilisateurs
// ======================================================

import { apiGet, apiPost } from "./api.js";
import {
    saveLastConversation,
    getLastConversation,
    removeLastConversation
} from "../utils/storage.js";

// ======================================================
// Endpoints API
// ======================================================

const ENDPOINTS = {
    CONVERSATIONS: "/conversations",
    USERS: "/users"
};

// ======================================================
// Extraction générique des données utiles d'une réponse API
// L'API Kadea Chat renvoie systématiquement :
// { success: true, message: "...", data: ... }
// Mais on reste défensif si jamais la forme diffère.
// ======================================================

function extractArray(response) {

    if (Array.isArray(response)) {
        return response;
    }

    if (response && Array.isArray(response.data)) {
        return response.data;
    }

    if (response && response.data && Array.isArray(response.data.conversations)) {
        return response.data.conversations;
    }

    if (response && response.data && Array.isArray(response.data.users)) {
        return response.data.users;
    }

    if (response && Array.isArray(response.conversations)) {
        return response.conversations;
    }

    if (response && Array.isArray(response.users)) {
        return response.users;
    }

    return [];

}

// ======================================================
// Gestion des utilisateurs (Contacts)
// ======================================================

/**
 * Récupérer la liste de tous les utilisateurs du workspace
 * @returns {Promise<Array>} Liste des utilisateurs
 */
export async function getUsers() {

    const response = await apiGet(ENDPOINTS.USERS);

    return extractArray(response);

}

// ======================================================
// Gestion des conversations (Création, Lecture, Tri)
// ======================================================

/**
 * Récupérer toutes les conversations de l'utilisateur connecté
 * @returns {Promise<Array>} Liste des conversations triées par date décroissante
 */
export async function getConversations() {

    const response = await apiGet(ENDPOINTS.CONVERSATIONS);

    const conversations = extractArray(response);

    return sortConversations(conversations);

}

/**
 * Récupérer une conversation spécifique par son identifiant
 * @param {string|number} id - L'ID de la conversation
 * @returns {Promise<Object|null>} La conversation ou null
 */
export async function getConversationById(id) {
    const conversations = await getConversations();
    return conversations.find(
        conversation => String(conversation.id) === String(id)
    ) || null;
}

/**
 * Récupérer la liste des participants d'une conversation,
 * quelle que soit la clé utilisée par l'API.
 * @param {Object} conversation
 * @returns {Array} Liste des participants (objets utilisateurs)
 */
export function getParticipants(conversation) {
    return (
        conversation.participants ||
        conversation.members ||
        conversation.users ||
        []
    );
}

/**
 * Trouver le correspondant (l'autre participant) d'une conversation privée
 * @param {Object} conversation
 * @param {string|number} currentUserId
 * @returns {Object|null}
 */
export function getOtherParticipant(conversation, currentUserId) {
    const participants = getParticipants(conversation);

    if (!Array.isArray(participants) || participants.length === 0) {
        return null;
    }

    return (
        participants.find(p => String(p.id ?? p._id ?? p) !== String(currentUserId)) ||
        null
    );
}

/**
 * Créer une nouvelle conversation privée avec un utilisateur spécifique.
 * Vérifie d'abord si une conversation privée existe déjà avec ce
 * destinataire afin d'éviter les doublons.
 *
 * @param {string|number} recipientId - L'ID du destinataire
 * @param {string|number} currentUserId - L'ID de l'utilisateur connecté
 * @returns {Promise<Object>} La conversation créée ou récupérée
 */
export async function createConversation(recipientId, currentUserId) {

    // 1. On vérifie si une conversation privée existe déjà avec cet utilisateur
    try {
        const existingConversations = await getConversations();

        const existing = existingConversations.find(conversation => {
            const participants = getParticipants(conversation);
            if (!Array.isArray(participants) || participants.length !== 2) {
                return false;
            }
            const ids = participants.map(p => String(p.id ?? p._id ?? p));
            return (
                ids.includes(String(currentUserId)) &&
                ids.includes(String(recipientId))
            );
        });

        if (existing) {
            return existing;
        }
    } catch (error) {
        // Si la vérification échoue, on tente quand même la création
        console.warn("Impossible de vérifier les conversations existantes :", error);
    }

    // 2. Sinon, on crée une nouvelle conversation privée
    const data = {
    type: "private",
    name: "Discussion",
    participantIds: [String(currentUserId), String(recipientId)]
};

    const response = await apiPost(ENDPOINTS.CONVERSATIONS, data);

    return (response && response.data) ? response.data : response;
}

/**
 * Tri des conversations pour remonter la plus récente en premier
 * @param {Array} conversations
 * @returns {Array} Conversations triées
 */
export function sortConversations(conversations) {
    return [...conversations].sort((a, b) => {
        const dateA = new Date(getConversationDate(a) || 0);
        const dateB = new Date(getConversationDate(b) || 0);
        return dateB - dateA;
    });
}

function getConversationDate(conversation) {
    return (
        conversation.updatedAt ||
        conversation.lastMessageAt ||
        conversation.createdAt ||
        (conversation.lastMessage && conversation.lastMessage.createdAt) ||
        null
    );
}

/**
 * Filtrer localement les conversations selon un mot-clé
 * @param {Array} conversations
 * @param {string} keyword
 * @param {string|number} currentUserId
 * @returns {Array} Conversations filtrées
 */
export function searchConversations(conversations, keyword, currentUserId) {
    if (!keyword) return conversations;

    const search = keyword.toLowerCase().trim();

    return conversations.filter(conversation => {
        const fullname = getConversationName(conversation, currentUserId);
        return fullname.toLowerCase().includes(search);
    });
}

// ======================================================
// Utilitaires de formatage et de persistence
// ======================================================

/**
 * Sauvegarder l'ID de la dernière conversation ouverte dans le localStorage
 * @param {string|number} id - L'ID de la conversation
 */
export function rememberConversation(id) {
    saveLastConversation(id);
}

/**
 * Récupérer l'ID de la dernière conversation stockée
 * @returns {string|null} ID de la conversation
 */
export function getRememberedConversation() {
    return getLastConversation();
}

/**
 * Oublier la dernière conversation mémorisée (ex: si elle a été supprimée)
 */
export function forgetConversation() {
    removeLastConversation();
}

/**
 * Formater l'heure de mise à jour d'une discussion (HH:MM)
 * @param {string} date - Date ISO ou timestamp
 * @returns {string} Heure formatée
 */
export function formatConversationTime(date) {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

/**
 * Extraire l'aperçu du dernier message d'une conversation
 * @param {Object} conversation
 * @returns {string} Aperçu textuel
 */
export function getLastMessage(conversation) {
    const last = conversation.lastMessage;

    if (last && typeof last === "object") {
        return last.content || last.text || "Aucun message";
    }

    return (
        last ||
        conversation.last_message ||
        "Aucun message"
    );
}

/**
 * Résoudre le chemin de l'avatar du correspondant (conversation privée)
 * @param {Object} conversation
 * @param {string|number} currentUserId
 * @returns {string} URL de l'image
 */
export function getConversationAvatar(conversation, currentUserId) {
    const other = getOtherParticipant(conversation, currentUserId);

    return (
        (other && (other.avatarUrl || other.avatar || other.photo)) ||
        conversation.avatarUrl ||
        conversation.avatar ||
        conversation.photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(getConversationName(conversation, currentUserId))}&background=2563eb&color=fff&bold=true`
    );
}

/**
 * Résoudre le nom d'affichage d'un correspondant
 * @param {Object} conversation
 * @param {string|number} currentUserId
 * @returns {string} Nom complet ou valeur par défaut
 */
export function getConversationName(conversation, currentUserId) {
    const other = getOtherParticipant(conversation, currentUserId);

    if (other && other.fullName) {
        return other.fullName;
    }

    return (
        conversation.name ||
        conversation.fullName ||
        conversation.contactName ||
        "Utilisateur"
    );
}

// Service d'envoi, de lecture et de gestion des messages

import {
    apiGet,
    apiPost,
    apiDelete,
    apiPatch
} from "./api.js";

const MESSAGE_ENDPOINTS = {
    LIST: (conversationId) => `/conversations/${conversationId}/messages`,
    SEND: (conversationId) => `/conversations/${conversationId}/messages`
};

// Récupère la liste brute des messages d'une réponse API
function extractMessages(response) {
    if (Array.isArray(response)) return response;
    if (response?.data && Array.isArray(response.data)) return response.data;
    if (response?.data?.messages && Array.isArray(response.data.messages)) return response.data.messages;
    if (Array.isArray(response?.messages)) return response.messages;
    return [];
}

// Récupère les messages d'une discussion, classés par ordre chronologique
export async function getMessages(conversationId) {
    if (!conversationId) {
        throw new Error("L'identifiant de la conversation est obligatoire.");
    }

    const response = await apiGet(MESSAGE_ENDPOINTS.LIST(conversationId));
    const messages = extractMessages(response);
    return sortMessages(messages);
}

// Envoie un nouveau message dans une discussion
export async function sendMessage(conversationId, content) {
    if (!conversationId) {
        throw new Error("Conversation invalide.");
    }

    if (!content || !content.trim()) {
        throw new Error("Le message ne peut pas être vide.");
    }

    const data = {
        content: content.trim()
    };

    const response = await apiPost(MESSAGE_ENDPOINTS.SEND(conversationId), data);
    return response?.data ? response.data : response;
}

// Modifie le contenu d'un message existant
export async function editMessage(messageId, content) {
    if (!messageId) {
        throw new Error("Identifiant du message obligatoire.");
    }

    if (!content || !content.trim()) {
        throw new Error("Le message ne peut pas être vide.");
    }

    const response = await apiPatch(`/messages/${messageId}`, {
        content: content.trim()
    });

    return response?.data ? response.data : response;
}

// Supprime un message par son identifiant
export async function deleteMessage(messageId) {
    if (!messageId) {
        throw new Error("Identifiant du message obligatoire.");
    }
    return await apiDelete(`/messages/${messageId}`);
}

// Classe les messages du plus ancien au plus récent
export function sortMessages(messages) {
    return [...messages].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        return dateA - dateB;
    });
}

// Formate l'heure d'envoi d'un message (HH:MM)
export function formatMessageTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Vérifie si le message a été envoyé par l'utilisateur connecté
export function isMyMessage(message, userId) {
    if (!message || !userId) return false;

    const senderId =
        message.senderId ||
        message.sender_id ||
        (message.sender && message.sender.id) ||
        (message.user && message.user.id);

    return String(senderId) === String(userId);
}

// Récupère le texte du message quel que soit le champ utilisé par l'API
export function getMessageContent(message) {
    return (
        message.content ||
        message.text ||
        message.message ||
        ""
    );
}

// Récupère l'auteur du message
export function getSender(message) {
    return (
        message.sender ||
        message.user ||
        { name: "Utilisateur" }
    );
}

// Filtrage de messages par mot-clé
export function searchMessages(messages, keyword) {
    if (!keyword) return messages;

    const search = keyword.toLowerCase().trim();
    return messages.filter(message => {
        const content = getMessageContent(message);
        return content.toLowerCase().includes(search);
    });
}

// Récupère le dernier message de la liste
export function getLastMessage(messages) {
    if (!messages || messages.length === 0) return null;
    return messages[messages.length - 1];
}

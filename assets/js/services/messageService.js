// ======================================================
// KADEA CHAT
// Service de gestion des messages
// ======================================================

import {
    apiGet,
    apiPost,
    apiDelete,
    apiPatch
} from "./api.js";


// ======================================================
// Endpoints API
// ======================================================

const MESSAGE_ENDPOINTS = {

    /**
     * Récupération des messages d'une conversation
     * GET /conversations/:conversationId/messages
     */
    LIST: (conversationId) =>
        `/conversations/${conversationId}/messages`,

    /**
     * Envoyer un message
     * POST /conversations/:conversationId/messages
     */
    SEND: (conversationId) =>
        `/conversations/${conversationId}/messages`

};


// ======================================================
// Extraction générique du tableau de messages
// L'API renvoie { success, message, data: [...] }
// ======================================================

function extractMessages(response) {

    if (Array.isArray(response)) {
        return response;
    }

    if (response && Array.isArray(response.data)) {
        return response.data;
    }

    if (response && response.data && Array.isArray(response.data.messages)) {
        return response.data.messages;
    }

    if (response && Array.isArray(response.messages)) {
        return response.messages;
    }

    return [];

}


// ======================================================
// Récupérer les messages d'une conversation
// GET /conversations/:id/messages
// ======================================================

export async function getMessages(conversationId) {

    if (!conversationId) {
        throw new Error(
            "L'identifiant de la conversation est obligatoire."
        );
    }

    const response = await apiGet(
        MESSAGE_ENDPOINTS.LIST(conversationId)
    );

    const messages = extractMessages(response);

    return sortMessages(messages);

}


// ======================================================
// Envoyer un message
// POST /conversations/:id/messages
// ======================================================

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

    const response = await apiPost(
        MESSAGE_ENDPOINTS.SEND(conversationId),
        data
    );

    return (response && response.data) ? response.data : response;

}


// ======================================================
// Modifier un message (Bonus)
// PATCH /messages/:id
// ======================================================

export async function editMessage(messageId, content) {

    if (!messageId) {
        throw new Error("Identifiant du message obligatoire.");
    }

    if (!content || !content.trim()) {
        throw new Error("Le message ne peut pas être vide.");
    }

    const response = await apiPatch(
        `/messages/${messageId}`,
        { content: content.trim() }
    );

    return (response && response.data) ? response.data : response;

}


// ======================================================
// Supprimer un message
// DELETE /messages/:id
// Bonus
// ======================================================

export async function deleteMessage(messageId) {

    if (!messageId) {
        throw new Error("Identifiant du message obligatoire.");
    }

    return await apiDelete(`/messages/${messageId}`);

}


// ======================================================
// Trier les messages
// Les plus anciens vers les plus récents
// ======================================================

export function sortMessages(messages) {

    return [...messages].sort((a, b) => {

        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);

        return dateA - dateB;

    });

}


// ======================================================
// Formater l'heure d'un message
// ======================================================

export function formatMessageTime(date) {

    if (!date) return "";

    return new Date(date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });

}


// ======================================================
// Vérifier si le message appartient
// à l'utilisateur connecté
// ======================================================

export function isMyMessage(message, userId) {

    if (!message || !userId) {
        return false;
    }

    const senderId =
        message.senderId ||
        message.sender_id ||
        (message.sender && message.sender.id) ||
        (message.user && message.user.id);

    return String(senderId) === String(userId);

}


// ======================================================
// Obtenir le contenu du message
// Gestion des différentes réponses API
// ======================================================

export function getMessageContent(message) {

    return (
        message.content ||
        message.text ||
        message.message ||
        ""
    );

}


// ======================================================
// Obtenir l'expéditeur
// ======================================================

export function getSender(message) {

    return (
        message.sender ||
        message.user ||
        { name: "Utilisateur" }
    );

}


// ======================================================
// Recherche dans les messages
// Bonus
// ======================================================

export function searchMessages(messages, keyword) {

    if (!keyword) {
        return messages;
    }

    const search = keyword.toLowerCase().trim();

    return messages.filter(message => {
        const content = getMessageContent(message);
        return content.toLowerCase().includes(search);
    });

}


// ======================================================
// Dernier message d'une conversation
// ======================================================

export function getLastMessage(messages) {

    if (!messages || messages.length === 0) {
        return null;
    }

    return messages[messages.length - 1];

}

// ======================================================
// KADEA CHAT
// Utilitaires de gestion du Local Storage
// (Token JWT, utilisateur connecté, thème, dernière conversation)
// ======================================================

const TOKEN_KEY = "kadea_token";
const USER_KEY = "kadea_user";
const THEME_KEY = "theme";
const LAST_CONVERSATION_KEY = "kadea_last_conversation";

// ======================================================
// Token JWT
// ======================================================

/**
 * Sauvegarder le token JWT reçu après connexion
 * @param {string} token
 */
export function saveToken(token) {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
        console.warn("Impossible d'écrire dans le localStorage :", error);
    }
}

/**
 * Récupérer le token JWT sauvegardé
 * @returns {string|null}
 */
export function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
        console.warn("Impossible de lire le localStorage :", error);
        return null;
    }
}

/**
 * Supprimer le token JWT
 */
export function removeToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
        console.warn("Impossible de supprimer le token :", error);
    }
}

// ======================================================
// Utilisateur connecté
// ======================================================

/**
 * Sauvegarder les informations de l'utilisateur connecté
 * @param {Object} user
 */
export function saveUser(user) {
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.warn("Impossible de sauvegarder l'utilisateur :", error);
    }
}

/**
 * Récupérer les informations de l'utilisateur connecté
 * @returns {Object|null}
 */
export function getUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn("Impossible de lire l'utilisateur :", error);
        return null;
    }
}

/**
 * Supprimer les informations de l'utilisateur connecté
 */
export function removeUser() {
    try {
        localStorage.removeItem(USER_KEY);
    } catch (error) {
        console.warn("Impossible de supprimer l'utilisateur :", error);
    }
}

// ======================================================
// Session complète (déconnexion / erreurs 401-403)
// ======================================================

/**
 * Supprimer toutes les données de session enregistrées localement
 */
export function clearSession() {
    removeToken();
    removeUser();
    removeLastConversation();
}

// ======================================================
// Dernière conversation ouverte (Bonus)
// ======================================================

/**
 * Sauvegarder l'identifiant de la dernière conversation ouverte
 * @param {string|number} conversationId
 */
export function saveLastConversation(conversationId) {
    try {
        localStorage.setItem(LAST_CONVERSATION_KEY, String(conversationId));
    } catch (error) {
        console.warn("Impossible de sauvegarder la dernière conversation :", error);
    }
}

/**
 * Récupérer l'identifiant de la dernière conversation ouverte
 * @returns {string|null}
 */
export function getLastConversation() {
    try {
        return localStorage.getItem(LAST_CONVERSATION_KEY);
    } catch (error) {
        return null;
    }
}

/**
 * Supprimer la dernière conversation mémorisée
 */
export function removeLastConversation() {
    try {
        localStorage.removeItem(LAST_CONVERSATION_KEY);
    } catch (error) {
        console.warn("Impossible de supprimer la dernière conversation :", error);
    }
}

// ======================================================
// Thème (Sombre / Clair)
// ======================================================

/**
 * Sauvegarder la préférence de thème
 * @param {"dark"|"light"} theme
 */
export function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        console.warn("Impossible de sauvegarder le thème :", error);
    }
}

/**
 * Récupérer la préférence de thème sauvegardée
 * @returns {"dark"|"light"|null}
 */
export function getTheme() {
    try {
        return localStorage.getItem(THEME_KEY);
    } catch (error) {
        return null;
    }
}

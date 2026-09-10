// Gestion du stockage local (session, profil, préférences)

const TOKEN_KEY = "kadea_token";
const USER_KEY = "kadea_user";
const THEME_KEY = "theme";
const LAST_CONVERSATION_KEY = "kadea_last_conversation";

// --- Token JWT ---

export function saveToken(token) {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
        console.warn("Impossible d'enregistrer le token :", error);
    }
}

export function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
        console.warn("Impossible de lire le token :", error);
        return null;
    }
}

export function removeToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
        console.warn("Impossible de supprimer le token :", error);
    }
}

// --- Profil utilisateur ---

export function saveUser(user) {
    try {
        if (!user) {
            localStorage.removeItem(USER_KEY);
            return;
        }
        // Extraction du profil si l'API le renvoie encapsulé
        let normalized = user;
        if (normalized.data?.user) normalized = normalized.data.user;
        else if (normalized.user) normalized = normalized.user;
        else if (normalized.data) normalized = normalized.data;
        localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    } catch (error) {
        console.warn("Impossible d'enregistrer l'utilisateur :", error);
    }
}

export function getUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        let parsed = JSON.parse(raw);
        if (parsed?.data?.user) parsed = parsed.data.user;
        else if (parsed?.user) parsed = parsed.user;
        else if (parsed?.data) parsed = parsed.data;
        return parsed;
    } catch (error) {
        console.warn("Impossible de lire l'utilisateur :", error);
        return null;
    }
}

export function removeUser() {
    try {
        localStorage.removeItem(USER_KEY);
    } catch (error) {
        console.warn("Impossible de supprimer l'utilisateur :", error);
    }
}

// --- Session complète ---

// Nettoie toutes les données liées à la session courante
export function clearSession() {
    removeToken();
    removeUser();
    removeLastConversation();
}

// --- Dernière conversation active ---

export function saveLastConversation(conversationId) {
    try {
        localStorage.setItem(LAST_CONVERSATION_KEY, String(conversationId));
    } catch (error) {
        console.warn("Impossible d'enregistrer la dernière conversation :", error);
    }
}

export function getLastConversation() {
    try {
        return localStorage.getItem(LAST_CONVERSATION_KEY);
    } catch (error) {
        return null;
    }
}

export function removeLastConversation() {
    try {
        localStorage.removeItem(LAST_CONVERSATION_KEY);
    } catch (error) {
        console.warn("Impossible de supprimer la dernière conversation :", error);
    }
}

// --- Thème (clair / sombre) ---

export function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        console.warn("Impossible d'enregistrer le thème :", error);
    }
}

export function getTheme() {
    try {
        return localStorage.getItem(THEME_KEY);
    } catch (error) {
        return null;
    }
}


// Gestion du stockage local (session, profil, préférences)

const TOKEN_KEY = "kadea_token";
const USER_KEY = "kadea_user";
const THEME_KEY = "theme";
const LAST_CONVERSATION_KEY = "kadea_last_conversation";

// --- Décodage JWT de secours ---
export function parseJwt(token) {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

// Normalise l'objet utilisateur pour garantir la présence des champs essentiels
export function normalizeUser(user) {
    if (!user) return null;
    let u = user;
    if (u.data?.user) u = u.data.user;
    else if (u.user) u = u.user;
    else if (u.data && typeof u.data === "object" && !Array.isArray(u.data)) u = u.data;

    let jwtPayload = null;
    const token = getToken();
    if (token) {
        jwtPayload = parseJwt(token);
    }

    const rawId = u.id || u.userId || u._id || u.sub || jwtPayload?.userId || jwtPayload?.id;
    const cleanId = rawId ? String(rawId) : null;

    const email = u.email || jwtPayload?.email || "";
    const emailPrefix = email ? email.split('@')[0] : "";

    const fullName =
        u.fullName ||
        u.fullname ||
        u.name ||
        u.nom ||
        (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : "");

    const avatarUrl = u.avatarUrl || u.avatar_url || u.avatar || u.photo || null;

    return {
        ...u,
        id: cleanId,
        userId: cleanId,
        fullName: fullName || "Utilisateur",
        email: email,
        avatarUrl: avatarUrl,
        bio: u.bio || "",
        createdAt: u.createdAt || u.created_at || null,
        updatedAt: u.updatedAt || u.updated_at || null
    };
}

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
        const normalized = normalizeUser(user);
        if (normalized) {
            localStorage.setItem(USER_KEY, JSON.stringify(normalized));
        }
    } catch (error) {
        console.warn("Impossible d'enregistrer l'utilisateur :", error);
    }
}

export function getUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        let parsed = null;
        if (raw) {
            try {
                parsed = JSON.parse(raw);
            } catch {
                parsed = null;
            }
        }

        // Si l'objet en cache est manquant ou incomplet, on tente de le reconstituer avec le JWT
        if (!parsed || (!parsed.id && !parsed.userId)) {
            const token = getToken();
            const jwtPayload = parseJwt(token);
            if (jwtPayload) {
                const fallbackUser = normalizeUser(jwtPayload);
                if (fallbackUser) {
                    saveUser(fallbackUser);
                    return fallbackUser;
                }
            }
            if (!parsed) return null;
        }

        return normalizeUser(parsed);
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


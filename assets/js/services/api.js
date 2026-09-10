// Client HTTP pour communiquer avec l'API du backend

import { CONFIG } from "../config/config.js";
import { getToken, clearSession } from "../utils/storage.js";

// Prépare les en-têtes avec la clé d'API et le token si présent
function buildHeaders() {
    const headers = {
        "Content-Type": "application/json",
        "x-api-key": CONFIG.API_KEY
    };

    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

// Fonction centrale d'exécution des requêtes HTTP avec gestion des erreurs
export async function apiRequest(
    endpoint,
    method = "GET",
    data = null
) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, CONFIG.REQUEST_TIMEOUT || 15000);

    const options = {
        method,
        headers: buildHeaders(),
        signal: controller.signal
    };

    if (data !== null) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(
            `${CONFIG.API_URL}${endpoint}`,
            options
        );

        clearTimeout(timeout);

        let result = {};
        try {
            result = await response.json();
        } catch {
            result = {};
        }

        if (!response.ok) {
            // Session expirée ou invalide : on déconnecte et on redirige vers le login
            if (response.status === 401 || response.status === 403) {
                clearSession();

                const currentPage = window.location.pathname.split("/").pop();
                if (currentPage !== "index.html" && currentPage !== "") {
                    window.location.href = "index.html";
                }

                throw new Error(
                    result.message ||
                    "Votre session a expiré. Veuillez vous reconnecter."
                );
            }

            // Ressource introuvable
            if (response.status === 404) {
                const notFoundError = new Error(
                    result.message ||
                    "La ressource demandée est introuvable."
                );
                notFoundError.status = 404;
                throw notFoundError;
            }

            // Erreur de validation des données envoyées (ex: formulaire incomplet)
            if (response.status === 400 || response.status === 422) {
                const errorMsg =
                    Array.isArray(result.errors) && result.errors.length > 0
                        ? result.errors.map(err => err.message || err).join(", ")
                        : null;

                const validationError = new Error(
                    errorMsg ||
                    result.message ||
                    "Les données envoyées ne sont pas valides."
                );
                validationError.status = response.status;
                throw validationError;
            }

            // Limite de requêtes atteinte
            if (response.status === 429) {
                throw new Error(
                    "Trop de requêtes envoyées. Veuillez patienter quelques instants."
                );
            }

            // Serveur temporairement indisponible
            if (response.status === 503) {
                throw new Error(
                    "Le service est actuellement en maintenance. Réessayez plus tard."
                );
            }

            // Erreur interne du serveur
            if (response.status >= 500) {
                throw new Error(
                    "Le serveur rencontre un problème. Veuillez réessayer plus tard."
                );
            }

            // Message d'erreur renvoyé par l'API
            const apiError = new Error(
                result.message ||
                "Une erreur est survenue."
            );
            apiError.status = response.status;
            throw apiError;
        }

        return result;

    } catch (error) {
        clearTimeout(timeout);

        if (error.name === "AbortError") {
            throw new Error("Le serveur met trop de temps à répondre.");
        }

        if (error instanceof TypeError) {
            throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion Internet.");
        }

        throw error;
    }
}

// Raccourcis pour les verbes HTTP usuels
export function apiGet(endpoint) {
    return apiRequest(endpoint, "GET");
}

export function apiPost(endpoint, data) {
    return apiRequest(endpoint, "POST", data);
}

export function apiPut(endpoint, data) {
    return apiRequest(endpoint, "PUT", data);
}

export function apiPatch(endpoint, data) {
    return apiRequest(endpoint, "PATCH", data);
}

export function apiDelete(endpoint) {
    return apiRequest(endpoint, "DELETE");
}

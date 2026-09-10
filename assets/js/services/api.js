// ======================================================
// KADEA CHAT
// Service de communication avec l'API
// ======================================================

import { CONFIG } from "../config/config.js";
import { getToken, clearSession } from "../utils/storage.js";

/**
 * Construit les en-têtes HTTP
 * @returns {Object}
 */
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

/**
 * Effectue une requête HTTP vers l'API
 *
 * @param {string} endpoint
 * @param {string} method
 * @param {Object|null} data
 * @returns {Promise<Object>}
 */
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

            // ==========================================
            // Cas 1 : Utilisateur non authentifié (401)
            // ou accès refusé (403)
            // -> On nettoie la session et on renvoie
            //    l'utilisateur vers la page de connexion.
            // ==========================================
            if (response.status === 401 || response.status === 403) {

                clearSession();

                // On évite de rediriger en boucle si on est déjà sur index.html
                const currentPage = window.location.pathname.split("/").pop();
                if (currentPage !== "index.html" && currentPage !== "") {
                    window.location.href = "index.html";
                }

                throw new Error(
                    result.message ||
                    "Votre session a expiré. Veuillez vous reconnecter."
                );

            }

            // ==========================================
            // Cas 2 : Ressource introuvable (404)
            // Ex : conversation ou message inexistant
            // ==========================================
            if (response.status === 404) {

                const notFoundError = new Error(
                    result.message ||
                    "La ressource demandée est introuvable."
                );
                notFoundError.status = 404;
                throw notFoundError;

            }

            // ==========================================
            // Cas 3 : Validation (422)
            // ==========================================
            if (response.status === 422) {

                const firstError =
                    Array.isArray(result.errors) && result.errors.length > 0
                        ? (result.errors[0].message || result.errors[0])
                        : null;

                throw new Error(
                    firstError ||
                    result.message ||
                    "Les données envoyées ne sont pas valides."
                );

            }

            // ==========================================
            // Cas 4 : Trop de requêtes (429)
            // ==========================================
            if (response.status === 429) {

                throw new Error(
                    "Trop de requêtes envoyées. Veuillez patienter quelques instants."
                );

            }

            // ==========================================
            // Cas 5 : Service en maintenance (503)
            // ==========================================
            if (response.status === 503) {

                throw new Error(
                    "Le service est actuellement en maintenance. Réessayez plus tard."
                );

            }

            // ==========================================
            // Cas 6 : Erreur serveur (500 et plus)
            // ==========================================
            if (response.status >= 500) {

                throw new Error(
                    "Le serveur rencontre un problème. Veuillez réessayer plus tard."
                );

            }

            // ==========================================
            // Cas 7 : Autre erreur renvoyée par l'API
            // (ex : mot de passe incorrect, etc.)
            // ==========================================
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

            throw new Error(
                "Le serveur met trop de temps à répondre."
            );

        }

        if (error instanceof TypeError) {

            throw new Error(
                "Impossible de contacter le serveur. Vérifiez votre connexion Internet."
            );

        }

        throw error;

    }

}

/**
 * Requête GET
 */
export function apiGet(endpoint) {

    return apiRequest(endpoint, "GET");

}

/**
 * Requête POST
 */
export function apiPost(endpoint, data) {

    return apiRequest(endpoint, "POST", data);

}

/**
 * Requête PUT
 */
export function apiPut(endpoint, data) {

    return apiRequest(endpoint, "PUT", data);

}

/**
 * Requête PATCH
 */
export function apiPatch(endpoint, data) {

    return apiRequest(endpoint, "PATCH", data);

}

/**
 * Requête DELETE
 */
export function apiDelete(endpoint) {

    return apiRequest(endpoint, "DELETE");

}
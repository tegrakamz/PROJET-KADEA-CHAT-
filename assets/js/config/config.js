// Configuration de l'application

export const CONFIG = {
    // URL de l'API
    API_URL: "https://kadea-chat-api.onrender.com",

    // Clé du workspace
    API_KEY: "wksp_ca98fd61f4017081f655a991fe781d9e",

    // Délai maximal d'attente pour les requêtes (20s)
    REQUEST_TIMEOUT: 20000,

    // Limite de taille d'un message
    MAX_MESSAGE_LENGTH: 500,

    // Intervalle de rechargement automatique en millisecondes
    REFRESH_INTERVAL: 5000
};

export const API_BASE_URL = CONFIG.API_URL;
export const API_KEY = CONFIG.API_KEY;
export const DEFAULT_AVATAR = CONFIG.DEFAULT_AVATAR;

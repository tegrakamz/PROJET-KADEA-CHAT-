// Requêtes d'authentification auprès de l'API

import { apiGet, apiPost } from "./api.js";

const AUTH_ENDPOINTS = {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    ME: "/auth/me",
    CHANGE_PASSWORD: "/auth/change-password"
};

// Inscription d'un nouveau compte
export function register(userData) {
    return apiPost(AUTH_ENDPOINTS.REGISTER, userData);
}

// Connexion d'un utilisateur existant
export function login(credentials) {
    return apiPost(AUTH_ENDPOINTS.LOGIN, credentials);
}

// Récupération des informations de l'utilisateur connecté
export function getCurrentUser() {
    return apiGet(AUTH_ENDPOINTS.ME);
}

// Mise à jour du mot de passe
export function changePassword(passwordData) {
    return apiPost(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
}

// ======================================================
// KADEA CHAT
// Service d'authentification
// ======================================================

import { apiGet, apiPost } from "./api.js";

// ======================================================
// Endpoints
// ======================================================

const AUTH_ENDPOINTS = {

    REGISTER: "/auth/register",

    LOGIN: "/auth/login",

    ME: "/auth/me",

    CHANGE_PASSWORD: "/auth/change-password"

};

// ======================================================
// Inscription
// ======================================================

export function register(userData) {

    return apiPost(

        AUTH_ENDPOINTS.REGISTER,

        userData

    );

}

// ======================================================
// Connexion
// ======================================================

export function login(credentials) {

    return apiPost(

        AUTH_ENDPOINTS.LOGIN,

        credentials

    );

}

// ======================================================
// Profil utilisateur connecté
// ======================================================

export function getCurrentUser() {

    return apiGet(

        AUTH_ENDPOINTS.ME

    );

}

// ======================================================
// Changement du mot de passe
// ======================================================

export function changePassword(passwordData) {

    return apiPost(

        AUTH_ENDPOINTS.CHANGE_PASSWORD,

        passwordData

    );

}
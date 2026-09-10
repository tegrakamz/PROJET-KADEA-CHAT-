// Contrôle d'accès aux pages selon l'état de connexion

import {
    getToken,
    clearSession
} from "../utils/storage.js";

// Pages accessibles sans être connecté
const PUBLIC_PAGES = [
    "index.html",
    "register.html"
];

// Nom du fichier HTML courant
const currentPage =
    window.location.pathname.split("/").pop() ||
    "index.html";

// Vérification immédiate au chargement du script
checkAuthentication();

export function requireAuth() {
    checkAuthentication();
}

function checkAuthentication() {
    const token = getToken();

    // Si aucun token n'existe et qu'on essaie d'accéder à une page privée
    if (!token || token.trim() === "") {
        clearSession();

        if (!PUBLIC_PAGES.includes(currentPage)) {
            window.location.replace("index.html");
        }
        return;
    }

    // Si on est déjà connecté et qu'on revient sur une page publique
    if (PUBLIC_PAGES.includes(currentPage)) {
        window.location.replace("chat.html");
    }
}

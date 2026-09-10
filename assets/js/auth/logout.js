// Gestion de la déconnexion

import { clearSession } from "../utils/storage.js";

// Efface les identifiants locaux et renvoie à la page d'accueil
export function logoutUser() {
    clearSession();
    window.location.replace("index.html");
}

// Branche l'action de déconnexion sur un bouton donné (par défaut "logoutBtn")
export function initLogout(buttonId = "logoutBtn") {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener("click", () => {
        const confirmed = confirm("Voulez-vous vraiment vous déconnecter ?");
        if (!confirmed) return;
        logoutUser();
    });
}

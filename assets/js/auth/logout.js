 // Kadea Chat
// Gestion de la deconnexion
 
import { clearSession } from "../utils/storage.js";


 // Deconnecte l'utilisateur
 
export function logoutUser() {

    // Suppression de toutes les donnees de session
    clearSession();

    // Redirection vers la page de connexion
    window.location.replace("index.html");

}

// Initialise le bouton de deconnexion. Par defaut, le bouton doit avoir l'id "logoutBtn". 
export function initLogout(buttonId = "logoutBtn") {

    const button = document.getElementById(buttonId);

    if (!button) return;

    button.addEventListener("click", () => {

        const confirmed = confirm(
            "Voulez-vous vraiment vous déconnecter ?"
        );

        if (!confirmed) return;

        logoutUser();

    });

}
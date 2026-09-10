// Kadea Chat
// Protection des pages


import {

    getToken,

    clearSession

} from "../utils/storage.js";

// Pages publiques

const PUBLIC_PAGES = [

    "index.html",

    "register.html"

];

// Page actuelle
 
const currentPage =

    window.location.pathname.split("/").pop() ||

    "index.html";


// Initialisation automatique
 
checkAuthentication();

 // Fonction publique
 
export function requireAuth() {

    checkAuthentication();

}

 // Vérification
 
function checkAuthentication() {

    const token = getToken();

    // Aucun token

    if (!token || token.trim() === "") {

        clearSession();

        if (!PUBLIC_PAGES.includes(currentPage)) {

            window.location.replace("index.html");

        }

        return;

    }

     // Utilisateur connecté
 
    if (PUBLIC_PAGES.includes(currentPage)) {

        window.location.replace("chat.html");

    }

}
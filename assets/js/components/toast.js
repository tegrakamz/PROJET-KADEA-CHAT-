 // KADEA CHAT
// Composant Toast (notifications visuelles)
//
// Sert a afficher clairement a l'utilisateur les erreurs
// et messages de succes (cahier des charges, partie 4 :
// "Les erreurs doivent etre clairement affichees a
// l'utilisateur").
//
// Le conteneur #toast-container existe deja dans chat.html.
 
/**
 * Affiche une notification temporaire en bas a droite de l'ecran.
 *
 * @param {string} message - Le texte a afficher
 * @param {"error"|"success"|"info"} type - Le style de la notification
 * @param {number} duration - Duree d'affichage en millisecondes
 */
export function showToast(message, type = "error", duration = 4000) {

    const container = document.getElementById("toast-container");

    // Si le conteneur n'existe pas sur la page (securite),
    // on se rabat sur une alerte classique pour ne pas perdre l'information.
    if (!container) {
        alert(message);
        return;
    }

    // Couleurs et icones selon le type de message
    const styles = {
        error: {
            bg: "bg-red-50 border-red-200 text-red-700",
            icon: "circle-x"
        },
        success: {
            bg: "bg-green-50 border-green-200 text-green-700",
            icon: "circle-check"
        },
        info: {
            bg: "bg-blue-50 border-blue-200 text-blue-700",
            icon: "info"
        }
    };

    const style = styles[type] || styles.error;

    const toast = document.createElement("div");

    toast.className = `
        pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl
        border shadow-md text-xs font-medium max-w-xs
        transition-all duration-300 opacity-0 translate-y-2
        ${style.bg}
    `;

    toast.innerHTML = `
        <i data-lucide="${style.icon}" class="w-4 h-4 flex-shrink-0"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Rafraichir les icones Lucide pour le toast nouvellement ajoute
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Petite animation d'apparition (on retire les classes de depart)
    requestAnimationFrame(() => {
        toast.classList.remove("opacity-0", "translate-y-2");
    });

    // Disparition automatique apres "duration" millisecondes
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
    }, duration);

}

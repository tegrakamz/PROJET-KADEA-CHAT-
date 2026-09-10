// Gestion des messages de notification temporaires (toasts)

/**
 * Affiche une alerte temporaire sur l'écran.
 * @param {string} message - Texte du message
 * @param {"error"|"success"|"info"} type - Type de notification (défaut : error)
 * @param {number} duration - Durée visible en ms (défaut : 4000)
 */
export function showToast(message, type = "error", duration = 4000) {
    const container = document.getElementById("toast-container");

    // Repli de secours si le conteneur n'est pas présent dans la page
    if (!container) {
        alert(message);
        return;
    }

    // Variantes graphiques et icônes
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

    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Petite animation d'entrée
    requestAnimationFrame(() => {
        toast.classList.remove("opacity-0", "translate-y-2");
    });

    // Disparition et suppression de l'élément après expiration
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}


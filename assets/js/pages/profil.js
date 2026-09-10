// ======================================================
// KADEA CHAT
// Contrôleur de la page Profil - Version Unifiée & Corrigée
// ======================================================

import { logoutUser } from "../auth/logout.js";
import { getUser } from "../utils/storage.js";
import { changePassword, getCurrentUser } from "../services/authService.js";
import { isStrongPassword } from "../utils/validator.js";

document.addEventListener("DOMContentLoaded", async () => {

    // Initialisation des icônes Lucide de manière sécurisée
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ======================================================
    // 1. Dynamisation des informations du profil
    // ======================================================
    renderUserData();

    // Tentative de mise à jour des données en arrière-plan depuis l'API
    try {
        const freshUserRes = await getCurrentUser();
        if (freshUserRes && freshUserRes.success && freshUserRes.data) {
            localStorage.setItem("user", JSON.stringify(freshUserRes.data));
            renderUserData(); // Re-rend les données à jour
        }
    } catch (e) {
        console.warn("Impossible de synchroniser les infos fraîches de l'API :", e);
    }

    // ======================================================
    // 2. Gestion de la navigation et de la déconnexion
    // ======================================================
    const btnChat = document.getElementById('btn-nav-chat');
    const brand = document.getElementById('brand-title');
    const logoForum = document.getElementById('logo-forum');
    const logout = document.getElementById('btn-logout');
    const profileLogout = document.getElementById('btn-profile-logout');

    if (btnChat) {
        btnChat.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }

    if (brand) {
        brand.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }

    if (logoForum) {
        logoForum.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }

    // Handler de déconnexion unifié
    const handleLogout = () => {
        const confirmed = confirm("Voulez-vous vraiment vous déconnecter ?");
        if (confirmed) {
            logoutUser(); // Nettoie le localStorage et redirige proprement
        }
    };

    if (logout) {
        logout.addEventListener('click', handleLogout);
    }
    if (profileLogout) {
        profileLogout.addEventListener('click', handleLogout);
    }

    // ======================================================
    // 3. Bascule du mode Sombre / Clair (Toggle Theme)
    // ======================================================
    const themeToggleBtn = document.getElementById("btn-theme-toggle");
    const themeToggleIcon = document.getElementById("theme-toggle-icon");

    // Met à jour l'icône Lucide (soleil si sombre, lune si clair)
    const updateThemeIcon = (isDark) => {
        if (themeToggleIcon) {
            themeToggleIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    };

    // Synchronise l'icône au chargement initial
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    updateThemeIcon(isCurrentlyDark);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const isDark = document.documentElement.classList.toggle("dark");
            
            if (isDark) {
                localStorage.setItem("theme", "dark");
            } else {
                localStorage.setItem("theme", "light");
            }
            
            updateThemeIcon(isDark);
        });
    }

    // ======================================================
    // 4. Gestion du Modal de changement de mot de passe
    // ======================================================
    const modal = document.getElementById("modal-change-password");
    const trigger = document.getElementById("btn-change-password-trigger");
    const closeModalBtn = document.getElementById("btn-close-modal");
    const form = document.getElementById("form-change-password");

    if (trigger && modal) {
        trigger.addEventListener("click", () => {
            modal.classList.remove("hidden");
            if (form) form.reset();
            hideModalMsg();
        });
    }

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
            }
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            hideModalMsg();

            const oldPassword = document.getElementById("old-password").value;
            const newPassword = document.getElementById("new-password").value;
            const confirmNewPassword = document.getElementById("confirm-new-password").value;

            if (!oldPassword || !newPassword || !confirmNewPassword) {
                showModalMsg("Veuillez remplir tous les champs.", "error");
                return;
            }

            if (newPassword !== confirmNewPassword) {
                showModalMsg("Les nouveaux mots de passe ne correspondent pas.", "error");
                return;
            }

            if (!isStrongPassword(newPassword)) {
                showModalMsg("Le nouveau mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.", "error");
                return;
            }

            const submitBtn = form.querySelector("button[type='submit']");
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Modification en cours...";

            try {
                const response = await changePassword({ oldPassword, newPassword });

                if (response.success) {
                    showModalMsg("Mot de passe modifié avec succès !", "success");
                    form.reset();
                    setTimeout(() => {
                        modal.classList.add("hidden");
                    }, 1500);
                } else {
                    showModalMsg(response.message || "Erreur lors de la modification.", "error");
                }
            } catch (error) {
                console.error(error);
                showModalMsg(error.message || "Une erreur est survenue, veuillez réessayer.", "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// ======================================================
// Fonctions utilitaires de rendu & messages d'erreurs
// ======================================================

function renderUserData() {
    const user = getUser();
    if (!user) {
        console.warn("Aucun utilisateur connecté trouvé.");
        return;
    }

    const nameElements = document.querySelectorAll(".user-fullname");
    const emailElements = document.querySelectorAll(".user-email");
    const usernameDetail = document.getElementById("detail-username");
    const avatarImg = document.getElementById("profile-avatar");
    const memberBadge = document.getElementById("profile-member");

    const nameStr = user.fullName || user.name || "Utilisateur";
    const emailStr = user.email || "Non renseigné";
    const usernameStr = user.username || user.id || "Non défini";

    nameElements.forEach(el => el.textContent = nameStr);
    emailElements.forEach(el => el.textContent = emailStr);
    
    if (usernameDetail) {
        usernameDetail.textContent = usernameStr;
    }

    if (avatarImg) {
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=2563eb&color=white&bold=true`;
        avatarImg.src = user.avatarUrl || user.avatar || user.photo || fallbackAvatar;
    }

    if (memberBadge && user.createdAt) {
        try {
            const dateStr = new Date(user.createdAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
            memberBadge.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Membre depuis le ${dateStr}`;
            if (typeof lucide !== "undefined") {
                lucide.createIcons();
            }
        } catch (_) {}
    }
}

function showModalMsg(text, type = "error") {
    const modalMessage = document.getElementById("modal-message");
    if (!modalMessage) return;

    modalMessage.classList.remove("hidden");
    if (type === "success") {
        modalMessage.className = "rounded-xl p-3 text-xs font-medium border bg-green-50 border-green-200 text-green-700 mb-4";
    } else {
        modalMessage.className = "rounded-xl p-3 text-xs font-medium border bg-red-50 border-red-200 text-red-700 mb-4";
    }
    modalMessage.textContent = text;
}

function hideModalMsg() {
    const modalMessage = document.getElementById("modal-message");
    if (modalMessage) {
        modalMessage.classList.add("hidden");
    }
}
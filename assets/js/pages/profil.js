// Contrôleur de la page de profil utilisateur

import { logoutUser } from "../auth/logout.js";
import { getUser, saveUser } from "../utils/storage.js";
import { changePassword, getCurrentUser, updateProfile } from "../services/authService.js";
import { isStrongPassword } from "../utils/validator.js";

document.addEventListener("DOMContentLoaded", async () => {

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Affichage immédiat des données du profil sauvegardées localement
    renderUserData();

    // Actualisation silencieuse des infos depuis le serveur (/auth/me)
    try {
        const freshUserRes = await getCurrentUser();
        const userData = freshUserRes?.data?.user || freshUserRes?.data || freshUserRes?.user || freshUserRes;
        if (userData && (userData.id || userData.userId || userData.email || userData.fullName)) {
            saveUser(userData);
            renderUserData();
        }
    } catch (e) {
        console.warn("Impossible de synchroniser les informations du profil :", e);
    }

    // Navigation et déconnexion
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

    const handleLogout = () => {
        const confirmed = confirm("Voulez-vous vraiment vous déconnecter ?");
        if (confirmed) {
            logoutUser();
        }
    };

    if (logout) {
        logout.addEventListener('click', handleLogout);
    }
    if (profileLogout) {
        profileLogout.addEventListener('click', handleLogout);
    }

    // Bascule du mode clair / sombre
    const themeToggleBtn = document.getElementById("btn-theme-toggle");
    const themeToggleIcon = document.getElementById("theme-toggle-icon");

    const updateThemeIcon = (isDark) => {
        if (themeToggleIcon) {
            themeToggleIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    };

    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    updateThemeIcon(isCurrentlyDark);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const isDark = document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            updateThemeIcon(isDark);
        });
    }

    // Fenêtre modale d'édition de profil
    const editModal = document.getElementById("modal-edit-profile");
    const editTrigger = document.getElementById("btn-edit-profile");
    const closeEditModalBtn = document.getElementById("btn-close-edit-modal");
    const editForm = document.getElementById("form-edit-profile");

    if (editTrigger && editModal) {
        editTrigger.addEventListener("click", () => {
            const currentUser = getUser() || {};
            const fullnameInput = document.getElementById("edit-fullname");
            const avatarInput = document.getElementById("edit-avatar-url");
            const bioInput = document.getElementById("edit-bio");

            if (fullnameInput) fullnameInput.value = currentUser.fullName || currentUser.name || "";
            if (avatarInput) avatarInput.value = currentUser.avatarUrl || currentUser.avatar || "";
            if (bioInput) bioInput.value = currentUser.bio || "";

            hideEditModalMsg();
            editModal.classList.remove("hidden");
        });
    }

    if (closeEditModalBtn && editModal) {
        closeEditModalBtn.addEventListener("click", () => {
            editModal.classList.add("hidden");
        });
    }

    if (editModal) {
        editModal.addEventListener("click", (e) => {
            if (e.target === editModal) {
                editModal.classList.add("hidden");
            }
        });
    }

    if (editForm) {
        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            hideEditModalMsg();

            const fullname = document.getElementById("edit-fullname")?.value?.trim();
            const avatarUrl = document.getElementById("edit-avatar-url")?.value?.trim();
            const bio = document.getElementById("edit-bio")?.value?.trim();

            if (!fullname) {
                showEditModalMsg("Le nom complet est obligatoire.", "error");
                return;
            }

            const submitBtn = editForm.querySelector("button[type='submit']");
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Enregistrement en cours...";

            try {
                const response = await updateProfile({ fullName: fullname, avatarUrl, bio });
                const updated = response?.data?.user || response?.data || response?.user || { fullName: fullname, avatarUrl, bio };

                // Sauvegarde et mise à jour immédiate de l'interface
                saveUser(updated);
                renderUserData();

                showEditModalMsg("Profil mis à jour avec succès !", "success");
                setTimeout(() => {
                    editModal.classList.add("hidden");
                }, 1200);
            } catch (err) {
                console.error("Erreur modification profil :", err);
                showEditModalMsg(err.message || "Erreur lors de la mise à jour du profil.", "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Fenêtre modale de changement de mot de passe
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
                console.error("Erreur changement de mot de passe :", error);
                showModalMsg(error.message || "Une erreur est survenue, veuillez réessayer.", "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// Affiche les informations de l'utilisateur sur la page
function renderUserData() {
    const user = getUser();
    if (!user) return;

    const nameElements = document.querySelectorAll(".user-fullname");
    const emailElements = document.querySelectorAll(".user-email");
    const usernameDetail = document.getElementById("detail-username");
    const avatarImg = document.getElementById("profile-avatar");
    const memberBadge = document.getElementById("profile-member");

    const nameStr = user.fullName || user.name || "Utilisateur";
    const emailStr = user.email || "Non renseigné";
    const usernameStr = user.id || user.userId || user.username || "Connecté";

    nameElements.forEach(el => {
        el.textContent = nameStr;
    });

    emailElements.forEach(el => {
        el.textContent = emailStr;
    });
    
    if (usernameDetail) {
        usernameDetail.textContent = usernameStr;
    }

    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=2563eb&color=white&bold=true&size=128`;
    if (avatarImg) {
        avatarImg.src = user.avatarUrl || user.avatar || user.photo || fallbackAvatar;
        avatarImg.onerror = () => {
            avatarImg.src = fallbackAvatar;
        };
    }

    if (memberBadge) {
        if (user.createdAt) {
            try {
                const dateStr = new Date(user.createdAt).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });
                memberBadge.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Membre depuis le ${dateStr}`;
            } catch (_) {
                memberBadge.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Compte vérifié`;
            }
        } else {
            memberBadge.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Compte vérifié`;
        }

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }
}

// Notifications dans la modale d'édition de profil
function showEditModalMsg(text, type = "error") {
    const modalMessage = document.getElementById("modal-edit-message");
    if (!modalMessage) return;

    modalMessage.classList.remove("hidden");
    if (type === "success") {
        modalMessage.className = "rounded-xl p-3 text-xs font-medium border bg-green-50 border-green-200 text-green-700 mb-4";
    } else {
        modalMessage.className = "rounded-xl p-3 text-xs font-medium border bg-red-50 border-red-200 text-red-700 mb-4";
    }
    modalMessage.textContent = text;
}

function hideEditModalMsg() {
    const modalMessage = document.getElementById("modal-edit-message");
    if (modalMessage) {
        modalMessage.classList.add("hidden");
    }
}

// Notifications dans la modale de changement de mot de passe
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

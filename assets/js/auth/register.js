// Gestion du formulaire d'inscription

import { register } from "../services/authService.js";
import { validateRegister } from "../utils/validator.js";

// Éléments du formulaire
const registerForm = document.getElementById("registerForm");
const messageBox = document.getElementById("message");

const fullNameInput = document.getElementById("nom");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");

const submitButton = registerForm?.querySelector("button[type='submit']");

if (registerForm) {
    setupPasswordToggle("password", "toggle-password-reg");
    setupPasswordToggle("confirm-password", "toggle-confirm-password-reg");
    registerForm.addEventListener("submit", handleRegister);
}

// Soumission du formulaire
async function handleRegister(event) {
    event.preventDefault();
    hideMessage();

    const formData = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value
    };

    const validationError = validateRegister(formData);
    if (validationError) {
        showMessage(validationError, "error");
        return;
    }

    const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
    };

    setLoading(true);

    try {
        const response = await register(payload);

        if (response.success) {
            showMessage(
                response.message || "Compte créé avec succès.",
                "success"
            );

            registerForm.reset();

            messageBox.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);

        } else {
            showMessage(
                response.message || "Impossible de créer le compte.",
                "error"
            );
        }

    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        showMessage(
            "Une erreur est survenue. Vérifiez votre connexion Internet.",
            "error"
        );
    } finally {
        setLoading(false);
    }
}

// État de chargement du bouton
function setLoading(isLoading) {
    submitButton.disabled = isLoading;

    if (isLoading) {
        submitButton.innerHTML = `
            <span>Création du compte...</span>
        `;
    } else {
        submitButton.innerHTML = `
            Create Account
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
        `;
        lucide.createIcons();
    }
}

// Afficher ou cacher le mot de passe
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);

    if (!input || !toggle) return;

    toggle.addEventListener("click", () => {
        const hidden = input.type === "password";
        input.type = hidden ? "text" : "password";
        toggle.setAttribute("data-lucide", hidden ? "eye-off" : "eye");
        lucide.createIcons();
    });
}

// Affichage d'un retour utilisateur (succès ou erreur)
function showMessage(text, type = "error") {
    messageBox.classList.remove("hidden");
    messageBox.className =
        type === "success"
            ? "rounded-lg p-3 text-sm bg-green-100 border border-green-300 text-green-700"
            : "rounded-lg p-3 text-sm bg-red-100 border border-red-300 text-red-700";
    messageBox.textContent = text;
}

function hideMessage() {
    messageBox.classList.add("hidden");
}

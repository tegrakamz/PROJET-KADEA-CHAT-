// Kadea Chat
// Gestion de la connexion

import { login, getCurrentUser } from "../services/authService.js";
import { validateLogin } from "../utils/validator.js";
import {
    saveToken,
    saveUser
} from "../utils/storage.js";

// Selection des elements du DOM

const loginForm = document.getElementById("login-form");
const messageBox = document.getElementById("message");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = loginForm?.querySelector("button[type='submit']");

 // Initialisation
 
if (loginForm) {

    setupPasswordToggle();

    loginForm.addEventListener("submit", handleLogin);

}

 // Connexion
  
async function handleLogin(event) {

    event.preventDefault();

    hideMessage();

    const credentials = {

        email: emailInput.value.trim(),

        password: passwordInput.value

    };

    const validationError = validateLogin(credentials);

    if (validationError) {

        showMessage(validationError);

        return;

    }

    setLoading(true);

    try {

         // Connexion
 
        const response = await login(credentials);

        console.log("LOGIN :", response);

        if (!response?.success) {

            showMessage(

                response?.message ||

                "Adresse e-mail ou mot de passe incorrect."

            );

            return;

        }

        const token = response.data?.token;

        if (!token) {

            showMessage("Le serveur n'a retourné aucun token.");

            return;

        }

v        // Sauvegarde du token
 
        saveToken(token);

         // Recuperation du profil
 
        const me = await getCurrentUser();

        console.log("ME :", me);

        if (!me?.success || !me.data) {

            showMessage(

                "Connexion réussie mais impossible de récupérer votre profil."

            );

            return;

        }

         // Sauvegarde utilisateur
 
        saveUser(me.data);

        showMessage(

            response.message || "Connexion réussie !",

            "success"

        );

        setTimeout(() => {

            window.location.href = "chat.html";

        }, 1000);

    }

    catch (error) {

        console.error(error);

        showMessage(

            error.message ||

            "Impossible de contacter le serveur."

        );

    }

    finally {

        setLoading(false);

    }

}

 // Bouton Loading
 
function setLoading(isLoading) {

    if (!submitButton) return;

    submitButton.disabled = isLoading;

    if (isLoading) {

        submitButton.innerHTML = `
            <span class="flex items-center justify-center gap-2">
                <svg
                    class="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">

                    <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4">
                    </circle>

                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4A10 10 0 002 12h2z">
                    </path>

                </svg>

                Connexion...
            </span>
        `;

    }

    else {

        submitButton.innerHTML = `
            <span class="flex items-center justify-center gap-2">
                Login
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </span>
        `;

        if (window.lucide) {

            lucide.createIcons();

        }

    }

}

 // Afficher / Masquer le mot de passe
 
function setupPasswordToggle() {

    const toggle = document.getElementById("toggle-password");

    if (!toggle || !passwordInput) return;

    toggle.addEventListener("click", () => {

        const hidden = passwordInput.type === "password";

        passwordInput.type = hidden ? "text" : "password";

        toggle.setAttribute(

            "data-lucide",

            hidden ? "eye-off" : "eye"

        );

        if (window.lucide) {

            lucide.createIcons();

        }

    });

}

 // Messages
 
function showMessage(text, type = "error") {

    if (!messageBox) return;

    messageBox.classList.remove("hidden");

    messageBox.className =

        type === "success"

            ? "rounded-xl p-3 text-sm bg-green-100 border border-green-300 text-green-700"

            : "rounded-xl p-3 text-sm bg-red-100 border border-red-300 text-red-700";

    messageBox.textContent = text;

}

function hideMessage() {

    if (!messageBox) return;

    messageBox.classList.add("hidden");

}
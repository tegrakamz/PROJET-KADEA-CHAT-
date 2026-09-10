/**
 * ==========================================
 * Validation des formulaires
 * ==========================================
 */

/**
 * Vérifie si une adresse e-mail est valide.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

/**
 * Vérifie la robustesse du mot de passe.
 * Minimum :
 * - 8 caractères
 * - une lettre
 * - un chiffre
 *
 * @param {string} password
 * @returns {boolean}
 */
export function isStrongPassword(password) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    return regex.test(password);
}

/**
 * Validation du formulaire d'inscription.
 * @param {Object} data
 * @returns {string|null}
 */
export function validateRegister(data) {

    const fullName = data.fullName.trim();
    const email = data.email.trim();

    if (!fullName) {
        return "Veuillez saisir votre nom complet.";
    }

    if (fullName.length < 3) {
        return "Le nom doit contenir au moins 3 caractères.";
    }

    if (!email) {
        return "Veuillez saisir votre adresse e-mail.";
    }

    if (!isValidEmail(email)) {
        return "L'adresse e-mail n'est pas valide.";
    }

    if (!data.password) {
        return "Veuillez saisir un mot de passe.";
    }

    if (!isStrongPassword(data.password)) {
        return "Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.";
    }

    if (!data.confirmPassword) {
        return "Veuillez confirmer votre mot de passe.";
    }

    if (data.password !== data.confirmPassword) {
        return "Les deux mots de passe ne correspondent pas.";
    }

    return null;
}

/**
 * Validation du formulaire de connexion.
 * @param {Object} data
 * @returns {string|null}
 */
export function validateLogin(data) {

    const email = data.email.trim();

    if (!email) {
        return "Veuillez saisir votre adresse e-mail.";
    }

    if (!isValidEmail(email)) {
        return "L'adresse e-mail n'est pas valide.";
    }

    if (!data.password) {
        return "Veuillez saisir votre mot de passe.";
    }

    return null;
}
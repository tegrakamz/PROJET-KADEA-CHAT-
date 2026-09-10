// Validation des champs de formulaires (connexion, inscription, profil)

// Vérifie le format basique d'une adresse email
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

// Vérifie que le mot de passe fait au moins 8 caractères et contient au moins une lettre et un chiffre
export function isStrongPassword(password) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    return regex.test(password);
}

// Contrôle les données du formulaire d'inscription
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

// Contrôle les données du formulaire de connexion
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
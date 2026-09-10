// Tronquer un texte

export function truncate(text, maxLength = 30) {

    if (!text) {
        return "";
    }

    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength) + "...";

}

//Mettre la première lettre en majuscule
 
export function capitalize(text) {

    if (!text) {
        return "";
    }

    return text.charAt(0).toUpperCase() + text.slice(1);

}

// Attendre quelques millisecondes
 
export function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}
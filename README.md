# Kadea Chat — Prototype frontend

Prototype frontend d'une plateforme de messagerie développé pour **Kadea**, dans le cadre d'une mise en situation professionnelle chez **NovaWeb Studio**.

L'objectif est de valider l'expérience utilisateur et les principales fonctionnalités d'une messagerie (inscription, connexion, conversations, envoi de messages) avant d'investir dans un développement complet frontend/backend.

## Aperçu des fonctionnalités

- Inscription et connexion (JWT via l'API Kadea Chat)
- Déconnexion avec suppression de la session locale
- Page de profil (informations utilisateur, modification du mot de passe)
- Liste des conversations avec recherche
- Messagerie : affichage des messages envoyés/reçus, envoi de nouveaux messages
- Démarrage d'une nouvelle conversation à partir de la liste des utilisateurs du workspace
- Gestion des différents états de l'interface : chargement, liste vide, aucun résultat, erreurs réseau/serveur

### Fonctionnalités bonus incluses

- Mode sombre / clair (persisté dans le Local Storage)
- Suppression d'un message
- Sauvegarde de la dernière conversation ouverte
- Compteur de caractères lors de la saisie
- Rafraîchissement automatique des messages toutes les 5 secondes (pseudo temps réel)
- Prévention des doublons de conversation (réutilise une conversation privée existante avec un même contact)

## Technologies utilisées

- HTML5 / CSS3
- [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- JavaScript Vanilla (ES Modules, `fetch`, `async`/`await`)
- [Lucide Icons](https://lucide.dev/)
- API REST fournie par Kadea (`https://kadea-chat-api.onrender.com`)

Aucune bibliothèque JavaScript (React, Vue, Angular, jQuery...) n'est utilisée, conformément au cahier des charges.

## Architecture du projet

```
assets/
  css/                 Styles (Tailwind, généré/optionnel)
  icons/                Logo de l'application
  js/
    auth/                Connexion, inscription, déconnexion, protection des pages
    components/          Composants réutilisables (toasts de notification)
    config/               Configuration globale (URL API, clé workspace, constantes)
    pages/                 Contrôleurs de page (chat.js, profil.js)
    services/              Communication avec l'API (api.js, authService.js, conversationService.js, messageService.js)
    utils/                 Fonctions utilitaires (storage.js, validator.js, helpers.js)
index.html               Page de connexion
register.html             Page d'inscription
chat.html                  Page de messagerie
profil.html                 Page de profil utilisateur
```

## Installation et lancement en local

Ce projet ne nécessite aucune étape de build : Tailwind CSS est chargé directement via CDN.

1. Cloner le dépôt :
   ```bash
   git clone <url-du-depot>
   cd "PROJET KADEA-CHAT"
   ```
2. Ouvrir `index.html` dans un navigateur, ou servir le dossier avec un petit serveur local (recommandé pour que les modules ES fonctionnent correctement) :
   ```bash
   npx serve .
   # ou
   python3 -m http.server 5500
   ```
3. Ouvrir `http://localhost:5500` (ou le port indiqué) dans le navigateur.

## Lien de démonstration

_À compléter avec le lien de déploiement (Netlify / Vercel / GitHub Pages / Render)._

## Notes techniques

- L'API renvoie systématiquement une réponse au format `{ success, message, data }`. Toutes les fonctions de `services/` normalisent cette réponse.
- Le token JWT et les informations de l'utilisateur connecté sont stockés dans le Local Storage (`utils/storage.js`) et supprimés automatiquement en cas de déconnexion, d'expiration de session (401/403) ou de déconnexion manuelle.
- Le contenu des messages est systématiquement échappé avant insertion dans le DOM afin d'éviter les failles XSS.

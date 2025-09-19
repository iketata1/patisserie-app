# 🍰 Patisserie App

Application web complète de gestion de pâtisserie, intégrant un backend **Spring Boot**, un frontend **Angular**, et un microservice IA basé sur **FastAPI** pour les recommandations personnalisées.

## 🚀 Fonctionnalités

### 👩‍🍳 Côté client
- Création de compte, connexion sécurisée (**JWT**)
- Consultation du catalogue (CRUD : lire, filtrer, rechercher)
- Panier et gestion des commandes
- Notifications en temps réel (**WebSocket / STOMP**)
- Recommandations personnalisées (IA)

### 🛠️ Côté administrateur
- Gestion des produits (ajout, modification, suppression, mise à jour du stock)
- Suivi des commandes en temps réel
- Tableau de bord (ventes, produits populaires)
- Analyse des comportements clients

---

## 🧩 Stack technique

- **Backend** : Spring Boot, JPA/Hibernate, WebSocket, JWT
- **Frontend** : Angular 16, Angular Material
- **IA Service** : FastAPI, Sentence-Transformers, FAISS
- **Base de données** : MySQL
- **Infra & DevOps** : Docker, docker-compose, Nginx (reverse proxy)

---

## ⚙️ Architecture
Architecture logique
<img width="783" height="432" alt="image" src="https://github.com/user-attachments/assets/5401b3e0-87b4-43b2-bf1a-385e09a7e04f" />


export interface User {
  id?: number;
  username: string;
  password?: string; // Optionnel, ne pas envoyer au front après login
  email: string;
  nom?: string;
  prenom?: string;
  adresse?: string;
  telephone?: string;
  roles?: string[];
  token?: string; // Pour stocker le token si besoin
} 
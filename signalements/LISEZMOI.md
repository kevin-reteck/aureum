# Signalements

Le bouton insecte ouvre une fenêtre. Il n'y a qu'un bouton : Envoyer. La photo part avec le texte.

Tout le monde voit la même liste : d'abord ce dossier, puis les envois des dernières heures. Si l'envoi échoue, le signalement reste seulement sur l'appareil qui l'a écrit.

## Dans ce dossier

- `journal.json` — la liste, sans la photo dedans
- `<id>.jpg` — la photo
- `<id>.md` — le texte, l'endroit, et le compte

Un script les copie ici depuis le canal d'envoi. Les pièces jointes de ce canal ne restent que quelques heures : une fois le fichier là, il reste.

## Pour les lire

Ouvrir `journal.json`, puis la photo et le texte du même identifiant.

## Déjà traité

`Statut : Traité` dans le fichier, ou `"traite": true` dans `journal.json`, veut dire que le correctif est déjà dans le cabinet. On ne le refait pas. Dans l'application, la ligne est barrée et porte la mention Traité. `Statut : Ouvert` est encore à faire.

---
title: "Outil Capture Windows 11 : Le raccourci Win+Shift+S ne fonctionne plus ?"
description: "Guide expert pour réparer le raccourci Win+Shift+S de l'Outil Capture d'écran sur Windows 11 après un changement de poste ou de dock."
publishDate: 2026-10-25T03:20:00.000Z
image: '/images/tech-photo/ram%20(18).png'
category: 'tech'
tags: ["Windows 11", "Dépannage PC", "Support IT", "Raccourci Clavier"]
theme: "Warm Coffee Latte"
---

## 1. [Opening Story/Problem]

C'était un mardi matin bien chargé dans notre tour à La Défense. Avec le système de smart office et les bureaux en libre-service, je venais de m'installer à un nouvel emplacement pour la journée. J'avais soigneusement branché mon nouveau dock USB-C, relié mes deux écrans externes, et j'étais prêt à attaquer mes revues de code et mes rapports graphiques. 

Puis, le drame : un collègue m'envoie un message urgent sur Teams me demandant une capture d'écran immédiate d'un bug bloquant. Par réflexe, je tape le fameux <strong>Win + Shift + S</strong> que j'utilise des dizaines de fois par jour. Rien. Pas un sursaut, pas d'assombrissement de l'écran, pas de notification. L'Outil Capture d'écran (<strong>Snipping Tool</strong>) semblait tout simplement mort. Dans la précipitation, j'ai essayé de le chercher via le menu Démarrer, mais même cliqué manuellement, l'application tournait en boucle ou refusait de s'ouvrir. Entre le changement de configuration des moniteurs et ce fichu raccourci qui ne répondait plus, la matinée commençait sous tension. Heureusement, en tant que technicien support, je savais exactement par où commencer pour régler ce problème agaçant.

<div style="border-left: 4px solid #78350f; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>Note du technicien :</strong> Ne paniquez jamais face à un raccourci récalcitrant après un changement de matériel. Souvent, il s'agit simplement d'un processus en arrière-plan bloqué ou d'un conflit de mise à l'échelle d'affichage lié aux nouveaux moniteurs connectés au dock.
</div>



![Tech Troubleshooting Guide](/images/tech-photo/tech-photos%20(30).jpg)

## 2. [Root Cause Breakdown]

Pourquoi ce raccourci magique nous lâche-t-il soudainement, surtout lors du passage à un bureau flexible ou multi-écrans ? Après avoir analysé des dizaines de cas similaires sur les parcs Windows 11 de l'entreprise, voici les trois coupables les plus fréquents :

- <strong>Le processus de l'application est planté ou suspendu :</strong> Parfois, l'exécutable de l'Outil Capture d'écran reste bloqué en arrière-plan à la suite d'une mauvaise déconnexion précédente, empêchant toute nouvelle instance de se lancer.
- <strong>Le cache de l'application ou les notifications bloquées :</strong> Windows 11 gère les captures via le centre de notification. Si les notifications pour l'Outil Capture d'écran sont désactivées ou si le cache est corrompu, le raccourci ne renvoie aucun résultat visuel.
- <strong>Conflit de résolution ou de pilote graphique avec le dock :</strong> Le passage d'un écran de laptop unique à une configuration en double moniteur via une station d'accueil peut perturber l'affichage initial de la superposition de capture.

## 3. [Step-by-Step Resolution]

Voici la méthode infaillible, étape par étape, pour redonner vie à votre raccourci. Nous allons procéder par ordre, du plus simple au plus radical.

### Étape 1 : Forcer l'arrêt via le Gestionnaire des tâches
Si l'application est simplement gelée en arrière-plan, il faut nettoyer la table.

1. Faites un clic droit sur le menu Démarrer et ouvrez le <strong>Gestionnaire des tâches</strong>.

2. Dans l'onglet *Processus*, faites défiler vers le bas pour chercher <strong>Outil Capture d'écran</strong> ou <strong>SnippingTool.exe</strong>.

3. Faites un clic droit dessus et sélectionnez <strong>Fin de tâche</strong>.

4. Testez à nouveau le raccourci <strong>Win + Shift + S</strong>.

### Étape 2 : Réinitialiser et réparer l'application dans les Paramètres
Si le processus n'était pas en cause, l'application a besoin d'un petit rafraîchissement logiciel.

1. Ouvrez les <strong>Paramètres</strong> de Windows 11 (raccourci <strong>Win + I</strong>).

2. Allez dans <strong>Applications</strong>, puis cliquez sur <strong>Applications installées</strong>.

3. Tapez "Capture" dans la barre de recherche pour trouver <strong>Outil Capture d'écran</strong>.

4. Cliquez sur les trois petits points à droite, puis sur <strong>Options avancées</strong>.

5. Faites défiler vers le bas, cliquez d'abord sur <strong>Réparer</strong>. Si cela ne suffit pas, cliquez sur <strong>Réinitialiser</strong> (cela effacera les données corrompues de l'appli).

### Étape 3 : Vérifier l'autorisation des notifications
L'Outil Capture d'écran a besoin d'afficher des bannières de notification pour vous prévenir que l'image est copiée.

1. Dans les <strong>Paramètres</strong>, allez dans <strong>Système</strong> puis <strong>Notifications</strong>.

2. Assurez-vous que les notifications globales sont activées.

3. Descendez la liste pour trouver <strong>Outil Capture d'écran</strong> et vérifiez que le commutateur est bien sur <strong>Activé</strong>.

### Étape 4 : Réenregistrer l'application via PowerShell (Cas extrêmes)
Si rien n'y fait, nous allons réinstaller proprement le package système.

1. Ouvrez le menu Démarrer, tapez <strong>PowerShell</strong>, faites un clic droit et choisissez <strong>Exécuter en tant d'administrateur</strong>.

2. Copiez et collez la commande suivante dans la fenêtre, puis appuyez sur Entrée :

```powershell
Get-AppxPackage *ScreenSketch* -AllUsers | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register "(_.InstallLocation)\AppXManifest.xml"}
```

3. Redémarrez votre PC pour valider les changements.

## 4. [Expert Advice]

En environnement de bureau partagé ou en télétravail, les stations d'accueil USB-C et Thunderbolt jouent un rôle crucial. Lorsque vous connectez votre PC à des moniteurs externes pour la première fois de la journée, donnez à Windows quelques secondes pour stabiliser la fréquence d'affichage et la disposition des écrans avant d'enchaîner les raccourcis clavier complexes. 

De plus, méfiez-vous des logiciels tiers de capture d'écran (comme Greenshot, Snagit ou ShareX) que vous auriez pu installer : ils monopolisent parfois les mêmes touches de raccourci, créant un conflit direct avec l'outil natif de Windows 11.

## 5. Frequently Asked Questions

Q: Le raccourci fonctionne mais l'écran ne s'assombrit pas, que faire ?

A: Ce problème est souvent lié aux paramètres d'affichage de votre nouveau dock. Allez dans les <strong>Paramètres</strong> > <strong>Système</strong> > <strong>Écran</strong> et vérifiez que l'échelle d'affichage est bien réglée sur les valeurs recommandées (souvent 100% ou 125%) pour tous vos moniteurs.

Q: Puis-je modifier le raccourci Win + Shift + S pour utiliser une autre touche ?

A: Oui, tout à fait. Vous pouvez configurer la touche Impression écran (PrtScn) pour lancer l'Outil Capture d'écran. Allez dans <strong>Paramètres</strong> > <strong>Accessibilité</strong> > <strong>Clavier</strong> et activez l'option "Utiliser le bouton Impression écran pour ouvrir la capture d'écran".

Q: Pourquoi mes captures d'écran ne s'enregistrent-elles plus automatiquement dans le dossier Images ?

A: Vérifiez les paramètres internes de l'application. Ouvrez l'<strong>Outil Capture d'écran</strong> manuellement, cliquez sur les trois points en haut à droite pour aller dans les <strong>Paramètres</strong>, et assurez-vous que l'option "Enregistrer automatiquement les captures d'écran" est bien activée.

/**
 * POUR AJOUTER UN ARTICLE :
 * 1. Copiez le bloc ci-dessous
 * 2. Collez-le au début du tableau 'blogPosts'
 * 3. Remplissez les champs
 *
 * {
 *   id: 'unique-id',
 *   slug: 'titre-de-l-article-pour-l-url',
 *   title: 'Votre Titre Accrocheur',
 *   excerpt: 'Un court résumé de 2 lignes pour la carte...',
 *   content: `
 *     <h2>Sous-titre</h2>
 *     <p>Votre paragraphe...</p>
 *   `,
 *   image: '/assets/votre_image.jpg',
 *   category: 'Catégorie',
 *   author: 'L\'équipe Yondly',
 *   date: 'JJ MMM AAAA',
 *   readTime: 'X min',
 *   keywords: 'mot1, mot2, mot3'
 * },
 */

export const blogPosts = [
  {
    id: '1',
    slug: '5-astuces-anti-gaspi-maison',
    title: '5 astuces simples pour réduire le gaspillage à la maison (et économiser)',
    excerpt: 'On jette encore trop de nourriture. Découvrez nos 5 méthodes infaillibles pour sauver vos aliments, réduire votre budget courses et préserver la planète, directement depuis votre cuisine.',
    content: `
      <p class="lead">Le gaspillage alimentaire n'est pas une fatalité. En France, chaque foyer jette en moyenne <strong>30kg de nourriture par an</strong>, dont 7kg encore emballés. Au-delà de l'impact écologique désastreux, c'est une perte sèche pour votre pouvoir d'achat (environ 150€/an/personne). Heureusement, adopter quelques réflexes simples peut tout changer.</p>

      <h2>1. Planifiez vos repas (le secret des pros)</h2>
      <p>Cela paraît évident, mais c'est le levier n°1. Combien de fois avez-vous acheté des courgettes "au cas où" pour les retrouver flétries deux semaines plus tard ?</p>
      <ul>
        <li><strong>Faites l'inventaire</strong> : Avant de partir faire vos courses, regardez ce qu'il reste dans vos placards et votre frigo.</li>
        <li><strong>Le Batch Cooking</strong> : Cuisinez 2h le dimanche pour toute la semaine. Vous gérez les quantités au gramme près et plus rien ne traîne.</li>
        <li><strong>La liste de courses inversée</strong> : Notez ce que vous avez déjà et trouvez des recettes pour les utiliser avant d'acheter du neuf.</li>
      </ul>

      <h2>2. Adoptez le "Lundi Vert" (ou journée Restes)</h2>
      <p>Instituez un jour par semaine où l'on cuisine exclusivement "les restes". C'est un défi créatif stimulant !</p>
      <p>Une quiche fourre-tout accepte volontiers ce reste de jambon, ce morceau de fromage sec et ces légumes un peu mous. Une soupe improvisée sauve les carottes flétries. Le pain rassis ? Il devient du pain perdu, des croûtons pour la salade ou de la chapelure maison. Rien ne se perd, tout se transforme.</p>

      <h2>3. Maîtrisez l'art du rangement (FIFO)</h2>
      <p>Les supermarchés utilisent la méthode <strong>FIFO (First In, First Out)</strong>. Faites pareil chez vous !</p>
      <h3>La zone froide n'est pas partout pareille</h3>
      <p>Sachez où ranger vos aliments : la viande et le poisson dans la zone la plus froide (souvent en bas), les laitages au milieu, les légumes dans le bac dédié. Mettez toujours les produits à la Date Limite de Consommation (DLC) la plus courte <strong>devant</strong>.</p>

      <h2>4. La congélation est votre meilleure amie</h2>
      <p>Le congélateur est un outil anti-gaspi sous-estimé. Saviez-vous que vous pouvez congeler bien plus que des plats préparés ?</p>
      <ul>
        <li><strong>Le fromage râpé</strong> : Il se congèle très bien et ne s'agglomère pas.</li>
        <li><strong>Les blancs d'œufs</strong> : Il vous reste des blancs après une mayo ? Hop, au congélo pour une future meringue.</li>
        <li><strong>Les herbes fraîches</strong> : Ciselez-les et congelez-les dans un bac à glaçons avec un peu d'huile d'olive.</li>
      </ul>
      <p>Astuce : Notez toujours la date et le contenu sur le sac congélation. Un "ragout mystère" de 2021 n'est jamais très appétissant.</p>

      <h2>5. Utilisez Yondly pour donner ce que vous ne mangerez pas</h2>
      <p>Malgré tous vos efforts, il vous reste 3kg de prunes du jardin ? Vous partez en vacances et votre frigo est plein ?</p>
      <p>Ne jetez pas. C'est là que <strong>Yondly</strong> intervient. En postant une annonce "Don Alimentaire" géolocalisée :</p>
      <ol>
        <li>Vous faites un heureux (un étudiant, un voisin, une famille).</li>
        <li>Vous créez du lien social dans votre quartier.</li>
        <li>Vous réduisez concrètement votre empreinte carbone.</li>
      </ol>
      <p>Le don alimentaire entre particuliers est la clé d'une consommation plus responsable et humaine. Rejoignez le mouvement !</p>
    `,
    image: '/assets/blog_antigaspi.png',
    category: 'Astuces',
    author: 'L\'équipe Yondly',
    date: '12 Jan 2026',
    readTime: '6 min',
    keywords: 'anti-gaspi, gaspillage alimentaire, économies, batch cooking, conservation, yondly'
  },
  {
    id: '2',
    slug: 'pourquoi-acheter-local-voisins',
    title: 'Pourquoi acheter à ses voisins change tout (Écologie, Lien Social, Économies)',
    excerpt: 'L\'économie circulaire n\'est pas qu\'un concept à la mode, c\'est une révolution locale. Découvrez pourquoi privilégier ses voisins aux géants du e-commerce est le choix le plus impactant que vous puissiez faire.',
    content: `
      <p class="lead">Dans un monde hyper-connecté où l'on peut se faire livrer un câble USB depuis l'autre bout du monde en 24h, une tendance inverse émerge : le <strong>retour au local</strong>. Acheter, vendre ou louer à ses voisins, ce n'est pas un retour en arrière, c'est l'avenir d'une consommation intelligente.</p>

      <h2>1. Le lien social : Remettre de l'humain dans l'échange</h2>
      <p>Acheter une perceuse ou un vélo à son voisin, ce n'est pas juste une transaction financière. C'est une rencontre.</p>
      <ul>
        <li>On discute du quartier.</li>
        <li>On échange des conseils sur l'utilisation de l'objet.</li>
        <li>On découvre les gens qui vivent à 50 mètres de chez nous et qu'on n'avait jamais croisés.</li>
      </ul>
      <p>Ces "micro-interactions" tissent la toile de confiance d'un quartier. Dans des villes parfois anonymes, Yondly agit comme un brise-glace social.</p>

      <h2>2. L'impact écologique immédiat (Le vrai Circuit Court)</h2>
      <p>Quand vous commandez en ligne, même "made in France", il y a du transport, du carton, du plastique de calage, et le dernier kilomètre (le plus polluant).</p>
      <h3>Zéro Carbone, Zéro Déchet</h3>
      <p>L'échange entre voisins, c'est le <strong>degré zéro de la pollution logistique</strong>. L'objet passe de la main à la main. Pas d'emballage, pas de camionnette de livraison qui bloque la rue. C'est l'objet qui existe déjà, là, tout près. Si chaque quartier optimisait ses ressources existantes, l'impact sur les émissions de CO2 serait colossal.</p>

      <h2>3. Soutenir le pouvoir d'achat local</h2>
      <p>L'inflation nous touche tous. L'économie circulaire locale est une réponse directe :</p>
      <ul>
        <li><strong>Pour le vendeur</strong> : C'est de l'argent qui dormait dans un placard. Vendre vos objets inutilisés met du "beurre dans les épinards".</li>
        <li><strong>Pour l'acheteur</strong> : S'équiper en seconde main coûte 50% à 80% moins cher que le neuf.</li>
        <li><strong>Pour l'économie locale</strong> : L'argent circule au sein de la communauté. Il ne part pas dans les paradis fiscaux de multinationales lointaines.</li>
      </ul>

      <h2>4. La location : La fin de la possession inutile ?</h2>
      <p>Pourquoi acheter une perceuse à 150€ pour l'utiliser 12 minutes par an (moyenne nationale) ?</p>
      <p>Avec Yondly, la <strong>location d'objets entre voisins</strong> prend tout son sens. Louez cette perceuse 5€ à votre voisin de palier. Vous économisez 145€, vous gagnez de la place chez vous, et votre voisin rentabilise son matériel. C'est le bon sens paysan appliqué à la ville moderne.</p>

      <h2>Comment s'y mettre dès aujourd'hui ?</h2>
      <p>Commencez petit. Regardez autour de vous. Ce livre que vous avez lu et adoré ? Ce mixeur reçu en double ? Prenez une photo. Mettez-les sur Yondly. Vous serez surpris de la rapidité avec laquelle ça part, et du sourire de la personne qui viendra le chercher.</p>
    `,
    image: '/assets/blog_local.png',
    category: 'Société',
    author: 'L\'équipe Yondly',
    date: '10 Jan 2026',
    readTime: '5 min',
    keywords: 'consommation locale, économie circulaire, voisins, lien social, écologie, seconde main'
  },
  {
    id: '3',
    slug: 'lancement-beta-yondly',
    title: 'Bienvenue sur la Bêta de Yondly : Construisons ensemble l\'app de demain',
    excerpt: 'Après des mois de développement passionné, nous ouvrons enfin les portes. Découvrez notre vision, nos fonctionnalités, et comment vous pouvez nous aider à façonner l\'avenir de l\'entraide locale.',
    content: `
      <p class="lead">C'est un grand jour pour toute l'équipe (et on l'espère, pour votre quartier). La version Bêta de <strong>Yondly</strong> est officiellement lancée ! Mais qu'est-ce que ça veut dire, et pourquoi avons-nous besoin de vous ?</p>

      <h2>Une idée née d'un triple constat</h2>
      <p>Nous avons créé Yondly en observant trois absurdités du quotidien :</p>
      <ol>
        <li>Nous avons tous des objets qui dorment et prennent la poussière.</li>
        <li>Nous jetons de la nourriture alors que d'autres en ont besoin.</li>
        <li>Nous connaissons souvent mieux nos followers Instagram que nos voisins de palier.</li>
      </ol>
      <p>Yondly est notre tentative de réponse : une super-app locale pour <strong>Tout échanger, tout partager, tout simplement.</strong></p>

      <h2>Ce que vous pouvez faire dès maintenant</h2>
      <p>L'application est 100% fonctionnelle sur les fonctionnalités clés :</p>
      <h3>🥕 Le Don Alimentaire</h3>
      <p>C'est le cœur de notre mission solidaire. Postez vos surplus (fruits, légumes, épicerie). C'est gratuit, rapide, et sécurisé.</p>
      <h3>📦 La Vente d'Objets</h3>
      <p>Vêtements, high-tech, déco... Videz vos placards et faites des heureux près de chez vous. Le paiement est intégré et sécurisé.</p>
      <h3>🤝 La Location (Bientôt)</h3>
      <p>Nous finalisons le module de location pour vous permettre de prêter vos outils et équipements en toute sérénité (avec caution et assurance).</p>

      <h2>Pourquoi une "Bêta" ?</h2>
      <p>Parce que nous sommes humbles. Tout n'est pas encore parfait.</p>
      <ul>
        <li>Il y aura peut-être quelques bugs visuels.</li>
        <li>Il manquera peut-être cette fonctionnalité dont vous rêvez.</li>
        <li>L'ergonomie peut encore être améliorée.</li>
      </ul>
      <p>C'est là que <strong>vous</strong> intervenez. Nous ne construisons pas cette app pour nous, mais pour vous.</p>

      <h2>Votre mission, si vous l'acceptez</h2>
      <p>Utilisez l'app. Testez-la. Poussez-la dans ses retranchements.</p>
      <p>Si vous trouvez un bug, dites-le nous. Si vous avez une idée de génie ("Et si on pouvait créer des groupes par immeuble ?"), écrivez-nous. Nous lisons chaque message, chaque suggestion.</p>

      <h2>Rejoignez les Pionniers</h2>
      <p>Les premiers utilisateurs d'une plateforme définissent sa culture. En nous rejoignant aujourd'hui, vous posez les bases d'une communauté bienveillante, locale et responsable. Parlez-en à vos voisins, à vos amis, à vos commerçants.</p>
      <p>Bienvenue dans l'aventure Yondly. 🚀</p>
    `,
    image: '/assets/blog_launch.png',
    category: 'Yondly News',
    author: 'L\'équipe Yondly',
    date: '01 Jan 2026',
    readTime: '3 min',
    keywords: 'yondly, startup, lancement produit, beta test, application mobile, tech for good'
  }
];

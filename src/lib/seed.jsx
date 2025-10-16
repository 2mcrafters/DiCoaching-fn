export const initialUsers = [
  {
    id: "admin1",
    name: "Alice Admin",
    email: "admin@example.com",
    password: "password",
    role: "admin",
    status: "active",
    createdAt: "2023-10-01T10:00:00Z",
    professionalStatus: "Manager",
    profilePicture: "https://i.pravatar.cc/150?u=admin1",
    sex: "femme",
    phone: "0102030405",
    biography:
      "Administratrice principale du Dictionnaire Collaboratif du Coaching.",
    socials: [],
  },
  {
    id: "auteur1",
    name: "Benoît Auteur",
    email: "auteur@example.com",
    password: "password",
    role: "author",
    status: "active",
    createdAt: "2023-10-05T11:00:00Z",
    professionalStatus: "Coach / Formateur",
    profilePicture: "https://i.pravatar.cc/150?u=auteur1",
    sex: "homme",
    phone: "0601020304",
    biography:
      "Coach certifié avec 10 ans d'expérience dans le leadership et le développement personnel.",
    socials: [
      {
        network: "LinkedIn",
        url: "https://linkedin.com/in/benoit-auteur",
        customNetwork: "",
      },
      { network: "X", url: "https://x.com/benoit_auteur", customNetwork: "" },
    ],
    documents: [],
  },
  {
    id: "auteur2",
    name: "Chloé Contributrice",
    email: "chloe@example.com",
    password: "password",
    role: "author",
    status: "active",
    createdAt: "2023-10-08T14:30:00Z",
    professionalStatus: "Chercheur",
    profilePicture: "https://i.pravatar.cc/150?u=auteur2",
    sex: "femme",
    phone: "0605060708",
    biography:
      "Chercheuse en psychologie cognitive, passionnée par les neurosciences appliquées au coaching.",
    socials: [
      {
        network: "LinkedIn",
        url: "https://linkedin.com/in/chloe-contributrice",
        customNetwork: "",
      },
    ],
    documents: [],
  },
  {
    id: "auteur3_pending",
    name: "David Demandeur",
    email: "david@example.com",
    password: "password",
    role: "author",
    status: "pending",
    createdAt: "2023-11-01T09:00:00Z",
    professionalStatus: "Professionnel RH",
    profilePicture: "https://i.pravatar.cc/150?u=auteur3",
    sex: "homme",
    phone: "0609101112",
    biography: "Responsable RH en quête de nouvelles approches de management.",
    socials: [],
    documents: [],
  },
  {
    id: "chercheur1",
    name: "Émilie Étudiante",
    email: "researcher@example.com",
    password: "password",
    role: "researcher",
    status: "active",
    createdAt: "2023-10-15T16:00:00Z",
    professionalStatus: "Étudiant",
    profilePicture: "https://i.pravatar.cc/150?u=chercheur1",
    sex: "femme",
    phone: "0701020304",
    biography: "",
    socials: [],
  },
];

export const initialTerms = [
  {
    "id": "term1",
    "title": "Roue de la vie",
    "slug": "roue-de-la-vie",
    "category": "Coaching",
    "shortDefinition": "Un outil visuel utilisé en coaching pour évaluer le niveau de satisfaction dans différents domaines de la vie d'une personne.",
    "fullDefinition": "La **Roue de la Vie** est un exercice de coaching puissant et un outil qui aide à visualiser et évaluer l'équilibre actuel de votre vie. Elle est généralement divisée en 8 à 12 catégories, représentant les aspects importants de la vie tels que la carrière, les finances, la santé, les relations, le développement personnel, etc.\n\nLe client note son niveau de satisfaction pour chaque domaine sur une échelle de 1 à 10. Le résultat forme une 'toile' qui met en évidence les domaines de vie équilibrés et ceux qui nécessitent plus d'attention.",
    "examples": [
      "Un coach pourrait utiliser la Roue de la Vie lors de la première séance pour aider un client à clarifier ses objectifs.",
      "Après avoir complété sa Roue de la Vie, une cliente réalise que le domaine 'Loisirs et Plaisir' est très peu noté et décide d'y consacrer plus de temps."
    ],
    "resources": [
      { "title": "Article détaillé sur la Roue de la Vie", "url": "https://www.verywellmind.com/the-wheel-of-life-a-self-assessment-tool-4137333" }
    ],
    "moderatorComment": "",
    "status": "published",
    "authorId": "auteur1",
    "createdAt": "2023-10-10T10:00:00Z",
    "updatedAt": "2023-10-10T10:00:00Z"
  },
  {
    "id": "term2",
    "title": "Écoute active",
    "slug": "ecoute-active",
    "category": "Coaching",
    "shortDefinition": "Une technique de communication qui consiste à se concentrer pleinement sur ce que l'interlocuteur dit, à le comprendre, y répondre et s'en souvenir.",
    "fullDefinition": "L'**écoute active** est une compétence fondamentale en coaching. Elle va au-delà de la simple audition des mots. Elle implique :\n\n- Une attention totale\n- La reformulation pour assurer la compréhension\n- Le questionnement pour approfondir\n- La reconnaissance des émotions et du non-verbal\n\nCette pratique crée un espace de confiance et permet au coaché de s'explorer en profondeur.",
    "examples": [
      "Le coach reformule : 'Si je comprends bien, vous ressentez de la frustration car vos efforts ne sont pas reconnus.'",
      "Au lieu de préparer sa prochaine question, le coach reste silencieux pour laisser le client développer sa pensée."
    ],
    "resources": [],
    "moderatorComment": "Terme fondamental, à valider rapidement.",
    "status": "review",
    "authorId": "auteur2",
    "createdAt": "2023-10-12T15:00:00Z",
    "updatedAt": "2023-10-12T15:00:00Z"
  },
  {
    "id": "term3",
    "title": "Modèle GROW",
    "slug": "modele-grow",
    "category": "Coaching",
    "shortDefinition": "Un acronyme (Goal, Reality, Options, Will) qui structure une séance de coaching pour la résolution de problèmes et la définition d'objectifs.",
    "fullDefinition": "Le modèle GROW est un cadre simple et puissant pour les conversations de coaching. Il a été développé par Sir John Whitmore et ses collègues.\n\n- **G**oal (Objectif) : Que voulez-vous atteindre ?\n- **R**eality (Réalité) : Quelle est la situation actuelle ?\n- **O**ptions (Options) : Quelles sont les possibilités ?\n- **W**ill (Volonté/Engagement) : Que ferez-vous ?",
    "examples": [],
    "resources": [],
    "moderatorComment": "",
    "status": "draft",
    "authorId": "auteur1",
    "createdAt": "2023-11-02T18:00:00Z",
    "updatedAt": "2023-11-02T18:00:00Z"
  }
];
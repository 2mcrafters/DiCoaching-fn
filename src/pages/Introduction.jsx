import React from "react";

/**
 * Intro stylisée + Sommaire (gauche) + Features (sous Sommaire)
 * - Pur Tailwind
 * - Table des matières + cartes fonctionnalités (icône + texte)
 */

const quote = `« Tout individu a la capacité latente, sinon manifeste, de se comprendre lui-même et d'entrer en contact avec ses ressources pour solutionner ses problèmes, réorganiser sa vie, reprendre contact avec ses valeurs et son identité intégrée, définir et réaliser son projet de vie. »`;
const quoteAuthor =
  "B. Hévin & J. Turner, Pratique du coaching, InterEditions, 2006.";


const sections = [
  {
    id: "pourquoi",
    title: "Pourquoi ce dictionnaire ?",
    paras: [
      `Comment traduire en actes cette "déclaration de foi" du coaching, croyance qui, à mon avis, est à la base du coaching ? Comment ce nouvel art qu’est le coaching peut-il affirmer son originalité dans le monde de l’accompagnement, tout en utilisant les mêmes ingrédients et surtout les mêmes mots pour "se" dire, que ceux utilisés par les différentes branches des sciences humaines ?`,
      `À l'instar des autres arts, le coaching a ses techniques, ses processus et ses tours de main, le tout baignant dans des concepts et ayant pour toile de fond une philosophie et des croyances de plus en plus affirmés, mais aux contours pas toujours délimités.`,
    ],
  },
  {
    id: "richesse-des-mots",
    title: "La richesse des mots",
    paras: [
      `D’où la nécessité de recenser les concepts et les mots pour les dire, les définir, les relier, les confronter, en donner des exemples… pour mieux les maîtriser.`,
      `Mais… les mots, les verbes, les expressions ne sont-ils pas (par essence ?) "mutilateurs", car polysémiques ? Comme le dit Alain Cardon : « lorsque les mots traduisent une pensée ou une émotion, ils ne lui sont que rarement fidèles. »`,
      `Et c’est la prise en compte de cette fidélité/infidélité qui m’a poussé à entreprendre le présent travail, fait d’éclectisme, d’approches et de définitions parfois contradictoires et quelquefois complémentaires. Je m’explique :`,
    ],
  },
  {
    id: "metier-et-influences",
    title: "Un métier, des influences",
    paras: [
      `Le jeune métier de coach, à la croisée d’écoles psychosociologiques et autres pensées philosophiques, humanistes, etc., aussi différentes (et semblables ?) les unes que les autres, est devenu un métier à part entière, avec ses repères déontologiques, conceptuels, techniques et opérationnels, avec ses mots, son jargon, ses concepts et ses définitions propres.`,
      `Ces écoles et leur langage ont profondément inspiré, voire façonné, le coaching. D’où le besoin de collecter les mots "qui disent le coaching" et de rappeler quelques philosophies et démarches sous-jacentes.`,
    ],
  },
  {
    id: "demarche-eclectique",
    title: "Une démarche éclectique",
    paras: [
      `Ma prétention ici n’est nullement l’exhaustivité, car cela dépasserait mes capacités et mon propos, alors que la seule "expertise" dont je peux me prévaloir est celle d’un manager curieux et d'un coach de dirigeants toujours en quête de savoir, qui d’abord a voulu préserver son "écologie" en réunissant dans un même "lieu" des mots et des concepts souvent lus, entendus, voire vécus, sans toujours les situer, les peser ni les comprendre, pour, par la suite, les partager.`,
      `À quoi obéit donc mon "choix des mots" ? Tout simplement à ma soif de connaître et de comprendre… Et pour ce faire je me suis inspiré de certains "maîtres", ou que je considère comme tels, en coaching, en psychologie humaniste et en thérapie brève, en management, en sociologie et en anthropologie...`,
    ],
  },
  {
    id: "dico-global",
    title: "Un dictionnaire global",
    paras: [
      `Dans ce cadre, j’ai accordé une importance particulière (et subjective) à certains référentiels. Par exemple : l’Analyse Transactionnelle (AT), la Programmation Neuro-Linguistique (PNL), la Théorie Organisationnelle de Berne (TOB), la Gestalt (G), la Systémique (S), l’Anthropologie (A), le Management, etc. Les termes empruntés à ces approches constituent le tiers de la terminologie de ce travail.`,
      `Étant fermement convaincu que la sociologie et l’anthropologie, en intégrant la culture dans leur démarche, sont d’un grand apport dans cette nouvelle approche "globale" qu’est le coaching, je me suis aussi inspiré de certains travaux plus locaux, dont ceux du regretté Paul Pascon (voir la richesse du concept opérationnel de "société composite"), mais aussi de la culture organisationnelle et populaire marocaine.`,
    ],
  },
  {
    id: "culture-et-metaphores",
    title: "Culture, métaphores et coaching",
    paras: [
      `En effet, les acteurs sociaux (coach, coaché, équipe, structure, etc.) ne baignent-ils pas dans la "sauce culturelle" (métaphores, langues, mythes…), d’essence anthropologique, dans laquelle se concoctent les paradigmes, les représentations, les attitudes, donc les comportements…, domaines où le coach puise, interprète, questionne… ?`,
      `Comment pourrions-nous appréhender autrement les métaphores, utilisées par exemple lors d'un coaching, en faisant abstraction du fonds culturel ? D’où mon clin d’œil au Clean Coaching (Coaching Propre) avec David Grove, au Coaching Ontologique latino-américain…`,
    ],
  },
  {
    id: "forme-et-intitule",
    title: "Forme, intitulé et originalité",
    paras: [
      `Quelle forme donner à ce vade-mecum ? Et d'abord, comment l'intituler ou, en langage de coach, comment le "nommer", le "verbaliser" ? Tout simplement "Dictionnaire" où, au-delà des définitions "classiques" apparentées au coaching, je citerai des définitions plus spécifiques au "jargon" qui lui est propre. Définitions qui prendraient plus ou moins d'espace, en fonction de la richesse du concept dans le dispositif intellectuel du ou des auteurs consultés, ou de l'intérêt tout subjectif que ce concept m’inspire.`,
      `Et pourquoi Dictionnaire du Coach Global ? Parce que c'est le Coach qui, par sa posture, porte le coaching, qui intègre des approches, qui les déconstruit et reconstruit. Et Global, non seulement dans le sens d'un "global thinking", mais également (et surtout) dans celui d'un coaching intégré, intégratif, intégrateur, voire intégral, donc éclectique.`,
      `En effet, qu'est-ce que le coaching sinon une philosophie pratique qui vise l'accompagnement de l'humain dans sa complexité et qui, pour ce faire, doit recourir à tous les enseignements des sciences humaines, comme levier, dans un sens dynamique, complémentaire et intégratif, transversal, donc global, afin que le coach puisse, comme dirait Wilber, englober/dépasser. C'est la tendance observée actuellement malgré la grande diversité des écoles de coaching. Et ce sont ces idées que, modestement, j'ai essayé de souligner par le biais de ce travail. Une part de ma philosophie "intégrale" y transparaîtra-t-elle ? Probablement.`,
    ],
  },
  {
    id: "public",
    title: "À qui s’adresse ce dictionnaire ?",
    paras: [
      `Aux coachs en général, particulièrement aux coachs du monde des organisations, aux managers, bien sûr, mais aussi aux autres professionnels de l’accompagnement : formateurs, enseignants, pédagogues, consultants (en RH ou en organisation), auditeurs (financiers, sociaux…), voire à des intellectuels, des ethnologues, des chercheurs, des psychologues, à des curieux du savoir et de la "chose humaine"…`,
    ],
  },
  {
    id: "methodologie",
    title: "Méthodologie et inspiration",
    paras: [
      `Ma démarche et mon souci méthodologique ? La multidisciplinarité, l'interculturalité, la transversalité et la didactique, en relation avec le monde de l'entreprise et des organisations, celui des managers, monde complexe par essence, tout en gardant à l’esprit que le coaching est un compendium éclectique de tout ce qui touche à l’humain, à son fonctionnement, à ses relations…, car l'humain est un tout complexe, indivisible et imprévisible.`,
      `Dans ce sens, et en m’inspirant de certains dictionnaires (dont celui d’Alain Cardon et d'autres figurant pour la plupart dans la bibliographie), j’ai établi des liens entre différents mots et concepts de coaching et autres termes associés (j’ai "flirté" avec plus 1100 termes). Mon souci était double : la complémentarité des notions et leur polysémie, naturellement sans prétendre à l’exhaustivité, et sans craindre certaines redondances, voire contradictions. À chaque lecteur, donc, de placer les mots/concepts dans leur (s) contexte (s) et à chacun(e) d'en faire sa (ses) propre (s) lecture (s).`,
    ],
  },
  {
    id: "sources-remerciements",
    title: "Sources, remerciements & responsabilité",
    paras: [
      `Mon mérite dans cette compilation ? Avoir ouvert quelques livres de coaching, de psychologie, d’anthropologie ; des dictionnaires (management, psychosociologie, sociologie, coaching), ainsi que de nombreuses pages d’Internet (dont Wikipédia) ; mes notes lors de ma formation en coaching, en Analyse Transactionnelle et en PNL, mes fiches de lecture... Le tout en ayant toujours en ligne de mire le coaching dans sa diversité/unité et comme toile de fond le monde des organisations, le social, le travail, la dynamique de groupe, le leadership, l’individu…, ce tout inscrit dans une vision personnelle globale faisant sens, celle d'un projet de vie ou de fin de carrière, après 38 ans de ma vie passée en entreprise !`,
      `Ensuite j’ai utilisé ces succédanés virtuels des ciseaux et des pots de colle, et j’ai copié, adapté et collé à tour de bras des mots, des concepts, des paragraphes, des textes entiers… Ensuite, il a fallu réécrire, paraphraser, résumer, relier, commenter, donner des exemples lus ou vécus…`,
      `Mais quid de ma responsabilité pour ce qui est du contenu ou des erreurs, discordances, dysfonctionnements… ? Même si je suis conscient que le présent travail se veut un dictionnaire et non un essai ou une encyclopédie, ma responsabilité demeure entière, sur la forme et le fond, car en les choisissant j’ai fait miens les concepts et les idées, accouchés par d’autres et, en me les appropriant (en signalant leur provenance, naturellement), voire en les résumant, en les paraphrasant et/ou en les commentant, je m’en suis approprié aussi la responsabilité. De même que je suis responsable, a fortiori, de mes propres ajouts.`,
      `Ma motivation profonde ? Comprendre (et me comprendre), jouir intellectuellement, partager... et peut-être (surtout ?) pour laisser un modeste souvenir du passage sur Terre « du pauvre hère que j’étais », comme disait mon poète préféré, Omar Khayyâm.`,
      `Finalement, il ne me reste qu’à remercier les grands maîtres dont je me suis largement inspiré : Vincent Lenhardt (Responsables porteurs de sens…), François Delivré (Le métier de coach…), Alain Cardon (Dictionnaire du Coaching…), Serge Ginger (L’Art de la Gestalt…), David Grove, Éric Berne, Gregory Bateson, Carl Rogers, Robert Dilts, Peter Senge, Paul Watzlawick, John Whitmore, Youness Bellatif, Vicens Pibernat, et d’autres auteurs, connus ou anonymes, ainsi que Wikipédia, des blogs d’Internet, et j’en oublie sûrement… Et à remercier les amis et proches qui m’ont bien aidé de leurs conseils, apports et patience, tant à Casablanca qu’à Tanger… Et tout particulièrement Youness Bellatif, pour son soutien, ses conseils avisés et ses corrections, et mon épouse, Nora Mekouar, pour sa patience, ses conseils et son soutien ! Ma gratitude va aussi aux coachs Omar Belkheiri et Narjiss Lamarti, ainsi qu’à mon correcteur et ami, l’écrivain Nacer Ouramdane, et à mon éditeur, Najib Senhadji, pour ses encouragements et son soutien technique. Je ne peux oublier les amis qui m’ont soutenu tels que Driss Salioui, Aicha Skalli, Chafik Harti… Je remercie également M. Jean-Marie Grosbois, DG de la Société des Brasseries du Maroc pour m’avoir donné l’occasion d’explorer de nouveaux horizons du management.`,
      `Je remercie tous ceux qui m’ont fait confiance et m’ont encouragé. Grâce à eux tous, cet ouvrage a été mené à son terme.`,
    ],
  },
  {
    id: "lecture",
    title: "Comment lire cet ouvrage",
    paras: [
      `Comment lire le présent travail ? Comme un dictionnaire, où vous pouvez, à partir d’un mot/concept (entrée ou clef de recherche), suivre votre intuition et vous laisser guider par les liens (ou d'autres clefs de recherche) suivant les définitions (« Voir aussi : … »). Je remercie Alain Cardon, ainsi que d'autres auteurs de dictionnaires, pour cette excellente idée.`,
      `PS — Pour entamer le voyage, suivez ces fils d’Ariane :
1°- Le Coaching, Coaching (Approche Globale), Approche Centrée sur la Personne…
2°- Constructivisme, Constructionnisme Social, Gestalt, Palo Alto, Systémique…
3°- Fondamentaux, Coaching Individuel, Questionnement…
4°- Dimensions Culturelles…
5°- Puis laissez-vous aller par les « Voir aussi : … »`,
      `Et « pour aller plus loin » : consultez la bibliographie à la fin de l’ouvrage. Et n’oubliez pas qu’une bonne lecture n’est rien sans une bonne pratique (et vice-versa !). Alors pratiquez, pratiquez… ! Et bonnes lectures !`,
    ],
  },
  {
    id: "mot-de-la-fin",
    title: "Mot de la fin",
    paras: [
      `À mes lecteurs, je souhaite une agréable lecture. En ce qui me concerne j’avoue que je me suis bien amusé durant ces trois années et demie de rédaction !`,
      `Mais une question demeure : que vais-je faire après ? Là, j’aurais besoin d’un coaching !`,
      `Amusez vos neurones et aimez-vous : « Now and How ; I and Thou ».`,
      `— Mohamed Rachid Belhadj, Tanger, sous un beau soleil d’un mois de mars 2014.`,
    ],
  },
];

const features = [
  {
    title: "Recherche Avancée",
    desc: "Trouvez rapidement les concepts qui vous intéressent grâce à notre moteur de recherche intelligent.",
    // Remplacez par votre image si vous voulez:
    img: "/assets/icons/search.svg",
    // Fallback SVG si l'image n’existe pas
    svg: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path
          fill="currentColor"
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19 15.5 14Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"
        />
      </svg>
    ),
  },
  {
    title: "Fiches Détaillées",
    desc: "Chaque terme dispose d'une fiche complète avec définitions, exemples et ressources.",
    img: "/assets/icons/book.svg",
    svg: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path
          fill="currentColor"
          d="M19 2H8a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h11v-2H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11Zm-2 4H8v2h9Zm0 4H8v2h9Z"
        />
      </svg>
    ),
  },
  {
    title: "Édition Collaborative",
    desc: "Contribuez et enrichissez le dictionnaire avec vos connaissances et expériences.",
    img: "/assets/icons/edit.svg",
    svg: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path
          fill="currentColor"
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2 2.5h-.75v-.75L14.06 8.19l.75.75L5 19.75ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"
        />
      </svg>
    ),
  },
  {
    title: "Communauté Active",
    desc: "Échangez avec d'autres professionnels du coaching dans un environnement bienveillant.",
    img: "/assets/icons/users.svg",
    svg: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path
          fill="currentColor"
          d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z"
        />
      </svg>
    ),
  },
  {
    title: "Partage Facile",
    desc: "Partagez vos découvertes et créations avec la communauté en quelques clics.",
    img: "/assets/icons/share.svg",
    svg: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path
          fill="currentColor"
          d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a2.5 2.5 0 0 0 0-1.39l7-4.11A2.99 2.99 0 1 0 15 5a2.97 2.97 0 0 0 .04.49l-7 4.11a3 3 0 1 0 0 4.8l7.05 4.13c-.03.15-.05.31-.05.47a3 3 0 1 0 3-3Z"
        />
      </svg>
    ),
  },
  {
    title: "Accès Libre",
    desc: "Toutes les ressources sont accessibles gratuitement à tous les passionnés de coaching.",
    img: "/assets/icons/globe.svg",
    svg: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm6.93 6h-3.11a15.4 15.4 0 0 0-1.2-3.28A8.03 8.03 0 0 1 18.93 8ZM12 4c.8 1.05 1.49 2.49 1.94 4H10.06C10.51 6.49 11.2 5.05 12 4ZM8.38 4.72A15.4 15.4 0 0 0 7.18 8H4.07a8.03 8.03 0 0 1 4.31-3.28ZM4.07 10h3.01a18.1 18.1 0 0 0-.08 2c0 .68.03 1.35.08 2H4.07a8.06 8.06 0 0 1 0-4Zm.31 6h2.8c.32 1.24.78 2.34 1.2 3.28A8.03 8.03 0 0 1 4.38 16Zm5.68 3.99C9.99 19.02 9.2 17.4 8.7 16h6.6c-.5 1.4-1.29 3.02-2.62 3.99ZM16.82 16h3.11a8.03 8.03 0 0 1-4.31 3.28c.42-.94.88-2.04 1.2-3.28ZM19.93 12c0 .68-.06 1.35-.15 2h-3.01c.05-.65.08-1.32.08-2s-.03-1.35-.08-2h3.01c.09.65.15 1.32.15 2Z"
        />
      </svg>
    ),
  },
];

// Petite carte feature (utilise l’image si elle existe, sinon le SVG fallback)
const FeatureCard = ({ title, desc, img, svg }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 shadow-sm">
    <div className="shrink-0">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white grid place-items-center">
        {/* Image si dispo, sinon SVG fallback */}
        {img ? (
          <img
            src={img}
            alt=""
            className="w-6 h-6 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <div className="absolute opacity-0 pointer-events-none">{svg}</div>
        {/* Affiche SVG si l'image n’a pas été chargée */}
        <div className="relative text-white">{svg}</div>
      </div>
    </div>
    <div>
      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h4>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {desc}
      </p>
    </div>
  </div>
);

const Introduction = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl bg-gradient-to-tr from-blue-300 via-cyan-200 to-indigo-300 dark:from-blue-900 dark:via-indigo-800 dark:to-sky-900" />
        <div className="max-w-6xl mx-auto pt-14 pb-10 md:pb-14">
          <h1
            className="text-3xl md:text-5xl font-extrabold tracking-tight"
            style={{ color: "#884dee" }}
          >
            Dictionnaire du{" "}
            <span style={{ color: "#884dee" }}>Coach Global</span>
          </h1>
          <p className="mt-3 md:mt-4 text-zinc-600 dark:text-zinc-300 max-w-3xl">
            Un voyage créatif au cœur du coaching et de ses mots.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto pb-20 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
        {/* Sidebar: Sommaire + Features */}
        <aside className="lg:sticky lg:top-10 self-start bg-white/70 dark:bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
              Sommaire
            </h2>
            <nav className="space-y-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-zinc-600 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300 transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </div>

          {/* === Features sous Sommaire (comme l'image fournie) === */}
          <div className="pt-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Fonctionnalités
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Découvrez tous les outils à votre disposition pour explorer et
              enrichir le dictionnaire.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {features.map((f, i) => (
                <FeatureCard key={i} {...f} />
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <article className="space-y-10">
          <blockquote className="border-l-4 pl-6 py-4 bg-[#f3eaff] dark:bg-[#2a1e3a]/60 border-[#884dee] rounded-md text-zinc-800 dark:text-zinc-100">
            <p
              className="text-lg md:text-xl font-serif leading-relaxed"
              style={{ color: "#884dee" }}
            >
              {quote}
            </p>
            <footer
              className="mt-2 text-sm font-medium"
              style={{ color: "#884dee" }}
            >
              {quoteAuthor}
            </footer>
          </blockquote>

          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm scroll-mt-24"
            >
              <h3
                className="text-2xl md:text-3xl font-extrabold mb-4"
                style={{ color: "#884dee" }}
              >
                {s.title}
              </h3>
              <div className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed">
                {s.paras.map((p, i) => (
                  <p key={i} className="text-justify">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {/* Back to top */}
          <div className="flex justify-end">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline"
            >
              ↑ Retour en haut
            </a>
          </div>
        </article>
      </main>
    </div>
  );
};

export default Introduction;

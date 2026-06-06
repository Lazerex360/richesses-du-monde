// Règles officielles Lansay — extrait de « Règle du jeu.pdf »
window.RULES_CONTENT = {
  fr: `
    <p class="rules-pdf-link"><a href="/docs/regles.pdf" target="_blank" rel="noopener">📄 Ouvrir la notice PDF complète</a></p>

    <h3>But du jeu</h3>
    <p>2 à 6 joueurs. Acheter des titres d'exploitation, constituer des monopoles (90 %+ d'une richesse), encaisser des royalties, éliminer les adversaires.</p>

    <h3>Lexique</h3>
    <ul>
      <li><strong>Titre d'exploitation</strong> : % de production mondiale d'une richesse, détenu par un pays.</li>
      <li><strong>Monopole</strong> : 6 titres d'une même richesse ; situation de monopole dès 90 %.</li>
      <li><strong>Royalties</strong> : redevance due au propriétaire quand un joueur passe sur la case.</li>
      <li><strong>Tour du monde</strong> : tour complet du plateau (retour sur l'Allemagne).</li>
    </ul>

    <h3>Cases classiques (pays / sous-continent)</h3>
    <p>Le pays ou sous-continent et sa richesse sont sur la <strong>même case</strong>. En arrivant :</p>
    <ol>
      <li>Acheter jusqu'à <strong>6 titres</strong> dans le <strong>sabot fichier du pays</strong> (toutes richesses confondues — ex. Allemagne : Éolien + Solaire), chaque titre ayant son <strong>prix d'achat propre</strong> (500 k€ à 5 M€).</li>
      <li>Payer les <strong>royalties</strong> de la richesse <em>indiquée sur la case</em> (ex. Cacao sur Allemagne), même si vous possédez déjà un % de cette richesse (minimum 30 % pour qu'un propriétaire encaisse).</li>
    </ol>
    <p>Si un même pays apparaît plusieurs fois sur le plateau, chaque case est distincte (ex. 3× Russie, 3× États-Unis, 3× Chine…).</p>

    <h3>Royalties (varient selon la richesse)</h3>
    <p>Chaque richesse a son propre barème (indiqué sur les cartes et dans « Voir toutes les richesses »). Exemples :</p>
    <table class="rules-mini-table">
      <tr><th>Richesse</th><th>30%</th><th>50%</th><th>70%</th><th>90%</th></tr>
      <tr><td>Blé</td><td>900 k€</td><td>4,5 M€</td><td>9 M€</td><td>18 M€</td></tr>
      <tr><td>Or</td><td>400 k€</td><td>2 M€</td><td>4 M€</td><td>8 M€</td></tr>
      <tr><td>Café / Thé / Laine</td><td>500 k€</td><td>2,5 M€</td><td>5 M€</td><td>10 M€</td></tr>
      <tr><td>Coton</td><td>600 k€</td><td>3 M€</td><td>6 M€</td><td>12 M€</td></tr>
      <tr><td>Pétrole</td><td>1,2 M€</td><td>6 M€</td><td>12 M€</td><td>24 M€</td></tr>
    </table>

    <h3>Choix continental (×4)</h3>
    <p>Europe, Amérique, Asie, Afrique (+ Océanie sauf Australie). Acheter jusqu'à <strong>6 titres</strong> du continent, <strong>uniquement si vous possédez déjà</strong> au moins un titre de la production indiquée sur la case.</p>
    <ul>
      <li><strong>Choix Europe sauf Russie</strong> — Riz (Russie exclue)</li>
      <li><strong>Océanie sauf Australie</strong> — Cuivre</li>
      <li><strong>Choix Amérique sauf États-Unis</strong> (USA exclus)</li>
      <li><strong>Choix Asie sauf Chine et Inde</strong> — Cuivre</li>
      <li><strong>Choix Afrique</strong> — Hydraulique</li>
    </ul>

    <h3>Choix mondial (×2)</h3>
    <p>Actif <strong>après 1 tour du monde</strong>. Acheter jusqu'à 6 titres dans le monde entier, si vous possédez déjà des titres de la richesse concernée.</p>

    <h3>Enchères (×3)</h3>
    <p>Actives <strong>après 1 tour du monde</strong> (sauf à 2 joueurs : case repos). Le joueur met aux enchères un nombre de titres = résultat du <strong>dé rouge</strong>. S'il ne possède que des monopoles (4, 5 ou 6 titres d'une richesse), il doit vendre le monopole entier.</p>
    <p><strong>Déroulement :</strong> prix de départ = moitié du prix d'achat (monopole = moitié du total). Surenchère minimum <strong>100 000 €</strong>. Sans acquéreur, la banque rachète à moitié prix et les titres retournent dans le fichier.</p>

    <h3>500 000 € (×8)</h3>
    <p>Recevez immédiatement <strong>500 000 € × total des deux dés</strong>. Payez aussi les royalties de la richesse liée à la case (s'il y en a une).</p>

    <h3>Actualité (×6)</h3>
    <p>Tirer la carte du dessus du paquet, appliquer l'effet (payer ou recevoir), puis remettre la carte sous le paquet.</p>

    <h3>Douane (×2)</h3>
    <p>Produits bloqués : <strong>passez votre tour</strong> (aucune action au tour suivant).</p>

    <h3>Joker (×3)</h3>
    <p>Acheter une carte Joker pour <strong>3 000 000 €</strong>. Utilisable une fois sur une case Enchères pour éviter la vente forcée. Carte à usage unique, remise sous le paquet après utilisation.</p>

    <h3>Parcours du plateau</h3>
    <p><strong>Départ</strong> : case de mise en place uniquement (retirée du plateau une fois la partie lancée). Parcours : Allemagne → … → <strong>Enchères</strong> (dernière case, à côté de l'Allemagne) → retour sur l'Allemagne.</p>

    <h3>Mise de départ</h3>
    <ul>
      <li>2 joueurs : 100 M€</li>
      <li>3 joueurs : 66 M€</li>
      <li>4 joueurs : 50 M€</li>
      <li>5 joueurs : 40 M€</li>
      <li>6 joueurs : 33 M€</li>
    </ul>

    <h3>Doubles aux dés</h3>
    <p>Double 1→1 M€, 2→2 M€, 3→3 M€, 4→4 M€, 5→5 M€, 6→6 M€ payés à la banque.</p>

    <h3>Alliances & échanges</h3>
    <p>Échange ou vente de titres au tour du joueur. Alliance : taxe = moitié du prix total des titres combinés ; un seul pion pour le duo ; pas de royalties entre alliés.</p>

    <h3>Abandon</h3>
    <p>À tout moment, un joueur peut <strong>abandonner</strong> : la banque rachète tous ses titres à <strong>moitié prix</strong>, puis il quitte la partie.</p>

    <h3>Faillite & victoire</h3>
    <p>Faillite si impossible de payer ses dettes. Le gagnant élimine tous ses adversaires (ou le duo d'associés).</p>
    <p>À 2 joueurs restants : cases Enchères et Joker deviennent repos.</p>
  `,
  en: `
    <p class="rules-pdf-link"><a href="/docs/regles.pdf" target="_blank" rel="noopener">📄 Open full rulebook PDF (French)</a></p>
    <h3>Goal</h3>
    <p>2–6 players. Buy titles, build monopolies (90%+ of a resource), collect royalties, eliminate opponents.</p>
    <h3>Country tile</h3>
    <p>Country/sub-region and resource on the <strong>same tile</strong>. Buy up to 6 titles (each with its own price), then pay royalties for the linked resource.</p>
    <h3>Continental choice (×4)</h3>
    <p>Buy up to 6 titles in the continent if you already own that production. USA excluded from America, Russia from Europe, China/India from Asia.</p>
    <h3>World choice (×2)</h3>
    <p>Active after one lap around the board. Buy up to 6 titles worldwide (same condition).</p>
    <h3>Auctions (×5)</h3>
    <p>After one lap. Sell titles (red die count). Starting bid = half purchase price. Min. raise 100 k€.</p>
    <h3>500 k€ (×8)</h3>
    <p>Receive 500 k€ × dice total + pay linked royalties if any.</p>
    <h3>News (×6)</h3>
    <p>Draw top card, apply effect, return card to bottom.</p>
    <h3>Customs (×2)</h3>
    <p>Skip your next turn.</p>
    <h3>Joker (×3)</h3>
    <p>Buy for 3 M€ to avoid a forced auction once.</p>
    <h3>Board path</h3>
    <p>Start → Germany → … → last Auction → back to <strong>Germany</strong> (single loop, 69 spaces).</p>
  `,
  es: `
    <p class="rules-pdf-link"><a href="/docs/regles.pdf" target="_blank" rel="noopener">📄 Abrir el PDF completo (francés)</a></p>
    <h3>Objetivo</h3>
    <p>2–6 jugadores. Comprar títulos, monopolios, regalías, eliminar rivales.</p>
    <h3>Casilla país</h3>
    <p>País y recurso en la <strong>misma casilla</strong>. Compra hasta 6 títulos (precio variable) y paga regalías.</p>
    <h3>Recorrido</h3>
    <p>Salida → Alemania → … → última Subasta → vuelta a <strong>Alemania</strong> (un solo bucle, 69 casillas).</p>
  `,
  pt: `
    <p class="rules-pdf-link"><a href="/docs/regles.pdf" target="_blank" rel="noopener">📄 Abrir o PDF completo (francês)</a></p>
    <h3>Objetivo</h3>
    <p>2–6 jogadores. Comprar títulos, monopólios, royalties, eliminar adversários.</p>
    <h3>Casa país</h3>
    <p>País e recurso na <strong>mesma casa</strong>. Compre até 6 títulos (preço variável) e pague royalties.</p>
    <h3>Percurso</h3>
    <p>Partida → Alemanha → … → último Leilão → volta à <strong>Alemanha</strong> (um único circuito).</p>
  `,
  ko: `
    <p class="rules-pdf-link"><a href="/docs/regles.pdf" target="_blank" rel="noopener">📄 전체 규칙 PDF 열기 (프랑스어)</a></p>
    <h3>목표</h3>
    <p>2–6명. 칭호 구매, 독점, 로열티, 상대 제거.</p>
    <h3>국가 칸</h3>
    <p>국가와 자원이 <strong>같은 칸</strong>에 있습니다. 최대 6개 칭호 구매(가격 가변) 후 로열티 지불.</p>
    <h3>경로</h3>
    <p>출발 → 독일 → … → 마지막 경매 → <strong>독일</strong>로 복귀 (단일 루프).</p>
  `,
};

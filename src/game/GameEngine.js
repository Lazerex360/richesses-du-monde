const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const { RESOURCES, CONTINENTS, STARTING_MONEY, getRoyaltyAmount, hasResourceMonopoly, buildDeck } = require('../data/resources');
const { BOARD, BOARD_POSITIONS, BOARD_GRID, BOARD_UI, LOOP_END, LOOP_SIZE, OUTER_LOOP_END, INNER_LOOP_START, NEWS_CARDS, PLAYER_COLORS } = require('../data/board');
const { getDice } = require('../data/shop');

class GameEngine {
  constructor(roomId, playerDefs) {
    this.roomId = roomId;
    this.board = BOARD.filter((s) => s.type !== 'resource');
    this.deck = buildDeck();
    this.newsDeck = [...NEWS_CARDS].sort(() => Math.random() - 0.5);
    this.log = [];
    this.phase = 'rolling';
    this.pendingAction = null;
    this.auction = null;
    this.winner = null;
    this.diceResult = null;
    this.diceRollId = 0;
    this.newsRevealCounter = 0;
    this.lastNewsReveal = null;

    // Rétrocompatibilité : accepte un tableau de noms ou d'objets {name, pawn}
    const defs = playerDefs.map((d) => (typeof d === 'string' ? { name: d } : d));
    const count = defs.length;
    const startingMoney = STARTING_MONEY[count] || 33000000;

    this.players = defs.map((def, i) => {
      const diceId = def.equippedDice || 'classic_dice';
      const diceStyle = getDice(diceId).style;
      return {
      id: uuidv4(),
      name: def.name,
      pawn: def.pawn || 'classic',
      equippedDice: diceId,
      diceStyle,
      honorTitle: def.honorTitle || '',
      isBot: !!def.isBot,
      team: null,
      color: PLAYER_COLORS[i],
      money: startingMoney,
      position: 0,
      titles: [],
      joker: false,
      laps: 0,
      bankrupt: false,
      skipNextTurn: false,
      socketId: null,
    };
    });

    this.pendingAlliance = null;
    this.pendingTrade = null;
    this.currentPlayerIndex = 0;
    this.addLog(`Partie lancée avec ${count} joueurs. Capital de départ : ${this.formatMoney(startingMoney)}`);
  }

  formatMoney(amount) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)} k€`;
    return `${amount} €`;
  }

  /**
   * Restaure l'état d'une partie depuis un export client (💾) : argent,
   * positions, titres, tours. Le siège i du salon reprend le siège i de la
   * sauvegarde. Les actions transitoires (enchère, achat en cours, dés) ne
   * sont pas restaurées : la partie reprend proprement au début du tour.
   */
  restoreFromSnapshot(snap) {
    (snap.players || []).forEach((sp, i) => {
      const p = this.players[i];
      if (!p) return;
      p.money = Number(sp.money) || 0;
      p.position = Number(sp.position) || 0;
      p.laps = Number(sp.laps) || 0;
      p.joker = !!sp.joker;
      p.bankrupt = !!sp.bankrupt;
      p.team = sp.team || null;
      p.titles = [];
      (sp.titles || []).forEach((st) => {
        const title = this.getTitleById(st.id);
        if (title && !title.ownerId) {
          title.ownerId = p.id;
          p.titles.push(title);
        }
      });
    });
    const idx = Number(snap.currentPlayerIndex);
    this.currentPlayerIndex = Number.isInteger(idx) && idx >= 0 && idx < this.players.length ? idx : 0;
    let guard = this.players.length;
    while (this.players[this.currentPlayerIndex]?.bankrupt && guard-- > 0) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
    this.phase = 'rolling';
    this.pendingAction = null;
    this.auction = null;
    this.diceResult = null;
    this.addLog('💾 Partie restaurée depuis une sauvegarde.');
  }

  addLog(message) {
    this.log.unshift({ time: Date.now(), message });
    if (this.log.length > 50) this.log.pop();
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getActivePlayers() {
    return this.players.filter((p) => !p.bankrupt);
  }

  getTitleById(titleId) {
    for (const countryTitles of Object.values(this.deck)) {
      const found = countryTitles.find((t) => t.id === titleId);
      if (found) return found;
    }
    return null;
  }

  getAvailableTitles(countryId) {
    const titles = this.deck[countryId] || [];
    return titles.filter((t) => !t.ownerId);
  }

  getPlayerResourcePercent(playerId, resourceId) {
    return this.players
      .find((p) => p.id === playerId)
      ?.titles.filter((t) => t.resourceId === resourceId)
      .reduce((sum, t) => sum + t.percent, 0) || 0;
  }

  getResourceOwners(resourceId) {
    const owners = {};
    for (const player of this.players) {
      if (player.bankrupt) continue;
      const percent = player.titles
        .filter((t) => t.resourceId === resourceId)
        .reduce((sum, t) => sum + t.percent, 0);
      if (percent >= 30) {
        owners[player.id] = { player, percent, royalty: getRoyaltyAmount(resourceId, percent) };
      }
    }
    return owners;
  }

  playerOwnsResource(playerId, resourceId) {
    return this.getPlayerResourcePercent(playerId, resourceId) > 0;
  }

  // Boucle 1→N : après la dernière case on retombe sur l'Allemagne (jamais sur Départ)
  advancePosition(currentPos, steps) {
    let lapsAdded = 0;
    let pos = currentPos === 0 ? steps : currentPos + steps;
    while (pos > LOOP_END) {
      lapsAdded++;
      pos -= LOOP_SIZE;
    }
    return { position: pos, lapsAdded };
  }

  rollDice() {
    if (this.phase !== 'rolling' || this.winner) return { error: 'Action non autorisée' };

    const player = this.getCurrentPlayer();
    if (player.bankrupt) return { error: 'Joueur en faillite' };

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    this.diceRollId += 1;
    this.diceResult = { d1, d2, total, isDouble: d1 === d2, rollId: this.diceRollId };

    this.addLog(`${player.name} lance ${d1} + ${d2} = ${total}${d1 === d2 ? ' (double !)' : ''}`);

    if (d1 === d2) {
      const penalty = d1 * 1000000;
      player.money -= penalty;
      this.addLog(`${player.name} paie ${this.formatMoney(penalty)} à la banque (double ${d1})`);
      if (player.money < 0) this.handleBankruptcy(player);
    }

    if (!player.bankrupt) {
      const { position, lapsAdded } = this.advancePosition(player.position, total);
      player.position = position;
      if (lapsAdded > 0) {
        player.laps += lapsAdded;
        this.addLog(`${player.name} effectue un tour du monde !`);
      }
      this.resolveLanding(player);
    }

    if (this.phase !== 'game_over' && this.phase !== 'auction') {
      this.phase = this.pendingAction ? 'action' : 'end_turn';
    }
    return { success: true, dice: this.diceResult };
  }

  resolveLanding(player) {
    const space = this.board[player.position];
    if (space.type === 'start') return;
    this.addLog(`${player.name} arrive sur : ${space.label}`);

    switch (space.type) {
      case 'start':
        break;
      case 'country': {
        const landContext = {
          buyType: 'country',
          countryIds: [space.countryId],
          linkedResource: space.resource,
        };
        this.handleLandingRoyaltiesThenBuy(player, space.resource, landContext);
        break;
      }
      case 'continental': {
        if (this.canContinentalBuy(player)) {
          const countries = space.countries || CONTINENTS[space.continent] || [];
          const landContext = {
            buyType: 'continental',
            countryIds: countries,
            linkedResource: space.resource,
          };
          this.handleLandingRoyaltiesThenBuy(player, space.resource, landContext);
        } else {
          this.addLog(`${player.name} ne possède aucune richesse — achat continental impossible`);
          if (space.resource) {
            const payResult = this.tryPayRoyalties(player, space.resource);
            if (!payResult.paid) {
              this.setupRoyaltyDue(player, space.resource, payResult.due, null);
            }
          }
        }
        break;
      }
      case 'world':
        if (player.laps >= 1) {
          if (this.hasAnyResource(player)) {
            this.setupBuyAction(player, Object.keys(this.deck), null, 6, 'world');
          } else {
            this.addLog(`${player.name} ne possède aucune richesse — choix mondial impossible`);
          }
        } else {
          this.addLog('Choix mondial disponible après un tour du monde');
        }
        break;
      case 'auction':
        if (player.laps >= 1 && this.getActivePlayers().length > 2) {
          if (player.joker) {
            this.pendingAction = {
              type: 'joker_choice',
              playerId: player.id,
              canUseJoker: true,
            };
          } else {
            this.startAuction(player, Math.floor(Math.random() * 3) + 1);
          }
        } else {
          this.addLog('Case repos (enchères indisponibles)');
        }
        break;
      case 'news':
        this.drawNews(player);
        break;
      case 'bonus':
        if (this.diceResult) {
          const bonus = 500000 * this.diceResult.total;
          player.money += bonus;
          this.addLog(`${player.name} reçoit ${this.formatMoney(bonus)} de la banque`);
          if (space.resource) {
            const payResult = this.tryPayRoyalties(player, space.resource);
            if (!payResult.paid) {
              this.setupRoyaltyDue(player, space.resource, payResult.due, null);
            }
          }
        }
        break;
      case 'customs':
        player.skipNextTurn = true;
        this.addLog(`${player.name} est bloqué en douane — passe le prochain tour`);
        break;
      case 'joker':
        this.pendingAction = {
          type: 'joker_buy',
          playerId: player.id,
          price: 3000000,
        };
        break;
    }

  }

  hasAnyResource(player) {
    return player.titles.length > 0;
  }

  canContinentalBuy(player) {
    return player.titles.length > 0;
  }

  setupBuyAction(player, countryIds, linkedResource, maxTitles = 6, buyType = 'country') {
    const available = [];
    for (const cid of countryIds) {
      const titles = this.getAvailableTitles(cid);
      available.push(...titles);
    }

    let filtered = available;
    if (buyType === 'continental' || buyType === 'world') {
      const ownedResources = new Set(player.titles.map((t) => t.resourceId));
      filtered = available.filter((t) => ownedResources.has(t.resourceId));
    }
    // Case pays (Lansay) : tous les titres du sabot fichier du pays, sans filtre par ressource.
    // Royalties : ressource indiquée sur la case (linkedResource), gérées à l'atterrissage.
    if (linkedResource && buyType !== 'country') {
      filtered = filtered.filter((t) => t.resourceId === linkedResource);
    }

    if (filtered.length === 0) {
      this.addLog(`Aucun titre disponible pour ${player.name}`);
      return false;
    }

    this.pendingAction = {
      type: 'buy_titles',
      playerId: player.id,
      buyType,
      countryIds,
      maxTitles,
      linkedResource,
      royaltiesPaid: true,
      available: filtered.map((t) => ({
        id: t.id,
        resourceId: t.resourceId,
        resourceName: t.resourceName,
        country: t.country,
        percent: t.percent,
        price: t.price,
      })),
    };
    return true;
  }

  boardSpaceWithHints(space) {
    if (space.type === 'country' && space.countryId) {
      const titleHints = (this.deck[space.countryId] || [])
        .filter((t) => !t.ownerId)
        .map((t) => ({
          percent: t.percent,
          resourceId: t.resourceId,
          resourceName: t.resourceName,
        }));
      return { ...space, titleHints };
    }
    return space;
  }

  areAllied(playerA, playerB) {
    if (!playerA || !playerB) return false;
    return playerA.team !== null && playerA.team === playerB.team;
  }

  calcRoyaltyDue(player, resourceId) {
    const owners = this.getResourceOwners(resourceId);
    const list = [];
    let total = 0;

    for (const [ownerId, data] of Object.entries(owners)) {
      if (ownerId === player.id) continue;
      if (this.areAllied(player, data.player)) {
        this.addLog(`${player.name} ne paie pas ${data.player.name} (alliés)`);
        continue;
      }
      total += data.royalty;
      list.push({
        ownerId,
        ownerName: data.player.name,
        percent: data.percent,
        royalty: data.royalty,
      });
    }

    return { total, owners: list };
  }

  tryPayRoyalties(player, resourceId) {
    const due = this.calcRoyaltyDue(player, resourceId);
    const resourceName = RESOURCES[resourceId]?.name || resourceId;

    if (due.total === 0) {
      if (due.owners.length === 0) {
        this.addLog(`Aucun propriétaire avec 30%+ de ${resourceName}`);
      }
      return { paid: true, amount: 0, due };
    }

    if (player.money < due.total) {
      this.addLog(
        `${player.name} ne peut pas payer les royalties (${this.formatMoney(player.money)} / ${this.formatMoney(due.total)}) — ${resourceName}`
      );
      return { paid: false, amount: 0, due };
    }

    for (const o of due.owners) {
      const owner = this.players.find((p) => p.id === o.ownerId);
      if (!owner) continue;
      player.money -= o.royalty;
      owner.money += o.royalty;
      this.addLog(
        `${player.name} paie ${this.formatMoney(o.royalty)} de royalties à ${o.ownerName} (${resourceName}, ${o.percent}%)`
      );
    }

    return { paid: true, amount: due.total, due };
  }

  payRoyalties(player, resourceId) {
    const result = this.tryPayRoyalties(player, resourceId);
    if (!result.paid && result.due.total > 0) {
      this.handleBankruptcy(player);
    }
  }

  setupRoyaltyDue(player, resourceId, due, landContext) {
    const resourceName = RESOURCES[resourceId]?.name || resourceId;
    this.pendingAction = {
      type: 'royalty_due',
      playerId: player.id,
      resourceId,
      resourceName,
      totalDue: due.total,
      owners: due.owners,
      landContext: landContext || null,
    };
    this.phase = 'action';
  }

  resumeBuyAfterRoyalties(player, landContext) {
    if (!landContext) {
      this.phase = 'end_turn';
      return;
    }

    let ok = false;
    if (landContext.buyType === 'country') {
      ok = this.setupBuyAction(player, landContext.countryIds, landContext.linkedResource, 6, 'country');
    } else if (landContext.buyType === 'continental') {
      ok = this.setupBuyAction(
        player,
        landContext.countryIds,
        landContext.linkedResource,
        6,
        'continental',
      );
    } else if (landContext.buyType === 'world') {
      ok = this.setupBuyAction(player, landContext.countryIds, landContext.linkedResource, 6, 'world');
    }
    if (!ok) this.phase = 'end_turn';
  }

  handleLandingRoyaltiesThenBuy(player, resourceId, landContext) {
    if (!resourceId) {
      this.resumeBuyAfterRoyalties(player, landContext);
      return true;
    }

    const payResult = this.tryPayRoyalties(player, resourceId);
    if (!payResult.paid) {
      this.setupRoyaltyDue(player, resourceId, payResult.due, landContext);
      return false;
    }

    this.resumeBuyAfterRoyalties(player, landContext);
    return true;
  }

  payLandRoyalties(playerId) {
    const action = this.pendingAction;
    if (!action || action.type !== 'royalty_due') {
      return { error: 'Aucune royalty en attente' };
    }
    if (action.playerId !== playerId) {
      return { error: 'Ce n\'est pas votre tour' };
    }

    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.bankrupt) return { error: 'Joueur invalide' };

    const payResult = this.tryPayRoyalties(player, action.resourceId);
    if (!payResult.paid) {
      return {
        error: `Fonds insuffisants (${this.formatMoney(player.money)} / ${this.formatMoney(action.totalDue)})`,
      };
    }

    const landContext = action.landContext;
    this.pendingAction = null;
    this.resumeBuyAfterRoyalties(player, landContext);
    this.phase = this.pendingAction ? 'action' : 'end_turn';
    return { success: true, amount: payResult.amount };
  }

  drawNews(player) {
    if (this.newsDeck.length === 0) {
      this.newsDeck = [...NEWS_CARDS].sort(() => Math.random() - 0.5);
    }
    const card = this.newsDeck.shift();
    this.newsDeck.push(card);
    this.lastNewsReveal = {
      id: ++this.newsRevealCounter,
      playerId: player.id,
      playerName: player.name,
      text: card.text,
    };
    this.addLog(`📰 ${player.name} : ${card.text}`);

    const effect = card.effect;
    switch (effect.type) {
      case 'pay_bank':
        player.money -= effect.amount;
        break;
      case 'receive_bank':
        player.money += effect.amount;
        break;
      case 'receive_if_resource':
        if (this.playerOwnsResource(player.id, effect.resource)) player.money += effect.amount;
        break;
      case 'pay_if_resource':
        if (this.playerOwnsResource(player.id, effect.resource)) player.money -= effect.amount;
        break;
      case 'receive_if_any':
        if (effect.resources.some((r) => this.playerOwnsResource(player.id, r))) {
          player.money += effect.amount;
        }
        break;
      case 'all_pay_bank':
        for (const p of this.players) {
          if (!p.bankrupt) p.money -= effect.amount;
        }
        break;
    }

    if (player.money < 0) this.handleBankruptcy(player);

    // Une carte affectant tous les joueurs peut en ruiner d'autres
    if (effect.type === 'all_pay_bank') {
      for (const p of this.players) {
        if (!p.bankrupt && p.money < 0) this.handleBankruptcy(p);
      }
    }
  }

  buyTitles(playerId, titleIds) {
    if (!this.pendingAction || this.pendingAction.type !== 'buy_titles') {
      return { error: 'Aucun achat en cours' };
    }
    if (this.pendingAction.playerId !== playerId) {
      return { error: 'Ce n\'est pas votre tour' };
    }

    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.bankrupt) return { error: 'Joueur invalide' };

    if (titleIds.length > this.pendingAction.maxTitles) {
      return { error: `Maximum ${this.pendingAction.maxTitles} titres` };
    }

    let totalCost = 0;
    const toBuy = [];

    for (const id of titleIds) {
      const available = this.pendingAction.available.find((t) => t.id === id);
      if (!available) return { error: `Titre ${id} non disponible` };
      const title = this.getTitleById(id);
      if (!title || title.ownerId) return { error: 'Titre déjà vendu' };
      totalCost += title.price;
      toBuy.push(title);
    }

    if (player.money < totalCost) {
      return { error: `Fonds insuffisants (${this.formatMoney(player.money)} / ${this.formatMoney(totalCost)})` };
    }

    player.money -= totalCost;
    for (const title of toBuy) {
      title.ownerId = playerId;
      player.titles.push({ ...title });
      this.addLog(
        `${player.name} achète ${title.resourceName} (${title.country}, ${title.percent}%) pour ${this.formatMoney(title.price)}`
      );
    }

    if (titleIds.length === 0) {
      this.addLog(`${player.name} n'achète aucun titre`);
    }

    this.pendingAction = null;
    this.phase = 'end_turn';
    return { success: true };
  }

  buyJoker(playerId) {
    if (!this.pendingAction || this.pendingAction.type !== 'joker_buy') {
      return { error: 'Action joker non disponible' };
    }
    if (this.pendingAction.playerId !== playerId) {
      return { error: 'Ce n\'est pas votre tour' };
    }
    const player = this.players.find((p) => p.id === playerId);
    if (player.money < 3000000) return { error: 'Fonds insuffisants' };
    player.money -= 3000000;
    player.joker = true;
    this.addLog(`${player.name} achète une carte Joker !`);
    this.pendingAction = null;
    this.phase = 'end_turn';
    return { success: true };
  }

  skipJoker(playerId) {
    if (this.pendingAction?.type === 'joker_buy' && this.pendingAction.playerId === playerId) {
      this.pendingAction = null;
      this.phase = 'end_turn';
      return { success: true };
    }
    return { error: 'Action invalide' };
  }

  useJokerSkip(playerId) {
    if (this.pendingAction?.type === 'joker_choice' && this.pendingAction.playerId === playerId) {
      const player = this.players.find((p) => p.id === playerId);
      player.joker = false;
      this.addLog(`${player.name} utilise son Joker pour éviter les enchères !`);
      this.pendingAction = null;
      this.phase = 'end_turn';
      return { success: true };
    }
    return { error: 'Action invalide' };
  }

  declineJokerUse(playerId) {
    if (this.pendingAction?.type !== 'joker_choice' || this.pendingAction.playerId !== playerId) {
      return { error: 'Action invalide' };
    }
    const player = this.players.find((p) => p.id === playerId);
    this.pendingAction = null;
    this.startAuction(player, Math.floor(Math.random() * 3) + 1);
    return { success: true };
  }

  startAuction(seller, count) {
    const sellable = this.getSellableGroups(seller);
    if (sellable.length === 0) {
      this.addLog(`${seller.name} n'a rien à vendre aux enchères`);
      this.phase = 'end_turn';
      return;
    }

    const toSell = sellable.slice(0, count);
    const titles = toSell.flatMap((g) => g.titles);
    const totalPrice = titles.reduce((s, t) => s + t.price, 0);
    const startBid = Math.floor(totalPrice / 2);

    this.auction = {
      sellerId: seller.id,
      titles: titles.map((t) => t.id),
      currentBid: startBid,
      highBidderId: null,
      endTime: Date.now() + 15000,
    };

    this.pendingAction = { type: 'auction', auction: this.auction };
    this.phase = 'auction';
    this.addLog(
      `Enchères ! ${titles.length} titre(s) à partir de ${this.formatMoney(startBid)}`
    );
  }

  getSellableGroups(player) {
    const byResource = {};
    for (const title of player.titles) {
      if (!byResource[title.resourceId]) byResource[title.resourceId] = [];
      byResource[title.resourceId].push(title);
    }
    return Object.values(byResource).map((titles) => {
      const percent = titles.reduce((s, t) => s + t.percent, 0);
      return {
        resourceId: titles[0].resourceId,
        titles,
        percent,
        isMonopoly: hasResourceMonopoly(percent),
        totalPrice: titles.reduce((s, t) => s + t.price, 0),
      };
    });
  }

  placeBid(playerId, amount) {
    if (!this.auction || this.phase !== 'auction') return { error: 'Pas d\'enchère en cours' };
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.bankrupt || playerId === this.auction.sellerId) {
      return { error: 'Enchère non autorisée' };
    }
    if (amount < this.auction.currentBid + 100000) {
      return { error: 'Enchère minimum +100 000 €' };
    }
    if (player.money < amount) return { error: 'Fonds insuffisants' };

    this.auction.currentBid = amount;
    this.auction.highBidderId = playerId;
    this.auction.endTime = Date.now() + 10000;
    this.addLog(`${player.name} enchérit ${this.formatMoney(amount)}`);
    return { success: true };
  }

  resolveAuction() {
    if (!this.auction) return;

    const seller = this.players.find((p) => p.id === this.auction.sellerId);
    const bidder = this.players.find((p) => p.id === this.auction.highBidderId);

    if (bidder) {
      bidder.money -= this.auction.currentBid;
      seller.money += this.auction.currentBid;

      for (const titleId of this.auction.titles) {
        const title = this.getTitleById(titleId);
        if (title) {
          seller.titles = seller.titles.filter((t) => t.id !== titleId);
          title.ownerId = bidder.id;
          bidder.titles.push({ ...title });
        }
      }
      this.addLog(
        `${bidder.name} remporte l'enchère pour ${this.formatMoney(this.auction.currentBid)}`
      );
    } else {
      const halfPrice = Math.floor(
        this.auction.titles.reduce((s, id) => s + (this.getTitleById(id)?.price || 0), 0) / 2
      );
      seller.money += halfPrice;
      for (const titleId of this.auction.titles) {
        const title = this.getTitleById(titleId);
        if (title) {
          seller.titles = seller.titles.filter((t) => t.id !== titleId);
          title.ownerId = null;
          const countryDeck = this.deck[title.countryId];
          if (countryDeck) {
            const idx = countryDeck.findIndex((t) => t.id === titleId);
            if (idx >= 0) countryDeck[idx].ownerId = null;
          }
        }
      }
      this.addLog(`Banque rachète les titres pour ${this.formatMoney(halfPrice)}`);
    }

    this.auction = null;
    this.pendingAction = null;
    this.phase = 'end_turn';
  }

  returnTitlesToBank(player) {
    for (const title of player.titles) {
      const deckTitle = this.getTitleById(title.id);
      if (deckTitle) deckTitle.ownerId = null;
    }
    player.titles = [];
  }

  clearPlayerPending(playerId) {
    if (this.pendingAction?.playerId === playerId) this.pendingAction = null;
    if (this.auction && (this.auction.sellerId === playerId || this.auction.highBidderId === playerId)) {
      this.auction = null;
      if (this.pendingAction?.type === 'auction') this.pendingAction = null;
    }
    if (this.pendingAlliance && (this.pendingAlliance.fromId === playerId || this.pendingAlliance.toId === playerId)) {
      this.pendingAlliance = null;
    }
    if (this.pendingTrade && (this.pendingTrade.fromId === playerId || this.pendingTrade.toId === playerId)) {
      this.pendingTrade = null;
    }
  }

  handleBankruptcy(player) {
    if (player.bankrupt) return;
    player.bankrupt = true;
    player.money = 0;

    this.returnTitlesToBank(player);
    player.joker = false;

    this.addLog(`💀 ${player.name} est en FAILLITE !`);
    this.clearPlayerPending(player.id);
    this.checkVictory();
    if (!this.winner && !this.pendingAction && !this.auction && this.phase !== 'rolling') {
      this.phase = 'end_turn';
    }
  }

  surrender(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.bankrupt) return { error: 'Action impossible' };
    if (this.winner) return { error: 'Partie terminée' };

    const halfPrice = Math.floor(player.titles.reduce((s, t) => s + (t.price || 0), 0) / 2);
    if (halfPrice > 0) {
      player.money += halfPrice;
      this.addLog(`🏳️ ${player.name} abandonne — banque rachète les titres pour ${this.formatMoney(halfPrice)}`);
    } else {
      this.addLog(`🏳️ ${player.name} abandonne la partie`);
    }

    this.returnTitlesToBank(player);
    player.joker = false;
    if (player.team !== null) {
      const oldTeam = player.team;
      for (const p of this.players) {
        if (p.team === oldTeam) p.team = null;
      }
    }

    this.clearPlayerPending(player.id);
    player.bankrupt = true;

    const wasCurrent = this.getCurrentPlayer().id === player.id;
    this.checkVictory();

    if (!this.winner && wasCurrent) {
      this.pendingAction = null;
      this.auction = null;
      this.phase = 'end_turn';
      this.endTurn();
    } else if (!this.winner && !this.pendingAction && !this.auction) {
      this.phase = this.phase === 'game_over' ? 'game_over' : this.phase;
    }

    return { success: true };
  }

  // Renvoie le nombre de "camps" encore en jeu (un solo = un camp, une alliance = un camp)
  getSides() {
    const active = this.getActivePlayers();
    const sides = new Map();
    for (const p of active) {
      const key = p.team !== null ? `team:${p.team}` : `solo:${p.id}`;
      if (!sides.has(key)) sides.set(key, []);
      sides.get(key).push(p);
    }
    return sides;
  }

  checkVictory() {
    const active = this.getActivePlayers();
    if (active.length === 0) {
      this.phase = 'game_over';
      return;
    }
    const sides = this.getSides();
    if (sides.size === 1) {
      const members = [...sides.values()][0];
      this.winner = members[0];
      this.winningTeam = members.map((m) => m.id);
      if (members.length > 1) {
        this.addLog(`🏆 Alliance victorieuse : ${members.map((m) => m.name).join(' & ')} !`);
      } else {
        this.addLog(`🏆 ${this.winner.name} remporte la partie !`);
      }
      this.phase = 'game_over';
    }
  }

  endTurn() {
    if (this.auction && Date.now() >= this.auction.endTime) {
      this.resolveAuction();
    }

    if (this.pendingTrade) return { error: 'Résolvez l\'échange en cours' };
    if (this.pendingAlliance) return { error: 'Résolvez la proposition d\'alliance' };

    if (this.phase !== 'end_turn' && this.phase !== 'game_over') {
      if (this.pendingAction) return { error: 'Action en attente' };
      return { error: 'Tour non terminé' };
    }

    if (this.winner) return { success: true, gameOver: true };

    let guard = 0;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      while (this.getCurrentPlayer().bankrupt && this.getActivePlayers().length > 1) {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      }
      const next = this.getCurrentPlayer();
      if (!next.skipNextTurn || guard++ >= this.players.length) break;
      next.skipNextTurn = false;
      this.addLog(`${next.name} passe un tour (douane)`);
    } while (guard < this.players.length);

    this.phase = 'rolling';
    this.diceResult = null;
    this.pendingAction = null;
    this.addLog(`Tour de ${this.getCurrentPlayer().name}`);
    return { success: true };
  }

  sellTitles(playerId, titleIds, buyerId, price) {
    const seller = this.players.find((p) => p.id === playerId);
    const buyer = this.players.find((p) => p.id === buyerId);
    if (!seller || !buyer || seller.bankrupt || buyer.bankrupt) {
      return { error: 'Joueurs invalides' };
    }
    if (buyer.money < price) return { error: 'Acheteur sans fonds' };

    for (const id of titleIds) {
      const title = seller.titles.find((t) => t.id === id);
      if (!title) return { error: 'Titre non possédé' };
    }

    buyer.money -= price;
    seller.money += price;

    for (const id of titleIds) {
      const deckTitle = this.getTitleById(id);
      seller.titles = seller.titles.filter((t) => t.id !== id);
      if (deckTitle) deckTitle.ownerId = buyerId;
      const t = deckTitle || seller.titles.find((x) => x.id === id);
      if (t) buyer.titles.push({ ...t, ownerId: buyerId });
    }

    this.addLog(`${seller.name} vend ${titleIds.length} titre(s) à ${buyer.name} pour ${this.formatMoney(price)}`);
    return { success: true };
  }

  // ---------------- Alliances ----------------
  canManageTurnAction(playerId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return false;
    if (this.auction) return false;
    if (this.pendingTrade || this.pendingAlliance) return false;
    if (this.winner) return false;
    if (this.pendingAction?.type === 'royalty_due' && this.pendingAction.playerId === playerId) {
      return true;
    }
    if (this.pendingAction) return false;
    return this.phase === 'rolling' || this.phase === 'end_turn' || this.phase === 'action';
  }

  allianceTax(player) {
    const total = player.titles.reduce((s, t) => s + t.price, 0);
    return Math.floor(total / 2);
  }

  proposeAlliance(fromId, toId) {
    if (!this.canManageTurnAction(fromId)) return { error: 'Action impossible pour le moment' };
    const from = this.players.find((p) => p.id === fromId);
    const to = this.players.find((p) => p.id === toId);
    if (!to || to.bankrupt || from.bankrupt) return { error: 'Joueur invalide' };
    if (from.id === to.id) return { error: 'Cible invalide' };
    if (from.team !== null && from.team === to.team) return { error: 'Déjà alliés' };
    if (from.team !== null) return { error: 'Déjà en alliance — rompez-la d\'abord' };
    if (this.getActivePlayers().length <= 2) return { error: 'Alliance impossible à 2 joueurs' };

    this.pendingAlliance = {
      fromId,
      toId,
      taxFrom: this.allianceTax(from),
      taxTo: this.allianceTax(to),
    };
    this.addLog(`${from.name} propose une alliance à ${to.name}`);
    return { success: true, autoTarget: to.isBot ? to : null };
  }

  respondAlliance(playerId, accept) {
    const prop = this.pendingAlliance;
    if (!prop || prop.toId !== playerId) return { error: 'Aucune proposition' };
    const from = this.players.find((p) => p.id === prop.fromId);
    const to = this.players.find((p) => p.id === prop.toId);
    this.pendingAlliance = null;

    if (!accept) {
      this.addLog(`${to.name} refuse l'alliance avec ${from.name}`);
      return { success: true, accepted: false };
    }
    if (from.money < prop.taxFrom || to.money < prop.taxTo) {
      this.addLog(`Alliance annulée : taxe impayable`);
      return { success: true, accepted: false };
    }

    from.money -= prop.taxFrom;
    to.money -= prop.taxTo;
    const teamId = from.team !== null ? from.team : (to.team !== null ? to.team : `T${Date.now().toString(36)}`);
    from.team = teamId;
    to.team = teamId;
    this.addLog(
      `🤝 Alliance scellée entre ${from.name} et ${to.name} (taxe ${this.formatMoney(prop.taxFrom + prop.taxTo)})`
    );
    if (from.money < 0) this.handleBankruptcy(from);
    if (to.money < 0) this.handleBankruptcy(to);
    return { success: true, accepted: true };
  }

  breakAlliance(playerId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return { error: 'Ce n\'est pas votre tour' };
    if (this.pendingTrade || this.pendingAlliance) return { error: 'Résolvez la proposition en cours' };
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.team === null) return { error: 'Vous n\'êtes pas en alliance' };

    const teamId = player.team;
    const partners = this.players.filter((p) => p.team === teamId && p.id !== playerId && !p.bankrupt);
    for (const p of this.players) {
      if (p.team === teamId) p.team = null;
    }
    const names = partners.map((p) => p.name).join(', ');
    this.addLog(
      names
        ? `💔 ${player.name} rompt l'alliance avec ${names}`
        : `💔 ${player.name} met fin à l'alliance`
    );
    return { success: true };
  }

  alliancePartnersFor(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.team === null) return [];
    return this.players
      .filter((p) => p.id !== playerId && !p.bankrupt && p.team === player.team)
      .map((p) => ({ id: p.id, name: p.name }));
  }

  canSeeAlliance(viewerId, target) {
    if (!viewerId || !target) return false;
    const viewer = this.players.find((p) => p.id === viewerId);
    if (!viewer || viewer.team === null) return false;
    return target.team === viewer.team;
  }

  // ---------------- Échange / Vente ----------------
  proposeTrade(fromId, { toId, giveTitleIds = [], receiveTitleIds = [], cash = 0 }) {
    if (!this.canManageTurnAction(fromId)) return { error: 'Échange possible uniquement à votre tour' };
    const from = this.players.find((p) => p.id === fromId);
    const to = this.players.find((p) => p.id === toId);
    if (!to || to.bankrupt || from.bankrupt) return { error: 'Joueur invalide' };
    if (from.id === to.id) return { error: 'Cible invalide' };

    for (const id of giveTitleIds) {
      if (!from.titles.find((t) => t.id === id)) return { error: 'Titre offert non possédé' };
    }
    for (const id of receiveTitleIds) {
      if (!to.titles.find((t) => t.id === id)) return { error: 'Titre demandé non possédé' };
    }
    cash = Math.round(Number(cash) || 0); // >0 : from paie to ; <0 : to paie from
    if (giveTitleIds.length === 0 && receiveTitleIds.length === 0 && cash === 0) {
      return { error: 'Échange vide' };
    }

    this.pendingTrade = { fromId, toId, giveTitleIds, receiveTitleIds, cash };
    this.addLog(`${from.name} propose un échange à ${to.name}`);
    return { success: true, autoTarget: to.isBot ? to : null };
  }

  respondTrade(playerId, accept) {
    const tr = this.pendingTrade;
    if (!tr || tr.toId !== playerId) return { error: 'Aucun échange en attente' };
    const from = this.players.find((p) => p.id === tr.fromId);
    const to = this.players.find((p) => p.id === tr.toId);
    this.pendingTrade = null;

    if (!accept) {
      this.addLog(`${to.name} refuse l'échange de ${from.name}`);
      return { success: true, accepted: false };
    }

    // Validations finales
    for (const id of tr.giveTitleIds) if (!from.titles.find((t) => t.id === id)) return { success: true, accepted: false };
    for (const id of tr.receiveTitleIds) if (!to.titles.find((t) => t.id === id)) return { success: true, accepted: false };

    const fromPays = tr.cash > 0 ? tr.cash : 0;
    const toPays = tr.cash < 0 ? -tr.cash : 0;
    if (from.money < fromPays || to.money < toPays) {
      this.addLog(`Échange annulé : fonds insuffisants`);
      return { success: true, accepted: false };
    }

    // Transfert d'argent
    from.money -= fromPays;
    to.money += fromPays;
    to.money -= toPays;
    from.money += toPays;

    // Transfert des titres
    const moveTitle = (id, owner, receiver) => {
      const idx = owner.titles.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const [title] = owner.titles.splice(idx, 1);
      const deckTitle = this.getTitleById(id);
      if (deckTitle) deckTitle.ownerId = receiver.id;
      receiver.titles.push({ ...title, ownerId: receiver.id });
    };
    tr.giveTitleIds.forEach((id) => moveTitle(id, from, to));
    tr.receiveTitleIds.forEach((id) => moveTitle(id, to, from));

    const cashLabel = tr.cash > 0 ? ` + ${this.formatMoney(fromPays)}` : tr.cash < 0 ? ` (reçoit ${this.formatMoney(toPays)})` : '';
    this.addLog(
      `🔁 Échange conclu : ${from.name} → ${tr.giveTitleIds.length} titre(s)${cashLabel}, ${to.name} → ${tr.receiveTitleIds.length} titre(s)`
    );
    return { success: true, accepted: true };
  }

  cancelTrade(playerId) {
    if (this.pendingTrade && this.pendingTrade.fromId === playerId) {
      this.pendingTrade = null;
      return { success: true };
    }
    if (this.pendingAlliance && this.pendingAlliance.fromId === playerId) {
      this.pendingAlliance = null;
      return { success: true };
    }
    return { error: 'Rien à annuler' };
  }

  getPublicState(forPlayerId) {
    return {
      roomId: this.roomId,
      board: this.board.map((space) => this.boardSpaceWithHints(space)),
      boardPositions: BOARD_POSITIONS,
      boardGrid: BOARD_GRID,
      boardUi: BOARD_UI,
      outerLoopEnd: OUTER_LOOP_END,
      innerLoopStart: INNER_LOOP_START,
      myAlliance: (() => {
        const partners = this.alliancePartnersFor(forPlayerId);
        return partners.length ? { partners } : null;
      })(),
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        pawn: p.pawn,
        equippedDice: p.equippedDice,
        diceStyle: p.diceStyle,
        honorTitle: p.honorTitle || '',
        isBot: p.isBot,
        team: this.canSeeAlliance(forPlayerId, p) || p.id === forPlayerId ? p.team : null,
        allied: this.canSeeAlliance(forPlayerId, p),
        color: p.color,
        money: p.money,
        position: p.position,
        titleCount: p.titles.length,
        // Titres complets visibles de tous (utile pour les échanges) — pas d'info secrète dans ce jeu
        titles: p.titles.map((t) => ({
          id: t.id,
          resourceId: t.resourceId,
          resourceName: t.resourceName,
          country: t.country,
          percent: t.percent,
          price: t.price,
        })),
        joker: p.joker,
        laps: p.laps,
        bankrupt: p.bankrupt,
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      phase: this.phase,
      pendingAction: forPlayerId && this.pendingAction?.playerId === forPlayerId
        ? this.pendingAction
        : this.pendingAction?.type === 'auction'
          ? { type: 'auction', auction: this.auction }
          : null,
      auction: this.auction,
      diceResult: this.diceResult,
      newsReveal: this.lastNewsReveal,
      // Propositions sociales ciblées
      incomingAlliance: this.pendingAlliance && this.pendingAlliance.toId === forPlayerId
        ? { ...this.pendingAlliance, fromName: this.players.find((p) => p.id === this.pendingAlliance.fromId)?.name }
        : null,
      outgoingAlliance: this.pendingAlliance && this.pendingAlliance.fromId === forPlayerId
        ? { ...this.pendingAlliance, toName: this.players.find((p) => p.id === this.pendingAlliance.toId)?.name }
        : null,
      incomingTrade: this.pendingTrade && this.pendingTrade.toId === forPlayerId
        ? { ...this.pendingTrade, fromName: this.players.find((p) => p.id === this.pendingTrade.fromId)?.name }
        : null,
      outgoingTrade: this.pendingTrade && this.pendingTrade.fromId === forPlayerId
        ? { ...this.pendingTrade, toName: this.players.find((p) => p.id === this.pendingTrade.toId)?.name }
        : null,
      log: this.log.slice(0, 20),
      winner: this.winner ? { id: this.winner.id, name: this.winner.name } : null,
      winningTeam: this.winningTeam || null,
    };
  }
}

module.exports = GameEngine;

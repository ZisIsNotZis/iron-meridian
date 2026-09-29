import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'design/factions');
const out = path.join(root, 'design/content/docs/factions');

const q = value => JSON.stringify(String(value));
const clean = value => value.replace(/\r/g, '').trim();
const read = file => clean(fs.readFileSync(path.join(root, file), 'utf8'));
const section = (file, heading) => {
  const text = read(file);
  const match = text.match(new RegExp(`^## ${heading}\\n\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return match ? clean(match[1]) : '';
};
const bullets = text => [...text.matchAll(/^- (.+)$/gm)].map(match => clean(match[1]));
const flow = values => `[${values.map(q).join(', ')}]`;
const write = (file, data) => {
  const lines = [];
  const emit = (value, indent) => {
    const pad = ' '.repeat(indent);
    if (Array.isArray(value)) {
      lines.push(`${pad}${flow(value)}`);
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (child === undefined || child === null || child === '' || (Array.isArray(child) && !child.length)) continue;
        if (Array.isArray(child) && child.every(item => typeof item !== 'object')) lines.push(`${pad}${key}: ${flow(child)}`);
        else if (typeof child === 'object' && !Array.isArray(child)) { lines.push(`${pad}${key}:`); emit(child, indent + 2); }
        else if (Array.isArray(child)) {
          lines.push(`${pad}${key}:`);
          for (const item of child) {
            if (typeof item !== 'object') lines.push(`${pad}  - ${q(item)}`);
            else {
              const entries = Object.entries(item).filter(([, itemValue]) => itemValue !== undefined && itemValue !== null && itemValue !== '');
              const [firstKey, firstValue] = entries[0];
              if (Array.isArray(firstValue)) lines.push(`${pad}  - ${firstKey}: ${flow(firstValue)}`);
              else if (firstValue && typeof firstValue === 'object') { lines.push(`${pad}  - ${firstKey}:`); emit(firstValue, indent + 6); }
              else lines.push(`${pad}  - ${firstKey}: ${q(firstValue)}`);
              for (const [itemKey, itemValue] of entries.slice(1)) {
                if (Array.isArray(itemValue)) lines.push(`${pad}    ${itemKey}: ${flow(itemValue)}`);
                else lines.push(`${pad}    ${itemKey}: ${q(itemValue)}`);
              }
            }
          }
        } else lines.push(`${pad}${key}: ${q(child)}`);
      }
    }
  };
  emit(data, 0);
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, `${lines.join('\n')}\n`);
};

const id = (faction, platform, name) => `factions.${faction}.${platform}.${name}`;
const entry = (object, status, decision, platform, intent = '') => ({object, platform, status, decision, intent});
const platformEntry = (faction, platform, name, status, decision) => ({object: id(faction, platform, name), status, decision});

const factionIndex = {
  display_name: 'Faction Design Index',
  description: 'Shared faction ownership, balance hypotheses, and roster targets for Iron Meridian.',
  source_document: 'design/factions/README.md',
  canonical_factions: [
    {faction: 'factions.directorate', description: 'The centralized successor government.'},
    {faction: 'factions.coalition', description: 'The regional treaty seeking a renewed federation.'},
    {faction: 'factions.irregular_network', description: 'The hidden minor network of cells and defectors.'},
  ],
  shared_role_matrix: [
    {directorate_answer: 'Rifle Squad', coalition_pressure: 'Line Rifle; scout and screen', intended_exchange: 'Both occupy ground; Coalition repositions better, Directorate replaces more comfortably.'},
    {directorate_answer: 'Bastion', coalition_pressure: 'Valiant MBT; mobility and flank', intended_exchange: 'Directorate wins a prepared frontal hold; Coalition wins time and angle.'},
    {directorate_answer: 'Lancer', coalition_pressure: 'Halberd Tank Destroyer; armor commitment', intended_exchange: 'Both punish exposed armor; each specialist is vulnerable when screened or flanked.'},
    {directorate_answer: 'Sentinel', coalition_pressure: 'Lynx Scout Car; information', intended_exchange: 'Directorate scout is durable enough to survive contact; Coalition scout is better at disengaging. Neither reveals hidden space for free.'},
    {directorate_answer: 'Ballista', coalition_pressure: 'Longbow or Peregrine; static pressure', intended_exchange: 'Siege creates a warning and setup opportunity; mobile pressure can force it to relocate.'},
    {directorate_answer: 'Warden', coalition_pressure: 'Kodiak or Skyguard; air defense', intended_exchange: 'Future air counters remain role-readable; neither is a V1 requirement.'},
  ],
  roster_targets: {
    infantry: '6–8',
    combat_support_ground_vehicles: '8–10 excluding MCV and Harvester',
    aircraft: '4–6',
    naval: '3–5',
    high_tech: '2–4 defining high-tech units',
  },
  balance_rules: [
    'Factions share battlefield grammar—roles and readable counter relationships—not default units.',
    'Both factions can open with line presence, scouting, a durable body, and an anti-armor answer.',
    'No single opening unit defeats all four shared battlefield roles.',
    'Coalition mobility creates exposure and replacement cost, while Directorate durability creates redeployment and logistics cost.',
    'Objective income is a timing advantage, not a replacement for home economy.',
    'A losing player has at least one visible recovery path through defense, retreat, production, or a raid.',
    'Playtest records time-to-first-contact, first objective arrival, first production loss, and comeback frequency before changing unit values.',
  ],
  ownership: {
    faction_records: 'Faction identity, doctrine, background, and faction-wide presentation live in each faction runtime record and its typed documentation records.',
    entity_records: 'Concrete unit and building records live under design/content/factions/<faction>/<platform>/ and own individual values and entity presentation.',
    shared_rules: 'Political context, shared counter vocabulary, combat, and reusable type documents remain in their canonical world and system documents.',
  },
};
write('index.yml', factionIndex);

const factionInfo = {
  coalition: {
    name: 'Coalition',
    description: 'A treaty among regional governments, reformist officers, port authorities, and industrial cities rejecting Directorate rule.',
    source: 'design/factions/coalition',
    doctrine_summary: 'Information, mobility, and combined-arms adaptation.',
    strengths: ['scouting', 'communications', 'mobility', 'flexible production', 'precision', 'rapid response'],
    weaknesses: ['frontal attrition', 'isolated operations', 'vulnerable high-value support systems'],
    future_direction: [
      'Buildings should be distributed and informative.',
      'Infantry should be adaptable.',
      'Vehicles should be mobile and missile-oriented.',
      'Aircraft should be varied and information-dependent.',
      'Naval forces should be fast with strong sea denial.',
      'High technology should be information and mobility solutions with meaningful setup and positioning demands.',
    ],
    context: ['The treaty’s origin, members, and political objective are faction-owned background.', 'Insignia, palette, regional material language, voice, and audio are faction-owned identity.', 'Strategic habits, production philosophy, and bounded information dependence are faction-owned doctrine.', 'The distributed information-and-response infrastructure roster is faction-owned building context.'],
    roster_policy: ['Core units form the normal faction grammar.', 'Optional units add map or matchup choices.', 'Deferred candidates remain outside the current roster until playtests prove a gap.'],
    balance_position: ['Coalition is not merely faster Directorate forces.', 'Its shared roles are expressed through reconnaissance, communications, precision, mobility, and rapid adaptation.', 'Its costs are lighter protection, expensive replacement, and dependence on information and support networks.'],
    campaign_role: ['Near-term campaign missions can reveal identity through distributed briefings, local objectives, and choices about which infrastructure to protect.', 'The faction becomes playable when its information-and-mobility doctrine can be expressed without a mandatory network dependency.'],
    matchup_rules: ['Information support improves warning, coordination, and precision; it never becomes a prerequisite for ordinary movement or fire.', 'A disconnected force is less effective in its preferred doctrine, not disabled.', 'Against the Directorate, split the formation, raid harvest and repair routes, and force the heavy player to turn.', 'Against the Irregular Network in far vision, reconnaissance and local trust help verify threats, but false signatures and temporary sites still create attention costs.'],
    canonical_content: ['factions.coalition', 'design/content/factions/coalition/<platform>/'],
    symbols: ['The Coalition mark is a three-part open ring joined by a small bridge.', 'The separated arcs represent regional members; the bridge represents treaty and shared infrastructure without erasing local identity.', 'The mark must remain legible as a small stencil, map marker, and interface badge.', 'Avoid real-world national symbols, alliance marks, or borrowed faction iconography.'],
    wordmark: 'A clean humanist grotesk with one deliberately open letterform; regional units may carry local abbreviations, but the shared mark remains visually dominant in official Coalition material.',
    scope: ['Identity owns faction identity principles; individual gameplay belongs in unit records and global presentation rules remain global.', 'The treaty’s politics are authored context, not a diplomacy simulator.', 'More regional factions, elections, and coalition votes remain possible campaign material only after the core solo game proves its value.'],
    visual: section('design/factions/coalition/assets.md', 'Visual language'),
    audio: section('design/factions/coalition/assets.md', 'Audio, FX, animation'),
    near_term: section('design/factions/coalition/assets.md', 'Near-term presentation rules'),
  },
  directorate: {
    name: 'Directorate',
    description: 'The emergency government of security ministries, central industrial boards, and loyal garrisons.',
    source: 'design/factions/directorate',
    doctrine_summary: 'Mass, armor, and planned pressure.',
    strengths: ['durability', 'heavy production', 'defenses', 'repair', 'concentrated attacks'],
    weaknesses: ['redeployment', 'exposed centralized logistics', 'visibility', 'raids'],
    future_direction: ['Buildings should be compact and durable.', 'Infantry should be disciplined.', 'Vehicles should be tracked and deliberate.', 'Aircraft should be tough and attack-run oriented.', 'Naval forces should be heavy with shore support.', 'High technology should be industrial solutions: powerful, visible, slow, and preparation-dependent.'],
    context: ['The institutional origin, internal factions, and political objective are faction-owned background.', 'Insignia, palette, uniforms, material language, voice, and audio are faction-owned identity.', 'Strategic habits, production philosophy, and readable strengths/costs are faction-owned doctrine.', 'The compact industrial-fortress infrastructure roster is faction-owned building context.'],
    roster_policy: ['Core units are expected to form the playable army.', 'Optional units are valid roster pieces for later maps, modes, or balance needs.', 'Deferred/rejected candidates remain excluded because another unit owns the decision or maintenance burden is too high.'],
    balance_position: ['Directorate is not merely higher-stat Coalition.', 'Its shared roles are expressed through concentration, armor, central command, repair, and planned attack sequences.', 'Its costs are visible logistics, slow redeployment, and vulnerable support concentration.'],
    campaign_role: ['V1 uses the Directorate as an abstract mirror-match military grammar.', 'Near-term campaign missions can reveal it through orders, supply decisions, and aftermaths before asking the player to judge its legitimacy.'],
    matchup_rules: ['Against the Coalition, deny scouting angles, punish overextension, and force a direct contest where armor and preparation matter.', 'Against the Irregular Network in far vision, protect routes and verify apparent victories; a cleared position is not necessarily a safe position.', 'The Network should challenge attention and logistics, not invalidate a prepared army with universal stealth.'],
    canonical_content: ['factions.directorate', 'design/content/factions/directorate/<platform>/'],
    symbols: ['The Directorate mark is a closed iron chevron enclosing a small vertical meridian bar.', 'The chevron reads as protection and command; the bar preserves the Union’s geographic symbol while making it rigid and centralized.', 'The mark must work as a one-color stencil on crates, a small HUD badge, and a formal seal.', 'It must not resemble a real-world flag, extremist insignia, or borrowed RTS faction logo.'],
    wordmark: 'Square, condensed capitals with measured spacing and a restrained serial-stencil detail; formal labels favor function and numbering over ornament.',
    scope: ['Identity owns faction identity principles; individual gameplay belongs in unit records and global presentation rules remain global.', 'The Directorate does not receive a separate internal-politics simulation.', 'Rival ministries, defections, and reforms are authored story pressures or campaign choices, not another resource layer.'],
    visual: section('design/factions/directorate/assets.md', 'Visual language'),
    audio: section('design/factions/directorate/assets.md', 'Audio, FX, animation'),
    near_term: section('design/factions/directorate/assets.md', 'Near-term presentation rules'),
  },
};

for (const [faction, info] of Object.entries(factionInfo)) {
  const base = `design/factions/${faction}`;
  write(`${faction}/index.yml`, {
    display_name: info.name,
    description: info.description,
    source_document: `${base}/README.md`,
    doctrine_summary: info.doctrine_summary,
    strengths: info.strengths,
    weaknesses: info.weaknesses,
    future_direction: info.future_direction,
    canonical_context: info.context,
    roster_policy: info.roster_policy,
    balance_position: info.balance_position,
    campaign_role: info.campaign_role,
    matchup_rules: info.matchup_rules,
    canonical_content: info.canonical_content,
    scope: info.scope,
  });
  const bg = {
    display_name: `${info.name} Background`, description: `Narrative background for the ${info.name}.`, source_document: `${base}/background.md`,
    origin: section(`${base}/background.md`, 'Origin'), public_claim: section(`${base}/background.md`, 'Public claim'),
    internal_conflict: section(`${base}/background.md`, 'Internal conflict'),
    story_posture: [section(`${base}/background.md`, 'V1 and near-term use')],
    scope_use: [section(`${base}/background.md`, 'Far-vision boundary')],
  };
  write(`${faction}/background.yml`, bg);
  const doctrine = {
    display_name: `${info.name} Doctrine`, description: `Strategic doctrine for the ${info.name}.`, source_document: `${base}/doctrine.md`,
    strategic_idea: section(`${base}/doctrine.md`, 'Strategic idea'), battlefield_habits: bullets(section(`${base}/doctrine.md`, 'Battlefield habits')),
    production_philosophy: section(`${base}/doctrine.md`, 'Production philosophy'), economy_identity: info.name === 'Coalition'
      ? 'Information support improves warning, coordination, and precision; it never becomes a prerequisite for ordinary movement or fire. A disconnected force is less effective in its preferred doctrine, not disabled.'
      : 'The economy is not intrinsically more efficient. The trade is reliability for tempo: a Directorate player spends time establishing a strong package and risks losing that investment to raids or a forced redeployment.',
    matchup_expression: section(`${base}/doctrine.md`, 'Matchup expression'), exclusions: [section(`${base}/doctrine.md`, 'What the doctrine does not mean')],
  };
  write(`${faction}/doctrine.yml`, doctrine);
  write(`${faction}/identity.yml`, {
    display_name: `${info.name} Identity`, description: `Identity principles for the ${info.name}.`, source_document: `${base}/identity.md`,
    symbols: info.symbols, wordmark: info.wordmark, scope: info.scope,
  });
  write(`${faction}/assets.yml`, {
    display_name: `${info.name} Assets`, description: `Faction-wide presentation language for the ${info.name}.`, source_document: `${base}/assets.md`,
    visual_language: info.visual, audio_language: info.audio, fx_language: info.audio, animation_rules: info.audio, near_term_rules: info.near_term,
  });
}

const coalitionUnits = [
  entry(id('coalition','infantry','pathfinder'),'core','Spend stealth and speed to obtain vision or preserve the scout.','infantry'), entry(id('coalition','infantry','line_rifle'),'core','Hold ground cheaply or reposition before the line collapses.','infantry'), entry(id('coalition','infantry','breach_team'),'core','Risk a close approach for structure and garrison disruption.','infantry'), entry(id('coalition','infantry','javelin_team'),'core','Reveal the ambush and fire immediately, or hold lock for a stronger volley.','infantry'), entry(id('coalition','infantry','combat_medic'),'core','Keep a damaged screen in the fight or retreat before the medic is exposed.','infantry'), entry(id('coalition','infantry','signal_officer'),'core','Commit a fragile force multiplier to a forward position or preserve it.','infantry'), entry(id('coalition','infantry','saboteur'),'optional','Trade combat presence for a timed base disruption.','infantry'),
  entry(id('coalition','vehicles','mcv'),'core','Relocate construction origin while risking the production backbone.','vehicle'), entry(id('coalition','vehicles','harvester'),'core','Choose a rich route and escort or return early under pressure.','vehicle'), entry(id('coalition','vehicles','lynx_scout_car'),'core','Use speed and vision to find a route, then disengage before contact.','vehicle'), entry(id('coalition','vehicles','kodiak_ifv'),'core','Carry line infantry while choosing when to expose the transport.','vehicle'), entry(id('coalition','vehicles','valiant_mbt'),'core','Hold a lane for a precision push or preserve movement to avoid being surrounded.','vehicle'), entry(id('coalition','vehicles','halberd_tank_destroyer'),'core','Commit a missile angle against armor without accepting a frontal brawl.','vehicle'), entry(id('coalition','vehicles','peregrine_missile_carrier'),'core','Reposition long-range precision fire before counterattack.','vehicle'), entry(id('coalition','vehicles','atlas_relay_truck'),'core','Place a relay where it improves a response without making the force dependent.','vehicle'), entry(id('coalition','vehicles','mender_repair_vehicle'),'core','Keep damaged assets in the fight or withdraw the exposed repair platform.','vehicle'), entry(id('coalition','vehicles','roadrunner_skirmisher'),'core','Harass a flank and escape before heavier answers arrive.','vehicle'), entry(id('coalition','vehicles','mastiff_amphibious_carrier'),'optional','Turn shoreline access into an infantry angle at the cost of direct naval power.','vehicle'), entry(id('coalition','vehicles','longbow_siege_tank'),'optional','Trade setup and a visible firing position for mobile area denial.','vehicle'),
  entry(id('coalition','aircraft','kestrel_interceptor'),'core','Guard the force or spend fuel and time chasing enemy aircraft.','aircraft'), entry(id('coalition','aircraft','osprey_gunship'),'core','Loiter for sustained support while accepting anti-air exposure.','aircraft'), entry(id('coalition','aircraft','swiftwing_strike_jet'),'core','Commit a precise attack run or preserve the sortie for a better opening.','aircraft'), entry(id('coalition','aircraft','heron_vtol_transport'),'core','Create a sudden infantry angle while risking a valuable transport.','aircraft'), entry(id('coalition','aircraft','watcher_uav'),'optional','Buy persistent information with a fragile, low-damage asset.','aircraft'), entry(id('coalition','aircraft','stormlance_precision_bomber'),'optional','Telegraph a decisive strike and force movement, or hold it for a key target.','aircraft'),
  entry(id('coalition','naval','swift_torpedo_boat'),'core','Use speed to threaten a capital target or retreat before screening fire catches it.','naval'), entry(id('coalition','naval','guardian_missile_corvette'),'core','Hold a protected denial zone or advance and expose the corvette.','naval'), entry(id('coalition','naval','seawatch_submersible'),'core','Stay hidden for a surprise strike or surface/retreat when detected.','naval'), entry(id('coalition','naval','tideway_landing_craft'),'optional','Turn water access into an infantry flank, or spend the slot on direct naval power.','naval'),
];
const directorateUnits = [
  entry(id('directorate','infantry','rifle_squad'),'core','Occupy ground cheaply or preserve a screen.','infantry'), entry(id('directorate','infantry','breach_team'),'core','Risk short-range assault against armor and structures.','infantry'), entry(id('directorate','infantry','shock_troopers'),'core','Trade mobility for a durable anti-armor line.','infantry'), entry(id('directorate','infantry','rocket_section'),'core','Expose a slow team for long-range anti-vehicle/air fire.','infantry'), entry(id('directorate','infantry','combat_engineer'),'core','Spend a scarce body on capture, repair, or fortification.','infantry'), entry(id('directorate','infantry','field_marshal'),'core','Commit a fragile command aura to a planned push.','infantry'), entry(id('directorate','infantry','riot_section'),'optional','Lock down infantry approaches at the cost of reach.','infantry'), entry(id('directorate','infantry','siege_grenadiers'),'optional','Set up area denial instead of carrying rifle DPS.','infantry'),
  entry(id('directorate','vehicles','mcv'),'core','Relocate the construction origin while risking the production backbone.','vehicle'), entry(id('directorate','vehicles','harvester'),'core','Choose a rich route and escort or return early under pressure.','vehicle'), entry(id('directorate','vehicles','sentinel'),'core','Scout ahead with a fragile fast vehicle or keep it safe.','vehicle'), entry(id('directorate','vehicles','bastion'),'core','Anchor a line and accept slow redeployment.','vehicle'), entry(id('directorate','vehicles','lancer'),'core','Use a precise anti-armor shot from a vulnerable platform.','vehicle'), entry(id('directorate','vehicles','hammerhead'),'core','Close distance for crushing assault damage.','vehicle'), entry(id('directorate','vehicles','bulwark'),'core','Brace the formation and lose mobility for protection.','vehicle'), entry(id('directorate','vehicles','ballista'),'core','Prepare indirect fire while opponents hunt the setup.','vehicle'), entry(id('directorate','vehicles','warden'),'core','Spend attention on mobile anti-air coverage.','vehicle'), entry(id('directorate','vehicles','recovery_carrier'),'core','Pull damaged assets out or keep fighting without repair.','vehicle'), entry(id('directorate','vehicles','aegis_carrier'),'core','Protect a formation from air at the cost of ground pressure.','vehicle'), entry(id('directorate','vehicles','mastodon'),'optional','Make a slow strategic breakthrough target.','vehicle'), entry(id('directorate','vehicles','mobile_command_post'),'optional','Extend construction and command forward while exposing logistics.','vehicle'),
  entry(id('directorate','aircraft','vulture'),'core','Reveal targets with a lightly armed reconnaissance pass.','aircraft'), entry(id('directorate','aircraft','interceptor'),'core','Spend loiter time and ammunition-equivalent cooldown on air control.','aircraft'), entry(id('directorate','aircraft','atlas_gunship'),'core','Commit to a slow orbit over a threatened formation.','aircraft'), entry(id('directorate','aircraft','firestorm_bomber'),'core','Telegraph a destructive run and risk the return path.','aircraft'), entry(id('directorate','aircraft','skyhammer'),'core','Use a heavy standoff strike against armored or structural targets.','aircraft'),
  entry(id('directorate','naval','monitor'),'core','Trade speed for shore bombardment and armor.','naval'), entry(id('directorate','naval','missile_corvette'),'core','Keep distance for flexible pressure or enter danger.','naval'), entry(id('directorate','naval','hunter_submarine'),'core','Remain hidden and accept sonar/counter-detection risk.','naval'), entry(id('directorate','naval','landing_barge'),'core','Move a ground force safely but create a valuable escort target.','naval'),
];

const platformMeta = {
  coalition: {
    infantry: {title:'Coalition Infantry', description:'Cheap enough to occupy, scout, screen, capture, and create vision.', constraints:['Skills are short and readable.', 'Ordinary commands do not require a relay.', 'Core roles cover reconnaissance, line presence, breach, anti-armor, sustainment, and command support.']},
    vehicles: {title:'Coalition Vehicles', description:'Mobile vehicles express reconnaissance, adaptation, missile pressure, repair, and bounded support.', constraints:['MCV and Harvester are core utility vehicles.', 'The roster uses one command-support vehicle, one repair vehicle, and one main artillery line to avoid support duplication.', 'Mobility pays in armor, range, ammunition, setup, or replacement cost.']},
    aircraft: {title:'Coalition Aircraft', description:'Fast-response tools whose information advantage is expressed through designation, warning, and target selection.', constraints:['The network is not an invisible requirement for aircraft or ordinary orders.', 'Transport, attack-run, and aircraft lifecycle behavior remain shared.']},
    naval: {title:'Coalition Naval Units', description:'Sea-denial and route-control units that are map-dependent rather than a second copy of the ground army.', constraints:['Surface and submerged rules remain shared.', 'Landing craft use shared transport operations.']},
  },
  directorate: {
    infantry: {title:'Directorate Infantry', description:'Replaceable ground presence that holds prepared lines and secures support for heavier formations.', constraints:['Infantry use personnel protection unless a card says otherwise.', 'Eligible vehicles can crush them in ordinary states.', 'They can enter transports and selected structures and use foot locomotion.', 'Squad member counts are presentation and balance details, not separate simulation entities.']},
    vehicles: {title:'Directorate Vehicles', description:'The main expression of planned pressure: scout, line tank, assault tank, anti-armor, siege, repair, anti-air, and utility vehicles.', constraints:['MCV and Harvester are core utility vehicles and excluded from the combat count.', 'The core combat roster has one clear unit for each named job; optional units deepen doctrine without duplicating those jobs.']},
    aircraft: {title:'Directorate Aircraft', description:'Durable, visible attack-run tools that support a prepared front.', constraints:['Aircraft do not erase the need for anti-air or airfield protection.', 'Aircraft use fixed-wing or helicopter locomotion as specified by their cards.', 'Air Command owns one FIFO queue and one launch/recovery apron.']},
    naval: {title:'Directorate Naval Units', description:'A compact surface/submerged set for water-relevant maps, not required for the first vertical slice.', constraints:['All listed ships are produced by the Naval Yard.', 'Surface ships use naval-surface targetability; the submarine uses submerged targetability except while surfacing or firing.', 'Landing Barge uses shared transport operations.']},
  },
};

for (const [faction, units] of Object.entries({coalition: coalitionUnits, directorate: directorateUnits})) {
  const base = `design/factions/${faction}`;
  const all = units.map(({platform, ...rest}) => ({...rest, platform}));
  const shared = faction === 'coalition'
    ? ['Information is an advantage, not a prerequisite. Relay bonuses improve range, lock quality, warning, or coordination; disconnected units retain baseline weapons and orders.', 'Mobility has a bill. Fast units pay in armor, range, ammunition, setup, or replacement cost.', 'Precision creates focus-fire decisions. Attacks reward designation and timing but lose efficiency when line of sight, lock, or communication is broken.', 'Adaptation is bounded. A unit changes stance or task through one readable skill; it does not become every counter at once.']
    : ['Every unit owns one clear player decision.', 'Directorate skills are usually preparation, bracing, deployment, coordinated fire, or recovery.', 'Support is concentrated enough to raid, but never split across several nearly identical support vehicles.'];
  write(`${faction}/units/index.yml`, {
    display_name: `${faction[0].toUpperCase()}${faction.slice(1)} Units`, description: `${faction[0].toUpperCase()}${faction.slice(1)} canonical candidate roster and doctrine index.`, source_document: `${base}/units/README.md`,
    opening_rule: faction === 'coalition' ? 'Core units form the normal faction grammar; optional units add map or matchup choices; deferred candidates remain outside the current roster until playtests prove a gap.' : 'Core units are expected to form the playable army; optional units are later-map or matchup choices; deferred/rejected candidates are deliberately excluded.',
    roster_policy: faction === 'coalition' ? ['The roster is a complete design target, not a promise that every unit ships in the first vertical slice.', 'Shared roles are expressed through distinct equipment and bounded adaptation.'] : ['Core is expected playable content.', 'Optional is valid later content and should not all be added by default.', 'Deferred/rejected means another unit owns the decision or maintenance burden is too high.'],
    entries: all,
    roster_coverage: faction === 'coalition' ? ['Recon: Pathfinder, Lynx, Watcher.', 'Line and assault: Line Rifle, Kodiak, Valiant, Osprey.', 'Anti-armor: Javelin, Halberd, Peregrine, Swift Torpedo Boat.', 'Support and force multiplication: Combat Medic, Signal Officer, Atlas, Mender, Heron.', 'Infiltration and disruption: Breach Team, Saboteur, Roadrunner, Seawatch.', 'Precision and siege: Swiftwing, Stormlance, Longbow.', 'Air and naval denial: Kestrel, Guardian, Swift Torpedo Boat.'] : ['The core infantry line covers cheap presence, breach, durable anti-armor, long-range fire, engineering, and command.', 'The core vehicle line covers utility, scouting, line armor, assault, anti-armor, bracing, siege, anti-air, repair, and air defense.', 'The aircraft line covers reconnaissance, air control, close support, area denial, and heavy strike.', 'The naval line covers shore bombardment, flexible missile pressure, submerged attack, and landing transport.'],
    shared_constraints: shared,
    production_relationships: faction === 'coalition' ? ['The Coalition is not gated by a communications network; relays improve ordinary units but a force remains functional when disconnected.', 'Production references shared objects in the production design.'] : ['The Construction Yard deploys the MCV; the Ore Refinery supports the Harvester; Barracks, Vehicle Plant, Air Command, and Naval Yard own their normal queues.', 'Advanced units require only operational tech structures named on their cards.', 'No unit requires a support network merely to use ordinary weapons.'],
    rejected_candidates: faction === 'coalition' ? ['Permanent stealth assassin; drone-swarm infantry.', 'Separate command tank; second repair platform; universal captured-unit chassis.', 'Permanent loiter drone cloud; aircraft with no clear counter.', 'Full carrier line; naval-only support network.'] : ['Dedicated medic: Recovery Carrier owns sustainment.', 'Separate command relay infantry: Field Marshal owns command coordination.', 'Second repair vehicle or naval repair ship: Recovery Carrier is the single repair/recovery role.', 'Second artillery vehicle: Ballista owns mobile indirect fire.', 'Drone swarm carrier: deferred until a separate economy and targeting burden is justified.', 'Dedicated airship: deferred until a slow airborne siege gap is proven.'],
  });
  for (const platform of ['infantry','vehicles','aircraft','naval']) {
    const meta = platformMeta[faction][platform];
    write(`${faction}/units/${platform}.yml`, {display_name: meta.title, description: meta.description, source_document: `${base}/units/${platform}/README.md`, platform_constraints: meta.constraints, entries: units.filter(item => item.platform === platform).map(({platform: _, ...item}) => item)});
  }
}

const buildings = {
  coalition: [
  entry(id('coalition','buildings','coalition_hq'),'core','Preserve the political command center; its destruction is the normal loss condition.','building','Base anchor; medium footprint with exposed service side.'),
    entry(id('coalition','buildings','resource_exchange'),'core','Place the processor where information and mobility can protect unloading rather than relying on armor.','building','Economy/processor; medium footprint with multiple approach lanes.'), entry(id('coalition','buildings','infantry_center'),'core','Produce adaptable infantry and one queue of field specialists.','building','Infantry production; small footprint.'), entry(id('coalition','buildings','vehicle_assembly'),'core','Field mobile armor and support at the cost of fragile throughput.','building','Ground production; medium footprint with rapid exits.'), entry(id('coalition','buildings','air_operations'),'core','Launch fast response aircraft and reveal the commitment through a visible runway/apron.','building','Aircraft production; medium apron footprint.'), entry(id('coalition','buildings','littoral_dock'),'core','Turn coast access into sea denial and transport; it is irrelevant on land-only maps.','building','Naval production; shoreline footprint.'), entry(id('coalition','buildings','signals_laboratory'),'core','Unlock designation and precision options, without making disconnected units unusable.','building','Advanced doctrine; medium footprint.'), entry(id('coalition','buildings','mobility_workshop'),'core','Unlock one rapid-response or amphibious line and a bounded redeployment tool.','building','Advanced logistics; medium footprint.'), entry(id('coalition','buildings','field_hospital'),'core','Heal living infantry locally, trading a vulnerable support site for staying power; does not revive.','building','Infantry sustainment; compact footprint.'), entry(id('coalition','buildings','sensor_mast'),'core','Provide local vision and a bounded designation action; it deals no automatic damage.','building','Detection/designation; tall compact footprint.'), entry(id('coalition','buildings','guardian_turret'),'core','Cover a chosen route with precision missiles; flanking and infantry pressure remain answers.','building','Static anti-vehicle defense; compact directional footprint.'), entry(id('coalition','buildings','skyguard_node'),'core','Protect a local airspace sector; its missiles do not become a global umbrella.','building','Static anti-air defense; compact footprint.'), entry(id('coalition','buildings','relay_station'),'optional','Improve warning, lock quality, and designation nearby while exposing a valuable, non-mandatory target.','building','Temporary forward information site; medium footprint.'), entry(id('coalition','buildings','precision_battery'),'optional','Trade setup and a visible firing position for long-range area denial on maps with enough open space.','building','Static indirect support; large footprint.'),
  ],
  directorate: [
    entry(id('directorate','buildings','construction_yard'),'core','Keep the command origin safe or extend construction toward danger; its destruction is the normal HQ loss condition.','building','Base anchor; large, central footprint.'), entry(id('directorate','buildings','ore_refinery'),'core','Choose a safe unloading site and protect the harvester loop; it repairs docked harvesters but does not create passive income.','building','Economy/processor; medium footprint beside processor route.'), entry(id('directorate','buildings','barracks'),'core','Maintain replaceable infantry and engineers through one queue.','building','Infantry production; small footprint.'), entry(id('directorate','buildings','vehicle_plant'),'core','Commit the base to armored pressure and replace the construction vehicle when enabled.','building','Ground production; large footprint with marked exits.'), entry(id('directorate','buildings','air_command'),'core','Invest in durable, deliberate air support; its apron is a raidable access point.','building','Aircraft production; medium footprint with landing apron.'), entry(id('directorate','buildings','naval_yard'),'core','Convert shoreline access into heavy patrol and landing pressure; unavailable on land-only maps.','building','Naval production; shoreline footprint.'), entry(id('directorate','buildings','heavy_works'),'core','Unlock one preparation-heavy advanced vehicle or aircraft line; expensive and exposed, never a generic stat buff.','building','Advanced production/doctrine; large footprint.'), entry(id('directorate','buildings','munitions_foundry'),'core','Unlock Siege Grenadiers and high-commitment strike families; losing it removes new orders, not existing units.','building','Advanced weapons support; medium footprint.'), entry(id('directorate','buildings','recovery_depot'),'core','Repair and recover vehicles at a forward location, trading a valuable fixed target for endurance.','building','Repair/logistics; medium footprint with service apron.'), entry(id('directorate','buildings','garrison_blockhouse'),'core','Hold a narrow infantry approach; weak against armor, indirect fire, and flanking.','building','Static anti-personnel defense; compact footprint.'), entry(id('directorate','buildings','aegis_emplacement'),'core','Protect a local zone from aircraft; it cannot protect the whole map or fight ground armor well.','building','Static anti-air defense; compact footprint.'), entry(id('directorate','buildings','ballistic_bastion'),'optional','Anchor a route with a slow-turning heavy cannon; its firing arc and blind side invite flanking.','building','Static anti-vehicle defense; large, directional footprint.'), entry(id('directorate','buildings','forward_command_post'),'optional','Extend planned pressure and construction reach, but make a slow, valuable outpost that can be isolated.','building','Forward construction/command site; medium footprint.'),
  ],
};
for (const [faction, entries] of Object.entries(buildings)) {
  const base = `design/factions/${faction}`;
  const coalition = faction === 'coalition';
  write(`${faction}/buildings/index.yml`, {
    display_name: `${faction[0].toUpperCase()}${faction.slice(1)} Buildings`, description: coalition ? 'Distributed information-and-response network roster.' : 'Compact industrial-fortress infrastructure roster.', source_document: `${base}/buildings/README.md`,
    roster_target: coalition ? '14 buildings: 12 core and 2 optional.' : '13 buildings: 11 core and 2 optional.', entries,
    production_relationships: coalition ? ['Coalition HQ, Resource Exchange, Infantry Center, Vehicle Assembly, Air Operations, and Littoral Dock form the normal production spine.', 'Signals Laboratory and Mobility Workshop are narrow advanced gates, not a general tier ladder.', 'Field Hospital services infantry; Sensor Mast provides information only; Relay Station improves nearby coordination but baseline weapons, movement, and commands work when it is destroyed or out of range.', 'Precision Battery is one artillery decision, not a second artillery tree.'] : ['Construction Yard, Ore Refinery, Barracks, Vehicle Plant, Air Command, and Naval Yard form the normal production spine.', 'Heavy Works and Munitions Foundry are explicit advanced gates, not a general tier ladder.', 'Recovery Depot repairs living vehicles and services Recovery Carrier; it does not revive units or stack with another repair source.', 'Production buildings are non-combat structures unless their cards explicitly declare a defense weapon.'],
    defense_rules: coalition ? ['Guardian Turret threatens vehicles in a declared sector but is vulnerable to infantry, flanking, and indirect fire.', 'Skyguard Node threatens aircraft in a declared local zone but is poor against ground assault and can be outranged or disabled through normal counterplay.', 'Sensor Mast and Relay Station are structure-domain targets; information is valuable because the sites are visible and destructible.', 'The Coalition has no hidden global targeting and no requirement that every unit remain connected.'] : ['Garrison Blockhouse threatens personnel and light targets at close range; armor or indirect fire breaks it.', 'Aegis Emplacement threatens aircraft in its declared local zone; ground assault and artillery remain counters.', 'Ballistic Bastion threatens heavy/light ground targets from a narrow arc; scouts, smoke/line-of-sight play, flanking, and indirect fire expose its weakness.', 'The Directorate does not hide defenses underground or connect them to a power network.'],
    construction_identity: coalition ? ['Blueprints use white/blue holographic survey lines and temporary scaffold frames.', 'Operational sites favor modular panels, solar cloth, antenna arrays, and painted evacuation routes.', 'Sensor and relay effects are narrow cones, pulses, and line links that terminate at the site boundary.', 'Defense warnings use clean directional chevrons, lock tones, and restrained projectile trails.', 'Damage presentation is exposed cabling, fractured panels, and blinking status lights.'] : ['Construction is a visible gantry, steel slab, and crane sequence.', 'Production buildings show thick armored doors, painted route markings, and amber queue lights.', 'Defenses expose barrel travel, traverse limits, and muzzle flash.', 'Blueprint overlays use rectilinear red alignment marks; operational structures emit low mechanical hum and disciplined warning klaxons.', 'Damage adds smoke, sparks, and intermittent industrial light; the HQ destruction event is the only base-wide dramatic effect.'],
    scope_decisions: coalition ? ['Core: the 12 core entries form the complete normal Coalition base.', 'Optional: Relay Station and Precision Battery need map and matchup evidence before shipping by default.', 'Deferred: mobile construction, full network simulation, power, walls, carrier production, permanent drone clouds, and global precision bonuses.', 'Rejected: separate command tank/relay web, duplicate repair structures, and passive percentage auras.'] : ['Core: the 11 core entries are the coherent conventional roster.', 'Optional: Ballistic Bastion and Forward Command Post require map or matchup evidence.', 'Deferred: airship mooring with the deferred Skyhammer airship concept; full wall systems, power, multiple construction queues, naval repair ships, a second detection network, and superweapons.', 'Rejected: passive adjacency bonuses, global command auras, and duplicate repair/artillery structures.'],
  });
}

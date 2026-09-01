# Iron Meridian

Iron Meridian is an original, serious-but-fun real-time strategy game inspired by the readable command and combined-arms decisions of classic base-building RTS games.

## Rule zero

The project’s decision order is: make a good game; minimize implementation and maintenance burden; make the result easy to extend and mod; then pursue striking graphics and visual effects within moderate CPU/GPU usage. A lower-priority goal may not damage a higher-priority one.

## Scope terms

**V1**:
The first playable vertical slice. Its authoritative contents, exclusions, and
acceptance gates are in [V1 Scope](design/content/docs/global/v1.yml).

**First playable**:
An older synonym for V1; use [V1 Scope](design/content/docs/global/v1.yml) for the current
boundary.

**Construction vehicle**:
A vulnerable unit that places a small set of buildings on valid terrain within a limited HQ/construction radius. It is separate from the harvester in the first playable.

**Game view**:
A minimal internal, fog-filtered read model consumed by the renderer and scripted opponent; it is not yet a public agent protocol.

**Near-term game**:
The first complete solo experience after V1. Its current boundary is defined
in [V1 Scope](design/content/docs/global/v1.yml).

**Far vision**:
Expansion beyond the near-term solo game. Its current boundary is defined in
[V1 Scope](design/content/docs/global/v1.yml).

**First demo**:
An older synonym for the V1 proof; use [V1 Scope](design/content/docs/global/v1.yml) for
the current boundary.

**Meridian Crisis**:
The fictional 1990s-adjacent setting in which a failed political transition fractures a major continental power and triggers conflict over industry, transport, and strategic infrastructure.

**Meridian Union**:
The fictional industrial federation whose failed reform and contested succession trigger the Meridian Crisis.

**Directorate**:
The major successor faction seeking to restore centralized state authority through mass, armor, and planned pressure.

**Coalition**:
The major successor faction seeking to rebuild a federation through regional consent, information, mobility, and combined-arms adaptation.

**Irregular Network**:
The hidden minor faction formed from local defense groups, defectors, smugglers, dissident engineers, and intelligence cells. It uses asymmetry, concealment, improvisation, and denial, and is implemented after the two major factions.

**Data mod**:
A versioned, manifest-declared content package that changes definitions or scenarios without arbitrary runtime code.

**Lockstep**:
A multiplayer model in which participants advance the same deterministic simulation from shared validated commands and detect divergence with state hashes.

**Doctrine**:
A faction’s coherent way of conducting war, expressed through its economy, units, production, and battlefield strengths rather than only through unique technology.

**Shared battlefield grammar**:
The common strategic roles and readable counter relationships that keep factions learnable. It does not require identical units; each faction may express a role with distinct equipment and mechanics.

**Platform**:
What an entity physically is—infantry, vehicle, aircraft, naval unit, structure, or deployable. Platform is independent from its current locomotor state and battlefield role.

**Locomotor**:
The movement model and current state governing terrain access, height/depth, transitions, collision, pathfinding, and attack approach. A unit may change locomotor state.

**Battlefield role**:
The strategic job an entity performs against the opponent, such as reconnaissance, line/hold, assault, anti-armor, infiltration, support, or objective control.

**Targetability**:
The domains and conditions under which an entity can currently be detected and attacked. It is not inferred solely from platform.

**Damage channel**:
The way an attack changes health, protection, structure, or a visible status track. Secondary channels such as freeze or EMP are distinct from ordinary health damage.

**Building role**:
The strategic function of a structure—command, economy, manufacturing, defense, sustainment, research, strategic threat, or scenario interaction.

**Battle**:
A single real-time match on a map. A battle is won through objective control and force position, or through the applicable scenario victory condition.

**Objective**:
A map feature or mission condition that creates a reason to maneuver and fight beyond simply destroying bases.

## Simulation language

**Simulation**:
The authoritative, engine-independent rules and state of a battle.

**Command**:
A validated, tick-stamped player or AI intent submitted to the simulation.

**Observation**:
A read-only, visibility-filtered projection of simulation state for the interface, AI, or future agent adapter.

**Semantic event**:
A stable typed description of a meaningful simulation occurrence, carrying only the structured payload needed for consumers and logs.

**Replay**:
Reconstruction of a battle from its seed, content version, and command log.

**Content**:
Human-authored definitions and scenarios for units, weapons, factions, maps, missions, and balance values. V1 may keep this content as direct typed records; compilation and packaged data mods are later tooling concerns.

## Architecture language

**Engine boundary**:
The separation between portable simulation rules and runtime services such as rendering, input, audio, storage, and platform integration.

**Agent seam**:
The protocol-neutral command and observation boundary that may later be exposed through MCP or another remote interface.

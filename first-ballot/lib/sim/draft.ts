export type DraftCareer = {
  id: string;
  full_name: string;
  primary_position: string;
  current_age: number;
  current_year: number;
  draft_projection_round: number | null;
  draft_projection_pick: number | null;
};

export type DraftMonth = {
  avg: number | null;
  home_runs: number | null;
  stolen_bases: number | null;
  war: number | null;
};

export type Team = {
  id: string;
  name: string;
  city: string | null;
  abbreviation: string | null;
  development: number | null;
  fame: number | null;
  playing_time: number | null;
};

export function generateDraftResult({
  career,
  months,
  teams,
}: {
  career: DraftCareer;
  months: DraftMonth[];
  teams: Team[];
}) {
  const seniorSeason = months[0];

  const avg = Number(seniorSeason?.avg ?? 0.24);
  const homeRuns = Number(seniorSeason?.home_runs ?? 2);
  const stolenBases = Number(seniorSeason?.stolen_bases ?? 4);
  const war = Number(seniorSeason?.war ?? 1.5);

  const score =
    avg * 100 +
    homeRuns * 2.2 +
    stolenBases * 0.8 +
    war * 9 +
    randomBetween(-10, 12);

  let round = career.draft_projection_round ?? 10;
let pick = career.draft_projection_pick ?? randomInt(280, 315);

const draftVariance = randomInt(-1, 1);
round = Math.max(1, Math.min(20, round + draftVariance));

if (round === 1) {
  pick = Math.max(1, Math.min(30, pick + randomInt(-8, 8)));
} else if (round === 2) {
  pick = Math.max(31, Math.min(70, pick + randomInt(-12, 12)));
} else if (round <= 5) {
  pick = Math.max(71, Math.min(165, pick + randomInt(-20, 20)));
} else if (round <= 10) {
  pick = Math.max(166, Math.min(315, pick + randomInt(-28, 28)));
} else {
  pick = Math.max(316, Math.min(615, pick + randomInt(-40, 40)));
}

let bonus = getBonusForPick(round, pick);
let buzz = getDraftBuzz(round, score);

  const team = teams.length > 0 ? teams[randomInt(0, teams.length - 1)] : null;

  return {
    draftYear: career.current_year,
    draftRound: round,
    draftPick: pick,
    draftTeam: team,
    signedBonus: bonus,
    buzz,
    summary: `${career.full_name} was selected in Round ${round}, Pick ${pick}${
      team ? ` by the ${team.city} ${team.name}` : ""
    }.`,
  };
}

export function getSigningOptions({
  round,
  bonus,
}: {
  round: number;
  bonus: number;
}) {
  const isPremiumPick = round <= 3;

  return [
    {
      id: "sign",
      title: "Sign Pro Contract",
      description: `Take the $${bonus.toLocaleString()} signing bonus and begin pro ball.`,
      recommended: true,
    },
    {
      id: "college",
      title: "Go to College",
      description: isPremiumPick
        ? "Betting on college is risky after being picked this high, but the upside could grow."
        : "Turn down the offer and try to improve your stock in college.",
      recommended: false,
    },
  ];
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}
function getBonusForPick(round: number, pick: number) {
  if (round === 1) {
    if (pick <= 10) return randomInt(5200000, 8500000);
    if (pick <= 20) return randomInt(3400000, 5200000);
    return randomInt(2400000, 3400000);
  }

  if (round === 2) return randomInt(950000, 2300000);
  if (round <= 5) return randomInt(325000, 925000);
  if (round <= 10) return randomInt(90000, 300000);

  return randomInt(20000, 85000);
}

function getDraftBuzz(round: number, score: number) {
  if (round === 1 && score >= 105) return "First-round riser";
  if (round === 1) return "First-round selection";
  if (round === 2) return "Day-one talent";
  if (round <= 5) return "Early-round upside play";
  if (round <= 10) return "Projectable development target";
  return "Late-round flier";
}
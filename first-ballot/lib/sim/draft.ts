export type DraftCareer = {
  id: string;
  full_name: string;
  primary_position: string;
  current_age: number;
  current_year: number;
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

  let round = 10;
  let pick = randomInt(280, 315);
  let bonus = randomInt(25000, 75000);
  let buzz = "Late-round flier";

  if (score >= 100) {
    round = 1;
    pick = randomInt(1, 30);
    bonus = randomInt(2800000, 8200000);
    buzz = "First-round selection";
  } else if (score >= 88) {
    round = 2;
    pick = randomInt(31, 70);
    bonus = randomInt(950000, 2500000);
    buzz = "Day-one talent";
  } else if (score >= 76) {
    round = randomInt(3, 5);
    pick = randomInt(71, 165);
    bonus = randomInt(350000, 900000);
    buzz = "Early-round upside play";
  } else if (score >= 62) {
    round = randomInt(6, 10);
    pick = randomInt(166, 315);
    bonus = randomInt(100000, 325000);
    buzz = "Projectable prep bat";
  } else {
    round = randomInt(11, 20);
    pick = randomInt(316, 615);
    bonus = randomInt(25000, 90000);
    buzz = "Developmental lottery ticket";
  }

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
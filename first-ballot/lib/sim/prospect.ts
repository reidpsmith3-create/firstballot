export type ProspectCareer = {
  id: string;
  world_id: string;
  current_age: number;
  current_level: string | null;
  draft_round: number | null;
  draft_pick: number | null;
};

export type ProspectRatings = {
  contact: number;
  power: number;
  speed: number;
  glove: number;
  arm: number;
};

export type ProspectProduction = {
  avg: number | null;
  home_runs: number | null;
  stolen_bases: number | null;
  war: number | null;
};

export function calculateProspectStatus({
  career,
  ratings,
  recentProduction,
}: {
  career: ProspectCareer;
  ratings: ProspectRatings;
  recentProduction?: ProspectProduction | null;
}) {
  const levelBonus = getLevelBonus(career.current_level);
  const ageBonus = getAgeBonus(career.current_age, career.current_level);
  const draftBonus = getDraftBonus(career.draft_round, career.draft_pick);

  const toolsScore =
    ratings.contact * 0.28 +
    ratings.power * 0.24 +
    ratings.speed * 0.14 +
    ratings.glove * 0.18 +
    ratings.arm * 0.16;

  const productionScore = getProductionScore(recentProduction);

  const prospectScore =
    toolsScore * 0.48 +
    productionScore * 0.24 +
    levelBonus * 0.14 +
    ageBonus * 0.08 +
    draftBonus * 0.06;

  const roundedScore = Number(Math.max(20, Math.min(99, prospectScore)).toFixed(1));

  return {
    prospectScore: roundedScore,
    organizationRank: getOrganizationRank(roundedScore),
    overallRank: getOverallRank(roundedScore),
    trend: getTrend(roundedScore, productionScore),
  };
}

function getLevelBonus(level: string | null) {
  if (level === "MLB") return 95;
  if (level === "AAA") return 82;
  if (level === "AA") return 74;
  if (level === "High-A") return 64;
  if (level === "A") return 54;
  if (level === "Rookie") return 44;
  return 40;
}

function getAgeBonus(age: number, level: string | null) {
  if (level === "MLB" && age <= 23) return 95;
  if (level === "AAA" && age <= 22) return 88;
  if (level === "AA" && age <= 21) return 84;
  if (level === "High-A" && age <= 20) return 78;
  if (level === "A" && age <= 20) return 70;
  if (level === "Rookie" && age <= 19) return 68;

  if (age <= 22) return 58;
  if (age <= 25) return 45;
  return 30;
}

function getDraftBonus(round: number | null, pick: number | null) {
  if (!round) return 35;

  if (round === 1) {
    if (pick && pick <= 10) return 96;
    return 90;
  }

  if (round === 2) return 78;
  if (round <= 5) return 66;
  if (round <= 10) return 52;
  return 38;
}

function getProductionScore(production?: ProspectProduction | null) {
  if (!production) return 50;

  const avg = Number(production.avg ?? 0.245);
  const hr = Number(production.home_runs ?? 0);
  const sb = Number(production.stolen_bases ?? 0);
  const war = Number(production.war ?? 0);

  return Math.max(
    25,
    Math.min(99, avg * 160 + hr * 4 + sb * 1.2 + war * 16)
  );
}

function getOrganizationRank(score: number) {
  if (score >= 88) return 1;
  if (score >= 82) return randomInt(2, 3);
  if (score >= 76) return randomInt(4, 7);
  if (score >= 68) return randomInt(8, 15);
  if (score >= 58) return randomInt(16, 30);
  return null;
}

function getOverallRank(score: number) {
  if (score >= 91) return randomInt(1, 15);
  if (score >= 86) return randomInt(16, 40);
  if (score >= 81) return randomInt(41, 75);
  if (score >= 76) return randomInt(76, 100);
  return null;
}

function getTrend(score: number, productionScore: number) {
  if (score >= 82 && productionScore >= 72) return "Rising";
  if (score <= 55 || productionScore <= 38) return "Falling";
  return "Holding";
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
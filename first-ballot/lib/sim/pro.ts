export type ProCareer = {
  id: string;
  world_id: string;
  full_name: string;
  primary_position: string;
  current_age: number;
  current_year: number;
  current_month: string | null;
  career_stage: string;
  current_level: string | null;
  current_team_id: string | null;
  draft_round: number | null;
  draft_pick: number | null;
  prospect_score: number | null;
  overall_prospect_rank: number | null;
  mlb_debut_year: number | null;
  hall_score: number | null;
};

export type ProRatings = {
  contact: number;
  power: number;
  speed: number;
  glove: number;
  arm: number;
  velocity: number;
  command: number;
  movement: number;
  stamina: number;
};

export const proMonths = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
];

export const proLevels = ["Rookie", "A", "High-A", "AA", "AAA", "MLB"];

export const proDevelopmentOptions = [
  {
    id: "balanced",
    title: "Stay Balanced",
    description: "Keep the full profile moving forward.",
  },
  {
    id: "offense",
    title: "Prioritize the Bat",
    description: "Chase production and force the organization’s hand.",
  },
  {
    id: "defense",
    title: "Earn Trust",
    description: "Improve defensive consistency and become easier to promote.",
  },
  {
    id: "physical",
    title: "Physical Jump",
    description: "Focus on strength, speed, and visible tools.",
  },
];

export function simulateProMonth({
  career,
  ratings,
  focus,
}: {
  career: ProCareer;
  ratings: ProRatings;
  focus: string;
}) {
  const level = career.current_level ?? "Rookie";
  const levelDifficulty = getLevelDifficulty(level);
  const focusMods = getFocusMods(focus);

  const contact = ratings.contact + focusMods.contact;
  const power = ratings.power + focusMods.power;
  const speed = ratings.speed + focusMods.speed;
  const glove = ratings.glove + focusMods.glove;

  const games = level === "MLB" ? randomInt(18, 27) : randomInt(16, 25);

  const avg = clamp(
    0.18 + contact / 430 - levelDifficulty / 900 + randomBetween(-0.035, 0.035),
    0.145,
    0.430
  );

  const hits = Math.round(games * randomBetween(3.3, 4.3) * avg);
  const homeRuns = Math.max(
    0,
    Math.round(power / 14 + randomBetween(-2, 4) - levelDifficulty / 35)
  );
  const rbi = Math.round(homeRuns * 2.5 + hits * 0.35 + randomBetween(2, 12));
  const runs = Math.round(hits * 0.45 + speed / 8 + randomBetween(2, 11));
  const stolenBases = Math.max(
    0,
    Math.round(speed / 9 + randomBetween(-3, 5) - levelDifficulty / 55)
  );

  const war = Number(
    clamp(
      contact / 35 +
        power / 42 +
        speed / 60 +
        glove / 70 -
        levelDifficulty / 35 +
        randomBetween(-0.5, 0.8),
      -0.7,
      level === "MLB" ? 2.8 : 2.2
    ).toFixed(1)
  );

  const performanceScore =
    avg * 100 + homeRuns * 3 + stolenBases * 0.8 + war * 12 + contact / 4 + power / 5;

  const promotion = getPromotionCheck({
  level,
  performanceScore,
  age: career.current_age,
  month: career.current_month ?? "April",
  draftRound: career.draft_round,
  prospectScore: career.prospect_score,
});

  const ratingChanges = getMonthlyGrowth({ focus, level, performanceScore });

  const hallScoreGain =
    level === "MLB"
      ? Number(clamp(war * 2.5 + homeRuns * 0.15 + hits * 0.03, 0, 8).toFixed(1))
      : 0;

  return {
    level,
    games,
    avg: Number(avg.toFixed(3)),
    hits,
    homeRuns,
    rbi,
    runs,
    stolenBases,
    war,
    performanceScore,
    promotion,
    ratingChanges,
    hallScoreGain,
    summary: `${career.full_name} hit ${avg.toFixed(3)} with ${homeRuns} HR, ${rbi} RBI, ${stolenBases} SB, and ${war.toFixed(1)} WAR for ${level}.`,
    scoutingReport: getScoutingReport({ level, performanceScore, promotion }),
  };
}

export function getNextProCalendar(currentMonth: string | null, currentYear: number) {
  const month = currentMonth ?? "April";
  const index = proMonths.indexOf(month);

  if (index === -1 || index >= proMonths.length - 1) {
    return {
      nextMonth: "April",
      nextYear: currentYear + 1,
      seasonEnded: true,
    };
  }

  return {
    nextMonth: proMonths[index + 1],
    nextYear: currentYear,
    seasonEnded: false,
  };
}

export function getNextLevel(currentLevel: string | null) {
  const level = currentLevel ?? "Rookie";
  const index = proLevels.indexOf(level);

  if (index === -1) return "Rookie";
  if (index >= proLevels.length - 1) return "MLB";

  return proLevels[index + 1];
}

export function shouldRetire({
  age,
  level,
  hallScore,
}: {
  age: number;
  level: string | null;
  hallScore: number;
}) {
  if (age < 36) return false;
  if (level !== "MLB" && age >= 32) return true;
  if (age >= 41) return true;
  if (age >= 38 && hallScore < 35) return Math.random() > 0.6;
  if (age >= 39) return Math.random() > 0.35;
  return false;
}

function getLevelDifficulty(level: string) {
  if (level === "Rookie") return 10;
  if (level === "A") return 18;
  if (level === "High-A") return 26;
  if (level === "AA") return 36;
  if (level === "AAA") return 46;
  return 62;
}

function getPromotionCheck({
  level,
  performanceScore,
  age,
  month,
  draftRound,
  prospectScore,
}: {
  level: string;
  performanceScore: number;
  age: number;
  month: string;
  draftRound?: number | null;
  prospectScore?: number | null;
}) {
  if (level === "MLB") {
    return {
      promoted: false,
      nextLevel: "MLB",
      reason: "Already in MLB.",
    };
  }

  const isEvaluationMonth =
    month === "June" || month === "August" || month === "October";

  if (!isEvaluationMonth) {
    return {
      promoted: false,
      nextLevel: level,
      reason: "Promotions are usually evaluated in June, August, and after the season.",
    };
  }

  const premiumPickBoost = draftRound && draftRound <= 2 ? 10 : 0;
  const earlyPickBoost = draftRound && draftRound <= 5 ? 5 : 0;
  const prospectBoost = prospectScore && prospectScore >= 80 ? 8 : prospectScore && prospectScore >= 70 ? 4 : 0;
  const ageBoost = age >= 24 ? 5 : age <= 20 ? -6 : 0;

  const promotionScore =
    performanceScore + premiumPickBoost + earlyPickBoost + prospectBoost + ageBoost;

  const threshold = getPromotionThreshold(level);

  if (promotionScore >= threshold) {
    return {
      promoted: true,
      nextLevel: getNextLevel(level),
      reason: `The organization believes the ${level} challenge has been met.`,
    };
  }

  return {
    promoted: false,
    nextLevel: level,
    reason: `The organization wants more proof at ${level}.`,
  };
}
function getPromotionThreshold(level: string) {
  if (level === "Rookie") return 88;
  if (level === "A") return 90;
  if (level === "High-A") return 92;
  if (level === "AA") return 95;
  if (level === "AAA") return 88;
  return 99;
}

function getMonthlyGrowth({
  focus,
  level,
  performanceScore,
}: {
  focus: string;
  level: string;
  performanceScore: number;
}) {
  const growthChance = performanceScore >= 75 ? 1 : 0;
  const mlbSlowdown = level === "MLB" ? -1 : 0;

  if (focus === "offense") {
    return {
      contact: Math.max(0, randomInt(0, 1) + growthChance + mlbSlowdown),
      power: Math.max(0, randomInt(0, 1) + growthChance),
      speed: 0,
      glove: 0,
      arm: 0,
    };
  }

  if (focus === "defense") {
    return {
      contact: Math.max(0, randomInt(0, 1) + mlbSlowdown),
      power: 0,
      speed: 0,
      glove: Math.max(0, randomInt(0, 1) + growthChance),
      arm: randomInt(0, 1),
    };
  }

  if (focus === "physical") {
    return {
      contact: 0,
      power: Math.max(0, randomInt(0, 1) + growthChance),
      speed: randomInt(0, 1),
      glove: 0,
      arm: randomInt(0, 1),
    };
  }

  return {
    contact: Math.max(0, randomInt(0, 1) + mlbSlowdown),
    power: randomInt(0, 1),
    speed: randomInt(0, 1),
    glove: randomInt(0, 1),
    arm: randomInt(0, 1),
  };
}

function getFocusMods(focus: string) {
  if (focus === "offense") {
    return { contact: 3, power: 3, speed: 0, glove: -2 };
  }

  if (focus === "defense") {
    return { contact: 0, power: -1, speed: 1, glove: 4 };
  }

  if (focus === "physical") {
    return { contact: -1, power: 3, speed: 3, glove: 0 };
  }

  return { contact: 1, power: 1, speed: 1, glove: 1 };
}

function getScoutingReport({
  level,
  performanceScore,
  promotion,
}: {
  level: string;
  performanceScore: number;
  promotion: { promoted: boolean; nextLevel: string; reason: string };
}) {
  if (promotion.promoted) {
    return `${promotion.reason} Next stop: ${promotion.nextLevel}.`;
  }

  if (performanceScore >= 75) {
    return `Strong month at ${level}. A promotion could come soon.`;
  }

  if (performanceScore >= 58) {
    return `Solid month at ${level}. Development is moving steadily.`;
  }

  return `Uneven month at ${level}. The organization wants more consistency.`;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
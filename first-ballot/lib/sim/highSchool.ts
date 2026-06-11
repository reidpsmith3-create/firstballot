export type Career = {
  id: string;
  full_name: string;
  primary_position: string;
  current_age: number;
  current_year: number;
  current_month: string | null;
  career_stage: string;
  current_level: string;
};

export type Ratings = {
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

export type HighSchoolDecision = {
  id: string;
  title: string;
  description: string;
  contactMod?: number;
  powerMod?: number;
  speedMod?: number;
  gloveMod?: number;
  armMod?: number;
};

export function getHighSchoolDecisions(season: string): HighSchoolDecision[] {
  if (season === "Freshman Season") {
    return [
      {
        id: "make_varsity",
        title: "Try To Make Varsity",
        description: "Push for early attention, even if the role is uncertain.",
        contactMod: 1,
        speedMod: 1,
        gloveMod: 1,
      },
      {
        id: "build_foundation",
        title: "Build The Foundation",
        description: "Focus on fundamentals and long-term development.",
        contactMod: 2,
        gloveMod: 1,
      },
      {
        id: "play_travel_ball",
        title: "Travel Ball Circuit",
        description: "Chase exposure against better competition.",
        powerMod: 1,
        speedMod: 1,
        armMod: 1,
      },
    ];
  }

  if (season === "Sophomore Season") {
    return [
      {
        id: "showcase",
        title: "Attend Showcases",
        description: "Get in front of scouts and college recruiters.",
        powerMod: 2,
        armMod: 1,
      },
      {
        id: "strength",
        title: "Add Strength",
        description: "Start growing into the frame and unlock power.",
        powerMod: 3,
      },
      {
        id: "defensive_home",
        title: "Own Your Position",
        description: "Become the kind of defender coaches trust.",
        gloveMod: 3,
        armMod: 1,
      },
    ];
  }

  if (season === "Junior Season") {
    return [
      {
        id: "draft_push",
        title: "Push Draft Stock",
        description: "Prioritize loud tools and scout attention.",
        powerMod: 2,
        contactMod: 1,
      },
      {
        id: "college_recruiting",
        title: "Focus On Recruiting",
        description: "Build relationships with college programs.",
        contactMod: 1,
        gloveMod: 1,
        speedMod: 1,
      },
      {
        id: "become_leader",
        title: "Become The Guy",
        description: "Take ownership of the team and become a centerpiece.",
        contactMod: 2,
        gloveMod: 1,
      },
    ];
  }

  return [
    {
      id: "first_round_dream",
      title: "Chase The Draft",
      description: "Go all-in on becoming a premium draft prospect.",
      powerMod: 2,
      contactMod: 2,
    },
    {
      id: "keep_college_open",
      title: "Keep College Open",
      description: "Balance draft interest with strong college options.",
      contactMod: 1,
      speedMod: 1,
      gloveMod: 1,
    },
    {
      id: "finish_polished",
      title: "Polish The Profile",
      description: "Round out the game and reduce scout concerns.",
      contactMod: 2,
      gloveMod: 2,
    },
  ];
}

export function getHighSchoolSeasonLabel(currentMonth: string | null) {
  if (!currentMonth) return "Freshman Season";
  return currentMonth;
}

export function getNextHighSchoolState(currentMonth: string | null) {
  const season = getHighSchoolSeasonLabel(currentMonth);

  if (season === "Freshman Season") {
    return {
      nextMonth: "Sophomore Season",
      nextStage: "high_school",
      nextLevel: "HS",
      isFinishedHighSchool: false,
    };
  }

  if (season === "Sophomore Season") {
    return {
      nextMonth: "Junior Season",
      nextStage: "high_school",
      nextLevel: "HS",
      isFinishedHighSchool: false,
    };
  }

  if (season === "Junior Season") {
    return {
      nextMonth: "Senior Season",
      nextStage: "high_school",
      nextLevel: "HS",
      isFinishedHighSchool: false,
    };
  }

  return {
    nextMonth: "Draft Day",
    nextStage: "draft",
    nextLevel: "Draft Eligible",
    isFinishedHighSchool: true,
  };
}

export function simulateHighSchoolSeason({
  career,
  ratings,
  decision,
}: {
  career: Career;
  ratings: Ratings;
  decision: HighSchoolDecision;
}) {
  const season = getHighSchoolSeasonLabel(career.current_month);

  const contact = ratings.contact + (decision.contactMod ?? 0);
  const power = ratings.power + (decision.powerMod ?? 0);
  const speed = ratings.speed + (decision.speedMod ?? 0);
  const glove = ratings.glove + (decision.gloveMod ?? 0);

  const avgBase = 0.22 + contact / 400;
  const avg = clampNumber(avgBase + randomBetween(-0.025, 0.025), 0.210, 0.485);

  const games = randomInt(26, 38);
  const hits = Math.round(games * randomBetween(2.6, 3.5) * avg);
  const homeRuns = Math.max(0, Math.round(power / 10 + randomBetween(-3, 4)));
  const rbi = Math.round(homeRuns * 2.2 + hits * 0.45 + randomBetween(5, 18));
  const runs = Math.round(hits * 0.55 + speed / 3 + randomBetween(4, 15));
  const stolenBases = Math.max(0, Math.round(speed / 5 + randomBetween(-5, 9)));
  const war = Number(clampNumber(contact / 18 + power / 22 + speed / 28 + glove / 30 + randomBetween(-1.2, 1.4), 0.2, 8.5).toFixed(1));

  const ratingChanges = {
    contact: decision.contactMod ?? 0,
    power: decision.powerMod ?? 0,
    speed: decision.speedMod ?? 0,
    glove: decision.gloveMod ?? 0,
    arm: decision.armMod ?? 0,
  };

  const stock = getDraftStock({ avg, homeRuns, stolenBases, war, season });

  return {
    season,
    games,
    avg: Number(avg.toFixed(3)),
    hits,
    homeRuns,
    rbi,
    runs,
    stolenBases,
    war,
    ratingChanges,
    monthlySummary: `${career.full_name} completed his ${season.toLowerCase()} hitting ${avg.toFixed(
      3
    )} with ${homeRuns} HR, ${rbi} RBI, ${stolenBases} SB, and ${war.toFixed(
      1
    )} WAR.`,
    scoutingReport: `${stock}. Scouts noted ${decision.description.toLowerCase()}`,
    eventTitle: `${season} Complete`,
    eventDescription: `${career.full_name} finished the ${season.toLowerCase()} and continued building his amateur profile.`,
    draftStock: stock,
  };
}

function getDraftStock({
  avg,
  homeRuns,
  stolenBases,
  war,
  season,
}: {
  avg: number;
  homeRuns: number;
  stolenBases: number;
  war: number;
  season: string;
}) {
  const seniorBoost = season === "Senior Season" ? 1 : 0;
  const score =
    avg * 100 +
    homeRuns * 1.8 +
    stolenBases * 0.7 +
    war * 8 +
    seniorBoost * 8;

  if (score >= 95) return "First-round buzz is starting to build";
  if (score >= 82) return "Day-one draft interest is growing";
  if (score >= 68) return "Scouts see a real pro future";
  if (score >= 55) return "College programs remain very interested";
  return "The tools are visible, but the profile still needs polish";
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
export function getDraftProjectionFromSeason({
  avg,
  homeRuns,
  stolenBases,
  war,
  season,
}: {
  avg: number;
  homeRuns: number;
  stolenBases: number;
  war: number;
  season: string;
}) {
  const seniorBoost = season === "Senior Season" ? 10 : 0;
  const juniorBoost = season === "Junior Season" ? 4 : 0;

  const score =
    avg * 100 +
    homeRuns * 2 +
    stolenBases * 0.8 +
    war * 9 +
    seniorBoost +
    juniorBoost;

  if (score >= 100) {
    return { round: 1, pick: randomInt(1, 30), label: "1st Round" };
  }

  if (score >= 88) {
    return { round: 2, pick: randomInt(31, 70), label: "2nd Round" };
  }

  if (score >= 76) {
    const round = randomInt(3, 5);
    return { round, pick: randomInt(71, 165), label: `Rounds 3-5` };
  }

  if (score >= 62) {
    const round = randomInt(6, 10);
    return { round, pick: randomInt(166, 315), label: `Rounds 6-10` };
  }

  const round = randomInt(11, 20);
  return { round, pick: randomInt(316, 615), label: `Late Rounds` };
}
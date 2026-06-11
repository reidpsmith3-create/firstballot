export type School = {
  id: string;
  name: string;
  conference: string | null;
  tier: number | null;
  prestige: number | null;
  development: number | null;
  playing_time: number | null;
  competition: number | null;
  trait_name: string | null;
  trait_description: string | null;
};

export type CollegeOffer = School & {
  offerStrength: number;
  role: string;
  scholarship: string;
  fitSummary: string;
};

export function generateCollegeOffers(schools: School[], draftRound?: number | null) {
  const offerCount = draftRound && draftRound <= 5 ? 6 : 4;

  return [...schools]
    .map((school) => {
      const prestige = school.prestige ?? 50;
      const development = school.development ?? 50;
      const playingTime = school.playing_time ?? 50;
      const competition = school.competition ?? 50;

      const offerStrength =
        prestige * 0.3 +
        development * 0.25 +
        playingTime * 0.25 +
        competition * 0.2 +
        Math.random() * 20;

      const role =
        playingTime >= 75
          ? "Immediate starter"
          : playingTime >= 60
            ? "Early contributor"
            : "Developmental role";

      return {
        ...school,
        offerStrength,
        role,
        scholarship: offerStrength >= 70 ? "Full scholarship" : "Partial scholarship",
        fitSummary: getFitSummary(school),
      };
    })
    .sort((a, b) => b.offerStrength - a.offerStrength)
    .slice(0, offerCount);
}

export function simulateCollegeSeason({
  playerName,
  seasonLabel,
  school,
  contact,
  power,
  speed,
  glove,
}: {
  playerName: string;
  seasonLabel: string;
  school: School;
  contact: number;
  power: number;
  speed: number;
  glove: number;
}) {
  const prestige = school.prestige ?? 50;
  const development = school.development ?? 50;
  const competition = school.competition ?? 50;

  const games = randomInt(48, 66);
  const avg = clamp(0.205 + contact / 390 + randomBetween(-0.03, 0.025), 0.205, 0.430);
  const homeRuns = Math.max(0, Math.round(power / 5.5 + competition / 18 + randomBetween(-4, 8)));
  const hits = Math.round(games * 3.7 * avg);
  const rbi = Math.round(homeRuns * 2.7 + hits * 0.38 + randomBetween(10, 24));
  const runs = Math.round(hits * 0.46 + speed / 2.5 + randomBetween(8, 22));
  const stolenBases = Math.max(0, Math.round(speed / 4.2 + randomBetween(-5, 12)));
  const war = Number(
    clamp(contact / 19 + power / 18 + speed / 25 + glove / 30 + competition / 35 + randomBetween(-1, 2), 0.5, 10.5).toFixed(1)
  );

  const postseason = getCollegePostseasonResult(prestige, competition, war);
  const awards = getCollegeAwards({ war, homeRuns, avg, postseason });

  const developmentBoost = development >= 75 ? 2 : development >= 60 ? 1 : 0;

  return {
    games,
    avg: Number(avg.toFixed(3)),
    hits,
    homeRuns,
    rbi,
    runs,
    stolenBases,
    war,
    postseason,
    awards,
    ratingChanges: {
      contact: randomInt(1, 2) + developmentBoost,
      power: randomInt(0, 2) + developmentBoost,
      speed: randomInt(0, 1),
      glove: randomInt(0, 2),
      arm: randomInt(0, 1),
    },
    summary: `${playerName} finished his ${seasonLabel.toLowerCase()} at ${school.name}, hitting ${avg.toFixed(
      3
    )} with ${homeRuns} HR, ${rbi} RBI, ${stolenBases} SB, and ${war.toFixed(1)} WAR.`,
    scoutingReport: getCollegeScoutingReport({ war, avg, homeRuns, postseason }),
  };
}

export function getNextCollegeState(currentMonth: string | null) {
  if (currentMonth === "Freshman Season") {
    return {
      nextMonth: "Sophomore Season",
      nextAgeAdd: 1,
      draftEligible: false,
      finishedCollege: false,
    };
  }

  if (currentMonth === "Sophomore Season") {
    return {
      nextMonth: "Junior Season",
      nextAgeAdd: 1,
      draftEligible: false,
      finishedCollege: false,
    };
  }

  if (currentMonth === "Junior Season") {
    return {
      nextMonth: "Draft Day",
      nextAgeAdd: 1,
      draftEligible: true,
      finishedCollege: false,
    };
  }

  return {
    nextMonth: "Draft Day",
    nextAgeAdd: 1,
    draftEligible: true,
    finishedCollege: true,
  };
}

function getFitSummary(school: School) {
  if ((school.playing_time ?? 50) >= 75) {
    return "Clear path to early playing time.";
  }

  if ((school.development ?? 50) >= 75) {
    return "Known for turning tools into draft stock.";
  }

  if ((school.prestige ?? 50) >= 75) {
    return "Big stage, big expectations.";
  }

  return "Balanced opportunity with room to grow.";
}

function getCollegePostseasonResult(prestige: number, competition: number, war: number) {
  const score = prestige * 0.45 + competition * 0.3 + war * 8 + randomBetween(-15, 20);

  if (score >= 108) return "National Champions";
  if (score >= 95) return "College World Series";
  if (score >= 82) return "Super Regionals";
  if (score >= 68) return "Regionals";
  if (score >= 55) return "Conference Tournament";
  return "Missed Postseason";
}

function getCollegeAwards({
  war,
  homeRuns,
  avg,
  postseason,
}: {
  war: number;
  homeRuns: number;
  avg: number;
  postseason: string;
}) {
  const awards: string[] = [];

  if (war >= 8.5) awards.push("National Player of the Year Finalist");
  if (war >= 6.8) awards.push("All-American");
  if (war >= 5.2) awards.push("All-Conference");
  if (homeRuns >= 22) awards.push("Conference Home Run Leader");
  if (avg >= 0.360) awards.push("Batting Title Contender");
  if (postseason === "College World Series") awards.push("College World Series Appearance");
if (postseason === "National Champions") awards.push("National Champion");

  return awards;
}

function getCollegeScoutingReport({
  war,
  avg,
  homeRuns,
  postseason,
}: {
  war: number;
  avg: number;
  homeRuns: number;
  postseason: string;
}) {
  if (war >= 8 || avg >= 0.370 || homeRuns >= 25) {
    return `Draft stock is surging. Scouts are treating this as a potential first-round college profile. Team result: ${postseason}.`;
  }

  if (war >= 6) {
    return `Strong season. The bat is becoming a real pro carrying tool. Team result: ${postseason}.`;
  }

  if (war >= 4) {
    return `Solid college production with enough tools to stay firmly on draft boards. Team result: ${postseason}.`;
  }

  return `The talent is still visible, but scouts want a louder season. Team result: ${postseason}.`;
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
export function getCollegeDraftProjection({
  seasonLabel,
  avg,
  homeRuns,
  stolenBases,
  war,
  awards,
  postseason,
}: {
  seasonLabel: string;
  avg: number;
  homeRuns: number;
  stolenBases: number;
  war: number;
  awards: string[];
  postseason: string;
}) {
  const classBoost =
    seasonLabel === "Junior Season"
      ? 10
      : seasonLabel === "Senior Season"
        ? 14
        : 0;

  const awardBoost =
    awards.includes("National Player of the Year Finalist")
      ? 14
      : awards.includes("All-American")
        ? 9
        : awards.includes("All-Conference")
          ? 5
          : 0;

  const postseasonBoost =
    postseason === "National Champions"
      ? 10
      : postseason === "College World Series"
        ? 7
        : postseason === "Super Regionals"
          ? 4
          : 0;

  const score =
    avg * 100 +
    homeRuns * 2.4 +
    stolenBases * 0.7 +
    war * 8 +
    classBoost +
    awardBoost +
    postseasonBoost;

  if (score >= 112) {
    return {
      round: 1,
      pick: randomInt(1, 20),
      trend: "Rising",
      label: "1st Round",
    };
  }

  if (score >= 100) {
    return {
      round: 1,
      pick: randomInt(21, 30),
      trend: "Rising",
      label: "Late 1st Round",
    };
  }

  if (score >= 88) {
    return {
      round: 2,
      pick: randomInt(31, 70),
      trend: "Rising",
      label: "2nd Round",
    };
  }

  if (score >= 76) {
    const round = randomInt(3, 5);
    return {
      round,
      pick: randomInt(71, 165),
      trend: "Holding",
      label: "Rounds 3-5",
    };
  }

  if (score >= 62) {
    const round = randomInt(6, 10);
    return {
      round,
      pick: randomInt(166, 315),
      trend: "Holding",
      label: "Rounds 6-10",
    };
  }

  const round = randomInt(11, 20);

  return {
    round,
    pick: randomInt(316, 615),
    trend: "Falling",
    label: "Late Rounds",
  };
}
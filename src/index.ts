import { readFile } from "node:fs/promises";

export type SessionTier = "CONTROLLED" | "WATCH" | "REVIEW" | "ESCALATE";

export interface SessionLane {
  name: string;
  owner: string;
  audience: string;
  safe: string;
  businessCriticality: number;
  recordingCoverage: number;
  mfaFreshness: number;
  commandAnomalyControl: number;
  safeOwnershipClarity: number;
  terminationReadiness: number;
  unreviewedSessionCount: number;
  staleAccountCount: number;
  privilegedBlastRadius: number;
  narrative: string;
  nextAction: string;
}

export interface SessionInput {
  generatedAt: string;
  organization: string;
  lanes: SessionLane[];
}

export interface ScoredSessionLane extends SessionLane {
  sessionControlScore: number;
  exposureScore: number;
  tier: SessionTier;
  route: string;
}

export interface SessionConsole {
  generatedAt: string;
  organization: string;
  lanes: ScoredSessionLane[];
  summary: {
    laneCount: number;
    controlledCount: number;
    escalationCount: number;
    highestExposureLane: string;
    meanSessionControlScore: number;
    primaryRecommendation: string;
  };
}

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));

export function classifyTier(sessionControlScore: number): SessionTier {
  if (sessionControlScore >= 84) return "CONTROLLED";
  if (sessionControlScore >= 70) return "WATCH";
  if (sessionControlScore >= 52) return "REVIEW";
  return "ESCALATE";
}

export function scoreLane(lane: SessionLane): ScoredSessionLane {
  const reviewPenalty = clamp(lane.unreviewedSessionCount * 7);
  const staleAccountPenalty = clamp(lane.staleAccountCount * 6);
  const blastRadiusPenalty = clamp(lane.privilegedBlastRadius * 0.55);

  const sessionControlScore = Math.round(
    clamp(
      lane.recordingCoverage * 0.2 +
        lane.mfaFreshness * 0.16 +
        lane.commandAnomalyControl * 0.18 +
        lane.safeOwnershipClarity * 0.16 +
        lane.terminationReadiness * 0.14 +
        (100 - reviewPenalty) * 0.07 +
        (100 - staleAccountPenalty) * 0.04 +
        (100 - blastRadiusPenalty) * 0.03 +
        lane.businessCriticality * 0.02
    )
  );

  const exposureScore = 100 - sessionControlScore;
  const tier = classifyTier(sessionControlScore);
  const route =
    tier === "ESCALATE"
      ? "Escalate privileged session risk until recording, MFA, command anomaly, and termination controls are restored."
      : tier === "REVIEW"
        ? "Route to CyberArk session risk review with unreviewed sessions, stale accounts, and blast radius attached."
        : tier === "WATCH"
          ? "Keep under watch with session review cadence, MFA freshness checks, and safe-owner evidence."
          : "Controlled privileged session lane with current recording, command, MFA, and termination evidence.";

  return { ...lane, sessionControlScore, exposureScore, tier, route };
}

export function buildConsole(input: SessionInput): SessionConsole {
  const lanes = input.lanes.map(scoreLane).sort((a, b) => a.sessionControlScore - b.sessionControlScore);
  const meanSessionControlScore = Math.round(
    lanes.reduce((sum, lane) => sum + lane.sessionControlScore, 0) / Math.max(lanes.length, 1)
  );
  const highestExposureLane = lanes[0]?.name ?? "No lanes";
  const controlledCount = lanes.filter((lane) => lane.tier === "CONTROLLED").length;
  const escalationCount = lanes.filter((lane) => lane.tier === "ESCALATE").length;

  return {
    generatedAt: input.generatedAt,
    organization: input.organization,
    lanes,
    summary: {
      laneCount: lanes.length,
      controlledCount,
      escalationCount,
      highestExposureLane,
      meanSessionControlScore,
      primaryRecommendation: `Fix ${highestExposureLane} first; it has the weakest CyberArk session-risk posture.`
    }
  };
}

export async function loadConsole(path: string): Promise<SessionConsole> {
  return buildConsole(JSON.parse(await readFile(path, "utf8")) as SessionInput);
}

export function renderMarkdown(sessionConsole: SessionConsole): string {
  const rows = sessionConsole.lanes
    .map(
      (lane) =>
        `| ${lane.name} | ${lane.tier} | ${lane.sessionControlScore} | ${lane.safe} | ${lane.recordingCoverage}% | ${lane.unreviewedSessionCount} | ${lane.nextAction} |`
    )
    .join("\n");

  return [
    "# CyberArk Session Risk Console",
    "",
    `Organization: ${sessionConsole.organization}`,
    "",
    `Primary recommendation: ${sessionConsole.summary.primaryRecommendation}`,
    "",
    "| Lane | Tier | Session control | Safe | Recording | Unreviewed sessions | Next action |",
    "| --- | --- | ---: | --- | ---: | ---: | --- |",
    rows
  ].join("\n");
}

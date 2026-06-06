import { describe, expect, it } from "vitest";
import sample from "../fixtures/cyberark-session-sample.json" with { type: "json" };
import { buildConsole, classifyTier, renderMarkdown, scoreLane } from "../src/index.js";

describe("cyberark session risk console", () => {
  it("classifies privileged session tiers", () => {
    expect(classifyTier(90)).toBe("CONTROLLED");
    expect(classifyTier(76)).toBe("WATCH");
    expect(classifyTier(58)).toBe("REVIEW");
    expect(classifyTier(40)).toBe("ESCALATE");
  });

  it("scores session lanes from PAM evidence", () => {
    const lane = scoreLane(sample.lanes[0]);
    expect(lane.sessionControlScore).toBeLessThan(70);
    expect(lane.route).toContain("session risk");
  });

  it("sorts highest-exposure privileged lanes first", () => {
    const sessionConsole = buildConsole(sample);
    expect(sessionConsole.summary.laneCount).toBe(4);
    expect(sessionConsole.lanes[0].sessionControlScore).toBeLessThanOrEqual(sessionConsole.lanes[1].sessionControlScore);
    expect(sessionConsole.summary.primaryRecommendation).toContain(sessionConsole.summary.highestExposureLane);
  });

  it("renders markdown output", () => {
    const markdown = renderMarkdown(buildConsole(sample));
    expect(markdown).toContain("| Lane | Tier | Session control |");
    expect(markdown).toContain("Domain admin emergency access");
  });
});

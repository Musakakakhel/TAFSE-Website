import { Router } from "express";
import { prisma } from "../../db";

export const leadsApiRouter = Router();

leadsApiRouter.post("/api/discovery-leads", async (req, res) => {
  const { name, email, role, team_size, industry, challenge, scorecard } = req.body;
  if (!name || !email || !role || !team_size || !industry || !challenge) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  const lead = await prisma.discoveryLead.create({
    data: { name, email, role, teamSize: team_size, industry, challenge, scorecard: scorecard || null },
  });
  res.status(201).json({ ok: true, id: lead.id });
});

leadsApiRouter.post("/api/scorecard-leads", async (req, res) => {
  const { name, email, company, role, phone, scores, resultType, recommendedProgramme } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  const lead = await prisma.scorecardLead.create({
    data: {
      name,
      email,
      company: company || "",
      role: role || "",
      phone: phone || "",
      totalScore: scores?.total ?? 0,
      overallPct: scores?.overall ?? 0,
      clarityScore: scores?.clarity ?? 0,
      capabilityScore: scores?.capability ?? 0,
      cultureScore: scores?.culture ?? 0,
      resultType: resultType || "",
      recommendedProgramme: recommendedProgramme || "",
    },
  });
  res.status(201).json({ ok: true, id: lead.id });
});

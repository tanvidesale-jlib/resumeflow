import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  GetResumeResponse,
  GetResumeSummaryResponse,
  SaveResumeBody,
  SaveResumeResponse,
} from "@workspace/api-zod";
import { db, userResumesTable, type ResumePayload } from "@workspace/db";

const router: IRouter = Router();
const RESUME_ID = 1;

function requireAuth(req: any, res: any, next: any) {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

const starterResume = {
  basics: {
    name: "Alex Morgan",
    headline: "Product designer crafting calm, useful digital experiences",
    email: "alex.morgan@email.com",
    phone: "+1 (415) 555-0198",
    location: "San Francisco, CA",
    summary:
      "Product designer with 6+ years of experience turning complex workflows into clear, human-centered products. I partner closely with engineering and research teams to ship experiences that feel simple, thoughtful, and useful.",
    website: "alexmorgan.design",
  },
  experience: [
    {
      id: "exp-1",
      role: "Senior Product Designer",
      company: "Northstar Labs",
      location: "San Francisco, CA",
      startDate: "2022",
      endDate: "Present",
      description:
        "Led the end-to-end design of a workflow platform used by 18k+ teams. Built a research practice that improved activation by 24% and partnered with engineering to establish a scalable design system.",
    },
    {
      id: "exp-2",
      role: "Product Designer",
      company: "Arc & Co.",
      location: "New York, NY",
      startDate: "2019",
      endDate: "2022",
      description:
        "Designed mobile and web products across fintech and commerce. Simplified onboarding, launched a new visual language, and mentored two early-career designers.",
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "California College of the Arts",
      degree: "BFA, Interaction Design",
      location: "San Francisco, CA",
      startDate: "2015",
      endDate: "2019",
    },
  ],
  skills: [
    { id: "skill-1", name: "Product strategy", level: "expert" },
    { id: "skill-2", name: "Interaction design", level: "expert" },
    { id: "skill-3", name: "Prototyping", level: "advanced" },
    { id: "skill-4", name: "Design systems", level: "advanced" },
  ],
  projects: [
    {
      id: "project-1",
      name: "Field Notes",
      description:
        "A lightweight research repository that helps teams turn scattered observations into shared product insight.",
      link: "fieldnotes.design",
      technologies: ["Research", "UX strategy", "Prototyping"],
    },
  ],
} satisfies ResumePayload;

async function getOrCreateResume(userId: string) {
  const existing = await db
    .select()
    .from(userResumesTable)
    .where(eq(userResumesTable.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(userResumesTable)
    .values({ userId, data: starterResume })
    .returning();

  return inserted[0];
}

router.get("/resume", requireAuth, async (req, res) => {
  try {
    const row = await getOrCreateResume((req as any).userId as string);
    const payload = GetResumeResponse.parse({
      id: RESUME_ID,
      data: row.data,
      updatedAt: row.updatedAt,
    });
    res.json(payload);
  } catch (error) {
    req.log.error({ err: error }, "Unable to load resume");
    res.status(500).json({ error: "Unable to load resume" });
  }
});

router.put("/resume", requireAuth, async (req, res) => {
  const parsed = SaveResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Resume data is invalid", details: parsed.error.flatten() });
    return;
  }

  try {
    const [saved] = await db
      .insert(userResumesTable)
      .values({ userId: (req as any).userId as string, data: parsed.data as ResumePayload })
      .onConflictDoUpdate({
        target: userResumesTable.userId,
        set: { data: parsed.data as ResumePayload, updatedAt: new Date() },
      })
      .returning();

    const payload = SaveResumeResponse.parse({
      id: RESUME_ID,
      data: saved.data,
      updatedAt: saved.updatedAt,
    });
    res.json(payload);
  } catch (error) {
    req.log.error({ err: error }, "Unable to save resume");
    res.status(500).json({ error: "Unable to save resume" });
  }
});

router.get("/resume/summary", requireAuth, async (req, res) => {
  try {
    const row = await getOrCreateResume((req as any).userId as string);
    const data = row.data as typeof starterResume;
    const sections = [data.basics, data.experience, data.education, data.skills, data.projects];
    const completedSections = sections.filter((section) =>
      Array.isArray(section) ? section.length > 0 : Object.values(section).some(Boolean),
    ).length;
    const payload = GetResumeSummaryResponse.parse({
      completion: Math.round((completedSections / sections.length) * 100),
      completedSections,
      totalSections: sections.length,
      lastSaved: row.updatedAt,
    });
    res.json(payload);
  } catch (error) {
    req.log.error({ err: error }, "Unable to load resume summary");
    res.status(500).json({ error: "Unable to load resume summary" });
  }
});

export default router;
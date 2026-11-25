import { z } from "zod";
export const ORG_TYPES = ["General / Main Contractor", "Outsourced Project Management", "Architect / Engineer (Perit)", "Specialist Subcontractor / Trade", "Developer / Property Owner", "Other"];
export const JOB_ROLES = ["Director / Business Owner", "Project / Contracts Manager", "Site Agent / Foreman", "Quantity Surveyor / Commercial", "Architect / Perit", "Other"];
export const TEAM_SIZES = ["1–2 projects (1–10 people)", "3–5 projects (11–30 people)", "6+ projects (30+ people)"];
export const PROBLEMS = ["Unsigned extras / variations not getting paid", "Photos, snags & diaries lost in WhatsApp", "Slow subcontractor claims & certification", "Site working from outdated drawings", "Tracking budget vs actual costs", "Replacing Procore / PlanGrid with something simpler"];
export const stepOne = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(60),
  last_name: z.string().trim().min(1, "Surname is required").max(60),
  company_name: z.string().trim().min(1, "Company name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "Digits, spaces and + only"),
  password: z.string().min(8, "Password needs at least 8 characters").max(72),
});

export type QaCase = { code: string; module: string; title: string; steps: string; route: string };
export const QA_CASES: QaCase[] = [
  { code: "FBP-DWG-01", module: "Drawings", title: "Add a drawing with an image", steps: "Drawings → Add drawing → fill in and upload a sheet image → it appears and opens in the viewer.", route: "/drawings" },
  { code: "FBP-DWG-02", module: "Drawings", title: "Pin opens inspector", steps: "Click any pin on a sheet → details panel opens.", route: "/drawings" },
  { code: "FBP-SAF-01", module: "Safety", title: "Log a safety hazard", steps: "Safety hazard mode → click plan → choose type, severity, description → Save.", route: "/drawings" },
  { code: "FBP-SAF-02", module: "Safety", title: "Resolve hazard needs a photo", steps: "Open hazard → Resolve button disabled until photo + note → resolve → pin fades.", route: "/drawings" },
  { code: "FBP-SAF-03", module: "Safety", title: "Delete a mistaken pin", steps: "Open a pin you created → Delete (logged in error) → confirm → gone. Not shown on resolved pins.", route: "/drawings" },
  { code: "FBP-RFI-01", module: "RFIs", title: "RFI with cost impact → variation", steps: "Open an RFI with cost impact → Convert to variation → appears as Potential in Commercials.", route: "/rfis" },
  { code: "FBP-RFI-02", module: "RFIs", title: "Delete own open RFI", steps: "Create an RFI → open it → Delete (logged in error).", route: "/rfis" },
  { code: "FBP-SNG-01", module: "Snags", title: "Snag fix photo & verify", steps: "Upload fixed photo → Verify & Close.", route: "/snags" },
  { code: "FBP-COM-01", module: "Commercials", title: "Potential → Submitted → Approved", steps: "Price & submit a Potential variation → Approve → final account rises.", route: "/commercials" },
  { code: "FBP-COM-02", module: "Commercials", title: "Signed daywork → variation", steps: "Sign a daywork sheet → Convert to variation → value carried across.", route: "/daywork" },
  { code: "FBP-COM-03", module: "Commercials", title: "Valuation includes approved variations", steps: "New application for payment uses approved variation total.", route: "/commercials" },
  { code: "FBP-TEC-01", module: "Submittals", title: "Submit and approve as noted", steps: "New submittal → Approved as Noted with comments.", route: "/submittals" },
  { code: "FBP-TEC-02", module: "Inspections", title: "Failed check raises a snag", steps: "Start Pre-Pour inspection → fail an item → new snag in Snagging.", route: "/inspections" },
  { code: "FBP-SUB-01", module: "Sub Portal", title: "Expired RAMS blocks claims", steps: "Pick the subcontractor with expired RAMS → red banner, Submit claim blocked → renew → unblocked.", route: "/sub-portal" },
  { code: "FBP-SUB-02", module: "Sub Portal", title: "Certify claim & send to Books", steps: "Certify a lower amount with notes → due amount less retention → Send to FieldBridge Books.", route: "/sub-portal" },
  { code: "FBP-SEC-01", module: "Security", title: "Others can't delete your records", steps: "Sign in as another user → no Delete button on records you created.", route: "/rfis" },
];

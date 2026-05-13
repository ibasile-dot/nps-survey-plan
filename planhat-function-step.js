const data = <<update>>;

// ---- Typeform helpers ----
const fields = data.form_response?.definition?.fields || [];
const answers = data.form_response?.answers || [];
const byFieldId = (id) => answers.find(a => a.field?.id === id) || null;
const getAnswerLabel = (ans) => {
  if (!ans) return "";
  if (ans.type === "email") return ans.email || "";
  if (ans.type === "text" || ans.type === "long_text") return (ans.text || "").trim();
  if (ans.type === "choice") return ans.choice?.label || "";
  if (ans.type === "choices") return (ans.choices?.labels || []).join(", ");
  if (ans.type === "boolean") return ans.boolean ? "Yes" : "No";
  if (ans.type === "url") return ans.url || "";
  if (ans.type === "number") return String(ans.number ?? "");
  return "";
};
const findByTitle = (re) => {
  const f = fields.find(x => re.test(x.title || ""));
  return getAnswerLabel(f && byFieldId(f.id)) || "";
};

const firstName = findByTitle(/^first\s*name$/i);
const lastName = findByTitle(/^last\s*name$/i);
const rawWebsite = findByTitle(/(website|url)/i);

// Company name comes from hidden Typeform field (RM-prefilled URL)
const clientName = (data.form_response?.hidden?.client_name || "").trim();

let message = "";
{
  const msgField = fields.find(f =>
    /(message|notes|next\s*steps|feedback|bugs?)/i.test(f.title || "")
  );
  if (msgField) message = getAnswerLabel(byFieldId(msgField.id)) || "";
  if (!message) {
    const longText = answers.find(a => a.type === "long_text");
    if (longText) message = getAnswerLabel(longText);
  }
}

const cleanWebsite = (rawWebsite || "").replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();

let resolvedCompanyId = null;

// Look up company by hidden client_name field
if (clientName) {
  const matches = await ph.models.companies.getAll({ name: clientName });
  if (matches.length > 0) {
    resolvedCompanyId = matches[0]._id;
  }
}

// Fallback: create company if no match found
if (!resolvedCompanyId) {
  const inferredName = clientName || "Unknown Company";
  const body = { name: inferredName };
  if (cleanWebsite) body.website = `https://${cleanWebsite}`;
  const created = await ph.models.companies.create(body);
  resolvedCompanyId = created._id;
}

const htmlSummary = [
  ["First Name", firstName],
  ["Last Name", lastName],
  ["Company", clientName],
  ["Website", rawWebsite || ""],
  ["Message", message]
].filter(([_, v]) => v && String(v).trim())
  .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
  .join("<br>\n");

if (!resolvedCompanyId) return "No companyId resolved — Form Submission requires a company.";

const conversationPayload = {
  subject: `Inbound from ${firstName || lastName ? `${firstName} ${lastName}`.trim() : clientName}`,
  type: "Form Submission",
  companyId: resolvedCompanyId,
  description: htmlSummary,
  custom: {
    "Lead Stage": "1 - New",
    "Form Submission": htmlSummary
  }
};

return await ph.models.conversations.create(conversationPayload);

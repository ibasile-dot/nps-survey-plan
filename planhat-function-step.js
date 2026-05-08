const data = <<update>>;
const companies = <<Get Companies>> || [];

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
const FREE_BASE_DOMAINS = new Set([
'gmail','googlemail','yahoo','ymail','outlook','hotmail','live','msn','icloud',
'me','mac','aol','protonmail','proton','pm','tutanota','tuta','yandex','mail',
'bk','list','inbox','gmx','zoho','seznam','wp','o2'
]);
function isFreeEmail(email) {
if (!email || !email.includes('@')) { return false; }
const domain = email.split('@')[1];
const baseDomain = domain.split('.')[0].toLowerCase();
return FREE_BASE_DOMAINS.has(baseDomain);
}

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
let email = (answers.find(a => a.type === "email")?.email || "").trim();
if (!email) {
const emailishField = fields.find(f => (f.title || "").toLowerCase().includes("email"));
if (emailishField) {
const a = byFieldId(emailishField.id);
const raw = getAnswerLabel(a);
const m = raw.match(emailRegex);
if (m) email = m[0].trim();
}
}
if (!email) {
for (const a of answers) {
const raw = getAnswerLabel(a);
const m = raw.match(emailRegex);
if (m) { email = m[0].trim(); break; }
}
}
if (!email) throw new Error("Email is required to match/create contact.");

const firstName = findByTitle(/^first\s*name$/i);
const lastName = findByTitle(/^last\s*name$/i);
const companyName = findByTitle(/^(company\s*name|company)$/i);
const rawWebsite = findByTitle(/(website|url)/i);

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
const emailDomain = email.includes("@") ? email.split("@")[1].toLowerCase() : "";
let user = (await ph.models.endUsers.getAll({ email }))[0];
let resolvedCompanyId = user?.companyId || null;

if (!resolvedCompanyId) {
let company = null;
if (companyName) {
const norm = companyName.trim().toLowerCase();
company = companies.find(c => (c.name || "").trim().toLowerCase() === norm) || null;
}
if (!company && cleanWebsite) {
company = companies.find(c => {
const w = (c.website || "").replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
const doms = (c.domains || []).map(d => (d || "").toLowerCase());
return w === cleanWebsite || doms.includes(cleanWebsite);
}) || null;
}
if (!company && emailDomain) {
company = companies.find(c => (c.domains || []).some(d => (d || "").toLowerCase() === emailDomain)) || null;
}
if (!company) {
const inferredName = companyName || (emailDomain && !isFreeEmail(email) ? emailDomain.split(".")[0] : "Unknown Company");
const body = { name: inferredName };
if (cleanWebsite) body.website = `https://${cleanWebsite}`;
if (emailDomain && !isFreeEmail(email)) body.domains = [emailDomain];
const created = await ph.models.companies.create(body);
resolvedCompanyId = created._id;
} else {
resolvedCompanyId = company._id;
}
}

if (!user) {
user = await ph.models.endUsers.create({
firstName,
lastName,
email,
companyId: resolvedCompanyId,
custom: { "Lead Stage": "1 - New" }
});
} else if (!user.companyId && resolvedCompanyId) {
await ph.models.endUsers.update(user._id, { companyId: resolvedCompanyId });
}

const htmlSummary = [
["First Name", firstName],
["Last Name", lastName],
["Email", email],
["Website", rawWebsite || ""],
["Message", message]
].filter(([_, v]) => v && String(v).trim())
.map(([k, v]) => `<strong>${k}:</strong> ${v}`)
.join("<br>\n");

if (!resolvedCompanyId) return "No companyId resolved — Form Submission requires a company.";

const conversationPayload = {
subject: `Inbound from ${firstName || lastName ? `${firstName} ${lastName}`.trim() : email}`,
type: "Form Submission",
companyId: resolvedCompanyId,
endusers: [user],
description: htmlSummary,
custom: {
"Lead Stage": "1 - New",
"Form Submission": htmlSummary
}
};

return await ph.models.conversations.create(conversationPayload);

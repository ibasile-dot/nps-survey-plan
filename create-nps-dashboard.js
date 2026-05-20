/**
 * NPS Survey Dashboard — Google Apps Script
 *
 * HOW TO USE:
 * 1. Go to https://script.google.com
 * 2. Click "New project"
 * 3. Delete the default code and paste this entire script
 * 4. Click Run → select "createNPSDashboard"
 * 5. Authorize when prompted (Review permissions → Allow)
 * 6. Done — a new Google Sheet will be created in your Drive
 * 7. Check the logs (View → Execution log) for the link to your new sheet
 *
 * To move it to your NPS folder: open the sheet → File → Move → select NPS folder
 */

function createNPSDashboard() {
  var ss = SpreadsheetApp.create("NPS Survey Data — ExpoPlatform");
  Logger.log("Sheet created: " + ss.getUrl());

  // Colors
  var headerBg = "#0066cc";
  var headerFont = "#ffffff";
  var lightBlue = "#e8f0fe";
  var lightGreen = "#e6f4ea";
  var lightYellow = "#fff9c4";

  // ===== S1 SETUP DATA =====
  var s1 = ss.getSheetByName("Sheet1") || ss.insertSheet("S1 Setup Data");
  s1.setName("S1 Setup Data");
  var s1Headers = [
    "Timestamp", "Company Name", "Event Name", "Respondent Name", "Role",
    "Q1 Ease of Getting Started (1-10)", "Q2 Self-Service Level (1-10)",
    "Q3 Hardest Admin Panel Area", "Q4 Satisfaction So Far (1-10)",
    "Q5 What Would Make Setup Easier"
  ];
  s1.getRange(1, 1, 1, s1Headers.length).setValues([s1Headers]);
  formatHeaders(s1, s1Headers.length, headerBg, headerFont);
  s1.setFrozenRows(1);
  setColumnWidths(s1, [140, 150, 150, 150, 130, 100, 130, 180, 100, 250]);

  // ===== S2 POST-EVENT DATA =====
  var s2 = ss.insertSheet("S2 Post-Event Data");
  var s2Headers = [
    "Timestamp", "Company Name", "Event Name", "Respondent Name", "Role",
    "Q1 Overall Experience (1-10)", "Q2 Met Expectations",
    "Q3 NPS Score (0-10)", "Q4 Product Suggestion",
    "Q5 Service Suggestion"
  ];
  s2.getRange(1, 1, 1, s2Headers.length).setValues([s2Headers]);
  formatHeaders(s2, s2Headers.length, headerBg, headerFont);
  s2.setFrozenRows(1);
  setColumnWidths(s2, [140, 150, 150, 150, 130, 100, 120, 100, 250, 250]);

  // ===== S3 ANNUAL REVIEW DATA =====
  var s3 = ss.insertSheet("S3 Annual Review Data");
  var s3Headers = [
    "Timestamp", "Company Name", "Event Name", "Respondent Name", "Role",
    "Q1 Platform Trajectory", "Q2 Investment Priority Area",
    "Q3 Vision Delivery (1-10)", "Q4 Paying for Elsewhere",
    "Q5 Renewal Lever"
  ];
  s3.getRange(1, 1, 1, s3Headers.length).setValues([s3Headers]);
  formatHeaders(s3, s3Headers.length, headerBg, headerFont);
  s3.setFrozenRows(1);
  setColumnWidths(s3, [140, 150, 150, 150, 130, 120, 180, 100, 250, 250]);

  // ===== DASHBOARD =====
  var dash = ss.insertSheet("Dashboard");

  // Title
  dash.getRange("A1").setValue("NPS Survey Dashboard").setFontSize(18).setFontWeight("bold").setFontColor(headerBg);
  dash.getRange("A2").setValue("Auto-calculated from survey responses. Updated on each new submission.").setFontColor("#666666").setFontSize(10);

  // NPS Section
  dash.getRange("A4").setValue("NPS & SATISFACTION").setFontSize(12).setFontWeight("bold").setFontColor(headerBg);

  var npsMetrics = [
    ["Metric", "Value", "Source"],
    ["Overall NPS", '=IFERROR(((COUNTIF(\'S2 Post-Event Data\'!H2:H,">=9")-COUNTIF(\'S2 Post-Event Data\'!H2:H,"<=6"))/COUNTA(\'S2 Post-Event Data\'!H2:H))*100,"No data yet")', "S2 Q3 (0-10)"],
    ["Promoters (9-10)", '=IFERROR(COUNTIF(\'S2 Post-Event Data\'!H2:H,">=9"),0)', ""],
    ["Passives (7-8)", '=IFERROR(COUNTIFS(\'S2 Post-Event Data\'!H2:H,">=7",\'S2 Post-Event Data\'!H2:H,"<=8"),0)', ""],
    ["Detractors (0-6)", '=IFERROR(COUNTIF(\'S2 Post-Event Data\'!H2:H,"<=6"),0)', ""],
    ["Avg Post-Event CSAT", '=IFERROR(ROUND(AVERAGE(\'S2 Post-Event Data\'!F2:F),1),"No data yet")', "S2 Q1 (1-10)"],
    ["Expectations Met %", '=IFERROR(ROUND(COUNTIF(\'S2 Post-Event Data\'!G2:G,"Yes")/COUNTA(\'S2 Post-Event Data\'!G2:G)*100,1)&"%","No data yet")', "S2 Q2"],
  ];
  dash.getRange(5, 1, npsMetrics.length, 3).setValues(npsMetrics);
  formatHeaders(dash, 3, headerBg, headerFont, 5);
  dash.getRange(6, 1, npsMetrics.length - 1, 1).setFontWeight("bold");
  dash.getRange(6, 2, npsMetrics.length - 1, 1).setFontSize(14).setFontWeight("bold").setFontColor(headerBg).setHorizontalAlignment("center");

  // Other scores
  dash.getRange("A14").setValue("OTHER SURVEY SCORES").setFontSize(12).setFontWeight("bold").setFontColor(headerBg);

  var otherMetrics = [
    ["Metric", "Value", "Source"],
    ["Avg Onboarding Ease", '=IFERROR(ROUND(AVERAGE(\'S1 Setup Data\'!F2:F),1),"No data yet")', "S1 Q1 (1-10)"],
    ["Avg Self-Service Level", '=IFERROR(ROUND(AVERAGE(\'S1 Setup Data\'!G2:G),1),"No data yet")', "S1 Q2 (1-10)"],
    ["Avg Setup Satisfaction", '=IFERROR(ROUND(AVERAGE(\'S1 Setup Data\'!I2:I),1),"No data yet")', "S1 Q4 (1-10)"],
    ["Avg Platform Vision Delivery", '=IFERROR(ROUND(AVERAGE(\'S3 Annual Review Data\'!H2:H),1),"No data yet")', "S3 Q3 (1-10)"],
    ["Platform Getting Better %", '=IFERROR(ROUND(COUNTIF(\'S3 Annual Review Data\'!F2:F,"Better")/COUNTA(\'S3 Annual Review Data\'!F2:F)*100,1)&"%","No data yet")', "S3 Q1"],
  ];
  dash.getRange(15, 1, otherMetrics.length, 3).setValues(otherMetrics);
  formatHeaders(dash, 3, headerBg, headerFont, 15);
  dash.getRange(16, 1, otherMetrics.length - 1, 1).setFontWeight("bold");
  dash.getRange(16, 2, otherMetrics.length - 1, 1).setFontSize(14).setFontWeight("bold").setFontColor(headerBg).setHorizontalAlignment("center");

  // Response counts
  dash.getRange("A23").setValue("RESPONSE COUNTS").setFontSize(12).setFontWeight("bold").setFontColor(headerBg);

  var countMetrics = [
    ["Survey", "Responses", ""],
    ["S1 Setup", '=MAX(COUNTA(\'S1 Setup Data\'!A:A)-1,0)', ""],
    ["S2 Post-Event", '=MAX(COUNTA(\'S2 Post-Event Data\'!A:A)-1,0)', ""],
    ["S3 Annual Review", '=MAX(COUNTA(\'S3 Annual Review Data\'!A:A)-1,0)', ""],
    ["Total", '=SUM(B25:B27)', ""],
  ];
  dash.getRange(24, 1, countMetrics.length, 3).setValues(countMetrics);
  formatHeaders(dash, 3, headerBg, headerFont, 24);
  dash.getRange(25, 1, countMetrics.length - 1, 1).setFontWeight("bold");
  dash.getRange(28, 1, 1, 2).setFontWeight("bold").setBackground(lightYellow);

  dash.setColumnWidth(1, 220);
  dash.setColumnWidth(2, 150);
  dash.setColumnWidth(3, 150);

  // ===== RM LINKS =====
  var links = ss.insertSheet("RM Links");
  var linkHeaders = ["Client", "Event", "RM", "S1 Setup Link", "S2 Post-Event Link", "S3 Annual Review Link"];
  links.getRange(1, 1, 1, linkHeaders.length).setValues([linkHeaders]);
  formatHeaders(links, linkHeaders.length, headerBg, headerFont);
  links.setFrozenRows(1);

  var clients = [
    ["Informa", "RetailX 2026", "Barry"],
    ["Hive", "FinTech Meetup 2026", "Oriana"],
    ["BinExposium", "BassWorld 2026", "Oriana"],
    ["FESPA", "FESPA Global 2026", "Barry"],
    ["North Star", "North Star 2026", "Barry"],
    ["ADS", "ADS 2026", "Barry"],
    ["Beauty Istanbul", "Beauty Istanbul 2026", "Oriana"],
  ];

  var formIds = {S1: "ntQj2K3c", S2: "UuBpDwTY", S3: "qT4zvu8q"};

  for (var i = 0; i < clients.length; i++) {
    var row = i + 2;
    var client = clients[i][0];
    var event = clients[i][1];
    var rm = clients[i][2];
    links.getRange(row, 1).setValue(client);
    links.getRange(row, 2).setValue(event);
    links.getRange(row, 3).setValue(rm);

    var stages = ["S1", "S2", "S3"];
    for (var j = 0; j < stages.length; j++) {
      var url = "https://form.typeform.com/to/" + formIds[stages[j]] +
                "?client_name=" + encodeURIComponent(client) +
                "&event_name=" + encodeURIComponent(event) +
                "&rm_name=" + encodeURIComponent(rm) +
                "&event_stage=" + stages[j];
      links.getRange(row, 4 + j).setValue(url).setFontColor(headerBg);
    }
  }

  links.setColumnWidth(1, 130);
  links.setColumnWidth(2, 170);
  links.setColumnWidth(3, 80);
  for (var c = 4; c <= 6; c++) links.setColumnWidth(c, 350);

  // Alternate row colors on all data sheets
  [s1, s2, s3].forEach(function(sheet) {
    sheet.getRange(2, 1, 100, 10).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
  });

  // Move Dashboard to first position
  ss.setActiveSheet(dash);
  ss.moveActiveSheet(1);

  Logger.log("NPS Dashboard created successfully! 6 tabs: Dashboard, S1-S4 Data, RM Links.");
  Logger.log("Open your sheet: " + ss.getUrl());
}

// Helper: format header row
function formatHeaders(sheet, numCols, bg, fontColor, row) {
  row = row || 1;
  var range = sheet.getRange(row, 1, 1, numCols);
  range.setBackground(bg).setFontColor(fontColor).setFontWeight("bold").setFontSize(10);
  range.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
}

// Helper: set column widths
function setColumnWidths(sheet, widths) {
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }
}

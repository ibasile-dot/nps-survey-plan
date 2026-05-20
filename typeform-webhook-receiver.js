/**
 * Typeform → Google Sheets Webhook Receiver
 *
 * HOW TO SET UP:
 * 1. Open your NPS Survey Data sheet: https://docs.google.com/spreadsheets/d/1p6y7JLoov6UYXZbZMa0YAP6Gk555tNun738HGZ_FdGM/edit
 * 2. Go to Extensions → Apps Script
 * 3. Paste this entire script (replace any existing code)
 * 4. Click Deploy → New deployment
 * 5. Type: "Web app"
 * 6. Execute as: "Me" | Who has access: "Anyone"
 * 7. Click Deploy → Authorize → Allow
 * 8. Copy the Web app URL — give it to Claude to set up the webhooks
 */

// Map form IDs to sheet tab names
var FORM_MAP = {
  "ntQj2K3c": "S1 Setup Data",
  "UuBpDwTY": "S2 Post-Event Data",
  "qT4zvu8q": "S3 Annual Review Data"
};

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var formId = payload.form_response.form_id;
    var sheetName = FORM_MAP[formId];

    if (!sheetName) {
      return ContentService.createTextOutput("Unknown form: " + formId);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput("Sheet not found: " + sheetName);
    }

    // Extract answers
    var answers = payload.form_response.answers;
    var hidden = payload.form_response.hidden || {};
    var timestamp = new Date(payload.form_response.submitted_at);

    // Build row: Timestamp, Company, Event, Name, Role, Q1-Q5
    var row = [timestamp];

    // First 4 answers are intro fields (Company, Event, Name, Role)
    // Remaining are the survey questions
    for (var i = 0; i < answers.length; i++) {
      var answer = answers[i];
      var value = "";

      switch (answer.type) {
        case "text":
          value = answer.text || "";
          break;
        case "number":
          value = answer.number;
          break;
        case "choice":
          value = answer.choice ? answer.choice.label : "";
          break;
        case "choices":
          value = answer.choices ? answer.choices.labels.join(", ") : "";
          break;
        case "nps":
          value = answer.number;
          break;
        case "opinion_scale":
          value = answer.number;
          break;
        default:
          value = JSON.stringify(answer);
      }
      row.push(value);
    }

    // Append row to sheet
    sheet.appendRow(row);

    return ContentService.createTextOutput("OK: " + sheetName);

  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message);
  }
}

// Test function — verifies the sheet tabs exist
function testSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var formId in FORM_MAP) {
    var sheetName = FORM_MAP[formId];
    var sheet = ss.getSheetByName(sheetName);
    Logger.log(sheetName + ": " + (sheet ? "OK" : "MISSING"));
  }
  Logger.log("All checks done. Deploy as web app to receive Typeform webhooks.");
}

/**
 * Called when the web application is opened and gets today's date, today's attendance, 
 * and past attendance
 * @return an HtmlOutput with the information listed above
 */
function doGet(e) {
  //make sure all sheets are present
  if(!allSheetsPresent()) {
    throw new Error("Not all required sheets are present.");
  }

  var studentInfoSheet = sheet.getSheetByName(STUDENT_INFO);

  //sorts by period number
  studentInfoSheet.getRange("A2:E" + studentInfoSheet.getLastRow()).sort(4);
  
  deleteBlankRows();

  //check for blank cells
  var studentInfoData = getDataValues(STUDENT_INFO, "B:E");
  var valid = true;
  var errors = "";
  for(var i = 1; i < studentInfoData.length; i++) {
    for(var j = 0; j < studentInfoData[0].length; j++) {
      if(studentInfoData[i][j] == "") {
        errors += 'Empty cell at ' + String.fromCharCode('B'.charCodeAt(0) + j) + (i + 1) + ". Please fill in this cell.\n";
        valid = false;
      }
    }
  }
  if(!valid) {
    errorEmail("Attendance Emailer FAILED", errors);
    throw new Error("Error loading data. Please check your email.");
  }

  var template = HtmlService.createTemplateFromFile('Index.html');
  template.todayDate = formatDate(getDataValue(DATE, "A1"));
  template.todayAtt = getDataValues(STUDENT_INFO, "C:E");
  template.pastAtt = getData(PAST_ATTENDANCE, "A:E").getDisplayValues();

  return template.evaluate();
}

/**
 * Receives information about today's performance and updates the Past Attendance sheet.
 * @param todayPerformance the attendance performance for today
 * @param emailMessage the email message to use 
 * @return new today's date, the to-append new past attendance data, and the new today attendance data
 */
function shareAttendanceData(todayPerformance, emailMessage) {
  if(!allSheetsPresent()) {
    throw new Error("Not all required sheets are present.");
  }

  //put all studentInfo into an array
  var studentInfoSheet = sheet.getSheetByName(STUDENT_INFO);
  var newTodayAttData = [];
  var errors = "";
  var valid = true;
  for(var i = 2; i < studentInfoSheet.getMaxRows() + 1; i++) {
    var curStudentValues = studentInfoSheet.getRange("B" + i + ":E" + i).getValues();
    // check for blanks
    for(var j = 0; j < curStudentValues[0].length; j++) {
      if(curStudentValues[0][j] === "") {
        errors += 'Empty cell at ' + String.fromCharCode('B'.charCodeAt(0) + j) + i + ". Please fill in this cell.\n";
        valid = false;
      }
    }
    newTodayAttData.push([curStudentValues[0][1], curStudentValues[0][2], curStudentValues[0][3], curStudentValues[0][0]]);
  }
  
  if(!valid) {
    errorEmail("Attendance Emailer FAILED", errors);
    throw new Error("Error loading data. Please check your email.");
  }

  //set up new time
  var listedDate = getDataValue(DATE, "A1");
  //add to the past attendance table
  var pastAttSheet = sheet.getSheetByName(PAST_ATTENDANCE);
  var rowMoveTo = pastAttSheet.getMaxRows() + 1;
  var newPastAttData = [];
  for(var i = 0; i < newTodayAttData.length; i++) {
    var curRow = newTodayAttData[i];
    for(var j = 0; j < todayPerformance.length; j++) {
      var curAbsenteeRow = todayPerformance[j];
      if(curRow[0] == curAbsenteeRow[0] && curRow[1] == curAbsenteeRow[1] && curRow[2] == curAbsenteeRow[2]) {
        newPastAttData.push(moveData(rowMoveTo, listedDate, curRow, curAbsenteeRow));
        rowMoveTo++;
        
        if(curAbsenteeRow[3])
          sendEmail(listedDate, curRow, emailMessage);
      }
    }
  }

  var toReturn = [newPastAttData, newTodayAttData];
  return toReturn;
}

/**
 * Appends the given row to the Past Attendance sheet
 * @param rowMoveTo the row number to move to
 * @param listedDate the date listed
 * @param curRow the current row
 * @param curAbsenteeRow the current row in the absentees
 * @return the row appended into the Past Attendance sheet
 */
function moveData(rowMoveTo, listedDate, curRow, curAbsenteeRow) {
  const DATE_COL = 0;
  const NAME_COL = 1;
  const PERIOD_COL = 2;
  const CLASS_NAME_COL = 3;
  const ABSENT_COL = 4;
  const EMAIL_ADDRESS_COL = 5;
  
  var range = getData(PAST_ATTENDANCE, "A" + rowMoveTo + ":F" + rowMoveTo);
  var values = range.getValues();
  values[0][DATE_COL] = formatDate(listedDate);
  values[0][NAME_COL] = curRow[0];
  values[0][PERIOD_COL] = curRow[1];
  values[0][CLASS_NAME_COL] = curRow[2];
  values[0][ABSENT_COL] = curAbsenteeRow[3];
  values[0][EMAIL_ADDRESS_COL] = curRow[3];
  range.setValues(values);
  return [...values[0]];
}

/**
 * Sends an email to a student telling them they were absent
 * @param listedDate the date they were absent
 * @param curRow the row showing the data for that student
 * @param emailMessage the email message to use 
 */
function sendEmail(listedDate, curRow, message) {
  listedDate = formatDate(listedDate);
  var subject = listedDate + ": " + curRow[0] + "-Your Attendance in " + curRow[2] + " P" + curRow[1];
  if(message == null) {
    message = "You were marked absent today, " + listedDate + ", in " + curRow[2] + " P" + curRow[1] + ".";
  }

  var emailHtml = HtmlService.createHtmlOutput("<p>" + message + "<\p>");
  MailApp.sendEmail({to: curRow[3], subject: subject, htmlBody: emailHtml.getContent()});
}

/**
 * Sends the error email to the owner of the spreadsheet and everyone listed in the Teacher Email sheet.
 * @param subject the subject of the email
 * @param message the message of the email
 */
function errorEmail(subject, message) {
  var allTeachers = new Set();
  allTeachers.add(sheet.getOwner().getEmail());

  var teacherValues = sheet.getSheetByName(TEACHER_EMAIL).getDataRange().getValues();
  for(var i = 1; i < teacherValues.length; i++) {
    allTeachers.add(teacherValues[i][0]);
  }

  allTeachers.forEach(emailAcc => {
    MailApp.sendEmail(emailAcc, subject, message);
  });
}

function saveAttendanceData(todayDate, todayPerformance) {
  clearSavedAttendanceData();

  for(var row = 0; row < todayPerformance.length; row++) {
    getData(SAVED_DATA, "A1").setValue(todayDate);

    var range = getData(SAVED_DATA, "A" + (row + 3) + ":D" + (row + 3));
    var values = range.getValues();
    for(var col = 0; col < todayPerformance[row].length; col++) {
      values[0][col] = todayPerformance[row][col];
    }
    range.setValues(values);
  }
}

function clearSavedAttendanceData() {
  var lastRow = sheet.getSheetByName(SAVED_DATA).getLastRow();
  if(lastRow >= 3) {
    var range = getData(SAVED_DATA, "A" + 3 + ":D" + sheet.getSheetByName(SAVED_DATA).getLastRow());
    range.clear();
  }
}


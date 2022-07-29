/**
 * Called when the web application is opened and gets today's date, today's attendance, 
 * and past attendance
 * @return an HtmlOutput with the information listed above
 */
function doGet(e) {
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
    MailApp.sendEmail(sheet.getOwner().getEmail(), "Attendance Emailer FAILED", errors);
    throw new Error("Error loading webpage. Please check your email.");
  }

  var template = HtmlService.createTemplateFromFile('Index.html');
  template.todayDate = formatDate(getDataValue(DATE, "A1"))
  template.todayAtt = getDataValues(STUDENT_INFO, "C:E");
  template.pastAtt = getData(PAST_ATTENDANCE, "A:E").getDisplayValues();

  return template.evaluate();
}

/**
 * Receives information about today's performance and updates the Past Attendance sheet.
 * @param todayPerformance the attendance performance for today
 * @return new today's date, the to-append new past attendance data, and the new today attendance data
 */
function shareAttendanceData(todayPerformance) {
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
    MailApp.sendEmail(sheet.getOwner().getEmail(), "Attendance Emailer FAILED", errors);
    return null;
  }

  //set up new time
  var listedDate = getDataValue(DATE, "A1");
  var newDate = formatDate(addTime(formatDate(listedDate)));
  getData(DATE, "A1").setValue(newDate);
  //add to the past attendance table
  var pastAttSheet = sheet.getSheetByName(PAST_ATTENDANCE);
  var rowMoveTo = pastAttSheet.getMaxRows() + 1;
  // var absenteeIndex = 0;
  var newPastAttData = [];
  for(var i = 0; i < newTodayAttData.length; i++) {
    var curRow = newTodayAttData[i];
    for(var j = 0; j < todayPerformance.length; j++) {
      var curAbsenteeRow = todayPerformance[j];
      if(curRow[0] == curAbsenteeRow[0] && curRow[1] == curAbsenteeRow[1] && curRow[2] == curAbsenteeRow[2]) {
        newPastAttData.push(moveData(rowMoveTo, listedDate, curRow, curAbsenteeRow));
        rowMoveTo++;
        
        if(curAbsenteeRow[3])
          sendEmail(listedDate, curRow);
      }
    }
  }

  var toReturn = [newDate, newPastAttData, newTodayAttData];
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
 */
function sendEmail(listedDate, curRow) {
  listedDate = formatDate(listedDate);
  var subject = curRow[0] + ": Your Attendance in " + curRow[2] + " P" + curRow[1];
  var message = "You were marked absent today, " + listedDate + ", in " + curRow[2] + " P" + curRow[1] + ".";

  var emailHtml = HtmlService.createHtmlOutput("<p>" + message + "<\p>");
  MailApp.sendEmail({to: curRow[3], subject: subject, htmlBody: emailHtml.getContent()});
}


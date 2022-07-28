/**
 * Called when the web application is opened and gets today's date, today's attendance, 
 * and past attendance
 * @return an HtmlOutput with the information listed above
 */
function doGet(e) {
  deleteBlankRows();

  var studentInfoSheet = sheet.getSheetByName(STUDENT_INFO);
  //sorts by period number
  studentInfoSheet.getRange("A2:E" + studentInfoSheet.getLastRow()).sort(4);
  
  var template = HtmlService.createTemplateFromFile('Index.html');
  template.todayDate = formatDate(getDataValue(DATE, "A1"))
  template.todayAtt = getDataValues(STUDENT_INFO, "C:E");
  template.pastAtt = getData(PAST_ATTENDANCE, "A:E").getDisplayValues();

  return template.evaluate();
}

function websiteSendEmails(absentees) {
  var allErrors = new Set();
  
  const listedDate = getDataValue(ATTENDANCE, "A2");
  var storedRows = [];

  for(var i = 0; i < absentees.length; i++) {
    try {
      var emailAddress = getEmailAddress(absentees[i].name, absentees[i].period);
    } catch(error) {
      allErrors.add(error);
    }

    try {
      var className = getClassName(absentees[i].period);
    } catch(error) {
      allErrors.add(error);
    }

    var currentRow = {
      name: absentees[i].name,
      period: absentees[i].period,
      emailAddress: emailAddress,
      className: className
    };
    storedRows.push(currentRow);
  }
  
  if(allErrors.size != 0) {
    errorEmailTeacher(allErrors, true);
  }
  else {
    for(const row of storedRows) {
      sendEmail(row.name, row.period, row.emailAddress, row.className, listedDate);
    }
  }

  webMoveAttendance(absentees, listedDate);
}

function webMoveAttendance(absentees, listedDate) {
  var rowNum = 2;
  while(true) {
    var temp = getData(ATTENDANCE, "B" + rowNum);
    //no more rows
    if(temp.isBlank())
      break;
    
    moveAttendance(rowNum, temp.getValue(), getDataValue(ATTENDANCE, "C" + rowNum), isAbsent(absentees, rowNum), listedDate);
    rowNum++;
  }
}

function isAbsent(absentees, rowNum) {
  for(var i = 0; i < absentees.length; i++) {
    if(absentees[i].rowNum == rowNum)
      return true;
  }
  return false;
}

function newWebsiteSendEmails(absentees) {
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
        errors += 'Empty cell at ' + String.fromCharCode('B'.charCodeAt(0) + j) + i + "\n";
        valid = false;
      }
    }
    newTodayAttData.push([curStudentValues[0][1], curStudentValues[0][2], curStudentValues[0][3], curStudentValues[0][0]]);
  }
  
  if(!valid) {
    MailApp.sendEmail(sheet.getOwner().getEmail(), "Google Sheets Email Forwarding Failed", errors);
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
    for(var j = 0; j < absentees.length; j++) {
      var curAbsenteeRow = absentees[j];
      if(curRow[0] == curAbsenteeRow[0] && curRow[1] == curAbsenteeRow[1] && curRow[2] == curAbsenteeRow[2]) {
        newPastAttData.push(moveData(rowMoveTo, listedDate, curRow, curAbsenteeRow));
        rowMoveTo++;
        
        // MailApp.sendEmail("williamtang.basis@gmail.com", curAbsenteeRow[3], curAbsenteeRow[3]);
        if(curAbsenteeRow[3])
          sendEmail(listedDate, curRow);
      }
    }
  }

  var toReturn = [newDate, newPastAttData, newTodayAttData];
  //TODO: remove
  MailApp.sendEmail("williamtang.basis@gmail.com", "returning", "returning");
  return toReturn;
}

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

function sendEmail(listedDate, curRow) {
  listedDate = formatDate(listedDate);
  var subject = curRow[0] + ": Your Attendance in " + curRow[2] + " P" + curRow[1];
  var message = "You were marked absent today, " + listedDate + ", in " + curRow[2] + " P" + curRow[1] + ".";
  MailApp.sendEmail(curRow[3], subject, message);
}

/**
 * Gets the email address for a row of given name and period
 * @param name the row's name
 * @period period the row's period
 * @return the matching email
 * @throws error message if no matching email
 */
function getEmailAddress(name, period) {
  var rowNum = 2;
  while(true) {
    var temp = getData("Email", "A" + rowNum);
    //no more rows
    if(temp.isBlank())
      throw "No matching email for name \"" + name + "\" in period " + period + ".";
    
    var cur_name = temp.getValue();
    var cur_period = getDataValue(EMAIL, "B" + rowNum);
    if(name == cur_name && period == cur_period) {
      var emailCell = getData(EMAIL, "C" + rowNum);
      if(emailCell.isBlank())
        throw "No matching email for name \"" + name + "\" in period " + period + ".";
      return emailCell.getValue();
    }
    rowNum++;
  }
}

/**
 * Gets the class name for a row of given period
 * @period period the row's period
 * @return the matching class name
 * @throws error message if no matching class name
 */
function getClassName(period) {
  var rowNum = 2;
  while(true) {
    var temp = getData(CLASS, "A" + rowNum);
    //no more rows
    if(temp.isBlank())
      throw "No matching class name for period " + period + ".";

    var cur_period = temp.getValue();
    if(period == cur_period) {
      var classNameCell = getData(CLASS, "B" + rowNum);
      if(classNameCell.isBlank())
        throw "No matching class name for period " + period + ".";
      return classNameCell.getValue();
    }
    rowNum++;
  }
}

/**
 * Emails errors to the teacher.
 * @param allErrors all the errors stored as a Set
 * @param tEmailSheetPresent true if the TEACHER_EMAIL sheet exists
 */
function errorEmailTeacher(allErrors, tEmailSheetPresent) {
  var error = "";
  for(var currentError of allErrors) {
    error += currentError + "\n";
  }

  var message = "Errors:\n" + error + ". \nPlease consult the program " +
      "developer " + CREATOR_NAME + " at " + CREATOR_EMAIL + ".";
  
  if(!tEmailSheetPresent) {
    MailApp.sendEmail(sheet.getOwner().getEmail(), "Google Sheets Email Forwarding Failed", message);
    return;
  }

  var rowNum = 2;
  while(true) {
    var temp = getData(TEACHER_EMAIL, "B" + rowNum);
    //no more rows
    if(temp.isBlank())
      return;

    var emailAddress = temp.getValue();
    if(emailAddress != null)
      MailApp.sendEmail(emailAddress, "Google Sheets Email Forwarding Failed", message);
    rowNum++;
  }
}

/**
 * Deletes the attendance data for the current row in the ATTENDANCE sheet and appends it to
 * the PAST_ATTENDANCE sheet
 * @param row row in ATTENDANCE sheet
 * @param name name of current row
 * @param period period of current row
 * @param attendanceValue true if the current row is absent
 * @param listedDate the listed date in the ATTENDANCE sheet
 */
function moveAttendance(row, name, period, attendanceValue, listedDate) {
  var range = getData(PAST_ATTENDANCE, "A" + rowMoveTo + ":D" + rowMoveTo);
  rowMoveTo++;
  var values = range.getValues();
  values[0][0] = formatDate(listedDate);
  values[0][1] = name;
  values[0][2] = period;
  values[0][3] = attendanceValue;
  range.setValues(values);

  var newDate = addTime(listedDate);
  newDate = formatDate(newDate);
  getData(ATTENDANCE, "A" + row).setValue(newDate);
  getData(ATTENDANCE, "D" + row).setValue(false);
}

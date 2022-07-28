function doGet(e) {
  deleteBlankRows();

  var studentInfoSheet = sheet.getSheetByName(STUDENT_INFO);
  //sorts by period number
  studentInfoSheet.getRange("A2:E" + studentInfoSheet.getLastRow()).sort(4);
  
  var template = HtmlService.createTemplateFromFile('Index.html');
  template.todayDate = formatDate(getDataValue(DATE, "A1"))
  template.todayAtt = getDataValues(STUDENT_INFO, "C:E");
  template.pastAtt = getDataValues(PAST_ATTENDANCE, "C:F");

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
      // moveAttendance(row.rowNum, row.name, row.period, row.attendanceValue, listedDate);
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
        // moveData(rowMoveTo, listedDate, curRow, curAbsenteeRow);
        newPastAttData.push(moveData(rowMoveTo, listedDate, curRow, curAbsenteeRow));
        rowMoveTo++;
        
        // MailApp.sendEmail("williamtang.basis@gmail.com", curAbsenteeRow[3], curAbsenteeRow[3]);
        if(curAbsenteeRow[3])
          sendEmail(listedDate, curRow);
      }
    }
  }

  var toReturn = [newDate, newPastAttData, newTodayAttData];
  MailApp.sendEmail("williamtang.basis@gmail.com", "returning", "returning");
  // return 5;
  return toReturn;
}

function moveData(rowMoveTo, listedDate, curRow, curAbsenteeRow) {
  const DATE_COL = 0;
  const EMAIL_ADDRESS_COL = 1;
  const NAME_COL = 2;
  const PERIOD_COL = 3;
  const CLASS_NAME_COL = 4;
  const ABSENT_COL = 5;
  
  var range = getData(PAST_ATTENDANCE, "A" + rowMoveTo + ":F" + rowMoveTo);
  var values = range.getValues();
  values[0][DATE_COL] = formatDate(listedDate);
  values[0][EMAIL_ADDRESS_COL] = curRow[3];
  values[0][NAME_COL] = curRow[0];
  values[0][PERIOD_COL] = curRow[1];
  values[0][CLASS_NAME_COL] = curRow[2];
  values[0][ABSENT_COL] = curAbsenteeRow[3];
  range.setValues(values);
  return [...values[0]];
}

function sendEmail(listedDate, curRow) {
  listedDate = formatDate(listedDate);
  var subject = curRow[0] + ": Your Attendance in " + curRow[2] + " P" + curRow[1];
  var message = "You were marked absent today, " + listedDate + ", in " + curRow[2] + " P" + curRow[1] + ".";
  MailApp.sendEmail(curRow[3], subject, message);
}

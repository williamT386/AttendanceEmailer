var rowMoveTo = getRowMoveTo();

/**
 * Finds the row to start adding to in the PAST_ATTENDANCE sheet
 * @return returns the row to start adding to
 */
function getRowMoveTo() {
  if(sheet.getSheetByName(PAST_ATTENDANCE) == null)
    return null;

  var rowNum = 2;
  while(true) {
    var temp = getData(PAST_ATTENDANCE, "B" + rowNum);
    //no more rows
    if(temp.isBlank())
      return rowNum;
    rowNum++;
  }
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
 * Sends an email to a student with specific pre-decided format
 * @param name student's name
 * @param period student's period
 * @param emailAddress student's emailAddress
 * @param className name of the class for this period
 * @param date date of missing attendance
 */
function sendEmail(name, period, emailAddress, className, date) {
  date = formatDate(date);

  var subject = name + ": Your Attendance in " + className + " P" + period;
  var message = "You were marked absent today, " + date + ", in " + className + " P" + period + ".";
  MailApp.sendEmail(emailAddress, subject, message);
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
 * Checks if all required sheets are present. Check for errors. For all rows with a check, send an
 * email to that student.
 */
function checkAttendance() {
  try {
    allSheetsPresent();
  } catch(eArray) {
    errorEmailTeacher(eArray[0], eArray[1]);
    return;
  }
  
  var rowNum = 2;
  const listedDate = getDataValue(ATTENDANCE, "A" + rowNum);

  var storedRows = [];

  // var allErrors = "";
  var allErrors = new Set();
  while(true) {
    var temp = getData(ATTENDANCE, "B" + rowNum);
    //no more rows
    if(temp.isBlank())
      break;
    
    var attendanceValue = getDataValue(ATTENDANCE, "D" + rowNum);

    var name = temp.getValue();
    var period = getDataValue(ATTENDANCE, "C" + rowNum);

    try {
      var emailAddress = getEmailAddress(name, period);
    } catch(error) {
      allErrors.add(error);
    }
    try {
      var className = getClassName(period);
    } catch(error) {
      allErrors.add(error);
    }

    var currentRow = {
        'rowNum': rowNum,
        'attendanceValue': attendanceValue,
        'name': name,
        'period': period,
        'emailAddress': emailAddress,
        'className': className
    };
    storedRows.push(currentRow);

    rowNum++;
  }

  if(allErrors.size != 0) {
    errorEmailTeacher(allErrors, true);
  }
  else {
    for(const row of storedRows) {
      if(row.attendanceValue) 
        sendEmail(row.name, row.period, row.emailAddress, row.className, listedDate);
      moveAttendance(row.rowNum, row.name, row.period, row.attendanceValue, listedDate);
    }
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

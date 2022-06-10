function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index.html');
  deleteBlankRows();
  template.todayAtt = getDataValues("Attendance", "A:C");
  for(var i = 1; i < template.todayAtt.length; i++) {
    var formattedDate = formatDate(getDataValue("Attendance", "A" + (i + 1)));
    template.todayAtt[i][0] = formattedDate;
  }

  template.pastAtt = getDataValues("Past Attendance", "A:D");
  for(var i = 1; i < template.pastAtt.length; i++) {
    formattedDate = formatDate(getDataValue("Past Attendance", "A" + (i + 1)));
    template.pastAtt[i][0] = formattedDate;
  }
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

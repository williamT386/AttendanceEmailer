function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index.html');
  template.todayAtt = getDataValues("Email", "A:B");
  return template.evaluate();
}

function websiteSendEmails(absentees) {
  var allErrors = new Set();
  for(var i = 0; i < absentees.length; i++) {
    try {
      var emailAddress = getEmailAddress(absentees[i].name, absentees[i].period);
      MailApp.sendEmail(emailAddress, "test", "This is a test.");
    } catch(error) {
      allErrors.add(error);
    }
  }
}

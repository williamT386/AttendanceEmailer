const CREATOR_NAME = "William Tang";
const CREATOR_EMAIL = "williamtang.basis@gmail.com";

const ATTENDANCE = "Attendance";
const PAST_ATTENDANCE = "Past Attendance";
const EMAIL = "Email";
const CLASS = "Class";
const TEACHER_EMAIL = "Teacher Email";

const REQUIRED_SHEETS = [ATTENDANCE, PAST_ATTENDANCE, EMAIL, CLASS, TEACHER_EMAIL];

const MILLIS_PER_HOUR = 1000 * 60 * 60;
const NUM_HOURS_DAY = 24;

const SUNDAY = "Sunday";

const sheet = SpreadsheetApp.getActiveSpreadsheet();

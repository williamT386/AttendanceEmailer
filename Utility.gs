/**
 * Gets data from the spreadsheet
 * @param sheetName the name of the sheet
 * @param range the range to get
 * @returns the data in the spreadsheet
 */
function getData(sheetName, range) {
  return sheet.getSheetByName(sheetName).getRange(range);
}

/**
 * Gets data value from the spreadsheet
 * @param sheetName the name of the sheet
 * @param range the range to get
 * @returns the data value in the spreadsheet
 */
function getDataValue(sheetName, range) {
  return getData(sheetName, range).getValue();
}

/**
 * Gets data values from the spreadsheet
 * @param sheetName the name of the sheet
 * @param range the range to get
 * @returns the data values in the spreadsheet
 */
function getDataValues(sheetName, range) {
  return getData(sheetName, range).getValues();
}

/**
 * Checks if all the required sheets present in this spreadsheet.
 * @returns true if all required sheets are present
 * @throws [all the generated errors, whether the Teacher Email sheet is present]
 */
function allSheetsPresent() {
  var currentSheets = new Set(sheet.getSheets());
  var currentNames = new Set();
  for(var current of currentSheets)
    currentNames.add(current.getName());

  var tEmailSheetPresent = true;
  var allErrors = new Set();
  for(var required of REQUIRED_SHEETS) {
    if(!currentNames.has(required)) {
      allErrors.add("The sheet with the name " + required + " is required and is missing in the spreadsheet. Please put it back.");
      if(required == TEACHER_EMAIL)
        tEmailSheetPresent = false;
    }
    else if(required == TEACHER_EMAIL && (getData(TEACHER_EMAIL, "A2").isBlank() || getData(TEACHER_EMAIL, "B2").isBlank())) {
      allErrors.add("The sheet with the name " + TEACHER_EMAIL + " is missing a complete row. Please add a filled row of data.");
      tEmailSheetPresent = false;
      console.log("should be false");
    }
  }

  if(allErrors.size != 0)
    throw [allErrors, tEmailSheetPresent];

  return true;
}

/**
 * Normally, add 24 hours.
 * Add 23 hours on second Sunday of March for Daylights savings.
 * Add 25 hours on first Sunday of November for Daylights savings.
 * @param listedDate the date listed in the `Date` column of the ATTENDANCE sheet
 * @return 1 day after the listedDate
 */
function addTime(listedDate) {
  if(Utilities.formatDate(listedDate, "PST", "EEEE") != "Sunday")
    return new Date(listedDate.getTime() + MILLIS_PER_HOUR * NUM_HOURS_DAY);

  var month = parseInt(Utilities.formatDate(listedDate, "PST", "M"));
  var day = parseInt(Utilities.formatDate(listedDate, "PST", "d"));
  if(month == 11) {
    if(day <= 7)
      return new Date(listedDate.getTime() + MILLIS_PER_HOUR * (NUM_HOURS_DAY + 1));
  }
  else if(month == 3) {
    if(day >= 8 && day <= 14)
      return new Date(listedDate.getTime() + MILLIS_PER_HOUR * (NUM_HOURS_DAY - 1));
  }
}

/**
 * Returns a given date after being formatted into something like 1/1/2021
 * @param the given date
 * @return the newly formatted date
 */
function formatDate(date) {
  return Utilities.formatDate(date, "PST", 'M/d/YYYY');
}

/**
 * Deletes blank rows. For the ATTENDANCE and PAST_ATTENDANCE sheets, ignores the checkbox column.
 * Adapted from https://www.googlecloudcommunity.com/gc/Tips-Tricks/How-to-delete-blank-rows-in-Google-Sheets/m-p/383137.
 */
function deleteBlankRows() {
  // Get sheets
  var allSheets = sheet.getSheets();
  
  // Loop through allSheets. Delete blank rows in each sheet.
  for (var s = 0; s < allSheets.length; s++) {
    var currentSheet = allSheets[s];
    var searchDataRange = currentSheet.getRange(1,1,currentSheet.getMaxRows(),currentSheet.getMaxColumns());
    var searchValues = searchDataRange.getValues();
    var numRows = searchValues.length;
    var numCols = searchDataRange.getNumColumns();
    var rowsToDel = [];
    var delRow = -1;
    var prevDelRow = -2;
    var rowClear = false;
    
    if(currentSheet.getName() == ATTENDANCE || currentSheet.getName() == PAST_ATTENDANCE)
      var colMax = numCols - 1;
    else
      var colMax = numCols;

    // Loop through Rows in this sheet
    for (var r = 0; r < numRows; r++) {
      // Loop through columns in this row
      for (var c = 0; c < colMax; c++) {
        if (searchValues[r][c].toString().trim() === "") {
          rowClear = true;
        } else {
          rowClear = false;
          break;
        }
      }
      
      // If row is clear, add it to rowsToDel
      if (rowClear) {
        if (prevDelRow === r - 1) {
          rowsToDel[delRow][1] = parseInt(rowsToDel[delRow][1]) + 1;
        } else {
          rowsToDel.push([[r+1],[1]]);
          delRow += 1;
        }
        prevDelRow = r;
      }
    }
    
    // Delete blank rows in this sheet, if we have rows to delete.
    if (rowsToDel.length > 0) {
      // We need to make sure we don't delete all rows in the sheet. Sheets must have at least one row.
      if (numRows === rowsToDel[0][1]) {
        // numRows equals the number of rows to be deleted in the first set of rows to delete, so delete all but the first row.
        if (numRows > 1) {
          currentSheet.deleteRows(2,numRows - 1);
        }
      } else {
        // Go through each set of rows to delete them.
        var rowsToDeleteLen = rowsToDel.length;  
        for (var rowDel = rowsToDeleteLen - 1; rowDel >= 0; rowDel--) {
          currentSheet.deleteRows(rowsToDel[rowDel][0],rowsToDel[rowDel][1]);
        }
      }
    }
  }
}

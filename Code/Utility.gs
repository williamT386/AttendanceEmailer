/**
 * Checks if all required sheets are present
 * @return true if all required sheets are present, false otherwise
 */
function allSheetsPresent() {
  var mySheets = new Set();
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for(var i = 0; i < sheets.length; i++) {
    mySheets.add(sheets[i].getName());
  }
  
  for(var i = 0; i < ALL_SHEET_NAMES.length; i++) {
    if(!mySheets.has(ALL_SHEET_NAMES[i])) {
      return false;
    }
  }
  return true;
}

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
 * Adds 1 day to the given date and returns the result
 * @param listedDate the given date
 * @result the given date + 1 day
 */
function addTime(listedDate) {
  var testDate = new Date(listedDate);
  var secondDate = new Date(listedDate);
  secondDate.setDate(testDate.getDate()+1);
  return secondDate;
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
  // Loop through ALL_SHEETS. Delete blank rows in each sheet.
  for (var s = 0; s < ALL_SHEET_NAMES.length; s++) {
    var currentSheetName = ALL_SHEET_NAMES[s];
    var currentSheet = sheet.getSheetByName(currentSheetName);
    var searchDataRange = currentSheet.getRange(1,1,currentSheet.getMaxRows(),currentSheet.getMaxColumns());
    var searchValues = searchDataRange.getValues();
    var numRows = searchValues.length;
    var numCols = searchDataRange.getNumColumns();
    var rowsToDel = [];
    var delRow = -1;
    var prevDelRow = -2;
    var rowClear = false;
    
    // Loop through Rows in this sheet
    var r = currentSheetName = STUDENT_INFO ? currentSheet.getLastRow() : 0;
    while(r < numRows) {
      // Loop through columns in this row
      for (var c = 0; c < numCols; c++) {
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
      r++;
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


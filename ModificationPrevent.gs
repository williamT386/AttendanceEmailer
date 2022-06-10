/**
 * Checks if a header cell was edited. If so, put it back
 * @param e The modified cell
 * @param modifiedRange The range of e
 * @return whether a header cell was removed
 */
function replaceHeader(e, modifiedRange) {
  if(modifiedRange.getRow() == 1 && e.oldValue != null) {
    modifiedRange.setValue(e.oldValue);
    return true;
  }
  return false;
}

/**
 * Converts a given int value to a date
 * @param num the int value representing a date
 * @return the respective date for that int value
 */
function convertIntToDate(num) {
  var GS_earliest_date = new Date(1899, 11, 30), GS_date_in_ms = num*24*60*60*1000;
  return Utilities.formatDate(new Date(GS_date_in_ms + GS_earliest_date.getTime()), "PST", 'M/d/YYYY');
}

/**
 * Checks if a date cell was edited. If so, add it back
 * @param e The modified cell
 * @param modifiedRange The range of e
 * @param sheetName the name of the modified sheet
 * @return whether a header cell was removed
 */
function replaceDate(e, modifiedRange, sheetName) {
  if(modifiedRange.getColumn() == 1 && (sheetName == ATTENDANCE || sheetName == PAST_ATTENDANCE)) {
    modifiedRange.setValue(convertIntToDate(e.oldValue));
    return true;
  }
  return false;
}

/**
 * If a checkbox column was edited, put checkboxes back
 * @param modifiedRange The range of e
 * @param sheetName the name of the modified sheet
 * @return whether a header cell was removed
 */
function replaceCheckmarks(modifiedRange, sheetName) {
  if(modifiedRange.getColumn() == 4 && (sheetName == ATTENDANCE || sheetName == PAST_ATTENDANCE)) {
    modifiedRange.insertCheckboxes();
    return true;
  }
  return false;
}

/**
 * If a cell was edited, check if should put back any values
 * @param e The modified cell
 */
/*function onEdit(e) {
  var modifiedRange = e.range;
  
  //multiple cells modified
  // if(modifiedRange.getValues().getLength() > 1) {
    
  // }

  if(replaceHeader(e, modifiedRange))
    return;
  
  var sheetName = e.source.getActiveSheet().getName();
  if(replaceDate(e, modifiedRange, sheetName))
    return;

  replaceCheckmarks(modifiedRange, sheetName);
}*/


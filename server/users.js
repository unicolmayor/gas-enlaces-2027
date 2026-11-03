const USERS_COLUMNS = ['id', 'name', 'email', 'username', 'password_hash', 'is_active', 'is_lock', 'deleted_at', 'created_at', 'updated_at']

function ensureUsersSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('Users')
  if (!sheet) sheet = spreadsheet.insertSheet('Users')
  const range = sheet.getDataRange()
  const values = range.getValues()
  if (!values.length || values[0].every((value) => value === '')) {
    sheet.getRange(1, 1, 1, USERS_COLUMNS.length).setValues([USERS_COLUMNS])
  }
  return sheet
}

module.exports = { USERS_COLUMNS, ensureUsersSheet }

/**
 * Free email delivery for Due Today.
 *
 * This runs in a free Google Apps Script project and sends from the Gmail
 * account that installs it. It never calls a paid email provider and it stops
 * when Gmail's free daily quota is exhausted. See README.md for setup.
 */

const REMINDER_EVERY_MINUTES = 5;

function install() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.filter(trigger => trigger.getHandlerFunction() === 'sendHomeworkReminders')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('sendHomeworkReminders')
    .timeBased()
    .everyMinutes(REMINDER_EVERY_MINUTES)
    .create();
}

function sendHomeworkReminders() {
  if (MailApp.getRemainingDailyQuota() < 1) return;

  const properties = PropertiesService.getScriptProperties();
  const supabaseUrl = properties.getProperty('SUPABASE_URL');
  const serviceRoleKey = properties.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Script Properties before installing.');
  }

  const assignments = supabaseGet_(
    supabaseUrl,
    serviceRoleKey,
    'assignments?select=id,user_id,class_name,description,due_date,created_at,profiles!assignments_user_id_fkey(email,reminder_time,reminder_mode,timezone)&completed_at=is.null'
  );

  assignments.forEach(assignment => {
    if (MailApp.getRemainingDailyQuota() < 1) return;
    const profile = assignment.profiles;
    if (!profile || !profile.email || !isOnOrBeforeDueDate_(assignment.due_date, profile.timezone)) return;

    const now = localParts_(new Date(), profile.timezone);
    const today = now.date;
    const initialAlreadySent = reminderExists_(supabaseUrl, serviceRoleKey, assignment.id, null, 'initial');

    // The first email is sent on the scheduler's next run. For daily mode,
    // future emails are sent only during the member's selected local minute.
    if (!initialAlreadySent) {
      deliver_(supabaseUrl, serviceRoleKey, assignment, profile, today, 'initial');
      return;
    }
    if (profile.reminder_mode !== 'daily' || now.time !== String(profile.reminder_time).slice(0, 5)) return;
    if (reminderExists_(supabaseUrl, serviceRoleKey, assignment.id, today, 'reminder')) return;
    deliver_(supabaseUrl, serviceRoleKey, assignment, profile, today, 'reminder');
  });
}

function deliver_(url, key, assignment, profile, sentFor, kind) {
  const reminder = kind === 'reminder';
  const due = friendlyDate_(assignment.due_date, profile.timezone);
  const subject = (reminder ? '(REMINDER) ' : '') + 'HOMEWORK: ' + assignment.class_name;
  const body = 'You have homework from ' + assignment.class_name + ' due ' + due + '. ' + assignment.description;
  MailApp.sendEmail({ to: profile.email, subject: subject, body: body, htmlBody: '<p>' + escapeHtml_(body) + '</p>', name: 'Due Today' });
  supabasePost_(url, key, 'reminder_log', {
    assignment_id: assignment.id,
    sent_for: sentFor,
    kind: kind,
  });
}

function reminderExists_(url, key, assignmentId, sentFor, kind) {
  let endpoint = 'reminder_log?select=id&assignment_id=eq.' + encodeURIComponent(assignmentId) + '&kind=eq.' + kind + '&limit=1';
  if (sentFor) endpoint += '&sent_for=eq.' + sentFor;
  return supabaseGet_(url, key, endpoint).length > 0;
}

function isOnOrBeforeDueDate_(dueDate, timeZone) {
  return dueDate >= localParts_(new Date(), timeZone).date;
}

function localParts_(date, timeZone) {
  const pieces = Utilities.formatDate(date, timeZone || 'Etc/UTC', 'yyyy-MM-dd|HH:mm').split('|');
  return { date: pieces[0], time: pieces[1] };
}

function friendlyDate_(dateText, timeZone) {
  const today = localParts_(new Date(), timeZone).date;
  const tomorrow = Utilities.formatDate(new Date(Date.now() + 86400000), timeZone || 'Etc/UTC', 'yyyy-MM-dd');
  const display = Utilities.formatDate(new Date(dateText + 'T12:00:00'), timeZone || 'Etc/UTC', 'MMMM d');
  return dateText === tomorrow ? display + ' (tomorrow)' : dateText === today ? display + ' (today)' : display;
}

function supabaseGet_(url, key, endpoint) {
  const response = UrlFetchApp.fetch(url + '/rest/v1/' + endpoint, {
    headers: { apikey: key, Authorization: 'Bearer ' + key },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 300) throw new Error('Supabase GET failed: ' + response.getContentText());
  return JSON.parse(response.getContentText());
}

function supabasePost_(url, key, endpoint, payload) {
  const response = UrlFetchApp.fetch(url + '/rest/v1/' + endpoint, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 300) throw new Error('Supabase POST failed: ' + response.getContentText());
}

function escapeHtml_(text) {
  return String(text).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

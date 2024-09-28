// visual appearance:
// welcome to the events page 
// (/ list of events pulled from db, guaranteed sync with the calendar)
// events displayed in rows, thumbnail format: modificable picture under text (event name), hovering over it will make it expand, clicking it will lead to the event page 
// as implied each event has its own page, complete with notes, comments, and related images
// major concerns:
// concurrency issues: events also need to be displayed / modified in calendar view, which is its own page
// same story applies to images, since we have an image gallery w/ an event tagging system
//      
# Attendance Emailer
## Description
This project sends emails telling students that they were marked absent for a class. This project is kept in the PST timezone, so being in a different timezone may cause the dates in the software to change a little earlier or later than your local timezone.

## Setting up
- [Google Sheet to copy](https://docs.google.com/spreadsheets/d/1DeQIiDuARJ-xWsqOQHVprYn9PcHL9GPKT5t3831ABv8/copy)
- [Google Form for Reference](https://forms.gle/GYksikK1zg6VXFkN8)
- [How to set up the software](https://youtu.be/Us5RIBwkItQ)
- [How to "deploy" the software](https://youtu.be/7C9vWFP1pbc)
- [How to use the software](https://youtu.be/dlnur1X9j2Q)
The web application will become very slow if too many past attendance data is logged (check out the sheet called "Past Attendance"). Please regularly clear this sheet out by deleting earlier rows (but not the top-most row).

## Development Information
This program runs on Google's App Script, which uses Javascript and HTML. To run the software, the user deploys the web application. When the webpage is being loaded, data stored in the spreadsheet is cleaned and returned to the webpage for display. After the user hits the Submit button on the webpage, the data on the webpage is sent to the server side for emails to be sent and data appended to the spreadsheet. The server side returns the new information to display the client side, which is the web app.

## Contributing
All contributions are welcome. Before any actions are taken, however, please let me know what changes you wish to make by filling an Issue. When you make a contribution, please make a pull request, and I will look at your changes.
- Right now, there is a save button, but there is no load feature to automatically check the people who were absent according to the saved data. There is a way to do this by hashing everyone who was absent according to the saved data, and then checking each person in the table to see if they are in that hash (and was therefore absent). Unfortunately, I am unable to make hashing work by trying to hash the 3 parameters of {Name, Period, Class Name} without turning it into an object. Hashing with objects doesn't work, since their addresses are being compared instead of their contents. Any work on this is greatly appreciated.

## Thanks To
This project was developed by William Tang as a gift for his AP Physics 1 and AP Chemistry teacher to massively reduce time spent emailing students that they were marked absent. Anyone is free to use this software. 

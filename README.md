# vaccine-check

## Description

This is an application that checks for availability of vaccine by calling Cowin API and parsing the result.  The application offers various options for customizations by editing the `.env` values suitably

## How to use

* Clone the repo (or download the release)
* Install NodeJS on the system
* Run `npm install`
* Run `node vaccine.js`

## Customizable values in .env

### District

All the data is provided either by district or pincode.  District fetches data of all the centers in the district and may give better results.

To get `DISTRICT_ID` we first need to know `STATE_ID`.  There is a [Cowin API](https://apisetu.gov.in/public/marketplace/api/cowin) to get state ids.  Using this, call another API to get `DISTRICT_ID`s for your required State.

Specify the id against the appropriate `.env` field

### Day or Week data

There are two different APIs. One gives slot availability for specific day. The other for the week starting from specified day.  The latter may be good to give wider options.  You can choose one of them by specifying `DURATION` field.
### Other fields

* Vaccine date
* Min age - best to set it to 18.  I see results having `40` which is neither here nor there
* Dosage type - 1st of 2nd dose (enter 1 or 2) - relevant since there may be more 1st dose but few 2nd dose
* Vaccine type - obvious - for now, `COVISHIELD` or `COVAXIN`, hopefully we'll have `SPUTNIK`

### Mail related

If you want to send emails to yourself, then you need to configure a few more items.  The app uses [Nodemailer](https://nodemailer.com/about/)

A few fields are
* HOST - mail host
* PORT - mail port
* FROM - from email-id
* TO - to email-id

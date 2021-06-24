const https = require("https");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();
const apiUrl = process.env.API_URL;
const dayEndpoint = process.env.DAY_END_POINT;
const weekEndpoint = process.env.WEEK_END_POINT;
const duration = process.env.DURATION;
const districtId = process.env.DISTRICT_ID;
const vaccineDate = process.env.VACCINE_DATE;
const vaccineType = process.env.VACCINE_TYPE;
const minAgeLimit = process.env.MIN_AGE_LIMIT;
const dosageType = process.env.DOSAGE_TYPE;

const shouldSendMail = process.env.SENDMAIL === "true";

const checkByDay = () => {
  https
  .get(`${apiUrl}/${dayEndpoint}?district_id=${districtId}&date=${vaccineDate}`, (resp) => {
    let data = "";
    resp.on("data", (chunk) => {
      data += chunk;
    });
    resp.on("end", () => {
      parseDayData(data);
    });
  })
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });
}

const checkByWeek = () => {
  https
  .get(`${apiUrl}/${weekEndpoint}?district_id=${districtId}&date=${vaccineDate}`, (resp) => {
    let data = "";
    resp.on("data", (chunk) => {
      data += chunk;
    });
    resp.on("end", () => {
      parseWeekData(data);
    });
  })
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });
}

let output = "No | Name | Address | PINCODE | Avaialbility\n";
let htmlOutput = ` <html>
  <head><style>
  table, th, td {
    border: 1px solid black;
    border-collapse: collapse;
   }
   </style></head>
  <body><table><thead><tr>
  <th>No</th><th>Name</th><th>Address</th><th>Pin Code</th><th>Date</th><th>Dose 1</th><tH>Dose 2</th>
  </tr></thead><tbody>`;
let atleastOne = false;

const parseWeekData = (rawData) => {
  const data = JSON.parse(rawData);
  data.centers.forEach((item, index) => {
    const vaccineSlots = item.sessions.filter(
      (session) =>
      session.vaccine === vaccineType &&
      session.min_age_limit >= +minAgeLimit &&
        (2 === +dosageType
          ? session.available_capacity_dose2 > 0
          : session.available_capacity_dose1 > 0)
    );
    vaccineSlots.forEach((session) => {
      atleastOne = true;
      output += `${index + 1} ${item.name} | ${item.address} | \
      ${item.pincode} | ${session.date} `;
      htmlOutput += `<tr><td>${index + 1}</td><td>${item.name}</td>
      <td>${item.address}</td><td>${item.pincode}</td><td>${session.date}</td>`;
        output += `${session.available_capacity_dose1} | ${session.available_capacity_dose2}\n`;
        htmlOutput += `<td>${session.available_capacity_dose1}</td><td>${session.available_capacity_dose2}</td></tr>`;
    })
  })
  htmlOutput += `</tbody></table></body></html>`;

  if (atleastOne) {
    if (shouldSendMail) {
      sendMail(output, htmlOutput);
    } else {
      console.log(output);
    }
  } else {
    const presentTime = new Date().toString();
    console.log(
      `At ${presentTime} there is NO ${vaccineType} slot for ${minAgeLimit}+ for dose ${dosageType} for the week starting ${vaccineDate}`
    );
  }
}

// Filter the data based on required criteria
const parseDayData = (rawData) => {

  const data = JSON.parse(rawData);
  const vaccineSlots = data.sessions.filter(
    (item) =>
      item.vaccine === vaccineType &&
      item.min_age_limit >= +minAgeLimit &&
      (2 === +dosageType
        ? item.available_capacity_dose2 > 0
        : item.available_capacity_dose1 > 0)
  );
  let output = "No | Name | Address | PINCODE | Fee |  Dose 1 | Dose 2\n";
  let htmlOutput = ` <html><body><table><thead><tr>
    <th>No</th><th>Name</th><th>Address</th><th>Pin Code</th><th>Fees</th><th>Dose 1</th><td>Dose 2</th>
    </tr></thead><tbody>`;

  vaccineSlots.forEach((item, index) => {
    output += `${index + 1} ${item.name} | ${item.address} | \
      ${item.pincode} |  ${item.fee} | `;
    htmlOutput += `<tr><td>${index + 1}</td><td>${item.name}</td>
    <td>${item.address}</td><td>${item.pincode}<td><td>${item.fee}</td>`;
    output += `${item.available_capacity_dose1} | `;
    htmlOutput += `<td>${item.available_capacity_dose1}</td>`;
    output += `${item.available_capacity_dose2}\n`;
    htmlOutput += `<td>${item.available_capacity_dose2}</td></tr>`;
  });
  htmlOutput += `</tbody></table></body></html>`;

  if (vaccineSlots.length > 0) {
    if (shouldSendMail) {
      sendMail(output, htmlOutput);
    } else {
      console.log(output);
    }
  } else {
    const presentTime = new Date().toString();
    console.log(
      `At ${presentTime} there is NO ${vaccineType} slot for ${minAgeLimit}+ for dose ${dosageType} on ${vaccineDate}`
    );
  }
};

// Send email to specified users
const sendMail = async (textOutput, htmlOutput) => {
  const transporter = nodemailer.createTransport({
    pool: true,
    host: process.env.HOST,
    port: process.env.PORT,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.FROM,
    to: process.env.TO,
    subject: `Availability Info: ${vaccineType} ${minAgeLimit}+ for dose ${dosageType} for ${vaccineDate}`,
    text: textOutput,
    html: htmlOutput,
  };

  await transporter.sendMail(mailOptions);
  process.exit(0);
};


if (duration === 'week') {
  checkByWeek();
} else {
  checkByDay();
}

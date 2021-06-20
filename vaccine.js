const https = require("https");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();
const apiUrl = process.env.API_URL;
const districtId = process.env.DISTRICT_ID;
const vaccineDate = process.env.VACCINE_DATE;
const vaccineType = process.env.VACCINE_TYPE;
const minAgeLimit = process.env.MIN_AGE_LIMIT;
const dosageType = process.env.DOSAGE_TYPE;

const shouldSendMail = process.env.SENDMAIL === "true";

// Fetch the data from server
https
  .get(`${apiUrl}?district_id=${districtId}&date=${vaccineDate}`, (resp) => {
    let data = "";
    resp.on("data", (chunk) => {
      data += chunk;
    });
    resp.on("end", () => {
      parseData(data);
    });
  })
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });

// Filter the data based on required criteria
const parseData = (rawData) => {
  const data = JSON.parse(rawData);
  const vaccineSlots = data.sessions.filter(
    (item) =>
      item.vaccine === vaccineType &&
      item.min_age_limit >= +minAgeLimit &&
      (2 === +dosageType
        ? item.available_capacity_dose2 > 0
        : item.available_capacity_dose1 > 0)
  );
  let output = "No | Name | Address | PINCODE | Capacity (Dose 2\n";
  let htmlOutput = ` <html><body><table><thead><tr>
    <th>No</th><th>Name</th><th>Address</th><th>Pin Code</th><th>Available</th>
    </tr></thead><tbody>`;

  vaccineSlots.forEach((item, index) => {
    output += `${index + 1} ${item.name} | ${item.address} |
      ${item.pincode} | `;
    htmlOutput += `<tr><td>${index + 1}</td><td>${item.name}</td>
    <td>${item.address}</td><td>${item.pincode}<td>`;
    if (2 === +dosageType) {
      output += `${item.available_capacity_dose2}\n`;
      htmlOutput += `<td>${item.available_capacity_dose2}</td></tr>`;
    } else {
      output += `${item.available_capacity_dose1}\n`;
      htmlOutput += `<td>${item.available_capacity_dose1}</td></tr>`;
    }
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
      `At ${presentTime} there is NO ${vaccineType} slot for ${minAgeLimit}+ for dose ${dosageType}`
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

const https = require("https");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();
const apiUrl = process.env.API_URL
const districtId = process.env.DISTRICT_ID
const vaccineDate = process.env.VACCINE_DATE
const shouldSendMail = (process.env.SENDMAIL === 'true')

https
  .get(
    `${apiUrl}?district_id=${districtId}&date=${vaccineDate}`,
    (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        parseData(data);
      });
    }
  )
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });

const parseData = (rawData) => {
  const data = JSON.parse(rawData);
  const covishield45 = data.sessions.filter(
    (item) => item.vaccine === "COVISHIELD" && item.min_age_limit === 45 && item.available_capacity_dose2 > 0
  );
  let output = "No | Name | Address | PINCODE | Capacity (Dose 2\n"

  covishield45.forEach((item, index) => {
    output +=  `${index + 1} ${item.name} | ${item.address} | ${item.pincode} | ${
        item.available_capacity_dose2}\n`
  });
  if (covishield45.length > 0) {
    if (shouldSendMail) {
      sendMail(output)
    } else {
      console.log(output)
    }
  } else {
    const presentTime = new Date().toString()
    console.log("NO slots for 45+ dose 2 at " + presentTime)
  }
};

const sendMail = async (data) => {
  const transporter = nodemailer.createTransport({
    pool: true,
    host: process.env.HOST,
    port: process.env.HOST,
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: process.env.FROM,
    to: process.env.TO,
    subject: 'Covid Vaccine availability Info',
    text: data
  };

  await transporter.sendMail(mailOptions)
  process.exit(0)
}


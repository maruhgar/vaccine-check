const https = require("https");
const nodemailer = require("nodemailer");

https
  .get(
    "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=307&date=25-06-2021",
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
    sendMail(output)
  } else {
    const presentTime = new Date().toString()
    console.log("NO slots for 45+ dose 2 at " + presentTime)
  }
};

const sendMail = async (data) => {
  const transporter = nodemailer.createTransport({
    pool: true,
    host: "localhost",
    port: 25,
    tls: {
      rejectUnauthorized: false
    }
  });

  var mailOptions = {
    from: 'raghu@www.innoventestech.in',
    to: 'raghu@innoventes.co',
    subject: 'Covid Vaccine availability Info',
    text: data
  };

  const result = await transporter.sendMail(mailOptions) 
  process.exit(0)
}


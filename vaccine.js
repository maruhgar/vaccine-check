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
    (item) => item.vaccine === "COVISHIELD" && item.min_age_limit === 45
  );
  let output = "No | Name | Address | PINCODE | Capacity (Dose 2\n"

  // console.log("No | Name | Address | PINCODE | Capacity (Dose 2");
  covishield45.forEach((item, index) => {
    // console.log(
    //   `${index + 1} ${item.name} | ${item.address} | ${item.pincode} | ${
    //     item.available_capacity_dose2}`
    // )
    output +=  `${index + 1} ${item.name} | ${item.address} | ${item.pincode} | ${
        item.available_capacity_dose2}\n`
  });
  sendMail(output)
};

const sendMail = (data) => {
  const transporter = tranodemailer.createTransport({
    pool: true,
    host: "localhost",
    port: 25
  });

  var mailOptions = {
    from: 'raghu@www.innoventestech.in',
    to: 'raghu@innoventes.co',
    subject: 'Covid Vaccine availability Info',
    text: data
  };

  transporter.sendMail(mailOptions, function(err, data) {
    if (err) {
      console.log("Error " + err);
    } else {
      console.log(data);
    }
  });
}
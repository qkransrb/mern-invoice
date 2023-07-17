import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

import transporter from "../helpers/emailTransport.js";
import { systemLogs } from "./Logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendEmail = async (email, subject, payload, template) => {
  try {
    const sourceDirectory = fs.readFileSync(
      path.join(__dirname, template),
      "utf8"
    );
    const compiledTemplate = handlebars.compile(sourceDirectory);
    const emailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject,
      html: compiledTemplate(payload),
    };

    await transporter.sendEmail(emailOptions);
  } catch (error) {
    systemLogs.error(`Email not sent: ${error}`);
  }
};

export default sendEmail;

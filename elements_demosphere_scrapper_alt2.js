import { writeCsv } from "../PupeeterToolsMjs/readWriteFile.mjs";
import * as scrappo from "../PupeeterToolsMjs/scrapper_tools.mjs";
import * as inputer from "../PupeeterToolsMjs/inputer.mjs";

const selectors = {
  allLinkSel: "iframe",
  d2LinkSel: ".tmnm > a",
  d3linkSel: "*>a",
  d4linkSel: " td.tm-name > a",
  contactSel: ".row-contacts-list-2",
  d5LinkSel: "td > a",
};

let contactSel = {
  div: "#cb-cont-tbl-1>tbody>tr",
  title: ".cb-cont-role",
  name: ".cb-cont-name",
  phone: ".cb-cont-phones",
  email: ".cb-cont-email>a",
};

let contactSel2 = {
  div: ".row-contacts-list-2",
  title: ".ct-wider>h4",
  name: ".ct-name",
  phone: ".phone4",
  email: ".ct-email>a",
};

const teamBaseUrl = "http://elements.demosphere-secure.com";

const clubUrl = await inputer.input("Club Url Please : ");
const netStatus = ["load", "domcontentloaded", "networkidle0", "networkidle2"];

let fnameP = clubUrl.replace("http://", "");
let filename = fnameP.split(".", 1);

// team data gathering method

async function getTeamDetails(page, contactSel) {
  let teamPageContact = await page.$$(contactSel.div);
  let title, name, phone, email;
  let contact;
  for (let i = 0; i < teamPageContact.length; i++) {
    try {
      title = await teamPageContact[i].$eval(contactSel.title, (o) =>
        o.textContent.replaceAll("\n", "")
      );
    } catch (error) {
      title = " ";
    }
    try {
      name = await teamPageContact[i].$eval(contactSel.name, (o) =>
        o.textContent.replaceAll("\n", "")
      );
    } catch (error) {
      name = " ";
    }
    try {
      phone = await teamPageContact[i].$eval(contactSel.phone, (o) =>
        o.textContent.replaceAll("\n", "")
      );
    } catch (error) {
      phone = " ";
    }
    try {
      email = await teamPageContact[i].$eval(contactSel.email, (o) =>
        o.getAttribute("href")
      );
    } catch (error) {
      email = " ";
    }

    contact = { title: title, name: name, phone: phone, email: email };

    console.log(contact);
  }

  return contact;
}

(async function () {
  // first link fetching from the sheet

  let browser = await scrappo.Browser(false);
  console.log(`Fetching data from the input link: ${clubUrl}`);

  let fistLinkPage = await scrappo.puppetPage(
    browser,
    clubUrl,
    netStatus[2],
    1500
  );

  // all 2nd label link scrape

  let firstLinks = await scrappo.iframLinks(fistLinkPage, selectors.allLinkSel);
  console.log(firstLinks);

  for (let i = 0; i < firstLinks.length; i++) {
    let firstLink = firstLinks[i];

console.log("This is the 1link"+ firstLink);

    //  getting team links from 2nd label

    if (firstLink.includes("elements.demosphere")) {
      console.log("it is Main" + firstLink);
      let secondPage = await scrappo.puppetPage(
        browser,
        firstLink,
        netStatus[2],
        2000
      );

      let secondLinks = await scrappo.nextPage(secondPage, selectors.d5LinkSel);
      console.log("this is team of secondLink  ", secondLinks);
      // team data from the team links

      for (let ti = 0; ti < secondLinks.length; ti++) {
        const secondLink = teamBaseUrl + secondLinks[ti];
        console.log("this is team of secondLink  ", secondLink);
        
        

        let trdPage = await scrappo.puppetPage(
          browser,
          secondLink,
          netStatus[2],
          1000,
          false
        );
        let teamContact = await getTeamDetails(trdPage, contactSel);
        if (teamContact) {
          await writeCsv(filename[0]+i, teamContact, Object.keys(teamContact));
        }

        let trdLinks = await scrappo.nextPage(trdPage, selectors.d4linkSel);

        console.log( "this is the trdLinks :" + trdLinks);

        for (let cti = 0; cti < trdLinks.length; cti++) {
          const trdLink = teamBaseUrl + trdLinks[cti];

          let teamDPage = await scrappo.puppetPage(
            browser,
            trdLink,
            netStatus[2],
            1000,
            false
          );

          let teamContact = await getTeamDetails(teamDPage, contactSel2);
          if (teamContact) {
            await writeCsv(filename[0]+ti, teamContact, Object.keys(teamContact));
          }

           
        }

        browser = await scrappo.closeBrowser(browser, false);
      }
    }

    browser = await scrappo.closeBrowser(browser, false);
  }

  await browser.close();
})();

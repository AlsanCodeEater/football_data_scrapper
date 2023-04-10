import { writeCsv } from "../PupeeterToolsMjs/readWriteFile.mjs";
import * as scrappo from "../PupeeterToolsMjs/scrapper_tools.mjs";
import * as inputer from "../PupeeterToolsMjs/inputer.mjs";

const selectors = {
  allLinkSel: "iframe",
  d2LinkSel: ".tmnm > a",
  d3linkSel: "*>a",
  d4linkSel: ".stub>a",
  contactSel: ".row-contacts-list-2",
};

const teamBaseUrl = "http://elements.demosphere-secure.com";

const clubUrl = await inputer.input("Club Url Please : ");
const netStatus = ["load", "domcontentloaded", "networkidle0", "networkidle2"];

let fnameP = clubUrl.replace("http://", "");
let filename = fnameP.split(".", 1);

const personName = ".ct-name";
const personTitle = ".ct-wider>h4";
// team data gathering method

async function getTeamDetails(page, contactSel) {
  let teamPageContact = await page.$$(contactSel);
  let title, name, phone, email;
  let contact;
  for (let i = 0; i < teamPageContact.length; i++) {
    try {
      title = await teamPageContact[i].$eval(newLocal, (o) =>
        o.textContent.replaceAll("\n", "")
      );
    } catch (error) {
      title = " ";
    }
    try {
      name = await teamPageContact[i].$eval(personName, (o) =>
        o.textContent.replaceAll("\n", "")
      );
    } catch (error) {
      name = " ";
    }
    try {
      phone = await teamPageContact[i].$eval(".phone4", (o) =>
        o.textContent.replaceAll("\n", "")
      );
    } catch (error) {
      phone = " ";
    }
    try {
      email = await teamPageContact[i].$eval(".ct-email > a", (o) =>
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

  let clubListPage = await scrappo.puppetPage(
    browser,
    clubUrl,
    netStatus[2],
    1500
  );

  // all 2nd label link scrape

  let clubLinks = await scrappo.iframLinks(clubListPage, selectors.allLinkSel);
  console.log(clubLinks);
  for (let i = 0; i < clubLinks.length; i++) {
    let  link = clubLinks[i];

    //  getting team links from 2nd label

    if (link.includes("elements.demosphere")) {
      console.log("it is Main" + link);
      let goTeamPage = await scrappo.puppetPage(
        browser,
        link,
        netStatus[2],
        2000
      );
      let teamLinks = await scrappo.nextPage(goTeamPage, selectors.d3linkSel);

  

      // team data from the team links
      for (let ti = 0; ti < teamLinks.length; ti++) {
        const teamlink = teamBaseUrl + teamLinks[ti];

        console.log("this is team of main link", teamlink);

        let teamDPage = await scrappo.puppetPage(
          browser,
          teamlink,
          netStatus[2],
          1000,
          false
        );
        let teamContact = await getTeamDetails(teamDPage, selectors.contactSel);
        if ( teamContact) { await writeCsv(filename[0], teamContact, Object.keys(teamContact));
            
        }
        

        browser = await scrappo.closeBrowser(browser, false);
      }

    
    }

   
   
    browser = await scrappo.closeBrowser(browser, false);
  }

   await browser.close()
})();

import { writeCsv } from "../PupeeterToolsMjs/readWriteFile.mjs";
import * as scrappo from "../PupeeterToolsMjs/scrapper_tools.mjs";
import   input from "../PupeeterToolsMjs/inputer.mjs";

const selectors = {
  allLinkSel: "iframe",
  d2LinkSel: ".tmnm > a",
  d3linkSel: "* > a",
  d4linkSel: " td.tm-name > a",
  contactSel: ".row-contacts-list-2",
  d5LinkSel: "td > a",
  d6linkSel: " .tm-name>a",
  d7linkSel: ".stub>a",
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

const clubUrl = await  input("Club Url Please : ");
const netStatus = ["load", "domcontentloaded", "networkidle0", "networkidle2"];

let fnameP = clubUrl.replace("http://", "");
let filename = fnameP.split(".", 1);

// team data gathering method

async function getTeamDetails(page, contactSel) {
  let teamPageContact = await page.$$(contactSel.div);
  let title, name, phone, email;
  let contacts = [];
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

    let contact = { title: title, name: name, phone: phone, email: email };
    contacts.push(contact);
  }
 
  return contacts;
}

(async function () {
  // first link fetching from the sheet

  let browser = await scrappo.Browser(false);
  console.log(`Fetching data from the input link: ${clubUrl}`);

  let startingPage = await scrappo.puppetPage(
    browser,
    clubUrl,
    netStatus[2],
    500
  );

  // all 2nd label link scrape

  let firstAllLinks = await scrappo.iframLinks(
    startingPage,
    selectors.allLinkSel
  );
  console.log("This is firstAllLinks" + firstAllLinks + "\n ");

  for (let i = 0; i < firstAllLinks.length; i++) {
    let firstAllLink = firstAllLinks[i];

    //  getting team links from 2nd label

    if (firstAllLink.includes("teams")) {
      console.log("it is Main" + firstAllLink);
      let mainlinkPage = await scrappo.puppetPage(
        browser,
        firstAllLink.includes("http") ? firstAllLink : "http:" + firstAllLink,

        netStatus[2],
        2000
      );
      let mainAllLinks = await scrappo.nextPage(
        mainlinkPage,
        selectors.d2LinkSel
      );
      console.log("this is team of mainAllLinks  " + mainAllLinks + "\n ");
      // team data from the team links
      for (let ti = 0; ti < mainAllLinks.length; ti++) {
        const mainAllLink = teamBaseUrl + mainAllLinks[ti];

        console.log("this is team of mainAllLink ", mainAllLink);

        let teamDPage = await scrappo.puppetPage(
          browser,
          mainAllLink,
          netStatus[2],
          1000,
          false
        );
        let teamContacts = await getTeamDetails(teamDPage, contactSel2);
 
        console.log("this is Data of mainAllLink   ",      "\n ");
          console.log(teamContacts);

        if (teamContacts) {
          for (let tmi = 0; tmi < teamContacts.length; tmi++) {
            let teamContact = teamContacts[tmi];
            await writeCsv(filename[0], teamContact, Object.keys(teamContact));
          }
        }

        browser = await scrappo.closeBrowser(browser, false);
      }
    }

    // short to team
    else if (
      firstAllLink.includes("+Short/") ||
      firstAllLink.includes("ugol") || firstAllLink.includes('107683676')
    ) {
      console.log("it is short " + firstAllLink);

    
      let shortLinkPage = await scrappo.puppetPage(
        browser, 
        firstAllLink.includes('http')? firstAllLink=firstAllLink:firstAllLink='http:'+firstAllLink,
        netStatus[2],
        1000
      );
      // extract team links

      let shortAllLinks = await scrappo.nextPage(shortLinkPage, selectors.d3linkSel);

      console.log("this is team of shortAllLinks  " + shortAllLinks + "\n ");

      for (let j = 0; j < shortAllLinks.length; j++) {
        const shortAllLink = shortAllLinks[j];
        console.log(shortAllLink);

        let ShortDpage = await scrappo.puppetPage(
          browser,
          teamBaseUrl + shortAllLink,
          netStatus[2],
          1000
        );

        let shortDlinks = await scrappo.nextPage(
          ShortDpage,
          selectors.d4linkSel
        );

        console.log("this is team of shortAllLinks  " + shortAllLinks + "\n ");
        // data from the team  link

        for (let ti = 0; ti < shortDlinks.length; ti++) {
          const teamlink = shortDlinks[ti];
          console.log(teamBaseUrl + teamlink);
          let teamPage = await scrappo.puppetPage(
            browser,
            teamBaseUrl + teamlink,
            netStatus[2],
            500,
            false
          );

          let teamContacts = await getTeamDetails(teamPage, contactSel2);
          console.log("this is Data of shortAllLink   ",      "\n ");
          console.log(teamContacts);


          if (teamContacts) {
            for (let tmi = 0; tmi < teamContacts.length; tmi++) {
              let teamContact = teamContacts[tmi];
              await writeCsv(
                filename[0],
                teamContact,
                Object.keys(teamContact)
              );
            }
          }

          browser = await scrappo.closeBrowser(browser, false);
        }
        browser = await scrappo.closeBrowser(browser, false);
      }
    }
    browser = await scrappo.closeBrowser(browser, false);
  }

  await browser.close();
})();








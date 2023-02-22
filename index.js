import chalk from 'chalk';
//import sleep from 'sleep';
import { NtpTimeSync } from "ntp-time-sync";
import { getChromeBookmark } from "chrome-bookmark-reader";
//import puppeteer from "puppeteer-core";
import { executablePath } from 'puppeteer';
//import puppeteer from 'puppeteer-extra';


if (Intl.DateTimeFormat().resolvedOptions().timeZone != "Asia/Calcutta") {
    console.log("System timezone is not set to India: Asia/Calcutta UTC+5.30 Hours")
    process.exit(1);
}

//const NtpTimeSync = require("ntp-time-sync").NtpTimeSync;
const timeSync = NtpTimeSync.getInstance();

timeSync.getTime().then(function (result) {
  // console.log("current system time", new Date());
  // console.log("real time", result.now);
  const offsetInSeconds = Math.abs( Math.round( result.offset / 1000 ) );
  if ( offsetInSeconds > (2 * 60 ) ) {
    console.log("System time not set accurately, time is off by "+offsetInSeconds+" seconds,\nPlease re sync time with NTP server.")
    process.exit(1);
  }
  //console.log("offset in milliseconds", offsetInSeconds);
  //console.log("offset in milliseconds", result.offset);
})



const chromeBookmarkReader = getChromeBookmark;
// const path = '/path/to/Chrome/Bookmark' //TODO: Change path to default and pick from ini
//const path = '%LocalAppData%\\Google\\Chrome\\User Data\\Default\\Bookmarks'
const path = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks'
const option = {
    shouldIncludeFolders: true,
  }
//const result = getChromeBookmark(path, option)
const bookmarks = chromeBookmarkReader(path, option)
//console.log(bookmarks)


for(const topLevelBookmark of bookmarks) {
    //console.log(topLevelBookmark + "\n--------------------------------------------")
    if ( topLevelBookmark.name == "Bookmarks bar" ) {
        console.log("Reading Bookmarks bar from the bookmarks data.")
        var usernameLevelBookmarks = topLevelBookmark.children
        for(const usernameLevelBookmark of usernameLevelBookmarks) {
            console.log("Reading Bookmarks for the Username: "+chalk.cyan.bold(usernameLevelBookmark.name))
            await page.goto('https://signin.coxautoinc.com/logout?bridge_solution=HME');
            var dealerLevelBookmarks = usernameLevelBookmark.children
            for(const dealerLevelBookmark of dealerLevelBookmarks) {
                console.log("Reading Bookmarks for the Dealer: "+chalk.cyan.bold(dealerLevelBookmark.name)+" from the Username: "+chalk.cyan.bold(usernameLevelBookmark.name))
                var vehicleBookmarks = dealerLevelBookmark.children
                for(const vehicleBookmark of vehicleBookmarks) {
                    //console.log(vehicleBookmark);
                    console.log("\t"+vehicleBookmark.name+" : "+vehicleBookmark.url);
                    //(async () => {

                        //const browser = await puppeteer.launch({headless: false});
                        //const page = await browser.newPage();
                        
                        //await page.goto(vehicleBookmark.url);
                        sleep(30); 
                        //await browser.close();
                    //})();
                }
            }    
        }
    }
}
//await sleep(10000); 
process.exit(0);






function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
function sleep(n) {
    msleep(n*1000);
}
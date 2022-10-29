// For more information, see https://crawlee.dev/
import { CheerioCrawler, ProxyConfiguration } from "crawlee";
import { router } from "./routes.js";

const crawler = new CheerioCrawler({
  // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
  requestHandler: router,
});

await crawler.addRequests([
  {
    url: "https://www.macys.com/shop/search/Pageindex/1?keyword=mens%20shoes",
    label: "start",
  },
]);

await crawler.run();
